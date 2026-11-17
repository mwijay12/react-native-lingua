#!/usr/bin/env python3
"""Practise the six days-and-plans lessons on a fresh, offline Android demo."""
import importlib.util
import sys
from pathlib import Path

spec = importlib.util.spec_from_file_location("android_smoke", Path(__file__).with_name("smoke-android-demo.py"))
smoke = importlib.util.module_from_spec(spec)
spec.loader.exec_module(smoke)

SW_DAYS = [
    ("choice", "Monday"), ("choice", "Ijumaa"), ("text", "Jumapili"),
    ("choice", "Jumapili"), ("choice", "We will see each other on Friday"),
    ("choice", "Jumatano"), ("text", "Alhamisi"), ("choice", "Today is Monday"),
]
SW_PLANS = [
    ("choice", "Tomorrow"), ("choice", "Jana"), ("text", "Sasa"),
    ("choice", "Can you meet tomorrow?"), ("choice", "Yes, let's see each other tomorrow"),
    ("choice", "Baadaye"), ("text", "Leo"),
]
EN_DAYS = [
    ("choice", "Tuesday"), ("choice", "Saturday"), ("text", "Friday"),
    ("choice", "Friday"), ("choice", "Today is Monday."),
    ("choice", "Wednesday"), ("text", "Thursday"),
]
EN_PLANS = [
    ("choice", "Tomorrow"), ("choice", "Yesterday"), ("text", "Later"),
    ("choice", "Whether someone is available tomorrow"), ("choice", "Yes, see you tomorrow."),
    ("choice", "Now"), ("text", "Today"),
]
FR_DAYS = [
    ("choice", "Monday"), ("choice", "Vendredi"), ("text", "Dimanche"),
    ("choice", "Dimanche"), ("choice", "See you on Friday"),
    ("choice", "Mercredi"), ("text", "Jeudi"), ("choice", "Today is Monday"),
]
FR_PLANS = [
    ("choice", "Tomorrow"), ("choice", "Hier"), ("text", "Maintenant"),
    ("choice", "Are you free tomorrow?"), ("choice", "Yes, see you tomorrow!"),
    ("choice", "Plus tard"), ("text", "Aujourdhui"),  # Apostrophes are optional in typed answers.
]


def play_new_kiswahili_mix():
    smoke.tap("Home")
    smoke.scroll_to("1 question saved for this course")
    smoke.scroll_to("Play Quick Mix and collect stickers", direction="up")
    smoke.tap("Play Quick Mix and collect stickers")
    smoke.assert_sound_effects(True)
    smoke.tap("Sound effects", exact=True)
    smoke.assert_sound_effects(False)
    smoke.scroll_to("Mix questions from your completed Kiswahili lessons", direction="up")
    smoke.scroll_to("Play 3-question mix")
    smoke.tap("Play 3-question mix")
    # Only the two new Kiswahili lessons are completed, so any shuffled choice
    # must come from this set; typed-answer activities are not used in mixes.
    answers = {
        'What does "Jumatatu" mean?': "Monday",
        'Which word means "Friday"?': "Ijumaa",
        'Which day follows "Jumamosi"?': "Jumapili",
        'What does "Tutaonana Ijumaa" mean?': "We will see each other on Friday",
        'If today is "Jumanne", which day is tomorrow?': "Jumatano",
        'What does "Leo ni Jumatatu" mean?': "Today is Monday",
        'What does "Kesho" mean?': "Tomorrow",
        'Which word means "Yesterday"?': "Jana",
        'What does "Unaweza kukutana kesho?" ask?': "Can you meet tomorrow?",
        'What does "Ndiyo, tuonane kesho" mean?': "Yes, let's see each other tomorrow",
        'A friend suggests meeting after now. Which word means "later"?': "Baadaye",
    }
    seen = set()
    for index in range(3):
        question = smoke.wait_for_one_of(answers)
        if question in seen:
            raise RuntimeError(f"Duplicate Quick Mix question: {question}")
        seen.add(question)
        smoke.scroll_to(answers[question], direction="up", exact=True)
        smoke.tap(answers[question], exact=True)
        smoke.scroll_to("Check answer")
        smoke.tap("Check answer")
        smoke.wait_for("Lovely work! You found it.")
        action = "Finish mix" if index == 2 else "Next question"
        smoke.scroll_to(action)
        smoke.tap(action)
    smoke.wait_for("3 / 3 round stars")
    smoke.scroll_to("Play rewards saved on this device.")
    smoke.scroll_to("Done")
    smoke.tap("Done")
    # A mix must not award lesson XP or change the goal or review list.
    smoke.scroll_to("2 / 2", direction="up", exact=True)
    smoke.scroll_to("30 XP", exact=True)
    smoke.scroll_to("1 question saved for this course")


