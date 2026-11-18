import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { retryLanguageSave, useLanguageHydrationStatus, useLanguageSaveStatus } from "@/store/languageStore";
import { retryLearningSave, useLearningHydrationStatus, useLearningSaveStatus } from "@/store/learningStore";

// Keep unsaved work visible even if the learner leaves the lesson or settings
// screen. The retry buttons write snapshots, not another learning event.
export function PendingSaveBanner() {
  const learningHydration = useLearningHydrationStatus((state) => state.status);
  const learningSave = useLearningSaveStatus((state) => state.status);
  const languageHydration = useLanguageHydrationStatus((state) => state.status);
  const languageSave = useLanguageSaveStatus((state) => state.status);
  const showProgress = learningHydration === "ready" && (learningSave === "saving" || learningSave === "error");
  const showCourse = languageHydration === "ready" && (languageSave === "saving" || languageSave === "error");

  if (!showProgress && !showCourse) return null;

  return (
    <SafeAreaView edges={["bottom"]} style={{ backgroundColor: "#FFF1E8" }}>
      <View className="px-4 py-2 border-t border-[#E6D9B7]" accessibilityLiveRegion="polite">
        {showProgress && (
          <View className="flex-row items-center" testID="progress-save-notice">
            <View className="flex-1 pr-2">
              <Text className="font-poppins-semibold text-sm text-text-primary">
                {learningSave === "saving" ? "Saving progress…" : "Progress is not saved yet."}
              </Text>
              <Text className="caption">
                {learningSave === "saving" ? "Keep the app open until saving finishes." : "Keep the app open; recent changes could be lost if it closes."}
              </Text>
            </View>
            {learningSave === "error" && (
              <TouchableOpacity onPress={() => { void retryLearningSave(); }} accessibilityRole="button" accessibilityLabel="Retry saving progress" className="min-h-12 justify-center px-3" testID="retry-learning-save">
                <Text className="font-poppins-semibold text-sm text-lingua-teal">Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        {showCourse && (
          <View className={`flex-row items-center ${showProgress ? "mt-2" : ""}`} testID="course-save-notice">
            <View className="flex-1 pr-2">
              <Text className="font-poppins-semibold text-sm text-text-primary">
                {languageSave === "saving" ? "Saving course…" : "Course selection is not saved yet."}
              </Text>
              <Text className="caption">
                {languageSave === "saving" ? "Keep the app open until saving finishes." : "Keep the app open; your selection could be lost if it closes."}
              </Text>
            </View>
            {languageSave === "error" && (
              <TouchableOpacity onPress={() => { void retryLanguageSave(); }} accessibilityRole="button" accessibilityLabel="Retry saving course selection" className="min-h-12 justify-center px-3" testID="retry-language-save">
                <Text className="font-poppins-semibold text-sm text-lingua-teal">Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
