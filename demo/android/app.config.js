// Standalone, non-production variant. No Clerk, Stream or analytics keys.
module.exports = {
  expo: {
    name: "Lingua Demo",
    slug: "lingua-android-demo",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "linguademo",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    android: {
      package: "com.jsmastery.duolingoclone.demo",
      adaptiveIcon: {
        backgroundColor: "#155F57",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      edgeToEdgeEnabled: true,
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#155F57",
        },
      ],
      ["expo-build-properties", { android: { minSdkVersion: 24 } }],
    ],
    experiments: { typedRoutes: true },
  },
};
