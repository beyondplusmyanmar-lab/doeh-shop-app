import { Platform } from "react-native";
import { router } from "expo-router";
import { API_BASE, SHOP, SHOP_CODE } from "@/config/shop";
import { publishableKeyProvider } from "./plane";
import { authHeaders, tokenStore } from "@/auth";

// Native talks to Core directly (no CORS on native). Web goes through the
// same-origin proxy (app/api/svc) so the browser never makes a cross-origin
// call — no CORS, no backend change.
const BASE = Platform.OS === "web" ? "/api/svc" : API_BASE;

// W2 §2d: routes the edge publishes go through the public edge, keyed by the
// publishable key (shop derived server-side from the key — no client shop
// claim on that plane). Everything else stays Core-direct with X-Shop-Code.
const edge = publishableKeyProvider(SHOP);

// The one seam that talks to the consumer backend. Every request is pinned to
// ONE shop — via the pk on the edge plane, via X-Shop-Code Core-direct — and
// authed with the customer's token.
export async function api(method: string, path: string, body?: unknown) {
  // Auth headers come from the ONE abstraction (auth/authHeaders): a transparently-refreshed
  // token, and the seam where Phase B attaches a DPoP proof. Absent => anonymous request.
  const auth = await authHeaders();
  const authed = "Authorization" in auth;
  const viaEdge = edge.serves(path);
  // Web always stays same-origin; the proxy re-derives this same decision
  // server-side from the same config. Native picks the transport here.
  const base = Platform.OS === "web" ? BASE : viaEdge ? edge.base : API_BASE;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(viaEdge ? edge.headers() : { "X-Shop-Code": SHOP_CODE }),
    ...auth,
  };
  const res = await fetch(`${base}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let data: any = null;
  try { data = await res.json(); } catch {}
  // Session dead at the server (revoked/expired-and-unrefreshable): drop the local set and
  // bounce to login. getValidAccessToken already refreshed if it could, so a 401 here is final.
  if (res.status === 401 && authed && !path.startsWith("/mobile/auth/login")) {
    await tokenStore.clear();
    try { router.replace("/"); } catch {}
  }
  return { status: res.status, data };
}
export const unwrap = (r: any) => (r && typeof r === "object" && "data" in r ? r.data : r);
