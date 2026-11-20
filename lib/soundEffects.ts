import { setAudioModeAsync } from "expo-audio";
import * as Haptics from "expo-haptics";
import { AppState, Platform } from "react-native";

import { soundEffects } from "@/constants/audio";
import { createEffectPlayer } from "@/lib/effectPlayer";
import { createSoundEffectsManager } from "@/lib/soundEffectsManager";
import { useAudioSettingsHydration, useAudioSettingsStore } from "@/store/audioSettingsStore";

const enabled = () => useAudioSettingsHydration.getState().status === "ready"
  && useAudioSettingsStore.getState().effectsEnabled;
const manager = createSoundEffectsManager(
  (effect, canContinue) => createEffectPlayer(soundEffects[effect], canContinue),
  enabled,
);
let started = false;
let active = AppState.currentState == null || AppState.currentState === "active";
let lifecycle = 0;

// Called once at the app root, including the standalone demo. Keep the audio
// session shared by pronunciation and feedback: no player globally mutes or
// deactivates the other. Mixing avoids taking Android focus from other apps.
export function startAudioFeedback() {
  if (started) return () => {};
  started = true;
  lifecycle += 1;
  active = AppState.currentState == null || AppState.currentState === "active";
  if (Platform.OS !== "web") {
    try {
      void setAudioModeAsync({
        playsInSilentMode: false,
        interruptionMode: "mixWithOthers",
        shouldPlayInBackground: false,
        allowsRecording: false,
      }).catch(() => { /* A device may not support this session configuration. */ });
    } catch { /* Continue without optional audio configuration. */ }
  }
  manager.start();
  manager.setActive(active);
  const appState = AppState.addEventListener("change", (state) => {
    lifecycle += 1;
    active = state === "active";
    manager.setActive(active);
  });
  const unsubscribeSettings = useAudioSettingsStore.subscribe(() => {
    if (!enabled()) manager.stopAll();
  });
  const unsubscribeHydration = useAudioSettingsHydration.subscribe(() => {
    if (!enabled()) manager.stopAll();
  });

  return () => {
    started = false;
    lifecycle += 1;
    appState.remove();
    unsubscribeSettings();
    unsubscribeHydration();
    manager.dispose();
  };
}

function haptic(kind: "correct" | "wrong" | "celebration") {
  if (!started || !active || Platform.OS === "web") return;
  const currentLifecycle = lifecycle;
  try {
    if (Platform.OS === "android") {
      const primary = kind === "wrong" ? Haptics.AndroidHaptics.Reject
        : kind === "celebration" ? Haptics.AndroidHaptics.Confirm : Haptics.AndroidHaptics.Segment_Tick;
      // Newer patterns are unavailable on some supported Android releases.
      // These older view-feedback patterns still respect system haptic settings.
      const fallback = kind === "correct" ? Haptics.AndroidHaptics.Clock_Tick : Haptics.AndroidHaptics.Context_Click;
      void Haptics.performAndroidHapticsAsync(primary).catch(() => {
        try {
          if (started && active && lifecycle === currentLifecycle) void Haptics.performAndroidHapticsAsync(fallback).catch(() => {});
        } catch { /* No compatible haptic engine. */ }
      });
    } else {
      const pulse = kind === "correct"
        ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        : Haptics.notificationAsync(kind === "wrong"
          ? Haptics.NotificationFeedbackType.Error : Haptics.NotificationFeedbackType.Success);
      void pulse.catch(() => { /* Haptics are not available on every device. */ });
    }
  } catch { /* Feedback must never prevent scoring. */ }
}

// Haptics follow the device's haptic settings; the existing switch controls
// sounds only, and does not mute explicit pronunciation or vibrations.
export const feedback = {
  option: () => manager.play("option"),
  correct: () => { manager.play("correct"); haptic("correct"); },
  wrong: () => { manager.play("wrong"); haptic("wrong"); },
  celebrate: () => { manager.play("celebration"); haptic("celebration"); },
};

export const stopFeedbackSounds = () => manager.stopAll();
