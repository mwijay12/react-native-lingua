import { useEffect, type ComponentProps } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { useReducedMotionPreference } from "@/hooks/useReducedMotionPreference";

type Props = ComponentProps<typeof TouchableOpacity>;

// Keep the real native button and its hit area still. Only its contents scale,
// so the feedback cannot move the target underneath a finger during a press.
export function MotionPressable({ onPressIn, onPressOut, disabled, children, ...props }: Props) {
  const reducedMotion = useReducedMotionPreference();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion || disabled) {
      cancelAnimation(scale);
      scale.value = 1;
    }
    return () => cancelAnimation(scale);
  }, [disabled, reducedMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <TouchableOpacity
      {...props}
      disabled={disabled}
      onPressIn={(event) => {
        if (!disabled && !reducedMotion) scale.value = withTiming(0.985, { duration: 90, easing: Easing.out(Easing.quad) });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = reducedMotion || disabled ? 1 : withTiming(1, { duration: 120, easing: Easing.out(Easing.quad) });
        onPressOut?.(event);
      }}
    >
      <Animated.View style={[styles.content, animatedStyle]} pointerEvents="none">
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  content: { flexDirection: "row", alignItems: "center", justifyContent: "center", flexShrink: 1, maxWidth: "100%" },
});
