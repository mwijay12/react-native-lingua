import type { Activity, Lesson } from "@/types/learning";

import { migrateLegacyProgress, type LearningProgress } from "./learningProgress";

export type DailyGoal = 1 | 2 | 3;
export type SessionKind = "lesson" | "review";

export interface StudyDay {
  lessons: number;
  reviews: number;
}

export interface ReviewItem {
  lessonId: string;
  activityId: string;
}

export interface StudyProgress {
  dailyGoal: DailyGoal;
  activityByDate: Record<string, StudyDay>;
  reviewItems: ReviewItem[];
}

export type SavedLearning = LearningProgress & StudyProgress;

export interface ReviewQuestion {
  lesson: Lesson;
  activity: Activity;
}

export const EMPTY_STUDY_PROGRESS: StudyProgress = {
  dailyGoal: 1,
  activityByDate: {},
  reviewItems: [],
};

// Dates reflect the device's local calendar, not UTC. A session belongs to the
// day on which it is finished, even when it started on the previous day.
export function localDateKey(date = new Date()): string {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function sessionCount(day: StudyDay | undefined): number {
  return day ? day.lessons + day.reviews : 0;
}

export function recordStudySession(
  activityByDate: Record<string, StudyDay>,
  kind: SessionKind,
  date = new Date(),
): Record<string, StudyDay> {
  const key = localDateKey(date);
  const previous = activityByDate[key] ?? { lessons: 0, reviews: 0 };
  return {
    ...activityByDate,
    [key]: {
      ...previous,
      [kind === "lesson" ? "lessons" : "reviews"]: previous[kind === "lesson" ? "lessons" : "reviews"] + 1,
    },
  };
}

export function lastSevenDays(activityByDate: Record<string, StudyDay>, now = new Date()) {
  // Construct calendar dates instead of subtracting 24 hours across DST.
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - index), 12);
    const key = localDateKey(date);
    return { date, key, sessions: sessionCount(activityByDate[key]) };
  });
}

// A missed question is added once and stays there until it is answered
// correctly in a separate review session, not merely retried in its lesson.
export function rememberMistake(items: readonly ReviewItem[], lessonId: string, activityId: string): ReviewItem[] {
  if (!lessonId || !activityId || items.some((item) => item.lessonId === lessonId && item.activityId === activityId)) {
    return [...items];
  }
  return [...items, { lessonId, activityId }];
}

export function clearMistake(items: readonly ReviewItem[], lessonId: string, activityId: string): ReviewItem[] {
  return items.filter((item) => item.lessonId !== lessonId || item.activityId !== activityId);
}

// Resolve IDs against the selected course so review never displays stale or
// cross-language questions if content or the active course changes.
export function getReviewQuestions(items: readonly ReviewItem[], lessons: readonly Lesson[]): ReviewQuestion[] {
  return items.flatMap((item) => {
    const lesson = lessons.find((candidate) => candidate.id === item.lessonId);
    const activity = lesson?.activities.find((candidate) => candidate.id === item.activityId);
    return lesson && activity && (activity.type === "multiple-choice" || activity.type === "translate")
      ? [{ lesson, activity }]
      : [];
  });
}

// Version 0 contained sample XP. Version 1 already held earned progress, so
// retain it rather than backdating sessions or recomputing its saved XP.
export function migrateLearningState(
  value: unknown,
  version: number,
  lessons: readonly Pick<Lesson, "id" | "xpReward">[],
): SavedLearning {
  const previous = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const legacy = migrateLegacyProgress(previous, lessons);
  if (version < 1) return { ...legacy, ...EMPTY_STUDY_PROGRESS };

  const completedLessonIds = Array.isArray(previous.completedLessonIds)
    ? [...new Set(previous.completedLessonIds.filter((id): id is string => typeof id === "string" && id.length > 0))]
    : [];
  const totalXp = typeof previous.totalXp === "number" && Number.isFinite(previous.totalXp) && previous.totalXp >= 0
    ? previous.totalXp
    : legacy.totalXp;
  return { totalXp, completedLessonIds, ...EMPTY_STUDY_PROGRESS };
}
