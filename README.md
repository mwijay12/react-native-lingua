<div align="center">
  <br />
    <img src="assets/images/icon.png" alt="Lingua logo" width="128">
  <br />

  <div>
<img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
<img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white" />
<img src="https://img.shields.io/badge/NativeWind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
<img src="https://img.shields.io/badge/Zustand-443E38?style=for-the-badge&logo=react&logoColor=white" />
<br />
<img src="https://img.shields.io/badge/Clerk-6C47FF?style=for-the-badge&logo=clerk&logoColor=white" />
<img src="https://img.shields.io/badge/Stream-005FFF?style=for-the-badge&logo=getstream&logoColor=white" />
<img src="https://img.shields.io/badge/PostHog-8B4513?style=for-the-badge&logo=posthog&logoColor=white" />
<img src="https://img.shields.io/badge/CodeRabbit-FF6600?style=for-the-badge&logo=coderabbit&logoColor=white" />

  </div>

  <h3 align="center">Lingua | Language for life</h3>

   <div align="center">
     Created by Mwijay. Adapted from a <a href="https://www.youtube.com/watch?v=XUkNR-JfHwo" target="_blank"><b>JavaScript Mastery tutorial</b></a>.
    </div>
</div>

## 📋 <a name="table">Table of Contents</a>

