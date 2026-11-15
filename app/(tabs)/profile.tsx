import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AccountControls } from "@/components/AccountControls";
import { CREATOR_CREDIT } from "@/constants/branding";
import { LANGUAGES } from "@/data/languages";
import { useLanguageStore } from "@/store/languageStore";
import { useLearningStore } from "@/store/learningStore";

export default function ProfileScreen() {
  const selectedLanguage = useLanguageStore((state) => state.selectedLanguage);
  const { totalXp, completedLessonIds } = useLearningStore();
  const language = LANGUAGES.find((item) => item.code === selectedLanguage);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text className="h2">Profile</Text>
        <Text className="body-md text-text-secondary mt-2">Your learning, at a glance.</Text>

        <View className="rounded-2xl bg-[#F3F0FF] p-5 mt-5">
          <Text className="caption">CURRENT COURSE</Text>
          <View className="flex-row items-center mt-3">
            {language && <Image source={language.flag} style={styles.flag} />}
            <View className="flex-1">
              <Text className="font-poppins-semibold text-lg text-text-primary">{language?.name ?? "No course selected"}</Text>
              <Text className="body-sm text-text-secondary">Instructions in English</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push("/language-select")} className="bg-white rounded-xl items-center py-3 mt-4" accessibilityRole="button" testID="change-language-button">
            <Text className="font-poppins-semibold text-sm text-lingua-purple">Change language</Text>
          </TouchableOpacity>
        </View>

        <Text className="font-poppins-semibold text-base text-text-primary mt-6 mb-3">Your progress</Text>
        <View className="flex-row gap-3">
          <View className="flex-1 rounded-2xl border border-border p-4">
            <Ionicons name="star" size={21} color="#F59E0B" />
            <Text className="font-poppins-bold text-xl text-text-primary mt-2" testID="profile-total-xp">{totalXp} XP</Text>
            <Text className="body-sm text-text-secondary">Total earned</Text>
          </View>
          <View className="flex-1 rounded-2xl border border-border p-4">
            <Ionicons name="checkmark-circle" size={21} color="#21A96B" />
            <Text className="font-poppins-bold text-xl text-text-primary mt-2" testID="profile-completed-count">{completedLessonIds.length}</Text>
            <Text className="body-sm text-text-secondary">Lessons completed</Text>
          </View>
        </View>
        <Text className="caption mt-3">Progress is saved on this device and is not synced to an account.</Text>

        <View className="mt-6 rounded-2xl border border-border bg-white p-5">
          <Text className="font-poppins-semibold text-base text-text-primary">About Lingua</Text>
          <Text className="body-sm text-text-secondary mt-1" testID="profile-creator-credit">{CREATOR_CREDIT}</Text>
          <Text className="body-sm text-text-secondary mt-2">A small start for learning languages, one lesson at a time.</Text>
        </View>
        <AccountControls />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 36 },
  flag: { width: 44, height: 44, borderRadius: 22, marginRight: 12, borderWidth: 1, borderColor: "#e5e7eb" },
});
