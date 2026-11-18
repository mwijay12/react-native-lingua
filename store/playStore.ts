import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { protectedAsyncStorage } from "@/lib/protectedAsyncStorage";
import { createProtectedStorage, protectRehydration, StorageProblem, type HydrationFailure, type SaveStatus } from "@/lib/protectedStorage";
import {
  EMPTY_PLAY_PROGRESS,
  isValidMixResult,
  recordMixRound,
  sanitizePlayProgress,
  type PlayProgress,
} from "@/lib/quickMix";
import { isSavedPlay } from "@/lib/savedDataValidation";

export type PlayHydrationStatus = "loading" | "ready" | "error";
export const usePlayHydrationStatus = create<{ status: PlayHydrationStatus; reason: HydrationFailure | null }>(
  () => ({ status: "loading", reason: null }),
);
export type PlaySaveStatus = SaveStatus;
export const usePlaySaveStatus = create<{ status: PlaySaveStatus }>(() => ({ status: "idle" }));

const STORAGE_KEY = "play-storage";
const STORAGE_VERSION = 1;
const protectedStorage = createProtectedStorage({
  storage: protectedAsyncStorage(AsyncStorage),
  version: STORAGE_VERSION,
  validateState: isSavedPlay,
  hydrationStatus: () => usePlayHydrationStatus.getState().status,
  setSaveStatus: (status) => usePlaySaveStatus.setState({ status }),
});

interface PlayState extends PlayProgress {
  completeMix: (correct: number, total: number) => void;
}

// Play rewards have their own key, leaving existing XP and study history intact.
// Protecting the snapshot does not change how a Quick Mix round is scored.
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
      storage: createJSONStorage(() => protectedStorage.storage),
      partialize: ({ roundsCompleted, perfectRounds }) => ({ roundsCompleted, perfectRounds }),
      merge: (saved, current) => ({ ...current, ...sanitizePlayProgress(saved) }),
      onRehydrateStorage: () => {
        usePlayHydrationStatus.setState({ status: "loading", reason: null });
        return (_state, error) => {
          if (error) usePlayHydrationStatus.setState({
            status: "error",
            reason: error instanceof StorageProblem ? error.reason : "read",
          });
        };
      },
    },
  ),
);

usePlayStore.persist.onFinishHydration(() => {
  protectedStorage.finishHydration();
  usePlayHydrationStatus.setState({ status: "ready", reason: null });
});
if (usePlayStore.persist.hasHydrated()) {
  protectedStorage.finishHydration();
  usePlayHydrationStatus.setState({ status: "ready", reason: null });
}
protectRehydration(
  usePlayStore.persist,
  () => usePlayHydrationStatus.getState().status,
  () => usePlaySaveStatus.getState().status,
);

export function retryPlaySave() {
  if (usePlayHydrationStatus.getState().status !== "ready" || usePlaySaveStatus.getState().status !== "error") return;
  const { roundsCompleted, perfectRounds } = usePlayStore.getState();
  void protectedStorage.storage.setItem(STORAGE_KEY, JSON.stringify({
    state: { roundsCompleted, perfectRounds },
    version: STORAGE_VERSION,
  }));
}
