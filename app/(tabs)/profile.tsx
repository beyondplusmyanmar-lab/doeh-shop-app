import React, { useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { userInfo, signOut } from "@/auth";
import { SHOP, SHOP_CODE } from "@/config/shop";
import { Card, Title, Muted, Body, Button, c } from "@/components/ui";

export default function Profile() {
  const router = useRouter();
  const [s, setS] = useState<any>({ loading: true });
  useEffect(() => { (async () => { setS({ loading: false, customer: await userInfo() }); })(); }, []);
  const onLogout = async () => { await signOut(); router.replace("/"); };
  const { loading, error, customer } = s;
  return (<ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: 20, gap: 14 }}>
    <Card>
      <Title>{loading ? "…" : customer?.name ?? "Customer"}</Title>
      {customer?.email ? <Muted>{customer.email}</Muted> : null}
      {error ? <Body color={c.bad}>{error}</Body> : null}
    </Card>
    <Card>
      <Title>Shop</Title>
      <Muted>{SHOP.brand.name} · {SHOP_CODE} · {SHOP.environment}</Muted>
    </Card>
    <Button title="Sign out" onPress={onLogout} variant="ghost" />
  </ScrollView>);
}
