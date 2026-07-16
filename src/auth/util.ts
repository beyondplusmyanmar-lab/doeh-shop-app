// Small dependency-free helpers shared across the auth module. Kept here so the flow
// files stay focused and so there is one place that owns wire-format encoding.

/** application/x-www-form-urlencoded body from a flat map (also fine for query strings). */
export function toForm(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}

/** Raw bytes -> base64url (no padding), the encoding PKCE + JOSE use. No btoa/Buffer needed. */
export function bytesToBase64Url(bytes: Uint8Array): string {
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : undefined;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : undefined;
    out += A[b0 >> 2];
    out += A[((b0 & 3) << 4) | ((b1 ?? 0) >> 4)];
    if (b1 === undefined) break;
    out += A[((b1 & 15) << 2) | ((b2 ?? 0) >> 6)];
    if (b2 === undefined) break;
    out += A[b2 & 63];
  }
  return out;
}

/** base64 (standard, possibly padded) -> base64url. */
export function base64ToBase64Url(b64: string): string {
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
