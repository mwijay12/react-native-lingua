import { isAvailableLanguage, LANGUAGES } from "@/data/languages";
import { posthog } from "@/lib/posthog";
import { useLanguageStore } from "@/store/languageStore";
import { Language, LanguageCode } from "@/types/learning";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LanguageSelectScreen() {
  const { selectedLanguage, setSelectedLanguage } = useLanguageStore();
  const [selectedCode, setSelectedCode] = useState<LanguageCode>(
    isAvailableLanguage(selectedLanguage) ? selectedLanguage : LANGUAGES[0].code,
  );
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const filtered = LANGUAGES.filter((language) =>
    `${language.name} ${language.nativeName}`.toLowerCase().includes(query),
  );
  const selectionVisible = filtered.some((language) => language.code === selectedCode);
  const hasOldSelection = selectedLanguage !== null && !isAvailableLanguage(selectedLanguage);

  const renderItem = ({ item }: { item: Language }) => {
    const isSelected = item.code === selectedCode;
    return (
      <TouchableOpacity
        onPress={() => setSelectedCode(item.code)}
        className={`flex-row items-center py-3.5 px-4 border rounded-[20px] ${isSelected ? "bg-lingua-mint border-[#9BCDC0]" : "bg-white border-border"}`}
        activeOpacity={0.8}
        accessibilityRole="radio"
        accessibilityState={{ selected: isSelected }}
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
      <View className="flex-row items-center px-4 py-3">
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
        <Text className="font-poppins-semibold text-[10px] tracking-[1.2px] text-lingua-teal mb-2">YOUR COURSE, YOUR PACE</Text>
        <Text className="body-sm text-text-secondary mb-3">Pick a course. Menus and instructions are in English.</Text>
        {hasOldSelection && (
          <Text className="body-sm text-text-secondary mb-3" testID="legacy-language-message">
            Your previous course is not available in this version. Choose a course to continue; your saved lesson history stays on this device.
          </Text>
        )}
        <View className="flex-row items-center bg-white border border-border rounded-2xl px-4 py-3">
          <Ionicons name="search-outline" size={18} color="#80918A" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search languages"
            placeholderTextColor="#80918A"
            accessibilityLabel="Search languages"
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
        <TouchableOpacity
          className={`rounded-2xl items-center py-4 ${selectionVisible ? "bg-lingua-teal" : "bg-[#9EBDB5]"}`}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityState={{ disabled: !selectionVisible }}
          disabled={!selectionVisible}
          testID="language-confirm-button"
          onPress={() => {
            const selected = LANGUAGES.find((language) => language.code === selectedCode);
            if (!selected) return;
            posthog.capture("language_selected", {
              language_code: selected.code,
              language_name: selected.name,
            });
            setSelectedLanguage(selected.code);
            if (isAvailableLanguage(selectedLanguage) && router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)");
            }
          }}
        >
          <Text className="font-poppins-semibold text-base text-white">Continue</Text>
        </TouchableOpacity>
        <Text className="caption text-center mt-2">You can switch courses anytime.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flag: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: "#E4E9DF" },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: "#183B37",
    padding: 0,
  },
  listContent: { paddingHorizontal: 20, paddingBottom: 12 },
});
