import * as Crypto from "expo-crypto";
import { bytesToBase64Url, base64ToBase64Url } from "./util";

// PKCE (RFC 7636), S256 only — the sole code_challenge_method the DOEH AS accepts.
//
// The verifier is 64 random bytes rendered base64url (~86 chars, within the RFC's 43–128 and
// drawn only from the unreserved set). The challenge is base64url(SHA-256(verifier)).

export type Pkce = { verifier: string; challenge: string };

export async function createPkce(): Promise<Pkce> {
  const verifier = bytesToBase64Url(await Crypto.getRandomBytesAsync(64));
  const digestB64 = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier,
    { encoding: Crypto.CryptoEncoding.BASE64 },
  );
  return { verifier, challenge: base64ToBase64Url(digestB64) };
}

/** Opaque anti-CSRF value echoed through the authorize round-trip and checked on return. */
export async function randomState(): Promise<string> {
  return bytesToBase64Url(await Crypto.getRandomBytesAsync(16));
}
