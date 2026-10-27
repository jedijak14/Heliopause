// Metres, half-extents. Shared pressure-boundary dimensions, not decorative patches.
export const INTERIOR=Object.freeze({wall:[.32,.39,.41],deck:[.09,.12,.14],trim:[.34,.43,.46],seal:[.035,.055,.065],light:[.78,.9,.92],door:[.16,.25,.28]});
export const BAY=Object.freeze({halfWidth:3.3,halfDepth:2.6,height:2.9,opening:.7,doorHeight:2.1,wall:.07});
export function habitatBounds(p){const center=p.side*(p.center||7.5);return {center,inner:center-p.side*BAY.halfWidth,outer:center+p.side*BAY.halfWidth,door:p.side*(p.parent?10.8:3.72)};}
export function habitatEnvelope(p,hasAnnex=false){
 const {center:x,inner,outer,door}=habitatBounds(p),z=p.z,{halfWidth:w,halfDepth:d,height:h,opening:o,doorHeight:dh,wall:t}=BAY,boxes=[];
 const box=(part,c,s)=>boxes.push({part,c,s});
 box('floor',[x,-.09,z],[w,.09,d]);box('ceiling',[x,h+.04,z],[w,.08,d]);
 for(const dz of [-d,d])box('wall',[x,h/2,z+dz],[w,h/2,t]);
 const split=xx=>{for(const side of [-1,1])box('wall',[xx,h/2,z+side*(d+o)/2],[t,h/2,(d-o)/2]);box('header',[xx,(h+dh)/2,z],[t,(h-dh)/2,o+t]);};
 // Annexes have their own inner pressure wall too; the connecting parent must be deployed.
 split(inner);if(hasAnnex)split(outer);else box('wall',[outer,h/2,z],[t,h/2,d]);
 if(!p.parent){
  // Hull face x=3.7 -> room face x=4.2. Overlap each end so no pinhole opens at a seam.
  const a=p.side*3.64,b=inner+p.side*.08,c=(a+b)/2,half=Math.abs(b-a)/2;
  box('collar-floor',[c,-.06,z],[half,.06,o+t]);
  box('collar-ceiling',[c,(h+dh)/2,z],[half,(h-dh)/2,o+t]);
  for(const side of [-1,1])box('collar-wall',[c,dh/2,z+side*(o+t/2)],[half,dh/2,t/2]);
 }
 // The moving leaf overlaps its seat on every edge, including the header and deck.
 const leaf={part:'leaf',c:[door,dh/2,z],s:[.055,dh/2+.025,o+.025]};
 return {boxes,leaf};
}
export function habitatPassage(p){const {inner,door}=habitatBounds(p),lo=Math.min(inner,door)-.4,hi=Math.max(inner,door)+.4;return {a:[lo,p.z-.4],b:[hi,p.z+.4]};}
// Adding observation windows must not multiply the ship's ambient light/exposure.
export function windowLightFraction(windows){let light=0,area=0;windows.forEach((w,i)=>{const weight=i===0?3:1;area+=weight;light+=weight*(1-Math.max(0,Math.min(1,Number.isFinite(w.k)?w.k:1)));});return area?light/area:0;}
