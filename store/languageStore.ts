import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { LanguageCode } from "@/types/learning";

export type LanguageHydrationStatus = "loading" | "ready" | "error";

// Keep hydration state separate so a failed read never writes a default course.
export const useLanguageHydrationStatus = create<{ status: LanguageHydrationStatus }>(() => ({ status: "loading" }));

interface LanguageState {
  selectedLanguage: LanguageCode | null;
  setSelectedLanguage: (code: LanguageCode) => void;
  clearSelectedLanguage: () => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      selectedLanguage: null,
      setSelectedLanguage: (code) => set({ selectedLanguage: code }),
      clearSelectedLanguage: () => set({ selectedLanguage: null }),
    }),
    {
      name: "language-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => {
        useLanguageHydrationStatus.setState({ status: "loading" });
        return (_state, error) => {
          if (error) useLanguageHydrationStatus.setState({ status: "error" });
        };
      },
    }
  )
);

useLanguageStore.persist.onFinishHydration(() => useLanguageHydrationStatus.setState({ status: "ready" }));
if (useLanguageStore.persist.hasHydrated()) useLanguageHydrationStatus.setState({ status: "ready" });
