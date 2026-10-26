#!/usr/bin/env python3
"""Keep existing EVA masters untouched; package additional v4 dialogue."""
import json,subprocess,wave,argparse
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--ffmpeg',default='ffmpeg');a=p.parse_args();root=Path(__file__).resolve().parents[1]
scripts={
'eva_intro_1':('EVA','Good morning, Commander. We are holding in high orbit above Kepler four forty-two b. All systems are stable. Welcome back.'),
'eva_intro_2':('EVA','All systems nominal. Your tablet is on your belt. Press T whenever you need me.'),
'eva_obj_room':('EVA','Lights on. Private rooms need your handprint. Scan in at each door.'),
'eva_obj_entry':('EVA','When you are ready, return to the cockpit and start the Entry Survey from the Flight page.'),
'hale_1':('CMDR. ROWAN HALE',"Two hundred and eleven days out. Still the most beautiful thing I've ever seen."),
'hale_signal':('CMDR. ROWAN HALE',"EVA, bring the navigation array online. If that signal really came from the Kestrel, someone out there has been waiting a very long time. We're going to find them."),
'hale_cinder':('CMDR. ROWAN HALE',"The recorder survived, but the star map is damaged. These coordinates point to Cinder. Let's compare its volcanic spectrum with the archive. Maybe the missing pieces are still out there."),
'hale_pelagos':('CMDR. ROWAN HALE',"There. The same pattern, beneath all that ocean. This wasn't one civilization on one world. They were talking to each other across the dark. Keep recording, EVA. Every voice matters."),
'hale_borealis':('CMDR. ROWAN HALE',"Borealis has their final relay. It's quiet now, but the archive still remembers the route to Pilgrim. We can bring their stories home. Not as salvage. As people who were here."),
'hale_home':('CMDR. ROWAN HALE',"Anchorage, this is Commander Rowan Hale of the Longhaul. We have two archives aboard, and a promise to keep. Requesting docking clearance. EVA, let's bring them home.")}
lines=[]
for id,(who,text) in scripts.items():
 src=root/'Content/Audio/Voice'/f'{id}.wav'
 with wave.open(str(src)) as w:duration=w.getnframes()/w.getframerate()
 subprocess.run([a.ffmpeg,'-loglevel','error','-y','-i',str(src),'-af','loudnorm=I=-19:TP=-2:LRA=6','-ar','44100','-ac','1','-b:a','128k',str(root/'BrowserPreview/assets/story'/f'{id}.mp3')],check=True)
 lines.append(dict(id=id,speaker=who,text=text,duration=round(duration,3),recording=True))
(root/'Shared/commander.json').write_text(json.dumps({'provenance':'AI-generated speech; user-selected EVA and Commander voices. Existing EVA masters retained.','lines':lines},indent=2)+'\n')
