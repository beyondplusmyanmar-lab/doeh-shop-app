import React, { useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { myCoupons } from "@/api/coupons";
import { Card, Title, Muted, Body, Button, c } from "@/components/ui";

export default function Coupons() {
  const [s, setS] = useState<any>({ loading: true });
  const load = async () => { setS({ loading: true }); try { const items = await myCoupons(); setS({ loading: false, items: Array.isArray(items) ? items : [] }); } catch (e: any) { setS({ loading: false, error: e?.message }); } };
  useEffect(() => { load(); }, []);
  const { loading, error, items = [] } = s;
  return (<ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: 20, gap: 14 }}>
    {loading ? <Muted>Loading coupons…</Muted> : error ? <Body color={c.bad}>{error}</Body> :
      items.length === 0 ? <Card><Muted>No coupons yet — redeem points to earn coupons.</Muted></Card> :
      items.map((cp: any, i: number) => (
        <Card key={cp.id ?? i}>
          <Title>{cp.name ?? cp.code}</Title>
          <Body color={c.primary}>{cp.code}</Body>
          <Muted>{cp.discount_type === "percent" ? `${cp.discount_value}%` : `${cp.discount_value} off`}{cp.min_purchase_amount ? ` · min ${cp.min_purchase_amount}` : ""}</Muted>
          {cp.expires_at ? <Muted>expires {String(cp.expires_at).slice(0, 10)}</Muted> : null}
        </Card>))}
    <Button title="Refresh" onPress={load} variant="ghost" />
  </ScrollView>);
}
