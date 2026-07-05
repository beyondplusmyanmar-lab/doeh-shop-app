import { Platform } from "react-native";
import { DoehConsumerClient } from "@beyondplusmm/doeh-consumer-sdk";
import { BRAND, SHOP } from "@/config/shop";
import { session } from "@/store/session";

// W3 — the consumer SDK client. The screens are unchanged (ADR-001 W3
// acceptance): only the src/api seam re-points to it, and only for the routes
// the edge publishes; everything else stays on the raw api() seam.
//
// Native goes straight to the edge (config edgeApiBase, else the SDK's
// per-environment default). Web stays same-origin through /api/svc — the proxy
// recognizes the SDK's /v1/mobile/… paths and forwards them to the edge
// (first-party posture only; see W5 for the shop-published web story).
const nativeBase = SHOP.edgeApiBase?.replace(/\/v1$/, "");

export const consumer = new DoehConsumerClient({
  // "pk_unconfigured" keeps construction valid when the config omits the key;
  // the plane then refuses fail-closed server-side, same as pre-W2.
  publishableKey: SHOP.publishableKey ?? "pk_unconfigured",
  getCustomerToken: () => session.get(),
  environment: SHOP.environment === "live" ? "production" : "sandbox",
  baseUrl: Platform.OS === "web" ? "/api/svc" : nativeBase,
  userAgent: `${BRAND.name.replace(/\s+/g, "")}/1.0`,
});
