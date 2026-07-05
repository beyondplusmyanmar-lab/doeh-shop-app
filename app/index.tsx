import React, { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { login } from "@/api/auth";
import { SHOP_CODE, BRAND } from "@/config/shop";
import { Screen, Card, Title, Muted, Body, Field, Button, c } from "@/components/ui";

// Dev-only prefill: set EXPO_PUBLIC_DEMO_EMAIL / EXPO_PUBLIC_DEMO_PASSWORD in a
// gitignored .env — credentials must never be hardcoded in source.
const DEMO_EMAIL = process.env.EXPO_PUBLIC_DEMO_EMAIL ?? "";
const DEMO_PASSWORD = process.env.EXPO_PUBLIC_DEMO_PASSWORD ?? "";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const onLogin = async () => {
    setBusy(true); setErr("");
    try {
      const r = await login(email.trim(), password);
      if (r.ok) router.replace("/loyalty");
      else setErr(r.raw?.message || `Sign in failed (HTTP ${r.status}).`);
    } catch (e: any) { setErr(e?.message || "Network error"); }
    finally { setBusy(false); }
  };

  return (<Screen>
    <Card>
      <Title>{BRAND.name}</Title>
      <Muted>Sign in to view your rewards at this shop ({SHOP_CODE}).</Muted>
    </Card>
    <Card>
      <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@email.com" />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••" />
      {err ? <Body color={c.bad}>{err}</Body> : null}
      <Button title="Sign in" onPress={onLogin} loading={busy} />
      {DEMO_EMAIL ? <Muted>Demo: {DEMO_EMAIL}</Muted> : null}
    </Card>
  </Screen>);
}
