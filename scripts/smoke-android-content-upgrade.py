#!/usr/bin/env python3
"""Check a Quick Mix demo-to-current-content demo upgrade on Android.

Usage: python3 scripts/smoke-android-content-upgrade.py old.apk new.apk
Both test-signed APKs must use the same demo package. This clears demo data.
"""
import importlib.util
import sys
from pathlib import Path

spec = importlib.util.spec_from_file_location("android_smoke", Path(__file__).with_name("smoke-android-demo.py"))
smoke = importlib.util.module_from_spec(spec)
spec.loader.exec_module(smoke)


def main(old_apk, new_apk):
    smoke.adb("install", "-r", str(old_apk))
    smoke.adb("shell", "pm", "clear", smoke.PACKAGE)
    smoke.adb("logcat", "-c")
    smoke.adb("shell", "am", "start", "-n", f"{smoke.PACKAGE}/.MainActivity")
    smoke.tap("Try the demo")
    smoke.wait_for("Choose a language")
    smoke.tap("Continue")
    smoke.wait_for("TODAY’S STUDY")
    smoke.scroll_to("2 sessions per day", exact=True)
    smoke.tap("2 sessions per day", exact=True)
    smoke.tap("Learn")
    smoke.complete_lesson(
        "Kiswahili Greetings",
        [("choice", "Thank you"), ("choice", "Kwaheri"), ("text", "Asante")],
        wrong_first=True,
    )
    smoke.tap("Home")
    # The earlier APK has no sound setting; the non-preview mix does not use it.
    smoke.play_kiswahili_mix(preview=False)
    smoke.change_course("English")
    smoke.tap("Home")
    smoke.scroll_to("1 / 2", direction="up", exact=True)
    smoke.scroll_to("10 XP", exact=True)
    smoke.screenshot("content-upgrade-before")
    smoke.adb("shell", "am", "force-stop", smoke.PACKAGE)

    # In-place installation also verifies that package and signing key match.
    smoke.adb("install", "-r", str(new_apk))
    smoke.adb("shell", "svc", "wifi", "disable", check=False)
    smoke.adb("shell", "svc", "data", "disable", check=False)
    smoke.adb("shell", "am", "start", "-n", f"{smoke.PACKAGE}/.MainActivity")
    smoke.wait_for("English")
    smoke.scroll_to("1 / 2", direction="up", exact=True)
    smoke.scroll_to("10 XP", exact=True)
    smoke.tap("Profile")
    smoke.scroll_to("0 / 12 lessons")
    smoke.scroll_to("Sound effects", exact=True)
    smoke.assert_sound_effects(True)
    smoke.tap("Sound effects", exact=True)
    smoke.assert_sound_effects(False)
    smoke.change_course("Kiswahili")
    smoke.wait_for("1 of 12 completed")
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
    smoke.complete_lesson(
        "Places around town",
        [("choice", "Market"), ("choice", "Hospitali"), ("text", "Shule"),
         ("choice", "Soko liko wapi?"), ("choice", "The market is nearby")],
        lesson_number=9, reward=15, listen=True,
    )
    smoke.tap("Home")
    smoke.scroll_to("2 / 2", direction="up", exact=True)
    smoke.scroll_to("25 XP", exact=True)
    smoke.scroll_to("1 question saved for this course")
    smoke.screenshot("content-upgrade-after")
    smoke.adb("shell", "am", "force-stop", smoke.PACKAGE)
    smoke.adb("shell", "am", "start", "-n", f"{smoke.PACKAGE}/.MainActivity")
    smoke.wait_for("Kiswahili")
    smoke.scroll_to("2 / 2", exact=True)
    smoke.scroll_to("25 XP", exact=True)
    smoke.scroll_to("1 question saved for this course")
    smoke.scroll_to("Play Quick Mix and collect stickers", direction="up")
    smoke.tap("Play Quick Mix and collect stickers")
    smoke.assert_sound_effects(False)
    smoke.scroll_to("3 / 6 collected")
    smoke.screenshot("content-upgrade-relaunch")
    print("Content upgrade passed: course, XP, goal, review, stickers, mute, offline sample and new lesson survive installation and relaunch.", flush=True)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: smoke-android-content-upgrade.py old.apk new.apk")
    try:
        main(Path(sys.argv[1]), Path(sys.argv[2]))
    finally:
        smoke.screenshot("content-upgrade-last-screen")
        logs = smoke.adb("logcat", "-d", "-v", "time", "ReactNativeJS:V", "AndroidRuntime:E", "*:S", check=False)
        (smoke.OUT / "content-upgrade-logcat.txt").write_bytes(logs.stdout)
