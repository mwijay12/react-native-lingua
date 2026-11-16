import { useAuth } from "@clerk/expo";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { LearningHydrationScreen } from "@/components/LearningHydrationScreen";
import { isAvailableLanguage } from "@/data/languages";
import { useLanguageHydrationStatus, useLanguageStore } from "@/store/languageStore";

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();
  const selectedLanguage = useLanguageStore((state) => state.selectedLanguage);
  const languageHydration = useLanguageHydrationStatus((state) => state.status);

  if (languageHydration !== "ready") return <LearningHydrationScreen status={languageHydration} storage="course" />;
  if (!isLoaded) {
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
