const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const ts = require("typescript");

// Node's built-in test runner plus the project's existing TypeScript compiler.
// Transpile-only is sufficient here; npm run typecheck checks the full project.
require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  module._compile(compiled.outputText, filename);
};

const { LESSONS } = require("../data/lessons.ts");
const { UNITS } = require("../data/units.ts");
const { getCourseUnits } = require("../data/courses.ts");
const { awardLesson, migrateLegacyProgress } = require("../lib/learningProgress.ts");
const {
  clearMistake, getReviewQuestions, lastSevenDays, localDateKey, migrateLearningState,
  recordStudySession, rememberMistake, sessionCount,
} = require("../lib/studyProgress.ts");
const { isCorrectAnswer, normalizeAnswer } = require("../lib/practice.ts");
const agentSession = require("../app/api/agent-session+api.ts");
const streamToken = require("../app/api/stream-token+api.ts");

test("each launch course has ordered, complete and playable lessons in all five units", () => {
  assert.equal(new Set(LESSONS.map((lesson) => lesson.id)).size, LESSONS.length);
  assert.equal(new Set(UNITS.map((unit) => unit.id)).size, UNITS.length);
  assert.deepEqual(getCourseUnits(null), []);
  const activityIds = new Set();
  for (const code of ["sw", "en", "fr"]) {
    const units = getCourseUnits(code);
    assert.deepEqual(units.map((unit) => unit.id), [`${code}-unit-1`, `${code}-unit-2`, `${code}-unit-3`, `${code}-unit-4`, `${code}-unit-5`]);
    assert.deepEqual(units.map((unit) => unit.order), [1, 2, 3, 4, 5]);
    assert.equal(units[2].lessons.length, 2);
    assert.deepEqual(units[3].lessonIds, [`${code}-travel-places`, `${code}-travel-directions`]);
    assert.deepEqual(units[4].lessonIds, [`${code}-planning-days`, `${code}-planning-meet`]);
    assert.deepEqual(units[1].lessonIds, ["numbers", "family", "food", "conversation"].map((topic) => `${code}-everyday-${topic}`));
    for (const unit of units) {
      assert.equal(unit.lessons.length, unit.lessonIds.length, `${unit.id} has a missing lesson`);
      assert.equal(new Set(unit.lessonIds).size, unit.lessonIds.length);
      for (const lesson of unit.lessons) {
        const id = lesson.id;
        assert.equal(lesson.unitId, unit.id);
        assert.ok(lesson.vocabulary.length > 0 && lesson.phrases.length > 0, `${id} has no material`);
        assert.ok(lesson.notes?.length > 0, `${id} has no language context`);
        for (const note of lesson.notes) assert.ok(note.title && note.body && note.example, `${id} has an incomplete note`);
        if (unit.order >= 3) {
          assert.ok(lesson.notes.length >= 2 && lesson.activities.length >= 5, `${id} needs a deeper explanation and practice`);
          assert.ok(lesson.activities.every((activity) => activity.explanation), `${id} needs answer explanations`);
        }
        for (const word of lesson.vocabulary) assert.ok(word.word && word.translation && word.pronunciation, `${id} has incomplete vocabulary`);
        for (const phrase of lesson.phrases) assert.ok(phrase.text && phrase.translation && phrase.pronunciation, `${id} has an incomplete phrase`);
        assert.ok(lesson.activities.length > 0, `${id} has no questions`);
        assert.ok(Number.isInteger(lesson.xpReward) && lesson.xpReward > 0);
        for (const activity of lesson.activities) {
          assert.ok(!activityIds.has(activity.id), `Duplicate activity ${activity.id}`);
          activityIds.add(activity.id);
          assert.ok(["multiple-choice", "translate"].includes(activity.type), `${activity.id} is not supported`);
          assert.ok(activity.question && activity.correctAnswer, `${activity.id} is incomplete`);
          if (activity.type === "multiple-choice") {
            assert.ok(activity.options?.includes(activity.correctAnswer), `${activity.id} has no correct option`);
            assert.equal(new Set(activity.options.map(normalizeAnswer)).size, activity.options.length, `${activity.id} has equivalent options`);
          }
        }
      }
    }
  }
});

