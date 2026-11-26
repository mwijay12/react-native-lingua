# Lingua Android demo APK

This is a **test-only**, separately identified Android app. It includes beginner
courses in Kiswahili, English and French, English menus, offline vocabulary and
practice questions, including everyday topics, travel, days of the week and
making plans. There are 39 playable lessons: twelve each in Kiswahili and
English, and fifteen in French. Each course has two foundation lessons, two
travel lessons and two days-and-plans lessons with explanations, examples and
practice feedback. The six new lessons add 44 questions and 15 XP each.
Earlier lessons also include context notes. The app retains Lingua's
cat-and-parrot identity, with five illustrated scenes, original SVG doodles and
gentle motion. A short, skippable branded intro follows the native splash;
the welcome scene, answer choices and real progress changes have small,
purposeful animations. Artwork remains visible and still when the device's
reduced-motion setting is on, and startup does not wait for the animation in
that mode. The native splash appearance needs a release-build check on a real
phone; Expo Go is not an exact preview.

Fifteen generated pronunciation samples (greetings, both travel lessons and
both days-and-plans lessons in each course) are bundled in the APK. Tap Play
sample or Play slowly to listen and follow the visible transcript; Stop and
leaving the lesson stop playback. A new sample stops the previous one. Other
lessons have written pronunciation guides; there is no dynamic text-to-speech
or installed-voice selection. The recordings are generated learning aids, not
human-reviewed pronunciation references; accents and pronunciations can vary.
Short option, correct, wrong and completion effects are preloaded, on by default,
and can be muted via the speaker on lesson, review or Quick Mix screens, or in
Profile. That switch does not mute pronunciation samples or device haptics.
Haptics follow the phone's own settings and may be unavailable on some devices.
All these assets work offline; no microphone is used or requested. The build
checks the APK's final permissions.

XP, completed lessons, study sessions, the daily goal and missed questions are
stored locally after a successful write, not synced to an account. XP is awarded only the first
time each lesson is completed. A completed lesson (including a replay) or a
completed review set counts as one session toward the daily goal; the goal can
be set to one, two or three sessions across all courses. Days follow the
device's local calendar. The seven-day view counts days with a finished session,
not a streak, and dates are not invented for lessons completed in older versions.

A wrong answer in a lesson is added for review even if the learner then retries
it correctly. The review list shows the selected course and practises up to ten
questions per set. A correct answer removes a question; a wrong answer
leaves it for another review. Reviewing does not award extra XP. Switching
courses does not erase progress or another course's review list. Existing
earned version-1 XP and completions are retained, while fictional sample XP and
streaks from earlier versions are not counted as real progress. Adding lessons
can lower a course's completion percentage because the total has grown, but
earned XP, completed lessons and existing sticker milestones remain unchanged.
If a progress or course write is pending or fails, the app shows its status and
a retry for the current snapshot. Keep the app open until saving succeeds;
changes still only in memory can be lost when it closes. Course selection waits
for an acknowledged write before continuing. If saved data cannot be read, is
unexpected or comes from a newer version, the app blocks overwriting it and
provides a retry or guidance to reopen the newer version. The same read and
write guards cover play reward counters and the sound-effects preference; unknown
older play/audio formats are kept for recovery rather than guessed. Do not
uninstall as a recovery step: local app data can be removed. Older version-0 sample XP is
recomputed from recognized completed lessons; old IDs are retained even if a
lesson is no longer known, without inventing its XP. Version-1 earned XP is kept.

The Node tests simulate storage failures, delayed writes, older/newer formats,
retries and reopening. A local, version-checked patch also prevents AsyncStorage
and Android's default SQLite corruption handler from deleting the database on
open failure. Unknown database versions and ambiguous legacy Expo-scoped data
are blocked and kept for recovery; there is not yet an automatic recovery tool.
These safeguards are not a backup and cannot recover data already lost, protect
against uninstall, or cover every possible failure. They require a rebuilt native
app; Expo Go and old binaries do not contain the patch. Native tests on isolated
emulators do not replace testing on actual Android devices or TalkBack.

