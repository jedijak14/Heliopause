import {moveOnGlobe,arcDistance,sampleTerrain} from './terrain.js';
export function features(s){const origin=s.origin||s.lander,at=(x,z)=>moveOnGlobe(origin,x,z,s.radius);return {outpost:at(-25,-35),relay:at(22,-45),vent:at(14,-24),flora:at(-12,-18)};}
export function stepEncounter(s,dt){s.origin??=[...s.lander];s.suit=Number.isFinite(s.suit)?s.suit:100;s.elapsed=(s.elapsed||0)+dt;const f=features(s),d=arcDistance(s.n,f.vent,s.radius);const pulse=.5+.5*Math.sin(s.elapsed*1.4);s.hazard=s.planet===10&&d<9&&pulse>.35?'THERMAL VENT — RETREAT':s.planet===12&&sampleTerrain(s.planet,s.n).height>80?'ICE STORM — SEEK SHELTER':'';const shelter=arcDistance(s.n,f.outpost,s.radius)<12||arcDistance(s.n,s.lander,s.radius)<10;
 if(s.hazard&&!shelter)s.suit=Math.max(0,s.suit-dt*(s.planet===10?9:2));else s.suit=Math.min(100,s.suit+dt*2);return s.suit===0;}
export function surveyRelay(s){const f=features(s);if(arcDistance(s.n,f.relay,s.radius)>7)return false;s.relayDecoded=true;return true;}
