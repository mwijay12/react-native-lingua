import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { UNITS } from "@/data/units";
import { useLanguageStore } from "@/store/languageStore";
import { LanguageCode } from "@/types/learning";

const EXAMPLES: Partial<Record<LanguageCode, { first: string; firstMeaning: string; reply: string; replyMeaning: string }>> = {
  sw: {
    first: "Habari?",
    firstMeaning: "Hello / How are things?",
    reply: "Nzuri, asante.",
    replyMeaning: "Fine, thank you.",
  },
  en: {
    first: "Hello! How are you?",
    firstMeaning: "A greeting and a question about someone.",
    reply: "I'm fine, thank you.",
    replyMeaning: "A polite answer to a greeting.",
  },
  fr: {
    first: "Bonjour, comment allez-vous ?",
    firstMeaning: "Hello, how are you? (formal)",
    reply: "Ça va bien, merci.",
    replyMeaning: "I'm doing well, thank you.",
  },
};

export default function ChatScreen() {
  const selectedLanguage = useLanguageStore((state) => state.selectedLanguage);
  const example = selectedLanguage ? EXAMPLES[selectedLanguage] : undefined;
  const unit = UNITS.find((item) => item.languageCode === selectedLanguage);
  const lessonId = unit?.lessonIds[0];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text className="h2">Chat</Text>
        <Text className="body-md text-text-secondary mt-2">Read a short conversation and practise it aloud.</Text>

        <View className="flex-row rounded-2xl bg-[#FFF5E8] p-4 mt-5">
          <Ionicons name="information-circle-outline" size={22} color="#B7791F" />
          <View className="flex-1 ml-3">
            <Text className="font-poppins-semibold text-sm text-text-primary">Live AI chat is not available yet</Text>
            <Text className="body-sm text-text-secondary mt-1">
              This is a written example, not a conversation with an AI.
            </Text>
          </View>
        </View>

        <Text className="font-poppins-semibold text-lg text-text-primary mt-6 mb-1">A simple greeting</Text>
        <Text className="body-sm text-text-secondary mb-4">Take turns reading each line.</Text>
        {example ? (
          <>
            <View className="self-start max-w-[90%] rounded-2xl bg-surface p-4 mb-3">
              <Text className="caption mb-1">PERSON 1</Text>
              <Text className="font-poppins-semibold text-base text-text-primary">{example.first}</Text>
              <Text className="body-sm text-text-secondary mt-2">{example.firstMeaning}</Text>
            </View>
            <View className="self-end max-w-[90%] rounded-2xl bg-[#F3F0FF] p-4 mb-3">
              <Text className="caption mb-1">PERSON 2</Text>
              <Text className="font-poppins-semibold text-base text-text-primary">{example.reply}</Text>
              <Text className="body-sm text-text-secondary mt-2">{example.replyMeaning}</Text>
            </View>
          </>
        ) : (
          <Text className="body-sm text-text-secondary">Choose a course to see an example.</Text>
        )}

        <TouchableOpacity
          className="border border-lingua-purple rounded-2xl items-center py-4 mt-5"
          accessibilityRole="button"
          onPress={() => lessonId ? router.push(`/lesson/${lessonId}`) : router.push("/language-select")}
          testID="chat-lesson-button"
        >
          <Text className="font-poppins-semibold text-base text-lingua-purple">Practise greetings</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 36 } });
