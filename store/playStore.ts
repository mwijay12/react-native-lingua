import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

import {
  EMPTY_PLAY_PROGRESS,
  isValidMixResult,
  recordMixRound,
  sanitizePlayProgress,
  type PlayProgress,
} from "@/lib/quickMix";

export type PlayHydrationStatus = "loading" | "ready" | "error";
export const usePlayHydrationStatus = create<{ status: PlayHydrationStatus }>(() => ({ status: "loading" }));
export type PlaySaveStatus = "saved" | "saving" | "error";
export const usePlaySaveStatus = create<{ status: PlaySaveStatus }>(() => ({ status: "saved" }));

const STORAGE_KEY = "play-storage";
const STORAGE_VERSION = 1;
let latestWrite = 0;
let pendingWrite = Promise.resolve();

// Serialize writes so a slow earlier round cannot replace a newer one. A
// failed write leaves the in-memory rewards visible and offers a retry.
const playStorage: StateStorage = {
  getItem: (name) => AsyncStorage.getItem(name),
  setItem: (name, value) => {
    const sequence = ++latestWrite;
    usePlaySaveStatus.setState({ status: "saving" });
    pendingWrite = pendingWrite.then(async () => {
      try {
        await AsyncStorage.setItem(name, value);
        if (sequence === latestWrite) usePlaySaveStatus.setState({ status: "saved" });
      } catch {
        if (sequence === latestWrite) usePlaySaveStatus.setState({ status: "error" });
      }
    });
    return pendingWrite;
  },
  removeItem: (name) => AsyncStorage.removeItem(name),
};

interface PlayState extends PlayProgress {
  completeMix: (correct: number, total: number) => void;
}

// Play rewards have their own key, leaving existing XP and study history intact.
export const usePlayStore = create<PlayState>()(
  persist(
    (set) => ({
      ...EMPTY_PLAY_PROGRESS,
      completeMix: (correct, total) => {
        if (usePlayHydrationStatus.getState().status !== "ready" || !isValidMixResult(correct, total)) return;
        set((state) => recordMixRound(state, correct, total));
      },
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => playStorage),
      partialize: ({ roundsCompleted, perfectRounds }) => ({ roundsCompleted, perfectRounds }),
      migrate: (saved, version) => {
        if (version > STORAGE_VERSION) throw new Error("Play rewards were saved by a newer version.");
        return sanitizePlayProgress(saved);
      },
      merge: (saved, current) => ({ ...current, ...sanitizePlayProgress(saved) }),
      onRehydrateStorage: () => {
        usePlayHydrationStatus.setState({ status: "loading" });
        return (_state, error) => {
          if (error) usePlayHydrationStatus.setState({ status: "error" });
        };
      },
    },
  ),
);

usePlayStore.persist.onFinishHydration(() => usePlayHydrationStatus.setState({ status: "ready" }));
if (usePlayStore.persist.hasHydrated()) usePlayHydrationStatus.setState({ status: "ready" });

export function retryPlaySave() {
  if (usePlayHydrationStatus.getState().status !== "ready" || usePlaySaveStatus.getState().status !== "error") return;
  const { roundsCompleted, perfectRounds } = usePlayStore.getState();
  void playStorage.setItem(STORAGE_KEY, JSON.stringify({
    state: { roundsCompleted, perfectRounds },
    version: STORAGE_VERSION,
  }));
}
