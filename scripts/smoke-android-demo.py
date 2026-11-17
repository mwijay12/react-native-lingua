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


def dismiss_launcher_dialog(root):
    # A slow emulator can report its background Pixel Launcher as unresponsive,
    # covering the app. Do not dismiss errors from Lingua itself.
    if root is None or not find_node(root, "Pixel Launcher isn't responding"):
        return False
    button = find_node(root, "Wait", exact=True) or find_node(root, "Close app", exact=True)
    if not button:
        return False
    _, _, x, y = button
    adb("shell", "input", "tap", str(x), str(y))
    print("Dismissed emulator Pixel Launcher dialog", flush=True)
    return True


def wait_for(text, timeout=90, exact=False):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        root = dump_ui()
        if root is not None and dismiss_launcher_dialog(root):
            continue
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


def wait_for_one_of(texts, timeout=90):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        root = dump_ui()
        if root is not None and dismiss_launcher_dialog(root):
            continue
        for text in texts:
            if root is not None and find_node(root, text, exact=True):
                print(f"Found: {text}", flush=True)
                return text
        time.sleep(1)
    raise RuntimeError(f"Did not find any of {texts!r} on screen")


def screen_size():
    text = adb("shell", "wm", "size").stdout.decode("utf-8", "replace")
    sizes = re.findall(r"(\d+)x(\d+)", text)
    if not sizes:
        raise RuntimeError(f"Could not determine emulator size: {text}")
    return tuple(map(int, sizes[-1]))


