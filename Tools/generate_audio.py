#!/usr/bin/env python3
"""Deterministic, original PCM16 assets. No downloads or third-party sound libraries."""
import math
import struct
import wave
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1] / 'Content' / 'Audio'
RATE = 22050

def write(name, duration, sample):
    with wave.open(str(ROOT / name), 'wb') as out:
        out.setparams((1, 2, RATE, 0, 'NONE', 'not compressed'))
        out.writeframes(b''.join(struct.pack('<h', max(-32768, min(32767, int(sample(i / RATE) * 32767)))) for i in range(round(duration * RATE))))

def main():
    ROOT.mkdir(parents=True, exist_ok=True)
    write('ambient_hum.wav', 8, lambda t: .16 * math.sin(2 * math.pi * 55 * t) + .04 * math.sin(2 * math.pi * 110 * t) + .025 * math.sin(2 * math.pi * 220 * t))
    write('ui_confirm.wav', .24, lambda t: math.sin(2 * math.pi * 880 * t) * .24 * math.sin(math.pi * t / .24) ** 2)
    write('alarm_tone.wav', 1, lambda t: math.sin(2 * math.pi * (440 if int(t * 4) % 2 == 0 else 660) * t) * .2 * math.sin(math.pi * (t % .25) / .25) ** 2)

if __name__ == '__main__':
    main()
