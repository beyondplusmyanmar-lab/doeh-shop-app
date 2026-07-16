// Public surface of the auth module. Screens and the API layer import from "@/auth" only —
// the individual files are internal. This keeps the Phase B (DPoP) changes contained: the
// exported shape does not change, only what authHeaders() puts on the wire.

import { getValidAccessToken } from "./refresh";

export { signIn, redirectUri, type SignInResult } from "./authSession";
export { signOut } from "./logout";
export { getValidAccessToken, refresh } from "./refresh";
export { authHeaders } from "./authHeaders";
export { userInfo, type UserInfo } from "./userInfo";
export { tokenStore, type TokenSet } from "./tokenStore";
export { AUTH, authConfigured } from "./config";

/** True if there is a usable (or refreshable) session. Safe to call on boot to route the user. */
export async function isAuthenticated(): Promise<boolean> {
  return (await getValidAccessToken()) !== null;
}
