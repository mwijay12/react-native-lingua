import { isAvailableLanguage } from "@/data/languages";
import { useLanguageStore } from "@/store/languageStore";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

// Demo access is local only; there is no account or authentication.
export default function DemoIndex() {
  const selectedLanguage = useLanguageStore((state) => state.selectedLanguage);
  const [hydrated, setHydrated] = useState(useLanguageStore.persist.hasHydrated());

  useEffect(() => {
    const unsubscribe = useLanguageStore.persist.onFinishHydration(() =>
      setHydrated(true),
    );
    if (useLanguageStore.persist.hasHydrated()) setHydrated(true);
    return unsubscribe;
  }, []);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#6c4ef5" />
      </View>
    );
  }

  if (isAvailableLanguage(selectedLanguage)) return <Redirect href="/(tabs)" />;
  if (selectedLanguage !== null) return <Redirect href="/language-select" />;
  return <Redirect href="/onboarding" />;
}
