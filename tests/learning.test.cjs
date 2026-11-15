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
const { isCorrectAnswer, normalizeAnswer } = require("../lib/practice.ts");
const agentSession = require("../app/api/agent-session+api.ts");
const streamToken = require("../app/api/stream-token+api.ts");

test("each launch course has ordered, complete and playable lessons in both units", () => {
  assert.equal(new Set(LESSONS.map((lesson) => lesson.id)).size, LESSONS.length);
  assert.equal(new Set(UNITS.map((unit) => unit.id)).size, UNITS.length);
  assert.deepEqual(getCourseUnits(null), []);
  const activityIds = new Set();
  for (const code of ["sw", "en", "fr"]) {
    const units = getCourseUnits(code);
    assert.deepEqual(units.map((unit) => unit.id), [`${code}-unit-1`, `${code}-unit-2`]);
    assert.deepEqual(units.map((unit) => unit.order), [1, 2]);
    assert.deepEqual(units[1].lessonIds, ["numbers", "family", "food", "conversation"].map((topic) => `${code}-everyday-${topic}`));
    for (const unit of units) {
      assert.equal(unit.lessons.length, unit.lessonIds.length, `${unit.id} has a missing lesson`);
      assert.equal(new Set(unit.lessonIds).size, unit.lessonIds.length);
      for (const lesson of unit.lessons) {
        const id = lesson.id;
        assert.equal(lesson.unitId, unit.id);
        assert.ok(lesson.vocabulary.length > 0 && lesson.phrases.length > 0, `${id} has no material`);
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
