#!/usr/bin/env python3
"""Temporary check: update the last delivered demo without erasing progress."""
import importlib.util
import sys
from pathlib import Path

spec = importlib.util.spec_from_file_location("smoke_demo", "scripts/smoke-android-demo.py")
smoke = importlib.util.module_from_spec(spec)
spec.loader.exec_module(smoke)

old, new = map(Path, sys.argv[1:3])
try:
    smoke.adb("install", "-r", str(old))
    smoke.adb("shell", "pm", "clear", smoke.PACKAGE)
    smoke.adb("shell", "am", "start", "-n", f"{smoke.PACKAGE}/.MainActivity")
    smoke.tap("Try the demo")
    smoke.wait_for("Choose a language")
    smoke.tap("Continue")
    smoke.wait_for("Your progress")
    smoke.tap("Learn")
    smoke.wait_for("Kiswahili: First Steps")
    smoke.complete_lesson("Kiswahili Greetings", [("choice", "Thank you"), ("choice", "Kwaheri"), ("text", "Asante")])
    smoke.tap("Home")
    smoke.wait_for("10 XP")
    smoke.screenshot("upgrade-01-old-progress")

    # Install over the old package; never clear data between versions.
    smoke.adb("shell", "am", "force-stop", smoke.PACKAGE)
    smoke.adb("install", "-r", str(new))
    smoke.adb("shell", "am", "start", "-n", f"{smoke.PACKAGE}/.MainActivity")
    smoke.wait_for("Kiswahili")
    smoke.wait_for("10 XP")
    smoke.wait_for("1 of 6 lessons completed")
    smoke.screenshot("upgrade-02-new-progress")
    smoke.tap("Learn")
    smoke.scroll_to("Lesson 1: Kiswahili Greetings. Completed.", direction="up")
    smoke.complete_lesson("Numbers 1–10", [("choice", "Two"), ("choice", "Tano"), ("text", "Tatu"), ("choice", "Kumi"), ("choice", "Nane")], lesson_number=3)
    smoke.tap("Home")
    smoke.wait_for("20 XP")
    smoke.adb("shell", "am", "force-stop", smoke.PACKAGE)
    smoke.adb("shell", "am", "start", "-n", f"{smoke.PACKAGE}/.MainActivity")
    smoke.wait_for("20 XP")
    smoke.screenshot("upgrade-03-relaunch")
    print("Android upgrade passed: previous XP and completion preserved, everyday lesson works, progress survives relaunch.", flush=True)
finally:
    smoke.screenshot("upgrade-last")
    logs = smoke.adb("logcat", "-d", "-v", "time", "ReactNativeJS:V", "AndroidRuntime:E", "*:S", check=False)
    (smoke.OUT / "upgrade-logcat.txt").write_bytes(logs.stdout)
