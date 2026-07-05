# ADR-001 — Consumer Public Surface (open `/mobile/*` for external developers)

- **Status:** Proposed — design only. Gated on platform capability (Workstream 1 below).
  Reuses the merchant `AuthProvider`/publishable-key mechanics designed in the M8-ADR.
- **Scope:** how the **consumer** loyalty plane (`/mobile/*`) becomes a public,
  edge-fronted, key-authenticated, SDK-wrapped, documented developer surface —
  mirroring the boundary the merchant `/v1/*` plane already has.
- **Reference implementation:** this repo (`doeh-shop-app`) is the working
  first-party proof of a single-shop consumer app end-to-end against `/mobile/*`. It is
  what an external shop clones once this surface exists.

---

## 0. Product context (why this is THE clone-and-own product)

Corrected 2026-07: there is **no merchant clone-and-own app**. Merchant-side loyalty —
reward rules, members, transactions, QR check-in, tiers — is handled in **pos-bo** (the
back office; `pos-web/bo/pos-bo`, verified: `Web/Loyalty/RewardRulesController`,
`Module/LoyaltyController`, `Member/MemberController`, `QrCheckin`, the Loyalty domain).
A shop does **not** fork a merchant app; it uses pos-bo. The earlier
`doeh-loyalty-template` "clone-and-own **merchant** app you publish" framing had no
audience — that repo's lasting value is as an **SDK reference/example**, not a shippable
merchant kit.

**So the clone-and-own product is the CONSUMER app (`doeh-shop-app`)** — each shop
forks it, brands it, and publishes it for **its customers**. That reprioritizes this ADR:
**W1 + W2 are the critical path to the product**, not an optional "someday." Until they
land, `doeh-shop-app` can only ship **first-party** (DOEH deploys per shop); after
them, shop clients self-serve (`pk_` → clone → publish).

## 1. Context — two planes, one is public

| | Merchant plane | Consumer plane |
|---|---|---|
| Path | `/v1/*` | `/mobile/*` |
| Fronted by | **Go edge** (CONTRACT.md, attestation, rate-limit) | **Laravel Core directly** (edge has no `/mobile` routes) |
| Auth | `sk_test_` / (future `pk_live_`) key = one shop | customer OTP token + client-sent `X-Shop-Code` |
| Public? | **Yes** — SDK (`@beyondplusmm/doehpos-sdk`) + sandbox onboarding + `developers.doehpos.com` | **No** — no SDK, no docs, no key, no CORS story |

**The gap:** an external shop developer can build the **merchant** side (earn/redeem for
members) but **cannot build the full customer-facing loyalty app** (sign-in, balance,
coupons, promotions, bookings, QR), because the consumer plane is not a public surface.
End-shoppers are unaffected (they use a first-party app); external developers are the
ones blocked.

## 2. Decision

Elevate `/mobile/*` to a **public developer surface** with the same boundary guarantees
as `/v1/*`: edge-fronted, key-authenticated, SDK-wrapped, documented — so external shops
can clone-and-own their own **single-shop consumer app**.

## 3. Workstreams (dependency order)

### W1 — Edge-front `/mobile/*` **(the gate; everything depends on this)**
Add a **consumer surface** to the Go edge (a new domain module / route group), so
`/mobile/*` gets the edge's transport, contract enforcement, rate-limiting, and
attestation — instead of hitting Core directly.
- **Acceptance:** `sandbox-api.doehpos.com/api/v1/mobile/*` serves through the edge;
  CONTRACT.md gains the consumer routes; the G8 drift gate covers them.
- Until W1 exists, **no external consumer app can be built** — first-party proxy
  (as in this repo) is the only viable path.

### W2 — Consumer identity + **publishable key** (bind the app to its shop)
Split identity cleanly:
- **Shop identity** = a **publishable key** (`pk_…`) baked into the app build (safe to
  ship, constrained at the edge — reuse the M8 `AuthProvider` seam).
- **End-user identity** = the customer OTP token.
- **⚠ Credential non-leakage (the hard clone-and-own constraint).** The shop **owns the
  published app binary**, so it must **never** see the customer's DOEH credentials. The
  current in-app **email+password** login (`app/index.tsx` → `/mobile/auth/login`) is safe
  only **first-party** (DOEH deploys the app); in a **shop-published** app it lets a
  malicious shop **harvest the customer's platform password**. Therefore the public model
  must **not let the shop's app collect the password**:
  - Auth is **DOEH-hosted** — an OAuth/OIDC **public client + PKCE** flow. The customer
    logs in on **DOEH's domain** (browser/`expo-web-browser`), not on a shop screen. The
    `pk_` **is the OAuth `client_id`**; the app receives only a **shop-scoped access token**,
    never the password.
  - **PII minimization:** the token grants the app the customer's data **for that shop
    only** — not their platform-wide profile or other-shop memberships. The shop (and its
    app) never learn the customer beyond their relationship with that shop.
  - **First-party stays simple:** DOEH-deployed builds may keep the in-app password login
    (DOEH is trusted); the hosted flow is the gate for **clone-and-own** publishing.
