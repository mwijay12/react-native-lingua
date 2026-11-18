const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const test = require("node:test");
const ts = require("typescript");

require.extensions[".tsx"] = (module, filename) => {
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  });
  module._compile(compiled.outputText, filename);
};

function loadComponents() {
  const model = {
    progress: "idle", course: "idle", progressHydration: "ready", courseHydration: "ready",
    progressReason: null, courseReason: null, playReason: null, soundReason: null,
    playHydration: "ready", playSave: "idle", soundHydration: "ready", soundSave: "idle", soundEnabled: true,
    progressRetries: 0, courseRetries: 0, reads: [],
  };
  const learning = {
    useLearningSaveStatus: (selector) => selector({ status: model.progress }),
    useLearningHydrationStatus: (selector) => selector({ status: model.progressHydration, reason: model.progressReason }),
    useLearningStore: { persist: { rehydrate: () => model.reads.push("progress") } },
    retryLearningSave: async () => { model.progressRetries += 1; },
  };
  const language = {
    useLanguageSaveStatus: (selector) => selector({ status: model.course }),
    useLanguageHydrationStatus: (selector) => selector({ status: model.courseHydration, reason: model.courseReason }),
    useLanguageStore: { persist: { rehydrate: () => model.reads.push("course") } },
    retryLanguageSave: async () => { model.courseRetries += 1; },
  };
  const audio = {
    useAudioSettingsHydration: (selector) => selector({ status: model.soundHydration, reason: model.soundReason }),
    useAudioSettingsSaveStatus: (selector) => selector({ status: model.soundSave }),
    useAudioSettingsStore: Object.assign(
      (selector) => selector({ effectsEnabled: model.soundEnabled, setEffectsEnabled: (value) => { model.soundEnabled = value; } }),
      { persist: { rehydrate: () => model.reads.push("sound") } },
    ),
    retryAudioSettingsSave: () => model.reads.push("sound-save"),
  };
  const rn = { Text: "Text", View: "View", TouchableOpacity: "TouchableOpacity", ActivityIndicator: "ActivityIndicator", ScrollView: "ScrollView", Platform: { OS: "android" } };
  const jsxRuntime = { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
  for (const filename of ["../components/LearningSaveMessage.tsx", "../components/PendingSaveBanner.tsx", "../components/LearningHydrationScreen.tsx", "../components/SoundEffectsControl.tsx"]) {
    delete require.cache[require.resolve(filename)];
  }
  const original = Module._load;
  try {
    Module._load = function (request, parent, isMain) {
      if (request === "react/jsx-runtime") return jsxRuntime;
      if (request === "react-native") return rn;
      if (request === "react-native-safe-area-context") return { SafeAreaView: "SafeAreaView" };
      if (request === "@expo/vector-icons") return { Ionicons: "Ionicons" };
      if (request === "@/store/audioSettingsStore") return audio;
      if (request === "@/store/learningStore") return learning;
      if (request === "@/store/languageStore") return language;
      if (request === "@/store/playStore") return {
        usePlayStore: { persist: { rehydrate: () => model.reads.push("play") } },
        usePlayHydrationStatus: (selector) => selector({ status: model.playHydration, reason: model.playReason }),
        usePlaySaveStatus: (selector) => selector({ status: model.playSave }),
        retryPlaySave: () => model.reads.push("play-save"),
      };
      return original.call(this, request, parent, isMain);
    };
    return {
      model,
      LearningSaveMessage: require("../components/LearningSaveMessage.tsx").LearningSaveMessage,
      PendingSaveBanner: require("../components/PendingSaveBanner.tsx").PendingSaveBanner,
      LearningHydrationScreen: require("../components/LearningHydrationScreen.tsx").LearningHydrationScreen,
      SoundEffectsControl: require("../components/SoundEffectsControl.tsx").SoundEffectsControl,
    };
  } finally {
    Module._load = original;
  }
}

function find(tree, predicate) {
  if (!tree || typeof tree !== "object") return undefined;
  if (Array.isArray(tree)) {
    for (const child of tree) {
      const result = find(child, predicate);
      if (result) return result;
    }
    return undefined;
  }
  if (predicate(tree)) return tree;
  return find(tree.props?.children, predicate);
}
function text(tree) {
  if (tree === null || tree === undefined || typeof tree === "boolean") return "";
  if (typeof tree === "string" || typeof tree === "number") return String(tree);
  if (Array.isArray(tree)) return tree.map(text).join(" ");
  return text(tree.props?.children);
}
const byId = (tree, id) => find(tree, (element) => element.props?.testID === id);

test("the result message claims saved only for an acknowledged snapshot", () => {
  const { model, LearningSaveMessage } = loadComponents();
  for (const [status, expected] of [
    ["idle", "local to this device"],
    ["saving", "Saving your progress"],
    ["error", "not saved yet"],
    ["saved", "is saved on this device"],
  ]) {
    model.progress = status;
    const message = text(LearningSaveMessage({}));
    assert.ok(message.includes(expected), message);
    if (status !== "saved") assert.ok(!message.includes("is saved on this device"));
  }
});

test("global notices show pending work and separate retries without claiming success", () => {
  const { model, PendingSaveBanner } = loadComponents();
  assert.equal(PendingSaveBanner(), null);
  model.progress = "saving";
  let tree = PendingSaveBanner();
  assert.ok(text(tree).includes("Saving progress"));
  assert.equal(byId(tree, "retry-learning-save"), undefined);
  model.progress = "error";
  model.course = "error";
  tree = PendingSaveBanner();
  assert.ok(text(tree).includes("Progress is not saved yet"));
  assert.ok(text(tree).includes("Course selection is not saved yet"));
  assert.ok(text(tree).includes("could be lost"));
  byId(tree, "retry-learning-save").props.onPress();
  byId(tree, "retry-language-save").props.onPress();
  assert.equal(model.progressRetries, 1);
  assert.equal(model.courseRetries, 1);
  model.progressHydration = "error";
  tree = PendingSaveBanner();
  assert.equal(byId(tree, "progress-save-notice"), undefined);
  assert.ok(byId(tree, "course-save-notice"));
});

test("play and sound save problems remain visible and retryable outside their screens", () => {
  const { model, PendingSaveBanner } = loadComponents();
  model.playSave = "saving";
  model.soundSave = "error";
  let tree = PendingSaveBanner();
  assert.ok(text(tree).includes("Saving play rewards"));
  assert.ok(text(tree).includes("Sound settings are not saved yet"));
  assert.equal(byId(tree, "retry-play-save-global"), undefined);
  byId(tree, "retry-sound-save-global").props.onPress();
  model.playSave = "error";
  model.soundSave = "saving";
  tree = PendingSaveBanner();
  assert.ok(text(tree).includes("Play rewards are not saved yet"));
  assert.ok(text(tree).includes("Saving sound settings"));
  byId(tree, "retry-play-save-global").props.onPress();
  assert.deepEqual(model.reads, ["sound-save", "play-save"]);
  model.playHydration = "error";
  model.soundHydration = "error";
  assert.equal(PendingSaveBanner(), null);
});

test("read screens explain newer, damaged and failed-migration data without a reset", () => {
  const { model, LearningHydrationScreen } = loadComponents();
  model.progressReason = "newer";
  let tree = LearningHydrationScreen({ status: "error" });
  assert.ok(text(tree).includes("newer app version"));
  assert.ok(text(tree).includes("do not uninstall"));
  byId(tree, "retry-learning-hydration").props.onPress();
  model.progressReason = "corrupt";
  tree = LearningHydrationScreen({ status: "error" });
  assert.ok(text(tree).includes("unexpected or damaged format"));
  assert.ok(text(tree).includes("has not been reset"));
  model.progressReason = "migration";
  tree = LearningHydrationScreen({ status: "error" });
  assert.ok(text(tree).includes("update could not be saved"));
  model.courseReason = "newer";
  tree = LearningHydrationScreen({ status: "error", storage: "course" });
  assert.ok(text(tree).includes("newer app version"));
  byId(tree, "retry-language-hydration").props.onPress();
  model.playReason = "newer";
  tree = LearningHydrationScreen({ status: "error", storage: "play" });
  assert.ok(text(tree).includes("newer app version"));
  byId(tree, "retry-play-hydration").props.onPress();
  assert.deepEqual(model.reads, ["progress", "course", "play"]);
});

test("sound settings explain invalid and newer data and offer a read retry", () => {
  const { model, SoundEffectsControl } = loadComponents();
  model.soundHydration = "error";
  model.soundReason = "newer";
  let tree = SoundEffectsControl({});
  assert.ok(text(tree).includes("newer app version"));
  assert.ok(text(tree).includes("do not uninstall"));
  byId(tree, "sound-effects-toggle").props.onPress();
  assert.deepEqual(model.reads, ["sound"]);
  model.soundReason = "corrupt";
  tree = SoundEffectsControl({});
  assert.ok(text(tree).includes("unexpected format"));
  assert.ok(text(tree).includes("not reset"));
  model.soundHydration = "ready";
  model.soundSave = "error";
  tree = SoundEffectsControl({});
  byId(tree, "retry-sound-settings-save").props.onPress();
  assert.deepEqual(model.reads, ["sound", "sound-save"]);
});
