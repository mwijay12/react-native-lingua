import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { LESSONS } from "@/data/lessons";
import { awardLesson, type LearningProgress } from "@/lib/learningProgress";
import {
  clearMistake,
  EMPTY_STUDY_PROGRESS,
  migrateLearningState,
  recordStudySession,
  rememberMistake,
  type DailyGoal,
  type StudyProgress,
} from "@/lib/studyProgress";

export type LearningHydrationStatus = "loading" | "ready" | "error";

// This status is intentionally not persisted: reporting a read failure must
// never write default progress over the value that could not be loaded.
export const useLearningHydrationStatus = create<{ status: LearningHydrationStatus }>(() => ({ status: "loading" }));

interface LearningState extends LearningProgress, StudyProgress {
  completeLesson: (lessonId: string) => void;
  setDailyGoal: (goal: DailyGoal) => void;
  addMistake: (lessonId: string, activityId: string) => void;
  clearReviewQuestion: (lessonId: string, activityId: string) => void;
  completeReview: () => void;
}

export const useLearningStore = create<LearningState>()(
  persist(
    (set) => ({
      totalXp: 0,
      completedLessonIds: [],
      ...EMPTY_STUDY_PROGRESS,
      completeLesson: (lessonId) => {
        const lesson = LESSONS.find((item) => item.id === lessonId);
        if (!lesson || !lesson.activities.length) return;
        set((state) => ({
          ...awardLesson(
            { totalXp: state.totalXp, completedLessonIds: state.completedLessonIds },
            lesson.id,
            lesson.xpReward,
          ),
          activityByDate: recordStudySession(state.activityByDate, "lesson"),
        }));
      },
      setDailyGoal: (goal) => {
        if (goal === 1 || goal === 2 || goal === 3) set({ dailyGoal: goal });
      },
      addMistake: (lessonId, activityId) => {
        const lesson = LESSONS.find((item) => item.id === lessonId);
        if (!lesson?.activities.some((item) => item.id === activityId)) return;
        set((state) => ({ reviewItems: rememberMistake(state.reviewItems, lessonId, activityId) }));
      },
      clearReviewQuestion: (lessonId, activityId) =>
        set((state) => ({ reviewItems: clearMistake(state.reviewItems, lessonId, activityId) })),
      completeReview: () =>
        set((state) => ({ activityByDate: recordStudySession(state.activityByDate, "review") })),
    }),
    {
      name: "learning-storage",
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => {
        useLearningHydrationStatus.setState({ status: "loading" });
        return (_state, error) => {
          if (error) useLearningHydrationStatus.setState({ status: "error" });
        };
      },
      partialize: ({ totalXp, completedLessonIds, dailyGoal, activityByDate, reviewItems }) => ({
        totalXp, completedLessonIds, dailyGoal, activityByDate, reviewItems,
      }),
      migrate: (previous, version) => migrateLearningState(previous, version, LESSONS),
    },
  ),
);

// The finish event runs only after Zustand has applied the saved state and set
// hasHydrated. Also handle storage implementations that complete synchronously.
useLearningStore.persist.onFinishHydration(() => useLearningHydrationStatus.setState({ status: "ready" }));
if (useLearningStore.persist.hasHydrated()) useLearningHydrationStatus.setState({ status: "ready" });
