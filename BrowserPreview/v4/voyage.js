import {validateSurface} from './terrain.js';
import {freshExpedition,restoreExpedition,stepExpedition,action,distance,speed,sites} from '../src/exploration.js';
export {sites,distance,speed};
export const objectives=[
 'Complete the orbital shakedown above Kepler-442b.',
 'Kestrel Wreck: navigate, survey, then recover its recorder.',
 'Cinder: survey the volcanic spectrum to reconstruct the first coordinate.',
 'Pelagos: survey the ocean world and recover the archive carrier wave.',
 'Borealis: survey the icebound relay to complete the route to Pilgrim.',
 'Pilgrim Vault: survey the site and recover the memory archive.',
 'Return to Asterion Anchorage. Walk to the exchange and archive both discoveries.',
 'A Long Way Home — complete. Vesper and the open Reach await.'
];
export function freshVoyage(){return {version:1,expedition:freshExpedition(),phase:0,active:false,complete:false,throttle:0,pilot:false,pending:[],systems:{pressure:[100,100,100,100],temperature:[21,21,21,21],faults:[false,false,false,false],intruders:0},drones:[{name:'KESTREL',room:2,hp:100},{name:'MENDER',room:3,hp:100},{name:'FINCH',room:1,hp:100}],controlled:-1,ai:0};}
export function launchVoyage(v){if(v.active)return;v.active=true;v.phase=1;v.expedition.docked=-1;v.expedition.position=[0,0,3];v.expedition.target=4;v.pending.push('eva_departure','hale_signal');}
export function stepVoyage(v,dt,input={},story=true){dt=Math.max(0,Math.min(.1,dt));if(v.active)stepExpedition(v.expedition,dt,{throttle:v.throttle,...input});
 for(let i=0;i<4;i++){v.systems.pressure[i]=Math.max(0,Math.min(100,v.systems.pressure[i]+(v.systems.faults[i]?-6.5:3.5)*dt));v.systems.temperature[i]=Math.max(21,Math.min(200,v.systems.temperature[i]+(v.systems.faults[i]?5:(21-v.systems.temperature[i])*.08)*dt));}
 v.ai+=dt;for(const d of v.drones)if(v.systems.faults[d.room])d.hp=Math.max(0,d.hp-dt);if(v.ai>8){v.ai=0;v.drones.forEach((d,i)=>{if(d.hp<=0||v.controlled===i)return;if(i===1)v.systems.faults[d.room]=false;if(i===0&&d.room===2)v.systems.intruders=Math.max(0,v.systems.intruders-1);const n=(d.room+1)%4;if(!v.systems.faults[d.room]&&!v.systems.faults[n])d.room=n;});}
 if(!story||!v.active||v.pending.length)return;const e=v.expedition;let done=false,lines=[],target=e.target;
 switch(v.phase){case 1:done=e.recovered.includes(4);lines=['eva_discovery','hale_cinder'];target=10;break;case 2:done=e.scanned.includes(10);target=11;break;case 3:done=e.scanned.includes(11);lines=['hale_pelagos'];target=12;break;case 4:done=e.scanned.includes(12);lines=['hale_borealis'];target=8;break;case 5:done=e.recovered.includes(8);lines=['eva_return','hale_home'];target=0;break;case 6:done=e.docked===0&&e.artifactSold.includes(4)&&e.artifactSold.includes(8);lines=['eva_final'];break;}
 if(done){v.phase++;v.complete=v.phase===7;e.target=target;e.autopilot=false;v.throttle=0;v.pending.push(...lines);}
}
export function command(v,type,atExchange=false){if(['sell','engine','sensor'].includes(type)&&!atExchange){v.expedition.message='Walk to the station exchange first.';return false;}if(['navigate','undock','dock','scan','recover'].includes(type)&&!v.pilot){v.expedition.message='Take the pilot seat first.';return false;}if(!v.active&&type!=='save'){v.expedition.message='Complete the orbital shakedown first.';return false;}const ok=action(v.expedition,type);if(ok&&['navigate','brake','undock','dock'].includes(type))v.throttle=0;return ok;}
export const SAVE_KEY='heliopause-v4-voyage-1';
export function saveVoyage(v,prologue,storage){try{(storage??globalThis.localStorage).setItem(SAVE_KEY,JSON.stringify({version:1,voyage:v,prologue}));return true;}catch{return false;}}
export function loadVoyage(storage){try{const raw=JSON.parse((storage??globalThis.localStorage).getItem(SAVE_KEY));if(raw?.version!==1)return null;const e=restoreExpedition(raw.voyage?.expedition);const n=raw.voyage?.phase;if(!e||!Number.isInteger(n)||n<0||n>7)return null;const v=freshVoyage();Object.assign(v,{expedition:e,phase:n,active:n>0,complete:n===7});if(validateSurface(raw.voyage.surface)&&['planet','moon'].includes(sites[raw.voyage.surface.planet].kind)&&raw.voyage.surface.planet!==13){v.surface={...raw.voyage.surface,rover:!!raw.voyage.surface.rover,recall:0};}v.samples=Array.isArray(raw.voyage.samples)?raw.voyage.samples.filter(s=>s&&typeof s.id==='string'&&s.id.length<100&&Number.isInteger(s.planet)&&sites[s.planet]&&['water','shore','grass','rock','ice','basalt','sand','crystal'].includes(s.biome)).slice(0,128):[];const p=raw.prologue;if(!p||!Number.isInteger(p.step)||p.step<0||p.step>7||!Number.isFinite(p.altitude))return null;return {voyage:v,prologue:{step:p.step,altitude:Math.max(55,Math.min(400,p.altitude)),story:p.story!==false}};}catch{return null;}}
