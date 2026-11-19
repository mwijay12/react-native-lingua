const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

for (const extension of [".ts", ".tsx"]) {
  require.extensions[extension] = (module, filename) => {
    const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    });
    module._compile(compiled.outputText, filename);
  };
}

function sameDependencies(left, right) {
  return left && right && left.length === right.length && left.every((value, index) => Object.is(value, right[index]));
}

// Exercise the actual components with deterministic hooks and animations; no
// device, browser, user data, or extra test-renderer dependency is required.
function hookHarness() {
  const slots = [];
  let cursor = 0;
  let effects = [];
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: typeof initial === "function" ? initial() : initial };
      return [slots[index].value, (next) => {
        slots[index].value = typeof next === "function" ? next(slots[index].value) : next;
      }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { current: initial };
      return slots[index];
    },
    useCallback(callback, deps) {
      const index = cursor++;
      if (!slots[index] || !sameDependencies(slots[index].deps, deps)) slots[index] = { value: callback, deps };
      return slots[index].value;
    },
    useEffect(effect, deps) {
      const index = cursor++;
      const previous = slots[index];
      if (!previous || !sameDependencies(previous.deps, deps)) {
        effects.push(() => {
          previous?.cleanup?.();
          slots[index] = { deps, cleanup: effect() };
        });
      }
    },
  };
  return {
    react,
    render(component, props = {}) {
      cursor = 0;
      effects = [];
      const tree = component(props);
      for (const effect of effects) effect();
      return tree;
    },
    cleanup() { for (const slot of slots) slot?.cleanup?.(); },
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

function animationMock(harness) {
  const timings = [];
  const cancellations = [];
  const ease = (value) => value;
  return {
    timings,
    cancellations,
    module: {
      __esModule: true,
      default: { View: "AnimatedView" },
      useSharedValue: (initial) => harness.react.useRef({ value: initial }).current,
      useAnimatedStyle: (callback) => callback(),
      cancelAnimation: (value) => cancellations.push(value),
      withTiming: (to, config, callback) => { timings.push({ to, config, callback }); return to; },
      withDelay: (_delay, value) => value,
      withSequence: (...values) => values[values.length - 1],
      Easing: { out: ease, inOut: ease, cubic: ease, quad: ease, sin: ease },
    },
  };
}

function loadComponent(file, harness, overrides = {}) {
  const filename = require.resolve(file);
  delete require.cache[filename];
  const jsx = { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
  const native = {
    View: "View", Image: "Image", Text: "Text", TextInput: "TextInput", Pressable: "Pressable", TouchableOpacity: "TouchableOpacity",
    StyleSheet: { create: (styles) => styles, absoluteFillObject: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 } },
    Platform: { OS: "web" },
  };
  const original = Module._load;
  try {
    Module._load = function (request, parent, isMain) {
      if (Object.hasOwn(overrides, request)) return overrides[request];
      if (request === "react") return harness.react;
      if (request === "react/jsx-runtime") return jsx;
      if (request === "react-native") return native;
      if (request.startsWith("@/")) request = path.join(__dirname, "..", request.slice(2));
      return original.call(this, request, parent, isMain);
    };
    return require(filename);
  } finally {
    Module._load = original;
  }
}

function launchFixture(preference) {
  const harness = hookHarness();
  const animation = animationMock(harness);
  const state = { preference, hidden: 0, completed: 0, appListener: null };
  const module = loadComponent("../components/LaunchSplash.tsx", harness, {
    "react-native-reanimated": animation.module,
    "react-native": {
      View: "View", Image: "Image", Text: "Text", Pressable: "Pressable",
      StyleSheet: { create: (styles) => styles, absoluteFillObject: { position: "absolute" } },
      AppState: { currentState: "active", addEventListener: (_event, callback) => {
        state.appListener = callback;
        return { remove() { state.appListener = null; } };
      } },
    },
    "expo-splash-screen": { hideAsync: async () => { state.hidden += 1; } },
    "expo-status-bar": { StatusBar: "StatusBar" },
    "react-native-safe-area-context": { useSafeAreaInsets: () => ({ bottom: 0 }) },
    "react-native-worklets": { scheduleOnRN: (callback) => callback() },
    "@/hooks/useReducedMotionPreference": { useResolvedReducedMotionPreference: () => state.preference },
    "@/constants/images": { images: { splashLogo: 1 } },
    "@/constants/branding": { CREATOR_CREDIT: "Created by Mwijay" },
  });
  const onComplete = () => { state.completed += 1; };
  return { harness, animation, state, module, onComplete };
}

test("launch waits for layout before hiding native splash and immediately skips reduced motion", () => {
  const { harness, animation, state, module, onComplete } = launchFixture(null);
  let tree = harness.render(module.LaunchSplash, { onComplete });
  const skip = byId(tree, "skip-launch-animation");
  assert.equal(skip.props.accessibilityRole, "button");
  assert.equal(state.hidden, 0);
  assert.equal(state.completed, 0);
  skip.props.onLayout();
  skip.props.onLayout();
  assert.equal(state.hidden, 1);
  tree = harness.render(module.LaunchSplash, { onComplete });
  assert.ok(byId(tree, "launch-splash"));
  assert.equal(animation.timings.length, 0); // Unknown is still, never guessed.
  state.preference = true;
  harness.render(module.LaunchSplash, { onComplete });
  assert.equal(state.completed, 1);
  assert.equal(animation.timings.length, 0);
  harness.cleanup();
});

test("normal launch is skippable and completes from its UI animation without repeating the hide", () => {
  const { harness, animation, state, module, onComplete } = launchFixture(false);
  let tree = harness.render(module.LaunchSplash, { onComplete });
  byId(tree, "skip-launch-animation").props.onLayout();
  tree = harness.render(module.LaunchSplash, { onComplete });
  assert.equal(state.hidden, 1);
  assert.equal(state.completed, 0);
  assert.deepEqual(animation.timings.map((item) => item.to), [1, 0]);
  const exit = animation.timings.find((item) => item.callback);
  exit.callback(false);
  assert.equal(state.completed, 0);
  exit.callback(true);
  assert.equal(state.completed, 1);
  harness.cleanup();

  const next = launchFixture(false);
  tree = next.harness.render(next.module.LaunchSplash, { onComplete: next.onComplete });
  byId(tree, "skip-launch-animation").props.onLayout();
  tree = next.harness.render(next.module.LaunchSplash, { onComplete: next.onComplete });
  byId(tree, "skip-launch-animation").props.onPress();
  assert.equal(next.state.completed, 1);
  next.harness.cleanup();
});

test("launch has a maximum fallback and stops if the app backgrounds or motion is reduced", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const one = launchFixture(false);
  let tree = one.harness.render(one.module.LaunchSplash, { onComplete: one.onComplete });
  byId(tree, "skip-launch-animation").props.onLayout();
  one.harness.render(one.module.LaunchSplash, { onComplete: one.onComplete });
  t.mock.timers.tick(1099);
  assert.equal(one.state.completed, 0);
  t.mock.timers.tick(1);
  assert.equal(one.state.completed, 1);
  one.harness.cleanup();

  const two = launchFixture(false);
  tree = two.harness.render(two.module.LaunchSplash, { onComplete: two.onComplete });
  byId(tree, "skip-launch-animation").props.onLayout();
  two.harness.render(two.module.LaunchSplash, { onComplete: two.onComplete });
  two.state.appListener("background");
  two.harness.render(two.module.LaunchSplash, { onComplete: two.onComplete });
  assert.equal(two.state.completed, 1);
  assert.ok(two.animation.cancellations.length >= 2);
  two.harness.cleanup();

  const three = launchFixture(false);
  tree = three.harness.render(three.module.LaunchSplash, { onComplete: three.onComplete });
  byId(tree, "skip-launch-animation").props.onLayout();
  three.harness.render(three.module.LaunchSplash, { onComplete: three.onComplete });
  three.state.preference = true;
  three.harness.render(three.module.LaunchSplash, { onComplete: three.onComplete });
  assert.equal(three.state.completed, 1);
  three.harness.cleanup();
});

