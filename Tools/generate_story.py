#!/usr/bin/env python3
import json,sys
from pathlib import Path
r=Path(__file__).resolve().parents[1];d=json.loads((r/'Shared/story.json').read_text());d['lines']+=json.loads((r/'Shared/commander.json').read_text())['lines']
s='#pragma once\n// Generated from Shared/story.json and Shared/commander.json.\nstruct FHPStoryCue { const char* Id; const char* Text; float Duration; const char* Speaker; };\ninline constexpr FHPStoryCue HPStoryCues[]={\n'
for l in d['lines']:s+='    {'+json.dumps(l['id'])+','+json.dumps(l['text'])+','+str(l['duration'])+'f,'+json.dumps(l.get('speaker','EVA'))+'},\n'
s+='};\n';p=r/'Source/Heliopause/Public/StoryCatalog.h'
if '--check' in sys.argv:assert p.read_text()==s;print('PASS: native/browser dialogue catalog synchronized')
else:p.write_text(s)
