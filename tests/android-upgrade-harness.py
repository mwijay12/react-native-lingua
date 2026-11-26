#!/usr/bin/env python3
"""Exercise the upgrade scenario orchestration without an emulator or real data."""
import importlib.util
import os
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class FakeSmoke:
    PACKAGE = "com.jsmastery.duolingoclone.demo"

    def __init__(self):
        self.calls = []

    def __getattr__(self, name):
        def record(*args, **kwargs):
            self.calls.append((name, args, kwargs))
        return record


def check_scenario(upgrade, old_total):
    fake = FakeSmoke()
    upgrade.smoke = fake
    if old_total == 10:
        # Keep the original planning-upgrade entry point working.
        upgrade.main(Path("baseline.apk"), Path("current.apk"))
    else:
        # The P0 wrapper passes the baseline's actual pre-existing lesson count.
        upgrade.main(Path("baseline.apk"), Path("current.apk"), old_english_total=old_total)

    calls = fake.calls
    installs = [index for index, (name, args, _) in enumerate(calls)
                if name == "adb" and args[:2] == ("install", "-r")]
    clears = [index for index, (name, args, _) in enumerate(calls)
              if name == "adb" and args[:3] == ("shell", "pm", "clear")]
    assert len(installs) == 2 and len(clears) == 1
    assert installs[0] < clears[0] < installs[1], "Never clear app data after the upgrade"
    before = [args[0] for name, args, _ in calls[:installs[1]] if name == "scroll_to"]
    after = [args[0] for name, args, _ in calls[installs[1]:] if name == "scroll_to"]
    assert f"0 / {old_total} lessons" in before
    assert "0 / 12 lessons" in after
    assert "25 XP" in before and "25 XP" in after and "40 XP" in after
    assert "3 / 6 collected" in before and "3 / 6 collected" in after
    assert "4 / 6 collected" in after
    baseline_samples = [kwargs for name, _, kwargs in calls[:installs[1]]
                        if name == "complete_lesson" and kwargs.get("listen")]
    current_samples = [kwargs for name, _, kwargs in calls[installs[1]:]
                       if name == "complete_lesson" and kwargs.get("listen")]
    assert len(baseline_samples) == 1 and baseline_samples[0].get("slow_sample") is False
    assert len(current_samples) == 1 and current_samples[0].get("slow_sample", True) is True


# Imported smoke helpers make a diagnostics directory; keep it temporary.
with tempfile.TemporaryDirectory(prefix="lingua-upgrade-unit-") as temporary:
    os.chdir(temporary)
    spec = importlib.util.spec_from_file_location("planning_upgrade", ROOT / "scripts/smoke-android-planning-upgrade.py")
    upgrade = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(upgrade)
    # Both the old test APK and the current preview must remain usable as
    # synthetic baselines after the onboarding label changes.
    helpers = upgrade.smoke
    captured = []
    for label in ("Try the demo", "Continue without an account"):
        helpers.wait_for_one_of = lambda options, label=label: label if label in options else None
        helpers.tap = lambda text, exact=False: captured.append((text, exact))
        helpers.tap_onboarding()
    assert captured == [("Try the demo", True), ("Continue without an account", True)]
    check_scenario(upgrade, 10)
    check_scenario(upgrade, 12)
print("Upgrade orchestration passed with the historical and P0 baseline lesson counts.")
