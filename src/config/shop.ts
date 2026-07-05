import Constants from "expo-constants";
// The single-shop config IS the key: one shopCode + environment per clone.
const shop = (Constants.expoConfig?.extra as any)?.shop ?? require("../../shop.config.json");
export const SHOP = shop as { shopCode: string; environment: string; apiBase: string; edgeApiBase?: string; publishableKey?: string; brand: { name: string; primary: string } };
export const SHOP_CODE = SHOP.shopCode;
export const API_BASE = SHOP.apiBase;
export const BRAND = SHOP.brand;
