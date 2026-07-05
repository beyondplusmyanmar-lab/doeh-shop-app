# Threat model — the shop is untrusted (no consumer-credential capture)

**Trust boundary:** in clone-and-own / plugin delivery, the **shop is untrusted**. It
owns the app binary, its website, and any proxy server it runs. So the rule is absolute:

> **The customer's credential must never pass through anything the shop controls** —
> not a login screen in the shop's app, not a form on the shop's site, not a proxy on
> the shop's server.

## Trust boundaries (first-class concept)

Classify every component by trust level. When adding a feature, ask the one question:
**which boundary does this component belong to?** — and never route a credential through
anything below *Trusted*.

| Trust level | Components |
|---|---|
| **Trusted** | DOEH Edge, Hosted Auth, identity services |
| **Semi-trusted** | Native app binary (client-controlled, but authenticated + attestable) |
| **Untrusted** | Merchant website, CMS-plugin host, merchant reverse proxies, the browser JavaScript environment |

Rules that fall out of the table:
- **Credentials** are entered and verified only in **Trusted** (Hosted Auth) — never in
  Semi-trusted or Untrusted.
- **Authed API calls** for Untrusted surfaces go **directly to the Edge** (no Untrusted
  server in the path). Semi-trusted native calls the Edge directly too.
- **Tokens** may live in Semi-trusted (native secure store) but are minimized + revocable;
  in Untrusted (browser) they are short-TTL and never persisted to a merchant server.

## Capture vectors (and why the naive design leaks)

1. **Password capture at the login surface — the scary one.** If the customer types
   email/password into a screen the *shop's* app/site renders, the shop's own code sees
   the plaintext and can exfiltrate it **before it ever reaches our API**. Our API being
   secure does not help — the theft is client-side.
2. **Token capture via a shop-run proxy.** A same-origin proxy on the **shop's** server
   (the `/api/svc` pattern) sees every request in cleartext — the login *and* the bearer
   token. ⚠ **This is why that proxy is first-party ONLY** (see correction below).
3. **PII capture via over-broad API responses.** If an endpoint returns cross-shop data
   or more profile than needed, the shop harvests it from the response.

## Mitigations (mandatory before any public / clone-and-own channel)

1. **Hosted auth — password only ever on DOEH's domain.** OAuth 2.0 **Authorization Code
   + PKCE**, public client (`pk_` = `client_id`, no secret). The shop's app opens a
   **system browser** (`expo-web-browser` → SFSafariViewController / Chrome Custom Tabs);
   the CMS plugin **redirects** to DOEH. The customer enters credentials on **DOEH's**
   page, which the shop's app/site **cannot read** (OS / cross-origin isolation). DOEH
   returns an **auth code**; the app exchanges it for a token. **The shop never sees the
   password.**
2. **No shop-controlled server in the authed path.** For a shop-published web/CMS surface,
   authed calls go **browser → edge directly** (edge CORS scoped to `pk_` origins), so the
   **token never lands on the shop's server**. The same-origin proxy is fine only when
   **DOEH** runs the server (first-party).
3. **Bound, short-lived, minimal tokens.** Access tokens are **shop-scoped** (W2) +
   **capability-scoped** (only the shop's purchased plugins) + **short-TTL** + **revocable**,
   ideally **sender-constrained** (DPoP / device attestation) so a captured token can't be
   replayed elsewhere. This bounds the blast radius of any leak.
4. **Minimize responses.** Return **this-shop data only**, never cross-shop, never PII
   beyond need, and **never** secrets/hashes.

## The line we can and can't hold (be honest)

We **cannot** stop a shop from acting as the customer **within that shop's own scope**
during a live session — the shop legitimately serves the app and holds the scoped token.
That's inherent and acceptable (it's their own shop, their own customer).

What we **do** hold, absolutely:
- **No password** ever reaches the shop.
- **No cross-shop** access (shop-scoped token, server-derived shop).
- **No long-lived / replayable** credential (short-TTL, revocable, sender-constrained).
- **No excess PII** in responses.

So the goal is **bounding the blast radius**, not pretending the shop has zero access.

## Impact on the roadmap

- **Corrects [W5](./W3-W5-sdk-docs-web.md):** for clone-and-own, prefer **edge CORS
  (browser→edge)**, *not* a shop-run proxy — the proxy would put the token on the shop's
  server. The proxy pattern in this repo is **first-party only**.
- **Sharpens [W2](./ADR-001-consumer-public-surface.md):** the publishable key is not just
  a shop binder — it's the **OAuth public client** for a hosted-auth flow. That flow is the
  mitigation for vector #1, the highest risk.
- This is the real reason **W1 + W2 gate everything**: without the edge front + hosted
  auth, every seamless consumer channel (app, CMS plugin) leaks credentials by design.
