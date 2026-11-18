const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

// Exercise the real Zustand stores with a controllable AsyncStorage, including
// delayed writes and fresh store instances that reopen the same saved bytes.
require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  module._compile(compiled.outputText, filename);
};

const PROGRESS = "learning-storage";
const COURSE = "language-storage";
const envelope = (state, version) => JSON.stringify({ state, version });
const progress = {
  totalXp: 10,
  completedLessonIds: ["sw-lesson-1"],
  dailyGoal: 2,
  activityByDate: { "2020-01-01": { lessons: 4, reviews: 1 } },
  reviewItems: [{ lessonId: "sw-lesson-1", activityId: "sw-lesson-1-act-1" }],
};
const initial = () => ({
  [PROGRESS]: envelope(progress, 2),
  [COURSE]: envelope({ selectedLanguage: "es" }, 0),
});

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

class MemoryStorage {
  constructor(values = {}) {
    this.values = { ...values };
    this.failedReads = new Set();
    this.failedWrites = new Set();
    this.writeHolds = new Map();
    this.started = [];
    this.completed = [];
  }
  holdNextWrite(key) {
    const hold = deferred();
    this.writeHolds.set(key, hold);
    return hold;
  }
  async getItem(key) {
    if (this.failedReads.has(key)) throw new Error("simulated read failure");
    return Object.hasOwn(this.values, key) ? this.values[key] : null;
  }
  async multiGet(keys) {
    return Promise.all(keys.map(async (key) => [key, await this.getItem(key)]));
  }
  async setItem(key, value) {
    this.started.push({ key, value });
    const hold = this.writeHolds.get(key);
    if (hold) {
      this.writeHolds.delete(key);
      await hold.promise;
    }
    if (this.failedWrites.has(key)) throw new Error("simulated write failure");
    this.values[key] = value;
    this.completed.push({ key, value });
  }
  async removeItem(key) { delete this.values[key]; }
}

function loadStores(storage) {
  const learningPath = require.resolve("../store/learningStore.ts");
  const languagePath = require.resolve("../store/languageStore.ts");
  delete require.cache[learningPath];
  delete require.cache[languagePath];
  const originalLoad = Module._load;
  try {
    Module._load = function (request, parent, isMain) {
      if (request === "@react-native-async-storage/async-storage") return { default: storage };
      if (request.startsWith("@/")) request = path.join(__dirname, "..", request.slice(2));
      return originalLoad.call(this, request, parent, isMain);
    };
    return { learning: require(learningPath), language: require(languagePath) };
  } finally {
    Module._load = originalLoad;
  }
}

async function waitFor(predicate, message = "condition") {
  for (let index = 0; index < 50; index += 1) {
    await new Promise((resolve) => setImmediate(resolve));
    if (predicate()) return;
  }
  assert.fail(`Timed out waiting for ${message}`);
}
const hydrated = ({ learning, language }) =>
  learning.useLearningHydrationStatus.getState().status !== "loading"
  && language.useLanguageHydrationStatus.getState().status !== "loading";
const snapshot = (store) => {
  const { totalXp, completedLessonIds, dailyGoal, activityByDate, reviewItems } = store.getState();
  return { totalXp, completedLessonIds, dailyGoal, activityByDate, reviewItems };
};
const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

