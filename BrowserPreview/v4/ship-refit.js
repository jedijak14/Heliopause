// Connected aft expansion and a single faceted hull spanning the new deck plan.
export function refitShip({B,M,MAT,add,meshes,rooms,LIGHTS,fixture,plac,label,makeDoor,AREAS,DOORAREAS,OBST,inter,openStorage,openSystems}){
 const newRooms=[['STORAGE',8,3.7,5.05,10.95],['ENGINEERING',14,3.7,10.95,16.95],['SCIENCE LAB',20,3.7,16.95,23.05]];
 for(const [name,z,w,front,back]of newRooms){const idx=rooms.length;rooms.push({name,on:true,t:9,fix:null});const b=new B();b.box([0,-.05,z],[w,.05,3]);b.box([0,2.95,z],[w,.05,3]);for(const x of [-w,w]){for(const dz of [-1.85,1.85])b.box([x,1.45,z+dz],[.06,1.5,1.15]);b.box([x,2.6,z],[.06,.35,.7]);}for(const x of [-1,1])b.box([x*(w+.6)/2,1.45,back],[(w-.6)/2,1.5,.06]);b.box([0,2.55,back],[.6,.4,.06]);add(b.build(),MAT.HULL,[.42,.52,.49],.25,.56,{uv:1});
  const trim=new B();for(const x of [-w+.15,w-.15]){trim.box([x,.18,z],[.025,.04,2.9]);for(const rz of [z-2,z+2])trim.box([x,1.45,rz],[.08,1.45,.06]);}add(trim.build(),MAT.TRIM,[.48,.54,.55],.7,.4);fixture(idx,b=>{for(const x of [-1.7,1.7])b.box([x,2.89,z],[.04,.015,2.8]);});LIGHTS.push({p:[0,2.7,z],c:name==='ENGINEERING'?[.5,.8,1]:[1,.88,.7],i:8,r:9,room:idx});
  AREAS.push({a:[-w+.3,front+.28],b:[w-.3,back-.28]});const door=makeDoor(front,front,name);door.systems=name==='STORAGE'?[1,2]:name==='ENGINEERING'?[2,3]:[3,2];DOORAREAS.push({a:[-.31,front-.45],b:[.31,front+.45],d:rooms.length-2});plac(label(name+' / SV-7',512,80,34,'#b4d9dc'),[.65,2.55,front-.09],[-1.3,0,0],[0,-.2,0]);plac(label(name+' / SV-7',512,80,34,'#b4d9dc'),[-.65,2.55,front+.09],[1.3,0,0],[0,-.2,0]);
 }
 // Close the stern and leave a clear 1.6 m center aisle through storage.
 // Stern opening continues into the pressure airlock.
 for(const side of [-1,1])for(let row=0;row<3;row++){if(row===1)continue;const x=side*2.55,z=6.2+row*1.7,b=new B();b.box([x,.55,z],[.8,.55,.65]);b.box([x,1.5,z],[.7,.35,.6]);add(b.build(),MAT.POLY,[.3,.32,.25],.2,.72);const straps=new B();for(const a of [-.57,.57])straps.box([x+a,1,z],[.035,1,.67]);add(straps.build(),MAT.TRIM,[.52,.45,.28],.7,.5);OBST.push({a:[x-.85,z-.7],b:[x+.85,z+.7]});}
 inter.push({label:()=> 'OPEN STORAGE MANIFEST',box:{min:[.9,.7,5.7],max:[2.8,2,7.4]},act:openStorage});
 // Engineering reactor on port side, never in the central passage.
 {const b=new B();b.cyl([-2.2,.25,12.1],.7,2.2,24,'y');for(const h of [.3,.8,1.3,1.8,2.3])b.cyl([-2.2,h,12.1],1,.12,24,'y');add(b.build(),MAT.TRIM,[.36,.44,.48],.8,.35);const glow=new B();glow.cyl([-2.2,.4,12.1],.45,1.9,24,'y');add(glow.build(),MAT.GLOW,[.2,.65,.7],0,.4,{em:[.35,1.1,1.5]});OBST.push({a:[-3.3,11],b:[-1.1,13.2]});}
 {const b=new B();for(const z of [12,16])b.box([2.8,1,z],[.65,1,.65]);add(b.build(),MAT.HULL,[.22,.3,.34],.5,.6);for(const z of [12,16])OBST.push({a:[2.1,z-.7],b:[3.5,z+.7]});}
 inter.push({label:()=> 'ENGINEERING / SYSTEM CONTROL',box:{min:[2.1,.6,12.9],max:[3.5,2,15.1]},act:openSystems});
 inter.push({label:()=> 'SCIENCE / SPECIMEN CATALOG',box:{min:[-3.4,.7,18],max:[-1.6,1.8,22]},act:openStorage});
 // Science benches and specimen columns; accessible floor around the central aisle.
 for(const side of [-1,1])for(const z of [18.4,21.6]){const b=new B();b.box([side*2.5,.9,z],[.8,.08,.7]);b.box([side*2.5,.4,z],[.6,.4,.5]);add(b.build(),MAT.HULL,[.56,.64,.53],.3,.5);const specimen=new B();specimen.cyl([side*2.5,1,z],.18,.6,12,'y');add(specimen.build(),MAT.GLOW,[.2,.5,.45],.1,.5,{em:[.05,.25,.2]});OBST.push({a:[side*2.5-.85,z-.75],b:[side*2.5+.85,z+.75]});}
 // Remove the old box hull and rebuild a continuous chamfered silhouette.
 meshes.filter(m=>m.ext).forEach(m=>m.hidden=true);
 const rings=[[-9.8,1.5,.5],[-7,3.4,1.65],[-3,3.5,1.65],[1,3,1.6],[5,4.1,1.8],[11,4.3,1.95],[17,4.3,1.95],[23.5,3.9,1.8],[26,2.7,1.4]],section=[[-.7,-1],[.7,-1],[1,-.6],[1,.6],[.7,1],[-.7,1],[-1,.6],[-1,-.6]];
 const b=new B();function point(r,k){return [section[k][0]*r[1],1.3+section[k][1]*r[2],r[0]];}function face(a,c,d,e){const u=c.map((v,i)=>v-a[i]),v=e.map((x,i)=>x-a[i]);let n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],l=Math.hypot(...n);n=n.map(x=>x/l);b.q(a,c,d,e,n,[0,0,1,0,1,1,0,1],1);}
 for(let j=0;j<rings.length-1;j++)for(let k=0;k<8;k++)face(point(rings[j],k),point(rings[j],(k+1)%8),point(rings[j+1],(k+1)%8),point(rings[j+1],k));
 for(const j of [0])for(let k=0;k<8;k++){const c=[0,1.3,rings[j][0]];b.q(c,point(rings[j],k),point(rings[j],(k+1)%8),c,[0,0,j?1:-1],[0,0,1,0,1,1,0,0],1);}
 add(b.build(),MAT.EXT,[.43,.5,.53],.55,.46,{ext:true,uv:.5});
 const armor=new B(),stripes=new B();for(const side of [-1,1]){for(let z=6;z<23;z+=2){armor.box([side*4.31,1.3,z],[.06,.9,.87]);stripes.box([side*4.39,.8,z],[.025,.035,.7]);}for(let z=-2;z<3;z+=2){armor.box([side*6.2,1,z],[1.7,.075,.8]);for(let a=0;a<5;a++)stripes.box([side*(4.9+a*.6),1.09,z],[.025,.015,.75]);}armor.box([side*3.8,1.2,24.6],[.7,.65,2]);}
 add(armor.build(),MAT.EXT,[.25,.32,.36],.65,.55,{ext:true});add(stripes.build(),MAT.TRIM,[.72,.54,.27],.75,.4,{ext:true});
 for(const side of [-1,1]){const bells=new B();bells.cyl([side*2,1.2,25.8],.82,1.7,32,'z');bells.cyl([side*2,1.2,27.4],.94,.14,32,'z');for(let k=0;k<32;k++){const a=k*Math.PI/16,c=(k+1)*Math.PI/16,center=[side*2,1.2,26.04];bells.q(center,[side*2+Math.cos(a)*.8,1.2+Math.sin(a)*.8,26.04],[side*2+Math.cos(c)*.8,1.2+Math.sin(c)*.8,26.04],center,[0,0,1],[0,0,1,0,1,1,0,0],1);}add(bells.build(),MAT.TRIM,[.24,.3,.32],.85,.28,{ext:true});const glow=new B();glow.cyl([side*2,1.2,26.1],.66,.05,32,'z');add(glow.build(),MAT.GLOW,[.2,.55,.9],0,.3,{ext:true,em:[.2,.7,1.7]});const windows=new B();windows.box([side*1.7,1.7,-7.1],[1.1,.55,.04]);add(windows.build(),MAT.GLOW,[.03,.1,.14],.5,.15,{ext:true,em:[.02,.09,.12]});}
 return {rooms:newRooms.map(r=>r[0]),hullLength:35.8};
}
