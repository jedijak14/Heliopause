import {chromium} from 'playwright';import packed from '@sparticuz/chromium';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import {brotliDecompressSync} from 'node:zlib';import {execFileSync} from 'node:child_process';import {installManualClock,advance} from './manual-clock.mjs';
const root=path.resolve(import.meta.dirname,'../..'),art=path.join(root,'Artifacts/browser');
fs.mkdirSync(path.join(art,'libs'),{recursive:true});if(!fs.existsSync(path.join(art,'libs/lib'))){const tar=path.join(art,'al2023.tar');fs.writeFileSync(tar,brotliDecompressSync(fs.readFileSync(path.join(root,'BrowserPreview/node_modules/@sparticuz/chromium/bin/al2023.tar.br'))));execFileSync('tar',['-xf',tar,'-C',path.join(art,'libs')]);}
const browser=await chromium.launch({executablePath:await packed.executablePath(),args:packed.args,headless:true,env:{...process.env,LD_LIBRARY_PATH:path.join(art,'libs/lib')}});
try{
 const page=await browser.newPage({viewport:{width:1200,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await installManualClock(page);
 const file=process.env.HP_CAPTURE?path.join(art,'capture-build/index.html'):path.join(root,'BrowserPreview/heliopause.html');
 await page.goto(pathToFileURL(file).href);await page.waitForFunction(()=>window.heliopause,null,{polling:100});await page.click('#bFree');await advance(page,.1);
 const position=()=>page.evaluate(()=>({x:heliopause.player.x,z:heliopause.player.z}));
 const walk=async(x,z)=>{
  await page.evaluate(({x,z})=>{const p=heliopause.player;p.yaw=-Math.atan2(x-p.x,-(z-p.z));p.pitch=0;},{x,z});await page.keyboard.down('KeyW');
  const result=await page.evaluate(({x,z})=>{let n=0;while(n++<400&&Math.hypot(heliopause.player.x-x,heliopause.player.z-z)>.12)window.advanceGame(.05);return {n,x:heliopause.player.x,z:heliopause.player.z};},{x,z});
  await page.keyboard.up('KeyW');await advance(page,.3);assert.ok(result.n<400,`Blocked en route to ${x},${z}: ${JSON.stringify(result)}`);
 };
 const use=async()=>{await page.click('#quickInteract');await advance(page,3);};
 const along=async(z)=>{
  const p=await position(),direction=Math.sign(z-p.z),ds=await page.evaluate(()=>heliopause.doors.filter(d=>!d.side&&!d.airlock).map(d=>({z:d.z,name:d.name})));
  for(const d of ds.filter(d=>(d.z-p.z)*direction>0&&(z-d.z)*direction>0).sort((a,b)=>direction*(a.z-b.z))){
   await walk(0,d.z-direction*1.1);await page.evaluate(direction=>{heliopause.player.yaw=direction>0?Math.PI:0;},direction);
   if(!await page.evaluate(name=>heliopause.doors.find(d=>d.name===name).target,d.name))await use();
   assert.ok(await page.evaluate(name=>heliopause.doors.find(d=>d.name===name).open>.9,d.name),`Face interaction: ${d.name}`);
   await walk(0,d.z+direction*.65);console.log('Crossed',d.name,direction>0?'aft':'forward');
  }
  await walk(0,z);
 };
 await along(21.5);await along(-4.1);console.log('All five original/aft bulkheads crossed in both directions without position fixtures.');
 await page.click('#quickTablet');await page.click('[data-page="HABITAT"]');await page.click('[data-act="habdeploy:all"]');await advance(page,16.5);await page.click('#quickTablet');
 assert.ok(await page.evaluate(()=>heliopause.habitats.every(p=>p.loaded&&!p.door.locked)));
 const captures=path.join(root,'Previews/Pressure-Seals');if(process.env.HP_CAPTURE)fs.mkdirSync(captures,{recursive:true});
 for(const id of ['kitchen','living','bathroom','gym','pool','dining']){
  const p=await page.evaluate(id=>{const p=heliopause.habitats.find(p=>p.id===id);return {side:p.side,z:p.z};},id);await along(p.z);await walk(p.side*2.3,p.z);await use();
  assert.ok(await page.evaluate(id=>heliopause.habitats.find(p=>p.id===id).door.open>.9,id));
  // Walk through the collar into each room; avoid the dining table's central footprint.
  await walk(p.side*4.85,p.z);if(process.env.HP_CAPTURE){await advance(page,.05,true);await page.screenshot({path:path.join(captures,id+'-entrance.png')});}
  if(id==='bathroom'||id==='gym'){
   await walk(p.side*9.3,p.z);await use();await walk(p.side*13.2,p.z);console.log('Walked into',id==='bathroom'?'workshop':'medical');
   await page.evaluate(side=>{heliopause.player.yaw=side<0?-Math.PI/2:Math.PI/2;},p.side);
   if(process.env.HP_CAPTURE){await advance(page,.05,true);await page.screenshot({path:path.join(captures,id+'-annex-return.png')});}
   await walk(p.side*12,p.z);if(!await page.evaluate(id=>heliopause.habitats.find(p=>p.parent===id).door.target,id))await use();await walk(p.side*4.85,p.z);
  }
  await page.evaluate(side=>{heliopause.player.yaw=side<0?-Math.PI/2:Math.PI/2;},p.side);
  if(!await page.evaluate(id=>heliopause.habitats.find(p=>p.id===id).door.target,id))await use();
  if(process.env.HP_CAPTURE){await advance(page,.05,true);await page.screenshot({path:path.join(captures,id+'-collar-return.png')});}
  await walk(0,p.z);console.log('Returned through sealed collar:',id);
 }
 // Closed and transitioning doors must remain solid; room geometry must not linger after compaction.
 await page.click('#quickTablet');await page.click('[data-page="HABITAT"]');await page.click('[data-act="habstow:all"]');await advance(page,16.5);assert.ok(await page.evaluate(()=>heliopause.habitats.every(p=>!p.loaded&&p.door.locked)));
 assert.equal(await page.evaluate(()=>heliopause.walkable(3.9,8)),false);assert.equal(await page.evaluate(()=>heliopause.walkable(-3.9,8)),false);
 await page.click('#quickTablet');await along(12.2);
 // Real fault path: lock -> service swarm -> release, not a blanket bypass.
 await page.evaluate(()=>{heliopause.voyage.systems.faults[3]=true;const d=heliopause.doors.find(d=>d.name==='ENGINEERING');d.target=0;heliopause.player.yaw=0;});await advance(page,3);await use();assert.match(await page.locator('#notice').innerText(),/Repair/);
 await page.click('#quickTablet');await page.click('[data-page="SYSTEMS"]');await page.click('[data-act="repair:3"]');await advance(page,8.5);await page.click('#quickTablet');await use();assert.ok(await page.evaluate(()=>heliopause.doors.find(d=>d.name==='ENGINEERING').open>.9));
 assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>heliopause.gl.getError()),0);console.log('PASS: 14-room route, bidirectional bulkheads, all collars/annexes, unloading and repair interlock.');
}finally{await browser.close();}
