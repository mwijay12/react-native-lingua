import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { images } from "@/constants/images";
import { LANGUAGES } from "@/data/languages";
import { LESSONS } from "@/data/lessons";
import { UNITS } from "@/data/units";
import { useLanguageStore } from "@/store/languageStore";
import { useLearningStore } from "@/store/learningStore";

export default function AITeacherScreen() {
  const selectedLanguage = useLanguageStore((state) => state.selectedLanguage);
  const completed = useLearningStore((state) => state.completedLessonIds);
  const language = LANGUAGES.find((item) => item.code === selectedLanguage);
  const unit = UNITS.find((item) => item.languageCode === selectedLanguage);
  const lessonId = unit?.lessonIds.find((id) => !completed.includes(id)) ?? unit?.lessonIds[0];
  const lesson = LESSONS.find((item) => item.id === lessonId);
  const phrase = lesson?.phrases[0];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text className="h2">AI Teacher</Text>
        <Text className="body-md text-text-secondary mt-2">Your place for guided practice.</Text>

        <View className="rounded-[24px] bg-[#F3F0FF] mt-5 p-5 items-center">
          <Image source={images.mascotWelcome} style={{ width: 130, height: 125 }} resizeMode="contain" />
          <Text className="font-poppins-semibold text-lg text-text-primary text-center mt-2">
            AI voice is not available yet
          </Text>
          <Text className="body-sm text-text-secondary text-center mt-2">
            No microphone or AI conversation is used here. You can still practise with the local lessons.
          </Text>
        </View>

        {phrase && (
          <View className="rounded-2xl border border-border p-5 mt-5">
            <Text className="font-poppins-semibold text-base text-text-primary">Try saying this aloud</Text>
            <Text className="caption mt-1">FROM {language?.name.toUpperCase()} · {lesson?.title.toUpperCase()}</Text>
            <Text className="font-poppins-semibold text-lg text-lingua-purple mt-4">{phrase.text}</Text>
            <Text className="body-sm text-text-secondary mt-1">{phrase.translation}</Text>
            <Text className="caption mt-2">Say it: {phrase.pronunciation}</Text>
          </View>
        )}

        <TouchableOpacity
          className="bg-lingua-purple rounded-2xl items-center justify-center flex-row py-4 mt-5"
          accessibilityRole="button"
          onPress={() => lesson ? router.push(`/lesson/${lesson.id}`) : router.navigate("/(tabs)/learn")}
          testID="teacher-practice-button"
        >
          <Ionicons name="book-outline" size={20} color="#fff" />
          <Text className="font-poppins-semibold text-base text-white ml-2">Open a lesson</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 36 } });
