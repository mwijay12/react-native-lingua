#!/usr/bin/env python3
"""Create Lingua's original, quiet feedback chimes without third-party samples."""
import math
import struct
import wave
from pathlib import Path

RATE = 24000
OUTPUT = Path(__file__).resolve().parents[1] / "assets" / "audio" / "effects"


def make_chime(name, length, notes):
    frames = bytearray()
    for frame in range(round(length * RATE)):
        time = frame / RATE
        sample = 0.0
        for start, frequency, duration in notes:
            elapsed = time - start
            if 0 <= elapsed < duration:
                # A soft attack and decay avoid clicks and a harsh digital beep.
                attack = min(1.0, elapsed / 0.012)
                release = min(1.0, (duration - elapsed) / 0.025)
                envelope = attack * release * math.exp(-3.0 * elapsed / duration)
                tone = math.sin(2 * math.pi * frequency * elapsed)
                tone += 0.22 * math.sin(4 * math.pi * frequency * elapsed)
                sample += 0.14 * envelope * tone
        frames.extend(struct.pack("<h", max(-32768, min(32767, round(sample * 32767)))))
    with wave.open(str(OUTPUT / f"{name}.wav"), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(frames)


if __name__ == "__main__":
    OUTPUT.mkdir(parents=True, exist_ok=True)
    make_chime("correct", 0.42, [(0.0, 659.25, 0.24), (0.11, 783.99, 0.29)])
    make_chime("celebration", 0.82, [(0.0, 523.25, 0.32), (0.12, 659.25, 0.34), (0.25, 783.99, 0.50)])
    print(f"Created feedback sounds in {OUTPUT}")
