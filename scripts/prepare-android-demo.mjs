import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, ".expo", "android-demo");
const demo = join(root, "demo", "android");

// Fail rather than silently create a broken preview if the source changes.
function replaceOnce(file, before, after) {
  const path = join(output, file);
  const text = readFileSync(path, "utf8");
  if (text.split(before).length !== 2) {
    throw new Error(`Expected exactly one match in ${file}: ${before.slice(0, 80)}`);
  }
  writeFileSync(path, text.replace(before, after));
}

if (!existsSync(join(root, "node_modules", "expo"))) {
  throw new Error("Install the repository dependencies before preparing the demo.");
}

// Copy only public UI source and assets; never copy .env files or backend code.
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
for (const name of [
  "app", "assets", "components", "constants", "data", "lib", "store", "types",
  "babel.config.js", "global.css", "postcss.config.mjs", "tsconfig.json",
  "nativewind-env.d.ts",
]) {
  cpSync(join(root, name), join(output, name), { recursive: true });
}
rmSync(join(output, "app", "(auth)"), { recursive: true, force: true });
rmSync(join(output, "app", "api"), { recursive: true, force: true });
cpSync(join(demo, "overrides"), output, { recursive: true });
cpSync(join(demo, "app.config.js"), join(output, "app.config.js"));
cpSync(join(demo, "metro.config.js"), join(output, "metro.config.js"));
mkdirSync(join(output, "demo"));
cpSync(join(demo, "flags.ts"), join(output, "demo", "flags.ts"));
symlinkSync(join(root, "node_modules"), join(output, "node_modules"), "dir");

// These services are deliberately absent from the native demo and autolinking.
const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
for (const name of [
  "@clerk/expo", "@config-plugins/react-native-webrtc",
  "@stream-io/react-native-webrtc", "@stream-io/video-react-native-sdk",
  "posthog-react-native",
]) delete manifest.dependencies[name];
manifest.name = "lingua-android-demo";
writeFileSync(join(output, "package.json"), `${JSON.stringify(manifest, null, 2)}\n`);

// Keep the original UI, but make the demo entry and sample navigation local.
replaceOnce("app/onboarding.tsx", 'import { posthog } from "@/lib/posthog";\n', "");
replaceOnce(
  "app/onboarding.tsx",
  'Real conversations, personalized lessons, anytime, anywhere.',
  'Muonekano wa app ya kujifunza lugha.',
);
replaceOnce(
  "app/onboarding.tsx",
  '            posthog.capture("onboarding_get_started_tapped");\n            router.push("/(auth)/sign-up");',
  '            router.push("/language-select");',
);
replaceOnce("app/onboarding.tsx", "            Get Started\n", "            Jaribu demo\n");

replaceOnce(
  "app/(tabs)/index.tsx",
  'import { useAuth, useUser } from "@clerk/expo";',
  'import { router } from "expo-router";',
);
replaceOnce(
  "app/(tabs)/index.tsx",
  '  const { user } = useUser();\n  const { signOut } = useAuth();\n  const { selectedLanguage } = useLanguageStore();',
  '  const { selectedLanguage, clearSelectedLanguage } = useLanguageStore();\n  const signOut = () => {\n    clearSelectedLanguage();\n    router.replace("/");\n  };',
);
replaceOnce('app/(tabs)/index.tsx', '  const firstName = user?.firstName ?? "Learner";', '  const firstName = "Learner";');
replaceOnce(
  "app/(tabs)/index.tsx",
  '                  streak,\n                });',
  '                  streak,\n                });\n                router.navigate("/(tabs)/learn");',
);

// Avoid remote thumbnail and flag hosts so visual assets work offline.
replaceOnce("components/LessonCard.tsx", 'import { colors } from "@/constants/theme";', 'import { colors } from "@/constants/theme";\nimport { images } from "@/constants/images";');
replaceOnce("components/LessonCard.tsx", 'function getLessonThumbnail(lessonId: string): string {\n  return `https://picsum.photos/seed/${lessonId}/160/100`;\n}\n\n', "");
replaceOnce("components/LessonCard.tsx", 'source={{ uri: getLessonThumbnail(lesson.id) }}', 'source={images.palace}');
replaceOnce("data/languages.ts", 'import { Language } from "@/types/learning";', 'import { Language } from "@/types/learning";\nimport { demoFlags } from "@/demo/flags";');
for (const [code, country] of [["es", "es"], ["fr", "fr"], ["ja", "jp"], ["de", "de"]]) {
  replaceOnce("data/languages.ts", `"https://flagcdn.com/w320/${country}.png"`, `demoFlags.${code}`);
}

console.log(`Prepared standalone Android demo in ${output}`);
