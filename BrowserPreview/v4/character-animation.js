import * as T from 'three';
import male from '../assets/animations/commander-walk.json' with {type:'json'};
import female from '../assets/animations/officer-walk.json' with {type:'json'};
export const walkData={commander:male,officer:female};
// Authored rotations and bounded vertical root motion only; no limb translations or scale tracks. Fail closed on mismatched rigs.
export function checkedClip(root,clip){
 clip=clip.clone();clip.tracks=clip.tracks.filter(t=>!(t.name==='Bip01_Footsteps.quaternion'&&!root.getObjectByName('Bip01_Footsteps')?.isBone));
 const seen=new Set();for(const track of clip.tracks){const rotation=track.name.endsWith('.quaternion'),name=track.name.slice(0,track.name.lastIndexOf('.')),bone=root.getObjectByName(name),size=rotation?4:3;
  if((!rotation&&track.name!=='Bip01.position')||!(bone?.isBone||(name==='Bip01'&&bone?.getObjectByProperty('isBone',true)))||seen.has(track.name))throw Error('Unbound or duplicate animation channel: '+track.name);
  seen.add(track.name);if(track.values.length!==track.times.length*size)throw Error('Invalid rotation track length');
  for(let i=0;i<track.times.length;i++){if(!Number.isFinite(track.times[i])||(i&&track.times[i]<=track.times[i-1]))throw Error('Invalid key time');if(rotation){const n=Math.hypot(...track.values.subarray(i*4,i*4+4));if(!Number.isFinite(n)||Math.abs(n-1)>.005)throw Error('Non-unit joint rotation: '+name);}else {const v=track.values.subarray(i*3,i*3+3);if(!v.every(Number.isFinite)||Math.abs(v[0]-bone.position.x)>.001||Math.abs(v[2]-bone.position.z)>.001||Math.abs(v[1]-bone.position.y)>10)throw Error('Unsafe root motion');}}
 }
 return clip;
}
export function characterAnimator(root,id,idle,options={}){
 const mixer=new T.AnimationMixer(root),actions={};
 if(idle)actions.idle=mixer.clipAction(checkedClip(root,idle));
 if(walkData[id]){const data=walkData[id],clip=T.AnimationClip.parse(data.clip),base=root.getObjectByName('Bip01').position;clip.tracks.push(new T.VectorKeyframeTrack('Bip01.position',data.rootHeave.times,data.rootHeave.values.flatMap(y=>[base.x,base.y+y,base.z])));actions.walk=mixer.clipAction(checkedClip(root,clip));}
 let current=null;
 const set=(state,fade=.25)=>{const next=actions[state]||actions.idle;if(!next||next===current)return;next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();if(current)current.crossFadeTo(next,fade,false);current=next;};
 set(options.animation||'idle',0);mixer.update(0);
 return {mixer,set,tick(dt){mixer.update(Math.max(0,Math.min(.1,dt)));},get state(){return current===actions.walk?'walk':'idle';},get stride(){return walkData[id]?.strideMetres||0;}};
}
