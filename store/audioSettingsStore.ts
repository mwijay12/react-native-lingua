import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

type HydrationStatus = "loading" | "ready" | "error";
type SaveStatus = "saved" | "saving" | "error";
export const useAudioSettingsHydration = create<{ status: HydrationStatus }>(() => ({ status: "loading" }));
export const useAudioSettingsSaveStatus = create<{ status: SaveStatus }>(() => ({ status: "saved" }));

const STORAGE_KEY = "audio-settings";
const STORAGE_VERSION = 1;
let latestWrite = 0;
let pendingWrite = Promise.resolve();

// Keep this preference separate from learning and play progress. Serialize
// writes so rapid toggles cannot restore an older value after a slower write.
const settingsStorage: StateStorage = {
  getItem: (name) => AsyncStorage.getItem(name),
  setItem: (name, value) => {
    const sequence = ++latestWrite;
    useAudioSettingsSaveStatus.setState({ status: "saving" });
    pendingWrite = pendingWrite.then(async () => {
      try {
        await AsyncStorage.setItem(name, value);
        if (sequence === latestWrite) useAudioSettingsSaveStatus.setState({ status: "saved" });
      } catch {
        if (sequence === latestWrite) useAudioSettingsSaveStatus.setState({ status: "error" });
      }
    });
    return pendingWrite;
  },
  removeItem: (name) => AsyncStorage.removeItem(name),
};

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
        if (useAudioSettingsHydration.getState().status === "ready") set({ effectsEnabled: enabled });
      },
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => settingsStorage),
      partialize: ({ effectsEnabled }) => ({ effectsEnabled }),
      migrate: (saved, version) => {
        if (version > STORAGE_VERSION) throw new Error("Sound settings were saved by a newer version.");
        return saved as Pick<AudioSettings, "effectsEnabled">;
      },
      merge: (saved, current) => {
        const data = saved && typeof saved === "object" ? saved as Partial<AudioSettings> : {};
        return { ...current, effectsEnabled: typeof data.effectsEnabled === "boolean" ? data.effectsEnabled : true };
      },
      onRehydrateStorage: () => {
        useAudioSettingsHydration.setState({ status: "loading" });
        return (_state, error) => {
          if (error) useAudioSettingsHydration.setState({ status: "error" });
        };
      },
    },
  ),
);

useAudioSettingsStore.persist.onFinishHydration(() => useAudioSettingsHydration.setState({ status: "ready" }));
if (useAudioSettingsStore.persist.hasHydrated()) useAudioSettingsHydration.setState({ status: "ready" });

export function retryAudioSettingsSave() {
  if (useAudioSettingsHydration.getState().status !== "ready" || useAudioSettingsSaveStatus.getState().status !== "error") return;
  void settingsStorage.setItem(STORAGE_KEY, JSON.stringify({
    state: { effectsEnabled: useAudioSettingsStore.getState().effectsEnabled },
    version: STORAGE_VERSION,
  }));
}
