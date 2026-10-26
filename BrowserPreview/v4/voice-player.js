// One output channel, one caption owner. New lines never cancel an active line.
export function createVoicePlayer({lines,sources,onCaption,onError=()=>{},AudioClass=globalThis.Audio,speech=globalThis.speechSynthesis}){
 const queue=[];let active=null,audio=null,time=0,muted=false;const custom={};
 function stop(){queue.length=0;active=null;time=0;if(audio){audio.pause();audio.onended=null;audio=null;}speech?.cancel();onCaption(null);}
 function finish(){active=null;if(audio){audio.pause();audio.onended=null;audio=null;}time=0;onCaption(null);}
 return {custom,get active(){return active;},get pending(){return queue.length;},get busy(){return !!active||queue.length>0;},get audio(){return audio;},tts:true,
 enqueue(id){if(!lines[id]||active?.id===id||queue.includes(id))return;if(queue.length<24)queue.push(id);},stop,
 setMuted(value){muted=value;if(audio)audio.muted=value;if(value)speech?.cancel();},
 tick(dt){if(!active&&queue.length){const id=queue.shift();active={...lines[id],id};time=0;onCaption(active);const src=custom[id]||sources[id];if(src){audio=new AudioClass(src);audio.muted=muted;audio.volume=.85;audio.onended=finish;audio.play().catch(()=>onError('Recording could not play. Subtitles remain available.'));}else if(this.tts&&!muted&&speech){const voice=speech.getVoices().find(v=>v.localService&&v.lang.startsWith('en'));if(voice){const u=new SpeechSynthesisUtterance(active.text);u.voice=voice;u.rate=.97;speech.speak(u);}}}
 if(active){time+=dt;const duration=active.duration||Math.max(3.2,active.text.length*.075);if((!audio||audio.paused)&&time>duration+.4)finish();else if(audio&&time>Math.max(duration,audio.duration||0)+3)finish();}},
 pause(){audio?.pause();speech?.pause();},resume(){if(audio&&!muted)audio.play().catch(()=>{});speech?.resume();}
 };
}
