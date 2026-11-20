#!/usr/bin/env python3
"""Exercise startup and answer feedback in both motion modes on a test emulator.

This clears only the standalone demo package and uses synthetic answers. It
refuses a physical device and pins every subsequent adb command to the checked
emulator. Never run it against an installation containing data to keep.
"""
import importlib.util
import os
import re
import subprocess
import sys
import time
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
UNITS = (
    ("sw-unit-1", "Learn everyday greetings and introductions in Kiswahili", "sw-lesson-1"),
    ("sw-unit-2", "Numbers, family, food and useful conversations", "sw-everyday-numbers"),
    ("sw-unit-3", "Build useful sentences and ask questions with confidence.", "sw-foundation-present"),
    ("sw-unit-4", "Find familiar places and ask for the way in Kiswahili.", "sw-travel-places"),
    ("sw-unit-5", "Name the days and make a simple plan in Kiswahili.", "sw-planning-days"),
)


def bounds_for_id(root, resource_id):
    for node in root.iter("node"):
        if node.get("resource-id") != resource_id:
            continue
        match = re.fullmatch(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", node.get("bounds", ""))
        if match:
            left, top, right, bottom = map(int, match.groups())
            if right > left and bottom > top:
                return left, top, right, bottom
    return None


def check_unit_layouts():
    # This runs only inside the isolated emulator. UIAutomator clips bounds to
    # the visible viewport, so bring the description and first lesson together
    # before measuring. The old intrinsic-image bug makes this impossible.
    density_text = smoke.adb("shell", "wm", "density").stdout.decode("utf-8", "replace")
    densities = re.findall(r"(?:Physical|Override) density: (\d+)", density_text)
    if not densities:
        raise RuntimeError(f"Could not determine emulator density: {density_text}")
    density = int(densities[-1]) / 160
    width, height = smoke.screen_size()
    for unit, description, first_lesson in UNITS:
        smoke.scroll_to(description, exact=True)
        scene_checked = False
        for attempt in range(10):
            root = smoke.dump_ui()
            if root is None:
                continue
            header = bounds_for_id(root, f"unit-header-{unit}")
            scene = bounds_for_id(root, f"unit-scene-{unit}")
            text = bounds_for_id(root, f"unit-description-{unit}")
            lesson = bounds_for_id(root, f"lesson-card-{first_lesson}")
            if header and scene and not scene_checked:
                if abs(scene[0] - header[0]) > 1 or abs(scene[2] - header[2]) > 1:
                    raise AssertionError(f"{unit}: scene {scene} does not fill header {header}")
                scene_checked = True
            if scene_checked and header and text and lesson and lesson[1] >= header[3]:
                padding = (header[3] - text[3]) / density
                gap = (lesson[1] - header[3]) / density
                if not 14 <= padding <= 20 or not 10 <= gap <= 14:
                    raise AssertionError(f"{unit}: padding={padding:.1f}dp, lesson gap={gap:.1f}dp")
                print(f"{unit}: padding={padding:.1f}dp, gap={gap:.1f}dp, image fills card", flush=True)
                smoke.screenshot(f"layout-{unit}")
                break
            if attempt == 9:
                raise AssertionError(f"{unit}: scene, description and first lesson could not be measured")
            # If the scene is already above the viewport, scroll up first;
            # otherwise scroll down until the first lesson appears.
            start, end = (0.50, 0.66) if not scene_checked else (0.70, 0.56)
            smoke.adb("shell", "input", "swipe", str(width // 2), str(int(height * start)), str(width // 2), str(int(height * end)), "400")
            time.sleep(0.4)


def set_scales(value):
    for name in SCALES:
        smoke.adb("shell", "settings", "put", "global", name, value)


def tap_when_settled(text, exact=False):
    # With Android transitions enabled, a label can appear in the UI tree
    # before its button has reached its final position. Re-measure after the
    # transition and use a short, human-length tap on the checked emulator.
    smoke.wait_for(text, exact=exact)
    time.sleep(0.7)
    _, _, x, y = smoke.wait_for(text, exact=exact)
    smoke.adb("shell", "input", "swipe", str(x), str(y), str(x), str(y), "120")
    print(f"Tapped after settling: {text}", flush=True)


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
        smoke.wait_for("Continue without an account", timeout=90)
        smoke.screenshot("motion-on-welcome")
        tap_when_settled("Continue without an account")
        smoke.wait_for("Choose a language")
        tap_when_settled("Continue")
        smoke.wait_for("TODAY’S STUDY")
        tap_when_settled("Learn", exact=True)
        smoke.wait_for("Choose a lesson")
        check_unit_layouts()
        tap_when_settled("Home", exact=True)
        smoke.scroll_to("Play Quick Mix and collect stickers", direction="up")
        tap_when_settled("Play Quick Mix and collect stickers")
        smoke.scroll_to("Play 2-question mix")
        tap_when_settled("Play 2-question mix")
        first = smoke.wait_for_one_of(ANSWERS)
        smoke.scroll_to(ANSWERS[first], direction="up", exact=True)
        tap_when_settled(ANSWERS[first], exact=True)
        smoke.scroll_to("Check answer")
        tap_when_settled("Check answer")
        smoke.wait_for("Lovely work! You found it.")

        # Change the device preference while the app is open and finish the
        # same round. Motion is never required for input or feedback.
        set_scales("0")
        smoke.scroll_to("Next question")
        tap_when_settled("Next question")
        second = smoke.wait_for_one_of(ANSWERS)
        if first == second:
            raise AssertionError("Quick Mix repeated the same question")
        smoke.scroll_to(ANSWERS[second], direction="up", exact=True)
        tap_when_settled(ANSWERS[second], exact=True)
        smoke.scroll_to("Check answer")
        tap_when_settled("Check answer")
        smoke.wait_for("Lovely work! You found it.")
        smoke.scroll_to("Finish mix")
        tap_when_settled("Finish mix")
        smoke.wait_for("2 / 2 round stars")
        smoke.scroll_to("Play rewards saved on this device.")
        smoke.screenshot("motion-reduced-result")

        # A cold start with reduced motion must also leave the app usable.
        smoke.adb("shell", "am", "force-stop", smoke.PACKAGE)
        smoke.adb("shell", "am", "start", "-n", f"{smoke.PACKAGE}/.MainActivity")
        smoke.wait_for("TODAY’S STUDY", timeout=90)
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
        # Preserve diagnostics on failure too, without hiding the original error.
        try:
            smoke.screenshot("motion-last-screen")
            logs = smoke.adb("logcat", "-d", "-v", "time", "ReactNativeJS:V", "AndroidRuntime:E", "*:S", check=False).stdout
            (smoke.OUT / "motion-logcat.txt").write_bytes(logs)
        except (OSError, subprocess.SubprocessError) as error:
            print(f"Could not collect motion diagnostics: {error}", file=sys.stderr, flush=True)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: smoke-android-motion.py path/to/demo.apk")
    main(Path(sys.argv[1]))