test("launch gate mounts navigation after the splash has left", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { harness, module } = launchFixture(true);
  let tree = harness.render(module.LaunchGate, { children: "app" });
  assert.equal(find(tree, (element) => element.props?.children === "app"), undefined);
  const splash = find(tree, (element) => element.type === module.LaunchSplash);
  splash.props.onComplete();
  tree = harness.render(module.LaunchGate, { children: "app" });
  assert.equal(find(tree, (element) => element.type === module.LaunchSplash), undefined);
  assert.equal(find(tree, (element) => element.props?.children === "app"), undefined);
  t.mock.timers.tick(50);
  tree = harness.render(module.LaunchGate, { children: "app" });
  assert.ok(find(tree, (element) => element.props?.children === "app"));
  harness.cleanup();

  const unmounted = launchFixture(true);
  tree = unmounted.harness.render(unmounted.module.LaunchGate, { children: "app" });
  find(tree, (element) => element.type === unmounted.module.LaunchSplash).props.onComplete();
  unmounted.harness.render(unmounted.module.LaunchGate, { children: "app" });
  unmounted.harness.cleanup();
  t.mock.timers.tick(50);
  tree = unmounted.harness.render(unmounted.module.LaunchGate, { children: "app" });
  assert.equal(find(tree, (element) => element.props?.children === "app"), undefined);
  unmounted.harness.cleanup();
});

