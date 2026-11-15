import { useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LessonIcon } from "@/components/LessonIcon";
import { images } from "@/constants/images";
import { getCourseUnits } from "@/data/courses";
import { LANGUAGES } from "@/data/languages";
import { useLanguageStore } from "@/store/languageStore";
import { useLearningStore } from "@/store/learningStore";

export default function HomeScreen() {
  const { user } = useUser();
  const { selectedLanguage } = useLanguageStore();
  const { totalXp, completedLessonIds } = useLearningStore();
  const firstName = user?.firstName ?? "Learner";

  const language = LANGUAGES.find((item) => item.code === selectedLanguage);
  const units = getCourseUnits(selectedLanguage);
  const lessons = units.flatMap((unit) => unit.lessons);
  const completedCount = lessons.filter((lesson) => completedLessonIds.includes(lesson.id)).length;
  const nextLesson = lessons.find((lesson) => !completedLessonIds.includes(lesson.id));
  const progress = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FBF8F1" }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View className="flex-row items-center justify-between mb-5">
          <View className="flex-1 pr-3">
            <Text className="font-poppins-semibold text-[10px] tracking-[1.5px] text-lingua-teal">YOUR LITTLE LEARNING SPACE</Text>
            <Text className="font-poppins-bold text-[24px] text-text-primary mt-1">Hello, {firstName}!</Text>
            <Text className="body-sm text-text-secondary mt-1">A little practice goes a long way.</Text>
          </View>
          <View className="w-[68px] h-[68px] rounded-full bg-lingua-sand items-center justify-center">
            <Image source={images.mascotParrot} style={styles.headerParrot} resizeMode="contain" accessible={false} />
          </View>
        </View>

        <View className="bg-lingua-deep-teal rounded-[28px] overflow-hidden p-5 mb-6">
          <View className="absolute w-40 h-40 rounded-full bg-[#2C7C70] right-[-20px] bottom-[-20px]" />
          <Image source={images.mascotCat} style={styles.courseCat} resizeMode="contain" accessible={false} />
          <View style={styles.courseCopy}>
            <Text className="font-poppins-semibold text-[10px] tracking-[1.2px] text-[#CBE8DE]">YOUR COURSE</Text>
            <View className="flex-row items-center mt-3">
              {language && <Image source={language.flag} style={styles.flag} />}
              <Text className="font-poppins-bold text-[22px] text-white flex-1" testID="home-course-title">
                {language?.name ?? "Choose a language"}
              </Text>
            </View>
            <Text className="font-poppins text-xs text-[#D2E9E1] mt-2">Everyday words, one step at a time.</Text>
            {lessons.length > 0 && (
              <>
                <View className="h-2 bg-white/25 rounded-full overflow-hidden mt-4">
                  <View className="h-2 bg-[#F6D38D] rounded-full" style={{ width: `${progress}%` }} />
                </View>
                <Text className="font-poppins text-xs text-[#D2E9E1] mt-2">
                  {completedCount} of {lessons.length} lessons completed
                </Text>
              </>
            )}
            <TouchableOpacity
              className="bg-[#FFF9EB] rounded-xl py-3 px-4 self-start mt-4"
              activeOpacity={0.85}
              accessibilityRole="button"
              testID="continue-learning-button"
              onPress={() => units.length ? router.navigate("/(tabs)/learn") : router.push("/language-select")}
            >
              <Text className="font-poppins-semibold text-sm text-lingua-deep-teal">
                {units.length ? "Continue" : "Choose a course"}  →
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row items-center justify-between mb-3">
          <Text className="font-poppins-semibold text-lg text-text-primary">Your progress</Text>
          <Text className="caption">Saved on this device</Text>
        </View>
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-[#FAEBCB] rounded-[22px] p-4">
            <Ionicons name="sparkles" size={21} color="#B26A26" />
            <Text className="font-poppins-bold text-[22px] text-text-primary mt-2" testID="home-total-xp">
              {totalXp} XP
            </Text>
            <Text className="body-sm text-text-secondary">Total earned</Text>
          </View>
          <View className="flex-1 bg-lingua-mint rounded-[22px] p-4">
            <Ionicons name="checkmark-circle" size={22} color="#21846D" />
            <Text className="font-poppins-bold text-[22px] text-text-primary mt-2" testID="home-completed-count">
              {completedLessonIds.length}
            </Text>
            <Text className="body-sm text-text-secondary">Lessons completed</Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between mb-3">
          <Text className="font-poppins-semibold text-lg text-text-primary">{nextLesson ? "Up next" : "Keep practising"}</Text>
          <Text className="caption">YOUR NEXT STEP</Text>
        </View>
        <TouchableOpacity
          className="flex-row items-center rounded-[22px] border border-border bg-white p-4"
          accessibilityRole="button"
          activeOpacity={0.8}
          onPress={() => nextLesson ? router.push(`/lesson/${nextLesson.id}`) : router.navigate("/(tabs)/learn")}
          testID="home-next-lesson"
        >
          <View className="w-12 h-12 rounded-2xl bg-lingua-mint items-center justify-center mr-3">
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
          <Ionicons name="arrow-forward" size={19} color="#14675D" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 32 },
  headerParrot: { width: 58, height: 58 },
  flag: { width: 33, height: 33, borderRadius: 17, marginRight: 9 },
  courseCopy: { width: "64%" },
  courseCat: { position: "absolute", right: -1, bottom: -2, width: "40%", height: "83%" },
});
