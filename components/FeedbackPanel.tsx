import { useIsFocused } from "@react-navigation/native";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, AppState, Easing, Platform, View } from "react-native";

import { useReducedMotionPreference } from "@/hooks/useReducedMotionPreference";

// Feedback is visible immediately. A tiny one-shot emphasis is decorative,
// never required to understand the result, and respects reduced motion.
export function FeedbackPanel({ kind, testID, children }: { kind: "correct" | "incorrect"; testID: string; children: ReactNode }) {
  const focused = useIsFocused();
  const reducedMotion = useReducedMotionPreference();
  const [active, setActive] = useState(AppState.currentState == null || AppState.currentState === "active");
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => setActive(state === "active"));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    pulse.stopAnimation();
    pulse.setValue(0);
    if (kind !== "correct" || reducedMotion || !focused || !active) return;
    const timing = (toValue: number, duration: number) => Animated.timing(pulse, {
      toValue, duration, easing: Easing.out(Easing.quad), useNativeDriver: Platform.OS !== "web",
    });
    const animation = Animated.sequence([timing(1, 120), timing(0, 220)]);
    animation.start();
    return () => { animation.stop(); pulse.setValue(0); };
  }, [active, focused, kind, pulse, reducedMotion]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.015] });
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <View className={`rounded-2xl p-4 mt-4 ${kind === "correct" ? "bg-[#EDF8F1]" : "bg-[#FFF1F0]"}`} accessibilityLiveRegion="polite" testID={testID}>
        {children}
      </View>
    </Animated.View>
  );
}
