import React, { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { activeQr, generateGeneralQr } from "@/api/qr";
import { Card, Title, Muted, Body, Button, c } from "@/components/ui";

export default function MyQR() {
  const [s, setS] = useState<any>({ loading: true });
  const load = async () => {
    setS({ loading: true });
    try {
      const active = await activeQr();
      let tok: any = Array.isArray(active) ? active[0] : active;
      if (!tok?.token) tok = await generateGeneralQr(); // returns a fresh QrToken
      setS({ loading: false, token: tok?.token ?? null, expires: tok?.expires_at });
    } catch (e: any) { setS({ loading: false, error: e?.message }); }
  };
  useEffect(() => { load(); }, []);
  const { loading, error, token, expires } = s;

  return (<ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: 20, gap: 14 }}>
    <Card>
      <Title>Your loyalty QR</Title>
      <Muted>Show this at the shop to earn points on a purchase.</Muted>
    </Card>
    <Card>
      {loading ? <Muted>Loading…</Muted> : error ? <Body color={c.bad}>{error}</Body> : token ? (
        <View style={{ alignItems: "center", gap: 12, paddingVertical: 12 }}>
          <View style={{ backgroundColor: "#F5EFE7", borderRadius: 16, padding: 18 }}>
            <QRCode value={String(token)} size={200} backgroundColor="#F5EFE7" color="#1A120B" />
          </View>
          {expires ? <Muted>expires {String(expires).slice(0, 16).replace("T", " ")}</Muted> : null}
          <Muted>token</Muted>
          <Body color={c.primary}>{String(token).slice(0, 28)}…</Body>
        </View>) : <Muted>No QR available.</Muted>}
    </Card>
    <Button title="Regenerate" onPress={load} variant="ghost" />
  </ScrollView>);
}
