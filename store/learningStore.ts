import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { LESSONS } from "@/data/lessons";
import { awardLesson, type LearningProgress } from "@/lib/learningProgress";
import { protectedAsyncStorage } from "@/lib/protectedAsyncStorage";
import { createProtectedStorage, protectRehydration, StorageProblem, type HydrationFailure, type SaveStatus } from "@/lib/protectedStorage";
import { isSavedLearning } from "@/lib/savedDataValidation";
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

// These statuses are not persisted: reporting an error must not write defaults.
export const useLearningHydrationStatus = create<{ status: LearningHydrationStatus; reason: HydrationFailure | null }>(
  () => ({ status: "loading", reason: null }),
);
export const useLearningSaveStatus = create<{ status: SaveStatus }>(() => ({ status: "idle" }));

const STORAGE_KEY = "learning-storage";
const STORAGE_VERSION = 2;
const protectedStorage = createProtectedStorage({
  storage: protectedAsyncStorage(AsyncStorage),
  version: STORAGE_VERSION,
  validateState: isSavedLearning,
  hydrationStatus: () => useLearningHydrationStatus.getState().status,
  setSaveStatus: (status) => useLearningSaveStatus.setState({ status }),
});
const canChangeProgress = () => useLearningHydrationStatus.getState().status === "ready";

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
        if (!canChangeProgress()) return;
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
        if (canChangeProgress() && (goal === 1 || goal === 2 || goal === 3)) set({ dailyGoal: goal });
      },
      addMistake: (lessonId, activityId) => {
        if (!canChangeProgress()) return;
        const lesson = LESSONS.find((item) => item.id === lessonId);
        if (!lesson?.activities.some((item) => item.id === activityId)) return;
        set((state) => ({ reviewItems: rememberMistake(state.reviewItems, lessonId, activityId) }));
      },
      clearReviewQuestion: (lessonId, activityId) => {
        if (canChangeProgress()) set((state) => ({ reviewItems: clearMistake(state.reviewItems, lessonId, activityId) }));
      },
      completeReview: () => {
        if (canChangeProgress()) set((state) => ({ activityByDate: recordStudySession(state.activityByDate, "review") }));
      },
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => protectedStorage.storage),
      onRehydrateStorage: () => {
        useLearningHydrationStatus.setState({ status: "loading", reason: null });
        return (_state, error) => {
          if (error) useLearningHydrationStatus.setState({
            status: "error",
            reason: error instanceof StorageProblem ? error.reason : "read",
          });
        };
      },
      partialize: ({ totalXp, completedLessonIds, dailyGoal, activityByDate, reviewItems }) => ({
        totalXp, completedLessonIds, dailyGoal, activityByDate, reviewItems,
      }),
      migrate: (previous, version) => migrateLearningState(previous, version, LESSONS),
    },
  ),
);

useLearningStore.persist.onFinishHydration(() => {
  protectedStorage.finishHydration();
  useLearningHydrationStatus.setState({ status: "ready", reason: null });
});
if (useLearningStore.persist.hasHydrated()) {
  protectedStorage.finishHydration();
  useLearningHydrationStatus.setState({ status: "ready", reason: null });
}
protectRehydration(
  useLearningStore.persist,
  () => useLearningHydrationStatus.getState().status,
  () => useLearningSaveStatus.getState().status,
);

// Retry the current snapshot, not the lesson/review event that produced it.
export async function retryLearningSave(): Promise<boolean> {
  if (!canChangeProgress() || useLearningSaveStatus.getState().status !== "error") return false;
  const { totalXp, completedLessonIds, dailyGoal, activityByDate, reviewItems } = useLearningStore.getState();
  await protectedStorage.storage.setItem(STORAGE_KEY, JSON.stringify({
    state: { totalXp, completedLessonIds, dailyGoal, activityByDate, reviewItems },
    version: STORAGE_VERSION,
  }));
  return useLearningSaveStatus.getState().status === "saved";
}
