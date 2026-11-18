import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLanguageHydrationStatus, useLanguageStore, type LanguageHydrationStatus } from "@/store/languageStore";
import { useLearningHydrationStatus, useLearningStore, type LearningHydrationStatus } from "@/store/learningStore";
import { usePlayHydrationStatus, usePlayStore, type PlayHydrationStatus } from "@/store/playStore";

// A failed read is not a new empty profile. Keep actions blocked and let the
// learner retry without deleting or overwriting the saved value.
export function LearningHydrationScreen({ status, storage = "progress", onBack }: {
  status: Exclude<LearningHydrationStatus | LanguageHydrationStatus | PlayHydrationStatus, "ready">;
  storage?: "progress" | "course" | "play";
  onBack?: () => void;
}) {
  const learningReason = useLearningHydrationStatus((state) => state.reason);
  const languageReason = useLanguageHydrationStatus((state) => state.reason);
  const playReason = usePlayHydrationStatus((state) => state.reason);
  const reason = storage === "course" ? languageReason : storage === "progress" ? learningReason : playReason;
  const label = storage === "course" ? "course" : storage === "play" ? "play rewards" : "progress";
  const title = storage === "course" ? "Course" : storage === "play" ? "Play rewards" : "Progress";
  const message = reason === "newer"
    ? `Your ${label} was saved by a newer app version. Update Lingua or reopen that version; do not uninstall, as that can remove local data.`
    : reason === "corrupt"
      ? `The saved ${label} has an unexpected or damaged format. It has not been reset by this app. Keep the app installed and seek help if retrying does not work.`
      : reason === "migration"
        ? `Your ${label} was read, but its update could not be saved. Check device storage and retry. Keep the app installed to protect local data.`
        : `Check your device storage and try again. We have not reset your ${label}. Uninstalling can remove local data.`;
  const testID = storage === "course" ? "retry-language-hydration" : storage === "play" ? "retry-play-hydration" : "retry-learning-hydration";
  const retry = () => {
    if (storage === "course") void useLanguageStore.persist.rehydrate();
    else if (storage === "play") void usePlayStore.persist.rehydrate();
    else void useLearningStore.persist.rehydrate();
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FBF8F1" }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 32, paddingVertical: 24 }}>
        {status === "loading" ? (
          <View className="items-center">
            <ActivityIndicator size="large" color="#14675D" />
            <Text className="body-sm text-text-secondary text-center mt-4">Loading your {label}…</Text>
          </View>
        ) : (
          <View className="items-center" accessibilityLiveRegion="polite">
            <Text className="h3 text-center">{title} could not be loaded</Text>
            <Text className="body-md text-text-secondary text-center mt-3" testID="hydration-error-message">
              {message}
            </Text>
            <TouchableOpacity
              className="bg-lingua-teal rounded-2xl px-6 py-4 mt-6"
              accessibilityRole="button"
              onPress={retry}
              testID={testID}
            >
              <Text className="font-poppins-semibold text-base text-white">Try again</Text>
            </TouchableOpacity>
            {onBack && (
              <TouchableOpacity
                className="border border-lingua-teal rounded-2xl px-6 py-4 mt-3"
                accessibilityRole="button"
                onPress={onBack}
                testID="hydration-back-button"
              >
                <Text className="font-poppins-semibold text-base text-lingua-teal">Back to learning</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