- **What the key binding is (and isn't) for.** Data isolation is **already enforced**
  server-side (see *Verified behavior* below): the customer token scopes to that
  customer's own records, and a shop the customer hasn't joined is refused. So the key
  binding is **not** primarily a PII-leak fix. It is for: (a) enforcing the *single-shop
  business boundary* — today a published app's shop-lock is client-side only (the
  `X-Shop-Code` header + an **open self-join**), so a `pk_` must pin the app to exactly
  one shop at the edge; (b) per-shop **rate-limiting / attribution / billing**;
  (c) **abuse control** on a now-public, PII-bearing plane.
- **Acceptance:** a `pk_test_` app can only operate as its bound shop; the edge derives
  the shop from the key and ignores/validates a mismatched `X-Shop-Code`; self-join is
  gated appropriately for a published single-shop app.

**Verified behavior (local pos-shop, 2026-07):** with a customer joined only to
`MM-TEST-0002`, `GET /mobile/loyalty/balance` returns:
`MM-TEST-0002` → 200 (own balance); `MM-DEMO-0001` (not joined) → 400 *"Please join this
shop first"*; `MM-TEST-0001` (no loyalty plugin) → 403 *"requires the Loyalty &
Promotions plugin"*; `MM-FAKE-9999` → 422 *"Shop information required"*. `POST
/mobile/shops/{code}/join` is **open** (any customer can self-join any valid shop). So
cross-customer and un-joined-shop access are already blocked; the gap a public surface
must close is the **client-controlled shop selection + open join**, via the key binding.

### W3 — Consumer SDK
Publish a consumer SDK (e.g. `@beyondplusmm/doeh-consumer-sdk`, or a `mobile` module in
the existing SDK) wrapping: auth (OTP/login), loyalty (balance/redeem/transactions/
coupons), promotions, bookings, qr — every call keyed by the publishable key.
- **Acceptance:** the screens in this repo can be re-pointed from the raw `api()` seam
  to the SDK with no behavior change (the seam already isolates this).

### W4 — Docs (separate from `/docs/loyalty/`)
- New OpenAPI spec, e.g. `docs/openapi/mobile-loyalty.yaml` (**do not edit** the merchant
  `loyalty.yaml`).
- Portal section + a **consumer starter kit** — `doeh-shop-app` becomes the public
  reference kit (like the merchant Starter Kits).
- **Acceptance:** `developers.doehpos.com` documents the consumer plane distinctly from
  the merchant plane; examples CI-type-checked against the consumer SDK.

### W5 — Web / CORS story (sanctioned)
Standardize the same-origin proxy pattern this repo already implements
(`app/api/svc/[...path]+api.ts`), **or** enable edge CORS scoped to publishable-key
origins. Do **not** open CORS on Core.
- **Acceptance:** a documented, supported way to run a consumer app on web/PWA.

## 4. Non-goals
- Key-issuance cryptography / attestation internals (same non-goal as M8).
- Scheduling. This is a design gate, not a commitment.
- Any edit to the merchant `/v1/loyalty` spec or SDK.

## 5. Sequencing & risks
- **Gate:** W1 first — without an edge front there is no boundary to secure or document.
- **⚠ Top risk — credential harvesting by the shop.** In clone-and-own, the shop owns the
  binary; an in-app password login hands them the customer's platform password. **DOEH-
  hosted auth (W2) is a hard prerequisite for publishing** — the app must never collect
  the credential. This gates going public more than any other single item.
- **Corrected risk posture (verified):** the earlier assumption that `X-Shop-Code` was a
  cross-shop **data-leak** vector is **wrong** — the backend already gates on membership
  and scopes to the customer's token. The real exposures on a public plane are: (a) the
  **single-shop lock is only client-side** (client-set shop code + open self-join) — W2's
  key binding closes this; (b) **PII-bearing plane** ⇒ rate-limiting and abuse control
  become load-bearing once public; (c) **feature/plugin gating** (403 "Loyalty plugin
  required") means the surface's behavior varies per shop's entitlements — the docs/SDK
  must express that.
- Complements M8 (merchant publishable key); reuses the edge phase-gate pattern.

## 6. Until then
Ship `doeh-shop-app` **first-party** — DOEH deploys/publishes it per shop, and the
repo stays **private**. End-customers get the full app; shop clients can't yet self-serve
because the plane isn't public. This is not a "someday" ADR: since the consumer app is the
**only** clone-and-own product (merchant side = pos-bo, no kit), **W1 + W2 are the roadmap
to let shop clients publish their own** — the entry plan to execute, not merely evaluate.
