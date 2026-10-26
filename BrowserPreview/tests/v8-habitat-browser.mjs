import {touchdownFixture,launchFixture} from './surface-fixture.mjs';
import { chromium } from 'playwright';
import packed from '@sparticuz/chromium';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { brotliDecompressSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const artifacts=path.resolve(root,'../Artifacts/browser');fs.mkdirSync(artifacts,{recursive:true});
// Lambda Chromium carries its NSS dependencies; unpack for minimal Linux workspaces.
const libs=path.join(artifacts,'libs');fs.mkdirSync(libs,{recursive:true});
const tar=path.join(artifacts,'al2023.tar');
fs.writeFileSync(tar,brotliDecompressSync(fs.readFileSync(path.join(root,'node_modules/@sparticuz/chromium/bin/al2023.tar.br'))));
execFileSync('tar',['-xf',tar,'-C',libs]);
const browser=await chromium.launch({executablePath:await packed.executablePath(),args:packed.args,headless:true,env:{...process.env,LD_LIBRARY_PATH:path.join(libs,'lib')+':'+(process.env.LD_LIBRARY_PATH||'')}});


// Software WebGL advances at a fraction of real time; retain simulation assertions with longer wall-clock budgets.
const errors=[],external=[];
try{
 const context=await browser.newContext({viewport:{width:1200,height:800}});await context.setOffline(true);const page=await context.newPage();page.on('pageerror',e=>{errors.push(e.message);console.log('PAGEERROR',e.message);});page.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url());});
 await page.goto(pathToFileURL(path.join(root,'heliopause.html')).href);await page.waitForFunction(()=>window.heliopause);await page.click('#bFree');
 const tab=async p=>{if(!await page.evaluate(()=>heliopause.game.tab))await page.click('#quickTablet');await page.click(`[data-page="${p}"]`);};
 await tab('AUDIO');await page.click('[data-act="quality:0.4"]');await tab('HABITAT');
 assert.equal(await page.evaluate(()=>heliopause.habitats.filter(p=>p.loaded).length),0);
 const baseline=await page.evaluate(()=>heliopause.meshes.length);
 await page.evaluate(()=>{const e=heliopause.voyage.expedition;e.docked=-1;e.position=[50,50,50];e.velocity=[1,0,0];});await page.click('[data-act="habdeploy:all"]');assert.equal(await page.evaluate(()=>heliopause.habitats.every(p=>p.phase==='stowed')),true);
 await page.evaluate(()=>heliopause.voyage.expedition.velocity=[0,0,0]);await page.click('[data-act="habdeploy:all"]');
 console.log('Deploy state',await page.evaluate(()=>({pods:heliopause.habitats.map(p=>[p.id,p.phase,p.fraction]),notice:document.querySelector('#notice').textContent,warp:heliopause.warp,velocity:heliopause.voyage.expedition.velocity,ap:heliopause.flight.ap})));assert.equal(await page.evaluate(()=>heliopause.habitats.every(p=>p.phase==='deploying'&&p.door.locked)),true);await page.waitForFunction(()=>heliopause.habitats.every(p=>p.loaded),null,{timeout:180000}).catch(async error=>{console.log('Timeout state',await page.evaluate(()=>({pods:heliopause.habitats.map(p=>[p.id,p.phase,p.fraction]),time:heliopause.game.time,mode:heliopause.game.mode,hidden:document.hidden,err:document.querySelector('#err').textContent,models:heliopause.models,canvas:[heliopause.gl.canvas.width,heliopause.gl.canvas.height]})));throw error;});
 assert.equal(await page.evaluate(()=>heliopause.habitats.every(p=>!p.door.locked)),true);
 console.log('Six symmetric modules deploy only while stopped; transition doors locked.');
 await page.click('#quickTablet');await page.evaluate(()=>{const p=heliopause.player;p.x=-2;p.z=8;p.yaw=Math.PI/2;p.pitch=0;});await page.click('#quickInteract');await page.waitForFunction(()=>heliopause.habitats[0].door.open>.9,null,{timeout:90000});await page.keyboard.down('KeyW');await page.waitForFunction(()=>heliopause.player.x< -5,null,{timeout:90000});await page.keyboard.up('KeyW');assert.equal(await page.evaluate(()=>heliopause.walkable(heliopause.player.x,heliopause.player.z)),true);await page.evaluate(()=>{heliopause.player.x=0;heliopause.player.z=-4.1;});await tab('HABITAT');
 await page.click('#quickTablet');await page.click('#quickPilot');await page.keyboard.down('KeyW');const t=await page.evaluate(()=>heliopause.game.time);await page.waitForFunction(t=>heliopause.game.time>t+.25,t);await page.keyboard.up('KeyW');assert.deepEqual(await page.evaluate(()=>heliopause.voyage.expedition.velocity),[0,0,0]);await page.click('#quickPilot');
 await tab('CAMERAS');await page.click('[data-act="cam:4"]');await page.click('#quickTablet');await page.waitForTimeout(800);assert.equal(await page.evaluate(()=>heliopause.camera),4);const yaw=await page.evaluate(()=>heliopause.orbit.yaw);await page.mouse.move(600,400);await page.mouse.down();await page.mouse.move(750,440,{steps:6});await page.mouse.up();assert.notEqual(await page.evaluate(()=>heliopause.orbit.yaw),yaw);await page.mouse.wheel(0,-200);assert.ok(await page.evaluate(()=>heliopause.orbit.distance)<53);
 await page.screenshot({path:path.join(artifacts,'v8-deployed-ship.png')});
 await tab('CAMERAS');await page.click('[data-act="cam:0"]');await page.click('#quickTablet');
 // Camera fixtures inspect real loaded rooms; no in-game teleports are exposed.
 for(const id of ['kitchen','living','bathroom','gym','pool','dining']){await page.evaluate(id=>{const h=heliopause,p=h.habitats.find(p=>p.id===id);h.player.x=p.side*4.8;h.player.z=p.z;h.player.yaw=p.side<0?Math.PI/2:-Math.PI/2;h.player.pitch=-.12;},id);await page.waitForTimeout(300);await page.screenshot({path:path.join(artifacts,`v8-${id}.png`)});}
 await page.evaluate(()=>{const h=heliopause;h.player.x=-7;h.player.z=8;});await tab('HABITAT');await page.click('[data-act="habstow:kitchen"]');assert.equal(await page.evaluate(()=>heliopause.habitats[0].phase),'deployed');assert.match(await page.locator('#notice').innerText(),/occupied/);
 await page.evaluate(()=>{heliopause.player.x=0;heliopause.player.z=8;});await page.click('[data-act="habstow:all"]');assert.equal(await page.evaluate(()=>heliopause.habitats.every(p=>!p.loaded&&p.door.locked)),true);await page.waitForFunction(()=>heliopause.habitats.every(p=>p.phase==='stowed'),null,{timeout:180000});assert.equal(await page.evaluate(()=>heliopause.meshes.length),baseline);
 console.log('Occupied-room guard, flight interlock, orbit/zoom camera, all furnished interiors and GPU unload passed.');
 // Persist a deployed module, then verify independent reconstruction after reload.
 await page.click('[data-act="habdeploy:living"]');await page.waitForFunction(()=>heliopause.habitats[1].loaded,null,{timeout:180000});await tab('NAVIGATION');await page.click('[data-act="save"]');await page.reload();await page.waitForFunction(()=>window.heliopause);await page.click('#bContinue');assert.equal(await page.evaluate(()=>heliopause.habitats[1].loaded),true);
 await tab('AUDIO');await page.click('[data-act="quality:0.4"]');await tab('HABITAT');await page.click('[data-act="habstow:all"]');await page.waitForFunction(()=>heliopause.habitats.every(p=>p.phase==='stowed'),null,{timeout:180000});await page.click('#quickTablet');
 // Arrival fixture; production contact, not a terminal descent program.
 await touchdownFixture(page,14);assert.equal(await page.evaluate(()=>heliopause.surface),null);
 await tab('SURFACE');await page.click('[data-act="hatch"]');await page.waitForFunction(()=>heliopause.doors.find(d=>d.name==='EXTERIOR HATCH').open>.85,null,{timeout:90000});await page.evaluate(()=>{heliopause.player.x=0;heliopause.player.z=25;});await page.click('[data-act="disembark"]');await page.waitForFunction(()=>!!heliopause.surface);await page.screenshot({path:path.join(artifacts,'v8-landed-ship.png')});await page.click('[data-surface="ascend"]');await page.waitForFunction(()=>!heliopause.surface);assert.equal(await page.evaluate(()=>heliopause.player.z),25);
 await launchFixture(page);assert.equal(await page.evaluate(()=>heliopause.transit),null);assert.equal(await page.evaluate(()=>heliopause.grounded),null);
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log('PASS: offline assets, habitat persistence, terrain descent to touchdown, exterior hatch and ground reboarding.');
}finally{await browser.close();}
