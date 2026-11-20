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

const client = load("../lib/chatClient.ts", { "expo/fetch": { fetch: (...args) => global.fetch(...args) } });
const chatRoute = require("../app/api/chat+api.ts");
const basic = {
  endpoint: "https://lingua.example/api/chat", platform: "android", token: "session-token",
  language: "sw", messages: [{ role: "user", content: "Habari?" }],
};
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const errorCode = (code) => (error) => error instanceof client.ChatRequestError && error.code === code;

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

function sameDependencies(left, right) {
  return left && right && left.length === right.length && left.every((value, index) => Object.is(value, right[index]));
}

function hookHarness() {
  const slots = [];
  let cursor = 0;
  let effects = [];
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: typeof initial === "function" ? initial() : initial };
      return [slots[index].value, (next) => { slots[index].value = typeof next === "function" ? next(slots[index].value) : next; }];
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
    render(component, props) {
      cursor = 0;
      effects = [];
      const result = component(props);
      for (const effect of effects) effect();
      return result;
    },
    cleanup() { for (const slot of slots) slot?.cleanup?.(); },
  };
}

function load(file, overrides) {
  const filename = require.resolve(file);
  delete require.cache[filename];
  const original = Module._load;
  try {
    Module._load = function (request, parent, isMain) {
      if (Object.hasOwn(overrides, request)) return overrides[request];
      if (request.startsWith("@/")) request = path.join(__dirname, "..", request.slice(2));
      return original.call(this, request, parent, isMain);
    };
    return require(filename);
  } finally {
    Module._load = original;
  }
}

function conversationFixture(connection) {
  const harness = hookHarness();
  const { useChatConversation } = load("../hooks/useChatConversation.ts", {
    react: harness.react,
    "react-native": { Platform: { OS: "android" } },
    "@/hooks/useChatConnection": { useChatConnection: () => connection },
    "@/lib/chatClient": client,
  });
  return { harness, render: (language = "sw") => harness.render(useChatConversation, language) };
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

test("chat endpoint accepts a trusted HTTPS URL or a same-origin web route only", () => {
  assert.equal(client.resolveChatEndpoint("https://lingua.example/api/chat", "android"), basic.endpoint);
  assert.equal(client.resolveChatEndpoint("/api/chat", "web"), "/api/chat");
  for (const bad of [undefined, "", "http://lingua.example/api/chat", "https://localhost/api/chat", "https://127.0.0.1/api/chat", "https://[::1]/api/chat", "https://user:pass@lingua.example/api/chat", "https://lingua.example/api/chat?key=secret", "//other.example/api/chat", "/api/chat"]) {
    assert.equal(client.resolveChatEndpoint(bad, "android"), null, String(bad));
  }
});

test("unconfigured, unauthenticated and invalid requests never reach a backend", async () => {
  let calls = 0;
  const fetcher = async () => { calls += 1; return json(200, { reply: "Hello" }); };
  const invalid = [
    [{ endpoint: null }, "configuration"],
    [{ endpoint: "http://lingua.example/api/chat" }, "configuration"],
    [{ token: null }, "authentication"],
    [{ language: "ja" }, "invalid-message"],
    [{ messages: [{ role: "user", content: "  " }] }, "invalid-message"],
    [{ messages: [{ role: "system", content: "secret" }] }, "invalid-message"],
    [{ messages: [{ role: "user", content: "a".repeat(client.CHAT_MESSAGE_LIMIT + 1) }] }, "invalid-message"],
  ];
  for (const [override, code] of invalid) {
    await assert.rejects(client.requestChatReply({ ...basic, ...override, fetcher }), errorCode(code));
  }
  const aborted = new AbortController();
  aborted.abort();
  await assert.rejects(client.requestChatReply({ ...basic, signal: aborted.signal, fetcher }), errorCode("network"));
  assert.equal(calls, 0);
});

test("chat sends bounded history to the app backend with a session token, not a provider key", async () => {
  const messages = [];
  for (let index = 0; index < 8; index += 1) {
    messages.push({ role: "user", content: `Question ${index}` }, { role: "assistant", content: `Answer ${index}` });
  }
  messages.push({ role: "user", content: "  Habari?  " });
  let request;
  const reply = await client.requestChatReply({ ...basic, messages, fetcher: async (url, options) => {
    request = { url, options };
    return json(200, { reply: "  Nzuri, asante.  " });
  } });
  assert.equal(reply, "Nzuri, asante.");
  assert.equal(request.url, basic.endpoint);
  assert.equal(request.options.headers.Authorization, "Bearer session-token");
  assert.equal(request.options.redirect, "error");
  assert.equal(request.options.credentials, "omit");
  assert.equal(request.options.headers["Cache-Control"], "no-store");
  const payload = JSON.parse(request.options.body);
  assert.deepEqual(Object.keys(payload).sort(), ["language", "messages"]);
  assert.equal(payload.messages.length, 11);
  assert.deepEqual(payload.messages[0], { role: "user", content: "Question 3" });
  assert.deepEqual(payload.messages.at(-1), { role: "user", content: "Habari?" });
  assert.ok(!request.options.body.includes("session-token"));
});

test("chat handles service failures without displaying raw server data", async () => {
  for (const [status, code] of [[401, "authentication"], [403, "authentication"], [429, "rate-limit"], [503, "unavailable"], [500, "response"]]) {
    await assert.rejects(client.requestChatReply({ ...basic, fetcher: async () => json(status, { error: "internal secret" }) }), errorCode(code));
  }
  for (const body of [{ reply: "" }, { reply: 5 }, { reply: "x".repeat(4001) }, { unexpected: true }]) {
    await assert.rejects(client.requestChatReply({ ...basic, fetcher: async () => json(200, body) }), errorCode("response"));
  }
  await assert.rejects(client.requestChatReply({ ...basic, fetcher: async () => { throw new Error("internal secret"); } }), errorCode("network"));
  assert.ok(!client.chatErrorMessage(new Error("internal secret")).includes("internal secret"));
});

test("bundled chat route stays disabled even if a provider key exists", async () => {
  const originalFetch = global.fetch;
  const oldKey = process.env.OPENAI_API_KEY;
  let calls = 0;
  global.fetch = async () => { calls += 1; throw new Error("must not contact a provider"); };
  process.env.OPENAI_API_KEY = "test-only-placeholder";
  try {
    const response = await chatRoute.POST();
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), { error: "AI chat is not connected yet." });
    assert.equal(calls, 0);
  } finally {
    global.fetch = originalFetch;
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = oldKey;
  }
});

