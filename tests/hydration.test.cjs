const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

// Load the real persisted store with a controllable AsyncStorage implementation.
require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  module._compile(compiled.outputText, filename);
};

const saved = JSON.stringify({
  state: { totalXp: 10, completedLessonIds: ["sw-lesson-1"], dailyGoal: 2, activityByDate: {}, reviewItems: [] },
  version: 2,
});
let stored = saved;
let failRead = true;
let writes = 0;
const storage = {
  async getItem() {
    if (failRead) throw new Error("Storage unavailable");
    return stored;
  },
  async multiGet(keys) { return Promise.all(keys.map(async (key) => [key, await this.getItem(key)])); },
  async setItem(_key, value) { writes += 1; stored = value; },
  async removeItem() { stored = null; },
};
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "@react-native-async-storage/async-storage") return { default: storage };
  if (request.startsWith("@/")) request = path.join(__dirname, "..", request.slice(2));
  return originalLoad.call(this, request, parent, isMain);
};
const { useLearningStore, useLearningHydrationStatus } = require("../store/learningStore.ts");
const { useLanguageStore, useLanguageHydrationStatus } = require("../store/languageStore.ts");
Module._load = originalLoad;

test("failed progress reads are retryable and do not overwrite the saved value", async () => {
  // Initial async hydration rejects after the store is created.
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(useLearningHydrationStatus.getState().status, "error");
  assert.equal(useLearningStore.persist.hasHydrated(), false);
  assert.equal(useLanguageHydrationStatus.getState().status, "error");
  assert.equal(useLanguageStore.persist.hasHydrated(), false);
  assert.equal(stored, saved);
  assert.equal(writes, 0);

  failRead = false;
  await useLearningStore.persist.rehydrate();
  assert.equal(useLearningHydrationStatus.getState().status, "ready");
  assert.equal(useLearningStore.persist.hasHydrated(), true);
  assert.equal(useLearningStore.getState().totalXp, 10);
  assert.deepEqual(useLearningStore.getState().completedLessonIds, ["sw-lesson-1"]);
  assert.equal(useLearningStore.getState().dailyGoal, 2);
  assert.equal(writes, 0);

  // Invalid JSON is also a read failure. Retrying does not erase it.
  stored = "not valid JSON";
  await useLearningStore.persist.rehydrate();
  assert.equal(useLearningHydrationStatus.getState().status, "error");
  assert.equal(stored, "not valid JSON");
  assert.equal(writes, 0);
  stored = saved;
  await useLearningStore.persist.rehydrate();
  assert.equal(useLearningHydrationStatus.getState().status, "ready");
  assert.equal(useLearningStore.getState().totalXp, 10);
  assert.equal(writes, 0);

  const course = JSON.stringify({ state: { selectedLanguage: "fr" }, version: 0 });
  stored = course;
  await useLanguageStore.persist.rehydrate();
  assert.equal(useLanguageHydrationStatus.getState().status, "ready");
  assert.equal(useLanguageStore.getState().selectedLanguage, "fr");
  assert.equal(stored, course);
  assert.equal(writes, 0);
});
