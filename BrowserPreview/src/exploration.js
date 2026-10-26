import {integrate,fromEuler,validOrientation} from '../v4/flight-dynamics.js';
import {planRoute} from './route-planner.js';
import {freshCampaign,validateCampaign} from './campaign.js';
import {appendCatalog} from '../v4/science-catalog.js';
import catalog from '../../Shared/sector.json' with { type: 'json' };
export const sites=catalog.sites.map(s=>({...s}));appendCatalog(sites);
export const SAVE_KEY='heliopause-expedition-v1';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const length=v=>Math.hypot(...v);
export function freshExpedition(){return {version:1,position:[0,0,.56],velocity:[0,0,0],yaw:0,pitch:0,roll:0,orientation:[0,0,0,1],target:3,docked:0,onStation:false,autopilot:false,scanning:false,scanProgress:0,scanned:[],recovered:[],sold:[],artifactSold:[],campaign:freshCampaign(),credits:0,engine:0,sensor:0,totalTravel:0,visits:[0],message:'Welcome to the Reach. Undock, survey Glasswake, then return to the exchange.',complete:false};}
export function distance(e,index=e.target){const s=sites[index];return s?Math.max(0,length(e.position.map((v,i)=>v-s.position[i]))-s.radius):Infinity;}
export const scanRange=e=>2.5+e.sensor*2;
export const maxSpeed=e=>8+e.engine*4;
export const speed=e=>length(e.velocity);
export const pendingCredits=e=>e.scanned.filter(i=>!e.sold.includes(i)).reduce((sum,i)=>sum+sites[i].reward,0)+e.recovered.filter(i=>!(e.artifactSold||[]).includes(i)).length*250;
export function selectTarget(e,i){if(!Number.isInteger(i)||!sites[i])return false;e.target=i;e.path=[];e.autopilot=false;e.scanning=false;e.scanProgress=0;return true;}
export function action(e,type){
 const s=sites[e.target],near=distance(e),respond=(ok,text)=>{e.message=text;return ok;};
 if(type==='undock'){if(e.onStation)return respond(false,'Return to the ship before undocking.');if(e.docked<0)return respond(false,'The ship is already free.');e.docked=-1;e.velocity=[0,0,0];return respond(true,'Moorings released. Free flight available.');}
 if(type==='navigate'){if(e.docked>=0||e.onStation)return respond(false,'Undock before engaging navigation.');e.autopilot=!e.autopilot;e.scanning=false;if(e.autopilot){const delta=e.position.map((x,i)=>x-s.position[i]),len=length(delta)||1,stop=s.radius+(s.kind==='station'?.42:1.3);const goal=s.position.map((x,i)=>x+delta[i]/len*stop);e.path=planRoute(e.position,goal,sites.filter(x=>['planet','moon'].includes(x.kind)));if(!e.path.length){e.autopilot=false;return respond(false,'No clear route. Move away from the nearby body, then retry.');}}return respond(true,e.autopilot?`Course set for ${s.name}.`:'Autopilot disengaged. Manual flight.');}
 if(type==='brake'){e.autopilot=false;e.velocity=[0,0,0];return respond(true,'Thrusters holding position.');}
 if(type==='dock'){if(s.kind!=='station'||near>.6||speed(e)>.35)return respond(false,'Docking requires a station within 0.6 km and speed below 0.35 km/s.');e.docked=e.target;e.velocity=[0,0,0];e.autopilot=false;e.scanning=false;if(!e.visits.includes(e.target))e.visits.push(e.target);return respond(true,`${s.name}: docking clamps secured.`);}
 if(type==='board'){if(e.docked<0)return respond(false,'Dock at an inhabited station first.');e.onStation=true;return respond(true,'Arrived in the station concourse. Find the exploration exchange.');}
 if(type==='return'){e.onStation=false;return respond(true,'Returned aboard SV-7 Longhaul.');}
 if(type==='scan'){if(e.docked>=0||near>scanRange(e)||speed(e)>.35)return respond(false,`Hold below 0.35 km/s within ${scanRange(e).toFixed(1)} km of the survey boundary.`);if(e.scanned.includes(e.target))return respond(false,'This site is already in your discovery journal.');e.scanning=true;e.scanProgress=0;return respond(true,`Surveying ${s.name}. Maintain position.`);}
 if(type==='recover'){if(!s.artifact||!e.scanned.includes(e.target)||near>1.8||speed(e)>.35||e.recovered.includes(e.target))return respond(false,'Scan an artifact site, approach within 1.8 km, and hold position to recover it.');e.recovered.push(e.target);return respond(true,`Recovered artifact: ${s.name}. Cargo sealed.`);}
 if(type==='sell'){if(!e.onStation||e.docked<0)return respond(false,'Visit an inhabited station exchange to archive discoveries.');const gain=pendingCredits(e);if(!gain)return respond(false,'No new survey data to archive.');e.credits+=gain;e.artifactSold=[...e.recovered];e.sold=[...new Set([...e.sold,...e.scanned])];e.complete=sites.filter(s=>s.reward>0).every(s=>e.sold.includes(sites.indexOf(s)));return respond(true,`Exploration archive accepted. +${gain} credits.${e.complete?' Reach survey complete. Free exploration remains open.':''}`);}
 if(type==='engine'||type==='sensor'){const level=e[type],cost=(level+1)*(type==='engine'?350:250);if(!e.onStation||e.docked<0||level>=3||e.credits<cost)return respond(false,`Upgrade requires a station exchange and ${cost} credits. Maximum level 3.`);e.credits-=cost;e[type]++;return respond(true,`${type==='engine'?'Drive':'Scanner'} upgraded to level ${e[type]}.`);}
 return respond(false,'Unknown command.');
}
export function stepExpedition(e,dt,input={}){
 dt=clamp(Number.isFinite(dt)?dt:0,0,.1);if(e.docked>=0||e.onStation){e.velocity=[0,0,0];return;}
 if(['turn','pitch','roll','vertical','lateral','throttle'].some(k=>Math.abs(input[k]||0)>0))e.autopilot=false;
 let desired;
 if(e.autopilot){const target=sites[e.target];let goal=e.path?.[0];if(!goal){const delta=e.position.map((x,i)=>x-target.position[i]),len=length(delta)||1;goal=target.position.map((x,i)=>x+delta[i]/len*(target.radius+(target.kind==='station'?.42:1.3)));}let delta=goal.map((x,i)=>x-e.position[i]),d=length(delta);
   if(d<.035){if(e.path?.length>1){e.path.shift();goal=e.path[0];delta=goal.map((x,i)=>x-e.position[i]);d=length(delta);}else{e.velocity=[0,0,0];e.autopilot=false;e.message=`Arrived at ${target.name}. ${target.kind==='station'?'Docking available.':'Ready to survey.'}`;return;}}
   const rate=Math.min(maxSpeed(e),Math.max(.06,d*.8));desired=delta.map(x=>x/Math.max(d,.001)*rate);e.yaw=Math.atan2(-delta[0],-delta[2]);e.pitch=Math.asin(clamp(delta[1]/Math.max(d,.001),-1,1));
 e.orientation=fromEuler(e.yaw,e.pitch);e.roll=0;
 }else integrate(e,dt,input,maxSpeed(e));
 if(e.autopilot){const alpha=Math.min(1,dt*3);e.velocity=e.velocity.map((v,i)=>v+(desired[i]-v)*alpha);}
 const old=[...e.position],next=old.map((v,i)=>v+e.velocity[i]*dt);
 // Swept sphere interception prevents tunnelling through celestial bodies at high speed.
 for(const body of sites.filter(s=>s.kind==='planet'||s.kind==='moon')){
   const segment=next.map((v,i)=>v-old[i]),offset=old.map((v,i)=>v-body.position[i]);const len2=segment.reduce((sum,v)=>sum+v*v,0);const t=len2?clamp(-offset.reduce((sum,v,i)=>sum+v*segment[i],0)/len2,0,1):0;
   if(!(input.terrainFlight&&body.kind!=='station'&&body!==sites[13])&&length(offset.map((v,i)=>v+t*segment[i]))<body.radius+.15){e.velocity=[0,0,0];e.autopilot=false;e.message='Proximity brake: celestial body ahead. Steer around it.';return;}
 }
 e.position=next;e.totalTravel+=length(next.map((v,i)=>v-old[i]));
 if(e.scanning){if(distance(e)>scanRange(e)||speed(e)>.35){e.scanning=false;e.scanProgress=0;e.message='Survey interrupted: hold position inside scanner range.';}else{e.scanProgress+=dt/(6-e.sensor);if(e.scanProgress>=1){e.scanning=false;e.scanProgress=1;if(!e.scanned.includes(e.target))e.scanned.push(e.target);e.message=`Discovery recorded: ${sites[e.target].name}. ${sites[e.target].artifact?'Recovery signal available.':'Return data to a station for credits.'}`;}}}
}
function validIndices(v){return Array.isArray(v)&&v.every(i=>Number.isInteger(i)&&i>=0&&i<sites.length)&&new Set(v).size===v.length;}
export function restoreExpedition(raw){
 try{const e=typeof raw==='string'?JSON.parse(raw):raw;if(!e||e.version!==1)return null;
 if(e.orientation!==undefined&&!validOrientation(e.orientation))return null;if(e.roll!==undefined&&!Number.isFinite(e.roll))return null;
 if(!Array.isArray(e.position)||e.position.length!==3||!e.position.every(v=>Number.isFinite(v)&&Math.abs(v)<1e6))return null;
 for(const k of ['scanned','recovered','sold','visits'])if(!validIndices(e[k]))return null;
 for(const k of ['yaw','pitch','credits','engine','sensor','totalTravel'])if(!Number.isFinite(e[k]))return null;
 if(!Number.isInteger(e.target)||!sites[e.target]||!Number.isInteger(e.docked)||e.docked< -1||e.docked>=sites.length||(e.docked>=0&&sites[e.docked].kind!=='station'))return null;
 if(e.docked>=0&&distance({...e,target:e.docked})>.7)return null;
 if(e.credits<0||e.credits>1e7||e.totalTravel<0||e.engine<0||e.engine>3||e.sensor<0||e.sensor>3||!Number.isInteger(e.engine)||!Number.isInteger(e.sensor))return null;
 if(e.sold.some(i=>!e.scanned.includes(i))||e.recovered.some(i=>!e.scanned.includes(i)||!sites[i].artifact))return null;
 if(e.artifactSold!==undefined&&(!validIndices(e.artifactSold)||e.artifactSold.some(i=>!e.recovered.includes(i))))return null;
 return {...freshExpedition(),...e,campaign:validateCampaign(e.campaign),artifactSold:e.artifactSold||e.recovered.filter(i=>e.sold.includes(i)),position:[...e.position],velocity:[0,0,0],autopilot:false,scanning:false,scanProgress:0,onStation:false,orientation:e.orientation||fromEuler(e.yaw,e.pitch,e.roll||0),roll:e.roll||0,pitch:clamp(e.pitch,-Math.PI/2,Math.PI/2),complete:sites.filter(s=>s.reward>0).every(s=>e.sold.includes(sites.indexOf(s)))};
 }catch{return null;}
}
export function saveExpedition(e,storage){try{(storage??globalThis.localStorage).setItem(SAVE_KEY,JSON.stringify(e));return true;}catch{return false;}}
export function loadExpedition(storage){try{return restoreExpedition((storage??globalThis.localStorage).getItem(SAVE_KEY));}catch{return null;}}
