import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { useScreenMotionAllowed } from "@/hooks/useScreenMotionAllowed";
import { boundedProgress } from "@/lib/motionProgress";

interface MotionProgressProps {
  value: number;
  max: number;
  label: string;
  valueText?: string;
  trackColor?: string;
  fillColor?: string;
  className?: string;
  testID?: string;
}

// Translate a full-width fill inside the clipped track. Only a transform is
// animated; the announced value always reflects the real progress immediately.
export function MotionProgress({
  value, max, label, valueText, trackColor = "#F2F0E8", fillColor = "#14675D", className, testID,
}: MotionProgressProps) {
  const motionAllowed = useScreenMotionAllowed();
  const progress = boundedProgress(value, max);
  const [width, setWidth] = useState(0);
  const fill = useSharedValue(progress.fraction);

  useEffect(() => {
    if (!motionAllowed) {
      cancelAnimation(fill);
      fill.value = progress.fraction;
    } else {
      fill.value = withTiming(progress.fraction, { duration: 300, easing: Easing.out(Easing.cubic) });
    }
    return () => cancelAnimation(fill);
  }, [fill, motionAllowed, progress.fraction]);

  const fillStyle = useAnimatedStyle(() => ({
    opacity: width > 0 ? 1 : 0,
    transform: [{ translateX: (fill.value - 1) * width }],
  }));

  return (
    <View
      className={className}
      style={[styles.track, { backgroundColor: trackColor }]}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: progress.max, now: progress.value, text: valueText }}
      aria-valuemin={0}
      aria-valuemax={progress.max}
      aria-valuenow={progress.value}
      aria-valuetext={valueText}
      testID={testID}
    >
      <Animated.View pointerEvents="none" accessible={false} aria-hidden style={[styles.fill, { backgroundColor: fillColor }, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, borderRadius: 999, overflow: "hidden" },
  fill: { position: "absolute", left: 0, top: 0, bottom: 0, width: "100%", borderRadius: 999 },
});