test("motion preference resolves safely, honors later events, and has a still fallback", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const harness = hookHarness();
  let resolvePreference;
  let listener;
  let removed = false;
  const preference = new Promise((resolve) => { resolvePreference = resolve; });
  const { useResolvedReducedMotionPreference } = loadComponent("../hooks/useReducedMotionPreference.ts", harness, {
    "react-native": { AccessibilityInfo: {
      isReduceMotionEnabled: () => preference,
      addEventListener: (_event, callback) => { listener = callback; return { remove: () => { removed = true; } }; },
    } },
  });
  assert.equal(harness.render(useResolvedReducedMotionPreference), null);
  listener(true);
  assert.equal(harness.render(useResolvedReducedMotionPreference), true);
  resolvePreference(false); // A stale initial result cannot override the event.
  await Promise.resolve();
  assert.equal(harness.render(useResolvedReducedMotionPreference), true);
  harness.cleanup();
  assert.equal(removed, true);

  const fallback = hookHarness();
  let resolveLate;
  const pending = new Promise((resolve) => { resolveLate = resolve; });
  const hook = loadComponent("../hooks/useReducedMotionPreference.ts", fallback, {
    "react-native": { AccessibilityInfo: {
      isReduceMotionEnabled: () => pending,
      addEventListener: () => ({ remove() {} }),
    } },
  }).useResolvedReducedMotionPreference;
  assert.equal(fallback.render(hook), null);
  t.mock.timers.tick(250);
  assert.equal(fallback.render(hook), true);
  resolveLate(false);
  await Promise.resolve();
  assert.equal(fallback.render(hook), false);
  fallback.cleanup();
});

test("screen effects stop when unfocused, backgrounded, or reduced", () => {
  const harness = hookHarness();
  let focused = true;
  let reduced = false;
  let appListener;
  const { useScreenMotionAllowed } = loadComponent("../hooks/useScreenMotionAllowed.ts", harness, {
    "@react-navigation/native": { useIsFocused: () => focused },
    "@/hooks/useReducedMotionPreference": { useReducedMotionPreference: () => reduced },
    "react-native": { AppState: { currentState: "active", addEventListener: (_event, callback) => {
      appListener = callback;
      return { remove() {} };
    } } },
  });
  assert.equal(harness.render(useScreenMotionAllowed), true);
  focused = false;
  assert.equal(harness.render(useScreenMotionAllowed), false);
  focused = true;
  reduced = true;
  assert.equal(harness.render(useScreenMotionAllowed), false);
  reduced = false;
  appListener("background");
  assert.equal(harness.render(useScreenMotionAllowed), false);
  appListener("active");
  assert.equal(harness.render(useScreenMotionAllowed), true);
  harness.cleanup();
});