**Quick Mix** is an untimed, offline round of up to three shuffled
multiple-choice questions from completed lessons in the selected course. A new
learner can preview the first playable lesson. Correct answers earn stars for
that round only; playing does not alter XP, the daily session goal or saved
review questions. Leaving before finishing does not record the round. The
sticker book shows six milestones for lessons, courses, review and completed or
perfect mixes. Mix counters are saved separately on the device, while other
stickers reflect existing study progress. If play rewards cannot be read or
saved, the app provides a retry, without resetting study data.

The isolated test build does not sign users in, collect analytics, start an AI
call, or connect to a chat backend. The Chat screen offers a composer and
starter prompts, clearly indicates that AI is not connected, and keeps unsent
drafts in memory rather than inventing replies. AI Teacher offers local lesson
practice. This is not the production app or a Google Play release; it appears
as Lingua Preview and offers local access without an account.

The APK uses package `com.jsmastery.duolingoclone.demo`, requires Android 7.0
(API 24) or newer, and is signed with the default test/debug key generated by
Expo prebuild. This public test key is **not suitable for production**. The
separate package name keeps the demo's data and installation independent of
the normal app. Do not put credentials or personal data into the demo.

## Build

With Node 22, Java 17 and the Android SDK installed:

```sh
npm ci --legacy-peer-deps --ignore-scripts --no-audit --no-fund
npm run harden-storage
npm run lint && npm run typecheck && npm test
node scripts/prepare-android-demo.mjs
cd .expo/android-demo
EXPO_OFFLINE=1 ./node_modules/.bin/expo prebuild --platform android --no-install
cd android
EXPO_OFFLINE=1 ./gradlew :app:assembleRelease --no-daemon --max-workers=2
```

The output is `app/build/outputs/apk/release/app-release.apk` relative to the
last directory above. The release variant embeds the JavaScript bundle and does
not require a Metro server. It is still **debug-key-signed** and for testing.
The GitHub Actions workflow uploads the APK and runs the general and
six-lesson planning smoke tests on Android emulators without a network. It also
checks a normal launch, a live switch to reduced motion and a reduced-motion
relaunch using a synthetic learner. The motion smoke requires the explicit
`LINGUA_SYNTHETIC_EMULATOR=1` opt-in, verifies and pins the emulator serial,
clears only the demo package, and restores the emulator's animation settings.
Never run it on an installation with data to keep. The emulators have no
speakers, so these checks cannot judge audible pronunciation. Artifacts expire
after three days.

`prepare-android-demo.mjs` creates an ignored, isolated copy under `.expo/`;
it doesn't alter the production source. It copies no `.env` files and removes
auth/API routes and the native Clerk, Stream and analytics packages. Demo
screens replace the root and account controls, while the local lesson screens
are shared with the main app. Its small UI substitutions fail loudly if the
source no longer matches.

For a version-1-to-current upgrade check on a running Android emulator, provide
both test-signed APKs to `python3 scripts/smoke-android-upgrade.py old.apk new.apk`.
The script clears the demo's existing data, completes a lesson in the old build,
installs the new build in place and checks saved progress, replay and relaunch.
For an upgrade from the study-dashboard demo to Quick Mix, run
`python3 scripts/smoke-android-play-upgrade.py old.apk new.apk` instead. It
checks the selected course, goal, XP and review alongside the new rewards. For
an upgrade from the Quick Mix demo to the current demo, use
`python3 scripts/smoke-android-content-upgrade.py old.apk new.apk`; it also
checks preserved stickers, the new course totals, mute and offline samples. For
an upgrade from the four-unit illustrated/audio demo to the days-and-plans
version, use `python3 scripts/smoke-android-planning-upgrade.py old.apk new.apk`.
It checks the selected course, goal, XP, review, completed lessons, stickers and
mute setting, then practises a new lesson and relaunches while offline. These
upgrade scripts clear the demo's data before setting up their test learner; do
not run them against a personal installation with progress you want to keep.

For the P0 baseline (which already has the planning lessons), the manually
triggered workflow accepts the baseline Actions run ID and runs
`smoke-android-p0-upgrade.py` on an isolated emulator. This wrapper refuses
physical devices and clears only the initial synthetic demo profile. A separate
emulator-only storage test injects synthetic empty records, unexpected database
schemas, corruption and old scoped files. It requires an `adb root` emulator
and replaces only that test installation's files. Neither script should be used
on personal data. The optional baseline artifact is time-limited, so select a
still-available compatible baseline when running the workflow.
