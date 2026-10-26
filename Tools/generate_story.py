#!/usr/bin/env python3
import json,sys
from pathlib import Path
r=Path(__file__).resolve().parents[1];d=json.loads((r/'Shared/story.json').read_text())
s='#pragma once\n// Generated from Shared/story.json.\nstruct FHPStoryCue { const char* Id; const char* Text; float Duration; };\ninline constexpr FHPStoryCue HPStoryCues[]={\n'
for l in d['lines']:s+='    {'+json.dumps(l['id'])+','+json.dumps(l['text'])+','+str(l['duration'])+'f},\n'
s+='};\n';p=r/'Source/Heliopause/Public/StoryCatalog.h'
if '--check' in sys.argv:assert p.read_text()==s;print('PASS: native/browser dialogue catalog synchronized')
else:p.write_text(s)