test("the planning unit teaches complete weekday sets and useful time words", () => {
  const expectedDays = {
    sw: ["Jumatatu", "Jumanne", "Jumatano", "Alhamisi", "Ijumaa", "Jumamosi", "Jumapili"],
    en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    fr: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"],
  };
  const expectedTimes = {
    sw: ["Leo", "Kesho", "Jana", "Sasa", "Baadaye"],
    en: ["Today", "Tomorrow", "Yesterday", "Now", "Later"],
    fr: ["Aujourd'hui", "Demain", "Hier", "Maintenant", "Plus tard"],
  };
  for (const code of ["sw", "en", "fr"]) {
    const planning = getCourseUnits(code)[4].lessons;
    assert.deepEqual(planning[0].vocabulary.map((item) => item.word), expectedDays[code]);
    assert.deepEqual(planning[1].vocabulary.map((item) => item.word), expectedTimes[code]);
    assert.deepEqual(planning.map((lesson) => lesson.xpReward), [15, 15]);
    assert.deepEqual(planning.map((lesson) => lesson.activities.length), code === "en" ? [7, 7] : [8, 7]);
    assert.ok(planning.every((lesson) => lesson.activities.filter((activity) => activity.type === "translate").length >= 2));
  }
});

test("existing lesson IDs stay in place and the next lesson advances into everyday life", () => {
  const original = {
    sw: ["sw-lesson-1", "sw-lesson-2"],
    en: ["en-lesson-1", "en-lesson-2"],
    fr: ["fr-lesson-1", "fr-lesson-2", "fr-lesson-3", "fr-lesson-4", "fr-lesson-5"],
  };
  for (const [code, completed] of Object.entries(original)) {
    const lessons = getCourseUnits(code).flatMap((unit) => unit.lessons);
    assert.deepEqual(lessons.slice(0, completed.length).map((lesson) => lesson.id), completed);
    assert.equal(lessons.find((lesson) => !completed.includes(lesson.id)).id, `${code}-everyday-numbers`);
    const progress = migrateLegacyProgress({ completedLessonIds: completed }, LESSONS);
    assert.deepEqual(progress.completedLessonIds, completed);
    assert.equal(progress.totalXp, lessons.slice(0, completed.length).reduce((sum, lesson) => sum + lesson.xpReward, 0));
  }
});

test("typed answers tolerate case, punctuation, accents and extra spaces", () => {
  assert.equal(isCorrectAnswer("  merci  ", "Merci"), true);
  assert.equal(isCorrectAnswer("D’ou  venez vous", "D'où venez-vous ?"), true);
  assert.equal(isCorrectAnswer("Laddition sil vous plait", "L'addition, s'il vous plaît."), true);
  assert.equal(isCorrectAnswer("thankyou", "Thank you"), false);
  assert.equal(isCorrectAnswer("", ""), false);
  assert.equal(isCorrectAnswer("bonjour", "Merci"), false);
});

test("XP is earned once per lesson and sample progress is not migrated", () => {
  let progress = { totalXp: 0, completedLessonIds: [] };
  progress = awardLesson(progress, "sw-lesson-1", 10);
  progress = awardLesson(progress, "sw-lesson-1", 10);
  progress = awardLesson(progress, "fr-lesson-5", 15);
  assert.deepEqual(progress, { totalXp: 25, completedLessonIds: ["sw-lesson-1", "fr-lesson-5"] });
  assert.deepEqual(migrateLegacyProgress({ xpToday: 15, streak: 12, completedLessonIds: [] }, LESSONS), {
    totalXp: 0, completedLessonIds: [],
  });
  assert.deepEqual(migrateLegacyProgress({ xpToday: 999, completedLessonIds: ["fr-lesson-5", "fr-lesson-5", "unknown"] }, LESSONS), {
    totalXp: 15, completedLessonIds: ["fr-lesson-5"],
  });
});

test("AI session and token endpoints fail closed without contacting a service", async () => {
  const originalFetch = global.fetch;
  let calls = 0;
  global.fetch = async () => { calls += 1; throw new Error("unexpected network call"); };
  try {
    assert.equal((await agentSession.POST()).status, 503);
    assert.equal((await agentSession.DELETE()).status, 503);
    assert.equal((await streamToken.GET()).status, 503);
    assert.equal(calls, 0);
  } finally {
    global.fetch = originalFetch;
  }
});

