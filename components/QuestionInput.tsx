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
        {(activity.options ?? []).map((option, index) => (
          <TouchableOpacity
            key={option}
            onPress={() => onChange(option)}
            disabled={disabled}
            accessibilityRole="radio"
            accessibilityState={{ selected: answer === option, disabled }}
            testID={`activity-choice-${index}`}
            className={`rounded-2xl border p-4 ${answer === option ? "border-lingua-teal bg-[#E5F3ED]" : "border-border bg-white"}`}
          >
            <Text className="font-poppins-medium text-sm text-text-primary">{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <TextInput
      style={styles.answerInput}
      value={answer}
      onChangeText={onChange}
      placeholder="Type your answer"
      placeholderTextColor="#74867F"
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