test("failed reads block all progress and course actions until a safe retry", async () => {
  const storage = new MemoryStorage(initial());
  const before = { ...storage.values };
  storage.failedReads.add(PROGRESS);
  storage.failedReads.add(COURSE);
  const stores = loadStores(storage);
  await waitFor(() => hydrated(stores));
  const { learning, language } = stores;
  assert.deepEqual(learning.useLearningHydrationStatus.getState(), { status: "error", reason: "read" });
  assert.deepEqual(language.useLanguageHydrationStatus.getState(), { status: "error", reason: "read" });
  const state = learning.useLearningStore.getState();
  state.completeLesson("sw-lesson-2");
  state.addMistake("sw-lesson-1", "sw-lesson-1-act-1");
  state.setDailyGoal(3);
  state.clearReviewQuestion("sw-lesson-1", "sw-lesson-1-act-1");
  state.completeReview();
  language.useLanguageStore.getState().setSelectedLanguage("fr");
  language.useLanguageStore.getState().clearSelectedLanguage();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(learning.useLearningStore.getState().totalXp, 0);
  assert.equal(language.useLanguageStore.getState().selectedLanguage, null);
  assert.deepEqual(storage.values, before);
  assert.deepEqual(storage.started, []);

  storage.failedReads.clear();
  await Promise.all([learning.useLearningStore.persist.rehydrate(), language.useLanguageStore.persist.rehydrate()]);
  assert.equal(learning.useLearningHydrationStatus.getState().status, "ready");
  assert.equal(language.useLanguageHydrationStatus.getState().status, "ready");
  assert.deepEqual(snapshot(learning.useLearningStore), progress);
  assert.equal(language.useLanguageStore.getState().selectedLanguage, "es");
  assert.equal(learning.useLearningSaveStatus.getState().status, "saved");
  assert.equal(language.useLanguageSaveStatus.getState().status, "saved");
  assert.deepEqual(storage.values, before);
  assert.deepEqual(storage.started, []);
});

test("corrupt, ambiguous and newer records are preserved rather than defaulted", async () => {
  const examples = [
    [PROGRESS, "not JSON", "corrupt"],
    [PROGRESS, "null", "corrupt"],
    [PROGRESS, JSON.stringify({ state: progress }), "corrupt"],
    [PROGRESS, envelope({ totalXp: 10 }, 2), "corrupt"],
    [PROGRESS, envelope({ ...progress, reviewItems: [{ lessonId: "sw-lesson-1" }] }, 2), "corrupt"],
    [PROGRESS, envelope({ ...progress, activityByDate: { "2020-01-01": { lessons: -1, reviews: 0 } } }, 2), "corrupt"],
    [PROGRESS, envelope({ ...progress, aFutureField: "keep" }, 2), "corrupt"],
    [PROGRESS, envelope({ ...progress, aFutureField: "keep" }, 3), "newer"],
    [COURSE, envelope({ selectedLanguage: "unrecognized" }, 0), "corrupt"],
    [COURSE, envelope({}, 0), "corrupt"],
    [COURSE, envelope({ selectedLanguage: "fr", aFutureField: "keep" }, 0), "corrupt"],
    [COURSE, envelope({ selectedLanguage: "fr", aFutureField: "keep" }, 1), "newer"],
  ];
  for (const [key, raw, reason] of examples) {
    const storage = new MemoryStorage({ ...initial(), [key]: raw });
    const stores = loadStores(storage);
    await waitFor(() => hydrated(stores));
    const current = key === PROGRESS ? stores.learning : stores.language;
    const hydration = key === PROGRESS ? current.useLearningHydrationStatus : current.useLanguageHydrationStatus;
    assert.equal(hydration.getState().status, "error", raw);
    assert.equal(hydration.getState().reason, reason, raw);
    if (key === PROGRESS) {
      current.useLearningStore.getState().completeLesson("sw-lesson-2");
      current.useLearningStore.setState({ totalXp: 999 }); // Even direct setState cannot write through the gate.
      await current.useLearningStore.persist.rehydrate();
    } else {
      current.useLanguageStore.getState().setSelectedLanguage("en");
      current.useLanguageStore.setState({ selectedLanguage: "en" });
      await current.useLanguageStore.persist.rehydrate();
    }
    assert.equal(storage.values[key], raw);
    assert.equal(storage.started.length, 0);
    assert.equal(hydration.getState().status, "error");
  }
});

