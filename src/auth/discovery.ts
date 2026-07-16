import { AUTH } from "./config";

// Dynamic discovery (RFC 8414 / OIDC): the app hardcodes no endpoints. It fetches the issuer's
// document once, caches it for the process, and reads every endpoint from there — so pointing at
// production instead of sandbox is a one-line issuer change and nothing else.

export type Discovery = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint?: string;
  revocation_endpoint?: string;
  introspection_endpoint?: string;
  code_challenge_methods_supported?: string[];
  dpop_signing_alg_values_supported?: string[];
};

let cached: Discovery | null = null;
let inflight: Promise<Discovery> | null = null;

export async function getDiscovery(force = false): Promise<Discovery> {
  if (cached && !force) return cached;
  if (inflight && !force) return inflight;

  inflight = (async () => {
    if (!AUTH.issuer) throw new Error("auth issuer is not configured");
    const url = `${AUTH.issuer}/.well-known/openid-configuration`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`discovery failed: HTTP ${res.status}`);
    const doc = (await res.json()) as Discovery;
    if (!doc.authorization_endpoint || !doc.token_endpoint) {
      throw new Error("discovery document is missing required endpoints");
    }
    cached = doc;
    return doc;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}
