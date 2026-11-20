import { useEffect, useRef } from "react";
import { Animated, Easing, Platform, View } from "react-native";

import { LearningSticker, type StickerKind } from "@/components/LearningSticker";
import { useScreenMotionAllowed } from "@/hooks/useScreenMotionAllowed";

// Placement belongs to the parent. A small one-time drift gives the drawing
// life without continuous motion, blocking lists, or changing its hit area.
export function MotionSticker({ kind, size = 72, testID }: { kind: StickerKind; size?: number; testID?: string }) {
  const motionAllowed = useScreenMotionAllowed();
  const drift = useRef(new Animated.Value(0)).current;
  const hasDrifted = useRef(false);

  useEffect(() => {
    if (!motionAllowed) {
      drift.stopAnimation();
      drift.setValue(0);
      return;
    }
    if (hasDrifted.current) return;
    hasDrifted.current = true;

    const timing = (toValue: number, duration: number) => Animated.timing(drift, {
      toValue,
      duration,
      easing: Easing.inOut(Easing.sin),
      isInteraction: false,
      useNativeDriver: Platform.OS !== "web",
    });
    const greeting = Animated.sequence([timing(1, 900), timing(-1, 1400), timing(0, 900)]);
    greeting.start();
    return () => {
      greeting.stop();
      drift.setValue(0);
    };
  }, [drift, motionAllowed]);

  const translateY = drift.interpolate({ inputRange: [-1, 1], outputRange: [-3, 3] });
  const rotate = drift.interpolate({ inputRange: [-1, 1], outputRange: ["-2deg", "2deg"] });

  return (
    <View
      pointerEvents="none"
      accessible={false}
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size + 10, height: size + 10, alignItems: "center", justifyContent: "center" }}
      testID={testID}
    >
      <Animated.View style={{ transform: [{ translateY }, { rotate }] }}>
        <LearningSticker kind={kind} size={size} />
      </Animated.View>
    </View>
  );
}
