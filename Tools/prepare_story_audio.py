#!/usr/bin/env python3
"""Compress generated voice masters for the web; keep native PCM recordings intact."""
import argparse,json,re,subprocess,wave
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--ffmpeg',default='ffmpeg');args=p.parse_args()
root=Path(__file__).resolve().parents[1]
lines=[
('eva_intro','Awakening','bridge','Good morning, Commander. We have arrived in high orbit over Kepler four forty-two b. I am EVA, your ship intelligence. The Longhaul is holding steady. Open your tablet when you are ready. There is no hurry. After all that darkness, you deserve a moment to wake up.'),
('eva_quarters','A place to call home','crew','Tablet linked. Your quarters are still in sleep mode. Switch on the lights, then approach the private-room door and scan your handprint. This ship has carried you a long way. Let us make it feel like home again.'),
('eva_view','The view','crew',"Handprint verified. Welcome home, Commander. Open the thermal curtain. Those silver bands are clouds, not ice. Somewhere beneath them, an entire world is waking up. When you have had your moment, return to the pilot seat. We have a survey to finish."),
('eva_entry','Through the fire','front','Entry survey authorized. Keep your hands clear of the flight controls. I will manage the descent and deploy the thermal shades when the hull temperature rises. The noise is expected. If you can hear me, we are still together. Beginning our approach.'),
('eva_hold','A voice beneath the clouds','front','Holding at sixty kilometres. Survey sensors are recording. Wait. There is a second signal beneath the atmospheric noise. It matches the missing survey vessel Kestrel. Commander, that ship was declared lost thirty-seven years ago. I have saved its coordinates. First, we need to get back into orbit.'),
('eva_repair','Containment','engine','Reactor containment is oscillating. I have isolated the engine room. Do not force the bulkhead. Link to the maintenance drone and seal the thermal vent, or use the remote repair controls. I can hold our altitude, but I cannot make this repair for you. Take it one step at a time.'),
('eva_departure','The missing ship','bridge','Containment stable. We are back in orbit. I have added the Kestrel to your navigation chart. We can leave this mystery behind, or find out why it called to us. Take the pilot seat, select the wreck, and set a course. The decision to go is yours.'),
('eva_discovery','What they left behind','port',"The Kestrel's recorder is intact. Its crew found something at the Pilgrim Vault. Not a weapon. Not a warning. A memory archive, built to survive its makers. The coordinates are in your chart. Survey the vault and recover its navigation seed. We should not let their last message disappear."),
('eva_return','Bring them home','front','Archive secured. I can read it now. They knew their star was dying. They sent their stories outward, hoping someone would listen. We did. Return to Asterion Anchorage, dock, and carry the discoveries to the exploration exchange. Let us make sure someone else can hear them too.'),
('eva_final','A long way home','bridge',"The archive has been accepted. Their names will not be lost. Neither will the Kestrel's. When we left home, I thought our mission was to measure the distance between the stars. I was wrong. It was to find what makes that distance worth crossing. Thank you, Commander. The story is complete. The ship, and the open sky, are yours.")]
result=[]
for key,title,shot,text in lines:
 src=root/'Content/Audio/Voice'/f'{key}.wav';available=src.exists()
 if available:
  with wave.open(str(src)) as w: duration=w.getnframes()/w.getframerate()
  subprocess.run([args.ffmpeg,'-hide_banner','-loglevel','error','-y','-i',str(src),'-af','loudnorm=I=-19:TP=-2:LRA=6','-ar','44100','-ac','1','-b:a','128k',str(root/'BrowserPreview/assets/story'/f'{key}.mp3')],check=True)
 else: duration=len(text.split())/2.7
 sentences=re.findall(r'[^.!?]+[.!?]?',text);weights=[len(x.split()) for x in sentences];total=sum(weights);cursor=.2;cues=[]
 for sentence,weight in zip(sentences,weights):
  end=cursor+(duration-.4)*weight/total;cues.append({'start':round(cursor,2),'end':round(end,2),'text':sentence.strip()});cursor=end
 result.append({'id':key,'speaker':'EVA','title':title,'shot':shot,'text':text,'duration':round(duration,3),'recording':available,'cues':cues})
(root/'Shared/story.json').write_text(json.dumps({'version':1,'title':'A Long Way Home','voiceProvenance':'Original AI-generated EVA dialogue; not a human actor recording.','subtitleTiming':'Sentence boundaries are word-weighted estimates over measured clip duration.','lines':result},indent=2)+'\n')
print('Prepared',sum(r['recording'] for r in result),'voiced scenes; unrecorded cues retain subtitles/native fallback.')
