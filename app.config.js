const shop = require("./shop.config.json");
module.exports = {
  expo: {
    name: shop.brand.name,
    slug: "doeh-shop-app",
    owner: "bplus123",
    scheme: "shoployalty",
    version: "0.1.0",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    android: { package: "com.doehpos.shoployalty" },
    plugins: ["expo-router"],
    extra: { shop, eas: { projectId: "80a12e75-a406-47c3-a325-c59c97f17ea5" } },
    web: { bundler: "metro", output: "server" },
  },
};
