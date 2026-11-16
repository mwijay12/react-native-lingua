import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLearningStore, type LearningHydrationStatus } from "@/store/learningStore";

// A failed read is not a new empty profile. Keep progress actions blocked and
// let the learner retry without deleting or overwriting the saved value.
export function LearningHydrationScreen({ status }: { status: Exclude<LearningHydrationStatus, "ready"> }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FBF8F1" }}>
      <View className="flex-1 items-center justify-center px-8">
        {status === "loading" ? (
          <>
            <ActivityIndicator size="large" color="#14675D" />
            <Text className="body-sm text-text-secondary text-center mt-4">Loading your progress…</Text>
          </>
        ) : (
          <View className="items-center" accessibilityLiveRegion="polite">
            <Text className="h3 text-center">Progress could not be loaded</Text>
            <Text className="body-md text-text-secondary text-center mt-3">
              Check your device storage and try again. Your saved progress has not been reset.
            </Text>
            <TouchableOpacity
              className="bg-lingua-teal rounded-2xl px-6 py-4 mt-6"
              accessibilityRole="button"
              onPress={() => { void useLearningStore.persist.rehydrate(); }}
              testID="retry-learning-hydration"
            >
              <Text className="font-poppins-semibold text-base text-white">Try again</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
