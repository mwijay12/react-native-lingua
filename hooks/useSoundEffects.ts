import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

import { feedback, stopFeedbackSounds } from "@/lib/soundEffects";

// A screen leaving focus cancels its pending and currently playing effects.
// Scoring is independent of the shared, best-effort audio/haptics service.
export function useSoundEffects() {
  useFocusEffect(useCallback(() => () => stopFeedbackSounds(), []));
  return feedback;
}
