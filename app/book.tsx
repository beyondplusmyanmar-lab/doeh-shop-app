import React, { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { branches, availability, createBooking } from "@/api/bookings";
import { Card, Title, Muted, Body, Button, c } from "@/components/ui";

function nextDays(n: number) {
  const out: { iso: string; label: string }[] = [];
  const base = new Date();
  for (let i = 1; i <= n; i++) {
    const x = new Date(base); x.setDate(base.getDate() + i);
    out.push({ iso: x.toISOString().slice(0, 10), label: x.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) });
  }
  return out;
}

export default function Book() {
  const router = useRouter();
  const [brs, setBrs] = useState<any[]>([]);
  const [branchId, setBranchId] = useState<number | null>(null);
  const days = nextDays(7);
  const [date, setDate] = useState(days[0].iso);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: "good" | "bad" } | null>(null);

  useEffect(() => { (async () => { const arr = await branches(); const a = Array.isArray(arr) ? arr : []; setBrs(a); if (a[0]) setBranchId(a[0].id); })(); }, []);
  useEffect(() => {
    if (!branchId) return;
    (async () => { setLoading(true); setNotice(null); try { const av = await availability(branchId, date); setSlots(av?.slots ?? []); } catch { setSlots([]); } finally { setLoading(false); } })();
  }, [branchId, date]);

  const book = async (slot: any) => {
    if (!branchId) return;
    setBooking(true); setNotice(null);
    const r = await createBooking({ branch_id: branchId, booking_date: date, start_time: slot.start_time, end_time: slot.end_time, service_type: slot.service_type });
    if (r.ok) { setNotice({ text: `Booked ${date} at ${slot.start_time.slice(0, 5)}`, tone: "good" }); setTimeout(() => router.back(), 900); }
    else setNotice({ text: r.message || "Couldn't book that slot.", tone: "bad" });
    setBooking(false);
  };

  const branch = brs.find((b) => b.id === branchId);
  const open = slots.filter((s: any) => (s.available ?? 0) > 0);
  return (<ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: 20, gap: 14 }}>
    <Card><Title>New booking</Title><Muted>{branch?.branch_name ?? "Select a branch"}</Muted></Card>
    {brs.length > 1 ? <Card><Title>Branch</Title>{brs.map((b) => (
      <Button key={b.id} title={b.branch_name} variant={b.id === branchId ? "primary" : "ghost"} onPress={() => setBranchId(b.id)} />))}</Card> : null}
    <Card>
      <Title>Date</Title>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {days.map((d) => (<View key={d.iso} style={{ flexBasis: "48%" }}><Button title={d.label} variant={d.iso === date ? "primary" : "ghost"} onPress={() => setDate(d.iso)} /></View>))}
      </View>
    </Card>
    <Card>
      <Title>Available times</Title>
      {notice ? <Body color={notice.tone === "good" ? c.good : c.bad}>{notice.text}</Body> : null}
      {loading ? <Muted>Loading…</Muted> : open.length === 0 ? <Muted>No open slots for this day.</Muted> :
        open.map((s: any) => (<Button key={s.slot_id} title={`${s.start_time.slice(0, 5)}–${s.end_time.slice(0, 5)} · ${s.available} left`} loading={booking} onPress={() => book(s)} />))}
    </Card>
  </ScrollView>);
}
