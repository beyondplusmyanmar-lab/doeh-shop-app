// Same-origin proxy (app-portal's /api/svc pattern, native to Expo Router).
// The web app calls /api/svc/* (same origin -> no CORS); this server route
// forwards to the consumer Core — or, for the routes the edge publishes
// (W2 §2d), to the public edge keyed by the publishable key. Targets come from
// shop.config.json — the SAME values native uses — and the routing decision is
// the SAME provider native uses, so the two surfaces can never disagree.
import { publishableKeyProvider } from "../../../src/api/plane";

const SHOP = require("../../../shop.config.json");
const CORE: string = SHOP.apiBase;
const edge = publishableKeyProvider(SHOP);

async function proxy(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/svc\/?/, "");
  const target = edge.serves(`/${path}`)
    ? `${edge.targetFor(`/${path}`)}${url.search}`
    : `${CORE}/${path}${url.search}`;
  const headers = new Headers();
  for (const h of ["authorization", "x-shop-code", "x-publishable-key", "content-type", "accept"]) {
    const v = req.headers.get(h);
    if (v) headers.set(h, v);
  }
  const body = req.method === "GET" || req.method === "HEAD" ? undefined : await req.text();
  const res = await fetch(target, { method: req.method, headers, body });
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
