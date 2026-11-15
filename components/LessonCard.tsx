import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import { LessonIcon } from "@/components/LessonIcon";
import { Lesson } from "@/types/learning";

interface LessonCardProps {
  lesson: Lesson;
  index: number;
  isCompleted: boolean;
  isInProgress: boolean;
  onPress: () => void;
}

export function LessonCard({ lesson, index, isCompleted, isInProgress, onPress }: LessonCardProps) {
  const status = isCompleted ? "Completed" : isInProgress ? "Up next" : "Ready";
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Lesson ${index + 1}: ${lesson.title}. ${status}.`}
      testID={`lesson-card-${lesson.id}`}
      className={`flex-row items-center rounded-2xl p-4 border ${isInProgress ? "bg-[#F3F0FF] border-[#C4B5FD]" : "bg-white border-border"}`}
    >
      <View className="w-12 h-12 rounded-xl bg-[#F6F7FB] items-center justify-center mr-3">
        <LessonIcon icon={lesson.icon} />
      </View>
      <View className="flex-1">
        <Text className="caption">LESSON {index + 1} · {status.toUpperCase()}</Text>
        <Text className="font-poppins-semibold text-sm text-text-primary mt-1">
          {lesson.title}
        </Text>
        <Text className="caption mt-1">
          {lesson.activities.length} questions · {lesson.xpReward} XP
        </Text>
      </View>
      {isCompleted ? (
        <Ionicons name="checkmark-circle" size={25} color="#21A96B" />
      ) : (
        <Ionicons name="chevron-forward" size={20} color="#6B7280" />
      )}
    </TouchableOpacity>
  );
}