def scroll_to(text, direction="down", max_swipes=14, exact=False):
    width, height = screen_size()
    # Navigation can restore a different scroll position on different devices.
    # Try the expected direction first, then search back in the other direction.
    opposite = "up" if direction == "down" else "down"
    for scan_direction in (direction, opposite):
        for attempt in range(max_swipes + 1):
            root = dump_ui()
            if root is not None and dismiss_launcher_dialog(root):
                continue
            node = find_node(root, text, exact=exact) if root is not None else None
            if node:
                print(f"Found after scrolling: {text}", flush=True)
                return
            if attempt == max_swipes:
                break
            start, end = (0.78, 0.30) if scan_direction == "down" else (0.30, 0.78)
            adb("shell", "input", "swipe", str(width // 2), str(int(height * start)), str(width // 2), str(int(height * end)), "450")
            time.sleep(0.5)
    raise RuntimeError(f"Could not scroll to {text!r}")


def complete_lesson(title, answers, *, lesson_number=1, wrong_first=False, wrong_answer="Goodbye",
                    screenshot_name=None, reward=10, listen=False, sample_text=None, already_completed=False):
    label = f"Lesson {lesson_number}: {title}"
    scroll_to(label)
    tap(label)
    if screenshot_name:
        screenshot(screenshot_name)
    if listen:
        scroll_to("Play pronunciation sample")
        tap("Play pronunciation sample")
        # The emulator runs without speakers, but playback must not prompt for
        # a microphone or block the lesson while the device is offline.
        time.sleep(1)
        tap("Stop pronunciation sample")
        scroll_to("Read along", direction="up")
        if sample_text:
            scroll_to(sample_text, direction="up")
    scroll_to("UNDERSTAND THE IDEA")
    scroll_to("Words to learn")
    scroll_to("Start practice")
    tap("Start practice")
    for index, (kind, answer) in enumerate(answers):
        if wrong_first and index == 0:
            tap(wrong_answer, exact=True)
            scroll_to("Check answer")
            tap("Check answer")
            wait_for("Not quite. Try again.")
            scroll_to(answer, direction="up")
        if kind == "choice":
            tap(answer)
        else:
            tap("Type your answer")
            adb("shell", "input", "text", answer.replace(" ", "%s"))
            # Hide the Android keyboard before tapping the check button.
            adb("shell", "input", "keyevent", "KEYCODE_BACK")
        scroll_to("Check answer")
        tap("Check answer")
        wait_for("Correct!")
        action = "Finish lesson" if index == len(answers) - 1 else "Next question"
        scroll_to(action)
        tap(action)
    if already_completed:
        wait_for("You have already earned XP for this lesson.")
    else:
        wait_for(f"You earned {reward} XP.")
    if wrong_first:
        wait_for(f"{len(answers) - 1} of {len(answers)} correct on the first try.")
    scroll_to("Done")
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


def assert_sound_effects(enabled):
    wait_for("Sound effects", exact=True)
    root = dump_ui()
    switches = [node for node in root.iter("node") if node.get("content-desc") == "Sound effects"]
    if len(switches) != 1 or switches[0].get("checked") != str(enabled).lower():
        raise RuntimeError(f"Sound effects switch did not report {enabled}: {[node.attrib for node in switches]}")


def play_kiswahili_mix(*, preview):
    scroll_to("Play Quick Mix and collect stickers", direction="up")
    tap("Play Quick Mix and collect stickers")
    if preview:
        assert_sound_effects(True)
        tap("Sound effects", exact=True)
        assert_sound_effects(False)
    source = "Try a preview from your first Kiswahili lesson" if preview else "Mix questions from your completed Kiswahili lessons"
    scroll_to(source, direction="up")
    scroll_to("Play 2-question mix")
    tap("Play 2-question mix")
    answers = {
        'What does "Asante" mean?': "Thank you",
        'Which word means "Goodbye"?': "Kwaheri",
    }
    seen = set()
    for index in range(2):
        question = wait_for_one_of(answers)
        if question in seen:
            raise RuntimeError(f"Duplicate Quick Mix question: {question}")
        seen.add(question)
        answer = answers[question]
        scroll_to(answer, direction="up", exact=True)
        tap(answer, exact=True)
        scroll_to("Check answer")
        tap("Check answer")
        wait_for("Lovely work! You found it.")
        action = "Finish mix" if index == 1 else "Next question"
        scroll_to(action)
        tap(action)
    wait_for("2 / 2 round stars")
    scroll_to("Play rewards saved on this device.")
    scroll_to("New stickers for your book!")
    screenshot("quick-mix-result")
    scroll_to("Done")
    tap("Done")


def main(apk):
    adb("install", "-r", str(apk))
    adb("shell", "pm", "clear", PACKAGE)
    # The installed demo and its learning audio should work without a network.
    adb("shell", "svc", "wifi", "disable", check=False)
    adb("shell", "svc", "data", "disable", check=False)
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
    wait_for("TODAY’S STUDY")
    scroll_to("2 sessions per day", exact=True)
    tap("2 sessions per day", exact=True)
    # The goal controls can be visible while the counter above is offscreen.
    scroll_to("0 / 2", direction="up", exact=True)
    scroll_to("0 XP", exact=True)
    screenshot("03-home")

    # A new learner can play immediately. A finished perfect mix awards two
    # stickers but must not add XP or count toward the study goal.
    play_kiswahili_mix(preview=True)
    scroll_to("0 / 2", direction="up", exact=True)
    scroll_to("0 XP", exact=True)
    adb("shell", "am", "force-stop", PACKAGE)
    adb("shell", "am", "start", "-n", f"{PACKAGE}/.MainActivity")
    wait_for("Kiswahili")
    scroll_to("Play Quick Mix and collect stickers", direction="up")
    tap("Play Quick Mix and collect stickers")
    assert_sound_effects(False)
    tap("Sound effects", exact=True)
    assert_sound_effects(True)
    scroll_to("2 / 6 collected")
    scroll_to("Mix Maker")
    scroll_to("Bright Star")
    screenshot("quick-mix-relaunch")
    tap("Go back", exact=True)
    scroll_to("0 / 2", direction="up", exact=True)
    scroll_to("0 XP", exact=True)

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
    complete_lesson("Kiswahili Greetings", [("choice", "Thank you"), ("choice", "Kwaheri"), ("text", "Asante")], wrong_first=True, screenshot_name="07-kiswahili", listen=True)

    # A missed answer stays saved after the lesson. A wrong review keeps it;
    # a later correct review removes it, with no additional XP.
    tap("Home")
    scroll_to("Review missed questions")
    tap("Review missed questions")
    wait_for("1 question saved")
    tap("Start review")
    tap("Goodbye", exact=True)
    tap("Check answer")
    wait_for("Not quite. This stays in review.")
    scroll_to("Finish review")
    tap("Finish review")
    wait_for("0 of 1 answered correctly and removed.")
    scroll_to("Done")
    tap("Done")
    scroll_to("2 / 2", direction="up")
    wait_for("Goal reached.")
    scroll_to("Review missed questions")
    tap("Review missed questions")
    wait_for("1 question saved")
    tap("Start review")
    tap("Thank you", exact=True)
    tap("Check answer")
    wait_for("Correct! Removed from review.")
    scroll_to("Finish review")
    tap("Finish review")
    wait_for("1 of 1 answered correctly and removed.")
    scroll_to("Done")
    tap("Done")
    scroll_to("3 / 2", direction="up")
    tap("Learn")
    scroll_to("YOUR LEARNING PATH", direction="up")

    complete_lesson("Numbers 1–10", [("choice", "Two"), ("choice", "Tano"), ("text", "Tatu"), ("choice", "Kumi"), ("choice", "Nane")], lesson_number=3, screenshot_name="08-everyday-numbers")
    complete_lesson("Everyday conversation", [("choice", "No"), ("choice", "Samahani"), ("text", "Ndiyo"), ("choice", "Sielewi")], lesson_number=6)
    complete_lesson("People and the present", [("choice", "Ninasoma"), ("choice", "unasoma"), ("text", "Anasoma"), ("choice", "Present tense"), ("choice", "I am reading a book")], lesson_number=7, reward=15, screenshot_name="08-foundation-sw")
    complete_lesson("Places around town", [("choice", "Market"), ("choice", "Hospitali"), ("text", "Shule"), ("choice", "Soko liko wapi?"), ("choice", "The market is nearby")], lesson_number=9, reward=15, listen=True, screenshot_name="08-travel-sw")
    change_course("English")
    wait_for("English: First Steps")
    complete_lesson("English Greetings", [("choice", "Good morning"), ("choice", "Thank you"), ("text", "Please")], screenshot_name="09-english", listen=True)
    complete_lesson("Family", [("choice", "Father"), ("choice", "Sister"), ("text", "Family"), ("choice", "This is my mother.")], lesson_number=4, screenshot_name="10-everyday-family")
    complete_lesson("I am, you are, she is", [("choice", "is"), ("choice", "are"), ("text", "am"), ("choice", "He is here."), ("choice", "I'm")], lesson_number=7, reward=15, screenshot_name="10-foundation-en")
    complete_lesson("Places around town", [("choice", "Bus stop"), ("choice", "Hospital"), ("text", "School"), ("choice", "Where is the market?"), ("choice", "Not far away")], lesson_number=9, reward=15, listen=True, screenshot_name="10-travel-en")
    change_course("French")
    wait_for("Bonjour! Greetings")
    complete_lesson("Bonjour! Greetings", [("choice", "Hello / Good day"), ("choice", "Au revoir"), ("text", "Merci")], screenshot_name="11-french", listen=True)
    complete_lesson("Food & drinks", [("choice", "Water"), ("choice", "Le pain"), ("text", "Le riz"), ("choice", "Tea")], lesson_number=8, screenshot_name="12-everyday-food")
    complete_lesson("Nouns and articles", [("choice", "une"), ("choice", "les livres"), ("text", "le"), ("choice", "The article shortens before a vowel"), ("choice", "There is a book")], lesson_number=11, reward=15, screenshot_name="12-foundation-fr")
    complete_lesson("Finding the way", [("choice", "To the left"), ("choice", "Arrêtez"), ("text", "A droite"), ("choice", "Straight ahead"), ("choice", "Turn left")], lesson_number=13, reward=15, listen=True, screenshot_name="12-travel-fr")

    tap("Home")
    scroll_to("15 / 2", direction="up")
    scroll_to("160 XP")
    scroll_to("Play Quick Mix and collect stickers", direction="up")
    tap("Play Quick Mix and collect stickers")
    scroll_to("6 / 6 collected")
    screenshot("all-stickers")
    tap("Go back", exact=True)
    adb("shell", "am", "force-stop", PACKAGE)
    adb("shell", "am", "start", "-n", f"{PACKAGE}/.MainActivity")
    wait_for("French")
    scroll_to("15 / 2")
    scroll_to("160 XP")
    screenshot("13-relaunch")
    print("Android smoke test passed offline: pronunciation controls, sound setting, travel lessons, Quick Mix, stickers, review, progress, relaunch and disabled AI.", flush=True)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: smoke-android-demo.py path/to/app.apk")
    try:
        main(Path(sys.argv[1]))
    finally:
        screenshot("last-screen")
        logs = adb("logcat", "-d", "-v", "time", "ReactNativeJS:V", "AndroidRuntime:E", "*:S", check=False)
        (OUT / "logcat.txt").write_bytes(logs.stdout)
