import { useEffect, type ComponentProps } from "react";
import { TouchableOpacity } from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { useReducedMotionPreference } from "@/hooks/useReducedMotionPreference";

type Props = ComponentProps<typeof TouchableOpacity>;

// Keep the real native button and its accessibility semantics. Only the outer
// visual layer scales, and motion never delays or substitutes for onPress.
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
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        {...props}
        disabled={disabled}
        onPressIn={(event) => {
          if (!disabled && !reducedMotion) scale.value = withTiming(0.985, { duration: 90, easing: Easing.out(Easing.quad) });
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          scale.value = reducedMotion ? 1 : withTiming(1, { duration: 120, easing: Easing.out(Easing.quad) });
          onPressOut?.(event);
        }}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}
