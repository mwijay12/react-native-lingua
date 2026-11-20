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
  playback.play(0.65);
  assert.equal(media.currentTime, 0, "playback must restart from the beginning");
  assert.equal(media.playbackRate, 0.65);
  assert.equal(media.preservesPitch, true);
  await flush();
  assert.equal(errors, 1);

  let rejectOldPlay;
  nextPlay = () => new Promise((_resolve, reject) => { rejectOldPlay = reject; });
  playback.play();
  assert.equal(media.playbackRate, 1, "effects use the normal playback rate");
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
    async multiGet(names) { return Promise.all(names.map(async (name) => [name, await this.getItem(name)])); },
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

test("feedback WAVs are registered, short, smooth and have generous headroom", () => {
  assert.deepEqual(Object.keys(soundEffects).sort(), ["celebration", "correct", "option", "wrong"]);
  const lengths = { correct: [0.25, 0.35], wrong: [0.20, 0.25], celebration: [0.60, 0.80], option: [0.03, 0.10] };
  const samplesByName = {};
  for (const [name, file] of Object.entries(soundEffects)) {
    const bytes = fs.readFileSync(file);
    assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
    assert.equal(bytes.toString("ascii", 8, 12), "WAVE");
    assert.equal(bytes.readUInt16LE(20), 1, `${name}: PCM required`);
    assert.equal(bytes.readUInt16LE(22), 1, `${name}: mono required`);
    assert.equal(bytes.readUInt32LE(24), 24000);
    assert.equal(bytes.readUInt16LE(34), 16);
    assert.equal(bytes.toString("ascii", 36, 40), "data");
    const dataBytes = bytes.readUInt32LE(40);
    assert.equal(dataBytes, bytes.length - 44);
    const duration = dataBytes / 2 / 24000;
    assert.ok(duration >= lengths[name][0] && duration <= lengths[name][1], `${name}: ${duration}s`);
    const samples = [];
    for (let offset = 44; offset < bytes.length; offset += 2) samples.push(bytes.readInt16LE(offset) / 32768);
    samplesByName[name] = samples;
    assert.equal(samples[0], 0, `${name}: non-zero start can click`);
    assert.ok(Math.abs(samples.at(-1)) < 0.001, `${name}: non-zero end can click`);
    const peak = Math.max(...samples.map(Math.abs));
    assert.ok(peak > 0.02 && peak < 0.5, `${name}: silent or insufficient headroom (${peak})`);
    let maxStep = 0;
    for (let index = 1; index < samples.length; index += 1) maxStep = Math.max(maxStep, Math.abs(samples[index] - samples[index - 1]));
    assert.ok(maxStep < 0.12, `${name}: abrupt discontinuity (${maxStep})`);
  }
  assert.ok(Math.max(...samplesByName.option.map(Math.abs)) < Math.max(...samplesByName.correct.map(Math.abs)) / 2);

  // Check the actual PCM contains the intended notes, not just valid headers.
  const energy = (samples, frequency, start, duration = 0.045) => {
    const begin = Math.round(start * 24000), count = Math.round(duration * 24000);
    let real = 0, imaginary = 0;
    for (let i = 0; i < count; i += 1) {
      const window = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (count - 1));
      const phase = 2 * Math.PI * frequency * i / 24000;
      real += samples[begin + i] * window * Math.cos(phase);
      imaginary += samples[begin + i] * window * Math.sin(phase);
    }
    return Math.hypot(real, imaginary) / count;
  };
  assert.ok(energy(samplesByName.correct, 659.25, 0.035) > energy(samplesByName.correct, 880, 0.035) * 4);
  assert.ok(energy(samplesByName.correct, 880, 0.23) > energy(samplesByName.correct, 659.25, 0.23) * 4);
  for (const [frequency, start] of [[523.25, 0.035], [659.25, 0.155], [783.99, 0.275], [1046.5, 0.43]]) {
    assert.ok(energy(samplesByName.celebration, frequency, start) > 0.005, `missing ${frequency} Hz fanfare note`);
  }
  const rms = (samples, start, end) => Math.sqrt(samples.slice(start * 24000, end * 24000).reduce((sum, value) => sum + value * value, 0) / ((end - start) * 24000));
  assert.ok(rms(samplesByName.wrong, 0.025, 0.06) > 0.02);
  assert.ok(rms(samplesByName.wrong, 0.13, 0.165) > 0.015, "wrong sound needs a second thud");
});

