#!/usr/bin/env python3
"""Exercise the standalone demo on the GitHub Actions Android emulator."""
import re
import subprocess
import sys
import time
import xml.etree.ElementTree as ET
from pathlib import Path

PACKAGE = "com.jsmastery.duolingoclone.demo"
OUT = Path("android-smoke")
OUT.mkdir(exist_ok=True)


def adb(*args, check=True):
    return subprocess.run(["adb", *args], check=check, stdout=subprocess.PIPE, stderr=subprocess.PIPE)


def screenshot(name):
    result = adb("exec-out", "screencap", "-p", check=False)
    if result.returncode == 0:
        (OUT / f"{name}.png").write_bytes(result.stdout)


def dump_ui():
    result = adb("shell", "uiautomator", "dump", "/sdcard/lingua-window.xml", check=False)
    if result.returncode != 0:
        return None
    xml = adb("exec-out", "cat", "/sdcard/lingua-window.xml", check=False)
    if xml.returncode != 0:
        return None
    (OUT / "last-window.xml").write_bytes(xml.stdout)
    try:
        return ET.fromstring(xml.stdout)
    except ET.ParseError:
        return None


def find_node(root, text):
    matches = []
    for node in root.iter("node"):
        label = node.get("text", "") or node.get("content-desc", "")
        bounds = re.fullmatch(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", node.get("bounds", ""))
        if text in label and bounds:
            x1, y1, x2, y2 = map(int, bounds.groups())
            if x2 > x1 and y2 > y1:
                matches.append((0 if label == text else 1, (x2 - x1) * (y2 - y1), (x1 + x2) // 2, (y1 + y2) // 2))
    return min(matches) if matches else None


def wait_for(text, timeout=90):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        root = dump_ui()
        node = find_node(root, text) if root is not None else None
        if node:
            print(f"Found: {text}", flush=True)
            return node
        time.sleep(2)
    raise RuntimeError(f"Did not find {text!r} on screen")


def tap(text):
    _, _, x, y = wait_for(text)
    adb("shell", "input", "tap", str(x), str(y))
    print(f"Tapped: {text}", flush=True)


def main(apk):
    adb("install", "-r", str(apk))
    adb("shell", "pm", "clear", PACKAGE)
    adb("logcat", "-c")
    adb("shell", "am", "start", "-n", f"{PACKAGE}/.MainActivity")
    wait_for("Jaribu demo")
    screenshot("01-onboarding")
    tap("Jaribu demo")
    wait_for("Choose a language")
    screenshot("02-language")
    tap("Continue")
    wait_for("Daily goal")
    screenshot("03-home")
    tap("Continue")
    wait_for("Lessons")
    screenshot("04-learn")
    tap("Hola! Greetings")
    wait_for("Sauti ya AI haijawashwa kwenye demo")
    wait_for("Maneno ya somo")
    screenshot("05-lesson")
    adb("shell", "am", "force-stop", PACKAGE)
    adb("shell", "am", "start", "-n", f"{PACKAGE}/.MainActivity")
    wait_for("Daily goal")
    screenshot("06-relaunch")
    print("Android smoke test passed, including persisted language selection.", flush=True)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: smoke-android-demo.py path/to/app.apk")
    try:
        main(Path(sys.argv[1]))
    finally:
        screenshot("last-screen")
        logs = adb("logcat", "-d", "-v", "time", "ReactNativeJS:V", "AndroidRuntime:E", "*:S", check=False)
        (OUT / "logcat.txt").write_bytes(logs.stdout)
