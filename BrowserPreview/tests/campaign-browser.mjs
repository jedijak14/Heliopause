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
 const context=await browser.newContext({viewport:{width:1440,height:900}});await context.setOffline(true);
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url());});
 await page.goto(pathToFileURL(path.join(root,'heliopause.html')).href);
 await page.waitForFunction(()=>window.heliopause&&document.querySelector('.load-screen').classList.contains('hidden'),null,{timeout:30000});
 await page.click('[data-story="new"]');await page.waitForFunction(()=>heliopause.state.inCutscene);await page.screenshot({path:path.join(artifacts,'story-awakening.png')});
 assert.equal(await page.evaluate(()=>heliopause.state.cinema.id),'eva_intro');
 await page.keyboard.press('Space');await page.click('[data-tab="systems"]');await page.waitForFunction(()=>heliopause.state.cinema?.id==='eva_quarters');await page.keyboard.press('Space');
 await page.click('[data-campaign="lights"]');await page.waitForFunction(()=>heliopause.state.expedition.campaign.step===2);
 await page.click('[data-room="crew"]');await page.screenshot({path:path.join(artifacts,'story-quarters.png')});await page.click('[data-campaign="handprint"]');await page.waitForFunction(()=>heliopause.state.cinema?.id==='eva_view',null,{timeout:30000});await page.keyboard.press('Space');
 await page.click('[data-campaign="shade"]');await page.waitForFunction(()=>heliopause.state.expedition.campaign.step===4);
 await page.click('[data-room="bridge"]');await page.click('[data-action="seat"]');await page.click('[data-campaign="entry"]');await page.waitForFunction(()=>heliopause.state.cinema?.id==='eva_entry');await page.screenshot({path:path.join(artifacts,'story-entry.png')});await page.keyboard.press('Space');
 await page.waitForFunction(()=>heliopause.state.expedition.campaign.step===5);assert.equal(await page.evaluate(()=>heliopause.state.expedition.campaign.autopilot),'entry');
 // Resume fixture isolates the endgame UI. Continuous travel/physics are tested
 // without fixture jumps in campaign.test.js, including every intermediate objective.
 await page.evaluate(()=>{const e=heliopause.state.expedition;e.position=[0,0,.56];e.velocity=[0,0,0];e.docked=0;e.target=0;e.scanned=[4,8];e.recovered=[4,8];e.sold=[];e.artifactSold=[];e.campaign.step=10;e.campaign.altitude=400;e.campaign.pending=[];localStorage.setItem('heliopause-expedition-v1',JSON.stringify(e));});
 await page.reload();await page.waitForFunction(()=>window.heliopause&&document.querySelector('.load-screen').classList.contains('hidden'),null,{timeout:30000});await page.click('[data-story="resume"]');await page.click('[data-tab="navigation"]');await page.click('[data-exp="board"]');
 assert.equal(await page.evaluate(()=>heliopause.state.expedition.onStation),true);
 await page.keyboard.down('KeyW');await page.keyboard.down('ShiftLeft');await page.waitForFunction(()=>heliopause.state.atExchange,null,{timeout:90000});await page.keyboard.up('KeyW');await page.keyboard.up('ShiftLeft');
 await page.screenshot({path:path.join(artifacts,'story-station.png')});await page.click('[data-exp="sell"]');await page.waitForFunction(()=>heliopause.state.cinema?.id==='eva_final',null,{timeout:30000});assert.equal(await page.evaluate(()=>heliopause.state.expedition.campaign.complete),true);assert.equal(await page.evaluate(()=>heliopause.state.expedition.credits),1280);await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>heliopause.state.expedition.campaign.step),11);
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log('PASS: offline story menu, cutscene/skip, tablet, lights, handprint, curtain, pilot/entry controls; saved endgame fixture, real station walk, exchange, voiced ending, free exploration. Zero runtime errors or HTTP requests.');
}finally{await browser.close();}
