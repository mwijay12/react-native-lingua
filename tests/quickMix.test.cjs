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
const { normalizeAnswer } = require("../lib/practice.ts");
const {
  getMixPool, makeQuickMix, getRewardBadges, isValidMixResult, recordMixRound, sanitizePlayProgress,
} = require("../lib/quickMix.ts");
const courses = ["sw", "en", "fr"].map((code) => getCourseUnits(code).flatMap((unit) => unit.lessons));

test("Quick Mix uses the current course, completed lessons or a first-lesson preview", () => {
  for (const lessons of courses) {
    const first = lessons[0];
    const preview = getMixPool(lessons, []);
    assert.equal(preview.preview, true);
    assert.ok(preview.questions.length >= 2);
    assert.ok(preview.questions.every((question) => question.lessonId === first.id));

    const completed = getMixPool(lessons, [lessons[1].id, "unknown-course-lesson"]);
    assert.equal(completed.preview, false);
    assert.ok(completed.questions.length >= 1);
    assert.ok(completed.questions.every((question) => question.lessonId === lessons[1].id));

    const mixed = getMixPool(lessons, [lessons[0].id, lessons[1].id]);
    const before = JSON.stringify(mixed);
    const round = makeQuickMix(mixed.questions, () => 0);
    assert.equal(round.length, 3);
    assert.equal(new Set(round.map((question) => question.activity.id)).size, round.length);
    for (const question of round) {
      const options = question.activity.options.map(normalizeAnswer);
      assert.equal(new Set(options).size, options.length);
      assert.ok(options.includes(normalizeAnswer(question.activity.correctAnswer)));
      assert.ok([lessons[0].id, lessons[1].id].includes(question.lessonId));
    }
    assert.equal(JSON.stringify(mixed), before, "shuffling must not mutate lesson content");
  }
  assert.deepEqual(getMixPool([], []), { questions: [], preview: true });
  const invalid = { ...courses[0][0], activities: [{ id: "bad", type: "multiple-choice", question: "Q?", correctAnswer: "Yes", options: ["yes", "YES"] }] };
  assert.deepEqual(getMixPool([invalid], []), { questions: [], preview: true });
});

test("adding travel and planning lessons preserves XP and stickers while extending the course and mix", () => {
  const codes = ["sw", "en", "fr"];
  const oldCourses = codes.map((code) => getCourseUnits(code).slice(0, 3).flatMap((unit) => unit.lessons));
  const travelCourses = codes.map((code) => getCourseUnits(code).slice(0, 4).flatMap((unit) => unit.lessons));
  assert.deepEqual(oldCourses.map((course) => course.length), [8, 8, 11]);
  assert.deepEqual(travelCourses.map((course) => course.length), [10, 10, 13]);
  assert.deepEqual(courses.map((course) => course.length), [12, 12, 15]);
  assert.equal(oldCourses.flat().reduce((sum, lesson) => sum + lesson.xpReward, 0), 305);
  assert.equal(travelCourses.flat().reduce((sum, lesson) => sum + lesson.xpReward, 0), 395);
  const play = { roundsCompleted: 1, perfectRounds: 1 };
  const history = { "2026-01-01": { lessons: 1, reviews: 1 } };
  for (const previous of [oldCourses, travelCourses]) {
    const completed = previous.flat().map((lesson) => lesson.id);
    assert.deepEqual(getRewardBadges(courses, completed, history, play), getRewardBadges(previous, completed, history, play));
    for (const [index, course] of previous.entries()) {
      assert.deepEqual(courses[index].slice(0, course.length).map((lesson) => lesson.id), course.map((lesson) => lesson.id));
    }
  }
  assert.deepEqual(courses.map((course, index) => Math.round(oldCourses[index].length / course.length * 100)), [67, 67, 73]);
  assert.deepEqual(courses.map((course, index) => Math.round(travelCourses[index].length / course.length * 100)), [83, 83, 87]);
  for (const [index, code] of codes.entries()) {
    for (const suffix of ["travel-places", "planning-days", "planning-meet"]) {
      const newLesson = `${code}-${suffix}`;
      const pool = getMixPool(courses[index], [newLesson]);
      assert.equal(pool.preview, false);
      assert.ok(pool.questions.length >= 3);
      assert.ok(pool.questions.every((question) => question.lessonId === newLesson));
    }
  }
});

test("round counts and sticker milestones reflect real progress only", () => {
  const initial = { roundsCompleted: 0, perfectRounds: 0 };
  assert.equal(recordMixRound(initial, 4, 3), initial);
  assert.equal(recordMixRound(initial, 0, 0), initial);
  assert.equal(isValidMixResult(1.5, 3), false);
  assert.deepEqual(recordMixRound(initial, 0, 2), { roundsCompleted: 1, perfectRounds: 0 });
  assert.deepEqual(recordMixRound({ roundsCompleted: 1, perfectRounds: 0 }, 3, 3), { roundsCompleted: 2, perfectRounds: 1 });
  assert.deepEqual(sanitizePlayProgress({ roundsCompleted: 2, perfectRounds: 99 }), { roundsCompleted: 2, perfectRounds: 2 });
  assert.deepEqual(sanitizePlayProgress({ roundsCompleted: -1, perfectRounds: NaN }), initial);

  const byId = (badges) => Object.fromEntries(badges.map((badge) => [badge.id, badge]));
  let badges = byId(getRewardBadges(courses, [courses[0][0].id, courses[0][0].id, "unknown"], {}, initial));
  assert.equal(badges["first-step"].unlocked, true);
  assert.equal(badges["trail-finder"].value, 1);
  assert.equal(badges["language-explorer"].value, 1);
  assert.equal(badges["practice-pal"].unlocked, false);
  assert.equal(badges["mix-maker"].unlocked, false);
  badges = byId(getRewardBadges(courses, courses.map((course) => course[0].id), { "2026-01-01": { lessons: 0, reviews: 1 } }, { roundsCompleted: 1, perfectRounds: 1 }));
  assert.ok(Object.values(badges).every((badge) => badge.unlocked));
});

