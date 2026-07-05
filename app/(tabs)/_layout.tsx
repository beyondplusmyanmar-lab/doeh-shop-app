import { Tabs } from "expo-router";
import { Text } from "react-native";
import { c } from "@/components/ui";
const icon = (e: string) => ({ color }: { color: string }) => <Text style={{ fontSize: 17, color }}>{e}</Text>;
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerStyle: { backgroundColor: "#2A1E14" }, headerTintColor: "#F5EFE7",
      tabBarStyle: { backgroundColor: "#2A1E14", borderTopColor: "#3a2a1c" },
      tabBarActiveTintColor: c.primary, tabBarInactiveTintColor: "#9c8a72",
    }}>
      <Tabs.Screen name="loyalty" options={{ title: "Rewards", tabBarIcon: icon("🎁") }} />
      <Tabs.Screen name="promotions" options={{ title: "Offers", tabBarIcon: icon("🏷️") }} />
      <Tabs.Screen name="coupons" options={{ title: "Coupons", tabBarIcon: icon("🎟️") }} />
      <Tabs.Screen name="bookings" options={{ title: "Bookings", tabBarIcon: icon("📅") }} />
      <Tabs.Screen name="qr" options={{ title: "My QR", tabBarIcon: icon("🔳") }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: icon("👤") }} />
    </Tabs>
  );
}
