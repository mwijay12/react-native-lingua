export interface LearningProgress {
  totalXp: number;
  completedLessonIds: string[];
}

interface LessonReward {
  id: string;
  xpReward: number;
}

// A lesson earns XP only once, even if it is replayed.
export function awardLesson(
  progress: LearningProgress,
  lessonId: string,
  reward: number,
): LearningProgress {
  if (!lessonId || progress.completedLessonIds.includes(lessonId)) return progress;
  const xp = Number.isFinite(reward) ? Math.max(0, Math.floor(reward)) : 0;
  return {
    totalXp: progress.totalXp + xp,
    completedLessonIds: [...progress.completedLessonIds, lessonId],
  };
}

// Earlier versions seeded fictional XP/streaks. Keep known completed lessons,
// but recompute their XP instead of carrying over the old sample values.
export function migrateLegacyProgress(
  value: unknown,
  lessons: readonly LessonReward[],
): LearningProgress {
  const previous = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const ids = Array.isArray(previous.completedLessonIds) ? previous.completedLessonIds : [];
  return ids.reduce<LearningProgress>((progress, id: unknown) => {
    const lesson = typeof id === "string" ? lessons.find((item) => item.id === id) : undefined;
    return lesson ? awardLesson(progress, lesson.id, lesson.xpReward) : progress;
  }, { totalXp: 0, completedLessonIds: [] });
}
