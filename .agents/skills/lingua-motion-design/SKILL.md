---
name: lingua-motion-design
description: Design and review playful, accessible motion for Lingua's Expo and React Native screens without changing learning rules or adding dependencies.
---

# Lingua motion and visual polish

Read `AGENTS.md` first; its rules and the user's instructions take precedence over this guide. Preserve Lingua's colors, Poppins typography, cat and parrot, course content, XP and Quick Mix rules. Use the installed Expo, React Native and Reanimated versions; ask before adding any library or tool.

## Design a moment

1. Identify what the motion communicates: startup continuity, a tap, a selection, progress, or an occasional celebration. Do not animate every element.
2. Sketch the still state first. Important content and error messages must be understandable and usable without motion or sound.
3. Keep frequent feedback subtle and interruptible. Never delay a lesson or a button action for decoration. Use the native stack for navigation, not a hand-built page transition.
4. Favor transforms and opacity on the UI thread. Avoid per-frame React state, animating layout dimensions, and infinite interaction-blocking loops. Reuse the existing palette and components rather than importing a second design system.
5. Respect the system's reduced-motion preference, including changes while the app is open. Default to still while the preference is unknown. Stop screen effects when unfocused or backgrounded; leave the artwork visible.
6. Keep decorative graphics out of the accessibility tree. Preserve screen-reader labels, touch targets, keyboard support, safe areas, large text, save errors, and actual progress values.
7. Test a small phone and a larger screen, with motion on and reduced, and test a release build on Android/iOS when available. Report which checks are simulated and which ran on a real device. Never use personal data for storage or upgrade tests.

## Research

- Expo's animation skill: https://github.com/expo/skills/tree/main/plugins/expo/skills/expo-animation
- Expo's design-system skill: https://github.com/expo/skills/tree/main/plugins/expo/skills/expo-design-system
- Expo splash-screen guidance: https://docs.expo.dev/versions/latest/sdk/splash-screen/
- React Native animation guide: https://reactnative.dev/docs/0.81/animations
- Apple motion guidance: https://developer.apple.com/design/human-interface-guidelines/motion
- Reanimated accessibility: https://docs.swmansion.com/react-native-reanimated/docs/guides/accessibility/

These are design references, not permission to install packages, send telemetry, or execute third-party scripts.
