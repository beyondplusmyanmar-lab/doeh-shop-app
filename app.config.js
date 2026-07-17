const shop = require("./shop.config.json");

// Per-environment overlay: the committed shop.config.json carries the sandbox
// clone; a build environment (EAS env vars, EXPO_PUBLIC_*) can re-point the
// shop plane without touching the tree — production values live on EAS only.
const env = process.env;
const overlaid = {
  ...shop,
  shopCode: env.EXPO_PUBLIC_SHOP_CODE ?? shop.shopCode,
  environment: env.EXPO_PUBLIC_SHOP_ENVIRONMENT ?? shop.environment,
  edgeApiBase: env.EXPO_PUBLIC_EDGE_API_BASE ?? shop.edgeApiBase,
  publishableKey: env.EXPO_PUBLIC_PUBLISHABLE_KEY ?? shop.publishableKey,
  auth: {
    ...shop.auth,
    issuer: env.EXPO_PUBLIC_AUTH_ISSUER ?? shop.auth.issuer,
    clientId: env.EXPO_PUBLIC_AUTH_CLIENT_ID ?? shop.auth.clientId,
  },
};

module.exports = {
  expo: {
    name: overlaid.brand.name,
    slug: "doeh-shop-app",
    owner: "bplus123",
    scheme: "shoployalty",
    version: "0.1.0",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    android: { package: "com.doehpos.shoployalty" },
    plugins: ["expo-router"],
    extra: { shop: overlaid, eas: { projectId: "80a12e75-a406-47c3-a325-c59c97f17ea5" } },
    web: { bundler: "metro", output: "server" },
  },
};
