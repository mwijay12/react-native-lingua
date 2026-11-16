#!/usr/bin/env python3
"""Temporary check of upgrading the previously shared study demo in place."""
import importlib.util
import sys
from pathlib import Path

spec = importlib.util.spec_from_file_location("android_smoke", Path(__file__).with_name("smoke-android-demo.py"))
smoke = importlib.util.module_from_spec(spec)
spec.loader.exec_module(smoke)


def replay_first_lesson():
    smoke.tap("Learn")
    smoke.scroll_to("Lesson 1: Kiswahili Greetings", direction="up")
    smoke.tap("Lesson 1: Kiswahili Greetings")
    smoke.scroll_to("Start practice")
    smoke.tap("Start practice")
    for index, answer in enumerate(("Thank you", "Kwaheri", "Asante")):
        if index < 2:
            smoke.tap(answer, exact=True)
        else:
            smoke.tap("Type your answer")
            smoke.adb("shell", "input", "text", answer)
            smoke.adb("shell", "input", "keyevent", "KEYCODE_BACK")
        smoke.scroll_to("Check answer")
        smoke.tap("Check answer")
        smoke.wait_for("Correct!")
        action = "Finish lesson" if index == 2 else "Next question"
        smoke.scroll_to(action)
        smoke.tap(action)
    smoke.wait_for("You have already earned XP for this lesson.")
    smoke.scroll_to("Done")
    smoke.tap("Done")
    smoke.wait_for("Choose a lesson")


def main(old_apk, new_apk):
    smoke.adb("install", "-r", str(old_apk))
    smoke.adb("shell", "pm", "clear", smoke.PACKAGE)
    smoke.adb("shell", "am", "start", "-n", f"{smoke.PACKAGE}/.MainActivity")
    smoke.wait_for("Try the demo")
    smoke.tap("Try the demo")
    smoke.wait_for("Choose a language")
    smoke.tap("Continue")
    smoke.wait_for("TODAY’S STUDY")
    smoke.scroll_to("2 sessions per day", exact=True)
    smoke.tap("2 sessions per day", exact=True)
    smoke.scroll_to("0 / 2", direction="up")
    smoke.tap("Learn")
    smoke.wait_for("Kiswahili: First Steps")
    smoke.complete_lesson("Kiswahili Greetings", [("choice", "Thank you"), ("choice", "Kwaheri"), ("text", "Asante")], wrong_first=True)
    smoke.tap("Home")
    smoke.scroll_to("1 / 2", direction="up")
    smoke.scroll_to("10 XP")
    smoke.scroll_to("Review missed questions", direction="up")
    smoke.wait_for("1 question saved")
    smoke.screenshot("upgrade-v2-before")
    smoke.adb("shell", "am", "force-stop", smoke.PACKAGE)

    # Android rejects -r if the package ID or signing certificate differs.
    smoke.adb("install", "-r", str(new_apk))
    smoke.adb("shell", "am", "start", "-n", f"{smoke.PACKAGE}/.MainActivity")
    smoke.wait_for("Kiswahili")
    smoke.scroll_to("1 / 2")
    smoke.scroll_to("10 XP")
    smoke.scroll_to("Review missed questions", direction="up")
    smoke.wait_for("1 question saved")
    smoke.screenshot("upgrade-v2-after")
    smoke.tap("Review missed questions")
    smoke.wait_for("1 question saved")
    smoke.tap("Start review")
    smoke.tap("Thank you", exact=True)
    smoke.tap("Check answer")
    smoke.wait_for("Correct! Removed from review.")
    smoke.scroll_to("Finish review")
    smoke.tap("Finish review")
    smoke.wait_for("1 of 1 answered correctly and removed.")
    smoke.scroll_to("Done")
    smoke.tap("Done")
    smoke.scroll_to("2 / 2", direction="up")
    replay_first_lesson()
    smoke.tap("Home")
    smoke.scroll_to("3 / 2", direction="up")
    smoke.scroll_to("10 XP")
    smoke.adb("shell", "am", "force-stop", smoke.PACKAGE)
    smoke.adb("shell", "am", "start", "-n", f"{smoke.PACKAGE}/.MainActivity")
    smoke.wait_for("Kiswahili")
    smoke.scroll_to("3 / 2")
    smoke.scroll_to("10 XP")
    smoke.screenshot("upgrade-v2-relaunch")
    print("Upgrade passed: signing, saved course, XP, goal and review, replay and relaunch.", flush=True)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: smoke-android-upgrade-v2.py old.apk new.apk")
    try:
        main(Path(sys.argv[1]), Path(sys.argv[2]))
    finally:
        smoke.screenshot("upgrade-v2-last-screen")
        logs = smoke.adb("logcat", "-d", "-v", "time", "ReactNativeJS:V", "AndroidRuntime:E", "*:S", check=False)
        (smoke.OUT / "upgrade-v2-logcat.txt").write_bytes(logs.stdout)
