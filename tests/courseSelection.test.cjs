const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

// Render the actual selection screen with a tiny hook harness, while using the
// real persisted language store. No device or third-party test renderer needed.
for (const extension of [".ts", ".tsx"]) {
  require.extensions[extension] = (module, filename) => {
    const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    });
    module._compile(compiled.outputText, filename);
  };
}

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

async function waitFor(predicate) {
  for (let index = 0; index < 50; index += 1) {
    await new Promise((resolve) => setImmediate(resolve));
    if (predicate()) return;
  }
  assert.fail("Timed out waiting for course storage");
}

function loadLanguageStore(storage) {
  const filename = require.resolve("../store/languageStore.ts");
  delete require.cache[filename];
  const original = Module._load;
  try {
    Module._load = function (request, parent, isMain) {
      if (request === "@react-native-async-storage/async-storage") return { default: storage };
      if (request.startsWith("@/")) request = path.join(__dirname, "..", request.slice(2));
      return original.call(this, request, parent, isMain);
    };
    return require(filename);
  } finally {
    Module._load = original;
  }
}

function hookHarness() {
  const slots = [];
  let cursor = 0;
  let effects = [];
  const react = {
    useRef(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { current: initial };
      return slots[index];
    },
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
      return [slots[index], (next) => { slots[index] = typeof next === "function" ? next(slots[index]) : next; }];
    },
    useEffect(effect) { cursor += 1; effects.push(effect); },
  };
  return {
    react,
    render(component) {
      cursor = 0;
      effects = [];
      const tree = component();
      for (const effect of effects) effect();
      return tree;
    },
  };
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
const byId = (tree, id) => find(tree, (element) => element.props?.testID === id);

