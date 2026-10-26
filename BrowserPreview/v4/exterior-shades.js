// Continuous exterior nano-laminate shell. No visible drones and no interior curtains.
export function createExteriorShades({B,M,add,windows,pods=[]}){
 const rings=[[-9.85,1.55,.55],[-7,3.45,1.7],[-3,3.55,1.7],[1,3.05,1.65],[5,4.15,1.85],[11,4.38,2.02],[17,4.38,2.02],[23.5,4,1.9],[26.2,2.78,1.5]],section=[[-.7,-1],[.7,-1],[1,-.6],[1,.6],[.7,1],[-.7,1],[-1,.6],[-1,-.6]],b=new B();
 const point=(r,k)=>[section[k][0]*r[1],1.3+section[k][1]*r[2],r[0]],face=(a,c,d,e)=>{const u=c.map((x,i)=>x-a[i]),v=e.map((x,i)=>x-a[i]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],l=Math.hypot(...n)||1;b.q(a,c,d,e,n.map(x=>x/l),[0,0,1,0,1,1,0,1],1);};
 for(let j=0;j<rings.length-1;j++)for(let k=0;k<8;k++)face(point(rings[j],k),point(rings[j],(k+1)%8),point(rings[j+1],(k+1)%8),point(rings[j+1],k));for(const j of [0,rings.length-1])for(let k=0;k<8;k++)b.q([0,1.3,rings[j][0]],point(rings[j],k),point(rings[j],(k+1)%8),[0,1.3,rings[j][0]],[0,0,j===0?-1:1],[0,0,1,0,1,1,0,0],1);
 // Wrap radiators, armor, and engine fairings as well as the pressure hull.
 for(const side of [-1,1]){b.box([side*6.2,1,0],[1.78,.14,3]);b.box([side*3.8,1.2,24.6],[.78,.73,2.08]);b.cyl([side*2,1.2,25.75],1.02,1.82,32,'z');}
 // Fixed armor ribs protrude beyond the chamfered hull and need their own conformal patches.
 for(const side of [-1,1])for(let z=6;z<23;z+=2)b.box([side*4.32,1.3,z],[.13,.95,.92]);
 // Seal nozzle ends and the stern boarding ramp, not just the cylindrical fairings.
 for(const side of [-1,1])for(let k=0;k<32;k++){const a=k*Math.PI/16,c=(k+1)*Math.PI/16,center=[side*2,1.2,27.58];b.q(center,[center[0]+Math.cos(a)*1.03,center[1]+Math.sin(a)*1.03,center[2]],[center[0]+Math.cos(c)*1.03,center[1]+Math.sin(c)*1.03,center[2]],center,[0,0,1],[0,0,1,0,1,1,0,0],1);}
 b.box([0,-.12,27.2],[.73,.1,1.23]);
 const shell=add(b.build(),15,[.07,.12,.15],.92,.2,{ext:true,uv:1});shell.hidden=true;const mirrors=windows.map(w=>{w.mesh.mat=15;w.mesh.col=[.07,.12,.15];w.mesh.met=.92;w.mesh.rgh=.2;w.mesh.externalShade=true;const m=add(w.mesh.geo,15,w.mesh.col,.92,.2,{ext:true});return {w,m};});let fraction=0;
 for(const p of pods){const box=new B();box.box([p.side*7.5,1.45,p.z],[3.36,1.52,2.68]);p.shade=add(box.build(),15,[.07,.12,.15],.92,.2,{ext:true});p.shade.hidden=true;}
 return {get fraction(){return fraction;},update(dt,thermal,pods=[]){const target=thermal||windows.every(w=>!w.open)?1:0;fraction+=Math.sign(target-fraction)*Math.min(Math.abs(target-fraction),dt/5);shell.hidden=fraction<.001;shell.aux=[0,fraction,1,0];for(const {w,m}of mirrors){w.mesh.aux=[0,w.k,0,0];m.model=w.mesh.model;m.aux=[...w.mesh.aux];m.hidden=w.mesh.hidden;}for(const p of pods)if(p.shade){p.shade.hidden=!p.loaded||fraction<.001;p.shade.aux=[0,fraction,1,0];}},shell};
}
