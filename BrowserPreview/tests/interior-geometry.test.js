import test from 'node:test';
import assert from 'node:assert/strict';
import {HABITATS} from '../v4/habitat-state.js';
import {BAY,windowLightFraction,habitatBounds,habitatEnvelope,habitatPassage} from '../v4/interior-geometry.js';
const contains=(b,p)=>p.every((v,i)=>Math.abs(v-b.c[i])<=b.s[i]+1e-8);
const covered=(boxes,p)=>boxes.some(b=>contains(b,p));
test('all core collars seal the entire hull-to-room gap, including overhead and below deck',()=>{
 for(const p of HABITATS.filter(p=>!p.parent)){
  const {boxes}=habitatEnvelope(p),{inner}=habitatBounds(p);
  for(let xx=3.64;xx<=Math.abs(inner)+.08;xx+=.02){
   const x=xx*p.side;
   for(let y=0;y<2.1;y+=.025)for(const dz of [-.72,.72])assert.ok(covered(boxes,[x,y,p.z+dz]),`${p.id} collar side ${x}/${y}`);
   for(let dz=-.7;dz<=.7;dz+=.025){assert.ok(covered(boxes,[x,2.1,p.z+dz]),`${p.id} roof`);assert.ok(covered(boxes,[x,-.01,p.z+dz]),`${p.id} floor`);}
  }
 }
});
test('every habitat pressure wall is closed except its declared passage; leaf overlaps header',()=>{
 for(const p of HABITATS){const child=HABITATS.some(q=>q.parent===p.id),{boxes,leaf}=habitatEnvelope(p,child),{inner,outer}=habitatBounds(p);
  for(let y=.02;y<BAY.height;y+=.027)for(let dz=-2.6;dz<=2.6;dz+=.027){
   const opening=Math.abs(dz)<.7&&y<2.1;
   if(!opening)assert.ok(covered(boxes,[inner,y,p.z+dz]),`${p.id} inner wall ${y}/${dz}`);
   if(!child||!opening)assert.ok(covered(boxes,[outer,y,p.z+dz]),`${p.id} outer wall ${y}/${dz}`);
  }
  assert.ok(leaf.c[1]+leaf.s[1]>BAY.doorHeight);assert.ok(leaf.c[1]-leaf.s[1]<0);assert.ok(leaf.s[2]>BAY.opening);
  const area=habitatPassage(p);assert.ok(area.a[0]<inner-.28&&area.b[0]>inner+.28,'passage overlaps room walkable area');
 }
});
test('open collars leave a full-height 1.4m opening and annex faces meet their parents',()=>{
 for(const p of HABITATS){const {boxes}=habitatEnvelope(p,HABITATS.some(q=>q.parent===p.id)),{inner}=habitatBounds(p);
  for(const dz of [-.4,0,.4])for(const y of [.05,1,2.05])assert.equal(covered(boxes,[inner,y,p.z+dz]),false,`${p.id} doorway obstructed`);
  if(p.parent)assert.ok(Math.abs(inner-habitatBounds(HABITATS.find(q=>q.id===p.parent)).outer)<1e-8);
 }
});

test('extra windows never amplify interior daylight; thermal shades still darken it',()=>{for(const n of [3,15,100]){assert.equal(windowLightFraction(Array.from({length:n},()=>({k:0}))),1);assert.equal(windowLightFraction(Array.from({length:n},()=>({k:1}))),0);assert.equal(windowLightFraction(Array.from({length:n},()=>({k:.5}))),.5);}assert.equal(windowLightFraction([]),0);assert.ok(windowLightFraction([{k:NaN},{k:-1},{k:2}])<=1);});
