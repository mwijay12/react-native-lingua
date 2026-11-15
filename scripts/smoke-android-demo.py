#!/usr/bin/env python3
"""Install and exercise the standalone demo on a GitHub Actions Android emulator."""
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


def find_node(root, text, exact=False):
    matches = []
    for node in root.iter("node"):
        labels = (node.get("text", ""), node.get("content-desc", ""))
        bounds = re.fullmatch(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", node.get("bounds", ""))
        if not bounds:
            continue
        x1, y1, x2, y2 = map(int, bounds.groups())
        if x2 <= x1 or y2 <= y1:
            continue
        for label in labels:
            if label == text or (not exact and text in label):
                matches.append((0 if label == text else 1, (x2 - x1) * (y2 - y1), (x1 + x2) // 2, (y1 + y2) // 2))
    return min(matches) if matches else None


def wait_for(text, timeout=90, exact=False):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        root = dump_ui()
        node = find_node(root, text, exact=exact) if root is not None else None
        if node:
            print(f"Found: {text}", flush=True)
            return node
        time.sleep(1)
    raise RuntimeError(f"Did not find {text!r} on screen")


def tap(text, exact=False):
    _, _, x, y = wait_for(text, exact=exact)
    adb("shell", "input", "tap", str(x), str(y))
    print(f"Tapped: {text}", flush=True)


def screen_size():
    text = adb("shell", "wm", "size").stdout.decode("utf-8", "replace")
    sizes = re.findall(r"(\d+)x(\d+)", text)
    if not sizes:
        raise RuntimeError(f"Could not determine emulator size: {text}")
    return tuple(map(int, sizes[-1]))


def scroll_to(text, direction="down", max_swipes=8, exact=False):
    width, height = screen_size()
    for _ in range(max_swipes + 1):
        root = dump_ui()
        node = find_node(root, text, exact=exact) if root is not None else None
        if node:
            print(f"Found after scrolling: {text}", flush=True)
            return
        start, end = (0.78, 0.30) if direction == "down" else (0.30, 0.78)
        adb("shell", "input", "swipe", str(width // 2), str(int(height * start)), str(width // 2), str(int(height * end)), "450")
        time.sleep(0.5)
    raise RuntimeError(f"Could not scroll to {text!r}")


def complete_lesson(title, answers, *, lesson_number=1, wrong_first=False, screenshot_name=None):
    label = f"Lesson {lesson_number}: {title}"
    scroll_to(label)
    tap(label)
    wait_for("Words to learn")
    if screenshot_name:
        screenshot(screenshot_name)
    scroll_to("Start practice")
    tap("Start practice")
    for index, (kind, answer) in enumerate(answers):
        if wrong_first and index == 0:
            tap("Goodbye")
            tap("Check answer")
            wait_for("Not quite. Try again.")
        if kind == "choice":
            tap(answer)
        else:
            tap("Type your answer")
            adb("shell", "input", "text", answer.replace(" ", "%s"))
            # Hide the Android keyboard before tapping the check button.
            adb("shell", "input", "keyevent", "KEYCODE_BACK")
        tap("Check answer")
        wait_for("Correct!")
        tap("Finish lesson" if index == len(answers) - 1 else "Next question")
    wait_for("You earned 10 XP.")
    tap("Done")
    wait_for("Choose a lesson")


def change_course(language):
    tap("Profile")
    scroll_to("Change language", direction="up")
    tap("Change language")
    scroll_to(language, exact=True)
    tap(language, exact=True)
    tap("Continue")
    scroll_to("Your learning, at a glance.", direction="up")
    tap("Learn")
    scroll_to("YOUR LEARNING PATH", direction="up")


def main(apk):
    adb("install", "-r", str(apk))
    adb("shell", "pm", "clear", PACKAGE)
    adb("logcat", "-c")
    adb("shell", "am", "start", "-n", f"{PACKAGE}/.MainActivity")
    wait_for("Try the demo")
    wait_for("Created by Mwijay")
    screenshot("01-onboarding")
    tap("Try the demo")
    wait_for("Choose a language")
    wait_for("Kiswahili")
    screenshot("02-language")
    tap("Continue")
    wait_for("Your progress")
    wait_for("0 XP")
    screenshot("03-home")

    tap("AI Teacher")
    wait_for("AI voice is not available yet")
    screenshot("04-ai-teacher")
    tap("Chat")
    wait_for("Live AI chat is not available yet")
    wait_for("This is a written example, not a conversation with an AI.")
    screenshot("05-chat")
    tap("Profile")
    scroll_to("Created by Mwijay")
    wait_for("About Lingua")
    screenshot("06-profile")

    tap("Learn")
    wait_for("Kiswahili: First Steps")
    complete_lesson("Kiswahili Greetings", [("choice", "Thank you"), ("choice", "Kwaheri"), ("text", "Asante")], wrong_first=True, screenshot_name="07-kiswahili")
    complete_lesson("Numbers 1–10", [("choice", "Two"), ("choice", "Tano"), ("text", "Tatu"), ("choice", "Kumi"), ("choice", "Nane")], lesson_number=3, screenshot_name="08-everyday-numbers")
    complete_lesson("Everyday conversation", [("choice", "No"), ("choice", "Samahani"), ("text", "Ndiyo"), ("choice", "Sielewi")], lesson_number=6)
    change_course("English")
    wait_for("English: First Steps")
    complete_lesson("English Greetings", [("choice", "Good morning"), ("choice", "Thank you"), ("text", "Please")], screenshot_name="09-english")
    complete_lesson("Family", [("choice", "Father"), ("choice", "Sister"), ("text", "Family"), ("choice", "This is my mother.")], lesson_number=4, screenshot_name="10-everyday-family")
    change_course("French")
    wait_for("Bonjour! Greetings")
    complete_lesson("Bonjour! Greetings", [("choice", "Hello / Good day"), ("choice", "Au revoir"), ("text", "Merci")], screenshot_name="11-french")
    complete_lesson("Food & drinks", [("choice", "Water"), ("choice", "Le pain"), ("text", "Le riz"), ("choice", "Tea")], lesson_number=8, screenshot_name="12-everyday-food")

    tap("Home")
    wait_for("70 XP")
    adb("shell", "am", "force-stop", PACKAGE)
    adb("shell", "am", "start", "-n", f"{PACKAGE}/.MainActivity")
    wait_for("French")
    wait_for("70 XP")
    screenshot("13-relaunch")
    print("Android smoke test passed: three courses, all everyday topics, progress, relaunch, creator credit and disabled AI.", flush=True)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: smoke-android-demo.py path/to/app.apk")
    try:
        main(Path(sys.argv[1]))
    finally:
        screenshot("last-screen")
        logs = adb("logcat", "-d", "-v", "time", "ReactNativeJS:V", "AndroidRuntime:E", "*:S", check=False)
        (OUT / "logcat.txt").write_bytes(logs.stdout)
