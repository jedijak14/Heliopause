#!/usr/bin/env python3
"""Original quiet respiratory foley. Procedural synthesis, NOT a human recording.
Asymmetric inhale/exhale, irregular timing, low-pass air and subtle cloth movement.
Optional and disabled by default in game; no periodic sine-tone breathing hiss.
"""
import math, random, struct, wave
from pathlib import Path
rate=22050;rng=random.Random(442);audio=[];low=slow=0.
for period in [5.4,5.9,5.2,6.1]:
    for i in range(round(period*rate)):
        t=i/rate
        inhale=(math.sin(math.pi*t/1.55)**2 if t<1.55 else 0)
        exhale=(math.sin(math.pi*(t-2.05)/2.1)**2 if 2.05<t<4.15 else 0)
        noise=rng.uniform(-1,1);low+=.14*(noise-low);slow+=.025*(noise-slow)
        air=(low-slow)*(inhale*.24+exhale*.16)
        cloth=slow*.022*inhale*(1+.2*math.sin(t*13))
        audio.append(max(-1,min(1,air+cloth)))
p=Path(__file__).resolve().parents[1]/'Content/Audio/breathing_foley.wav'
with wave.open(str(p),'wb') as w:
    w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate)
    w.writeframes(b''.join(struct.pack('<h',round(v*32767)) for v in audio))
print(f'Generated optional synthetic respiratory foley: {p.name}')
