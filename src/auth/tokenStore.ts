import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// The token set, stored as ONE record so access + refresh + expiry + type never drift apart.
// `meta` is deliberately open: Phase B (DPoP) writes the key-binding thumbprint / handle there
// without a storage redesign. `tokenType` carries the auth scheme ("Bearer" now, "DPoP" later),
// so the header builder needs no change to switch schemes.
export type TokenSet = {
  accessToken: string;
  refreshToken: string | null;
  tokenType: string; // "Bearer" (Phase A) | "DPoP" (Phase B)
  scope: string;
  expiresAt: number; // epoch ms, access-token expiry
  obtainedAt: number; // epoch ms
  meta?: Record<string, unknown>; // room for DPoP jkt / key handle, etc.
};

const KEY = "doeh.auth.tokenset.v1";
const SKEW_MS = 30_000; // treat a token as expired 30s early, so a request never races expiry

// SecureStore is native-only (throws on web). Same guarded-shim shape the app already uses for
// its legacy session store, so web keeps working via localStorage.
async function readRaw(): Promise<string | null> {
  try {
    if (Platform.OS === "web") return globalThis.localStorage?.getItem(KEY) ?? null;
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}
async function writeRaw(v: string): Promise<void> {
  try {
    if (Platform.OS === "web") globalThis.localStorage?.setItem(KEY, v);
    else await SecureStore.setItemAsync(KEY, v);
  } catch {
    /* best-effort; a failed write surfaces as "signed out" on next read */
  }
}
async function removeRaw(): Promise<void> {
  try {
    if (Platform.OS === "web") globalThis.localStorage?.removeItem(KEY);
    else await SecureStore.deleteItemAsync(KEY);
  } catch {
    /* ignore */
  }
}

export const tokenStore = {
  async get(): Promise<TokenSet | null> {
    const raw = await readRaw();
    if (!raw) return null;
    try {
      return JSON.parse(raw) as TokenSet;
    } catch {
      return null; // corrupt record reads as signed-out
    }
  },
  async save(t: TokenSet): Promise<void> {
    await writeRaw(JSON.stringify(t));
  },
  async clear(): Promise<void> {
    await removeRaw();
  },
};

/** True when the access token is at/near expiry (with skew) and should be refreshed. */
export function isExpired(t: TokenSet, skewMs: number = SKEW_MS): boolean {
  return Date.now() >= t.expiresAt - skewMs;
}

/** Build a TokenSet from a token-endpoint JSON response. */
export function toTokenSet(data: {
  access_token: string;
  refresh_token?: string | null;
  token_type?: string;
  scope?: string;
  expires_in?: number;
}): TokenSet {
  const now = Date.now();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    tokenType: data.token_type ?? "Bearer",
    scope: data.scope ?? "",
    expiresAt: now + Number(data.expires_in ?? 600) * 1000,
    obtainedAt: now,
  };
}
