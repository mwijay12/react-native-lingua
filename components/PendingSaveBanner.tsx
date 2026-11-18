import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { retryAudioSettingsSave, useAudioSettingsHydration, useAudioSettingsSaveStatus } from "@/store/audioSettingsStore";
import { retryLanguageSave, useLanguageHydrationStatus, useLanguageSaveStatus } from "@/store/languageStore";
import { retryLearningSave, useLearningHydrationStatus, useLearningSaveStatus } from "@/store/learningStore";
import { retryPlaySave, usePlayHydrationStatus, usePlaySaveStatus } from "@/store/playStore";

// Keep unsaved work visible even if the learner leaves the lesson, game or
// settings screen. Retrying writes a snapshot, not another learning event.
export function PendingSaveBanner() {
  const learningHydration = useLearningHydrationStatus((state) => state.status);
  const learningSave = useLearningSaveStatus((state) => state.status);
  const languageHydration = useLanguageHydrationStatus((state) => state.status);
  const languageSave = useLanguageSaveStatus((state) => state.status);
  const playHydration = usePlayHydrationStatus((state) => state.status);
  const playSave = usePlaySaveStatus((state) => state.status);
  const audioHydration = useAudioSettingsHydration((state) => state.status);
  const audioSave = useAudioSettingsSaveStatus((state) => state.status);

  const notices: {
    id: string;
    saving: boolean;
    pending: string;
    failed: string;
    risk: string;
    retryLabel: string;
    retryId: string;
    retry: () => void;
  }[] = [];
  if (learningHydration === "ready" && (learningSave === "saving" || learningSave === "error")) notices.push({
    id: "progress", saving: learningSave === "saving", pending: "Saving progress…", failed: "Progress is not saved yet.",
    risk: "recent changes", retryLabel: "Retry saving progress", retryId: "retry-learning-save", retry: () => { void retryLearningSave(); },
  });
  if (languageHydration === "ready" && (languageSave === "saving" || languageSave === "error")) notices.push({
    id: "course", saving: languageSave === "saving", pending: "Saving course…", failed: "Course selection is not saved yet.",
    risk: "your selection", retryLabel: "Retry saving course selection", retryId: "retry-language-save", retry: () => { void retryLanguageSave(); },
  });
  if (playHydration === "ready" && (playSave === "saving" || playSave === "error")) notices.push({
    id: "play", saving: playSave === "saving", pending: "Saving play rewards…", failed: "Play rewards are not saved yet.",
    risk: "recent rewards", retryLabel: "Retry saving play rewards", retryId: "retry-play-save-global", retry: retryPlaySave,
  });
  if (audioHydration === "ready" && (audioSave === "saving" || audioSave === "error")) notices.push({
    id: "sound", saving: audioSave === "saving", pending: "Saving sound settings…", failed: "Sound settings are not saved yet.",
    risk: "your sound choice", retryLabel: "Retry saving sound settings", retryId: "retry-sound-save-global", retry: retryAudioSettingsSave,
  });

  if (!notices.length) return null;

  return (
    <SafeAreaView edges={["bottom"]} style={{ backgroundColor: "#FFF1E8" }}>
      <ScrollView style={{ flexGrow: 0, maxHeight: 200 }} keyboardShouldPersistTaps="handled">
        <View className="px-4 py-2 border-t border-[#E6D9B7]" accessibilityLiveRegion="polite">
          {notices.map((notice, index) => (
            <View key={notice.id} className={`flex-row items-center ${index ? "mt-2" : ""}`} testID={`${notice.id}-save-notice`}>
              <View className="flex-1 pr-2">
                <Text className="font-poppins-semibold text-sm text-text-primary">
                  {notice.saving ? notice.pending : notice.failed}
                </Text>
                <Text className="caption">
                  {notice.saving ? "Keep the app open until saving finishes." : `Keep the app open; ${notice.risk} could be lost if it closes.`}
                </Text>
              </View>
              {!notice.saving && (
                <TouchableOpacity onPress={notice.retry} accessibilityRole="button" accessibilityLabel={notice.retryLabel} className="min-h-12 justify-center px-3" testID={notice.retryId}>
                  <Text className="font-poppins-semibold text-sm text-lingua-teal">Retry</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
