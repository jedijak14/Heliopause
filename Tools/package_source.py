#!/usr/bin/env python3
"""Build a deterministic source archive from a clean committed tree, never Saved/ or credentials."""
import hashlib
import json
import subprocess
import zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)
if git('status', '--porcelain').strip():
    raise SystemExit('Commit project files first; source release requires a clean tree.')
revision = git('rev-parse', 'HEAD').decode().strip()
files = git('ls-files', '-z').decode().strip('\0').split('\0')
folder = 'Heliopause-v0.1.0-source-preview'
output = ROOT / 'Artifacts' / (folder + '.zip')
output.parent.mkdir(exist_ok=True)
manifest = {'revision': revision, 'engineAssociation': '5.8', 'unrealBuildVerified': False, 'files': {}}
with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    def add(name, data):
        info = zipfile.ZipInfo(folder + '/' + name, date_time=(2026, 10, 25, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = (0o100755 if name.endswith('.sh') else 0o100644) << 16
        archive.writestr(info, data)
    for name in sorted(files):
        data = (ROOT / name).read_bytes()
        manifest['files'][name] = hashlib.sha256(data).hexdigest()
        add(name, data)
    add('SOURCE-MANIFEST.json', (json.dumps(manifest, indent=2) + '\n').encode())
checksum = hashlib.sha256(output.read_bytes()).hexdigest()
output.with_suffix('.zip.sha256').write_text(f'{checksum}  {output.name}\n')
print(f'{output}\n{checksum}\nRevision: {revision}\nTracked files: {len(files)}')
