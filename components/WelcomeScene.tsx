import { useEffect, useRef } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";

import { images } from "@/constants/images";
import { useScreenMotionAllowed } from "@/hooks/useScreenMotionAllowed";

// A single, small greeting rather than an endless animation. The companions
// and their speech bubbles are visible immediately, even with reduced motion.
export function WelcomeScene({ height }: { height: number }) {
  const motionAllowed = useScreenMotionAllowed();
  const hasGreeted = useRef(false);
  const greeting = useSharedValue(0);

  useEffect(() => {
    if (!motionAllowed) {
      cancelAnimation(greeting);
      greeting.value = 0;
      return;
    }
    if (hasGreeted.current) return;
    hasGreeted.current = true;
    greeting.value = withSequence(
      withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 480, easing: Easing.inOut(Easing.sin) }),
    );
    return () => cancelAnimation(greeting);
  }, [greeting, motionAllowed]);

  const catMotion = useAnimatedStyle(() => ({
    transform: [{ translateY: -4 * greeting.value }, { rotate: `${-2 * greeting.value}deg` }],
  }));
  const parrotMotion = useAnimatedStyle(() => ({
    transform: [{ translateY: -7 * greeting.value }, { rotate: `${3 * greeting.value}deg` }],
  }));
  const helloMotion = useAnimatedStyle(() => ({ transform: [{ translateY: -3 * greeting.value }] }));

  return (
    <View
      className="rounded-[28px] bg-lingua-sand overflow-hidden mt-4"
      style={{ height }}
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden
      testID="welcome-scene"
    >
      <View className="absolute w-40 h-40 rounded-full bg-[#F6D48E] left-5 bottom-[-40px]" />
      <View className="absolute w-32 h-32 rounded-full bg-[#C9E7D9] right-3 top-[-25px]" />
      <View className="absolute w-24 h-24 rounded-full border border-white/50 right-8 bottom-[-30px]" />
      <Animated.View style={[styles.cat, catMotion]}>
        <Image source={images.mascotCat} resizeMode="contain" style={styles.image} accessible={false} />
      </Animated.View>
      <Animated.View style={[styles.parrot, parrotMotion]}>
        <Image source={images.mascotParrot} resizeMode="contain" style={styles.image} accessible={false} />
      </Animated.View>
      <Animated.View style={[styles.hello, helloMotion]}>
        <View className="rounded-2xl bg-white px-3 py-1.5 border border-[#F3E9D7]">
          <Text className="font-poppins-semibold text-xs text-lingua-teal">Habari!</Text>
        </View>
      </Animated.View>
      <View className="absolute right-3 bottom-3 rounded-2xl bg-white px-3 py-1.5 border border-[#F3E9D7]">
        <Text className="font-poppins-semibold text-xs text-[#9E4938]">Bonjour!</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cat: { position: "absolute", bottom: 0, left: "16%", width: "43%", height: "94%" },
  parrot: { position: "absolute", bottom: 0, right: "10%", width: "42%", height: "78%" },
  image: { width: "100%", height: "100%" },
  hello: { position: "absolute", left: 12, top: 12 },
});
