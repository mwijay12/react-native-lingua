import type { LanguageCode } from "@/types/learning";

// Only accept shapes this version knows how to keep. An unexpected field can
// contain data from another app version, so it must not be silently discarded.
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key));
}

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isXp(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isIdList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((id) => typeof id === "string" && id.length > 0);
}

const LANGUAGE_CODES: readonly LanguageCode[] = ["sw", "en", "es", "fr", "ja", "ko", "de", "zh"];

export function isKnownLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === "string" && LANGUAGE_CODES.some((code) => code === value);
}

export function isSavedLanguage(value: unknown, version: number): boolean {
  return version === 0 && isRecord(value) && hasOnlyKeys(value, ["selectedLanguage"])
    && (value.selectedLanguage === null || isKnownLanguageCode(value.selectedLanguage));
}

// These stores have only a known v1 format. Unknown earlier formats are
// preserved for recovery rather than guessed or sanitized into defaults.
export function isSavedPlay(value: unknown, version: number): boolean {
  return version === 1 && isRecord(value) && hasOnlyKeys(value, ["roundsCompleted", "perfectRounds"])
    && isCount(value.roundsCompleted) && value.roundsCompleted <= 1_000_000
    && isCount(value.perfectRounds) && value.perfectRounds <= value.roundsCompleted;
}

export function isSavedAudioSettings(value: unknown, version: number): boolean {
  return version === 1 && isRecord(value) && hasOnlyKeys(value, ["effectsEnabled"])
    && typeof value.effectsEnabled === "boolean";
}

export function isSavedLearning(value: unknown, version: number): boolean {
  if (!isRecord(value) || !isIdList(value.completedLessonIds)) return false;

  // Version 0 had seeded XP, a goal in XP, and a streak. Those values were
  // never earned history; the existing migration recomputes XP from lessons.
  if (version === 0) {
    return hasOnlyKeys(value, ["xpToday", "dailyGoal", "streak", "completedLessonIds"])
      && ["xpToday", "dailyGoal", "streak"].every((key) => !(key in value) || isXp(value[key]));
  }
  if (version === 1) {
    return hasOnlyKeys(value, ["totalXp", "completedLessonIds"]) && isXp(value.totalXp);
  }
  if (version !== 2 || !hasOnlyKeys(value, ["totalXp", "completedLessonIds", "dailyGoal", "activityByDate", "reviewItems"])) {
    return false;
  }
  if (!isXp(value.totalXp) || (value.dailyGoal !== 1 && value.dailyGoal !== 2 && value.dailyGoal !== 3)) return false;
  if (!isRecord(value.activityByDate) || !Array.isArray(value.reviewItems)) return false;

  const validDays = Object.entries(value.activityByDate).every(([date, day]) =>
    /^\d{4}-\d{2}-\d{2}$/.test(date) && isRecord(day) && hasOnlyKeys(day, ["lessons", "reviews"])
      && isCount(day.lessons) && isCount(day.reviews),
  );
  const validReview = value.reviewItems.every((item: unknown) =>
    isRecord(item) && hasOnlyKeys(item, ["lessonId", "activityId"])
      && typeof item.lessonId === "string" && item.lessonId.length > 0
      && typeof item.activityId === "string" && item.activityId.length > 0,
  );
  return validDays && validReview;
}
