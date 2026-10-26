import {tickCampaign} from './campaign.js';
import {stepExpedition, action as expeditionAction, speed} from './exploration.js';
export const roomNames = ['Bridge', 'Crew quarters', 'Cargo bay', 'Engine room'];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function createState() {
  return {
    view: 'bridge', tab: 'flight', room: 0, mode: 'dock', seat: false,
    throttle: 28, speed: 0, distance: 0, elapsed: 0, cruiseTime: 0, mission: 0,
    rooms: roomNames.map(name => ({ name, pressure: 100, temp: 21, breach: false, vent: false })),
    doors: [false, false, false, false],
    drones: [{name:'KESTREL',role:'Security',health:100,room:2,phase:0}, {name:'MENDER',role:'Maintenance',health:100,room:3,phase:1}, {name:'FINCH',role:'Survey',health:100,room:1,phase:2}],
    controlled: -1, intruders: 0, staticUntil: 0, walking: false, quality: 'high', muted: true,
    logs: [{time:0, text:'SV-7 Longhaul · all systems initialized.', type:'info'}, {time:0,text:'Holding position above Asterion IV. Awaiting pilot.',type:'info'}],
    nextBoarding: 100, aiTime: 0,
  };
}
export const unsafe = r => r.breach || r.vent || r.pressure < 65 || r.temp > 65;
export function doorLocked(s, i) { return i === 3 ? s.mode !== 'dock' : s.mode === 'emergency' || unsafe(s.rooms[i]) || unsafe(s.rooms[i+1]); }
export function log(s, text, type='info') { s.logs.unshift({time:s.elapsed, text, type}); s.logs.length = Math.min(s.logs.length, 40); }
export function setFlight(s, mode) {
  if(!s.seat || !['dock','cruise','emergency'].includes(mode)) return false;
  if(s.expedition){if(s.expedition.onStation)return false;if(mode==='cruise'&&s.expedition.docked>=0)expeditionAction(s.expedition,'undock');if(mode!=='cruise')expeditionAction(s.expedition,'brake');}
  s.mode=mode; log(s, mode==='cruise'?'Cruise vector confirmed. External airlock sealed.':mode==='dock'?'Station keeping engaged. Docking route available.':'Emergency lockdown. All bulkheads sealed.', mode==='emergency'?'warn':'info');
  if(mode==='cruise') s.mission=Math.max(1,s.mission);
  return true;
}
export function fault(s, room, thermal=false) {
  const r=s.rooms[room]; if(!r) return;
  r[thermal?'vent':'breach']=true;
  log(s,`${r.name}: ${thermal?'thermal venting':'pressure breach'} detected. Compartment isolated.`,'warn');
}
export function repair(s, i) {
  const r=s.rooms[i]; if(!r) return;
  r.breach=r.vent=false;
  if(s.mission===2&&i===3) s.mission=3;
  log(s,`${r.name}: fault sealed. Atmosphere recovering.`,'good');
}
export function route(start, end, locks) {
  if(start<0||start>3||end<0||end>3) return [];
  const result=[start], step=Math.sign(end-start);
  while(result.at(-1)!==end) { const p=result.at(-1); if(locks[Math.min(p,p+step)]) return []; result.push(p+step); }
  return result;
}
export function tick(s, dt) {
  if(s.inMenu||s.inCutscene)return;
  dt=clamp(dt,0,.1); s.elapsed+=dt;tickCampaign(s,dt);
  for(const r of s.rooms) {
    r.pressure=clamp(r.pressure+(r.breach?-6.5:3.5)*dt,0,100);
    r.temp=clamp(r.temp+(r.vent?8:(21-r.temp)*.08)*dt,-80,220);
  }
  s.doors=s.doors.map((v,i)=>v&&!doorLocked(s,i));
  if(s.expedition&&!(s.expedition.campaign?.mode==='story'&&s.expedition.campaign.step<8)){stepExpedition(s.expedition,dt,{...s.flightInput,throttle:s.mode==='cruise'?s.throttle/100:0});s.speed=speed(s.expedition);s.distance=s.expedition.totalTravel;}else s.speed+=( (s.mode==='cruise'?s.throttle*.042:0)-s.speed)*Math.min(dt*.7,1);
  if(!s.expedition)s.distance+=s.speed*dt;
  if(s.mode==='cruise') {
    s.cruiseTime+=dt;
    if(!s.expedition&&s.mission===1&&s.cruiseTime>22) { fault(s,3,true); s.mission=2; }
    if(!s.expedition&&s.cruiseTime>s.nextBoarding) { s.intruders=Math.min(4,s.intruders+1); s.nextBoarding+=110; log(s,'Unknown life sign detected in cargo bay.','warn'); }
  }
  s.aiTime+=dt;
  for(let i=0;i<3;i++) {
    const d=s.drones[i]; if(d.health<=0) continue;
    if(unsafe(s.rooms[d.room])) d.health=clamp(d.health-dt*2,0,100);
    if(d.health<=0&&s.controlled===i) { s.controlled=-1; s.view=s.seat?'pilot':'bridge'; s.room=0; s.staticUntil=s.elapsed+2; log(s,`${d.name}: remote link lost.`,'warn'); }
  }
  if(s.aiTime>8) {
    s.aiTime=0;
    for(let i=0;i<3;i++) {
      const d=s.drones[i]; if(d.health<=0||s.controlled===i) continue;
      if(i===1&&!(s.expedition?.campaign?.mode==='story'&&s.expedition.campaign.step===6)&&(s.rooms[d.room].breach||s.rooms[d.room].vent)) repair(s,d.room);
      if(i===0&&d.room===2&&s.intruders>0) { s.intruders--; log(s,'KESTREL: intrusion contained.','good'); }
      const goal=(d.room+1)%4, path=route(d.room,goal,[0,1,2].map(j=>doorLocked(s,j)));
      if(path.length>1) d.room=path[1];
    }
  }
}
export function timecode(seconds) { const t=Math.floor(seconds); return [Math.floor(t/3600),Math.floor(t/60)%60,t%60].map(v=>String(v).padStart(2,'0')).join(':'); }