test("v1 progress keeps earned XP and lesson history without inventing study dates", () => {
  const versionOne = {
    totalXp: 35,
    completedLessonIds: ["sw-lesson-1", "sw-lesson-2", "fr-lesson-5", "sw-lesson-1", "old-course-lesson"],
  };
  assert.deepEqual(migrateLearningState(versionOne, 1, LESSONS), {
    totalXp: 35,
    completedLessonIds: ["sw-lesson-1", "sw-lesson-2", "fr-lesson-5", "old-course-lesson"],
    dailyGoal: 1,
    activityByDate: {},
    reviewItems: [],
  });
  assert.deepEqual(migrateLearningState({ xpToday: 999, completedLessonIds: ["fr-lesson-5"] }, 0, LESSONS), {
    totalXp: 15, completedLessonIds: ["fr-lesson-5"], dailyGoal: 1, activityByDate: {}, reviewItems: [],
  });
  assert.equal(migrateLearningState({ totalXp: NaN, completedLessonIds: ["fr-lesson-5"] }, 1, LESSONS).totalXp, 15);
});

test("study sessions count on the finish date and calendar history crosses year and DST boundaries", () => {
  const originalTz = process.env.TZ;
  process.env.TZ = "America/New_York";
  try {
    // This UTC instant is still December 31 on the device.
    assert.equal(localDateKey(new Date("2025-01-01T02:00:00Z")), "2024-12-31");
    let history = {};
    history = recordStudySession(history, "lesson", new Date(2024, 11, 31, 23, 59));
    const previous = history;
    history = recordStudySession(history, "review", new Date(2025, 0, 1, 0, 1));
    history = recordStudySession(history, "lesson", new Date(2025, 0, 1, 8));
    assert.deepEqual(previous, { "2024-12-31": { lessons: 1, reviews: 0 } });
    assert.deepEqual(history["2025-01-01"], { lessons: 1, reviews: 1 });
    assert.equal(sessionCount(history["2025-01-01"]), 2);
    assert.equal(sessionCount(history["2024-12-30"]), 0);
    assert.deepEqual(lastSevenDays(history, new Date(2025, 0, 1, 9)).map((day) => day.key), [
      "2024-12-26", "2024-12-27", "2024-12-28", "2024-12-29", "2024-12-30", "2024-12-31", "2025-01-01",
    ]);
    assert.deepEqual(lastSevenDays({}, new Date(2024, 2, 12, 2)).map((day) => day.key), [
      "2024-03-06", "2024-03-07", "2024-03-08", "2024-03-09", "2024-03-10", "2024-03-11", "2024-03-12",
    ]);
  } finally {
    if (originalTz === undefined) delete process.env.TZ;
    else process.env.TZ = originalTz;
  }
});

test("missed-question review is unique, course-specific, and cleared only by explicit review", () => {
  const sw = getCourseUnits("sw").flatMap((unit) => unit.lessons);
  const fr = getCourseUnits("fr").flatMap((unit) => unit.lessons);
  let saved = rememberMistake([], "sw-lesson-1", "sw-lesson-1-act-1");
  saved = rememberMistake(saved, "sw-lesson-1", "sw-lesson-1-act-1");
  saved = rememberMistake(saved, "fr-lesson-1", "fr-lesson-1-act-1");
  saved = rememberMistake(saved, "missing-lesson", "missing-question");
  assert.equal(saved.length, 3);
  assert.deepEqual(getReviewQuestions(saved, sw).map((item) => item.activity.id), ["sw-lesson-1-act-1"]);
  assert.deepEqual(getReviewQuestions(saved, fr).map((item) => item.activity.id), ["fr-lesson-1-act-1"]);
  // Retrying a lesson never calls clearMistake; a correct separate review does.
  const before = saved;
  saved = clearMistake(saved, "sw-lesson-1", "sw-lesson-1-act-1");
  assert.equal(before.length, 3);
  assert.equal(getReviewQuestions(saved, sw).length, 0);
  assert.equal(getReviewQuestions(saved, fr).length, 1);
});