1. ✨ [Introduction](#introduction)
2. ⚙️ [Tech Stack](#tech-stack)
3. 🔋 [Features](#features)
4. 🤸 [Quick Start](#quick-start)
5. 🔗 [Assets](#links)
6. 🚀 [More](#more)

## 🚨 Tutorial

This repository contains the code corresponding to an in-depth tutorial available on our YouTube channel, <a href="https://www.youtube.com/@javascriptmastery/videos" target="_blank"><b>JavaScript Mastery</b></a>.

If you prefer visual learning, this is the perfect resource for you. Follow our tutorial to learn how to build projects like these step-by-step in a beginner-friendly manner!

<a href="https://youtu.be/Q7AYc2kECDI" target="_blank"><img src="https://github.com/sujatagunale/EasyRead/assets/151519281/1736fca5-a031-4854-8c09-bc110e3bc16d" /></a>

## Current starter version

Created by Mwijay. This version provides beginner Kiswahili, English and French
courses with English instructions, local practice questions, and on-device XP
and lesson progress. The 39 playable lessons cover everyday topics, useful
language patterns, travel, days of the week and making plans. Each course has
two days-and-plans lessons; together they add 44 questions with examples and
answer explanations. Every lesson includes context notes. Lingua's cat and
parrot companions, original SVG doodles and five illustrated unit scenes make
the learning path more playful. The standalone [Android demo](demo/android/README.md)
has no sign-in or analytics.

Lingua's native splash hands off to a short, skippable branded introduction
once the React view is laid out. Navigation mounts after the introduction has
gone, while storage hydration continues independently; the introduction does
not wait for storage or a network. Reduced motion skips the animation, and a
timeout prevents it from blocking startup if an animation callback does not
arrive. The launch design should be checked in a release build, because Expo Go
does not reproduce the native splash exactly.

The welcome companions make a small, one-time greeting after the splash. Button
presses, answer selections and changes in the daily-goal and Quick Mix progress
have subtle feedback without changing learning or scoring. Progress is announced
at its real value immediately. The doodles in `components/LearningSticker.tsx`
are original, hand-drawn shapes in Lingua's palette. `MotionSticker` keeps
decoration in reserved space, never intercepts touches, and makes one gentle
drift only while its screen is focused and the app is active. Device
reduced-motion settings keep the artwork still (including the tab indicator);
artwork and learning content remain visible. Correct-answer panels have a small
one-shot emphasis. The selected cat and parrot remain the existing image assets.

The project-specific [motion-design skill](.agents/skills/lingua-motion-design/SKILL.md)
combines the existing native UI guidance with research from
[Expo](https://github.com/expo/skills/tree/main/plugins/expo/skills/expo-animation),
[Apple](https://developer.apple.com/design/human-interface-guidelines/motion) and
the [motion-lab prompt pack](https://github.com/mwijay12/motion-lab/blob/main/motion-lab/docs/agent-prompt-pack.md).
It adds no app dependency or remote service.

Fifteen short, generated pronunciation samples cover the greeting lesson, both
travel lessons and both days-and-plans lessons in each language. Tap **Play
sample** to hear the selected words and phrases in the on-screen transcript;
tap **Stop** or leave the lesson to stop. The controls wrap on narrow screens or
when text is enlarged. Other lessons still use written, approximate pronunciation
guides. The generated recordings have not been human-reviewed and are learning
aids, not a substitute for feedback from a fluent speaker; pronunciations and
accents can vary. The installed native app bundles the audio for offline
playback; the web build must first load its assets from its host.

Short, original feedback chimes play after correct answers and completed lesson,
review or Quick Mix sessions. They are on by default and can be muted using the
speaker in those screens or **Profile → Listening preferences**. This setting
is stored separately from study and play progress; it does not mute the
explicitly tapped pronunciation samples. Audio playback never records speech or
starts an AI service. The Android configuration removes microphone permission
from this playback-only build, and the demo build checks the final APK.

The study dashboard has a configurable daily session goal, a rolling seven-day
activity view and per-course completion. A finished lesson or review set counts
as a session, including lesson replays; only a first lesson completion awards
XP. Missed lesson questions are added to an on-device review list for the
selected course. A correct answer in review clears a question, while a missed
answer stays for another set. Review awards no XP. Supported older progress is
retained on upgrade, but old completions are not assigned fictional study
dates. The additional lessons change the course-completion denominator, so a
previously complete course may show a lower percentage. Goals and history use
the device's local calendar and do not sync.

Learning and course changes are saved locally after storage acknowledges the
write. While a save is pending or has failed, Lingua displays its status; if
it fails, keep the app open and retry the current snapshot. Closing the app
before a successful save can lose recent changes. A course selection waits for
its save before continuing. If progress or a course cannot be read, has an
unexpected format, or belongs to a newer version, Lingua does not replace it
with defaults. The same safeguards cover Quick Mix reward counters and the
sound-effects preference without changing their rules. Pending or failed saves
remain visible when leaving those screens, with a retry after failure. Retry or
reopen the newer version as appropriate; uninstalling can remove local data.
Supported older migrations keep earned XP and lesson IDs without inventing study
dates. Progress is not synced or backed up to an account.

AsyncStorage 2.2.0 has a version-checked local native safety patch in
`patches/async-storage-2.2.0.patch`. It avoids destructive Android database
recovery and iOS manifest replacement, and blocks ambiguous legacy storage
rather than guessing or deleting it. This is not a backup or a guarantee against
all corruption, device failure or uninstall. Android Expo scoped databases and
ambiguous iOS legacy locations are preserved but require a future, verified
recovery path. Do not clear app data as a workaround.

`npm install` applies the patch via `postinstall`; Expo prebuild also verifies
and applies it. If install scripts are disabled, run `npm run harden-storage`
after `npm ci` and before any direct native build. The patch requires Git and
fails on an unknown or modified AsyncStorage version rather than silently
building an unreviewed backend. Rebuild the native app after applying it; Expo Go
or an already-built binary still uses its original native storage implementation.
The iOS patch has not yet been validated on a real iOS device.

The dashboard's **Quick Mix** offers an untimed round of up to three shuffled
multiple-choice questions from completed lessons in the current course. New
learners can preview the first playable lesson. Round stars are just for fun:
playing does not change XP, daily sessions or the missed-question review list,
and an unfinished round is not saved. The sticker book celebrates lesson,
course, review and mix milestones across courses. Mix rewards use separate
on-device storage; if rewards cannot be read or saved, the app offers a retry
without resetting existing study progress.

**AI voice and live chat are not enabled yet.** Chat now has a message composer,
course-specific starter prompts and clear connection/error states; it never
pretends that a local example is an AI reply. A draft stays on screen if a send
fails. Conversations are kept only in memory and clear when the account or
course changes, or the app closes. Avoid sharing sensitive information.

The chat client accepts an optional `EXPO_PUBLIC_CHAT_API_URL` for **your own**
HTTPS backend (or `/api/chat` on a same-origin web host). It sends a Clerk
session token and a bounded recent conversation, never a provider key. The chat
view is marked for PostHog exclusion, touch autocapture is disabled while chat
is active, and native session replay is explicitly disabled. Verify privacy on
each deployed platform before using real conversations. The bundled chat route
intentionally returns 503, even if a provider key exists; setting a URL or key
alone does not enable AI. Never put provider or Clerk secret keys in the app,
an `EXPO_PUBLIC_` variable, Git, or a chat message.

A future backend should implement this small, provider-neutral contract:

- Accept `POST` JSON with `language` (`sw`, `en`, or `fr`) and `messages` (up
  to 11 alternating `{ "role": "user" | "assistant", "content": "..." }`
  entries, ending with a user message). User messages are at most 1,200
  characters; assistant messages are at most 4,000.
- Verify the `Authorization: Bearer <Clerk session token>` on the server,
  independently validate all input and limits, and return a successful reply
  as `{ "reply": "..." }` (at most 4,000 characters). Select tutor instructions
  on the server and treat all client-supplied history as untrusted. Responses
  should use `Cache-Control: no-store`; the client requests the final HTTPS
  endpoint without cookies or redirects.
- Enforce per-user rate and spending limits; handle privacy and provider
  retention; and keep provider credentials in server-side secrets. If a web
  client uses a different origin, configure CORS for the trusted app origin and
  its `Authorization`, `Content-Type`, and `Cache-Control` request headers.
  Return 401/403 for authentication, 429 for rate limiting and 503 when the
  service is unavailable; the client displays safe, generic error messages.

The agent-session and Stream-token routes also return 503. Voice must not be
enabled until authentication, call ownership, rate limiting, token validation
and agent deployment have been secured and reviewed. Any previously deployed
backend is unaffected by these source changes and must be disabled or secured
separately.

## <a name="introduction">✨ Introduction</a>

This is an Expo and React Native language-learning project based on the original
tutorial below. The current starter build focuses on local lessons with selected
recorded pronunciation samples; real-time AI teaching remains future work.

If you're getting started and need assistance or face any bugs, join our active Discord community with over **50k+** members. It's a place where people help each other out.

<a href="https://discord.com/invite/n6EdbFJ" target="_blank"><img src="https://github.com/sujatagunale/EasyRead/assets/151519281/618f4872-1e10-42da-8213-1d69e486d02e" /></a>

## <a name="tech-stack">⚙️ Tech Stack</a>

- **[React Native](https://reactnative.dev/)** is an open-source framework for building native mobile applications using React. It allows developers to use a single codebase for both iOS and Android by rendering with native UI components for high performance.

- **[Expo](https://expo.dev/)** is an open-source platform and framework for universal React applications. It provides a set of tools and services that simplify the development, building, and deployment process, allowing for rapid iteration and seamless access to native device APIs.

- **[TypeScript](https://www.typescriptlang.org/)** is a strongly typed programming language that builds on JavaScript, providing static types to catch errors early and improving the developer experience with robust autocompletion and refactoring tools.

- **[NativeWind](https://www.nativewind.dev/)** uses Tailwind CSS as a scripting engine to create a universal styling system for React Native. It allows you to style mobile components using familiar utility classes, ensuring consistent design and rapid UI development.

- **[Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction)** is a small, fast, and scalable state-management solution. It provides a simple API based on hooks, making it easy to manage global application state without the boilerplate or complexity of other libraries.

- **[Clerk](https://jsm.dev/lingua-clerk)** is a complete user management and authentication solution. It offers pre-built components for sign-in, sign-up, and user profiles, along with secure social login integration and multi-factor authentication out of the box.

- **[Stream](https://jsm.dev/lingua-stream)** provides real-time audio infrastructure for AI-driven voice interactions. It enables the app to hear, see, and act in real-time, powering the conversational AI teacher with low-latency communication.

- **[PostHog](https://jsm.dev/lingua-posthog)** is an all-in-one product analytics platform. It helps developers understand user behavior, track key events within the app, and utilize session recordings to improve product-market fit and user engagement.

- **[CodeRabbit](https://jsm.dev/lingua-coderabbit)** is an AI-powered code review platform that integrates into your CI/CD pipeline. It automatically reviews pull requests to identify bugs and suggest improvements, acting as a persistent reviewer for every AI-generated code change.

## <a name="features">🔋 Features</a>

👉 **Onboarding**: Choose Kiswahili, English or French with English instructions. The demo runs locally without signing in.

👉 **Study tools**: Set a daily session goal, view recent activity and course progress, and review questions you missed. Progress stays on this device.

👉 **Play and collect**: Try a short Quick Mix and collect milestone stickers without changing study XP or review.

👉 **Accounts**: The tutorial source includes Clerk integration; sign-in is deliberately disabled in the standalone Android demo.

👉 **AI Teacher and Chat (planned)**: Live voice and AI replies are currently disabled. Chat has a composer and starter prompts ready for a secure backend; lessons remain available offline.

👉 **Lesson Interface**: A core learning engine built with **React Native**, **Expo**, and **TypeScript**, using **NativeWind** to maintain a polished UI that survives contact with serious features.

👉 **State Management**: Clean and scalable app logic handled by **Zustand**, ensuring your "Practical Vibe Coding" workflow stays structured without getting lost in spaghetti code.

👉 **Tutorial integrations**: PostHog and CodeRabbit appear in the original project setup. The standalone demo does not collect analytics.

And many more, including code architecture and reusability.

## <a name="quick-start">🤸 Quick Start</a>

Follow these steps to set up the project locally on your machine.

**Prerequisites**

Make sure you have the following installed on your machine:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/en)
- [npm](https://www.npmjs.com/) (Node Package Manager)

**Cloning the Repository**

```bash
git clone https://github.com/adrianhajdin/react-native-lingua.git
cd react-native-lingua
```

## Installation

Before you begin developing your app, it's essential to set up Expo and initialize your project.

- Start by creating a folder for your application. Then, open your terminal and navigate to that folder. To create an Expo app, you can use:

```bash
npx create-expo-app@latest
```

By default, you get a TypeScript Expo app with Expo Router configured.

If you want a different starter (blank JS, blank TS, tabs, etc.), you can run:

```bash
npx create-expo-app@latest --template
```

And pick whichever template fits your workflow.

Since this repository is already created, install dependencies and start the development server:

```bash
npm ci --legacy-peer-deps --ignore-scripts --no-audit --no-fund
npm run lint && npm run typecheck && npm test
npx expo start
```

The main source requires a configured Clerk publishable key; the separate
[Android demo](demo/android/README.md) intentionally does not. `npx expo start`
starts Metro Bundler, which compiles and serves your React Native code.

Once it starts, you'll see a QR code and shortcut keys in the terminal. For example:

- `a` opens Android
- `i` opens iOS Simulator (macOS)
- `w` opens web
- `r` reloads
- `m` opens dev menu in Expo Go / device context

We don't need to rely on heavy IDE tooling to begin. The easiest flow is using Expo Go on your phone.

Expo Go is a mobile app that lets you test React Native apps quickly by scanning a QR code. It's fast, beginner-friendly, and supports real-time updates while you code.

Open Google Play Store or Apple App Store, install **Expo Go**, then come back here and scan the QR code.

### iOS VPN Turn OFF, and network permissions…

Now open Expo Go and scan the QR code from the terminal. The app should compile and launch.

With the main app's required environment configured, the project opens in Expo. The standalone demo uses local onboarding and does not require an account.

**Set Up Environment Variables**

Create a new file named `.env` in the root of your project and add the following content:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=
# Optional public URL of your own HTTPS backend; do not use a provider URL.
EXPO_PUBLIC_CHAT_API_URL=
POSTHOG_PROJECT_TOKEN=
POSTHOG_HOST=
STREAM_API_KEY=
```

These are client-visible settings; never place a secret in them. Configure any
AI provider key, Clerk secret key, or Stream secret only in the deployed
backend's secret manager, not in an app bundle or repository. The chat and voice
routes remain disabled until their server-side security and provider integration
are implemented and reviewed.

**Running the Project**

```bash
npx expo start
```

## <a name="links">🔗 Assets</a>

Assets and snippets used in the project can be found in the **[video kit](https://jsmastery.com/video-kit/042a469c-66fb-4922-9648-cbb1ca62d32e)**.

<a href="https://jsmastery.com/video-kit/042a469c-66fb-4922-9648-cbb1ca62d32e" target="_blank">
  <img src="public/readme/readme-videokit.webp" alt="Video Kit Banner">
</a>

## <a name="more">🚀 More</a>

**Advance your skills with our Pro Course**

Enjoyed creating this project? Dive deeper into our PRO courses for a richer learning adventure. They're packed with
detailed explanations, cool features, and exercises to boost your skills. Give it a go!

<a href="https://jsm.dev/lingua-jsm" target="_blank">
  <img src="public/readme/readme-jsmpro.webp" alt="Project Banner">
</a>
