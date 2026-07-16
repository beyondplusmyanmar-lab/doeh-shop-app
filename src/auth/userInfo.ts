import { getDiscovery } from "./discovery";
import { authHeaders } from "./authHeaders";

// OIDC UserInfo (from discovery). A direct call to the AS with the access token — deliberately
// NOT through src/api/client.ts, so a 401 here does not trip that layer's sign-out-and-redirect
// (UserInfo failing should degrade gracefully, not eject the user).
export type UserInfo = {
  sub?: string;
  name?: string;
  email?: string;
  phone?: string;
  [k: string]: unknown;
};

export async function userInfo(): Promise<UserInfo | null> {
  const disc = await getDiscovery();
  if (!disc.userinfo_endpoint) return null;
  const auth = await authHeaders();
  if (!("Authorization" in auth)) return null;
  try {
    const res = await fetch(disc.userinfo_endpoint, { headers: { ...auth, Accept: "application/json" } });
    if (!res.ok) return null;
    return (await res.json()) as UserInfo;
  } catch {
    return null;
  }
}
