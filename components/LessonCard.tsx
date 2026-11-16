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
      className={`flex-row items-center rounded-[22px] p-4 border border-b-2 ${isInProgress ? "bg-[#F1FAF6] border-[#9BCDC0]" : "bg-white border-border"}`}
    >
      <View className="w-12 h-12 rounded-2xl items-center justify-center mr-3 bg-[#F7F6EF]">
        <LessonIcon icon={lesson.icon} />
      </View>
      <View className="flex-1 pr-2">
        <Text className="font-poppins-semibold text-[10px] tracking-[0.6px] text-lingua-teal">LESSON {index + 1} · {status.toUpperCase()}</Text>
        <Text className="font-poppins-semibold text-sm text-text-primary mt-1">{lesson.title}</Text>
        <Text className="body-sm text-text-secondary mt-1" numberOfLines={2}>{lesson.description}</Text>
        <Text className="caption mt-1">{lesson.activities.length} questions · {lesson.xpReward} XP</Text>
      </View>
      <View className={`w-8 h-8 rounded-full items-center justify-center ${isCompleted ? "bg-lingua-mint" : "bg-[#F5F3EC]"}`}>
        <Ionicons name={isCompleted ? "checkmark" : "arrow-forward"} size={18} color={isCompleted ? "#14675D" : "#60736C"} />
      </View>
    </TouchableOpacity>
  );
}
