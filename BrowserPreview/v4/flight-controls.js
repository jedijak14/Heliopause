import {attitude,fromEuler,rotate} from './flight-dynamics.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// The tablet, keyboard and pilot HUD write the SAME authoritative sector state.
export function pilotCommand(v,flight,type,amount=0){
 if(!v.pilot)return {ok:false,message:'Take the pilot seat first.'};
 const e=v.expedition;
 if(v.active){
  if(type==='manual'){e.autopilot=false;return {ok:true};}
  if(type==='brake'){e.autopilot=false;e.velocity=[0,0,0];v.throttle=0;return {ok:true};}
  if(type==='thrust'){if(e.docked>=0)return {ok:false,message:'Docking clamps are engaged. Press UNDOCK before applying thrust.'};e.autopilot=false;v.throttle=clamp(v.throttle+amount,-1,1);return {ok:true};}
  if(['pitch','yaw','roll'].includes(type)){e.autopilot=false;attitude(e,type==='yaw'?amount:0,type==='pitch'?amount:0,type==='roll'?amount:0);return {ok:true};}
  return {ok:false,message:'Entry/climb programs belong to the Kepler survey. Use NAVIGATION for sector flight.'};
 }
 const q=fromEuler(flight.yaw||0,(flight.pitch||0)*Math.PI/180,flight.roll||0);
 flight.body??={orientation:q,velocity:rotate(q,[0,0,-flight.v/1000])};
 if(type==='thrust'){const d=rotate(flight.body.orientation,[0,0,-amount]);flight.body.velocity=flight.body.velocity.map((x,i)=>x+d[i]);const speed=Math.hypot(...flight.body.velocity);if(speed>9)flight.body.velocity=flight.body.velocity.map(x=>x*9/speed);flight.v=Math.hypot(...flight.body.velocity)*1000;flight.ap='none';}
 else if(['yaw','pitch','roll'].includes(type)){attitude(flight.body,type==='yaw'?amount:0,type==='pitch'?amount:0,type==='roll'?amount:0);flight.pitch=flight.body.pitch*180/Math.PI;flight.tp=flight.pitch;flight.yaw=flight.body.yaw;flight.roll=flight.body.roll;flight.ap='none';}
 else if(type==='manual'){flight.ap='none';flight.warp=1;}
 else if(type==='brake'){flight.ap='none';flight.v=0;flight.tp=flight.pitch;flight.body.velocity=[0,0,0];}
 else return {ok:false,message:'Unknown orbital control.'};
 return {ok:true};
}