test("decorative stickers drift once without blocking interactions or looping", () => {
  const harness = hookHarness();
  let allowed = false;
  let starts = 0;
  let stops = 0;
  const timings = [];
  class Value {
    constructor(value) { this.value = value; }
    stopAnimation() {}
    setValue(value) { this.value = value; }
    interpolate() { return 0; }
  }
  const { MotionSticker } = loadComponent("../components/MotionSticker.tsx", harness, {
    "react-native": {
      View: "View", Platform: { OS: "android" }, Easing: { inOut: (value) => value, sin: () => {} },
      Animated: {
        View: "AnimatedView", Value,
        timing: (_value, options) => { timings.push(options); return {}; },
        sequence: () => ({ start: () => { starts += 1; }, stop: () => { stops += 1; } }),
      },
    },
    "@/components/LearningSticker": { LearningSticker: "LearningSticker" },
    "@/hooks/useScreenMotionAllowed": { useScreenMotionAllowed: () => allowed },
  });
  let tree = harness.render(MotionSticker, { kind: "book", testID: "sticker" });
  assert.equal(byId(tree, "sticker").props.pointerEvents, "none");
  assert.equal(starts, 0);
  allowed = true;
  harness.render(MotionSticker, { kind: "book", testID: "sticker" });
  assert.equal(starts, 1);
  assert.equal(timings.length, 3);
  assert.ok(timings.every((timing) => timing.isInteraction === false && timing.useNativeDriver === true));
  allowed = false;
  harness.render(MotionSticker, { kind: "book", testID: "sticker" });
  assert.equal(stops, 1);
  allowed = true;
  tree = harness.render(MotionSticker, { kind: "book", testID: "sticker" });
  assert.equal(starts, 1);
  assert.ok(find(tree, (element) => element.type === "LearningSticker"));
  harness.cleanup();
});

test("progress remains bounded, accessible immediately, and animates only when allowed", () => {
  const { boundedProgress } = require("../lib/motionProgress.ts");
  assert.deepEqual(boundedProgress(9, 3), { value: 3, max: 3, fraction: 1 });
  assert.deepEqual(boundedProgress(-1, 3), { value: 0, max: 3, fraction: 0 });
  assert.deepEqual(boundedProgress(NaN, 0), { value: 0, max: 0, fraction: 0 });

  const harness = hookHarness();
  const animation = animationMock(harness);
  let allowed = false;
  const { MotionProgress } = loadComponent("../components/MotionProgress.tsx", harness, {
    "react-native-reanimated": animation.module,
    "@/hooks/useScreenMotionAllowed": { useScreenMotionAllowed: () => allowed },
    "@/lib/motionProgress": { boundedProgress },
  });
  let props = { value: 1, max: 4, label: "Practice progress", valueText: "One of four" };
  let tree = harness.render(MotionProgress, props);
  assert.equal(tree.props.accessible, true);
  assert.equal(tree.props.accessibilityRole, "progressbar");
  assert.deepEqual(tree.props.accessibilityValue, { min: 0, max: 4, now: 1, text: "One of four" });
  assert.equal(tree.props.children.props.accessible, false);
  tree.props.onLayout({ nativeEvent: { layout: { width: 200 } } });
  tree = harness.render(MotionProgress, props);
  let fill = find(tree, (element) => element.type === "AnimatedView");
  assert.equal(fill.props.style[2].transform[0].translateX, -150);
  assert.equal(animation.timings.length, 0);
  props = { ...props, value: 2, valueText: "Two of four" };
  harness.render(MotionProgress, props);
  tree = harness.render(MotionProgress, props);
  fill = find(tree, (element) => element.type === "AnimatedView");
  assert.equal(fill.props.style[2].transform[0].translateX, -100);
  allowed = true;
  props = { ...props, value: 3 };
  tree = harness.render(MotionProgress, props);
  assert.equal(tree.props.accessibilityValue.now, 3);
  assert.equal(animation.timings.at(-1).to, 0.75);
  harness.cleanup();
});

