import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { BRAND } from "@/config/shop";
export default function Root() {
  return (<>
    <StatusBar style="light" />
    <Stack screenOptions={{ headerStyle: { backgroundColor: "#2A1E14" }, headerTintColor: "#F5EFE7", contentStyle: { backgroundColor: "#1A120B" } }}>
      <Stack.Screen name="index" options={{ title: BRAND.name }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="book" options={{ title: "New booking", presentation: "modal" }} />
    </Stack>
  </>);
}
