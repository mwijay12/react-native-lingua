#!/usr/bin/env python3
"""Test the P0 in-place upgrade on an isolated Android emulator only.

Usage: python3 scripts/smoke-android-p0-upgrade.py baseline.apk current.apk
The first install's demo data is cleared to create a synthetic learner. Never
use this script on a device or on data that needs to be kept.
"""
import importlib.util
import subprocess
import sys
from pathlib import Path


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


smoke = load("android_smoke", "smoke-android-demo.py")
upgrade = load("planning_upgrade", "smoke-android-planning-upgrade.py")


def require_isolated_emulator():
    serial = subprocess.check_output(["adb", "get-serialno"], text=True).strip()
    emulator = smoke.adb("shell", "getprop", "ro.kernel.qemu").stdout.decode().strip()
    if not serial.startswith("emulator-") or emulator != "1" or smoke.PACKAGE != "com.jsmastery.duolingoclone.demo":
        raise RuntimeError("Refusing to clear data: this test requires the isolated Lingua demo emulator.")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: smoke-android-p0-upgrade.py baseline.apk current.apk")
    require_isolated_emulator()
    try:
        # The selected baseline already contains the two planning lessons.
        upgrade.main(Path(sys.argv[1]), Path(sys.argv[2]), old_english_total=12)
    finally:
        smoke.screenshot("p0-upgrade-last-screen")
        logs = smoke.adb("logcat", "-d", "-v", "time", "ReactNativeJS:V", "AndroidRuntime:E", "*:S", check=False)
        (smoke.OUT / "p0-upgrade-logcat.txt").write_bytes(logs.stdout)
