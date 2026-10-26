const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// The tablet, keyboard and pilot HUD write the SAME authoritative sector state.
export function pilotCommand(v,flight,type,amount=0){
 if(!v.pilot)return {ok:false,message:'Take the pilot seat first.'};
 const e=v.expedition;
 if(v.active){
  if(type==='manual'){e.autopilot=false;return {ok:true};}
  if(type==='brake'){e.autopilot=false;e.velocity=[0,0,0];v.throttle=0;return {ok:true};}
  if(type==='thrust'){if(e.docked>=0)return {ok:false,message:'Docking clamps are engaged. Press UNDOCK before applying thrust.'};e.autopilot=false;v.throttle=clamp(v.throttle+amount,0,1);return {ok:true};}
  if(type==='pitch'||type==='yaw'){e.autopilot=false;e[type]=type==='pitch'?clamp(e.pitch+amount,-1.3,1.3):e.yaw+amount;return {ok:true};}
  return {ok:false,message:'Entry/climb programs belong to the Kepler survey. Use NAVIGATION for sector flight.'};
 }
 if(type==='thrust')flight.v=clamp(flight.v+amount*1000,1500,9000);
 else if(type==='pitch'){if(flight.ap!=='none')return {ok:false,message:'Select MANUAL before adjusting orbital pitch.'};flight.tp=clamp(flight.tp+amount*180/Math.PI,-15,15);}
 else if(type==='yaw')flight.yaw=(flight.yaw||0)+amount;
 else if(type==='manual'){flight.ap='none';flight.warp=1;}
 else if(type==='brake'){flight.ap='hold';flight.tp=0;}
 else return {ok:false,message:'This control is available after the orbital shakedown.'};
 return {ok:true};
}
