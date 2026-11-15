import type { LanguageCode, Lesson } from "@/types/learning";

import { LESSONS } from "./lessons";
import { UNITS } from "./units";

// Keep the same ordering and lesson lookup wherever a course is displayed.
export function getCourseUnits(languageCode: LanguageCode | null) {
  return UNITS
    .filter((unit) => unit.languageCode === languageCode)
    .sort((a, b) => a.order - b.order)
    .map((unit) => ({
      ...unit,
      lessons: unit.lessonIds
        .map((id) => LESSONS.find((lesson) => lesson.id === id))
        .filter((lesson): lesson is Lesson => lesson !== undefined),
    }));
}
