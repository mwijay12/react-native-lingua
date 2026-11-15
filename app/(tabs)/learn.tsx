import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LessonCard } from "@/components/LessonCard";
import { images } from "@/constants/images";
import { colors } from "@/constants/theme";
import { getCourseUnits } from "@/data/courses";
import { useLanguageStore } from "@/store/languageStore";
import { useLearningStore } from "@/store/learningStore";

export default function LearnScreen() {
  const router = useRouter();
  const { selectedLanguage } = useLanguageStore();
  const { completedLessonIds } = useLearningStore();
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
          <Text className="body-md text-text-secondary text-center mb-5">
            Select Kiswahili, English or French to see your lessons.
          </Text>
          <TouchableOpacity onPress={() => router.push("/language-select")} className="bg-lingua-teal rounded-xl px-5 py-3" accessibilityRole="button">
            <Text className="font-poppins-semibold text-white">Choose a language</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FBF8F1" }}>
      <View className="flex-row items-center px-5 pt-3 pb-3">
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
        <View className="rounded-[26px] bg-lingua-mint overflow-hidden p-5 mb-6">
          <View className="absolute w-36 h-36 rounded-full bg-[#CBE7D9] right-[-5px] bottom-[-35px]" />
          <Image source={images.mascotParrot} style={styles.heroParrot} resizeMode="contain" accessible={false} />
          <View style={styles.heroCopy}>
            <Text className="font-poppins-semibold text-[10px] tracking-[1.2px] text-lingua-teal">YOUR LEARNING PATH</Text>
            <Text className="font-poppins-bold text-xl text-text-primary mt-2">Little lessons. Everyday wins.</Text>
            <View className="h-2 bg-[#C1DFD2] rounded-full overflow-hidden mt-4">
              <View className="h-2 bg-lingua-teal rounded-full" style={{ width: `${progress}%` }} />
            </View>
            <Text className="caption mt-2">{progress}% of your course complete</Text>
          </View>
        </View>

        {units.map((unit) => (
          <View key={unit.id} className="mb-6" testID={`course-unit-${unit.id}`}>
            <View className="flex-row items-center mb-1">
              <View className="bg-lingua-sand rounded-full px-2.5 py-1 mr-2">
                <Text className="font-poppins-semibold text-[10px] text-[#885C24]">UNIT {unit.order}</Text>
              </View>
              <Text className="font-poppins-semibold text-lg text-text-primary flex-1">{unit.title}</Text>
            </View>
            <Text className="body-sm text-text-secondary mt-1 mb-4">{unit.description}</Text>
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
        <Text className="caption">Review a lesson anytime. XP is awarded once per lesson.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 36 },
  heroCopy: { width: "65%" },
  heroParrot: { position: "absolute", right: 3, bottom: 0, width: "37%", height: "95%" },
});
