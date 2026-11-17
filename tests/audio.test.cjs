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
require.extensions[".mp3"] = (module, filename) => { module.exports = filename; };
require.extensions[".wav"] = (module, filename) => { module.exports = filename; };

const { pronunciationSamples, soundEffects } = require("../constants/audio.ts");
const { LESSONS } = require("../data/lessons.ts");
const { normalizeAnswer } = require("../lib/practice.ts");

test("each bundled pronunciation sample is labelled and matches its lesson", () => {
  const expected = ["sw", "en", "fr"].flatMap((code) => [
    `${code}-lesson-1`, `${code}-travel-places`, `${code}-travel-directions`,
    `${code}-planning-days`, `${code}-planning-meet`,
  ]);
  assert.deepEqual(Object.keys(pronunciationSamples).sort(), expected.sort());
  for (const [lessonId, sample] of Object.entries(pronunciationSamples)) {
    const lesson = LESSONS.find((item) => item.id === lessonId);
    assert.ok(lesson, `No lesson for ${lessonId}`);
    assert.ok(sample.lines.length >= 2);
    const material = new Set([
      ...lesson.vocabulary.map((item) => normalizeAnswer(item.word)),
      ...lesson.phrases.map((item) => normalizeAnswer(item.text)),
    ]);
    for (const line of sample.lines) {
      assert.ok(material.has(normalizeAnswer(line)), `${lessonId}: transcript line not taught in the lesson: ${line}`);
    }
    if (lessonId.includes("-planning-")) {
      assert.deepEqual(sample.lines.map(normalizeAnswer), [
        ...lesson.vocabulary.map((item) => normalizeAnswer(item.word)),
        ...lesson.phrases.map((item) => normalizeAnswer(item.text)),
      ], `${lessonId}: the sample should cover its words and phrases in order`);
    }
    const audio = fs.readFileSync(sample.source);
    assert.ok(audio.length > 1000 && audio.length < 250_000, `${lessonId}: unexpected recording size`);
    assert.ok(audio.subarray(0, 3).toString() === "ID3" || (audio[0] === 0xff && (audio[1] & 0xe0) === 0xe0), `${lessonId}: not an MP3`);
  }
  for (const file of Object.values(soundEffects)) {
    const audio = fs.readFileSync(file);
    assert.equal(audio.subarray(0, 4).toString(), "RIFF");
    assert.equal(audio.subarray(8, 12).toString(), "WAVE");
    assert.ok(audio.length < 50_000, "feedback effects should remain short");
  }
});

test("web audio reports blocked playback and ignores canceled or released requests", async () => {
  const { createWebAudioPlayback } = require("../lib/webAudioPlayback.ts");
  const media = new EventTarget();
  let nextPlay = () => Promise.resolve();
  let pauses = 0;
  let loads = 0;
  let errors = 0;
  let removeAttribute = "";
  Object.assign(media, {
    currentTime: 8,
    pause() { pauses += 1; },
    play() { return nextPlay(); },
    removeAttribute(name) { removeAttribute = name; },
    load() { loads += 1; },
  });
  const playback = createWebAudioPlayback(media, () => { errors += 1; });
  const flush = () => new Promise((resolve) => setImmediate(resolve));

  nextPlay = () => Promise.reject(new Error("autoplay blocked"));
  playback.play();
  assert.equal(media.currentTime, 0, "playback must restart from the beginning");
  await flush();
  assert.equal(errors, 1);

  let rejectOldPlay;
  nextPlay = () => new Promise((_resolve, reject) => { rejectOldPlay = reject; });
  playback.play();
  playback.stop();
  rejectOldPlay(new Error("play was stopped"));
  await flush();
  assert.equal(errors, 1, "a stopped request must not show a stale error");

  nextPlay = () => new Promise((_resolve, reject) => { rejectOldPlay = reject; });
  playback.play();
  nextPlay = () => Promise.resolve();
  playback.play();
  rejectOldPlay(new Error("superseded by a replay"));
  await flush();
  assert.equal(errors, 1, "a newer request must not inherit an older failure");

  media.dispatchEvent(new Event("error"));
  assert.equal(errors, 2, "media errors during playback must be reported");
  media.dispatchEvent(new Event("error"));
  assert.equal(errors, 2, "one media failure should only be reported once");

  nextPlay = () => new Promise((_resolve, reject) => { rejectOldPlay = reject; });
  playback.play();
  playback.dispose();
  rejectOldPlay(new Error("player was released"));
  await flush();
  media.dispatchEvent(new Event("error"));
  playback.play();
  assert.equal(errors, 2, "a released player must not report stale failures");
  assert.equal(removeAttribute, "src");
  assert.equal(loads, 1);
  assert.ok(pauses >= 4);
});

