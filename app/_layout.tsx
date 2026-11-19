import "../global.css";

import { LaunchGate } from "@/components/LaunchSplash";
import { LearningHydrationScreen } from "@/components/LearningHydrationScreen";
import { PendingSaveBanner } from "@/components/PendingSaveBanner";
import { posthog } from "@/lib/posthog";
import { useLanguageHydrationStatus, useLanguageStore } from "@/store/languageStore";
import { ClerkProvider, useUser } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { useFonts } from "expo-font";
import { Stack, useGlobalSearchParams, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { PostHogProvider } from "posthog-react-native";
import { useEffect, useRef } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error("Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to your .env file");
}

SplashScreen.preventAutoHideAsync();

function ClerkIdentifier() {
  const { isSignedIn, user, isLoaded } = useUser();
  const { selectedLanguage } = useLanguageStore();
  const userId = user?.id;

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return;
    posthog.identify(userId, {
      $set_once: { signup_date: new Date().toISOString() },
      $set: { preferred_language: selectedLanguage ?? null },
    });
  }, [isLoaded, isSignedIn, userId, selectedLanguage]);

  return null;
}

export default function RootLayout() {
  const languageHydration = useLanguageHydrationStatus((state) => state.status);
  const [fontsLoaded, fontError] = useFonts({
    "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
  });

  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const previousPathname = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      posthog.screen(pathname, {
        previous_screen: previousPathname.current ?? null,
        ...params,
      });
      previousPathname.current = pathname;
    }
  }, [pathname, params]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <PostHogProvider
      client={posthog}
      debug={__DEV__}
      autocapture={{
        captureScreens: true,
        // Do not collect touch events while the private chat screen is active.
        captureTouches: !/^\/chat(?:\/|$)/.test(pathname),
        propsToCapture: ["testID"],
        maxElementsCaptured: 20,
      }}
    >
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <SafeAreaProvider>
          <LaunchGate>
            {languageHydration !== "ready" ? (
              <LearningHydrationScreen status={languageHydration} storage="course" />
            ) : (
              <View className="flex-1">
                <ClerkIdentifier />
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="onboarding" />
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="language-select" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="lesson/[id]" />
                  <Stack.Screen name="review" />
                  <Stack.Screen name="play" />
                </Stack>
                <PendingSaveBanner />
              </View>
            )}
          </LaunchGate>
        </SafeAreaProvider>
      </ClerkProvider>
    </PostHogProvider>
  );
}