test("effect pools preload once, overlap, obey the preference and clean up", () => {
  const { createSoundEffectsManager } = require("../lib/soundEffectsManager.ts");
  let enabled = false;
  const players = [];
  const manager = createSoundEffectsManager((effect, canContinue) => {
    const player = { effect, canContinue, plays: 0, stops: 0, releases: 0,
      play() { this.plays += 1; }, stop() { this.stops += 1; }, dispose() { this.releases += 1; } };
    players.push(player);
    return player;
  }, () => enabled);
  manager.play("correct");
  assert.equal(players.length, 0);
  manager.start();
  manager.start();
  assert.equal(players.length, 8);
  manager.play("correct");
  assert.equal(players.reduce((sum, player) => sum + player.plays, 0), 0, "unread/muted settings must not play");
  enabled = true;
  manager.play("correct");
  manager.play("correct");
  manager.play("wrong");
  assert.deepEqual(players.filter((player) => player.effect === "correct").map((player) => player.plays), [1, 1]);
  assert.equal(players.filter((player) => player.effect === "correct").reduce((sum, player) => sum + player.stops, 0), 0, "overlap must not stop the first player");
  assert.equal(players.find((player) => player.effect === "wrong").plays, 1);
  manager.play("correct");
  assert.deepEqual(players.filter((player) => player.effect === "correct").map((player) => player.plays), [2, 1], "bounded pool reuses the oldest");
  enabled = false;
  assert.equal(players[0].canContinue(), false, "a pending native seek must see a muted setting");
  manager.stopAll();
  manager.play("option");
  assert.equal(players.find((player) => player.effect === "option").plays, 0);
  enabled = true;
  manager.setActive(false);
  assert.equal(players[0].canContinue(), false);
  manager.play("celebration");
  manager.setActive(true);
  assert.equal(players.find((player) => player.effect === "celebration").plays, 0, "foregrounding must not replay an old sound");
  manager.dispose();
  assert.ok(players.every((player) => player.releases === 1));
  assert.equal(players[0].canContinue(), false);
  manager.play("correct");
  manager.start();
  assert.equal(players.length, 16, "a remounted root can preload fresh players");
  manager.dispose();
});

test("native effect seeks cannot restart after mute, replacement or disposal", async () => {
  const seeks = [];
  let plays = 0, pauses = 0, releases = 0, enabled = true;
  const native = {
    pause() { pauses += 1; },
    seekTo(position) { assert.equal(position, 0); return new Promise((resolve) => seeks.push(resolve)); },
    play() { plays += 1; },
    remove() { releases += 1; },
  };
  const original = Module._load;
  let createEffectPlayer;
  try {
    Module._load = function (request, parent, isMain) {
      if (request === "expo-audio") return { createAudioPlayer: (source) => { assert.equal(source, 123); return native; } };
      return original.call(this, request, parent, isMain);
    };
    ({ createEffectPlayer } = require("../lib/effectPlayer.ts"));
  } finally { Module._load = original; }
  const player = createEffectPlayer(123, () => enabled);
  const flush = () => new Promise((resolve) => setImmediate(resolve));
  player.play();
  player.stop();
  seeks.shift()();
  await flush();
  assert.equal(plays, 0);
  player.play();
  player.play();
  seeks.shift()();
  seeks.shift()();
  await flush();
  assert.equal(plays, 1, "only the newest seek may start this player");
  player.play();
  enabled = false;
  seeks.shift()();
  await flush();
  assert.equal(plays, 1, "muting while seeking prevents playback");
  enabled = true;
  player.play();
  player.dispose();
  seeks.shift()();
  await flush();
  player.play();
  player.dispose();
  assert.equal(plays, 1);
  assert.equal(releases, 1);
  assert.ok(pauses >= 4);
});

