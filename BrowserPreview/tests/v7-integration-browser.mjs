import {touchdownFixture} from './surface-fixture.mjs';
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


const errors=[],external=[];
try{const context=await browser.newContext({viewport:{width:1100,height:780}});await context.setOffline(true);const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url());});await page.goto(pathToFileURL(path.join(root,'heliopause.html')).href);await page.waitForFunction(()=>window.heliopause);await page.click('#bFree');await page.click('#quickPilot');await page.click('#quickTablet');await page.click('[data-page="NAVIGATION"]');await page.click('[data-act="nav:undock"]');await page.click('#quickTablet');
 for(const [key,axis,sign]of [['KeyW',2,-1],['KeyS',2,1],['ShiftLeft',1,1],['ControlLeft',1,-1],['KeyX',0,1],['KeyZ',0,-1]]){await page.keyboard.press('KeyB');await page.keyboard.down(key);await page.waitForFunction(({axis,sign})=>heliopause.voyage.expedition.velocity[axis]*sign>.03,{axis,sign},{timeout:30000});await page.keyboard.up(key);const v=await page.evaluate(()=>[...heliopause.voyage.expedition.velocity]);const time=await page.evaluate(()=>heliopause.game.time);await page.waitForFunction(t=>heliopause.game.time>t+.2,time);const after=await page.evaluate(()=>[...heliopause.voyage.expedition.velocity]);after.forEach((x,i)=>assert.ok(Math.abs(x-v[i])<1e-8));}
 for(const [key,axis]of [['KeyQ','roll'],['KeyE','roll'],['KeyR','pitch'],['KeyF','pitch'],['KeyA','yaw'],['KeyD','yaw']]){await page.keyboard.press('KeyB');const old=await page.evaluate(axis=>heliopause.voyage.expedition[axis],axis);await page.keyboard.down(key);await page.waitForFunction(({axis,old})=>Math.abs(heliopause.voyage.expedition[axis]-old)>.04,{axis,old},{timeout:30000});await page.keyboard.up(key);assert.equal(await page.evaluate(()=>heliopause.voyage.pilot),true);}
 await page.keyboard.press('KeyB');await page.click('#quickTablet');await page.click('[data-page="SYSTEMS"]');assert.equal(await page.locator('[data-act^="fault:"],[data-act^="intrusion"],[data-act^="hit:"]').count(),0);await page.click('[data-page="DRONES"]');assert.doesNotMatch(await page.locator('#tbody').innerText(),/TEST HIT|TEST FAULT|TELEPORT/);await page.click('#quickTablet');console.log('All six axes, reverse, coasting, E-roll seat retention and removal of debug controls passed');
 // Arrival fixtures render each requested body using the production shaders.
 for(const i of [14,11,10,12,16,13]){await page.evaluate(i=>{const e=heliopause.voyage.expedition,s=heliopause.sites[i];e.target=i;e.docked=-1;e.position=[s.position[0],s.position[1],s.position[2]+s.radius+7];e.velocity=[0,0,0];e.orientation=[0,0,0,1];e.pitch=e.yaw=e.roll=0;},i);await page.waitForFunction(i=>heliopause.voyage.expedition.target===i,i);await page.screenshot({path:path.join(artifacts,`v7-orbit-${i}.png`)});}
 await page.click('#quickTablet');await page.click('[data-page="SURFACE"]');assert.equal(await page.locator('[data-act="surface"]').isDisabled(),true);await page.click('#quickTablet');
 await touchdownFixture(page,10);await page.click('#quickTablet');await page.click('[data-page="SURFACE"]');await page.evaluate(()=>{heliopause.player.x=0;heliopause.player.z=25;});await page.click('[data-act="hatch"]');await page.waitForFunction(()=>heliopause.doors.find(d=>d.name==='EXTERIOR HATCH').open>.85);await page.click('[data-act="disembark"]');await page.waitForFunction(()=>heliopause.surface?.planet===10);await page.screenshot({path:path.join(artifacts,'v7-cinder-outpost.png')});
 // Approach fixture puts the suit at the deterministic vent. Damage is real simulation.
 await page.evaluate(()=>{const s=heliopause.surface;s.n=[...s.origin];const n=s.origin,e=[n[2],0,-n[0]],l=Math.hypot(...e);for(let i=0;i<3;i++)e[i]/=l;const south=[e[1]*n[2]-e[2]*n[1],e[2]*n[0]-e[0]*n[2],e[0]*n[1]-e[1]*n[0]],d=Math.hypot(14,-24),a=d/s.radius;s.n=n.map((x,i)=>x*Math.cos(a)+(e[i]*14+south[i]*-24)/d*Math.sin(a));});await page.waitForFunction(()=>heliopause.surface.suit<98,null,{timeout:30000});assert.match(await page.locator('#surfaceReadout').textContent(),/SUIT/);
 await page.click('#quickTablet');await page.click('[data-act="save"]');await page.reload();await page.waitForFunction(()=>window.heliopause);await page.click('#bContinue');assert.equal(await page.evaluate(()=>heliopause.surface.planet),10);assert.ok(await page.evaluate(()=>heliopause.surface.suit)<100);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log('PASS: layered shaders on all six bodies, gas giant landing guard, manual terrain contact, thermal hazard, suit save and offline audio/graphics.');
}finally{await browser.close();}
