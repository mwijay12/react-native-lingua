import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AccountControls } from "@/components/AccountControls";
import { LearningHydrationScreen } from "@/components/LearningHydrationScreen";
import { MotionSticker } from "@/components/MotionSticker";
import { SoundEffectsControl } from "@/components/SoundEffectsControl";
import { CREATOR_CREDIT } from "@/constants/branding";
import { getCourseUnits } from "@/data/courses";
import { LANGUAGES } from "@/data/languages";
import { useLearningHydration } from "@/hooks/useLearningHydration";
import { useLanguageStore } from "@/store/languageStore";
import { useLearningStore } from "@/store/learningStore";

export default function ProfileScreen() {
  const hydration = useLearningHydration();
  const selectedLanguage = useLanguageStore((state) => state.selectedLanguage);
  const { totalXp, completedLessonIds } = useLearningStore();
  const language = LANGUAGES.find((item) => item.code === selectedLanguage);

  if (hydration !== "ready") return <LearningHydrationScreen status={hydration} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FBF8F1" }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View className="flex-row items-center">
          <View className="flex-1 pr-2">
            <Text className="h2">Profile</Text>
            <Text className="body-md text-text-secondary mt-2">Your learning, at a glance.</Text>
          </View>
          <MotionSticker kind="medal" size={68} testID="profile-sticker" />
        </View>

        <View className="rounded-2xl bg-[#E5F3ED] p-5 mt-5">
          <Text className="caption">CURRENT COURSE</Text>
          <View className="flex-row items-center mt-3">
            {language && <Image source={language.flag} style={styles.flag} />}
            <View className="flex-1">
              <Text className="font-poppins-semibold text-lg text-text-primary">{language?.name ?? "No course selected"}</Text>
              <Text className="body-sm text-text-secondary">Instructions in English</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push("/language-select")} className="bg-white rounded-xl items-center py-3 mt-4" accessibilityRole="button" testID="change-language-button">
            <Text className="font-poppins-semibold text-sm text-lingua-teal">Change language</Text>
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
        <Text className="caption mt-3">Progress is saved on this device and is not synced to an account. XP is awarded once per lesson.</Text>

        <Text className="font-poppins-semibold text-base text-text-primary mt-6 mb-3">Course progress</Text>
        <View className="rounded-2xl border border-border bg-white p-4">
          {LANGUAGES.map((course, index) => {
            const lessons = getCourseUnits(course.code).flatMap((unit) => unit.lessons);
            const completed = lessons.filter((lesson) => completedLessonIds.includes(lesson.id)).length;
            const percent = lessons.length ? Math.round((completed / lessons.length) * 100) : 0;
            return (
              <View key={course.code} className={index > 0 ? "mt-4" : ""} testID={`profile-course-${course.code}`}>
                <View className="flex-row justify-between items-center">
                  <Text className="font-poppins-medium text-sm text-text-primary">{course.name}</Text>
                  <Text className="caption">{completed} / {lessons.length} lessons</Text>
                </View>
                <View className="h-1.5 bg-[#EDF2EE] rounded-full overflow-hidden mt-2" accessibilityRole="progressbar" accessibilityLabel={`${course.name} course progress`} accessibilityValue={{ min: 0, max: 100, now: percent }}>
                  <View className="h-1.5 bg-lingua-teal rounded-full" style={{ width: `${percent}%` }} />
                </View>
              </View>
            );
          })}
        </View>

        <Text className="font-poppins-semibold text-base text-text-primary mt-6 mb-3">Listening preferences</Text>
        <SoundEffectsControl />

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
  content: { width: "100%", maxWidth: 720, alignSelf: "center", paddingHorizontal: 20, paddingTop: 18, paddingBottom: 36 },
  flag: { width: 44, height: 44, borderRadius: 22, marginRight: 12, borderWidth: 1, borderColor: "#E4E9DF" },
});
