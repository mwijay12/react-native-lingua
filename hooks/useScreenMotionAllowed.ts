import { useIsFocused } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { AppState } from "react-native";

import { useReducedMotionPreference } from "@/hooks/useReducedMotionPreference";

// Screen effects should not continue behind another route or in the background.
// Screens mount only after the launch gate has dismissed its overlay.
export function useScreenMotionAllowed() {
  const focused = useIsFocused();
  const reducedMotion = useReducedMotionPreference();
  const [active, setActive] = useState(AppState.currentState == null || AppState.currentState === "active");

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => setActive(state === "active"));
    return () => subscription.remove();
  }, []);

  return focused && active && !reducedMotion;
}
