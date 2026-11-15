import { useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LessonIcon } from "@/components/LessonIcon";
import { images } from "@/constants/images";
import { LANGUAGES } from "@/data/languages";
import { LESSONS } from "@/data/lessons";
import { UNITS } from "@/data/units";
import { useLanguageStore } from "@/store/languageStore";
import { useLearningStore } from "@/store/learningStore";

export default function HomeScreen() {
  const { user } = useUser();
  const { selectedLanguage } = useLanguageStore();
  const { totalXp, completedLessonIds } = useLearningStore();
  const firstName = user?.firstName ?? "Learner";

  const language = LANGUAGES.find((item) => item.code === selectedLanguage);
  const unit = UNITS.find((item) => item.languageCode === selectedLanguage);
  const lessons = unit?.lessonIds
    .map((id) => LESSONS.find((item) => item.id === id))
    .filter((lesson) => lesson !== undefined) ?? [];
  const completedCount = lessons.filter((lesson) => completedLessonIds.includes(lesson.id)).length;
  const nextLesson = lessons.find((lesson) => !completedLessonIds.includes(lesson.id));
  const progress = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-1 pr-3">
            <Text className="font-poppins-semibold text-[22px] text-text-primary">
              Hello, {firstName}!
            </Text>
            <Text className="body-sm text-text-secondary mt-1">Ready to learn something new?</Text>
          </View>
          <Image source={images.mascotLogo} style={{ width: 48, height: 48 }} resizeMode="contain" />
        </View>

        <View className="bg-lingua-purple rounded-[24px] p-5 mb-6">
          <Text className="font-poppins-medium text-xs text-white/80 mb-2">YOUR COURSE</Text>
          <View className="flex-row items-center mb-1">
            {language && <Image source={language.flag} style={styles.flag} />}
            <Text className="font-poppins-bold text-[23px] text-white flex-1" testID="home-course-title">
              {language?.name ?? "Choose a language"}
            </Text>
          </View>
          <Text className="font-poppins text-sm text-white/80 mt-1">
            {unit ? `Unit ${unit.order} · ${unit.title}` : "Pick a course to get started."}
          </Text>
          {unit && (
            <>
              <View className="h-2 bg-white/30 rounded-full overflow-hidden mt-4">
                <View className="h-2 bg-white rounded-full" style={{ width: `${progress}%` }} />
              </View>
              <Text className="font-poppins text-xs text-white/80 mt-2">
                {completedCount} of {lessons.length} lessons completed
              </Text>
            </>
          )}
          <TouchableOpacity
            className="bg-white rounded-xl py-3 px-5 self-start mt-4"
            activeOpacity={0.85}
            accessibilityRole="button"
            testID="continue-learning-button"
            onPress={() => unit ? router.navigate("/(tabs)/learn") : router.push("/language-select")}
          >
            <Text className="font-poppins-semibold text-sm text-lingua-purple">
              {unit ? "Continue" : "Choose a course"}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center justify-between mb-3">
          <Text className="font-poppins-semibold text-lg text-text-primary">Your progress</Text>
          <Text className="caption">Saved on this device</Text>
        </View>
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-[#FFF5E8] rounded-2xl p-4">
            <Ionicons name="star" size={22} color="#F59E0B" />
            <Text className="font-poppins-bold text-[22px] text-text-primary mt-2" testID="home-total-xp">
              {totalXp} XP
            </Text>
            <Text className="body-sm text-text-secondary">Total earned</Text>
          </View>
          <View className="flex-1 bg-[#EDF8F1] rounded-2xl p-4">
            <Ionicons name="checkmark-circle" size={22} color="#21A96B" />
            <Text className="font-poppins-bold text-[22px] text-text-primary mt-2" testID="home-completed-count">
              {completedLessonIds.length}
            </Text>
            <Text className="body-sm text-text-secondary">Lessons completed</Text>
          </View>
        </View>

        <Text className="font-poppins-semibold text-lg text-text-primary mb-3">
          {nextLesson ? "Up next" : "Keep practising"}
        </Text>
        <TouchableOpacity
          className="flex-row items-center rounded-2xl border border-border bg-white p-4"
          accessibilityRole="button"
          activeOpacity={0.8}
          onPress={() => nextLesson ? router.push(`/lesson/${nextLesson.id}`) : router.navigate("/(tabs)/learn")}
        >
          <View className="w-12 h-12 rounded-xl bg-[#F3F0FF] items-center justify-center mr-3">
            <LessonIcon icon={nextLesson?.icon} />
          </View>
          <View className="flex-1">
            <Text className="font-poppins-semibold text-sm text-text-primary">
              {nextLesson?.title ?? "Review your lessons"}
            </Text>
            <Text className="body-sm text-text-secondary mt-1">
              {nextLesson ? `${nextLesson.activities.length} questions · ${nextLesson.xpReward} XP` : "Revisit what you have learned."}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6b7280" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  flag: { width: 34, height: 34, borderRadius: 17, marginRight: 10 },
});
