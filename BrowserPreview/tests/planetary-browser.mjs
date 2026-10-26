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



const errors=[];try{
 const context=await browser.newContext({viewport:{width:800,height:600}});await context.setOffline(true);const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.join(root,'heliopause.html')).href);await page.waitForFunction(()=>window.heliopause?.planetAssets.loaded===5&&heliopause.planetAssets.lunarTriangles===23232);await page.click('#bFree');await page.click('#quickTablet');await page.click('[data-page="AUDIO"]');await page.click('[data-act="quality:0.4"]');await page.click('#quickTablet');
 // Fixture only establishes a starting orbit. All motion/contact below runs through the production loop.
 await page.evaluate(()=>{const h=heliopause,e=h.voyage.expedition,s=h.sites[14];e.docked=-1;e.target=14;e.position=[s.position[0],s.position[1]+s.radius+3.005,s.position[2]];e.velocity=[0,-.1,0];e.orientation=[0,0,0,1];e.autopilot=false;h.player.z=-4.95;h.player.pitch=-.3;h.voyage.pilot=true;});
 await page.waitForFunction(()=>heliopause.voyage.expedition.position[1]<heliopause.sites[14].position[1]+heliopause.sites[14].radius+2.99,null,{timeout:60000});
 assert.equal(await page.evaluate(()=>heliopause.transit),null);assert.equal(await page.evaluate(()=>heliopause.game.mode),'play');assert.equal(await page.evaluate(()=>heliopause.voyage.expedition.autopilot),false);
 // Equatorial point with known deterministic terrain height, computed by the same independently imported terrain module.
 const {sampleTerrain}=await import('../v4/terrain.js');const height=Math.max(0,sampleTerrain(14,[0,1,0]).height);
 await page.evaluate(height=>{const h=heliopause,e=h.voyage.expedition,s=h.sites[14];e.position=[s.position[0],s.position[1]+s.radius+(height+.8)/1000,s.position[2]];e.velocity=[0,-.002,0];},height);
 await page.waitForFunction(()=>!!heliopause.grounded,null,{timeout:60000});assert.deepEqual(await page.evaluate(()=>heliopause.voyage.expedition.velocity),[0,0,0]);assert.equal(await page.evaluate(()=>heliopause.grounded.planet),14);assert.equal(await page.evaluate(()=>heliopause.game.mode),'play');
 await page.screenshot({path:path.join(artifacts,'v10-manual-touchdown.png')});
 await page.click('#quickTablet');await page.click('[data-page="SURFACE"]');await page.click('[data-act="takeoff"]');await page.waitForFunction(()=>!heliopause.grounded,null,{timeout:30000});assert.equal(await page.evaluate(()=>heliopause.transit),null);assert.equal(await page.evaluate(()=>heliopause.voyage.expedition.autopilot),false);
 assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>heliopause.gl.getError()),0);console.log('PASS: browser manual flight through 3 km, no transit scene/autopilot, swept touchdown, manual liftoff, offline planet maps, no JS or GL errors.');
}finally{await browser.close();}
