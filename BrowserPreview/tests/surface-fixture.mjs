// Test-only arrival fixture: does not set grounded, invoke a landing timer, or expose a game shortcut.
// Production flight/contact performs the final approach. Other suites cover travel from orbit.
import {sampleTerrain,landingPoint} from '../v4/terrain.js';
export async function touchdownFixture(page,planet){
 const n=landingPoint(planet),height=Math.max(0,sampleTerrain(planet,n).height),raw=[n[2],0,-n[0],1+n[1]],length=Math.hypot(...raw),q=raw.map(x=>x/length);
 await page.evaluate(({planet,n,height,q})=>{const h=heliopause,e=h.voyage.expedition,s=h.sites[planet];e.target=planet;e.docked=-1;e.position=s.position.map((v,k)=>v+n[k]*(s.radius+(height+.8)/1000));e.velocity=n.map(x=>x*-.002);e.orientation=q;e.autopilot=false;h.flight.ap='none';h.flight.sharedWorld=true;h.voyage.throttle=0;},{planet,n,height,q});
 await page.waitForFunction(()=>!!heliopause.grounded,null,{timeout:90000});
 // A full exterior wrap now correctly blocks the pressure hatch. Retract through real controls.
 if(await page.evaluate(()=>heliopause.shadeCoverage>.01||heliopause.game.autoShaded||heliopause.windows.every(w=>!w.open))){
  const tab=await page.evaluate(()=>heliopause.game.tab);if(!tab)await page.click('#quickTablet');await page.click('[data-page="WINDOWS"]');
  await page.waitForFunction(()=>!heliopause.game.autoShaded,null,{timeout:90000});await page.click('[data-act="winall:1"]');await page.waitForFunction(()=>heliopause.shadeCoverage<.01,null,{timeout:90000});if(!tab)await page.click('#quickTablet');
 }
}
export async function launchFixture(page){
 await page.waitForFunction(()=>heliopause.doors.find(d=>d.name==='EXTERIOR HATCH').open<.01,null,{timeout:30000});
 await page.evaluate(()=>{heliopause.player.x=0;heliopause.player.z=-4.95;});
 if(!await page.evaluate(()=>heliopause.voyage.pilot))await page.click('#quickPilot');
 if(!await page.evaluate(()=>heliopause.game.tab))await page.click('#quickTablet');await page.click('[data-page="SURFACE"]');await page.click('[data-act="takeoff"]');await page.waitForFunction(()=>!heliopause.grounded);
 // Leave pilot seat so later walking tests use WASD for walking, not ship flight.
 if(await page.evaluate(()=>heliopause.voyage.pilot))await page.click('#quickPilot');
}