test("feedback service respects hydration, mute, app state and independent haptics", async () => {
  const { createSoundEffectsManager } = require("../lib/soundEffectsManager.ts");
  function store(initial) {
    let state = initial;
    const listeners = new Set();
    return { getState: () => state, subscribe: (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
      set(next) { state = { ...state, ...next }; for (const listener of listeners) listener(state); } };
  }
  const settings = store({ effectsEnabled: true });
  const hydration = store({ status: "loading" });
  const events = [], players = [], modes = [];
  let appListener, unsupportedTick = false, deferTick = false, rejectTick;
  const sources = { correct: 1, wrong: 2, celebration: 3, option: 4 };
  const haptics = {
    AndroidHaptics: { Reject: "reject", Confirm: "confirm", Segment_Tick: "tick", Clock_Tick: "clock", Context_Click: "context" },
    ImpactFeedbackStyle: { Light: "light" }, NotificationFeedbackType: { Error: "error", Success: "success" },
    performAndroidHapticsAsync: (kind) => {
      events.push(`haptic:${kind}`);
      if (deferTick && kind === "tick") return new Promise((_resolve, reject) => { rejectTick = reject; });
      return unsupportedTick && kind === "tick" ? Promise.reject(new Error("not supported")) : Promise.resolve();
    },
    impactAsync: (kind) => { events.push(`haptic:${kind}`); return Promise.resolve(); },
    notificationAsync: (kind) => { events.push(`haptic:${kind}`); return Promise.resolve(); },
  };
  const mocks = {
    "expo-audio": { setAudioModeAsync: (mode) => { modes.push(mode); return Promise.resolve(); } },
    "expo-haptics": haptics,
    "react-native": { Platform: { OS: "android" }, AppState: { currentState: "active", addEventListener: (_event, listener) => { appListener = listener; return { remove() { appListener = null; } }; } } },
    "@/constants/audio": { soundEffects: sources },
    "@/lib/soundEffectsManager": { createSoundEffectsManager },
    "@/lib/effectPlayer": { createEffectPlayer: (source, allowed) => {
      const player = { source, releases: 0, stops: 0, play() { if (allowed()) events.push(`sound:${source}`); }, stop() { this.stops += 1; }, dispose() { this.releases += 1; } };
      players.push(player); return player;
    } },
    "@/store/audioSettingsStore": { useAudioSettingsHydration: hydration, useAudioSettingsStore: settings },
  };
  const original = Module._load;
  let service;
  try {
    Module._load = function (request, parent, isMain) { return Object.hasOwn(mocks, request) ? mocks[request] : original.call(this, request, parent, isMain); };
    service = require("../lib/soundEffects.ts");
  } finally { Module._load = original; }
  const cleanup = service.startAudioFeedback();
  assert.equal(players.length, 8);
  assert.equal(modes[0].interruptionMode, "mixWithOthers");
  assert.equal(modes[0].allowsRecording, false);
  service.feedback.correct();
  assert.deepEqual(events, ["haptic:tick"], "unread sound setting is silent; haptics are independent");
  hydration.set({ status: "ready" });
  service.feedback.option();
  service.feedback.correct();
  service.feedback.wrong();
  service.feedback.celebrate();
  assert.deepEqual(events.slice(1), ["sound:4", "sound:1", "haptic:tick", "sound:2", "haptic:reject", "sound:3", "haptic:confirm"]);
  const beforeMute = players[0].stops;
  settings.set({ effectsEnabled: false });
  assert.ok(players[0].stops > beforeMute, "muting must stop existing and pending sounds");
  service.feedback.wrong();
  assert.equal(events.at(-1), "haptic:reject");
  const count = events.length;
  appListener("background");
  service.feedback.correct();
  assert.equal(events.length, count);
  settings.set({ effectsEnabled: true });
  appListener("active");
  assert.equal(events.length, count, "nothing auto-resumes on foreground");
  service.feedback.correct();
  assert.equal(events.at(-2), "sound:1");
  hydration.set({ status: "error" });
  service.feedback.option();
  assert.equal(events.at(-1), "haptic:tick");
  unsupportedTick = true;
  service.feedback.correct();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(events.slice(-2), ["haptic:tick", "haptic:clock"], "older Android releases get a compatible fallback");
  deferTick = true;
  service.feedback.correct();
  const beforeInterruption = events.length;
  appListener("background");
  appListener("active");
  rejectTick(new Error("late unsupported result"));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(events.length, beforeInterruption, "an old haptic fallback cannot fire after a lifecycle change");
  cleanup();
  assert.ok(players.every((player) => player.releases === 1));
  assert.equal(appListener, null);
});

test("pronunciation requests cancel the prior sample without affecting effects", () => {
  const { createPronunciationCoordinator } = require("../lib/pronunciationCoordinator.ts");
  const coordinator = createPronunciationCoordinator();
  const a = {}, b = {}, calls = [];
  coordinator.claim(a, () => calls.push("stop a"));
  coordinator.claim(a, () => calls.push("stop a again"));
  coordinator.claim(b, () => calls.push("stop b"));
  coordinator.release(a); // A stale screen cannot release B's ownership.
  coordinator.claim(a, () => calls.push("new a"));
  assert.deepEqual(calls, ["stop a", "stop a again", "stop b"]);
  coordinator.release(a);
  coordinator.claim(b, () => calls.push("new b"));
  assert.equal(calls.length, 3);
});

test("iOS uses light success, error and celebration haptics with a shared silent-aware session", () => {
  const { createSoundEffectsManager } = require("../lib/soundEffectsManager.ts");
  const events = [], modes = [];
  const store = (state) => ({ getState: () => state, subscribe: () => () => {} });
  const mocks = {
    "expo-audio": { setAudioModeAsync: (mode) => { modes.push(mode); return Promise.resolve(); } },
    "expo-haptics": {
      ImpactFeedbackStyle: { Light: "light" }, NotificationFeedbackType: { Error: "error", Success: "success" },
      impactAsync: (kind) => { events.push(kind); return Promise.resolve(); },
      notificationAsync: (kind) => { events.push(kind); return Promise.resolve(); },
    },
    "react-native": { Platform: { OS: "ios" }, AppState: { currentState: "active", addEventListener: () => ({ remove() {} }) } },
    "@/constants/audio": { soundEffects: { correct: 1, wrong: 2, celebration: 3, option: 4 } },
    "@/lib/soundEffectsManager": { createSoundEffectsManager },
    "@/lib/effectPlayer": { createEffectPlayer: () => ({ play() {}, stop() {}, dispose() {} }) },
    "@/store/audioSettingsStore": { useAudioSettingsHydration: store({ status: "ready" }), useAudioSettingsStore: store({ effectsEnabled: true }) },
  };
  const original = Module._load;
  let service;
  try {
    Module._load = function (request, parent, isMain) { return Object.hasOwn(mocks, request) ? mocks[request] : original.call(this, request, parent, isMain); };
    delete require.cache[require.resolve("../lib/soundEffects.ts")];
    service = require("../lib/soundEffects.ts");
  } finally { Module._load = original; }
  const cleanup = service.startAudioFeedback();
  service.feedback.correct();
  service.feedback.wrong();
  service.feedback.celebrate();
  assert.deepEqual(events, ["light", "error", "success"]);
  assert.equal(modes[0].playsInSilentMode, false);
  assert.equal(modes[0].interruptionMode, "mixWithOthers");
  cleanup();
});
