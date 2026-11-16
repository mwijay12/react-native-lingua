#!/usr/bin/env python3
"""Check an in-place upgrade from the version-1 Lingua demo on an emulator.

Usage: python3 scripts/smoke-android-upgrade.py old.apk new.apk
Both APKs must have the same demo package and test signing key.
"""
import importlib.util
import sys
from pathlib import Path

spec = importlib.util.spec_from_file_location("android_smoke", Path(__file__).with_name("smoke-android-demo.py"))
smoke = importlib.util.module_from_spec(spec)
spec.loader.exec_module(smoke)


def finish_first_lesson(*, is_upgrade):
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
    if is_upgrade:
        smoke.wait_for("You have already earned XP for this lesson.")
    else:
        smoke.wait_for("You earned 10 XP.")
    smoke.scroll_to("Done")
    smoke.tap("Done")
    smoke.wait_for("Choose a lesson")


def main(old_apk, new_apk):
    smoke.adb("install", "-r", str(old_apk))
    smoke.adb("shell", "pm", "clear", smoke.PACKAGE)
    smoke.adb("logcat", "-c")
    smoke.adb("shell", "am", "start", "-n", f"{smoke.PACKAGE}/.MainActivity")
    smoke.wait_for("Try the demo")
    smoke.tap("Try the demo")
    smoke.wait_for("Choose a language")
    smoke.tap("Continue")
    smoke.wait_for("Kiswahili")
    finish_first_lesson(is_upgrade=False)
    smoke.tap("Home")
    smoke.scroll_to("10 XP")
    smoke.screenshot("upgrade-before")
    smoke.adb("shell", "am", "force-stop", smoke.PACKAGE)

    # Android rejects -r if the package ID or signing certificate differs.
    smoke.adb("install", "-r", str(new_apk))
    smoke.adb("shell", "am", "start", "-n", f"{smoke.PACKAGE}/.MainActivity")
    smoke.wait_for("Kiswahili")
    smoke.scroll_to("0 / 1")
    smoke.scroll_to("10 XP")
    smoke.scroll_to("0 active days")
    smoke.screenshot("upgrade-after")
    finish_first_lesson(is_upgrade=True)
    smoke.tap("Home")
    smoke.scroll_to("1 / 1", direction="up")
    smoke.scroll_to("10 XP")
    smoke.adb("shell", "am", "force-stop", smoke.PACKAGE)
    smoke.adb("shell", "am", "start", "-n", f"{smoke.PACKAGE}/.MainActivity")
    smoke.wait_for("Kiswahili")
    smoke.scroll_to("1 / 1")
    smoke.scroll_to("10 XP")
    smoke.screenshot("upgrade-relaunch")
    print("Upgrade passed: package/signature, saved course and XP, no invented history, replay and relaunch.", flush=True)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: smoke-android-upgrade.py old.apk new.apk")
    try:
        main(Path(sys.argv[1]), Path(sys.argv[2]))
    finally:
        smoke.screenshot("upgrade-last-screen")
        logs = smoke.adb("logcat", "-d", "-v", "time", "ReactNativeJS:V", "AndroidRuntime:E", "*:S", check=False)
        (smoke.OUT / "upgrade-logcat.txt").write_bytes(logs.stdout)
