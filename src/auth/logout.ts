import { AUTH } from "./config";
import { getDiscovery } from "./discovery";
import { toForm } from "./util";
import { tokenStore } from "./tokenStore";

// Sign out: best-effort server revoke (RFC 7009, kills the refresh family), then clear locally.
// The local clear is what actually ends the session on-device, so it happens regardless of the
// network call — a user who taps "sign out" offline is still signed out.
export async function signOut(): Promise<void> {
  const current = await tokenStore.get();
  try {
    if (current?.refreshToken) {
      const disc = await getDiscovery();
      if (disc.revocation_endpoint) {
        await fetch(disc.revocation_endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: toForm({ token: current.refreshToken, client_id: AUTH.clientId }),
        });
      }
    }
  } catch {
    /* ignore — the local clear below is the guarantee */
  }
  await tokenStore.clear();
}
