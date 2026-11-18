import { Ionicons } from "@expo/vector-icons";
import type { KeyboardEvent } from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";

import {
  retryAudioSettingsSave,
  useAudioSettingsHydration,
  useAudioSettingsSaveStatus,
  useAudioSettingsStore,
} from "@/store/audioSettingsStore";

// Pronunciation is always an explicit tap and is independent of this switch.
export function SoundEffectsControl({ compact = false }: { compact?: boolean }) {
  const enabled = useAudioSettingsStore((state) => state.effectsEnabled);
  const setEnabled = useAudioSettingsStore((state) => state.setEffectsEnabled);
  const hydration = useAudioSettingsHydration((state) => state.status);
  const reason = useAudioSettingsHydration((state) => state.reason);
  const save = useAudioSettingsSaveStatus((state) => state.status);
  const loading = hydration === "loading";
  const failed = hydration === "error";
  const toggle = () => {
    if (failed) void useAudioSettingsStore.persist.rehydrate();
    else if (!loading) setEnabled(!enabled);
  };
  const icon = failed ? "alert-circle-outline" : enabled && !loading ? "volume-high-outline" : "volume-mute-outline";
  // React Native Web handles Enter for a switch, but not Space. Keep native
  // behavior unchanged and prevent Space from scrolling the page on web.
  const webKeyboard = Platform.OS === "web" && !failed ? {
    onKeyDownCapture: (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === " ") {
        event.preventDefault();
        if (!event.repeat && !loading) toggle();
      }
    },
  } : {};

  const control = (
    <TouchableOpacity
      {...webKeyboard}
      onPress={toggle}
      disabled={loading}
      accessibilityRole={failed ? "button" : "switch"}
      accessibilityLabel={failed ? "Retry sound settings" : "Sound effects"}
      accessibilityHint={failed ? "Try loading the sound preference again." : "Controls short feedback sounds, not pronunciation samples."}
      accessibilityState={failed ? { disabled: loading } : { checked: enabled && !loading, disabled: loading }}
      aria-checked={failed ? undefined : enabled && !loading}
      testID="sound-effects-toggle"
      className={compact ? "w-11 h-11 rounded-full items-center justify-center" : "min-w-16 h-11 rounded-xl bg-lingua-mint flex-row items-center justify-center px-3"}
    >
      <Ionicons name={icon} size={22} color="#14675D" />
      {!compact && <Text className="font-poppins-semibold text-sm text-lingua-teal ml-2">{failed ? "Retry" : loading ? "Loading" : enabled ? "On" : "Off"}</Text>}
    </TouchableOpacity>
  );

  if (compact) return control;

  return (
    <View className="rounded-2xl border border-border bg-white p-4" testID="sound-settings">
      <View className="flex-row items-center">
        <View className="flex-1 pr-3">
          <Text className="font-poppins-semibold text-sm text-text-primary">Sound effects</Text>
          <Text className="caption mt-1">Short answer and celebration sounds. Pronunciation samples play separately when tapped.</Text>
        </View>
        {control}
      </View>
      {failed && (
        <Text className="body-sm text-text-secondary mt-3" accessibilityLiveRegion="polite">
          {reason === "newer" ? "Sound settings were saved by a newer app version. Reopen that version; do not uninstall."
            : reason === "corrupt" ? "Sound settings have an unexpected format and were not reset. Keep the app installed and seek help."
              : "Sound settings could not be read. Retry to restore your preference; lessons still work."}
        </Text>
      )}
      {save === "error" && !failed && (
        <View className="mt-3" accessibilityLiveRegion="polite">
          <Text className="body-sm text-text-secondary">Your choice works for now but could not be saved.</Text>
          <TouchableOpacity onPress={retryAudioSettingsSave} accessibilityRole="button" className="self-start py-2" testID="retry-sound-settings-save">
            <Text className="font-poppins-semibold text-sm text-lingua-teal">Retry saving</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
