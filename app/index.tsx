import { useAuth } from "@clerk/expo";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { isAvailableLanguage } from "@/data/languages";
import { useLanguageStore } from "@/store/languageStore";

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();
  const { selectedLanguage } = useLanguageStore();
  const [languageHydrated, setLanguageHydrated] = useState(
    useLanguageStore.persist.hasHydrated(),
  );

  useEffect(() => {
    const unsubscribe = useLanguageStore.persist.onFinishHydration(() =>
      setLanguageHydrated(true),
    );
    // Hydration may finish between the initial render and subscribing.
    if (useLanguageStore.persist.hasHydrated()) setLanguageHydrated(true);
    return unsubscribe;
  }, []);

  if (!isLoaded || !languageHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#14675D" />
      </View>
    );
  }
  if (!isSignedIn) return <Redirect href="/onboarding" />;
  if (!isAvailableLanguage(selectedLanguage)) return <Redirect href="/language-select" />;
  return <Redirect href="/(tabs)" />;
}
