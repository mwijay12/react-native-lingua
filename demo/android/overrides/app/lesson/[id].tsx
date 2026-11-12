import { images } from "@/constants/images";
import { colors } from "@/constants/theme";
import { LESSONS } from "@/data/lessons";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// A local-only view of the lesson content. No microphone or AI session is started.
export default function DemoLessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const lesson = LESSONS.find((item) => item.id === id);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View className="flex-row items-center px-5 py-3">
        <TouchableOpacity
          accessibilityLabel="Rudi kwenye masomo"
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.neutral.textPrimary} />
        </TouchableOpacity>
        <Text className="flex-1 text-center font-poppins-semibold text-base text-text-primary">
          AI Teacher
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {lesson ? (
          <>
            <Text className="font-poppins-semibold text-lg text-text-primary mb-1">
              {lesson.title}
            </Text>
            <Text className="body-sm text-text-secondary mb-4">{lesson.description}</Text>
            <View className="rounded-3xl bg-[#F3F0FF] p-4 items-center">
              <Image
                source={images.mascotWelcome}
                style={{ width: "100%", height: 200 }}
                resizeMode="contain"
              />
              <View className="w-full rounded-2xl bg-white p-4 mt-3">
                <Text className="font-poppins-semibold text-sm text-text-primary">
                  Sauti ya AI haijawashwa kwenye demo
                </Text>
                <Text className="body-sm text-text-secondary mt-1">
                  Hii ni APK ya majaribio. Huduma za Clerk na Stream zinahitaji kusanidiwa.
                </Text>
              </View>
            </View>
            <Text className="font-poppins-semibold text-base text-text-primary mt-6 mb-3">
              Maneno ya somo
            </Text>
            {lesson.vocabulary.map((item) => (
              <View key={item.word} className="flex-row justify-between py-3 border-b border-border">
                <Text className="font-poppins-medium text-sm text-text-primary">
                  {item.emoji ? `${item.emoji} ` : ""}{item.word}
                </Text>
                <Text className="body-sm text-text-secondary">{item.translation}</Text>
              </View>
            ))}
          </>
        ) : (
          <Text className="body-md text-text-secondary">Somo halijapatikana.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
