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
    // Hydration can finish between the initial render and this subscription.
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

  return <Redirect href={selectedLanguage ? "/(tabs)" : "/onboarding"} />;
}
