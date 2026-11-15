import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Image as RNImage, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LessonCard } from "@/components/LessonCard";
import { images } from "@/constants/images";
import { colors } from "@/constants/theme";
import { LESSONS } from "@/data/lessons";
import { UNITS } from "@/data/units";
import { useLanguageStore } from "@/store/languageStore";
import { useLearningStore } from "@/store/learningStore";

export default function LearnScreen() {
  const router = useRouter();
  const { selectedLanguage } = useLanguageStore();
  const { completedLessonIds } = useLearningStore();
  const unit = UNITS.find((item) => item.languageCode === selectedLanguage);
  const lessons = unit?.lessonIds
    .map((id) => LESSONS.find((item) => item.id === id))
    .filter((lesson) => lesson !== undefined) ?? [];
  const completedCount = lessons.filter((lesson) => completedLessonIds.includes(lesson.id)).length;
  const nextIndex = lessons.findIndex((lesson) => !completedLessonIds.includes(lesson.id));

  if (!unit) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="h3 text-center mb-2">Choose a course to begin</Text>
          <Text className="body-md text-text-secondary text-center mb-5">
            Select Kiswahili, English or French to see your lessons.
          </Text>
          <TouchableOpacity onPress={() => router.push("/language-select")} className="bg-lingua-purple rounded-xl px-5 py-3" accessibilityRole="button">
            <Text className="font-poppins-semibold text-white">Choose a language</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View className="px-5 pt-3 pb-3">
        <View className="flex-row items-center mb-1">
          <TouchableOpacity onPress={() => router.navigate("/(tabs)")} accessibilityRole="button" accessibilityLabel="Go to home" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="chevron-back" size={24} color={colors.neutral.textPrimary} />
          </TouchableOpacity>
          <Text className="flex-1 text-center font-poppins-semibold text-lg text-text-primary">Lessons</Text>
          <View style={{ width: 24 }} />
        </View>
        <Text className="caption text-center">{completedCount} of {lessons.length} lessons completed</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.heroContainer}>
          <Image source={images.palace} contentFit="contain" style={styles.heroImage} />
          <RNImage source={images.mascotWelcome} style={styles.mascotImage} resizeMode="contain" />
        </View>
        <Text className="font-poppins-semibold text-xl text-text-primary">{unit.title}</Text>
        <Text className="body-sm text-text-secondary mt-1 mb-5">{unit.description}</Text>
        <Text className="font-poppins-semibold text-base text-text-primary mb-3">Choose a lesson</Text>
        <View className="gap-3">
          {lessons.map((lesson, index) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              index={index}
              isCompleted={completedLessonIds.includes(lesson.id)}
              isInProgress={index === nextIndex}
              onPress={() => router.push(`/lesson/${lesson.id}`)}
            />
          ))}
        </View>
        <Text className="caption mt-5">Review a lesson anytime. XP is awarded once per lesson.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 36 },
  heroContainer: { height: 150, borderRadius: 20, overflow: "hidden", marginBottom: 18, backgroundColor: "#F6F7FB" },
  heroImage: { width: "100%", height: "100%" },
  mascotImage: { position: "absolute", bottom: 0, right: 16, width: 100, height: 100 },
});
