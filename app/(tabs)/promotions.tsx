import React, { useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { listPromotions } from "@/api/promotions";
import { Card, Title, Muted, Body, Button, c } from "@/components/ui";

export default function Promotions() {
  const [s, setS] = useState<any>({ loading: true });
  const load = async () => { setS({ loading: true }); try { const items = await listPromotions(); setS({ loading: false, items: Array.isArray(items) ? items : [] }); } catch (e: any) { setS({ loading: false, error: e?.message }); } };
  useEffect(() => { load(); }, []);
  const { loading, error, items = [] } = s;
  return (<ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: 20, gap: 14 }}>
    {loading ? <Muted>Loading offers…</Muted> : error ? <Body color={c.bad}>{error}</Body> :
      items.length === 0 ? <Card><Muted>No active offers.</Muted></Card> :
      items.map((p: any, i: number) => (
        <Card key={p.id ?? i}>
          <Title>{p.title ?? p.name ?? "Offer"}</Title>
          {p.description ? <Muted>{p.description}</Muted> : null}
          {p.discount_value ? <Body color={c.good}>{p.discount_type === "percent" ? `${p.discount_value}% off` : `${p.discount_value} off`}</Body> : null}
          {p.ends_at || p.expires_at ? <Muted>ends {String(p.ends_at ?? p.expires_at).slice(0, 10)}</Muted> : null}
        </Card>))}
    <Button title="Refresh" onPress={load} variant="ghost" />
  </ScrollView>);
}
