// W2 §2d — the consumer-plane PublishableKeyProvider (the M8 AuthProvider set,
// consumer flavor). Pure + dependency-free on purpose: the native client
// (src/api/client.ts) and the web same-origin proxy (app/api/svc) both import
// this, so the two surfaces make the SAME routing decision from the SAME config.
//
// The edge publishes ONLY the CONTRACT §15 consumer routes; everything else
// (auth, coupons, join, promotions, bookings, qr) stays Core-direct until later
// slices publish it. On the edge plane the shop is derived SERVER-side from the
// key at resolve — the client sends no shop claim there (a forged one is ignored
// anyway; that is W2's whole point). The pk is publishable: it identifies
// (shop, app, environment) and grants nothing without the customer bearer.

export type ShopConfig = {
  shopCode: string;
  environment: string;
  apiBase: string;
  edgeApiBase?: string;
  publishableKey?: string;
};

// CONTRACT §15 CONS-1 — the edge-published consumer surface. Accepts both the
// app's raw-seam form (/mobile/…) and the SDK's wire form (/v1/mobile/…), so
// the web proxy serves the SDK too; query strings allowed on reads.
const EDGE_SERVED = [
  /^\/mobile\/loyalty\/(settings|balance|transactions)($|\?)/,
  /^\/mobile\/loyalty\/redeem$/,
];

const stripV1 = (path: string) => path.replace(/^\/v1(?=\/)/, "");

export function publishableKeyProvider(shop: ShopConfig) {
  // Fail closed into the Core-direct posture: with no key or no edge base the
  // provider serves nothing and the app behaves exactly as before W2.
  const configured = Boolean(shop.publishableKey && shop.edgeApiBase);
  return {
    configured,
    serves: (path: string) => configured && EDGE_SERVED.some((r) => r.test(stripV1(path))),
    /** Full edge URL for a served path, in either form. */
    targetFor: (path: string) =>
      `${(shop.edgeApiBase ?? "").replace(/\/v1$/, "")}/v1${stripV1(path)}`,
    base: shop.edgeApiBase ?? "",
    headers: (): Record<string, string> => ({ "X-Publishable-Key": shop.publishableKey ?? "" }),
  };
}
