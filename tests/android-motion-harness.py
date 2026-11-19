#!/usr/bin/env python3
"""Check motion-smoke safety and orchestration with a fake adb, not a device."""
import importlib.util
import os
import tempfile
from pathlib import Path
from types import SimpleNamespace

ROOT = Path(__file__).resolve().parents[1]


class FakeSmoke:
    PACKAGE = "com.jsmastery.duolingoclone.demo"

    def __init__(self, output):
        self.OUT = output
        self.calls = []
        self.questions = iter(('What does "Asante" mean?', 'Which word means "Goodbye"?'))

    def adb(self, *args, **kwargs):
        self.calls.append(("adb", args, os.environ.get("ANDROID_SERIAL")))
        if args[:4] == ("shell", "settings", "get", "global"):
            return SimpleNamespace(stdout=b"0.0\n")
        return SimpleNamespace(stdout=b"", returncode=0)

    def wait_for_one_of(self, _options):
        return next(self.questions)

    def __getattr__(self, name):
        def record(*args, **kwargs):
            self.calls.append((name, args, os.environ.get("ANDROID_SERIAL")))
        return record


with tempfile.TemporaryDirectory(prefix="lingua-motion-unit-") as temporary:
    os.chdir(temporary)  # Imported helpers create only temporary diagnostics.
    spec = importlib.util.spec_from_file_location("motion_smoke", ROOT / "scripts/smoke-android-motion.py")
    motion = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(motion)
    fake = FakeSmoke(Path(temporary))
    motion.smoke = fake
    guard_calls = []
    motion.safety.require_isolated_emulator = lambda: guard_calls.append(os.environ.get("ANDROID_SERIAL"))

    os.environ.pop("LINGUA_SYNTHETIC_EMULATOR", None)
    motion.subprocess.check_output = lambda *args, **kwargs: (_ for _ in ()).throw(AssertionError("adb should not run"))
    try:
        motion.main(Path("test.apk"))
        raise AssertionError("Missing opt-in must fail")
    except RuntimeError as error:
        assert "LINGUA_SYNTHETIC_EMULATOR" in str(error)
    assert not fake.calls

    os.environ["LINGUA_SYNTHETIC_EMULATOR"] = "1"
    motion.subprocess.check_output = lambda *args, **kwargs: "physical-device\n"
    try:
        motion.main(Path("test.apk"))
        raise AssertionError("A physical device must be rejected")
    except RuntimeError as error:
        assert "emulator" in str(error)
    assert not fake.calls

    motion.subprocess.check_output = lambda *args, **kwargs: "emulator-5554\n"
    motion.main(Path("test.apk"))
    assert guard_calls == ["emulator-5554", "emulator-5554"]
    assert all(serial == "emulator-5554" for _, _, serial in fake.calls)
    adb_calls = [args for kind, args, _ in fake.calls if kind == "adb"]
    clear = [args for args in adb_calls if args[:3] == ("shell", "pm", "clear")]
    assert clear == [("shell", "pm", "clear", fake.PACKAGE)]
    for scale in motion.SCALES:
        assert ("shell", "settings", "put", "global", scale, "1") in adb_calls
        assert ("shell", "settings", "put", "global", scale, "0") in adb_calls
        assert ("shell", "settings", "put", "global", scale, "0.0") in adb_calls
    assert [args[0] for kind, args, _ in fake.calls if kind == "tap" and args].count("Check answer") == 2

    failed = FakeSmoke(Path(temporary))
    def fail_startup(*args, **kwargs):
        raise RuntimeError("Synthetic launch failure")
    failed.wait_for = fail_startup
    motion.smoke = failed
    try:
        motion.main(Path("test.apk"))
        raise AssertionError("The synthetic launch failure must propagate")
    except RuntimeError as error:
        assert "Synthetic launch failure" in str(error)
    failed_adb = [args for kind, args, _ in failed.calls if kind == "adb"]
    for scale in motion.SCALES:
        assert ("shell", "settings", "put", "global", scale, "0.0") in failed_adb

print("Motion smoke requires a synthetic emulator, pins its serial and restores animation settings.")
