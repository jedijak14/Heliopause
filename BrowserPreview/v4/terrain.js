import {scienceWorlds} from './science-catalog.js';
import {rotate,validOrientation} from './flight-dynamics.js';
// Deterministic globe terrain. Unit-vector sampling has no longitude seam or finite map edge.
export const KEPLER=14;
export const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
export const norm=v=>{const d=Math.hypot(...v)||1;return v.map(x=>x/d);};
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const mix=(a,b,t)=>a+(b-a)*t,fract=x=>x-Math.floor(x);
const hash=(x,y,z,seed)=>fract(Math.sin(x*127.1+y*311.7+z*74.7+seed*17.17)*43758.5453);
function noise(p,seed){const i=p.map(Math.floor),f=p.map((x,k)=>{const t=x-i[k];return t*t*(3-2*t);});const v=(x,y,z)=>hash(i[0]+x,i[1]+y,i[2]+z,seed);return mix(mix(mix(v(0,0,0),v(1,0,0),f[0]),mix(v(0,1,0),v(1,1,0),f[0]),f[1]),mix(mix(v(0,0,1),v(1,0,1),f[0]),mix(v(0,1,1),v(1,1,1),f[0]),f[1]),f[2]);}
function fbm(n,scale,seed){let sum=0,a=.55;for(let k=0;k<5;k++){sum+=noise(n.map(x=>x*scale),seed+k)*a;scale*=2.07;a*=.48;}return sum;}
export function profile(i){if(scienceWorlds.has(i))return scienceWorlds.get(i).profile;if([7,12].includes(i))return 'ice';if(i===10)return 'volcanic';if(i===11)return 'ocean';if(i===13)return 'gas';if(i===15)return 'crystal';if(i===16)return 'desert';return 'temperate';}
export function sampleTerrain(i,n){const type=profile(i),seed=i+91;const continental=fbm(n,4,seed),ridges=1-Math.abs(2*fbm(n,22,seed)-1),detail=fbm(n,110,seed);let h=(continental-.47)*460+Math.pow(ridges,5)*48+(detail-.5)*7;
 if(type==='ocean')h-=50;if(type==='ice')h+=28;if(type==='volcanic')h+=80;if(type==='desert')h=35+continental*95+Math.sin(n[0]*180+n[2]*60)*8;if(type==='crystal')h+=70;
 let biome=h<0?'water':h<5?'shore':h>105?'rock':'grass';if(type==='ice')biome='ice';if(type==='volcanic')biome='basalt';if(type==='desert')biome='sand';if(type==='crystal')biome='crystal';if(type==='gas')biome='cloud';return {height:h,biome,type};}
export const colors={water:[.035,.28,.37],shore:[.63,.58,.36],grass:[.22,.38,.2],rock:[.35,.38,.37],ice:[.65,.82,.87],basalt:[.26,.17,.14],sand:[.72,.43,.2],crystal:[.43,.34,.62],cloud:[.72,.59,.4]};
export function basis(n){let east=cross([0,1,0],n);if(Math.hypot(...east)<1e-6)east=[1,0,0];east=norm(east);return {east,south:norm(cross(east,n)),up:n};}
export function moveOnGlobe(n,eastMeters,southMeters,radius){const b=basis(n),d=Math.hypot(eastMeters,southMeters);if(!d)return [...n];const a=d/radius,dir=b.east.map((x,i)=>(x*eastMeters+b.south[i]*southMeters)/d);return norm(n.map((x,i)=>x*Math.cos(a)+dir[i]*Math.sin(a)));}
export function arcDistance(a,b,r){return Math.acos(Math.max(-1,Math.min(1,dot(a,b))))*r;}
export function landingPoint(i){for(let k=0;k<300;k++){const n=norm([Math.sin(k*2.4+i),.2+Math.sin(k*.9)*.65,Math.cos(k*2.4+i)]);const t=sampleTerrain(i,n);if(t.height>6&&t.height<90)return n;}return norm([.5,.35,.7]);}
export function surfaceState(i,radius){const lander=landingPoint(i),n=moveOnGlobe(lander,0,-7,radius);return {planet:i,radius,n,lander,walked:0,rover:false,samples:[],recall:0};}
export function walkSurface(s,dx,dz,dt){const water=sampleTerrain(s.planet,s.n).height<0;const speed=s.rover?32:water?2:5;const length=Math.hypot(dx,dz);if(length){const e=dx/length*speed*dt,z=dz/length*speed*dt;const next=moveOnGlobe(s.n,e,z,s.radius);const bb=basis(s.lander),delta=next.map((v,i)=>(v-s.lander[i])*s.radius),q=s.orientation,body=q?rotate([-q[0],-q[1],-q[2],q[3]],delta):null,east=body?body[0]:dot(delta,bb.east),south=body?body[2]:dot(delta,bb.south);if(!(Math.abs(east)<4.7&&south> -10.5&&south<27)){s.n=next;s.walked+=Math.hypot(e,z);}}if(s.recall>0&&!s.pickup){s.recall=Math.max(0,s.recall-dt);if(s.recall===0)s.lander=moveOnGlobe(s.n,0,8,s.radius);}}
export function coordinates(n){return {latitude:Math.asin(Math.max(-1,Math.min(1,n[1])))*180/Math.PI,longitude:Math.atan2(n[0],n[2])*180/Math.PI};}
export function validateSurface(s){return !!s&&(s.orientation===undefined||validOrientation(s.orientation))&&(s.origin===undefined||(Array.isArray(s.origin)&&s.origin.length===3&&s.origin.every(Number.isFinite)&&Math.abs(Math.hypot(...s.origin)-1)<.001))&&(s.suit===undefined||(Number.isFinite(s.suit)&&s.suit>=0&&s.suit<=100))&&(s.elapsed===undefined||(Number.isFinite(s.elapsed)&&s.elapsed>=0&&s.elapsed<1e9))&&Number.isInteger(s.planet)&&s.planet>=0&&s.planet<17&&Number.isFinite(s.radius)&&s.radius>=1000&&s.radius<=50000&&['n','lander'].every(k=>Array.isArray(s[k])&&s[k].length===3&&s[k].every(Number.isFinite)&&Math.abs(Math.hypot(...s[k])-1)<.001)&&Number.isFinite(s.walked)&&s.walked>=0&&Array.isArray(s.samples)&&s.samples.length<=50&&s.samples.every(x=>typeof x==='string'&&x.length<80);}
