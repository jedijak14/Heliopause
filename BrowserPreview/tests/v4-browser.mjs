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
try{
 const context=await browser.newContext({viewport:{width:1000,height:700}});await context.setOffline(true);const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url());});
 await page.goto(pathToFileURL(path.join(root,'heliopause.html')).href);await page.waitForFunction(()=>window.heliopause,null,{timeout:30000});
 console.log('v4 booted');await page.click('#bFree');await page.waitForFunction(()=>heliopause.game.time>.1,null,{timeout:30000});assert.deepEqual(errors,[]);await page.screenshot({path:path.join(artifacts,'v4-cockpit.png')});
 await page.click('#quickPilot');assert.equal(await page.evaluate(()=>heliopause.voyage.pilot),true);await page.click('#quickTablet');await page.click('[data-page="NAVIGATION"]');await page.click('[data-act="nav:undock"]');assert.equal(await page.evaluate(()=>heliopause.voyage.expedition.docked),-1);await page.click('#quickTablet');
 const start=await page.evaluate(()=>[...heliopause.voyage.expedition.position]);await page.keyboard.down('KeyW');await page.keyboard.down('KeyA');try{await page.waitForFunction(()=>heliopause.voyage.expedition.totalTravel>.02,null,{timeout:45000});}catch(e){console.log(await page.evaluate(()=>({game:heliopause.game,flight:heliopause.flight,v:heliopause.voyage,err:document.getElementById('err').textContent,active:document.activeElement.id})));console.log(errors);throw e;}await page.keyboard.up('KeyW');await page.keyboard.up('KeyA');assert.notDeepEqual(await page.evaluate(()=>heliopause.voyage.expedition.position),start);assert.ok(await page.evaluate(()=>heliopause.voyage.expedition.yaw)>.01);await page.keyboard.press('KeyB');assert.equal(await page.evaluate(()=>heliopause.voyage.throttle),0);
 console.log('manual flight passed');await page.keyboard.press('KeyV');assert.equal(await page.evaluate(()=>heliopause.game.cam),1);const pose=await page.evaluate(()=>({...heliopause.player}));await page.mouse.move(400,350);await page.mouse.down();await page.mouse.move(470,370);await page.mouse.up();assert.equal(await page.evaluate(()=>heliopause.player.yaw),pose.yaw);await page.screenshot({path:path.join(artifacts,'v4-hull.png')});
 await page.click('#quickTablet');await page.click('[data-page="NAVIGATION"]');assert.equal(await page.locator('#target option').count(),14);await page.selectOption('#target','10');await page.click('[data-act="nav:navigate"]');assert.equal(await page.evaluate(()=>heliopause.voyage.expedition.autopilot),true);await page.click('[data-act="nav:brake"]');
 await page.click('[data-page="VOICE"]');await page.click('[data-act="play:eva_intro_1"]');await page.waitForFunction(()=>heliopause.voice.active?.id==='eva_intro_1',null,{timeout:30000});await page.click('[data-act="play:eva_intro_2"]');assert.equal(await page.evaluate(()=>heliopause.voice.active.id),'eva_intro_1');assert.ok(await page.evaluate(()=>heliopause.voice.pending)>0);await page.click('[data-act="stopvoice"]');await page.click('[data-act="play:hale_1"]');await page.waitForFunction(()=>heliopause.voice.active?.id==='hale_1');assert.ok(await page.evaluate(()=>heliopause.voice.audio?.src.startsWith('data:audio/')));await page.click('[data-act="stopvoice"]');
 console.log('recorded dialogue queue passed');await page.click('[data-page="SYSTEMS"]');await page.click('[data-act="fault:3"]');assert.equal(await page.evaluate(()=>heliopause.voyage.systems.faults[3]),true);await page.click('[data-act="repair:3"]');assert.equal(await page.evaluate(()=>heliopause.voyage.systems.faults[3]),false);await page.click('[data-page="DRONES"]');await page.click('[data-act="drone:0"]');assert.equal(await page.evaluate(()=>heliopause.voyage.controlled),0);await page.click('#quickTablet');await page.click('[data-act="hit:0"]');await page.click('[data-act="hit:0"]');await page.waitForFunction(()=>heliopause.voyage.controlled===-1);await page.click('#quickTablet');
 await page.setViewportSize({width:390,height:844});await page.click('#quickTablet');await page.click('[data-page="NAVIGATION"]');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:path.join(artifacts,'v4-mobile.png')});assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log('PASS: supplied-v4 offline WebGL, real keyboard flight/brake, fixed sensors, 14 destinations, serialized recorded EVA and Commander speech, maintenance, drone loss, mobile tablet. No runtime errors or external HTTP requests.');
}finally{await browser.close();}
