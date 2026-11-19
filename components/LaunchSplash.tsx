import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AppState, Image, Pressable, StyleSheet, Text, View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import { CREATOR_CREDIT } from "@/constants/branding";
import { images } from "@/constants/images";
import { useResolvedReducedMotionPreference } from "@/hooks/useReducedMotionPreference";

// The native splash stays up until this matching teal view has laid out. As a
// precaution, attach navigation in a separate turn after the overlay is gone.
// Hydration continues independently, and tapping skips the introduction.
export function LaunchGate({ children }: { children: ReactNode }) {
  const [launching, setLaunching] = useState(true);
  const [contentReady, setContentReady] = useState(false);
  const finish = useCallback(() => setLaunching(false), []);

  useEffect(() => {
    if (launching) return;
    const timer = setTimeout(() => setContentReady(true), 50);
    return () => clearTimeout(timer);
  }, [launching]);

  return (
    <View style={styles.root}>
      {contentReady && <View style={styles.content}>{children}</View>}
      {launching && <LaunchSplash onComplete={finish} />}
    </View>
  );
}

export function LaunchSplash({ onComplete }: { onComplete: () => void }) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useResolvedReducedMotionPreference();
  const [laidOut, setLaidOut] = useState(false);
  const [active, setActive] = useState(AppState.currentState == null || AppState.currentState === "active");
  const hiddenNativeSplash = useRef(false);
  const intro = useSharedValue(0);
  const opacity = useSharedValue(1);

  const onLayout = useCallback(() => {
    if (hiddenNativeSplash.current) return;
    hiddenNativeSplash.current = true;
    // The content is already laid out before the native launch screen hides.
    void SplashScreen.hideAsync().catch(() => {
      console.warn("The native splash screen could not be hidden.");
    });
    setLaidOut(true);
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => setActive(state === "active"));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!laidOut) return;
    if (!active || reducedMotion === true) {
      onComplete();
      return;
    }
    if (reducedMotion === null) return;

    intro.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) });
    opacity.value = withDelay(460, withTiming(0, { duration: 220, easing: Easing.out(Easing.quad) }, (finished) => {
      if (finished) scheduleOnRN(onComplete);
    }));
    // If an animation callback is interrupted or unavailable, do not trap the
    // user on the splash. This is a maximum, not a loading/progress estimate.
    const fallback = setTimeout(onComplete, 1100);
    return () => {
      clearTimeout(fallback);
      cancelAnimation(intro);
      cancelAnimation(opacity);
    };
  }, [active, intro, laidOut, onComplete, opacity, reducedMotion]);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -3 * intro.value }, { scale: 1 + 0.06 * intro.value }],
  }));
  const orbitStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + 0.3 * intro.value,
    transform: [{ scale: 0.96 + 0.06 * intro.value }],
  }));
  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: 0.85 + 0.15 * intro.value,
    transform: [{ translateY: 4 * (1 - intro.value) }],
  }));

  return (
    <Animated.View style={[styles.overlay, fadeStyle]} accessibilityViewIsModal testID="launch-splash">
      <StatusBar style="light" />
      <Pressable
        onLayout={onLayout}
        onPress={onComplete}
        style={styles.touchArea}
        accessibilityRole="button"
        accessibilityLabel="Lingua is starting. Tap to continue."
        testID="skip-launch-animation"
      >
        <View style={styles.center} pointerEvents="none" accessible={false} aria-hidden>
          <Animated.View style={[styles.orbit, orbitStyle]} />
          <View style={styles.innerOrbit} />
          <Animated.View style={logoStyle}>
            <Image source={images.splashLogo} style={styles.logo} resizeMode="contain" accessible={false} />
          </Animated.View>
          <Animated.View style={[styles.wordmark, wordmarkStyle]}>
            <Text className="font-poppins-bold text-[34px] text-[#FFF9EC] text-center">lingua</Text>
            <Text className="font-poppins-semibold text-[9px] tracking-[2px] text-[#C9E8DC] text-center">LANGUAGE FOR LIFE</Text>
          </Animated.View>
        </View>
        <View style={[styles.footer, { bottom: Math.max(insets.bottom + 20, 30) }]} pointerEvents="none" accessible={false} aria-hidden>
          <Text className="font-poppins-semibold text-[9px] tracking-[1.5px] text-[#D5EBE2] text-center">HABARI  ·  HELLO  ·  BONJOUR</Text>
          <Text className="font-poppins-medium text-[10px] text-[#D5EBE2] text-center mt-2">{CREATOR_CREDIT}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#155F57" },
  content: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "#155F57", zIndex: 10 },
  touchArea: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  orbit: { position: "absolute", width: 176, height: 176, borderRadius: 88, borderWidth: 1, borderColor: "#A9D4C5" },
  innerOrbit: { position: "absolute", width: 140, height: 140, borderRadius: 70, borderWidth: 1, borderColor: "rgba(215, 239, 226, 0.16)" },
  logo: { width: 200, height: 200 },
  wordmark: { position: "absolute", top: "50%", marginTop: 94, alignItems: "center", width: "100%" },
  footer: { position: "absolute", left: 16, right: 16 },
});
