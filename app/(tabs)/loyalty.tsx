import React, { useEffect, useState } from "react";
import { View, ScrollView } from "react-native";
import { getBalance, getSettings, getTransactions, getCoupons, joinShop, redeem } from "@/api/loyalty";
import { SHOP_CODE } from "@/config/shop";
import { Card, Title, Muted, Body, Button, c } from "@/components/ui";

export default function Loyalty() {
  const [state, setState] = useState<any>({ loading: true });
  const [redeeming, setRedeeming] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: "good" | "bad" } | null>(null);

  const load = async () => {
    setState({ loading: true });
    try {
      await joinShop(SHOP_CODE);
      const [balance, settings, txns, coupons] = await Promise.all([getBalance(), getSettings(), getTransactions(), getCoupons()]);
      setState({ loading: false, balance, settings, txns: Array.isArray(txns) ? txns : [], coupons: Array.isArray(coupons) ? coupons : [] });
    } catch (e: any) { setState({ loading: false, error: e?.message || "Failed to load" }); }
  };
  useEffect(() => { load(); }, []);

  const { loading, error, balance, settings, txns = [], coupons = [] } = state;
  const minRedeem = settings?.min_redeem_points ?? 50;
  const canRedeem = (balance?.points_balance ?? 0) >= minRedeem;

  const onRedeem = async () => {
    setRedeeming(true); setNotice(null);
    try {
      const r = await redeem(minRedeem);
      if (r.ok) { setNotice({ text: `Redeemed ${minRedeem} pts → coupon ${r.data?.coupon_code ?? "created"}`, tone: "good" }); await load(); }
      else setNotice({ text: r.message || `Can't redeem (need ${minRedeem} pts).`, tone: "bad" });
    } catch (e: any) { setNotice({ text: e?.message || "Redeem failed", tone: "bad" }); }
    finally { setRedeeming(false); }
  };

  return (<ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: 20, gap: 16 }}>
    <Card>
      <Muted>Balance at this shop ({SHOP_CODE})</Muted>
      <Title>{loading ? "…" : `${balance?.points_balance ?? 0} pts`}</Title>
      {balance ? <Muted>tier {balance.tier} · lifetime {balance.lifetime_points} pts</Muted> : null}
      {error ? <Body color={c.bad}>{error}</Body> : null}
    </Card>
    <Card>
      <Title>Redeem</Title>
      <Muted>Turn {minRedeem} points into a coupon.{!canRedeem ? ` You have ${balance?.points_balance ?? 0}.` : ""}</Muted>
      {notice ? <Body color={notice.tone === "good" ? c.good : c.bad}>{notice.text}</Body> : null}
      <Button title={`Redeem ${minRedeem} pts`} onPress={onRedeem} loading={redeeming} />
      {!canRedeem ? <Muted>Earn points in-store (show your QR) to reach the minimum.</Muted> : null}
    </Card>
    {settings ? <Card><Title>Program</Title><Muted>{settings.is_active ? "Active" : "Inactive"} · earn {settings.points_per_currency} pt/unit · min redeem {minRedeem} pts</Muted></Card> : null}
    <Card>
      <Title>History</Title>
      {txns.length === 0 ? <Muted>No transactions yet.</Muted> : txns.map((t: any, i: number) => (
        <View key={t.id ?? i} style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Muted>{t.type}{t.note ? ` · ${t.note}` : ""}</Muted>
          <Body color={t.points >= 0 ? c.good : c.bad}>{t.points >= 0 ? "+" : ""}{t.points}</Body>
        </View>))}
    </Card>
    <Card>
      <Title>Coupons</Title>
      {coupons.length === 0 ? <Muted>No coupons available.</Muted> : coupons.map((cp: any, i: number) => (
        <Body key={cp.id ?? i}>{cp.name ?? cp.code} — {cp.discount_type === "percent" ? `${cp.discount_value}%` : `${cp.discount_value} off`}</Body>))}
    </Card>
    <Button title="Refresh" onPress={load} variant="ghost" />
  </ScrollView>);
}
