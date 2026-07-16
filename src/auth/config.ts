import { SHOP } from "@/config/shop";

// OAuth 2.1 / OIDC configuration for the DOEH Identity Platform.
//
// Only the ISSUER and CLIENT_ID are configured here — every endpoint (authorize, token,
// userinfo, revoke) is discovered at runtime from the issuer's discovery document, so sandbox
// and production differ by issuer alone (see discovery.ts). Per-clone values live in the shop
// config (extra.shop.auth), overridable by EXPO_PUBLIC_* env for local development.

export type AuthConfig = {
  issuer: string;
  clientId: string;
  scopes: string[];
  redirectScheme: string;
  redirectPath: string;
};

const raw = (SHOP.auth ?? {}) as Partial<AuthConfig>;

export const AUTH: AuthConfig = {
  issuer: (process.env.EXPO_PUBLIC_AUTH_ISSUER ?? raw.issuer ?? "").replace(/\/+$/, ""),
  clientId: process.env.EXPO_PUBLIC_AUTH_CLIENT_ID ?? raw.clientId ?? "",
  scopes: raw.scopes ?? ["loyalty:read"],
  redirectScheme: raw.redirectScheme ?? "shoployalty",
  redirectPath: raw.redirectPath ?? "oauth/callback",
};

/** True when the app has enough to run the hosted flow. Fail closed into "not configured". */
export const authConfigured = (): boolean => AUTH.issuer !== "" && AUTH.clientId !== "";
