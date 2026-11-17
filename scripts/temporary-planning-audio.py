#!/usr/bin/env python3
"""Temporary check that each new offline sample advances and stops natively."""
import importlib.util
import re
import sys
import time
from pathlib import Path

spec = importlib.util.spec_from_file_location("android_smoke", Path(__file__).with_name("smoke-android-demo.py"))
smoke = importlib.util.module_from_spec(spec)
spec.loader.exec_module(smoke)


def active_tracks(text, pids):
    found = {}
    for line in text.splitlines():
        match = re.match(r"\s*(?:F\d\s+)?(?:[SP?]\s+)?\d+\s+yes\s+(\d+)(?:\s*/\s*\d+)?\s+(.*)", line)
        if not match or match.group(1) not in pids:
            continue
        fields = match.group(2).split()
        if len(fields) > 14:
            index = 16 if len(fields) > 16 and fields[15] in ("true", "false") else 14
            try:
                found[(match.group(1), fields[0], fields[1])] = int(fields[index], 16)
            except ValueError:
                pass
    return found


def dump(name, pids):
    result = smoke.adb("shell", "dumpsys", "media.audio_flinger", check=False)
    text = result.stdout.decode("utf-8", "replace")
    (smoke.OUT / f"planning-audio-{name}.txt").write_text(text)
    if result.returncode != 0:
        raise RuntimeError(f"AudioFlinger dump failed: {result.stderr.decode('utf-8', 'replace')}")
    return active_tracks(text, pids)


def check_sample(code, title, number, pids):
    label = f"Lesson {number}: {title}"
    smoke.scroll_to(label)
    smoke.tap(label)
    smoke.scroll_to("Play pronunciation sample")
    smoke.tap("Play pronunciation sample")
    time.sleep(1)
    first = dump(f"{code}-{number}-first", pids)
    time.sleep(1)
    second = dump(f"{code}-{number}-second", pids)
    if not any(second.get(key, -1) > value for key, value in first.items()):
        raise RuntimeError(f"{label}: native frame counter did not advance: {first}, {second}")
    smoke.tap("Stop pronunciation sample")
    time.sleep(2)
    stopped = dump(f"{code}-{number}-stopped", pids)
    if stopped:
        raise RuntimeError(f"{label}: a track remained active after Stop: {stopped}")
    print(f"{code} {label}: native frames {first} -> {second}; stopped cleanly", flush=True)
    smoke.tap("Go back", exact=True)
    smoke.wait_for("Choose a lesson")


def main(apk):
    smoke.adb("install", "-r", str(apk))
    smoke.adb("shell", "pm", "clear", smoke.PACKAGE)
    smoke.adb("shell", "svc", "wifi", "disable", check=False)
    smoke.adb("shell", "svc", "data", "disable", check=False)
    smoke.adb("logcat", "-c")
    smoke.adb("shell", "am", "start", "-n", f"{smoke.PACKAGE}/.MainActivity")
    smoke.tap("Try the demo")
    smoke.tap("Continue")
    smoke.wait_for("TODAY’S STUDY")
    smoke.tap("Learn")
    pids = set(smoke.adb("shell", "pidof", smoke.PACKAGE).stdout.decode().split())
    if not pids:
        raise RuntimeError("Could not identify the demo process")
    for code, language, number in [("sw", "Kiswahili", 11), ("en", "English", 11), ("fr", "French", 14)]:
        if code != "sw":
            smoke.change_course(language)
        check_sample(code, "Days of the week", number, pids)
        check_sample(code, "Making a plan", number + 1, pids)
    print("Six new samples advanced and stopped in Android AudioFlinger with network disabled.", flush=True)


if __name__ == "__main__":
    try:
        main(Path(sys.argv[1]))
    finally:
        smoke.screenshot("planning-audio-last-screen")
        logs = smoke.adb("logcat", "-d", "-v", "time", "ExoPlayerImpl:V", "AudioTrack:V", "ReactNativeJS:V", "AndroidRuntime:E", "*:S", check=False)
        (smoke.OUT / "planning-audio-logcat.txt").write_bytes(logs.stdout)
