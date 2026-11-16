#!/usr/bin/env python3
"""Check a study-demo-to-Quick-Mix in-place upgrade on an Android emulator.

Usage: python3 scripts/smoke-android-play-upgrade.py old.apk new.apk
The old APK must have the study dashboard and review; both APKs must use the
same demo package and test signing key. This clears the demo's existing data.
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
    smoke.wait_for("Try the demo")
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
    smoke.change_course("English")
    smoke.tap("Home")
    smoke.scroll_to("1 / 2", direction="up", exact=True)
    smoke.scroll_to("10 XP", exact=True)
    smoke.screenshot("play-upgrade-before")
    smoke.adb("shell", "am", "force-stop", smoke.PACKAGE)

    # Android rejects an in-place install if the package or signature differs.
    smoke.adb("install", "-r", str(new_apk))
    smoke.adb("shell", "am", "start", "-n", f"{smoke.PACKAGE}/.MainActivity")
    smoke.wait_for("English")
    smoke.scroll_to("1 / 2", direction="up", exact=True)
    smoke.scroll_to("10 XP", exact=True)
    smoke.change_course("Kiswahili")
    smoke.tap("Home")
    smoke.scroll_to("Review missed questions")
    smoke.tap("Review missed questions")
    smoke.wait_for("1 question saved")
    smoke.tap("Go back", exact=True)
    smoke.play_kiswahili_mix(preview=False)
    smoke.scroll_to("1 / 2", direction="up", exact=True)
    smoke.scroll_to("10 XP", exact=True)
    smoke.scroll_to("1 question saved for this course")
    smoke.screenshot("play-upgrade-after")

    smoke.adb("shell", "am", "force-stop", smoke.PACKAGE)
    smoke.adb("shell", "am", "start", "-n", f"{smoke.PACKAGE}/.MainActivity")
    smoke.wait_for("Kiswahili")
    smoke.scroll_to("1 / 2", exact=True)
    smoke.scroll_to("10 XP", exact=True)
    smoke.scroll_to("1 question saved for this course")
    smoke.scroll_to("Play Quick Mix and collect stickers", direction="up")
    smoke.tap("Play Quick Mix and collect stickers")
    smoke.scroll_to("3 / 6 collected")
    smoke.scroll_to("Mix Maker")
    smoke.scroll_to("Bright Star")
    smoke.screenshot("play-upgrade-relaunch")
    print("Play upgrade passed: course, XP, goal, review, separate mix rewards and relaunch.", flush=True)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: smoke-android-play-upgrade.py old.apk new.apk")
    try:
        main(Path(sys.argv[1]), Path(sys.argv[2]))
    finally:
        smoke.screenshot("play-upgrade-last-screen")
        logs = smoke.adb("logcat", "-d", "-v", "time", "ReactNativeJS:V", "AndroidRuntime:E", "*:S", check=False)
        (smoke.OUT / "play-upgrade-logcat.txt").write_bytes(logs.stdout)
