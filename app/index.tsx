import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { signIn, isAuthenticated, authConfigured } from "@/auth";
import { SHOP_CODE, BRAND } from "@/config/shop";
import { Screen, Card, Title, Muted, Body, Button, c } from "@/components/ui";

// Phase A — hosted OAuth 2.1 + PKCE. The app never sees the customer's credentials: it opens the
// DOEH-hosted login in the system browser and receives tokens back. (Email+password sign-in is
// retired; the DIP hosted flow owns authentication.)
export default function Login() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [err, setErr] = useState("");

  // Session restore: if a valid (or refreshable) session already exists, skip straight in.
  useEffect(() => {
    (async () => {
      try {
        if (await isAuthenticated()) router.replace("/loyalty");
      } finally {
        setChecking(false);
      }
    })();
  }, [router]);

  const onSignIn = async () => {
    setBusy(true);
    setErr("");
    try {
      const r = await signIn();
      if (r.ok) router.replace("/loyalty");
      else if (r.error !== "cancelled" && r.error !== "dismissed") {
        setErr(`Sign in failed (${r.error}).`);
      }
    } catch (e: any) {
      setErr(e?.message || "Network error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Card>
        <Title>{BRAND.name}</Title>
        <Muted>Sign in to view your rewards at this shop ({SHOP_CODE}).</Muted>
      </Card>
      <Card>
        {!authConfigured() ? (
          <Body color={c.bad}>Sign-in is not configured for this build.</Body>
        ) : (
          <>
            <Body>You&apos;ll sign in on a secure DOEH page — this app never sees your password.</Body>
            {err ? <Body color={c.bad}>{err}</Body> : null}
            <Button title="Sign in" onPress={onSignIn} loading={busy || checking} />
          </>
        )}
      </Card>
    </Screen>
  );
}