def review_new_question():
    smoke.scroll_to("Review missed questions")
    smoke.tap("Review missed questions")
    smoke.wait_for("1 question saved")
    smoke.scroll_to("Start review")
    smoke.tap("Start review")
    smoke.wait_for('What does "Jumatatu" mean?', exact=True)
    smoke.tap("Monday", exact=True)
    smoke.scroll_to("Check answer")
    smoke.tap("Check answer")
    smoke.wait_for("Correct! Removed from review.")
    smoke.scroll_to("Finish review")
    smoke.tap("Finish review")
    smoke.wait_for("1 of 1 answered correctly and removed.")
    smoke.scroll_to("Done")
    smoke.tap("Done")
    smoke.scroll_to("3 / 2", direction="up", exact=True)
    smoke.scroll_to("30 XP", exact=True)
    smoke.scroll_to("No questions saved for this course")


def main(apk):
    smoke.adb("install", "-r", str(apk))
    smoke.adb("shell", "pm", "clear", smoke.PACKAGE)
    smoke.adb("shell", "svc", "wifi", "disable", check=False)
    smoke.adb("shell", "svc", "data", "disable", check=False)
    smoke.adb("logcat", "-c")
    smoke.adb("shell", "am", "start", "-n", f"{smoke.PACKAGE}/.MainActivity")
    smoke.tap("Try the demo")
    smoke.wait_for("Choose a language")
    smoke.tap("Continue")
    smoke.wait_for("TODAY’S STUDY")
    smoke.scroll_to("2 sessions per day", exact=True)
    smoke.tap("2 sessions per day", exact=True)
    smoke.tap("Learn")

    smoke.complete_lesson("Days of the week", SW_DAYS, lesson_number=11, reward=15,
                          wrong_first=True, wrong_answer="Tuesday", listen=True,
                          sample_text="Jumatano", screenshot_name="planning-sw-days")
    smoke.complete_lesson("Making a plan", SW_PLANS, lesson_number=12, reward=15,
                          listen=True, sample_text="Unaweza kukutana kesho?", screenshot_name="planning-sw-meet")
    play_new_kiswahili_mix()
    review_new_question()

    smoke.change_course("English")
    smoke.complete_lesson("Days of the week", EN_DAYS, lesson_number=11, reward=15,
                          listen=True, sample_text="Wednesday", screenshot_name="planning-en-days")
    smoke.complete_lesson("Making a plan", EN_PLANS, lesson_number=12, reward=15,
                          listen=True, sample_text="Are you free tomorrow?", screenshot_name="planning-en-meet")
    smoke.change_course("French")
    smoke.complete_lesson("Days of the week", FR_DAYS, lesson_number=14, reward=15,
                          listen=True, sample_text="Mercredi", screenshot_name="planning-fr-days")
    smoke.complete_lesson("Making a plan", FR_PLANS, lesson_number=15, reward=15,
                          listen=True, sample_text="Tu es libre demain ?", screenshot_name="planning-fr-meet")
    smoke.complete_lesson("Making a plan", FR_PLANS, lesson_number=15, already_completed=True)
    smoke.tap("Home")
    smoke.scroll_to("8 / 2", direction="up", exact=True)
    smoke.scroll_to("90 XP", exact=True)
    smoke.scroll_to("Play Quick Mix and collect stickers", direction="up")
    smoke.tap("Play Quick Mix and collect stickers")
    smoke.assert_sound_effects(False)
    smoke.scroll_to("6 / 6 collected")
    smoke.screenshot("planning-rewards")
    smoke.tap("Go back", exact=True)
    smoke.adb("shell", "am", "force-stop", smoke.PACKAGE)
    smoke.adb("shell", "am", "start", "-n", f"{smoke.PACKAGE}/.MainActivity")
    smoke.wait_for("French")
    smoke.scroll_to("8 / 2", direction="up", exact=True)
    smoke.scroll_to("90 XP", exact=True)
    smoke.scroll_to("Play Quick Mix and collect stickers", direction="up")
    smoke.tap("Play Quick Mix and collect stickers")
    smoke.assert_sound_effects(False)
    smoke.scroll_to("6 / 6 collected")
    smoke.screenshot("planning-relaunch")
    print("Planning smoke passed offline: all six lessons and samples, review, new Quick Mix questions, XP, replay, goal, stickers and relaunch.", flush=True)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: smoke-android-planning.py path/to/app.apk")
    try:
        main(Path(sys.argv[1]))
    finally:
        smoke.screenshot("planning-last-screen")
        logs = smoke.adb("logcat", "-d", "-v", "time", "ReactNativeJS:V", "AndroidRuntime:E", "*:S", check=False)
        (smoke.OUT / "planning-logcat.txt").write_bytes(logs.stdout)
