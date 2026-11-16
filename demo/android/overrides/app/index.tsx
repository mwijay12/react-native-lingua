import { LearningHydrationScreen } from "@/components/LearningHydrationScreen";
import { isAvailableLanguage } from "@/data/languages";
import { useLanguageHydrationStatus, useLanguageStore } from "@/store/languageStore";
import { Redirect } from "expo-router";

// Demo access is local only; there is no account or authentication.
export default function DemoIndex() {
  const selectedLanguage = useLanguageStore((state) => state.selectedLanguage);
  const languageHydration = useLanguageHydrationStatus((state) => state.status);

  if (languageHydration !== "ready") return <LearningHydrationScreen status={languageHydration} storage="course" />;
  if (isAvailableLanguage(selectedLanguage)) return <Redirect href="/(tabs)" />;
  if (selectedLanguage !== null) return <Redirect href="/language-select" />;
  return <Redirect href="/onboarding" />;
}
