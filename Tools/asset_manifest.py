#!/usr/bin/env python3
import argparse
import hashlib
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--check', action='store_true')
args = parser.parse_args()
manifest = {p.relative_to(ROOT).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted((ROOT / 'Content').rglob('*.wav'))}
path = ROOT / 'Content' / 'asset-manifest.json'
if args.check:
    assert json.loads(path.read_text()) == manifest, 'Assets differ from the checked-in manifest'
    print(f'PASS: {len(manifest)} asset hashes match')
else:
    path.write_text(json.dumps(manifest, indent=2) + '\n')
