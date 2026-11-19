#!/usr/bin/env python3
"""Exercise startup and answer feedback in both motion modes on a test emulator.

This clears only the standalone demo package and uses synthetic answers. It
refuses a physical device and pins every subsequent adb command to the checked
emulator. Never run it against an installation containing data to keep.
"""
import importlib.util
import os
import subprocess
import sys
from pathlib import Path


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


smoke = load("android_smoke", "smoke-android-demo.py")
safety = load("p0_upgrade", "smoke-android-p0-upgrade.py")
SCALES = ("window_animation_scale", "transition_animation_scale", "animator_duration_scale")
ANSWERS = {
    'What does "Asante" mean?': "Thank you",
    'Which word means "Goodbye"?': "Kwaheri",
}


def set_scales(value):
    for name in SCALES:
        smoke.adb("shell", "settings", "put", "global", name, value)


def main(apk):
    if os.environ.get("LINGUA_SYNTHETIC_EMULATOR") != "1":
        raise RuntimeError("Set LINGUA_SYNTHETIC_EMULATOR=1 only for an isolated emulator with synthetic data.")
    serial = subprocess.check_output(["adb", "get-serialno"], text=True).strip()
    if not serial.startswith("emulator-"):
        raise RuntimeError("Motion testing requires an isolated Android emulator.")
    os.environ["ANDROID_SERIAL"] = serial
    safety.require_isolated_emulator()
    original = {
        name: smoke.adb("shell", "settings", "get", "global", name).stdout.decode().strip()
        for name in SCALES
    }
    try:
        smoke.adb("install", "-r", str(apk))
        safety.require_isolated_emulator()
        smoke.adb("shell", "pm", "clear", smoke.PACKAGE)
        smoke.adb("logcat", "-c")

        # Normal motion: launch and operate the app, not just the splash.
        set_scales("1")
        smoke.adb("shell", "am", "force-stop", smoke.PACKAGE)
        smoke.adb("shell", "am", "start", "-n", f"{smoke.PACKAGE}/.MainActivity")
        smoke.wait_for("Try the demo", timeout=45)
        smoke.screenshot("motion-on-welcome")
        smoke.tap("Try the demo")
        smoke.wait_for("Choose a language")
        smoke.tap("Continue")
        smoke.wait_for("TODAY’S STUDY")
        smoke.scroll_to("Play Quick Mix and collect stickers", direction="up")
        smoke.tap("Play Quick Mix and collect stickers")
        smoke.scroll_to("Play 2-question mix")
        smoke.tap("Play 2-question mix")
        first = smoke.wait_for_one_of(ANSWERS)
        smoke.scroll_to(ANSWERS[first], direction="up", exact=True)
        smoke.tap(ANSWERS[first], exact=True)
        smoke.scroll_to("Check answer")
        smoke.tap("Check answer")
        smoke.wait_for("Lovely work! You found it.")

        # Change the device preference while the app is open and finish the
        # same round. Motion is never required for input or feedback.
        set_scales("0")
        smoke.scroll_to("Next question")
        smoke.tap("Next question")
        second = smoke.wait_for_one_of(ANSWERS)
        if first == second:
            raise AssertionError("Quick Mix repeated the same question")
        smoke.scroll_to(ANSWERS[second], direction="up", exact=True)
        smoke.tap(ANSWERS[second], exact=True)
        smoke.scroll_to("Check answer")
        smoke.tap("Check answer")
        smoke.wait_for("Lovely work! You found it.")
        smoke.scroll_to("Finish mix")
        smoke.tap("Finish mix")
        smoke.wait_for("2 / 2 round stars")
        smoke.scroll_to("Play rewards saved on this device.")
        smoke.screenshot("motion-reduced-result")

        # A cold start with reduced motion must also leave the app usable.
        smoke.adb("shell", "am", "force-stop", smoke.PACKAGE)
        smoke.adb("shell", "am", "start", "-n", f"{smoke.PACKAGE}/.MainActivity")
        smoke.wait_for("TODAY’S STUDY", timeout=45)
        smoke.screenshot("motion-reduced-relaunch")
        logs = smoke.adb("logcat", "-d", "-v", "time", "ReactNativeJS:V", "AndroidRuntime:E", "*:S", check=False).stdout
        (smoke.OUT / "motion-logcat.txt").write_bytes(logs)
        if b"FATAL EXCEPTION" in logs:
            raise AssertionError("Android reported a fatal exception during motion smoke testing")
        print("Motion smoke passed: normal and reduced launches, live preference change, answers and relaunch.", flush=True)
    finally:
        for name, value in original.items():
            if value == "null":
                smoke.adb("shell", "settings", "delete", "global", name, check=False)
            else:
                smoke.adb("shell", "settings", "put", "global", name, value, check=False)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: smoke-android-motion.py path/to/demo.apk")
    main(Path(sys.argv[1]))