test("an unconfigured chat keeps a draft and never pretends to answer", async () => {
  const fixture = conversationFixture({ endpoint: null, isLoaded: true, isSignedIn: false, userId: null, getToken: async () => { throw new Error("must not be called"); } });
  let chat = fixture.render();
  chat.changeDraft("Habari?");
  chat = fixture.render();
  await chat.send();
  chat = fixture.render();
  assert.equal(chat.draft, "Habari?");
  assert.deepEqual(chat.messages, []);
  assert.match(chat.error, /isn't connected yet/);
  assert.equal(chat.status, "AI connection needed");
  fixture.harness.cleanup();
});

test("a successful authenticated reply cannot be double-submitted", async () => {
  const reply = deferred();
  const originalFetch = global.fetch;
  let calls = 0;
  global.fetch = async () => { calls += 1; return reply.promise; };
  const fixture = conversationFixture({ endpoint: basic.endpoint, isLoaded: true, isSignedIn: true, userId: "learner", getToken: async () => "session-token" });
  try {
    let chat = fixture.render();
    chat.changeDraft("Habari?");
    chat = fixture.render();
    const first = chat.send();
    const second = chat.send();
    await Promise.resolve();
    assert.equal(calls, 1);
    chat = fixture.render();
    assert.equal(chat.sending, true);
    assert.deepEqual(chat.messages, [{ role: "user", content: "Habari?" }]);
    reply.resolve(json(200, { reply: "Nzuri, asante." }));
    await Promise.all([first, second]);
    chat = fixture.render();
    assert.equal(chat.sending, false);
    assert.equal(chat.status, "Connected");
    assert.deepEqual(chat.messages, [{ role: "user", content: "Habari?" }, { role: "assistant", content: "Nzuri, asante." }]);
  } finally {
    fixture.harness.cleanup();
    global.fetch = originalFetch;
  }
});

test("failed or timed-out requests restore the draft, and a course change prevents a stale send", async (t) => {
  const originalFetch = global.fetch;
  let calls = 0;
  global.fetch = async () => { calls += 1; return json(503, { error: "not configured" }); };
  const connection = { endpoint: basic.endpoint, isLoaded: true, isSignedIn: true, userId: "learner", getToken: async () => "session-token" };
  const fixture = conversationFixture(connection);
  try {
    let chat = fixture.render();
    chat.changeDraft("Habari?");
    chat = fixture.render();
    await chat.send();
    chat = fixture.render();
    assert.equal(chat.draft, "Habari?");
    assert.deepEqual(chat.messages, []);
    assert.match(chat.error, /isn't connected yet/);
    assert.equal(calls, 1);
    fixture.harness.cleanup();

    t.mock.timers.enable({ apis: ["setTimeout"] });
    const token = deferred();
    const slow = conversationFixture({ ...connection, getToken: () => token.promise });
    chat = slow.render();
    chat.changeDraft("Please help");
    chat = slow.render();
    const pending = chat.send();
    t.mock.timers.tick(25_000);
    chat = slow.render();
    assert.equal(chat.draft, "Please help");
    assert.equal(chat.sending, false);
    assert.match(chat.error, /took too long/);
    token.resolve("session-token");
    await pending;
    assert.equal(calls, 1, "late token must not send after a timeout");
    slow.harness.cleanup();

    const changingToken = deferred();
    const changing = conversationFixture({ ...connection, getToken: () => changingToken.promise });
    chat = changing.render();
    chat.changeDraft("Old course");
    chat = changing.render();
    const oldRequest = chat.send();
    changing.render("fr");
    changingToken.resolve("session-token");
    await oldRequest;
    chat = changing.render("fr");
    assert.equal(calls, 1, "course change must cancel the old request");
    assert.equal(chat.draft, "");
    assert.deepEqual(chat.messages, []);
    changing.harness.cleanup();
  } finally {
    fixture.harness.cleanup();
    global.fetch = originalFetch;
  }
});

test("chat screen exposes a private, honest composer and starter prompts", () => {
  const harness = hookHarness();
  const actions = [];
  const chat = {
    messages: [], draft: "", error: null, sending: false, status: "AI connection needed",
    changeDraft: (value) => actions.push(["draft", value]), send: () => actions.push(["send"]), clear: () => actions.push(["clear"]),
  };
  let keyboardVisible = false;
  let height = 800;
  const native = {
    Image: "Image", Keyboard: { dismiss: () => actions.push(["dismiss-keyboard"]) },
    KeyboardAvoidingView: "KeyboardAvoidingView", ScrollView: "ScrollView", Text: "Text",
    TextInput: "TextInput", TouchableOpacity: "TouchableOpacity", View: "View", Platform: { OS: "web" },
    useWindowDimensions: () => ({ width: 400, height }),
    StyleSheet: { create: (styles) => styles },
  };
  const jsx = { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
  const { default: Screen } = load("../app/(tabs)/chat.tsx", {
    react: harness.react, "react/jsx-runtime": jsx, "react-native": native,
    "react-native-safe-area-context": { SafeAreaView: "SafeAreaView" },
    "@expo/vector-icons": { Ionicons: "Ionicons" }, "expo-router": { router: { push: (route) => actions.push(["route", route]) } },
    "@/components/MotionSticker": { MotionSticker: "MotionSticker" },
    "@/constants/images": { images: { mascotParrot: 1 } },
    "@/data/languages": { LANGUAGES: [{ code: "sw", name: "Kiswahili", flag: 2 }] },
    "@/hooks/useChatConversation": { useChatConversation: () => chat },
    "@/hooks/useKeyboardVisible": { useKeyboardVisible: () => keyboardVisible },
    "@/store/languageStore": { useLanguageStore: (select) => select({ selectedLanguage: "sw" }) },
  });
  let tree = harness.render(Screen);
  assert.equal(tree.props["ph-no-capture"], true);
  assert.equal(tree.props.accessibilityLabel, "ph-no-capture");
  assert.equal(byId(tree, "chat-connection-status").props.children, "AI connection needed");
  assert.equal(find(tree, (element) => element.type === "KeyboardAvoidingView").props.behavior, undefined);
  for (const platform of ["android", "ios"]) {
    native.Platform.OS = platform;
    tree = harness.render(Screen);
    assert.equal(find(tree, (element) => element.type === "KeyboardAvoidingView").props.behavior, "padding",
      `${platform} must keep the composer above the native keyboard`);
  }
  native.Platform.OS = "web";
  tree = harness.render(Screen);
  assert.equal(byId(tree, "chat-send-button").props.disabled, true);
  const prompt = find(tree, (element) => element.props?.accessibilityLabel === "Use prompt: Teach me a Kiswahili greeting");
  prompt.props.onPress();
  assert.deepEqual(actions.pop(), ["draft", "Teach me a Kiswahili greeting"]);
  chat.draft = "Habari?";
  tree = harness.render(Screen);
  assert.equal(byId(tree, "chat-send-button").props.disabled, false);
  assert.equal(find(tree, (element) => element.props?.accessibilityLabel === "Use prompt: Teach me a Kiswahili greeting"), undefined,
    "starter prompts cannot overwrite a draft");
  byId(tree, "chat-send-button").props.onPress();
  assert.deepEqual(actions.pop(), ["send"]);

  byId(tree, "chat-course-button").props.onPress();
  assert.deepEqual(actions.pop(), ["dismiss-keyboard"]);
  tree = harness.render(Screen);
  assert.ok(byId(tree, "chat-confirm-course"), "course changes warn before losing a draft");
  byId(tree, "chat-confirm-course").props.onPress();
  assert.deepEqual(actions.pop(), ["route", "/language-select"]);

  tree = harness.render(Screen);
  byId(tree, "chat-clear-button").props.onPress();
  assert.deepEqual(actions.pop(), ["dismiss-keyboard"]);
  tree = harness.render(Screen);
  byId(tree, "chat-confirm-clear").props.onPress();
  assert.deepEqual(actions.pop(), ["clear"]);

  keyboardVisible = true;
  tree = harness.render(Screen);
  assert.ok(byId(tree, "chat-message-input"));
  assert.ok(byId(tree, "chat-course-button"), "course remains accessible in compact mode");
  assert.equal(find(tree, (element) => element.props?.children === "YOUR PRACTICE SPACE"), undefined);
  keyboardVisible = false;
  height = 400;
  tree = harness.render(Screen);
  assert.ok(byId(tree, "chat-message-input"), "short windows use the compact composer too");
  assert.equal(find(tree, (element) => element.props?.children === "YOUR PRACTICE SPACE"), undefined);
  harness.cleanup();
});

test("account changes and clear cancel requests without showing late replies", async () => {
  const originalFetch = global.fetch;
  const response = deferred();
  let requestSignal;
  global.fetch = async (_url, options) => { requestSignal = options.signal; return response.promise; };
  const connection = { endpoint: basic.endpoint, isLoaded: true, isSignedIn: true, userId: "first-account", getToken: async () => "session-token" };
  const fixture = conversationFixture(connection);
  try {
    let chat = fixture.render();
    chat.changeDraft("Private to the first account");
    chat = fixture.render();
    const pending = chat.send();
    await Promise.resolve();
    assert.equal(requestSignal.aborted, false);
    connection.userId = "second-account";
    fixture.render();
    assert.equal(requestSignal.aborted, true);
    response.resolve(json(200, { reply: "A stale response" }));
    await pending;
    chat = fixture.render();
    assert.deepEqual(chat.messages, []);
    assert.equal(chat.draft, "");
    assert.equal(chat.sending, false);

    const lateToken = deferred();
    connection.getToken = () => lateToken.promise;
    chat.changeDraft("Discard this draft");
    chat = fixture.render();
    const canceled = chat.send();
    chat.clear();
    lateToken.resolve("session-token");
    await canceled;
    chat = fixture.render();
    assert.deepEqual(chat.messages, []);
    assert.equal(chat.draft, "");
    assert.equal(chat.error, null);
  } finally {
    fixture.harness.cleanup();
    global.fetch = originalFetch;
  }
});

test("keyboard visibility follows native events and removes listeners", () => {
  for (const [os, show, hide] of [["android", "keyboardDidShow", "keyboardDidHide"], ["ios", "keyboardWillShow", "keyboardWillHide"]]) {
    const harness = hookHarness();
    const listeners = new Map();
    const removed = [];
    const keyboard = {
      isVisible: () => false,
      addListener: (event, listener) => {
        listeners.set(event, listener);
        return { remove: () => removed.push(event) };
      },
    };
    const { useKeyboardVisible } = load("../hooks/useKeyboardVisible.ts", {
      react: harness.react, "react-native": { Keyboard: keyboard, Platform: { OS: os } },
    });
    assert.equal(harness.render(useKeyboardVisible), false);
    listeners.get(show)();
    assert.equal(harness.render(useKeyboardVisible), true);
    listeners.get(hide)();
    assert.equal(harness.render(useKeyboardVisible), false);
    harness.cleanup();
    assert.deepEqual(removed.sort(), [show, hide].sort());
  }
});

test("custom tab bar gives the chat keyboard room without hiding other tabs", () => {
  const harness = hookHarness();
  let keyboardVisible = true;
  const native = {
    StyleSheet: { create: (styles) => styles }, Text: "Text", TouchableOpacity: "TouchableOpacity", View: "View",
    useWindowDimensions: () => ({ width: 400 }),
  };
  const jsx = { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
  const { TabBar } = load("../components/TabBar.tsx", {
    react: harness.react, "react/jsx-runtime": jsx, "react-native": native,
    "react-native-reanimated": {
      default: { View: "AnimatedView" },
      useAnimatedStyle: (factory) => factory(), useSharedValue: (value) => ({ value }), withSpring: (value) => value,
    },
    "react-native-safe-area-context": { useSafeAreaInsets: () => ({ bottom: 0 }) },
    "@expo/vector-icons": { Ionicons: "Ionicons" },
    "@/hooks/useKeyboardVisible": { useKeyboardVisible: () => keyboardVisible },
    "@/hooks/useReducedMotionPreference": { useReducedMotionPreference: () => true },
  });
  const props = {
    state: { index: 3, routes: ["index", "learn", "ai-teacher", "chat", "profile"].map((name) => ({ key: name, name })) },
    navigation: { emit: () => ({}), navigate: () => {} },
  };
  assert.equal(harness.render(TabBar, props), null);
  keyboardVisible = false;
  assert.ok(harness.render(TabBar, props), "bar returns when the keyboard closes");
  keyboardVisible = true;
  props.state.index = 0;
  assert.ok(harness.render(TabBar, props), "other screens keep their existing tab behavior");
  harness.cleanup();
});

test("production analytics disables touch capture on chat and keeps session replay off", () => {
  const oldDev = global.__DEV__;
  const oldKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const oldFontLoader = require.extensions[".ttf"];
  require.extensions[".ttf"] = (module) => { module.exports = 1; };
  global.__DEV__ = false;
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY = "test-publishable-key";
  try {
    let replayOptions;
    class FakePostHog { constructor(_key, options) { replayOptions = options; } }
    load("../lib/posthog.ts", {
      "posthog-react-native": { default: FakePostHog },
      "expo-constants": { default: { expoConfig: { extra: { posthogProjectToken: "test-project-token" } } } },
    });
    assert.equal(replayOptions.enableSessionReplay, false);

    const harness = hookHarness();
    let pathname = "/chat";
    const jsx = { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
    const Stack = { Screen: "StackScreen" };
    const { default: RootLayout } = load("../app/_layout.tsx", {
      "../global.css": {},
      "../assets/fonts/Poppins-Regular.ttf": 1, "../assets/fonts/Poppins-Medium.ttf": 2,
      "../assets/fonts/Poppins-SemiBold.ttf": 3, "../assets/fonts/Poppins-Bold.ttf": 4,
      "@/components/LaunchSplash": { LaunchGate: "LaunchGate" },
      "@/components/LearningHydrationScreen": { LearningHydrationScreen: "LearningHydrationScreen" },
      "@/components/PendingSaveBanner": { PendingSaveBanner: "PendingSaveBanner" },
      "@/lib/posthog": { posthog: { screen: () => {}, identify: () => {} } },
      "@/store/languageStore": { useLanguageHydrationStatus: (select) => select({ status: "ready" }), useLanguageStore: () => ({}) },
      "@clerk/expo": { ClerkProvider: "ClerkProvider" }, "@clerk/expo/token-cache": { tokenCache: {} },
      "expo-font": { useFonts: () => [true, null] },
      "expo-router": { Stack, usePathname: () => pathname, useGlobalSearchParams: () => ({}) },
      "expo-splash-screen": { preventAutoHideAsync: () => {} },
      "posthog-react-native": { PostHogProvider: "PostHogProvider" },
      react: harness.react, "react/jsx-runtime": jsx, "react-native": { View: "View" },
      "react-native-safe-area-context": { SafeAreaProvider: "SafeAreaProvider" },
    });
    assert.equal(harness.render(RootLayout).props.autocapture.captureTouches, false);
    pathname = "/chat/";
    assert.equal(harness.render(RootLayout).props.autocapture.captureTouches, false);
    pathname = "/learn";
    assert.equal(harness.render(RootLayout).props.autocapture.captureTouches, true);
    harness.cleanup();
  } finally {
    if (oldDev === undefined) delete global.__DEV__;
    else global.__DEV__ = oldDev;
    if (oldKey === undefined) delete process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
    else process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY = oldKey;
    if (oldFontLoader === undefined) delete require.extensions[".ttf"];
    else require.extensions[".ttf"] = oldFontLoader;
  }
});