function loadScreen(language, harness, router, events) {
  const langs = [
    { code: "sw", name: "Kiswahili", nativeName: "Swahili", flag: 1 },
    { code: "en", name: "English", nativeName: "English", flag: 2 },
    { code: "fr", name: "French", nativeName: "Français", flag: 3 },
  ];
  const storeHook = (store) => {
    const hook = (selector) => selector ? selector(store.getState()) : store.getState();
    hook.getState = store.getState;
    return hook;
  };
  const languageModule = {
    useLanguageStore: storeHook(language.useLanguageStore),
    useLanguageSaveStatus: storeHook(language.useLanguageSaveStatus),
    useLanguageHydrationStatus: storeHook(language.useLanguageHydrationStatus),
  };
  const reactNative = {
    FlatList: "FlatList", Image: "Image", Text: "Text", TextInput: "TextInput", TouchableOpacity: "TouchableOpacity", View: "View",
    StyleSheet: { create: (styles) => styles },
    useWindowDimensions: () => ({ height: 800, width: 400 }),
  };
  const jsxRuntime = { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
  const filename = require.resolve("../app/language-select.tsx");
  delete require.cache[filename];
  const original = Module._load;
  try {
    Module._load = function (request, parent, isMain) {
      if (request === "react") return harness.react;
      if (request === "react/jsx-runtime") return jsxRuntime;
      if (request === "react-native") return reactNative;
      if (request === "react-native-safe-area-context") return { SafeAreaView: "SafeAreaView" };
      if (request === "@expo/vector-icons") return { Ionicons: "Ionicons" };
      if (request === "expo-router") return { router };
      if (request === "@/components/MotionSticker") return { MotionSticker: "MotionSticker" };
      if (request === "@/data/languages") return { LANGUAGES: langs, isAvailableLanguage: (code) => langs.some((item) => item.code === code) };
      if (request === "@/lib/posthog") return { posthog: { capture: (...args) => events.push(args) } };
      if (request === "@/store/languageStore") return languageModule;
      return original.call(this, request, parent, isMain);
    };
    return { Screen: require(filename).default, langs };
  } finally {
    Module._load = original;
  }
}

function choose(tree, language) {
  const list = find(tree, (element) => element.type === "FlatList");
  list.props.renderItem({ item: language }).props.onPress();
}

test("course selection waits for acknowledgement, survives failure and navigates once after retry", async () => {
  const old = JSON.stringify({ state: { selectedLanguage: "en" }, version: 0 });
  const hold = deferred();
  const storage = {
    value: old,
    fail: true,
    writes: 0,
    async getItem() { return this.value; },
    async multiGet(keys) { return keys.map((key) => [key, this.value]); },
    async setItem(_key, value) {
      this.writes += 1;
      if (this.writes === 1) await hold.promise;
      if (this.fail) throw new Error("write failed");
      this.value = value;
    },
    async removeItem() {},
  };
  const language = loadLanguageStore(storage);
  await waitFor(() => language.useLanguageHydrationStatus.getState().status === "ready");
  const navigation = [];
  const events = [];
  const router = { canGoBack: () => true, back: () => navigation.push("back"), replace: (route) => navigation.push(route) };
  const harness = hookHarness();
  const { Screen, langs } = loadScreen(language, harness, router, events);
  let tree = harness.render(Screen);
  choose(tree, langs[2]);
  tree = harness.render(Screen);
  const confirm = byId(tree, "language-confirm-button");
  confirm.props.onPress();
  confirm.props.onPress(); // Ignore a double tap before the disabled state renders.
  tree = harness.render(Screen);
  assert.equal(language.useLanguageSaveStatus.getState().status, "saving");
  assert.equal(byId(tree, "language-confirm-button").props.disabled, true);
  assert.deepEqual(navigation, []);
  assert.deepEqual(events, []);
  await waitFor(() => storage.writes === 1);
  assert.equal(storage.value, old);
  hold.resolve();
  await waitFor(() => language.useLanguageSaveStatus.getState().status === "error");
  tree = harness.render(Screen);
  assert.ok(byId(tree, "language-save-error"));
  assert.deepEqual(navigation, []);
  assert.deepEqual(events, []);
  assert.equal(storage.value, old);

  storage.fail = false;
  const retry = language.retryLanguageSave();
  tree = harness.render(Screen);
  assert.equal(language.useLanguageSaveStatus.getState().status, "saving");
  assert.deepEqual(navigation, []);
  assert.equal(await retry, true);
  assert.equal(JSON.parse(storage.value).state.selectedLanguage, "fr");
  harness.render(Screen);
  harness.render(Screen); // A subsequent render must not repeat navigation or analytics.
  assert.deepEqual(navigation, ["back"]);
  assert.deepEqual(events, [["language_selected", { language_code: "fr", language_name: "French" }]]);
  assert.equal(storage.writes, 2);
});

test("first course selection replaces onboarding only after a successful write", async () => {
  const hold = deferred();
  const storage = {
    value: JSON.stringify({ state: { selectedLanguage: null }, version: 0 }),
    async getItem() { return this.value; },
    async multiGet(keys) { return keys.map((key) => [key, this.value]); },
    async setItem(_key, value) { await hold.promise; this.value = value; },
    async removeItem() {},
  };
  const language = loadLanguageStore(storage);
  await waitFor(() => language.useLanguageHydrationStatus.getState().status === "ready");
  const navigation = [];
  const events = [];
  const router = { canGoBack: () => true, back: () => navigation.push("back"), replace: (route) => navigation.push(route) };
  const harness = hookHarness();
  const { Screen } = loadScreen(language, harness, router, events);
  let tree = harness.render(Screen);
  byId(tree, "language-confirm-button").props.onPress();
  tree = harness.render(Screen);
  assert.equal(byId(tree, "language-confirm-button").props.disabled, true);
  assert.deepEqual(navigation, []);
  hold.resolve();
  await waitFor(() => language.useLanguageSaveStatus.getState().status === "saved");
  harness.render(Screen);
  assert.equal(JSON.parse(storage.value).state.selectedLanguage, "sw");
  assert.deepEqual(navigation, ["/(tabs)"]);
  assert.equal(events.length, 1);
});

test("changing an unconfirmed draft does not navigate after retrying the previous selection", async () => {
  const storage = {
    value: JSON.stringify({ state: { selectedLanguage: "en" }, version: 0 }),
    fail: true,
    async getItem() { return this.value; },
    async multiGet(keys) { return keys.map((key) => [key, this.value]); },
    async setItem(_key, value) {
      if (this.fail) throw new Error("write failed");
      this.value = value;
    },
    async removeItem() {},
  };
  const language = loadLanguageStore(storage);
  await waitFor(() => language.useLanguageHydrationStatus.getState().status === "ready");
  const navigation = [];
  const events = [];
  const router = { canGoBack: () => true, back: () => navigation.push("back"), replace: (route) => navigation.push(route) };
  const harness = hookHarness();
  const { Screen, langs } = loadScreen(language, harness, router, events);
  let tree = harness.render(Screen);
  choose(tree, langs[2]); // Confirm French, but its write fails.
  tree = harness.render(Screen);
  byId(tree, "language-confirm-button").props.onPress();
  await waitFor(() => language.useLanguageSaveStatus.getState().status === "error");
  tree = harness.render(Screen);
  choose(tree, langs[0]); // Kiswahili is still only a draft.
  tree = harness.render(Screen);
  storage.fail = false;
  assert.equal(await language.retryLanguageSave(), true); // Retry the last confirmed French snapshot.
  tree = harness.render(Screen);
  assert.equal(JSON.parse(storage.value).state.selectedLanguage, "fr");
  assert.deepEqual(navigation, []);
  assert.deepEqual(events, []);
  byId(tree, "language-confirm-button").props.onPress();
  await waitFor(() => language.useLanguageSaveStatus.getState().status === "saved");
  harness.render(Screen);
  assert.equal(JSON.parse(storage.value).state.selectedLanguage, "sw");
  assert.deepEqual(navigation, ["back"]);
  assert.deepEqual(events, [["language_selected", { language_code: "sw", language_name: "Kiswahili" }]]);
});
