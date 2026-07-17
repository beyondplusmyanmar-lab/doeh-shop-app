const shop = require("./shop.config.json");
module.exports = {
  expo: {
    name: shop.brand.name,
    slug: "doeh-shop-app",
    scheme: "shoployalty",
    version: "0.1.0",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    android: { package: "com.doehpos.shoployalty" },
    plugins: ["expo-router"],
    extra: { shop },
    web: { bundler: "metro", output: "server" },
  },
};
