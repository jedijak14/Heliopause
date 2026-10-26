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
try{const context=await browser.newContext({viewport:{width:1000,height:700}});await context.setOffline(true);const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url());});
 await page.goto(pathToFileURL(path.join(root,'heliopause.html')).href);await page.waitForFunction(()=>window.heliopause);await page.click('#bStory');await page.waitForFunction(()=>heliopause.game.mode==='cut');await page.screenshot({path:path.join(artifacts,'v4-opening.png')});await page.keyboard.press('Space');await page.click('#quickTablet');await page.click('[data-page="LIGHTS"]');await page.click('[data-act="light:2"]');await page.waitForFunction(()=>heliopause.game.step===2);await page.click('#quickTablet');
 // Only the look direction is set by the fixture; both doors are interacted with,
 // scanned and crossed using normal input and collision/movement code.
 await page.evaluate(()=>{const p=heliopause.player;p.x=0;p.yaw=-Math.atan2(.9-p.x,-(-2.95-p.z));p.pitch=Math.atan2(1.3-p.y,Math.hypot(.9-p.x,-2.95-p.z));});await page.click('#quickInteract');await page.waitForFunction(()=>heliopause.doors[0].verified&&heliopause.doors[0].open>.9,null,{timeout:30000});await page.evaluate(()=>{heliopause.player.yaw=Math.PI;heliopause.player.pitch=0;});await page.keyboard.down('KeyW');await page.waitForFunction(()=>heliopause.player.z>-.5,null,{timeout:45000});await page.keyboard.up('KeyW');
 await page.evaluate(()=>{const p=heliopause.player;p.x=0;p.yaw=-Math.atan2(.9-p.x,-(1.05-p.z));p.pitch=Math.atan2(1.3-p.y,Math.hypot(.9-p.x,1.05-p.z));});await page.click('#quickInteract');await page.waitForFunction(()=>heliopause.doors[1].verified&&heliopause.doors[1].open>.9,null,{timeout:30000});await page.evaluate(()=>{heliopause.player.yaw=Math.PI;heliopause.player.pitch=0;});await page.keyboard.down('KeyW');await page.waitForFunction(()=>heliopause.player.z>1.7,null,{timeout:45000});await page.keyboard.up('KeyW');await page.waitForFunction(()=>heliopause.game.step===3);
 await page.click('#quickTablet');await page.click('[data-page="WINDOWS"]');await page.click('[data-act="win:2"]');await page.waitForFunction(()=>heliopause.game.step===4);await page.click('#quickTablet');await page.screenshot({path:path.join(artifacts,'v4-quarters.png')});await page.click('#quickPilot');await page.click('#quickTablet');await page.click('[data-page="FLIGHT"]');await page.click('[data-act="ap:entry"]');await page.waitForFunction(()=>heliopause.game.step===5);assert.equal(await page.evaluate(()=>heliopause.flight.ap),'entry');console.log('v4 prologue interaction passed');
 // Endgame saved fixture tests UI delivery; voyage.test.js covers all continuous travel legs.
 await page.evaluate(()=>{const v=heliopause.voyage;v.active=true;v.phase=6;v.pending=[];const e=v.expedition;e.position=[0,0,.56];e.velocity=[0,0,0];e.docked=0;e.target=0;e.scanned=[4,8,10,11,12];e.recovered=[4,8];e.sold=[];e.artifactSold=[];localStorage.setItem('heliopause-v4-voyage-1',JSON.stringify({version:1,voyage:v,prologue:{step:7,altitude:400,story:true}}));});
 // Prevent pagehide's ordinary save from overwriting the explicit loaded fixture.
 await page.evaluate(()=>heliopause.game.mode='menu');await page.reload();await page.waitForFunction(()=>window.heliopause);await page.click('#bContinue');await page.click('#quickTablet');await page.click('[data-page="NAVIGATION"]');await page.click('[data-act="board"]');assert.equal(await page.evaluate(()=>heliopause.voyage.expedition.onStation),true);await page.keyboard.down('KeyW');await page.keyboard.down('ShiftLeft');await page.waitForFunction(()=>heliopause.player.z<82.8,null,{timeout:70000});await page.keyboard.up('KeyW');await page.keyboard.up('ShiftLeft');await page.screenshot({path:path.join(artifacts,'v4-station.png')});await page.click('#quickTablet');await page.click('[data-act="nav:sell"]');await page.waitForFunction(()=>heliopause.voyage.complete&&heliopause.game.mode==='scene',null,{timeout:30000});await page.waitForFunction(()=>heliopause.voice.active?.id==='eva_final');await page.screenshot({path:path.join(artifacts,'v4-ending.png')});await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>heliopause.game.mode),'play');assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log('PASS: supplied-v4 opening/skip, lights, both physical handprint scans and doorway walks, curtain, entry controls, saved endgame fixture, station walking, exchange and preserved EVA ending. No runtime errors or external HTTP requests.');
}finally{await browser.close();}
