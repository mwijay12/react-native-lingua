import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, type KeyboardEvent } from "react";
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";

import { useScreenMotionAllowed } from "@/hooks/useScreenMotionAllowed";
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
  const motionAllowed = useScreenMotionAllowed();
  if (activity.type === "multiple-choice") {
    const options = activity.options ?? [];
    return (
      <View className="gap-3" accessibilityRole="radiogroup" accessibilityLabel="Answer choices">
        {options.map((option, index) => {
          const selected = answer === option;
          // React Native Web's press handler handles Enter but not Space or
          // arrow keys for radio roles. Keep the native controls unchanged.
          const webKeyboard = Platform.OS === "web" ? {
            tabIndex: (disabled ? -1 : (answer ? selected : index === 0) ? 0 : -1) as 0 | -1,
            onKeyDownCapture: (event: KeyboardEvent<HTMLElement>) => {
              if (disabled) return;
              if (event.key === " ") {
                event.preventDefault();
                onChange(option);
              } else if (["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"].includes(event.key)) {
                event.preventDefault();
                const direction = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1;
                const next = (index + direction + options.length) % options.length;
                onChange(options[next]);
                event.currentTarget.parentElement?.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus();
              }
            },
          } : {};
          return (
            <TouchableOpacity
              key={option}
              {...webKeyboard}
              onPress={() => onChange(option)}
              disabled={disabled}
              accessibilityRole="radio"
              accessibilityLabel={option}
              accessibilityState={{ checked: selected, disabled }}
              aria-checked={selected}
              testID={`activity-choice-${index}`}
              className={`flex-row items-center rounded-2xl border border-b-2 p-3.5 ${selected ? "border-lingua-teal bg-[#E5F3ED]" : "border-border bg-white"}`}
            >
              <ChoiceMarker selected={selected} index={index} motionAllowed={motionAllowed} />
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

// Selection is already indicated by text, color and radio state. This brief
// accent is optional and never changes the answer or delays the next action.
function ChoiceMarker({ selected, index, motionAllowed }: { selected: boolean; index: number; motionAllowed: boolean }) {
  const scale = useSharedValue(1);
  const wasSelected = useRef(selected);

  useEffect(() => {
    if (!motionAllowed || !selected) {
      cancelAnimation(scale);
      scale.value = 1;
    } else if (!wasSelected.current) {
      scale.value = withSequence(
        withTiming(1.08, { duration: 80, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 120, easing: Easing.out(Easing.quad) }),
      );
    }
    wasSelected.current = selected;
    return () => cancelAnimation(scale);
  }, [motionAllowed, scale, selected]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={animatedStyle} pointerEvents="none" accessible={false} aria-hidden>
      <View className={`w-9 h-9 rounded-xl items-center justify-center mr-3 ${selected ? "bg-lingua-teal" : "bg-[#F5F3EC]"}`}>
        <Text className={`font-poppins-semibold text-xs ${selected ? "text-white" : "text-text-secondary"}`}>{String.fromCharCode(65 + index)}</Text>
      </View>
    </Animated.View>
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
