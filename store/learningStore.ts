import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { LESSONS } from "@/data/lessons";
import { awardLesson, LearningProgress, migrateLegacyProgress } from "@/lib/learningProgress";

interface LearningState extends LearningProgress {
  completeLesson: (lessonId: string, reward: number) => void;
}

export const useLearningStore = create<LearningState>()(
  persist(
    (set) => ({
      totalXp: 0,
      completedLessonIds: [],
      completeLesson: (lessonId, reward) =>
        set((state) => awardLesson(state, lessonId, reward)),
    }),
    {
      name: "learning-storage",
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ totalXp, completedLessonIds }) => ({ totalXp, completedLessonIds }),
      migrate: (previous) => migrateLegacyProgress(previous, LESSONS),
    },
  ),
);
