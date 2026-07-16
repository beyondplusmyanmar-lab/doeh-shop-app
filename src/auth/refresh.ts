import { AUTH } from "./config";
import { getDiscovery } from "./discovery";
import { toForm } from "./util";
import { tokenStore, toTokenSet, isExpired, type TokenSet } from "./tokenStore";

// Refresh with SINGLE-FLIGHT dedup: many screens can call getValidAccessToken() at once (a tab
// switch fires several API calls), but only ONE refresh request may be in flight — the DOEH AS
// rotates refresh tokens one-time-use and revokes the whole family on reuse, so two concurrent
// refreshes would revoke the user's own session. Concurrent callers await the same promise.

let inflight: Promise<TokenSet | null> | null = null;

/** The current access token if valid, transparently refreshed if expired, or null if signed out. */
export async function getValidAccessToken(): Promise<TokenSet | null> {
  const current = await tokenStore.get();
  if (!current) return null;
  if (!isExpired(current)) return current;
  return refresh();
}

/** Force a refresh (also the path getValidAccessToken takes on expiry). Deduped. */
export async function refresh(): Promise<TokenSet | null> {
  if (inflight) return inflight;
  inflight = doRefresh().finally(() => {
    inflight = null;
  });
  return inflight;
}

async function doRefresh(): Promise<TokenSet | null> {
  const current = await tokenStore.get();
  if (!current?.refreshToken) {
    await tokenStore.clear();
    return null;
  }

  const disc = await getDiscovery();
  const res = await fetch(disc.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: toForm({
      grant_type: "refresh_token",
      refresh_token: current.refreshToken,
      client_id: AUTH.clientId,
    }),
  });
  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.access_token) {
    // A hard rejection (revoked family, reuse, bad token) ends the session; a transient network
    // error keeps the stored set so a later call can retry rather than logging the user out.
    if (res.status === 400 || res.status === 401) await tokenStore.clear();
    return null;
  }

  const next = toTokenSet(data);
  await tokenStore.save(next);
  return next;
}
