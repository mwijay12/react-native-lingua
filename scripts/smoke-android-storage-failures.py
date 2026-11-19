#!/usr/bin/env python3
"""Inject synthetic storage faults into an isolated test-emulator installation.

This script clears the DEMO package once, then replaces only its synthetic test
files. It refuses physical devices and requires a rootable emulator. Never run
it on a device or installation containing data you want to keep.
"""
import hashlib
import importlib.util
import json
import shutil
import sqlite3
import subprocess
import sys
import tempfile
from pathlib import Path


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


smoke = load("android_smoke", "smoke-android-demo.py")
safety = load("p0_upgrade", "smoke-android-p0-upgrade.py")
REMOTE = f"/data/user/0/{smoke.PACKAGE}/databases/RKStorage"
SCOPED = f"/data/user/0/{smoke.PACKAGE}/databases/RKStorage-scoped-experience-test"
SIDECARS = ("", "-wal", "-shm", "-journal")


def shell(*args, check=True):
    return smoke.adb("shell", *args, check=check)


def exists(remote):
    return shell("test", "-f", remote, check=False).returncode == 0


def force_stop():
    shell("am", "force-stop", smoke.PACKAGE)


def launch():
    shell("am", "start", "-n", f"{smoke.PACKAGE}/.MainActivity")


def replace_test_files(source, remote, owner):
    # These are only synthetic files in the isolated demo's app directory.
    force_stop()
    for name in [REMOTE + suffix for suffix in SIDECARS] + [SCOPED]:
        shell("rm", "-f", name)
    smoke.adb("push", str(source), remote)
    shell("chown", owner, remote)
    shell("chmod", "600", remote)
    shell("restorecon", remote, check=False)


def pull_database(destination):
    if not exists(REMOTE):
        raise AssertionError("Test database disappeared")
    smoke.adb("pull", REMOTE, str(destination))
    for suffix in SIDECARS[1:]:
        if exists(REMOTE + suffix):
            smoke.adb("pull", REMOTE + suffix, str(destination) + suffix)


