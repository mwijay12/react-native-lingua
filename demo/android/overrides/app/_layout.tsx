import "../global.css";

import { LearningHydrationScreen } from "@/components/LearningHydrationScreen";
import { PendingSaveBanner } from "@/components/PendingSaveBanner";
import { useLanguageHydrationStatus } from "@/store/languageStore";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

// This layout is only copied into the isolated Android demo project.
export default function DemoRootLayout() {
  const languageHydration = useLanguageHydrationStatus((state) => state.status);
  const [fontsLoaded, fontError] = useFonts({
    "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#104F49" }}>
        <View className="items-center px-3 py-2">
          <Text className="text-center text-xs text-white font-poppins-semibold">
            DEMO · Sign-in and AI voice are disabled
          </Text>
        </View>
      </SafeAreaView>
      <View style={{ flex: 1, backgroundColor: "#FBF8F1" }}>
        {languageHydration !== "ready" ? (
          <LearningHydrationScreen status={languageHydration} storage="course" />
        ) : (
          <>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="language-select" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="lesson/[id]" />
              <Stack.Screen name="review" />
              <Stack.Screen name="play" />
            </Stack>
            <PendingSaveBanner />
          </>
        )}
      </View>
    </SafeAreaProvider>
  );
}
