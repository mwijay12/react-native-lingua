const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  module._compile(compiled.outputText, filename);
};

const { getCourseUnits } = require("../data/courses.ts");
const { getReviewQuestions } = require("../lib/studyProgress.ts");
const { getMixPool, getRewardBadges } = require("../lib/quickMix.ts");

// Fixture from the four-unit illustrated/audio demo. These IDs and rewards are
// persisted on devices; adding a unit must not silently replace or reorder them.
const previousCourses = {
  sw: [
    ["sw-lesson-1", 10], ["sw-lesson-2", 10], ["sw-everyday-numbers", 10],
    ["sw-everyday-family", 10], ["sw-everyday-food", 10], ["sw-everyday-conversation", 10],
    ["sw-foundation-present", 15], ["sw-foundation-questions", 15],
    ["sw-travel-places", 15], ["sw-travel-directions", 15],
  ],
  en: [
    ["en-lesson-1", 10], ["en-lesson-2", 10], ["en-everyday-numbers", 10],
    ["en-everyday-family", 10], ["en-everyday-food", 10], ["en-everyday-conversation", 10],
    ["en-foundation-be", 15], ["en-foundation-present", 15],
    ["en-travel-places", 15], ["en-travel-directions", 15],
  ],
  fr: [
    ["fr-lesson-1", 10], ["fr-lesson-2", 10], ["fr-lesson-3", 10], ["fr-lesson-4", 10],
    ["fr-lesson-5", 15], ["fr-everyday-numbers", 10], ["fr-everyday-family", 10],
    ["fr-everyday-food", 10], ["fr-everyday-conversation", 10],
    ["fr-foundation-etre", 15], ["fr-foundation-articles", 15],
    ["fr-travel-places", 15], ["fr-travel-directions", 15],
  ],
};

test("a saved four-unit learner keeps progress and can practise the new lessons", async () => {
  const courses = Object.entries(previousCourses).map(([code, old]) => {
    const lessons = getCourseUnits(code).flatMap((unit) => unit.lessons);
    assert.deepEqual(lessons.slice(0, old.length).map(({ id, xpReward }) => [id, xpReward]), old);
    assert.deepEqual(lessons.slice(old.length).map(({ id }) => id), [`${code}-planning-days`, `${code}-planning-meet`]);
    return lessons;
  });
  const completedLessonIds = Object.values(previousCourses).flat().map(([id]) => id);
  const reviewItems = [
    { lessonId: "sw-lesson-1", activityId: "sw-lesson-1-act-1" },
    { lessonId: "sw-travel-places", activityId: "sw-travel-places-1" },
    { lessonId: "fr-travel-directions", activityId: "fr-travel-directions-1" },
  ];
  const activityByDate = { "2020-01-01": { lessons: 4, reviews: 1 } };
  const oldLearning = { totalXp: 395, completedLessonIds, dailyGoal: 2, activityByDate, reviewItems };
  const oldPlay = { roundsCompleted: 4, perfectRounds: 2 };
  const stored = {
    "learning-storage": JSON.stringify({ state: oldLearning, version: 2 }),
    "language-storage": JSON.stringify({ state: { selectedLanguage: "fr" }, version: 0 }),
    "play-storage": JSON.stringify({ state: oldPlay, version: 1 }),
    "audio-settings": JSON.stringify({ state: { effectsEnabled: false }, version: 1 }),
  };
  const before = { ...stored };
  const writes = [];
  const storage = {
    async getItem(key) { return stored[key] ?? null; },
    async multiGet(keys) { return Promise.all(keys.map(async (key) => [key, await this.getItem(key)])); },
    async setItem(key, value) { writes.push(key); stored[key] = value; },
    async removeItem(key) { delete stored[key]; },
  };
  const originalLoad = Module._load;
  let learning, language, play, audio;
  try {
    Module._load = function (request, parent, isMain) {
      if (request === "@react-native-async-storage/async-storage") return { default: storage };
      if (request.startsWith("@/")) request = path.join(__dirname, "..", request.slice(2));
      return originalLoad.call(this, request, parent, isMain);
    };
    learning = require("../store/learningStore.ts");
    language = require("../store/languageStore.ts");
    play = require("../store/playStore.ts");
    audio = require("../store/audioSettingsStore.ts");
  } finally {
    Module._load = originalLoad;
  }
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(learning.useLearningHydrationStatus.getState().status, "ready");
  assert.equal(language.useLanguageHydrationStatus.getState().status, "ready");
  assert.equal(play.usePlayHydrationStatus.getState().status, "ready");
  assert.equal(audio.useAudioSettingsHydration.getState().status, "ready");
  const state = learning.useLearningStore.getState();
  for (const key of Object.keys(oldLearning)) assert.deepEqual(state[key], oldLearning[key]);
  assert.equal(language.useLanguageStore.getState().selectedLanguage, "fr");
  assert.equal(play.usePlayStore.getState().roundsCompleted, 4);
  assert.equal(play.usePlayStore.getState().perfectRounds, 2);
  assert.equal(audio.useAudioSettingsStore.getState().effectsEnabled, false);
  assert.deepEqual(writes, [], "hydration must not rewrite existing data");
  assert.deepEqual(getRewardBadges(courses, completedLessonIds, activityByDate, oldPlay).filter((badge) => badge.unlocked).length, 6);
  assert.deepEqual(getReviewQuestions(reviewItems, courses[0]).map(({ activity }) => activity.id), ["sw-lesson-1-act-1", "sw-travel-places-1"]);
  assert.deepEqual(getReviewQuestions(reviewItems, courses[2]).map(({ activity }) => activity.id), ["fr-travel-directions-1"]);

  state.completeLesson("sw-planning-days");
  state.addMistake("sw-planning-days", "sw-planning-days-1");
  state.completeLesson("sw-planning-days"); // Replay counts as a session, but not more XP.
  await new Promise((resolve) => setImmediate(resolve));
  const updated = learning.useLearningStore.getState();
  assert.equal(updated.totalXp, 410);
  assert.deepEqual(updated.completedLessonIds, [...completedLessonIds, "sw-planning-days"]);
  assert.equal(updated.dailyGoal, 2);
  assert.deepEqual(updated.activityByDate["2020-01-01"], activityByDate["2020-01-01"]);
  assert.deepEqual(updated.reviewItems, [...reviewItems, { lessonId: "sw-planning-days", activityId: "sw-planning-days-1" }]);
  assert.equal(getReviewQuestions(updated.reviewItems, courses[0]).length, 3);
  assert.ok(getMixPool(courses[0], ["sw-planning-days"]).questions.some(({ lessonId }) => lessonId === "sw-planning-days"));
  assert.equal(JSON.parse(stored["learning-storage"]).state.totalXp, 410);
  assert.ok(writes.every((key) => key === "learning-storage"));
  for (const key of ["language-storage", "play-storage", "audio-settings"]) assert.equal(stored[key], before[key]);
});
