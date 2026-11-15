#!/usr/bin/env python3
"""Temporary check: update the previous demo APK without erasing app data."""
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
    smoke.tap("Jaribu demo")
    smoke.wait_for("Choose a language")
    smoke.tap("Continue")
    smoke.wait_for("Daily goal")
    smoke.screenshot("upgrade-01-old")
    smoke.adb("shell", "am", "force-stop", smoke.PACKAGE)
    smoke.adb("install", "-r", str(new))
    smoke.adb("shell", "am", "start", "-n", f"{smoke.PACKAGE}/.MainActivity")
    smoke.wait_for("Your previous course is not available in this version")
    smoke.screenshot("upgrade-02-choose-course")
    smoke.tap("Continue")
    smoke.wait_for("Kiswahili")
    smoke.wait_for("0 XP")
    smoke.screenshot("upgrade-03-new")
    print("Android upgrade test passed: previous APK updated in place, legacy course handled, sample XP removed.", flush=True)
finally:
    smoke.screenshot("upgrade-last")
    logs = smoke.adb("logcat", "-d", "-v", "time", "ReactNativeJS:V", "AndroidRuntime:E", "*:S", check=False)
    (smoke.OUT / "upgrade-logcat.txt").write_bytes(logs.stdout)
