import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LearningSticker, type StickerKind } from "@/components/LearningSticker";
import { LessonCard } from "@/components/LessonCard";
import { MotionSticker } from "@/components/MotionSticker";
import { colors } from "@/constants/theme";
import { getCourseUnits } from "@/data/courses";
import { LANGUAGES } from "@/data/languages";
import { useLanguageStore } from "@/store/languageStore";
import { useLearningStore } from "@/store/learningStore";

const UNIT_STICKERS: StickerKind[] = ["talk", "people", "book"];
const UNIT_BACKGROUNDS = ["bg-[#FCF1DB]", "bg-[#EAF5EE]", "bg-[#F0ECF8]"];

export default function LearnScreen() {
  const router = useRouter();
  const { selectedLanguage } = useLanguageStore();
  const { completedLessonIds } = useLearningStore();
  const language = LANGUAGES.find((item) => item.code === selectedLanguage);
  const units = getCourseUnits(selectedLanguage);
  const lessons = units.flatMap((unit) => unit.lessons);
  const completedCount = lessons.filter((lesson) => completedLessonIds.includes(lesson.id)).length;
  const nextLessonId = lessons.find((lesson) => !completedLessonIds.includes(lesson.id))?.id;
  const progress = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0;

  if (!units.length) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FBF8F1" }}>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="h3 text-center mb-2">Choose a course to begin</Text>
          <Text className="body-md text-text-secondary text-center mb-5">Select Kiswahili, English or French to see your lessons.</Text>
          <TouchableOpacity onPress={() => router.push("/language-select")} className="bg-lingua-teal rounded-xl px-5 py-3" accessibilityRole="button">
            <Text className="font-poppins-semibold text-white">Choose a language</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FBF8F1" }}>
      <View className="w-full max-w-[720px] self-center flex-row items-center px-5 pt-3 pb-3">
        <TouchableOpacity onPress={() => router.navigate("/(tabs)")} accessibilityRole="button" accessibilityLabel="Go to home" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={colors.neutral.textPrimary} />
        </TouchableOpacity>
        <View className="flex-1 items-center">
          <Text className="font-poppins-semibold text-base text-text-primary">Choose a lesson</Text>
          <Text className="caption">{completedCount} of {lessons.length} completed</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View className="rounded-[22px] bg-lingua-mint p-5 mb-6">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="font-poppins-semibold text-[10px] tracking-[1px] text-lingua-teal">YOUR LEARNING PATH</Text>
              <Text className="font-poppins-semibold text-xl text-text-primary mt-2">{language?.name} foundations</Text>
              <Text className="body-sm text-text-secondary mt-1">Everyday language, useful patterns and guided practice.</Text>
            </View>
            <MotionSticker kind="book" size={72} testID="path-sticker" />
          </View>
          <View className="h-2 bg-[#C8DDD3] rounded-full overflow-hidden mt-4" accessibilityRole="progressbar" accessibilityLabel="Course progress" accessibilityValue={{ min: 0, max: 100, now: progress }}>
            <View className="h-2 bg-lingua-teal rounded-full" style={{ width: `${progress}%` }} />
          </View>
          <View className="flex-row justify-between items-center mt-2">
            <Text className="caption">{progress}% of your course complete</Text>
            <TouchableOpacity onPress={() => router.push("/review")} accessibilityRole="button" testID="learn-review-button" className="py-1">
              <Text className="font-poppins-semibold text-xs text-lingua-teal">Review mistakes →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {units.map((unit) => (
          <View key={unit.id} className="mb-6" testID={`course-unit-${unit.id}`}>
            <View className={`flex-row items-center rounded-[20px] px-4 py-3 mb-3 ${UNIT_BACKGROUNDS[(unit.order - 1) % UNIT_BACKGROUNDS.length]}`}>
              <View className="flex-1 pr-2">
                <Text className="font-poppins-semibold text-[10px] tracking-[0.8px] text-lingua-teal">UNIT {unit.order}</Text>
                <Text className="font-poppins-semibold text-lg text-text-primary mt-1">{unit.title}</Text>
                <Text className="body-sm text-text-secondary mt-1">{unit.description}</Text>
              </View>
              <LearningSticker kind={UNIT_STICKERS[(unit.order - 1) % UNIT_STICKERS.length]} size={58} />
            </View>
            <View className="gap-3">
              {unit.lessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  index={lessons.findIndex((item) => item.id === lesson.id)}
                  isCompleted={completedLessonIds.includes(lesson.id)}
                  isInProgress={lesson.id === nextLessonId}
                  onPress={() => router.push(`/lesson/${lesson.id}`)}
                />
              ))}
            </View>
          </View>
        ))}
        <Text className="caption">Revisit a lesson anytime. XP is awarded once per lesson.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ content: { width: "100%", maxWidth: 720, alignSelf: "center", paddingHorizontal: 20, paddingBottom: 36 } });
