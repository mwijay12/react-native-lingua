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
      // Audio is playback only; the demo must not ask for microphone access.
      blockedPermissions: ["android.permission.RECORD_AUDIO"],
      adaptiveIcon: {
        backgroundColor: "#155F57",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      edgeToEdgeEnabled: true,
    },
    plugins: [
      "./plugins/with-safe-storage.cjs",
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