test("real v0 and v1 shapes migrate without inventing history or dropping old IDs", async () => {
  const cases = [
    {
      source: { xpToday: 15, dailyGoal: 20, streak: 12, completedLessonIds: ["es-lesson-1", "sw-lesson-1", "old-course-lesson"] },
      version: 0,
      expected: { totalXp: 20, completedLessonIds: ["es-lesson-1", "sw-lesson-1", "old-course-lesson"], dailyGoal: 1, activityByDate: {}, reviewItems: [] },
    },
    {
      source: { totalXp: 35, completedLessonIds: ["sw-lesson-1", "fr-lesson-5", "old-course-lesson"] },
      version: 1,
      expected: { totalXp: 35, completedLessonIds: ["sw-lesson-1", "fr-lesson-5", "old-course-lesson"], dailyGoal: 1, activityByDate: {}, reviewItems: [] },
    },
  ];
  for (const item of cases) {
    const storage = new MemoryStorage({ [PROGRESS]: envelope(item.source, item.version), [COURSE]: envelope({ selectedLanguage: "ja" }, 0) });
    const stores = loadStores(storage);
    await waitFor(() => hydrated(stores));
    assert.equal(stores.learning.useLearningHydrationStatus.getState().status, "ready");
    assert.equal(stores.learning.useLearningSaveStatus.getState().status, "saved");
    assert.deepEqual(snapshot(stores.learning.useLearningStore), item.expected);
    assert.deepEqual(JSON.parse(storage.values[PROGRESS]), { state: item.expected, version: 2 });
    assert.equal(stores.language.useLanguageStore.getState().selectedLanguage, "ja");
    assert.deepEqual(storage.started.map(({ key }) => key), [PROGRESS]);
  }
  const { migrateLearningState } = require("../lib/studyProgress.ts");
  assert.throws(() => migrateLearningState(progress, 2, []), /Unsupported learning migration/);
  assert.throws(() => migrateLearningState(progress, 3, []), /Unsupported learning migration/);
});

test("a failed migration write blocks actions and retry reads the original again", async () => {
  const old = envelope({ totalXp: 35, completedLessonIds: ["sw-lesson-1", "fr-lesson-5"] }, 1);
  const storage = new MemoryStorage({ [PROGRESS]: old, [COURSE]: envelope({ selectedLanguage: "ko" }, 0) });
  storage.failedWrites.add(PROGRESS);
  const hold = storage.holdNextWrite(PROGRESS);
  const stores = loadStores(storage);
  await waitFor(() => storage.started.some(({ key }) => key === PROGRESS), "migration write");
  const { learning } = stores;
  assert.equal(learning.useLearningHydrationStatus.getState().status, "loading");
  assert.equal(learning.useLearningStore.getState().totalXp, 35); // Zustand has already merged the migration.
  learning.useLearningStore.getState().completeLesson("sw-lesson-2");
  learning.useLearningStore.getState().completeReview();
  assert.equal(learning.useLearningStore.getState().totalXp, 35);
  assert.deepEqual(learning.useLearningStore.getState().activityByDate, {});
  hold.resolve();
  await waitFor(() => learning.useLearningHydrationStatus.getState().status === "error", "migration failure");
  assert.equal(learning.useLearningHydrationStatus.getState().reason, "migration");
  assert.equal(learning.useLearningStore.persist.hasHydrated(), false);
  assert.equal(storage.values[PROGRESS], old);
  assert.equal(storage.started.length, 1);
  learning.useLearningStore.getState().setDailyGoal(3);
  assert.equal(learning.useLearningStore.getState().dailyGoal, 1);

  storage.failedWrites.clear();
  await learning.useLearningStore.persist.rehydrate();
  assert.equal(learning.useLearningHydrationStatus.getState().status, "ready");
  assert.equal(learning.useLearningStore.persist.hasHydrated(), true);
  assert.equal(learning.useLearningSaveStatus.getState().status, "saved");
  assert.equal(learning.useLearningStore.getState().totalXp, 35);
  assert.deepEqual(learning.useLearningStore.getState().activityByDate, {});
  assert.equal(JSON.parse(storage.values[PROGRESS]).version, 2);
});