test("press feedback does not change button actions and is still with reduced motion", () => {
  const harness = hookHarness();
  const animation = animationMock(harness);
  let reduced = false;
  let pressed = 0;
  let pressedIn = 0;
  const { MotionPressable } = loadComponent("../components/MotionPressable.tsx", harness, {
    "react-native-reanimated": animation.module,
    "@/hooks/useReducedMotionPreference": { useReducedMotionPreference: () => reduced },
  });
  const props = { testID: "button", accessibilityRole: "button", onPress: () => { pressed += 1; }, onPressIn: () => { pressedIn += 1; } };
  let tree = harness.render(MotionPressable, props);
  let button = byId(tree, "button");
  assert.equal(tree.type, "TouchableOpacity", "the hit target must not be transformed");
  assert.equal(button.props.children.type, "AnimatedView");
  assert.equal(button.props.children.props.pointerEvents, "none");
  assert.equal(button.props.children.props.style[0].maxWidth, "100%");
  assert.equal(button.props.children.props.style[0].flexShrink, 1);
  button.props.onPressIn({});
  button.props.onPress();
  button.props.onPressOut({});
  assert.equal(pressed, 1);
  assert.equal(pressedIn, 1);
  assert.deepEqual(animation.timings.map((item) => item.to), [0.985, 1]);
  reduced = true;
  tree = harness.render(MotionPressable, props);
  button = byId(tree, "button");
  button.props.onPressIn({});
  button.props.onPressOut({});
  assert.equal(animation.timings.length, 2);
  assert.equal(button.props.accessibilityRole, "button");
  harness.cleanup();
});

test("welcome companions remain visible and greet once only when screen motion is allowed", () => {
  const harness = hookHarness();
  const animation = animationMock(harness);
  let allowed = false;
  const { WelcomeScene } = loadComponent("../components/WelcomeScene.tsx", harness, {
    "react-native-reanimated": animation.module,
    "@/hooks/useScreenMotionAllowed": { useScreenMotionAllowed: () => allowed },
    "@/constants/images": { images: { mascotCat: 1, mascotParrot: 2 } },
  });
  let tree = harness.render(WelcomeScene, { height: 250 });
  assert.equal(byId(tree, "welcome-scene").props.style.height, 250);
  assert.equal(animation.timings.length, 0);
  assert.ok(find(tree, (element) => element.type === "Image" && element.props.source === 1));
  assert.ok(find(tree, (element) => element.type === "Image" && element.props.source === 2));
  allowed = true;
  harness.render(WelcomeScene, { height: 250 });
  assert.deepEqual(animation.timings.map((item) => item.to), [1, 0]);
  allowed = false;
  harness.render(WelcomeScene, { height: 250 });
  allowed = true;
  tree = harness.render(WelcomeScene, { height: 250 });
  assert.equal(animation.timings.length, 2);
  assert.equal(byId(tree, "welcome-scene").props.pointerEvents, "none");
  harness.cleanup();
});

test("answer choices keep radio and web keyboard behavior", () => {
  const harness = hookHarness();
  const animation = animationMock(harness);
  const answers = [];
  let focused = false;
  const { QuestionInput } = loadComponent("../components/QuestionInput.tsx", harness, {
    "react-native-reanimated": animation.module,
    "@expo/vector-icons": { Ionicons: "Ionicons" },
    "@/hooks/useScreenMotionAllowed": { useScreenMotionAllowed: () => true },
  });
  const tree = harness.render(QuestionInput, {
    activity: { type: "multiple-choice", options: ["Habari", "Asante"] }, answer: "", disabled: false,
    onChange: (answer) => answers.push(answer), onSubmit() {},
  });
  const first = byId(tree, "activity-choice-0");
  assert.equal(first.props.accessibilityRole, "radio");
  assert.equal(first.props.accessibilityState.checked, false);
  first.props.onPress();
  let prevented = false;
  first.props.onKeyDownCapture({
    key: "ArrowDown", preventDefault() { prevented = true; },
    currentTarget: { parentElement: { querySelectorAll: () => [{}, { focus: () => { focused = true; } }] } },
  });
  assert.equal(prevented, true);
  assert.equal(focused, true);
  assert.deepEqual(answers, ["Habari", "Asante"]);
  harness.cleanup();
});