test("sound preferences survive rapid toggles and storage failures without touching progress", async () => {
  const saved = JSON.stringify({ state: { effectsEnabled: false }, version: 1 });
  let stored = saved;
  let failRead = true;
  let failWrite = false;
  let blockNextWrite = false;
  let releaseWrite;
  let activeWrites = 0;
  let maxConcurrentWrites = 0;
  let writes = 0;
  const keys = [];
  const storage = {
    async getItem(key) { keys.push(key); if (failRead) throw new Error("read failed"); return stored; },
    async setItem(key, value) {
      keys.push(key);
      activeWrites += 1;
      maxConcurrentWrites = Math.max(maxConcurrentWrites, activeWrites);
      try {
        if (blockNextWrite) {
          blockNextWrite = false;
          await new Promise((resolve) => { releaseWrite = resolve; });
        }
        if (failWrite) throw new Error("write failed");
        writes += 1;
        stored = value;
      } finally { activeWrites -= 1; }
    },
    async removeItem() { stored = null; },
  };
  const originalLoad = Module._load;
  Module._load = function (request, parent, isMain) {
    if (request === "@react-native-async-storage/async-storage") return { default: storage };
    if (request.startsWith("@/")) request = path.join(__dirname, "..", request.slice(2));
    return originalLoad.call(this, request, parent, isMain);
  };
  const { retryAudioSettingsSave, useAudioSettingsStore, useAudioSettingsHydration, useAudioSettingsSaveStatus } = require("../store/audioSettingsStore.ts");
  Module._load = originalLoad;
  const flush = () => new Promise((resolve) => setImmediate(resolve));
  await flush();
  assert.equal(useAudioSettingsHydration.getState().status, "error");
  useAudioSettingsStore.getState().setEffectsEnabled(true);
  assert.equal(stored, saved);
  assert.equal(writes, 0);

  failRead = false;
  await useAudioSettingsStore.persist.rehydrate();
  assert.equal(useAudioSettingsHydration.getState().status, "ready");
  assert.equal(useAudioSettingsStore.getState().effectsEnabled, false);
  blockNextWrite = true;
  useAudioSettingsStore.getState().setEffectsEnabled(true);
  await flush();
  useAudioSettingsStore.getState().setEffectsEnabled(false);
  releaseWrite();
  await flush();
  await flush();
  assert.equal(maxConcurrentWrites, 1);
  assert.equal(useAudioSettingsSaveStatus.getState().status, "saved");
  assert.equal(JSON.parse(stored).state.effectsEnabled, false);

  failWrite = true;
  useAudioSettingsStore.getState().setEffectsEnabled(true);
  await flush();
  assert.equal(useAudioSettingsSaveStatus.getState().status, "error");
  assert.equal(useAudioSettingsStore.getState().effectsEnabled, true);
  failWrite = false;
  retryAudioSettingsSave();
  await flush();
  assert.equal(useAudioSettingsSaveStatus.getState().status, "saved");
  assert.equal(JSON.parse(stored).state.effectsEnabled, true);
  assert.ok(keys.every((key) => key === "audio-settings"), "audio preference must not write study or play storage");

  stored = JSON.stringify({ state: { effectsEnabled: false }, version: 2 });
  const before = stored;
  const previousWrites = writes;
  await useAudioSettingsStore.persist.rehydrate();
  assert.equal(useAudioSettingsHydration.getState().status, "error");
  useAudioSettingsStore.getState().setEffectsEnabled(false);
  retryAudioSettingsSave();
  await flush();
  assert.equal(stored, before);
  assert.equal(writes, previousWrites);
});
