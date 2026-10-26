import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {freshWarp,engageWarp,stepWarp,cancelWarp} from '../BrowserPreview/v4/warp.js';
import {freshExpedition,sites} from '../BrowserPreview/src/exploration.js';
import {scienceSystems} from '../BrowserPreview/v4/science-catalog.js';
import {fromEuler} from '../BrowserPreview/v4/flight-dynamics.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
fs.mkdirSync(path.join(root,'Artifacts'),{recursive:true});
const binary=path.join(root,'Artifacts/warp_parity');
execFileSync(process.env.CXX||'g++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=address,undefined','-I',path.join(root,'Source/Heliopause/Public'),path.join(root,'Tests/warp_parity.cpp'),'-o',binary]);
const cases=[];
for(const position of [[0,0,.56],[1000,1000,1000],[8000,-500,1000]])for(let target=0;target<sites.length;target++)cases.push({target,position,angles:[.12,-.35,.52],cancelAt:-1});
for(const target of [0,17,26])for(const cancelAt of [0,20,69,100,200,320])cases.push({target,position:[1000,1000,1000],angles:[-.9,.6,-1.1],cancelAt});
const input=cases.length+'\n'+cases.map(c=>[c.target,...c.position,...c.angles,c.cancelAt].join(' ')).join('\n');
const cpp=JSON.parse(execFileSync(binary,{input,encoding:'utf8',maxBuffer:16*1024*1024}));
const phases=['idle','charging','cruising','braking'],dt=[.016,.033,.1,.025];let snapshots=0;
for(let n=0;n<cases.length;n++){
 const c=cases[n],e=freshExpedition();Object.assign(e,{docked:-1,target:c.target,position:[...c.position],orientation:fromEuler(...c.angles)});
 const w=freshWarp(),ok=engageWarp(w,e,sites,scienceSystems)===null,actual=cpp[n];assert.equal(actual.accepted,ok,`route acceptance ${n}`);
 if(!ok)continue;
 assert.equal(actual.curve,w.curve.length);assert.ok(Math.abs(actual.length-w.length)<1e-7);assert.ok(Math.abs(actual.duration-w.duration)<1e-8);
 let row=0;
 for(let i=0;w.phase!=='idle'&&i<10000;i++){
  if(i===c.cancelAt)cancelWarp(w);stepWarp(w,e,dt[i%4]);
  if(i%17===0||w.phase==='idle'){
   const js=[i,phases.indexOf(w.phase),w.elapsed,w.progress,w.strength,w.rate,e.totalTravel,...e.position,...e.velocity,...e.orientation,e.yaw,e.pitch,e.roll];
   assert.ok(actual.snapshots[row],`missing native snapshot ${n}/${row}`);
   js.forEach((value,k)=>assert.ok(Math.abs(value-actual.snapshots[row][k])<1e-7,`warp ${n}/${row}/${k}: JS=${value} C++=${actual.snapshots[row][k]}`));row++;snapshots++;
  }
 }
 assert.equal(w.phase,'idle');assert.equal(row,actual.snapshots.length);
}
console.log(`PASS: browser/native warp agreement across ${cases.length} routes/cancellation cases, ${snapshots} snapshots, 1e-7 tolerance, ASan/UBSan (not Unreal).`);
