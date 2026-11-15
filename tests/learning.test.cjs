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
const { awardLesson, migrateLegacyProgress } = require("../lib/learningProgress.ts");
const { isCorrectAnswer } = require("../lib/practice.ts");
const agentSession = require("../app/api/agent-session+api.ts");
const streamToken = require("../app/api/stream-token+api.ts");

test("each launch course has complete, playable beginner lessons", () => {
  assert.equal(new Set(LESSONS.map((lesson) => lesson.id)).size, LESSONS.length);
  for (const code of ["sw", "en", "fr"]) {
    const unit = UNITS.find((item) => item.languageCode === code);
    assert.ok(unit, `Missing ${code} unit`);
    assert.ok(unit.lessonIds.length >= 2, `${code} needs at least two lessons`);
    for (const id of unit.lessonIds) {
      const lesson = LESSONS.find((item) => item.id === id);
      assert.ok(lesson, `Missing ${id}`);
      assert.equal(lesson.unitId, unit.id);
      assert.ok(lesson.vocabulary.length > 0 && lesson.phrases.length > 0, `${id} has no material`);
      assert.ok(lesson.activities.length > 0, `${id} has no questions`);
      assert.ok(Number.isInteger(lesson.xpReward) && lesson.xpReward > 0);
      for (const activity of lesson.activities) {
        assert.ok(["multiple-choice", "translate"].includes(activity.type), `${activity.id} is not supported`);
        assert.ok(activity.question && activity.correctAnswer, `${activity.id} is incomplete`);
        if (activity.type === "multiple-choice") {
          assert.ok(activity.options?.includes(activity.correctAnswer), `${activity.id} has no correct option`);
          assert.equal(new Set(activity.options).size, activity.options.length);
        }
      }
    }
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
