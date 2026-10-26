export const HABITATS=Object.freeze([
 {id:'kitchen',name:'GALLEY / KITCHEN',side:-1,z:8,color:[.12,.38,.32]},
 {id:'living',name:'LIVING ROOM',side:1,z:8,color:[.19,.29,.49]},
 {id:'bathroom',name:'BATHROOM / SHOWER',side:-1,z:14,color:[.14,.4,.47]},
 {id:'gym',name:'GYMNASIUM',side:1,z:14,color:[.58,.24,.11]},
 {id:'pool',name:'INDOOR POOL',side:-1,z:20,color:[.06,.35,.4]},
 {id:'dining',name:'GARDEN / DINING',side:1,z:20,color:[.29,.4,.16]}
]);
export const DEPLOY_SECONDS=8;
export function habitatState(saved){return HABITATS.map(p=>({...p,phase:saved?.[p.id]==='deployed'?'deployed':'stowed',fraction:saved?.[p.id]==='deployed'?1:0}));}
export function occupied(p,player){return player&&player.x*p.side>3.1&&Math.abs(player.z-p.z)<2.9;}
export function flightInterlocked(pods){return pods.some(p=>p.phase!=='stowed');}
export function requestHabitat(p,deploy,{speed=0,throttle=0,autopilot=false,transit=false,player}={}){
 if(p.phase==='deploying'||p.phase==='stowing')return 'Actuators moving. Connecting door locked.';
 if(deploy){if(p.phase==='deployed')return '';if(speed>.001||Math.abs(throttle)>.001||autopilot||transit)return 'Brake to a complete stop and disengage autopilot before deploying.';p.phase='deploying';}
 else{if(p.phase==='stowed')return '';if(occupied(p,player))return 'Compartment occupied. Return to the central deck before compacting.';p.phase='stowing';}
 return '';
}
export function stepHabitat(p,dt){const previous=p.phase;if(p.phase==='deploying'){p.fraction=Math.min(1,p.fraction+Math.max(0,dt)/DEPLOY_SECONDS);if(p.fraction>=1)p.phase='deployed';}else if(p.phase==='stowing'){p.fraction=Math.max(0,p.fraction-Math.max(0,dt)/DEPLOY_SECONDS);if(p.fraction<=0)p.phase='stowed';}return previous!==p.phase;}
export function serializeHabitats(pods){return Object.fromEntries(pods.map(p=>[p.id,p.phase==='deployed'?'deployed':'stowed']));}