def read_snapshot(destination):
    pull_database(destination)
    with sqlite3.connect(destination) as connection:
        version = connection.execute("PRAGMA user_version").fetchone()[0]
        tables = {row[0] for row in connection.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        table = "catalystLocalStorage" if "catalystLocalStorage" in tables else "catalyst_saved"
        rows = dict(connection.execute(f"SELECT key, value FROM {table}"))
        return version, tables, rows


def assert_blocked(title, message, screenshot, location=None):
    launch()
    if location == "play":
        smoke.wait_for("TODAY’S STUDY")
        smoke.scroll_to("Play Quick Mix and collect stickers", direction="up")
        smoke.tap("Play Quick Mix and collect stickers")
    elif location == "audio":
        smoke.wait_for("TODAY’S STUDY")
        smoke.tap("Profile")
        smoke.scroll_to("Sound effects", exact=True)
    if title:
        smoke.wait_for(title)
    smoke.wait_for(message)
    smoke.tap("Retry sound settings" if location == "audio" else "Try again", exact=True)
    if title:
        smoke.wait_for(title)
    smoke.wait_for(message)
    smoke.screenshot(screenshot)
    force_stop()


def main(apk):
    safety.require_isolated_emulator()
    root = smoke.adb("root", check=False)
    print(root.stdout.decode("utf-8", "replace"), flush=True)
    smoke.adb("wait-for-device")
    if shell("id", "-u").stdout.decode().strip() != "0":
        raise RuntimeError("The isolated emulator must support adb root for controlled fault injection.")
    safety.require_isolated_emulator()
    smoke.adb("install", "-r", str(apk))
    shell("pm", "clear", smoke.PACKAGE)  # Only the initial synthetic test profile.
    shell("svc", "wifi", "disable", check=False)
    shell("svc", "data", "disable", check=False)
    smoke.adb("logcat", "-c")
    launch()
    smoke.tap_onboarding()
    smoke.wait_for("Choose a language")
    smoke.tap("Continue")
    smoke.wait_for("TODAY’S STUDY")
    smoke.scroll_to("2 sessions per day", exact=True)
    smoke.tap("2 sessions per day", exact=True)
    smoke.scroll_to("SAVED ON DEVICE")
    force_stop()

    owner = shell("stat", "-c", "%u:%g", REMOTE).stdout.decode().strip()
    if not owner or ":" not in owner:
        raise RuntimeError("Could not determine the synthetic database owner")
    with tempfile.TemporaryDirectory(prefix="lingua-p0-storage-") as temporary:
        temp = Path(temporary)
        pulled = temp / "original.sqlite"
        pull_database(pulled)
        # SQLite backup merges any copied WAL into a self-contained fixture.
        baseline = temp / "baseline.sqlite"
        with sqlite3.connect(pulled) as source, sqlite3.connect(baseline) as target:
            source.backup(target)
        with sqlite3.connect(baseline) as db:
            # Add synthetic, valid v1 records so failures can be tested without
            # playing a round or changing a real preference.
            db.executemany("INSERT OR REPLACE INTO catalystLocalStorage VALUES (?, ?)", [
                ("play-storage", json.dumps({"state": {"roundsCompleted": 4, "perfectRounds": 2}, "version": 1})),
                ("audio-settings", json.dumps({"state": {"effectsEnabled": False}, "version": 1})),
            ])
            original = dict(db.execute("SELECT key, value FROM catalystLocalStorage"))
        assert json.loads(original["learning-storage"])["state"]["dailyGoal"] == 2
        assert json.loads(original["language-storage"])["state"]["selectedLanguage"] == "sw"

        for name, key, value, title, message, location in [
            ("empty-progress", "learning-storage", "", "Progress could not be loaded", "unexpected or damaged format", None),
            ("empty-course", "language-storage", "", "Course could not be loaded", "unexpected or damaged format", None),
            ("newer-progress", "learning-storage", json.dumps({"state": {"future": "keep"}, "version": 99}),
             "Progress could not be loaded", "newer app version", None),
            ("empty-play", "play-storage", "", "Play rewards could not be loaded", "unexpected or damaged format", "play"),
            ("empty-audio", "audio-settings", "", None, "Sound settings have an unexpected format", "audio"),
        ]:
            fixture = temp / f"{name}.sqlite"
            shutil.copyfile(baseline, fixture)
            with sqlite3.connect(fixture) as db:
                db.execute("UPDATE catalystLocalStorage SET value=? WHERE key=?", (value, key))
            expected = dict(original, **{key: value})
            replace_test_files(fixture, REMOTE, owner)
            assert_blocked(title, message, f"p0-{name}", location)
            version, tables, actual = read_snapshot(temp / f"after-{name}.sqlite")
            assert version == 1 and "catalystLocalStorage" in tables and actual == expected, name
            print(f"Preserved synthetic {name} record after retry", flush=True)

        for version in (0, 2):
            fixture = temp / f"database-version-{version}.sqlite"
            shutil.copyfile(baseline, fixture)
            with sqlite3.connect(fixture) as db:
                db.execute(f"PRAGMA user_version={version}")
            replace_test_files(fixture, REMOTE, owner)
            assert_blocked("Course could not be loaded", "Check your device storage", f"p0-database-version-{version}")
            actual_version, tables, actual = read_snapshot(temp / f"after-version-{version}.sqlite")
            assert actual_version == version and "catalystLocalStorage" in tables and actual == original
            print(f"Preserved synthetic database with unexpected version {version}", flush=True)

        fixture = temp / "missing-table.sqlite"
        shutil.copyfile(baseline, fixture)
        with sqlite3.connect(fixture) as db:
            db.execute("ALTER TABLE catalystLocalStorage RENAME TO catalyst_saved")
        replace_test_files(fixture, REMOTE, owner)
        assert_blocked("Course could not be loaded", "Check your device storage", "p0-missing-table")
        version, tables, actual = read_snapshot(temp / "after-missing-table.sqlite")
        assert version == 1 and "catalystLocalStorage" not in tables and actual == original
        print("Preserved synthetic database with an unexpected table", flush=True)

        fixture = temp / "corrupt.sqlite"
        fixture.write_bytes(b"LINGUA SYNTHETIC CORRUPT DATABASE\x00" * 128)
        expected_hash = hashlib.sha256(fixture.read_bytes()).hexdigest()
        replace_test_files(fixture, REMOTE, owner)
        assert_blocked("Course could not be loaded", "Check your device storage", "p0-corrupt-database")
        assert exists(REMOTE), "Corrupt synthetic database was deleted"
        actual = smoke.adb("exec-out", "cat", REMOTE).stdout
        assert hashlib.sha256(actual).hexdigest() == expected_hash, "Corrupt synthetic database changed"
        print("Preserved the exact bytes of a synthetic corrupt database", flush=True)

        replace_test_files(baseline, SCOPED, owner)
        expected_hash = hashlib.sha256(baseline.read_bytes()).hexdigest()
        assert_blocked("Course could not be loaded", "Check your device storage", "p0-legacy-scoped")
        assert not exists(REMOTE), "A fresh database was created over ambiguous legacy storage"
        assert hashlib.sha256(smoke.adb("exec-out", "cat", SCOPED).stdout).hexdigest() == expected_hash
        print("Preserved synthetic scoped legacy storage without creating a fresh database", flush=True)

    print("P0 Android storage fault checks passed on an isolated emulator.", flush=True)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: smoke-android-storage-failures.py current.apk")
    safety.require_isolated_emulator()
    try:
        main(Path(sys.argv[1]))
    finally:
        smoke.screenshot("p0-storage-last-screen")
        logs = smoke.adb("logcat", "-d", "-v", "time", "ReactNativeJS:V", "AndroidRuntime:E", "*:S", check=False)
        (smoke.OUT / "p0-storage-logcat.txt").write_bytes(logs.stdout)
