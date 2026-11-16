import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLanguageStore, type LanguageHydrationStatus } from "@/store/languageStore";
import { useLearningStore, type LearningHydrationStatus } from "@/store/learningStore";
import { usePlayStore, type PlayHydrationStatus } from "@/store/playStore";

// A failed read is not a new empty profile. Keep actions blocked and let the
// learner retry without deleting or overwriting the saved value.
export function LearningHydrationScreen({ status, storage = "progress", onBack }: {
  status: Exclude<LearningHydrationStatus | LanguageHydrationStatus | PlayHydrationStatus, "ready">;
  storage?: "progress" | "course" | "play";
  onBack?: () => void;
}) {
  const label = storage === "course" ? "course" : storage === "play" ? "play rewards" : "progress";
  const title = storage === "course" ? "Course" : storage === "play" ? "Play rewards" : "Progress";
  const testID = storage === "course" ? "retry-language-hydration" : storage === "play" ? "retry-play-hydration" : "retry-learning-hydration";
  const retry = () => {
    if (storage === "course") void useLanguageStore.persist.rehydrate();
    else if (storage === "play") void usePlayStore.persist.rehydrate();
    else void useLearningStore.persist.rehydrate();
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FBF8F1" }}>
      <View className="flex-1 items-center justify-center px-8">
        {status === "loading" ? (
          <>
            <ActivityIndicator size="large" color="#14675D" />
            <Text className="body-sm text-text-secondary text-center mt-4">Loading your {label}…</Text>
          </>
        ) : (
          <View className="items-center" accessibilityLiveRegion="polite">
            <Text className="h3 text-center">{title} could not be loaded</Text>
            <Text className="body-md text-text-secondary text-center mt-3">
              Check your device storage and try again. Your saved {label} has not been reset.
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
      </View>
    </SafeAreaView>
  );
}
