import { useEffect, useRef } from "react";
import { Animated, Easing, Platform, View } from "react-native";

import { LearningSticker, type StickerKind } from "@/components/LearningSticker";
import { useScreenMotionAllowed } from "@/hooks/useScreenMotionAllowed";

// Placement belongs to the parent. This inner layer owns a very small drift;
// nothing moves over the surrounding text, and the drawing never starts hidden.
export function MotionSticker({ kind, size = 72, testID }: { kind: StickerKind; size?: number; testID?: string }) {
  const motionAllowed = useScreenMotionAllowed();
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!motionAllowed) {
      drift.stopAnimation();
      drift.setValue(0);
      return;
    }

    const timing = (toValue: number, duration: number) => Animated.timing(drift, {
      toValue,
      duration,
      easing: Easing.inOut(Easing.sin),
      // A decorative loop must not hold up virtualized lesson lists.
      isInteraction: false,
      useNativeDriver: Platform.OS !== "web",
    });
    const loop = Animated.loop(Animated.sequence([timing(1, 1200), timing(-1, 2400), timing(0, 1200)]));
    loop.start();
    return () => {
      loop.stop();
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
