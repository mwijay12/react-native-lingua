import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { protectedAsyncStorage } from "@/lib/protectedAsyncStorage";
import { createProtectedStorage, protectRehydration, StorageProblem, type HydrationFailure, type SaveStatus } from "@/lib/protectedStorage";
import { isKnownLanguageCode, isSavedLanguage } from "@/lib/savedDataValidation";
import type { LanguageCode } from "@/types/learning";

export type LanguageHydrationStatus = "loading" | "ready" | "error";

export const useLanguageHydrationStatus = create<{ status: LanguageHydrationStatus; reason: HydrationFailure | null }>(
  () => ({ status: "loading", reason: null }),
);
export const useLanguageSaveStatus = create<{ status: SaveStatus }>(() => ({ status: "idle" }));

const STORAGE_KEY = "language-storage";
const STORAGE_VERSION = 0;
const protectedStorage = createProtectedStorage({
  storage: protectedAsyncStorage(AsyncStorage),
  version: STORAGE_VERSION,
  validateState: isSavedLanguage,
  hydrationStatus: () => useLanguageHydrationStatus.getState().status,
  setSaveStatus: (status) => useLanguageSaveStatus.setState({ status }),
});
const canChangeLanguage = () => useLanguageHydrationStatus.getState().status === "ready";

interface LanguageState {
  selectedLanguage: LanguageCode | null;
  setSelectedLanguage: (code: LanguageCode) => void;
  clearSelectedLanguage: () => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      selectedLanguage: null,
      setSelectedLanguage: (code) => {
        if (canChangeLanguage() && isKnownLanguageCode(code)) set({ selectedLanguage: code });
      },
      clearSelectedLanguage: () => {
        if (canChangeLanguage()) set({ selectedLanguage: null });
      },
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => protectedStorage.storage),
      partialize: ({ selectedLanguage }) => ({ selectedLanguage }),
      onRehydrateStorage: () => {
        useLanguageHydrationStatus.setState({ status: "loading", reason: null });
        return (_state, error) => {
          if (error) useLanguageHydrationStatus.setState({
            status: "error",
            reason: error instanceof StorageProblem ? error.reason : "read",
          });
        };
      },
    },
  ),
);

useLanguageStore.persist.onFinishHydration(() => {
  protectedStorage.finishHydration();
  useLanguageHydrationStatus.setState({ status: "ready", reason: null });
});
if (useLanguageStore.persist.hasHydrated()) {
  protectedStorage.finishHydration();
  useLanguageHydrationStatus.setState({ status: "ready", reason: null });
}
protectRehydration(
  useLanguageStore.persist,
  () => useLanguageHydrationStatus.getState().status,
  () => useLanguageSaveStatus.getState().status,
);

export async function retryLanguageSave(): Promise<boolean> {
  if (!canChangeLanguage() || useLanguageSaveStatus.getState().status !== "error") return false;
  await protectedStorage.storage.setItem(STORAGE_KEY, JSON.stringify({
    state: { selectedLanguage: useLanguageStore.getState().selectedLanguage },
    version: STORAGE_VERSION,
  }));
  return useLanguageSaveStatus.getState().status === "saved";
}
