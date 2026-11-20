#!/usr/bin/env python3
"""Upgrade an illustrated/audio demo to days-and-plans without clearing data.

Usage: python3 scripts/smoke-android-planning-upgrade.py old.apk new.apk
Both test-signed APKs must use the same demo package. The initial install is
cleared to create a controlled old-version learner before the in-place upgrade.
"""
import importlib.util
import sys
from pathlib import Path


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


smoke = load("android_smoke", "smoke-android-demo.py")
planning = load("planning_smoke", "smoke-android-planning.py")


def main(old_apk, new_apk, old_english_total=10):
    smoke.adb("install", "-r", str(old_apk))
    smoke.adb("shell", "pm", "clear", smoke.PACKAGE)
    smoke.adb("shell", "svc", "wifi", "disable", check=False)
    smoke.adb("shell", "svc", "data", "disable", check=False)
    smoke.adb("logcat", "-c")
    smoke.adb("shell", "am", "start", "-n", f"{smoke.PACKAGE}/.MainActivity")
    smoke.tap_onboarding()
    smoke.wait_for("Choose a language")
    smoke.tap("Continue")
    smoke.wait_for("TODAY’S STUDY")
    smoke.scroll_to("2 sessions per day", exact=True)
    smoke.tap("2 sessions per day", exact=True)
    smoke.tap("Learn")
    smoke.complete_lesson("Kiswahili Greetings", [("choice", "Thank you"), ("choice", "Kwaheri"), ("text", "Asante")], wrong_first=True)
    smoke.tap("Home")
    smoke.play_kiswahili_mix(preview=False)
    smoke.scroll_to("Play Quick Mix and collect stickers", direction="up")
    smoke.tap("Play Quick Mix and collect stickers")
    smoke.assert_sound_effects(True)
    smoke.tap("Sound effects", exact=True)
    smoke.assert_sound_effects(False)
    smoke.scroll_to("3 / 6 collected")
    smoke.tap("Go back", exact=True)
    smoke.tap("Learn")
    smoke.complete_lesson(
        "Places around town",
        [("choice", "Market"), ("choice", "Hospitali"), ("text", "Shule"),
         ("choice", "Soko liko wapi?"), ("choice", "The market is nearby")],
        # Historical baselines predate the slow playback button.
        lesson_number=9, reward=15, listen=True, slow_sample=False,
    )
    smoke.change_course("English")
    smoke.tap("Home")
    smoke.scroll_to("2 / 2", direction="up", exact=True)
    smoke.scroll_to("25 XP", exact=True)
    smoke.tap("Profile")
    smoke.scroll_to(f"0 / {old_english_total} lessons")
    smoke.scroll_to("Sound effects", exact=True)
    smoke.assert_sound_effects(False)
    smoke.screenshot("planning-upgrade-before")
    smoke.adb("shell", "am", "force-stop", smoke.PACKAGE)

    # Installation is in place: package, signing identity and saved state must
    # remain compatible, with network disabled throughout the upgrade.
    smoke.adb("install", "-r", str(new_apk))
    smoke.adb("shell", "am", "start", "-n", f"{smoke.PACKAGE}/.MainActivity")
    smoke.wait_for("English")
    smoke.scroll_to("2 / 2", direction="up", exact=True)
    smoke.scroll_to("25 XP", exact=True)
    smoke.tap("Profile")
    smoke.scroll_to("0 / 12 lessons")
    smoke.scroll_to("Sound effects", exact=True)
    smoke.assert_sound_effects(False)
    smoke.change_course("Kiswahili")
    smoke.wait_for("2 of 12 completed")
    smoke.tap("Home")
    smoke.scroll_to("1 question saved for this course")
    smoke.scroll_to("Play Quick Mix and collect stickers", direction="up")
    smoke.tap("Play Quick Mix and collect stickers")
    smoke.assert_sound_effects(False)
    smoke.scroll_to("3 / 6 collected")
    smoke.scroll_to("Mix Maker")
    smoke.scroll_to("Bright Star")
    smoke.tap("Go back", exact=True)
    smoke.tap("Learn")
    smoke.complete_lesson("Days of the week", planning.SW_DAYS, lesson_number=11, reward=15,
                          listen=True, sample_text="Jumatano", screenshot_name="planning-upgrade-new-lesson")
    smoke.tap("Home")
    smoke.scroll_to("3 / 2", direction="up", exact=True)
    smoke.scroll_to("40 XP", exact=True)
    smoke.scroll_to("1 question saved for this course")
    smoke.screenshot("planning-upgrade-after")
    smoke.adb("shell", "am", "force-stop", smoke.PACKAGE)
    smoke.adb("shell", "am", "start", "-n", f"{smoke.PACKAGE}/.MainActivity")
    smoke.wait_for("Kiswahili")
    smoke.scroll_to("3 / 2", direction="up", exact=True)
    smoke.scroll_to("40 XP", exact=True)
    smoke.scroll_to("1 question saved for this course")
    smoke.scroll_to("Play Quick Mix and collect stickers", direction="up")
    smoke.tap("Play Quick Mix and collect stickers")
    smoke.assert_sound_effects(False)
    smoke.scroll_to("4 / 6 collected")
    smoke.screenshot("planning-upgrade-relaunch")
    print("Planning upgrade passed offline: selected course, XP, goal, old review, completed lessons, stickers and mute survived, and the new lesson and sample work.", flush=True)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: smoke-android-planning-upgrade.py old.apk new.apk")
    try:
        main(Path(sys.argv[1]), Path(sys.argv[2]))
    finally:
        smoke.screenshot("planning-upgrade-last-screen")
        logs = smoke.adb("logcat", "-d", "-v", "time", "ReactNativeJS:V", "AndroidRuntime:E", "*:S", check=False)
        (smoke.OUT / "planning-upgrade-logcat.txt").write_bytes(logs.stdout)
