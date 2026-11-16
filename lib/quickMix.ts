import type { Activity, Lesson } from "@/types/learning";
import type { StudyDay } from "@/lib/studyProgress";

import { normalizeAnswer } from "./practice";

export const MIX_QUESTION_LIMIT = 3;

export interface MixQuestion {
  lessonId: string;
  lessonTitle: string;
  activity: Activity;
}

export interface PlayProgress {
  roundsCompleted: number;
  perfectRounds: number;
}

export const EMPTY_PLAY_PROGRESS: PlayProgress = { roundsCompleted: 0, perfectRounds: 0 };

// Use only questions with distinct choices and a real answer. Never rewrite the
// source lessons or pull questions from a different course.
function isPlayableChoice(activity: Activity): boolean {
  const options = activity.options;
  if (activity.type !== "multiple-choice" || !activity.id || !activity.question || !activity.correctAnswer || !options || options.length < 2) return false;
  const normalized = options.map(normalizeAnswer);
  return normalized.every(Boolean)
    && new Set(normalized).size === normalized.length
    && normalized.includes(normalizeAnswer(activity.correctAnswer));
}

export function getMixPool(lessons: readonly Lesson[], completedLessonIds: readonly string[]) {
  const completed = new Set(completedLessonIds);
  const fromLessons = (source: readonly Lesson[]) => source.flatMap((lesson) =>
    lesson.activities.filter(isPlayableChoice).map((activity) => ({
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      activity,
    })),
  );
  const practiced = fromLessons(lessons.filter((lesson) => completed.has(lesson.id)));
  if (practiced.length) return { questions: practiced, preview: false };

  // A new learner can play immediately using a sample from the first playable
  // lesson, without pretending that lesson has been completed.
  const firstPlayable = lessons.find((lesson) => lesson.activities.some(isPlayableChoice));
  return { questions: firstPlayable ? fromLessons([firstPlayable]) : [], preview: true };
}

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const sample = random();
    const bounded = Number.isFinite(sample) ? Math.max(0, Math.min(sample, 0.999999999)) : 0;
    const other = Math.floor(bounded * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

export function makeQuickMix(pool: readonly MixQuestion[], random: () => number = Math.random): MixQuestion[] {
  return shuffled(pool, random).slice(0, MIX_QUESTION_LIMIT).map((question) => ({
    ...question,
    activity: { ...question.activity, options: shuffled(question.activity.options ?? [], random) },
  }));
}

function count(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.min(1_000_000, Math.floor(value))
    : 0;
}

export function sanitizePlayProgress(value: unknown): PlayProgress {
  const data = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const roundsCompleted = count(data.roundsCompleted);
  return { roundsCompleted, perfectRounds: Math.min(roundsCompleted, count(data.perfectRounds)) };
}

export function isValidMixResult(correct: number, total: number): boolean {
  return Number.isInteger(correct) && Number.isInteger(total)
    && total > 0 && total <= MIX_QUESTION_LIMIT && correct >= 0 && correct <= total;
}

export function recordMixRound(progress: PlayProgress, correct: number, total: number): PlayProgress {
  if (!isValidMixResult(correct, total)) return progress;
  return {
    roundsCompleted: Math.min(1_000_000, progress.roundsCompleted + 1),
    perfectRounds: Math.min(1_000_000, progress.perfectRounds + (correct === total ? 1 : 0)),
  };
}

export interface RewardBadge {
  id: string;
  title: string;
  description: string;
  sticker: "book" | "globe" | "talk" | "review" | "numbers" | "medal";
  value: number;
  target: number;
  unit: string;
  unlocked: boolean;
}

// Milestones are derived from real, known lesson IDs and recorded sessions.
// Existing learners see their earned stickers without a progress migration.
export function getRewardBadges(
  courses: readonly (readonly Pick<Lesson, "id">[])[],
  completedLessonIds: readonly string[],
  activityByDate: Readonly<Record<string, StudyDay>>,
  play: PlayProgress,
): RewardBadge[] {
  const known = new Set(courses.flatMap((course) => course.map((lesson) => lesson.id)));
  const completed = new Set(completedLessonIds.filter((id) => known.has(id)));
  const coursesVisited = courses.filter((course) => course.some((lesson) => completed.has(lesson.id))).length;
  const reviews = Object.values(activityByDate).reduce((sum, day) => sum + count(day?.reviews), 0);
  const specs = [
    { id: "first-step", title: "First Step", description: "Finish your first lesson.", sticker: "book", value: completed.size, target: 1, unit: "lessons" },
    { id: "trail-finder", title: "Trail Finder", description: "Finish three different lessons.", sticker: "globe", value: completed.size, target: 3, unit: "lessons" },
    { id: "language-explorer", title: "Language Explorer", description: "Finish a lesson in each course.", sticker: "talk", value: coursesVisited, target: courses.length, unit: "courses" },
    { id: "practice-pal", title: "Practice Pal", description: "Finish a review set.", sticker: "review", value: reviews, target: 1, unit: "reviews" },
    { id: "mix-maker", title: "Mix Maker", description: "Finish your first Quick Mix.", sticker: "numbers", value: play.roundsCompleted, target: 1, unit: "rounds" },
    { id: "bright-star", title: "Bright Star", description: "Answer every question in a mix correctly.", sticker: "medal", value: play.perfectRounds, target: 1, unit: "perfect rounds" },
  ] as const;
  return specs.map((badge) => ({ ...badge, value: Math.min(badge.value, badge.target), unlocked: badge.target > 0 && badge.value >= badge.target }));
}
