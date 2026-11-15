import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import type { Activity } from "@/types/learning";

interface QuestionInputProps {
  activity: Activity;
  answer: string;
  disabled: boolean;
  onChange: (answer: string) => void;
  onSubmit: () => void;
}

// The same answer controls are used by lessons and the missed-question review.
export function QuestionInput({ activity, answer, disabled, onChange, onSubmit }: QuestionInputProps) {
  if (activity.type === "multiple-choice") {
    return (
      <View className="gap-3">
        {(activity.options ?? []).map((option, index) => {
          const selected = answer === option;
          return (
            <TouchableOpacity
              key={option}
              onPress={() => onChange(option)}
              disabled={disabled}
              accessibilityRole="radio"
              accessibilityLabel={option}
              accessibilityState={{ selected, disabled }}
              testID={`activity-choice-${index}`}
              className={`flex-row items-center rounded-2xl border border-b-2 p-3.5 ${selected ? "border-lingua-teal bg-[#E5F3ED]" : "border-border bg-white"}`}
            >
              <View className={`w-9 h-9 rounded-xl items-center justify-center mr-3 ${selected ? "bg-lingua-teal" : "bg-[#F5F3EC]"}`}>
                <Text className={`font-poppins-semibold text-xs ${selected ? "text-white" : "text-text-secondary"}`}>{String.fromCharCode(65 + index)}</Text>
              </View>
              <Text className="font-poppins-medium text-sm text-text-primary flex-1">{option}</Text>
              {selected && <Ionicons name="radio-button-on" size={22} color="#14675D" />}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  return (
    <TextInput
      style={styles.answerInput}
      value={answer}
      onChangeText={onChange}
      placeholder="Type your answer"
      placeholderTextColor="#526860"
      accessibilityLabel="Your answer"
      testID="answer-input"
      autoCapitalize="sentences"
      autoCorrect={false}
      editable={!disabled}
      onSubmitEditing={onSubmit}
    />
  );
}

const styles = StyleSheet.create({
  answerInput: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: "#C9D7D0",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: "Poppins-Regular",
    fontSize: 15,
    color: "#183B37",
    backgroundColor: "#FFFFFF",
  },
});
