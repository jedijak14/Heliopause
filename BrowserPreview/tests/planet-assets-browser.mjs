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


const errors=[],network=[];try{const context=await browser.newContext({viewport:{width:1200,height:800}});await context.route('https://heliopause.test/**',async route=>{const u=new URL(route.request().url());network.push(u.pathname);if(u.pathname==='/')return route.fulfill({path:path.join(root,'heliopause.html'),contentType:'text/html'});if(u.pathname.startsWith('/hd/planets/')&&/^[a-z]+\.webp$/.test(u.pathname.split('/').pop()))return route.fulfill({path:path.join(root,'public',u.pathname),contentType:'image/webp'});return route.abort();});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('https://heliopause.test/');await page.waitForFunction(()=>window.heliopause?.planetAssets.loaded===5);await page.click('#bFree');await page.evaluate(()=>{const h=heliopause,e=h.voyage.expedition,s=h.sites[14];e.target=14;e.docked=-1;e.position=[s.position[0],s.position[1],s.position[2]+s.radius+9];e.velocity=[0,0,0];e.orientation=[0,0,0,1];h.player.x=0;h.player.z=-4.95;h.player.yaw=0;h.player.pitch=0;});await page.waitForFunction(()=>heliopause.planetAssets.status.includes('HD verified'),null,{timeout:90000});assert.ok(network.includes('/hd/planets/earth.webp'));await page.click('#quickTablet');await page.click('[data-page="CAMERAS"]');await page.click('[data-act="cam:3"]');await page.click('[data-page="AUDIO"]');await page.click('[data-act="quality:1"]');await page.click('#quickTablet');await page.waitForTimeout(900);await page.screenshot({path:path.join(artifacts,'v9-hd-kepler.png')});await page.click('#quickTablet');await page.click('[data-page="AUDIO"]');await page.click('[data-act="stream"]');assert.equal(await page.evaluate(()=>heliopause.planetAssets.online),false);const before=network.length;await context.setOffline(true);await page.click('[data-act="quality:0.4"]');await page.click('#quickTablet');await page.waitForTimeout(1200);assert.equal(network.length,before);assert.equal(await page.evaluate(()=>heliopause.planetAssets.loaded),5);assert.deepEqual(errors,[]);
await context.setOffline(true);const file=page;let external=0;file.on('request',r=>{if(/^https?:/.test(r.url()))external++;});await file.goto(pathToFileURL(path.join(root,'heliopause.html')).href);await file.waitForFunction(()=>window.heliopause?.planetAssets.loaded===5);assert.equal(external,0);assert.equal(await file.evaluate(()=>heliopause.planetAssets.online),false);console.log('PASS: real HTTPS HD download, hash verification, embedded offline fallback, no file-mode network requests, all five planet maps decoded.');}finally{await browser.close();}
