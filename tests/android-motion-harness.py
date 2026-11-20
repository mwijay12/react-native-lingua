#!/usr/bin/env python3
"""Check motion-smoke safety and orchestration with a fake adb, not a device."""
import importlib.util
import os
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path
from types import SimpleNamespace

ROOT = Path(__file__).resolve().parents[1]


class FakeSmoke:
    PACKAGE = "com.jsmastery.duolingoclone.demo"

    def __init__(self, output):
        self.OUT = output
        self.calls = []
        self.questions = iter(('What does "Asante" mean?', 'Which word means "Goodbye"?'))
        self.unit = None
        self.description_bottom = 382

    def adb(self, *args, **kwargs):
        self.calls.append(("adb", args, os.environ.get("ANDROID_SERIAL")))
        if args[:4] == ("shell", "settings", "get", "global"):
            return SimpleNamespace(stdout=b"0.0\n")
        if args == ("shell", "wm", "density"):
            return SimpleNamespace(stdout=b"Physical density: 160\n", returncode=0)
        return SimpleNamespace(stdout=b"", returncode=0)

    def screen_size(self):
        self.calls.append(("screen_size", (), os.environ.get("ANDROID_SERIAL")))
        return (400, 800)

    def scroll_to(self, text, **kwargs):
        self.calls.append(("scroll_to", (text,), os.environ.get("ANDROID_SERIAL")))
        self.unit = next((unit for unit in motion.UNITS if unit[1] == text), None)

    def dump_ui(self):
        self.calls.append(("dump_ui", (), os.environ.get("ANDROID_SERIAL")))
        root = ET.Element("hierarchy")
        if self.unit:
            unit, _description, lesson = self.unit
            for resource, bounds in (
                (f"unit-header-{unit}", "[20,100][380,400]"),
                (f"unit-scene-{unit}", "[20,100][380,280]"),
                (f"unit-description-{unit}", f"[36,340][300,{self.description_bottom}]"),
                (f"lesson-card-{lesson}", "[20,412][380,540]"),
            ):
                ET.SubElement(root, "node", {"resource-id": resource, "bounds": bounds})
        return root

    def wait_for_one_of(self, _options):
        return next(self.questions)

    def wait_for(self, *args, **kwargs):
        self.calls.append(("wait_for", args, os.environ.get("ANDROID_SERIAL")))
        return (0, 0, 100, 150)

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
    motion.time.sleep = lambda _duration: None
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
    assert [args[0] for kind, args, _ in fake.calls if kind == "wait_for" and args].count("Check answer") == 4
    taps = [args for args in adb_calls if args[:3] == ("shell", "input", "swipe")]
    assert len(taps) == 12
    assert all(args[3:] == ("100", "150", "100", "150", "120") for args in taps)

    too_tight = FakeSmoke(Path(temporary))
    too_tight.description_bottom = 386  # 14 dp below the description is too little.
    motion.smoke = too_tight
    try:
        motion.check_unit_layouts()
        raise AssertionError("Too little unit description padding must fail")
    except AssertionError as error:
        assert "padding=14.0dp" in str(error)

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
