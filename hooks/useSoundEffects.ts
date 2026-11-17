import { useCallback, useEffect } from "react";

import { soundEffects } from "@/constants/audio";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";
import { useAudioSettingsHydration, useAudioSettingsStore } from "@/store/audioSettingsStore";

// Chimes never affect scoring and are best-effort: a playback failure must not
// interrupt a lesson, review or mix. Nothing plays while settings are unread.
export function useSoundEffects() {
  const { play: playCorrect, stop: stopCorrect } = useAudioPlayback(soundEffects.correct);
  const { play: playCelebration, stop: stopCelebration } = useAudioPlayback(soundEffects.celebration);
  const enabled = useAudioSettingsStore((state) => state.effectsEnabled);
  const ready = useAudioSettingsHydration((state) => state.status === "ready");

  useEffect(() => {
    if (!enabled || !ready) {
      stopCorrect();
      stopCelebration();
    }
  }, [enabled, ready, stopCorrect, stopCelebration]);

  const correct = useCallback(() => {
    if (useAudioSettingsHydration.getState().status !== "ready" || !useAudioSettingsStore.getState().effectsEnabled) return;
    stopCelebration();
    playCorrect();
  }, [playCorrect, stopCelebration]);

  const celebrate = useCallback(() => {
    if (useAudioSettingsHydration.getState().status !== "ready" || !useAudioSettingsStore.getState().effectsEnabled) return;
    stopCorrect();
    playCelebration();
  }, [playCelebration, stopCorrect]);

  return { correct, celebrate };
}