test("play storage failures are retryable and never overwrite existing rewards", async () => {
  const saved = JSON.stringify({ state: { roundsCompleted: 2, perfectRounds: 1 }, version: 1 });
  let stored = saved;
  let failRead = true;
  let failWrite = false;
  let blockNextWrite = false;
  let releaseWrite;
  let activeWrites = 0;
  let maxConcurrentWrites = 0;
  let writes = 0;
  const storage = {
    async getItem() { if (failRead) throw new Error("Storage unavailable"); return stored; },
    async multiGet(keys) { return Promise.all(keys.map(async (key) => [key, await this.getItem(key)])); },
    async setItem(_key, value) {
      activeWrites += 1;
      maxConcurrentWrites = Math.max(maxConcurrentWrites, activeWrites);
      try {
        if (blockNextWrite) {
          blockNextWrite = false;
          await new Promise((resolve) => { releaseWrite = resolve; });
        }
        if (failWrite) throw new Error("Storage full");
        writes += 1;
        stored = value;
      } finally {
        activeWrites -= 1;
      }
    },
    async removeItem() { stored = null; },
  };
  const originalLoad = Module._load;
  Module._load = function (request, parent, isMain) {
    if (request === "@react-native-async-storage/async-storage") return { default: storage };
    if (request.startsWith("@/")) request = path.join(__dirname, "..", request.slice(2));
    return originalLoad.call(this, request, parent, isMain);
  };
  const { retryPlaySave, usePlayStore, usePlayHydrationStatus, usePlaySaveStatus } = require("../store/playStore.ts");
  Module._load = originalLoad;
  const flush = () => new Promise((resolve) => setImmediate(resolve));
  await flush();
  assert.equal(usePlayHydrationStatus.getState().status, "error");
  usePlayStore.getState().completeMix(2, 2);
  assert.equal(writes, 0);
  assert.equal(stored, saved);

  failRead = false;
  await usePlayStore.persist.rehydrate();
  assert.equal(usePlayHydrationStatus.getState().status, "ready");
  assert.equal(usePlayStore.getState().roundsCompleted, 2);
  assert.equal(usePlayStore.getState().perfectRounds, 1);
  usePlayStore.getState().completeMix(4, 3);
  assert.equal(writes, 0);
  usePlayStore.getState().completeMix(2, 2);
  assert.equal(usePlayStore.getState().roundsCompleted, 3);
  assert.equal(usePlayStore.getState().perfectRounds, 2);
  await flush();
  assert.equal(usePlaySaveStatus.getState().status, "saved");
  assert.equal(writes, 1);
  assert.deepEqual(JSON.parse(stored).state, { roundsCompleted: 3, perfectRounds: 2 });

  failWrite = true;
  usePlayStore.getState().completeMix(0, 2);
  await flush();
  assert.equal(usePlaySaveStatus.getState().status, "error");
  assert.deepEqual(JSON.parse(stored).state, { roundsCompleted: 3, perfectRounds: 2 });
  assert.equal(usePlayStore.getState().roundsCompleted, 4);
  failWrite = false;
  retryPlaySave();
  await flush();
  assert.equal(usePlaySaveStatus.getState().status, "saved");
  assert.deepEqual(JSON.parse(stored).state, { roundsCompleted: 4, perfectRounds: 2 });

  blockNextWrite = true;
  usePlayStore.getState().completeMix(1, 2);
  usePlayStore.getState().completeMix(2, 2);
  await flush();
  assert.equal(usePlaySaveStatus.getState().status, "saving");
  assert.equal(activeWrites, 1);
  releaseWrite();
  await flush();
  assert.equal(maxConcurrentWrites, 1);
  assert.equal(usePlaySaveStatus.getState().status, "saved");
  assert.deepEqual(JSON.parse(stored).state, { roundsCompleted: 6, perfectRounds: 3 });

  const newer = JSON.stringify({ state: { roundsCompleted: 30, perfectRounds: 20 }, version: 2 });
  stored = newer;
  const writesBeforeNewerVersion = writes;
  await usePlayStore.persist.rehydrate();
  assert.equal(usePlayHydrationStatus.getState().status, "error");
  usePlayStore.getState().completeMix(2, 2);
  retryPlaySave();
  await flush();
  assert.equal(writes, writesBeforeNewerVersion);
  assert.equal(stored, newer, "a newer saved format must not be overwritten");
});
