import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import * as Linking from "expo-linking";
import { AUTH } from "./config";
import { getDiscovery } from "./discovery";
import { createPkce, randomState } from "./pkce";
import { toForm } from "./util";
import { tokenStore, toTokenSet } from "./tokenStore";

// Finish any auth session that resumed the app via a redirect (native deep link / web popup).
WebBrowser.maybeCompleteAuthSession();

export type SignInResult = { ok: true } | { ok: false; error: string };

/** The redirect URI this build hands to the AS. MUST be pre-registered on the client. */
export function redirectUri(): string {
  return AuthSession.makeRedirectUri({ scheme: AUTH.redirectScheme, path: AUTH.redirectPath });
}

/**
 * The full hosted OAuth 2.1 + PKCE flow: build the authorize request, open the DOEH-hosted login
 * in the system browser, capture the redirect, and exchange the code for tokens.
 *
 * The token exchange is a plain fetch we own (not expo-auth-session's exchange), so Phase B can
 * attach a DPoP proof to exactly this request with no change to the surrounding flow.
 */
export async function signIn(): Promise<SignInResult> {
  const disc = await getDiscovery();
  const { verifier, challenge } = await createPkce();
  const state = await randomState();
  const redirect = redirectUri();

  const authorizeUrl =
    `${disc.authorization_endpoint}?` +
    toForm({
      response_type: "code",
      client_id: AUTH.clientId,
      redirect_uri: redirect,
      code_challenge: challenge,
      code_challenge_method: "S256",
      scope: AUTH.scopes.join(" "),
      state,
    });

  const result = await WebBrowser.openAuthSessionAsync(authorizeUrl, redirect);
  if (result.type !== "success" || !result.url) {
    return { ok: false, error: result.type === "cancel" ? "cancelled" : "dismissed" };
  }

  // Parse the callback with expo-linking (robust for custom-scheme URLs, unlike bare `new URL`).
  const { queryParams } = Linking.parse(result.url);
  const code = str(queryParams?.code);
  const returnedState = str(queryParams?.state);
  const err = str(queryParams?.error);
  if (err) return { ok: false, error: err };
  if (!code || returnedState !== state) return { ok: false, error: "invalid_callback" };

  return exchangeCode(code, verifier, redirect);
}

async function exchangeCode(code: string, verifier: string, redirect: string): Promise<SignInResult> {
  const disc = await getDiscovery();
  const res = await fetch(disc.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: toForm({
      grant_type: "authorization_code",
      code,
      code_verifier: verifier,
      redirect_uri: redirect,
      client_id: AUTH.clientId,
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.access_token) {
    return { ok: false, error: data?.error ?? `token_exchange_failed_${res.status}` };
  }
  await tokenStore.save(toTokenSet(data));
  return { ok: true };
}

function str(v: string | string[] | undefined | null): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v ?? undefined;
}
