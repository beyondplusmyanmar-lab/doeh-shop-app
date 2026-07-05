#!/usr/bin/env node
// smoke:consumer — prove this clone's public consumer plane against the live edge.
//
// What it proves WITHOUT any credentials (always runs):
//   1. the edge is reachable and the committed publishable key resolves
//   2. the auth gate holds: pk alone grants nothing (missing bearer -> API_KEY_INVALID)
//   3. the typed ABI: a PRESENT-but-bad bearer is CUSTOMER_TOKEN_INVALID, not a generic 401
//
// With a real customer token (until hosted sign-in ships, obtain one via the
// first-party login flow) it also drives the authenticated reads:
//   DOEH_CUSTOMER_TOKEN=... pnpm smoke:consumer
//
// redeem SPENDS real points, so it is opt-in only:
//   DOEH_CUSTOMER_TOKEN=... SMOKE_REDEEM_POINTS=1 pnpm smoke:consumer
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  DoehConsumerClient,
  ApiKeyInvalidError,
  CustomerTokenInvalidError,
} from "@beyondplusmm/doeh-consumer-sdk";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cfg = JSON.parse(readFileSync(resolve(root, "shop.config.json"), "utf8"));

const ok = (m) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const bad = (m) => { console.log(`  \x1b[31m✗\x1b[0m ${m}`); process.exitCode = 1; };
const note = (m) => console.log(`  – ${m}`);

if (!cfg.publishableKey || !cfg.edgeApiBase) {
  console.error("shop.config.json needs edgeApiBase + publishableKey (the W2 edge plane) to smoke.");
  process.exit(1);
}
// SDK base URLs carry no /v1 (paths do); shop.config.json's edgeApiBase includes it.
const baseUrl = cfg.edgeApiBase.replace(/\/v1\/?$/, "");
const TOKEN = process.env.DOEH_CUSTOMER_TOKEN ?? null;

const client = (getToken) =>
  new DoehConsumerClient({
    publishableKey: cfg.publishableKey,
    getCustomerToken: getToken,
    baseUrl,
    userAgent: `${(cfg.brand?.name || "DoehShopApp").replace(/\s+/g, "")}-smoke/1.0`,
  });

console.log(`smoke:consumer -> ${baseUrl} (shop pinned server-side by ${cfg.publishableKey.slice(0, 11)}…)`);

// 1 · auth gate: the publishable key alone grants nothing.
try {
  await client(() => null).loyalty.settings();
  bad("no-token request was ACCEPTED — auth gate broken");
} catch (e) {
  if (e instanceof ApiKeyInvalidError) ok("no token -> API_KEY_INVALID (pk alone grants nothing)");
  else bad(`no token -> unexpected ${e.constructor.name}: ${e.message}`);
}

// 2 · typed ABI: present-but-bad bearer is distinguished from a missing one.
try {
  await client(() => "not-a-real-customer-token").loyalty.settings();
  bad("garbage token was ACCEPTED");
} catch (e) {
  if (e instanceof CustomerTokenInvalidError) ok("garbage token -> CUSTOMER_TOKEN_INVALID (typed)");
  else bad(`garbage token -> unexpected ${e.constructor.name}: ${e.message}`);
}

// 3 · authenticated surface (needs a real customer token).
if (!TOKEN) {
  note("DOEH_CUSTOMER_TOKEN not set: skipped authenticated reads (settings/balance/transactions).");
  note("Until hosted sign-in ships, obtain a token via the first-party login flow.");
} else {
  const c = client(() => TOKEN);
  try {
    await c.loyalty.settings();
    ok("settings");
    const balance = await c.loyalty.balance();
    ok(`balance: ${balance.points_balance} points (lifetime ${balance.lifetime_points})`);
    const { transactions } = await c.loyalty.transactions({ limit: 5 });
    ok(`transactions: ${transactions.length} recent entries`);
  } catch (e) {
    bad(`authenticated read failed: ${e.constructor.name}: ${e.message}`);
  }
  const pts = Number(process.env.SMOKE_REDEEM_POINTS || 0);
  if (pts > 0) {
    try {
      await c.loyalty.redeem({ points: pts });
      ok(`redeem ${pts} point(s)`);
    } catch (e) {
      bad(`redeem: ${e.constructor.name}: ${e.message}`);
    }
  } else {
    note("redeem skipped (set SMOKE_REDEEM_POINTS=<n> to spend real points)");
  }
}

console.log(process.exitCode ? "RESULT: FAIL" : "RESULT: PASS");