test("delayed rapid writes remain ordered and reopen with the latest complete snapshots", async () => {
  const storage = new MemoryStorage(initial());
  const before = { ...storage.values };
  const stores = loadStores(storage);
  await waitFor(() => hydrated(stores));
  const { learning, language } = stores;
  const progressHold = storage.holdNextWrite(PROGRESS);
  const courseHold = storage.holdNextWrite(COURSE);
  const state = learning.useLearningStore.getState();
  state.completeLesson("sw-lesson-2");
  state.addMistake("sw-lesson-2", "sw-lesson-2-act-1");
  state.completeLesson("sw-lesson-2"); // Replays count as sessions but award XP once.
  state.completeReview();
  state.setDailyGoal(3);
  language.useLanguageStore.getState().setSelectedLanguage("fr");
  language.useLanguageStore.getState().setSelectedLanguage("sw");
  assert.equal(learning.useLearningSaveStatus.getState().status, "saving");
  assert.equal(language.useLanguageSaveStatus.getState().status, "saving");
  await waitFor(() => storage.started.length === 2, "first writes");
  assert.deepEqual(storage.values, before);
  assert.equal(storage.started.filter(({ key }) => key === PROGRESS).length, 1);
  assert.equal(storage.started.filter(({ key }) => key === COURSE).length, 1);
  progressHold.resolve();
  courseHold.resolve();
  await waitFor(() => learning.useLearningSaveStatus.getState().status === "saved"
    && language.useLanguageSaveStatus.getState().status === "saved", "latest writes");
  const final = snapshot(learning.useLearningStore);
  assert.equal(final.totalXp, 20);
  assert.deepEqual(final.completedLessonIds, ["sw-lesson-1", "sw-lesson-2"]);
  assert.equal(final.dailyGoal, 3);
  assert.deepEqual(final.activityByDate["2020-01-01"], progress.activityByDate["2020-01-01"]);
  assert.deepEqual(final.activityByDate[today()], { lessons: 2, reviews: 1 });
  assert.deepEqual(final.reviewItems, [...progress.reviewItems, { lessonId: "sw-lesson-2", activityId: "sw-lesson-2-act-1" }]);
  assert.deepEqual(JSON.parse(storage.values[PROGRESS]).state, final);
  assert.equal(JSON.parse(storage.values[COURSE]).state.selectedLanguage, "sw");

  const reopened = loadStores(storage);
  await waitFor(() => hydrated(reopened));
  assert.deepEqual(snapshot(reopened.learning.useLearningStore), final);
  assert.equal(reopened.language.useLanguageStore.getState().selectedLanguage, "sw");
});

test("failed saves retain the current snapshot and retry does not repeat lessons or reviews", async () => {
  const storage = new MemoryStorage(initial());
  const before = { ...storage.values };
  const stores = loadStores(storage);
  await waitFor(() => hydrated(stores));
  const { learning, language } = stores;
  storage.failedWrites.add(PROGRESS);
  storage.failedWrites.add(COURSE);
  const state = learning.useLearningStore.getState();
  state.completeLesson("sw-lesson-2");
  state.addMistake("sw-lesson-2", "sw-lesson-2-act-1");
  state.completeReview();
  state.setDailyGoal(3);
  language.useLanguageStore.getState().setSelectedLanguage("fr");
  await waitFor(() => learning.useLearningSaveStatus.getState().status === "error"
    && language.useLanguageSaveStatus.getState().status === "error", "failed saves");
  const unsaved = snapshot(learning.useLearningStore);
  assert.equal(unsaved.totalXp, 20);
  assert.deepEqual(unsaved.activityByDate[today()], { lessons: 1, reviews: 1 });
  assert.deepEqual(storage.values, before);

  // A disk re-read cannot roll memory back while there are unsaved changes.
  await Promise.all([learning.useLearningStore.persist.rehydrate(), language.useLanguageStore.persist.rehydrate()]);
  assert.deepEqual(snapshot(learning.useLearningStore), unsaved);
  assert.equal(language.useLanguageStore.getState().selectedLanguage, "fr");
  assert.equal(learning.useLearningHydrationStatus.getState().status, "ready");
  assert.equal(await learning.retryLearningSave(), false); // A second failure also does not replay events.
  assert.deepEqual(snapshot(learning.useLearningStore), unsaved);
  storage.failedWrites.clear();
  assert.equal(await learning.retryLearningSave(), true);
  assert.equal(await language.retryLanguageSave(), true);
  assert.deepEqual(snapshot(learning.useLearningStore), unsaved);
  assert.deepEqual(JSON.parse(storage.values[PROGRESS]).state, unsaved);
  assert.equal(JSON.parse(storage.values[COURSE]).state.selectedLanguage, "fr");
  assert.equal(await learning.retryLearningSave(), false); // Nothing left to retry.

  const reopened = loadStores(storage);
  await waitFor(() => hydrated(reopened));
  assert.deepEqual(snapshot(reopened.learning.useLearningStore), unsaved);
  assert.equal(reopened.language.useLanguageStore.getState().selectedLanguage, "fr");
});

