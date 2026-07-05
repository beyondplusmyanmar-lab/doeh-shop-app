import React, { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { myBookings, cancelBooking } from "@/api/bookings";
import { Card, Title, Muted, Body, Button, c } from "@/components/ui";

export default function Bookings() {
  const router = useRouter();
  const [s, setS] = useState<any>({ loading: true });
  const [busyId, setBusyId] = useState<number | null>(null);
  const load = async () => {
    setS({ loading: true });
    try { const items = await myBookings(); setS({ loading: false, items: Array.isArray(items) ? items : [] }); }
    catch (e: any) { setS({ loading: false, error: e?.message }); }
  };
  useEffect(() => { load(); }, []);

  const onCancel = async (id: number) => { setBusyId(id); await cancelBooking(id); setBusyId(null); load(); };
  const { loading, error, items = [] } = s;
  const fmt = (b: any) => [String(b.booking_date).slice(0, 10), b.start_time ? `${b.start_time.slice(0, 5)}–${(b.end_time || "").slice(0, 5)}` : "", b.branch?.branch_name].filter(Boolean).join(" · ");

  return (<ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: 20, gap: 14 }}>
    <Button title="+ New booking" onPress={() => router.push("/book")} />
    {loading ? <Muted>Loading bookings…</Muted> : error ? <Body color={c.bad}>{error}</Body> :
      items.length === 0 ? <Card><Muted>No bookings yet.</Muted></Card> :
      items.map((b: any, i: number) => (
        <Card key={b.id ?? i}>
          <Title>{b.service_type ?? "Booking"} #{b.id}</Title>
          <Muted>{fmt(b)}</Muted>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Body color={b.status === "cancelled" ? c.bad : b.status === "confirmed" ? c.good : c.muted}>{b.status}</Body>
            {b.status !== "cancelled" ? <View style={{ minWidth: 110 }}><Button title="Cancel" variant="ghost" loading={busyId === b.id} onPress={() => onCancel(b.id)} /></View> : null}
          </View>
        </Card>))}
    <Button title="Refresh" onPress={load} variant="ghost" />
  </ScrollView>);
}
