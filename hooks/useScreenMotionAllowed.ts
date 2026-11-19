import { useIsFocused } from "@react-navigation/native";
import { useContext, useEffect, useState } from "react";
import { AppState } from "react-native";

import { useReducedMotionPreference } from "@/hooks/useReducedMotionPreference";
import { LaunchVisibilityContext } from "@/lib/launchVisibility";

// Screen effects should not continue behind another route or in the background.
export function useScreenMotionAllowed() {
  const focused = useIsFocused();
  const launchFinished = useContext(LaunchVisibilityContext);
  const reducedMotion = useReducedMotionPreference();
  const [active, setActive] = useState(AppState.currentState == null || AppState.currentState === "active");

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => setActive(state === "active"));
    return () => subscription.remove();
  }, []);

  return launchFinished && focused && active && !reducedMotion;
}
