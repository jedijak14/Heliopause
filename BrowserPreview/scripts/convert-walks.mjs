// Matching Rocketbox gender-specific motion, retaining only rig-bound local rotations.
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';import {AnimationClip} from 'three';
const root=path.resolve(import.meta.dirname,'..');
for(const id of ['commander','officer']){
 const input=path.join(root,'../Artifacts/source-assets/streaming',id+'-walk.fbx'),b=fs.readFileSync(input);
 const fbx=new FBXLoader().parse(b.buffer.slice(b.byteOffset,b.byteOffset+b.length),'');
 const raw=fs.readFileSync(path.join(root,'assets/models/offline',id+'.glb')),gltf=JSON.parse(raw.subarray(20,20+raw.readUInt32LE(12)));
 const names=new Set(gltf.nodes.map(n=>n.name).filter(Boolean)),take=fbx.animations[0];
 const tracks=take.tracks.filter(t=>t.name.endsWith('.quaternion')&&names.has(t.name.slice(0,-11)));
 if(tracks.length<75)throw Error('Incomplete matching skeleton: '+id);
 for(const track of tracks)for(let i=0;i<track.values.length;i+=4){const q=track.values.subarray(i,i+4),n=Math.hypot(...q);if(!Number.isFinite(n)||n<.99||n>1.01)throw Error('Invalid quaternion');for(let k=0;k<4;k++)q[k]/=n;}
 const movement=take.tracks.find(t=>t.name==='Bip01.position'),v=movement.values;
 const stride=Math.hypot(v.at(-3)-v[0],v.at(-1)-v[2])*.01;
 const result={sourceSHA256:createHash('sha256').update(b).digest('hex'),strideMetres:stride,rootHeave:{times:Array.from(movement.times),values:Array.from(movement.times,(_,i)=>v[i*3+1]-v[1])},clip:AnimationClip.toJSON(new AnimationClip('Rocketbox neutral walk',take.duration,tracks))};
 fs.mkdirSync(path.join(root,'assets/animations'),{recursive:true});fs.writeFileSync(path.join(root,'assets/animations',id+'-walk.json'),JSON.stringify(result)+'\n');console.log(id,tracks.length,take.duration,stride);
}
