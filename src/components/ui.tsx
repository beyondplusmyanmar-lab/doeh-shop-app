import React from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet, TextInputProps } from "react-native";
import { BRAND } from "@/config/shop";

export const c = { primary: BRAND.primary, bg: "#1A120B", card: "#2A1E14", text: "#F5EFE7", muted: "#B9A88F", good: "#7CC47F", bad: "#E2725B" };

export const Screen = ({ children }: { children: React.ReactNode }) => <View style={s.screen}>{children}</View>;
export const Card = ({ children }: { children: React.ReactNode }) => <View style={s.card}>{children}</View>;
export const Title = ({ children }: { children: React.ReactNode }) => <Text style={s.title}>{children}</Text>;
export const Muted = ({ children }: { children: React.ReactNode }) => <Text style={s.muted}>{children}</Text>;
export const Body = ({ children, color }: { children: React.ReactNode; color?: string }) => <Text style={[s.body, color ? { color } : null]}>{children}</Text>;

export function Field({ label, ...p }: { label: string } & TextInputProps) {
  return (<View style={{ gap: 6, marginBottom: 12 }}><Text style={s.label}>{label}</Text><TextInput placeholderTextColor={c.muted} style={s.input} {...p} /></View>);
}
export function Button({ title, onPress, loading, variant = "primary" }: { title: string; onPress: () => void; loading?: boolean; variant?: "primary" | "ghost" }) {
  return (<Pressable onPress={onPress} disabled={loading} style={[s.btn, { backgroundColor: variant === "primary" ? c.primary : "transparent", borderWidth: variant === "ghost" ? 1 : 0, borderColor: c.card, opacity: loading ? 0.5 : 1 }]}>
    {loading ? <ActivityIndicator color={variant === "primary" ? "#2A1E14" : c.text} /> : <Text style={[s.btnText, { color: variant === "primary" ? "#2A1E14" : c.text }]}>{title}</Text>}
  </Pressable>);
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg, padding: 20, gap: 16 },
  card: { backgroundColor: c.card, borderRadius: 14, padding: 18, gap: 8 },
  title: { color: c.text, fontSize: 18, fontWeight: "700" },
  muted: { color: c.muted, fontSize: 13 },
  body: { color: c.text, fontSize: 15 },
  label: { color: c.muted, fontSize: 13, fontWeight: "600" },
  input: { backgroundColor: "#12100C", color: c.text, borderRadius: 10, padding: 12, fontSize: 15 },
  btn: { borderRadius: 12, padding: 14, alignItems: "center", marginTop: 6 },
  btnText: { fontWeight: "700", fontSize: 15 },
});
