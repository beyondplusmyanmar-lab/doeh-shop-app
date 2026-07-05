import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
// SecureStore is native-only; on web it throws. Guarded shim -> localStorage on web.
const K = "ssl.token";
export const session = {
  async get(): Promise<string | null> {
    try { if (Platform.OS === "web") return globalThis.localStorage?.getItem(K) ?? null; return await SecureStore.getItemAsync(K); } catch { return null; }
  },
  async set(v: string): Promise<void> {
    try { if (Platform.OS === "web") globalThis.localStorage?.setItem(K, v); else await SecureStore.setItemAsync(K, v); } catch {}
  },
  async clear(): Promise<void> {
    try { if (Platform.OS === "web") globalThis.localStorage?.removeItem(K); else await SecureStore.deleteItemAsync(K); } catch {}
  },
};