test("legacy language codes and an initially empty device remain supported", async () => {
  const storage = new MemoryStorage();
  const stores = loadStores(storage);
  await waitFor(() => hydrated(stores));
  assert.equal(stores.learning.useLearningSaveStatus.getState().status, "idle");
  assert.equal(stores.language.useLanguageSaveStatus.getState().status, "idle");
  assert.deepEqual(storage.started, []);
  for (const code of ["sw", "en", "es", "fr", "ja", "ko", "de", "zh"]) {
    stores.language.useLanguageStore.getState().setSelectedLanguage(code);
    await waitFor(() => stores.language.useLanguageSaveStatus.getState().status === "saved");
    const reopened = loadStores(storage);
    await waitFor(() => hydrated(reopened));
    assert.equal(reopened.language.useLanguageStore.getState().selectedLanguage, code);
  }
});

test("an earlier failed write cannot mark a newer pending snapshot as failed or saved", async () => {
  const storage = new MemoryStorage(initial());
  const old = storage.values[PROGRESS];
  const first = deferred();
  const second = deferred();
  let attempts = 0;
  storage.setItem = async function (key, value) {
    if (key !== PROGRESS) throw new Error("unexpected key");
    attempts += 1;
    if (attempts === 1) {
      await first.promise;
      throw new Error("first write failed");
    }
    await second.promise;
    this.values[key] = value;
  };
  const stores = loadStores(storage);
  await waitFor(() => hydrated(stores));
  const { learning } = stores;
  learning.useLearningStore.getState().completeLesson("sw-lesson-2");
  learning.useLearningStore.getState().setDailyGoal(3);
  await waitFor(() => attempts === 1);
  first.resolve();
  await waitFor(() => attempts === 2);
  assert.equal(learning.useLearningSaveStatus.getState().status, "saving");
  assert.equal(storage.values[PROGRESS], old);
  second.resolve();
  await waitFor(() => learning.useLearningSaveStatus.getState().status === "saved");
  assert.deepEqual(JSON.parse(storage.values[PROGRESS]).state, snapshot(learning.useLearningStore));
  assert.equal(JSON.parse(storage.values[PROGRESS]).state.totalXp, 20);
  assert.equal(JSON.parse(storage.values[PROGRESS]).state.dailyGoal, 3);
});

test("a value that disappears after it was read is not treated as a fresh profile", async () => {
  const storage = new MemoryStorage(initial());
  const stores = loadStores(storage);
  await waitFor(() => hydrated(stores));
  const original = storage.values[PROGRESS];
  delete storage.values[PROGRESS];
  await stores.learning.useLearningStore.persist.rehydrate();
  assert.deepEqual(stores.learning.useLearningHydrationStatus.getState(), { status: "error", reason: "read" });
  stores.learning.useLearningStore.getState().completeLesson("sw-lesson-2");
  assert.equal(stores.learning.useLearningStore.getState().totalXp, 10);
  assert.equal(storage.values[PROGRESS], undefined);
  assert.deepEqual(storage.started, []);
  storage.values[PROGRESS] = original;
  await stores.learning.useLearningStore.persist.rehydrate();
  assert.equal(stores.learning.useLearningHydrationStatus.getState().status, "ready");
  assert.deepEqual(snapshot(stores.learning.useLearningStore), progress);
});

