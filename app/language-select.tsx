import { MotionSticker } from "@/components/MotionSticker";
import { isAvailableLanguage, LANGUAGES } from "@/data/languages";
import { posthog } from "@/lib/posthog";
import { useLanguageHydrationStatus, useLanguageSaveStatus, useLanguageStore } from "@/store/languageStore";
import { Language, LanguageCode } from "@/types/learning";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LanguageSelectScreen() {
  const { height } = useWindowDimensions();
  const compact = height < 650;
  const { selectedLanguage, setSelectedLanguage } = useLanguageStore();
  const saveStatus = useLanguageSaveStatus((state) => state.status);
  const [returnToPrevious] = useState(() => isAvailableLanguage(selectedLanguage) && router.canGoBack());
  const pendingConfirmation = useRef(false);
  const [confirmation, setConfirmation] = useState<{ code: LanguageCode; name: string } | null>(null);
  const [selectedCode, setSelectedCode] = useState<LanguageCode>(
    isAvailableLanguage(selectedLanguage) ? selectedLanguage : LANGUAGES[0].code,
  );
  const [search, setSearch] = useState("");

  // Stay on this screen until storage acknowledges the selected course. A
  // retry only writes the current selection, so analytics/navigation run once.
  useEffect(() => {
    if (!pendingConfirmation.current || !confirmation || saveStatus !== "saved"
      || useLanguageHydrationStatus.getState().status !== "ready"
      || useLanguageSaveStatus.getState().status !== "saved"
      || useLanguageStore.getState().selectedLanguage !== confirmation.code) return;
    pendingConfirmation.current = false;
    try {
      posthog.capture("language_selected", {
        language_code: confirmation.code,
        language_name: confirmation.name,
      });
    } catch {
      // Analytics must not prevent navigation after a successful local save.
    }
    if (returnToPrevious && router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  }, [confirmation, returnToPrevious, saveStatus]);
  const query = search.trim().toLowerCase();
  const filtered = LANGUAGES.filter((language) =>
    `${language.name} ${language.nativeName}`.toLowerCase().includes(query),
  );
  const selectionVisible = filtered.some((language) => language.code === selectedCode);
  const selectionBusy = saveStatus === "saving";
  const canConfirm = selectionVisible && !selectionBusy;
  const hasOldSelection = selectedLanguage !== null && !isAvailableLanguage(selectedLanguage);

  const renderItem = ({ item }: { item: Language }) => {
    const isSelected = item.code === selectedCode;
    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedCode(item.code);
          if (confirmation && item.code !== confirmation.code) {
            // Retry still saves the last confirmed snapshot, not this draft.
            pendingConfirmation.current = false;
            setConfirmation(null);
          }
        }}
        disabled={selectionBusy}
        className={`flex-row items-center px-4 border rounded-[20px] ${compact ? "py-2" : "py-3.5"} ${isSelected ? "bg-lingua-mint border-[#9BCDC0]" : "bg-white border-border"}`}
        activeOpacity={0.8}
        accessibilityRole="radio"
        accessibilityState={{ checked: isSelected, disabled: selectionBusy }}
        aria-checked={isSelected}
        accessibilityLabel={item.name}
        testID={`language-option-${item.code}`}
      >
        <Image source={item.flag} style={styles.flag} />
        <View className="flex-1 ml-3">
          <Text className="font-poppins-semibold text-base text-text-primary">{item.name}</Text>
          <Text className="body-sm text-text-secondary">{item.code === "en" ? "Beginner course" : item.nativeName}</Text>
        </View>
        {isSelected ? (
          <View className="w-7 h-7 rounded-full bg-lingua-teal items-center justify-center">
            <Ionicons name="checkmark" size={16} color="#fff" />
          </View>
        ) : (
          <Ionicons name="arrow-forward" size={19} color="#80918A" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FBF8F1" }}>
      <View className="flex-1 w-full max-w-[640px] self-center">
        <View className={`flex-row items-center px-4 ${compact ? "py-2" : "py-3"}`}>
          <TouchableOpacity
            onPress={() => router.canGoBack() ? router.back() : router.replace("/onboarding")}
            className="w-10 h-10 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={24} color="#183B37" />
          </TouchableOpacity>
          <Text className="flex-1 text-center font-poppins-semibold text-lg text-text-primary">Choose a language</Text>
          <View className="w-10" />
        </View>

        <View className="px-5 mb-3">
          <View className={`flex-row items-center ${compact ? "mb-2" : "mb-3"}`}>
            <View className="flex-1 pr-2">
              <Text className="font-poppins-semibold text-[10px] tracking-[1.2px] text-lingua-teal mb-2">YOUR COURSE, YOUR PACE</Text>
              <Text className="body-sm text-text-secondary">Pick a course. Menus and instructions are in English.</Text>
            </View>
            <MotionSticker kind="globe" size={compact ? 48 : 62} testID="language-sticker" />
          </View>
          {hasOldSelection && (
            <Text className="body-sm text-text-secondary mb-3" testID="legacy-language-message">
              Your previous course is not available in this version. Choose a course to continue; lesson history is kept separately.
            </Text>
          )}
          <View className="flex-row items-center bg-white border border-border rounded-2xl px-4 py-3">
            <Ionicons name="search-outline" size={18} color="#80918A" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search languages"
              placeholderTextColor="#526860"
              accessibilityLabel="Search languages"
              editable={!selectionBusy}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        <Text className="px-5 font-poppins-semibold text-base text-text-primary mb-3">Beginner courses</Text>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.code}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View className="h-2" />}
          ListEmptyComponent={<Text className="body-sm text-text-secondary py-4">No matching courses found.</Text>}
          keyboardShouldPersistTaps="handled"
        />

        <View className="px-5 pt-3 pb-4">
          {saveStatus === "error" && (
            <Text className="body-sm text-text-secondary text-center mb-2" accessibilityLiveRegion="polite" testID="language-save-error">
              Your last confirmed course is not saved yet. Retry below, or choose another course and press Continue. Keep the app open.
            </Text>
          )}
          <TouchableOpacity
            className={`rounded-2xl items-center py-4 ${canConfirm ? "bg-lingua-teal" : "bg-[#9EBDB5]"}`}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canConfirm }}
            disabled={!canConfirm}
            testID="language-confirm-button"
            onPress={() => {
              // Read the store synchronously as well, preventing a double tap
              // before React has rendered the disabled button.
              if (useLanguageHydrationStatus.getState().status !== "ready"
                || useLanguageSaveStatus.getState().status === "saving") return;
              const selected = LANGUAGES.find((language) => language.code === selectedCode);
              if (!selected) return;
              pendingConfirmation.current = true;
              setSelectedLanguage(selected.code);
              setConfirmation({ code: selected.code, name: selected.name });
            }}
          >
            <Text className="font-poppins-semibold text-base text-white">{selectionBusy ? "Saving course…" : "Continue"}</Text>
          </TouchableOpacity>
          <Text className="caption text-center mt-2">You can switch courses anytime.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flag: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: "#E4E9DF" },
  searchInput: {
    flex: 1,
    minWidth: 0,
    marginLeft: 8,
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: "#183B37",
    padding: 0,
  },
  listContent: { paddingHorizontal: 20, paddingBottom: 12 },
});
