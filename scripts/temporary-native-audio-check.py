#!/usr/bin/env python3
"""Temporary emulator check: observe the app's AudioFlinger track offline."""
import importlib.util
import re
import sys
import time
from pathlib import Path

spec = importlib.util.spec_from_file_location("android_smoke", Path(__file__).with_name("smoke-android-demo.py"))
smoke = importlib.util.module_from_spec(spec)
spec.loader.exec_module(smoke)


def annotation(title, message):
    message = str(message).replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")
    print(f"::notice title={title}::{message}", flush=True)


def active_tracks(dump, pids):
    found = {}
    for line in dump.splitlines():
        # Android 15 emulator dumps may show just the client PID, while newer
        # builds may show PID/UID and extra port-volume fields.
        match = re.match(r"\s*(?:F\d\s+)?(?:[SP?]\s+)?\d+\s+yes\s+(\d+)(?:\s*/\s*\d+)?\s+(.*)", line)
        if not match or match.group(1) not in pids:
            continue
        fields = match.group(2).split()
        # After the client: session, port, state, flags, format, mask, rate,
        # stream, usage, content type and four volume values precede Server.
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
    (smoke.OUT / f"native-audio-{name}.txt").write_text(text)
    relevant = [line.strip() for line in text.splitlines() if any(
        re.match(rf"\s*(?:F\d\s+)?(?:[SP?]\s+)?\d+\s+(?:yes|no)\s+{pid}(?:\s*/\s*\d+)?\s+", line)
        for pid in pids
    )]
    annotation(f"AudioFlinger {name}", " | ".join(relevant) or "No audio track for the app PID")
    if result.returncode != 0:
        raise RuntimeError(f"AudioFlinger dump failed: {result.stderr.decode('utf-8', 'replace')}")
    return active_tracks(text, pids)


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
    smoke.scroll_to("Lesson 1: Kiswahili Greetings")
    smoke.tap("Lesson 1: Kiswahili Greetings")
    smoke.scroll_to("Play pronunciation sample")
    pids = set(smoke.adb("shell", "pidof", smoke.PACKAGE).stdout.decode().split())
    if not pids:
        raise RuntimeError("Could not identify the demo process")
    smoke.tap("Play pronunciation sample")
    time.sleep(1)
    first = dump("playing-1", pids)
    time.sleep(1)
    second = dump("playing-2", pids)
    if not any(second.get(key, -1) > value for key, value in first.items()):
        raise RuntimeError(f"Native audio frame counter did not advance: first={first}, second={second}")
    smoke.tap("Stop pronunciation sample")
    time.sleep(2)
    stopped = dump("stopped", pids)
    if stopped:
        raise RuntimeError(f"A native audio track remained active after Stop: {stopped}")
    annotation("Native pronunciation passed", f"Offline playback advanced audio frames and stopped; app PIDs {sorted(pids)}")
    print("Native offline pronunciation played, advanced and stopped.", flush=True)


if __name__ == "__main__":
    try:
        main(Path(sys.argv[1]))
    except Exception as error:
        annotation("Native pronunciation failure", repr(error))
        raise
    finally:
        smoke.screenshot("native-audio-last-screen")
        logs = smoke.adb("logcat", "-d", "-v", "time", "ExoPlayerImpl:V", "AudioTrack:V", "ReactNativeJS:V", "AndroidRuntime:E", "*:S", check=False)
        (smoke.OUT / "native-audio-logcat.txt").write_bytes(logs.stdout)