test("an ambiguously failed migration can recover if the new snapshot actually reached storage", async () => {
  const old = envelope({ totalXp: 35, completedLessonIds: ["sw-lesson-1", "fr-lesson-5"] }, 1);
  const storage = new MemoryStorage({ [PROGRESS]: old, [COURSE]: envelope({ selectedLanguage: "de" }, 0) });
  let attempts = 0;
  storage.setItem = async function (key, value) {
    attempts += 1;
    this.values[key] = value;
    throw new Error("write completed but acknowledgement failed");
  };
  const stores = loadStores(storage);
  await waitFor(() => hydrated(stores));
  assert.equal(stores.learning.useLearningHydrationStatus.getState().reason, "migration");
  assert.equal(JSON.parse(storage.values[PROGRESS]).version, 2);
  await stores.learning.useLearningStore.persist.rehydrate();
  assert.equal(stores.learning.useLearningHydrationStatus.getState().status, "ready");
  assert.equal(stores.learning.useLearningSaveStatus.getState().status, "saved");
  assert.equal(stores.learning.useLearningStore.getState().totalXp, 35);
  assert.deepEqual(stores.learning.useLearningStore.getState().activityByDate, {});
  assert.equal(attempts, 1, "a successful read of the migrated snapshot needs no second write");
});

test("slow initial reads cannot be overwritten by actions before hydration completes", async () => {
  const storage = new MemoryStorage(initial());
  const before = { ...storage.values };
  const progressRead = deferred();
  const courseRead = deferred();
  const originalRead = storage.getItem.bind(storage);
  storage.getItem = async (key) => {
    await (key === PROGRESS ? progressRead.promise : courseRead.promise);
    return originalRead(key);
  };
  const stores = loadStores(storage);
  assert.equal(stores.learning.useLearningHydrationStatus.getState().status, "loading");
  assert.equal(stores.language.useLanguageHydrationStatus.getState().status, "loading");
  const state = stores.learning.useLearningStore.getState();
  state.completeLesson("sw-lesson-2");
  state.setDailyGoal(3);
  state.completeReview();
  stores.language.useLanguageStore.getState().setSelectedLanguage("fr");
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(storage.values, before);
  assert.deepEqual(storage.started, []);
  progressRead.resolve();
  courseRead.resolve();
  await waitFor(() => hydrated(stores));
  assert.deepEqual(snapshot(stores.learning.useLearningStore), progress);
  assert.equal(stores.language.useLanguageStore.getState().selectedLanguage, "es");
  assert.deepEqual(storage.values, before);
  assert.deepEqual(storage.started, []);
});

test("empty native values are not mistaken for an absent progress or course key", async () => {
  for (const key of [PROGRESS, COURSE]) {
    const storage = new MemoryStorage({ ...initial(), [key]: "" });
    // Native getItem has this lossy behavior; native multiGet preserves "".
    const read = storage.getItem.bind(storage);
    storage.getItem = async (name) => (await read(name)) || null;
    storage.multiGet = async (keys) => Promise.all(keys.map(async (name) => [name, await read(name)]));
    assert.equal(await storage.getItem(key), null);
    const stores = loadStores(storage);
    await waitFor(() => hydrated(stores));
    const current = key === PROGRESS ? stores.learning : stores.language;
    const hydration = key === PROGRESS ? current.useLearningHydrationStatus : current.useLanguageHydrationStatus;
    const store = key === PROGRESS ? current.useLearningStore : current.useLanguageStore;
    assert.deepEqual(hydration.getState(), { status: "error", reason: "corrupt" });
    if (key === PROGRESS) store.getState().completeLesson("sw-lesson-2");
    else store.getState().setSelectedLanguage("fr");
    await store.persist.rehydrate();
    assert.equal(storage.values[key], "");
    assert.deepEqual(storage.started, []);
  }
});

test("malformed multiGet results fail closed rather than creating a new profile", async () => {
  for (const result of [[], [["other", null]], [[PROGRESS, undefined]], [[PROGRESS, null], [PROGRESS, null]]]) {
    const storage = new MemoryStorage(initial());
    storage.multiGet = async () => result;
    const stores = loadStores(storage);
    await waitFor(() => hydrated(stores));
    assert.deepEqual(stores.learning.useLearningHydrationStatus.getState(), { status: "error", reason: "read" });
    assert.deepEqual(stores.language.useLanguageHydrationStatus.getState(), { status: "error", reason: "read" });
    stores.learning.useLearningStore.getState().completeLesson("sw-lesson-2");
    stores.language.useLanguageStore.getState().setSelectedLanguage("fr");
    assert.deepEqual(storage.values, initial());
    assert.deepEqual(storage.started, []);
  }
});
