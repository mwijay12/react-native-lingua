import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { protectedAsyncStorage } from "@/lib/protectedAsyncStorage";
import { createProtectedStorage, protectRehydration, StorageProblem, type HydrationFailure, type SaveStatus } from "@/lib/protectedStorage";
import { isSavedAudioSettings } from "@/lib/savedDataValidation";

type HydrationStatus = "loading" | "ready" | "error";
export const useAudioSettingsHydration = create<{ status: HydrationStatus; reason: HydrationFailure | null }>(
  () => ({ status: "loading", reason: null }),
);
export const useAudioSettingsSaveStatus = create<{ status: SaveStatus }>(() => ({ status: "idle" }));

const STORAGE_KEY = "audio-settings";
const STORAGE_VERSION = 1;
const protectedStorage = createProtectedStorage({
  storage: protectedAsyncStorage(AsyncStorage),
  version: STORAGE_VERSION,
  validateState: isSavedAudioSettings,
  hydrationStatus: () => useAudioSettingsHydration.getState().status,
  setSaveStatus: (status) => useAudioSettingsSaveStatus.setState({ status }),
});

interface AudioSettings {
  effectsEnabled: boolean;
  setEffectsEnabled: (enabled: boolean) => void;
}

export const useAudioSettingsStore = create<AudioSettings>()(
  persist(
    (set) => ({
      effectsEnabled: true,
      setEffectsEnabled: (enabled) => {
        // Never overwrite a setting that could not be read.
        if (useAudioSettingsHydration.getState().status === "ready" && typeof enabled === "boolean") {
          set({ effectsEnabled: enabled });
        }
      },
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => protectedStorage.storage),
      partialize: ({ effectsEnabled }) => ({ effectsEnabled }),
      onRehydrateStorage: () => {
        useAudioSettingsHydration.setState({ status: "loading", reason: null });
        return (_state, error) => {
          if (error) useAudioSettingsHydration.setState({
            status: "error",
            reason: error instanceof StorageProblem ? error.reason : "read",
          });
        };
      },
    },
  ),
);

useAudioSettingsStore.persist.onFinishHydration(() => {
  protectedStorage.finishHydration();
  useAudioSettingsHydration.setState({ status: "ready", reason: null });
});
if (useAudioSettingsStore.persist.hasHydrated()) {
  protectedStorage.finishHydration();
  useAudioSettingsHydration.setState({ status: "ready", reason: null });
}
protectRehydration(
  useAudioSettingsStore.persist,
  () => useAudioSettingsHydration.getState().status,
  () => useAudioSettingsSaveStatus.getState().status,
);

export function retryAudioSettingsSave() {
  if (useAudioSettingsHydration.getState().status !== "ready" || useAudioSettingsSaveStatus.getState().status !== "error") return;
  void protectedStorage.storage.setItem(STORAGE_KEY, JSON.stringify({
    state: { effectsEnabled: useAudioSettingsStore.getState().effectsEnabled },
    version: STORAGE_VERSION,
  }));
}
