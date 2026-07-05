# Doeh Shop App (Expo)

A config-pinned, white-label **consumer** loyalty app — one shop per clone. The whole
"key" is [`shop.config.json`](./shop.config.json): set `shopCode` + `brand` and the app
becomes that shop's branded app. No multi-shop discovery.

This is the **clone-and-own product** a shop publishes for **its customers**. Merchant-side
loyalty (reward rules, members, transactions, QR check-in) is handled in **pos-bo** (the
back office) — there is no merchant app to fork. See [`docs/ADR-001`](./docs/ADR-001-consumer-public-surface.md).

> ## ⚠ Publishing requirement
> This application is designed to use **DOEH Hosted Authentication (OAuth 2.1 + PKCE)**
> through the **Consumer Edge**. Merchant-hosted login forms and merchant-side
> authentication proxies are **not supported for production deployments**, because they
> expose customer credentials to untrusted infrastructure.
>
> → [SECURITY-untrusted-shop](./docs/SECURITY-untrusted-shop.md) ·
> [ADR-001 (consumer public surface)](./docs/ADR-001-consumer-public-surface.md)

- **6 tabs:** Rewards (balance/history/redeem), Offers, Coupons, Bookings (create/cancel),
  My QR, Profile.
- **Consumer plane** (`/mobile/*`, customer OTP/token auth) — not the merchant SDK. See
  [`docs/`](./docs) for why it's private and the roadmap to make it public.

## Run

```bash
pnpm install
pnpm start          # native: press i / a  (Expo Go — direct to backend, no CORS)
pnpm web            # web: same-origin proxy (app/api/svc), no CORS
```

Backend target = `apiBase` in `shop.config.json` (native + web proxy both read it):
`https://shop.doehpos.com/api/v1` (prod) or `http://127.0.0.1:8000/api/v1` (local pos-shop).

## White-label swap (the value prop)

Edit `shop.config.json` → `shopCode` + `brand`, and it's a different shop's app.

> **Dev caveat:** Metro caches `shop.config.json`, so after editing it on the dev server
> you must restart **with cache clear**: `pnpm web --clear` (or `pnpm start --clear`). A
> real EAS build always reads it fresh — this only affects the local dev server.

## Notes

- Session token is stored web-safe (SecureStore on native, localStorage on web).
- A `401` clears the session and returns to login (e.g. after switching backend env).
- `pnpm smoke:consumer` proves the public consumer plane against the live sandbox edge —
  credential-free it asserts the auth gate + typed error ABI; with `DOEH_CUSTOMER_TOKEN`
  it drives the authenticated loyalty reads (redeem is opt-in via `SMOKE_REDEEM_POINTS`).
- **Auth model:** the in-app email+password login is **first-party only** (DOEH deploys
  the app). For **clone-and-own** publishing, the shop must never collect the customer's
  credential — auth moves to a **DOEH-hosted OAuth/PKCE** flow (`pk_` = client id, app
  gets a shop-scoped token). See [`docs/ADR-001` §W2](./docs/ADR-001-consumer-public-surface.md).
