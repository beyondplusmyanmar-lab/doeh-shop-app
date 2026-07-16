import { getValidAccessToken } from "./refresh";

// THE single place that turns the stored token into request headers.
//
// Phase A returns just the Authorization header, and its scheme comes from tokenType — so it is
// already "Bearer <at>" now and becomes "DPoP <at>" automatically once the AS issues DPoP tokens.
// Phase B adds the per-request `DPoP: <proof>` header HERE and nowhere else: every caller
// (src/api/client.ts, the SDK token provider) goes through this function, so the app gains
// sender-constraining by changing one file.
export async function authHeaders(): Promise<Record<string, string>> {
  const t = await getValidAccessToken();
  if (!t) return {};
  return { Authorization: `${t.tokenType} ${t.accessToken}` };
  // Phase B, sketched so the seam is obvious:
  //   const proof = await dpop.proofFor(method, url, t.meta?.jkt);
  //   return { Authorization: `DPoP ${t.accessToken}`, DPoP: proof };
}
