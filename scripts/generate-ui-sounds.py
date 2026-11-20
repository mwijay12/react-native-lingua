#!/usr/bin/env python3
"""Generate Lingua's short, original offline UI sounds (no sampled audio)."""
import math
import struct
import wave
from pathlib import Path

RATE = 24000
OUTPUT = Path(__file__).resolve().parents[1] / "assets" / "audio" / "effects"


def smooth_step(value):
    value = max(0.0, min(1.0, value))
    return value * value * (3.0 - 2.0 * value)


def make_sound(name, length, notes):
    """Mix (start, duration, start Hz, end Hz, gain, decay) notes with soft edges."""
    samples = []
    for frame in range(round(length * RATE)):
        time = frame / RATE
        sample = 0.0
        for start, duration, frequency, end_frequency, gain, decay in notes:
            elapsed = time - start
            if 0 <= elapsed < duration:
                attack = smooth_step(elapsed / 0.012)
                release = smooth_step((duration - elapsed) / 0.035)
                envelope = attack * release * math.exp(-decay * elapsed / duration)
                # Integrate a linear pitch glide; its phase remains continuous.
                phase = 2 * math.pi * (frequency * elapsed + (end_frequency - frequency) * elapsed ** 2 / (2 * duration))
                tone = math.sin(phase) + 0.16 * math.sin(phase * 2)
                sample += gain * envelope * tone
        samples.append(sample)

    peak = max(abs(sample) for sample in samples)
    if peak >= 0.5:
        raise ValueError(f"{name} has insufficient headroom: {peak:.3f}")
    frames = b"".join(struct.pack("<h", round(sample * 32767)) for sample in samples)
    with wave.open(str(OUTPUT / f"{name}.wav"), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(frames)
    print(f"{name}: {length:.2f}s, peak {peak:.3f}")


if __name__ == "__main__":
    OUTPUT.mkdir(parents=True, exist_ok=True)
    # Two bright ascending notes with a little overlap and a soft tail.
    make_sound("correct", 0.32, [
        (0.00, 0.19, 659.25, 659.25, 0.15, 2.0),
        (0.12, 0.20, 880.00, 880.00, 0.15, 2.0),
    ])
    # Two low, downward-gliding thuds, deliberately unlike the success sound.
    make_sound("wrong", 0.24, [
        (0.00, 0.10, 360.00, 270.00, 0.14, 2.7),
        (0.105, 0.13, 250.00, 180.00, 0.13, 2.7),
    ])
    # Four rising notes: a small fanfare rather than a long interruption.
    make_sound("celebration", 0.72, [
        (0.00, 0.25, 523.25, 523.25, 0.13, 2.0),
        (0.12, 0.25, 659.25, 659.25, 0.13, 2.0),
        (0.24, 0.25, 783.99, 783.99, 0.13, 2.0),
        (0.36, 0.36, 1046.50, 1046.50, 0.13, 2.0),
    ])
    # A very quiet, brief option tick.
    make_sound("option", 0.06, [
        (0.00, 0.06, 1050.00, 800.00, 0.065, 2.4),
    ])
    print(f"Created feedback sounds in {OUTPUT}")
