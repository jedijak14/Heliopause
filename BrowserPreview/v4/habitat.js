import {habitatState,requestHabitat,stepHabitat,flightInterlocked,serializeHabitats} from './habitat-state.js';
import {placeModel} from './model-library.js';
export function createHabitats(ctx){
 const {B,M,MAT,add,meshes,gl,AREAS,DOORAREAS,OBST,inter,doors,rooms,LIGHTS,plac,label,notice}=ctx,pods=habitatState();
 const box=(c,s,color,mat=8,opts={})=>{const b=new B();b.box(c,s);return add(b.build(),mat,color,.15,.6,opts);};
 const cylinder=(c,r,h,color,axis='y')=>{const b=new B();b.cyl(c,r,h,24,axis);return add(b.build(),1,color,.7,.3);};
 const remove=(list,owned)=>{for(const item of owned){const i=list.indexOf(item);if(i>=0)list.splice(i,1);}};
 function unload(p){if(!p.loaded)return;for(const m of p.owned){gl.deleteVertexArray(m.geo.vao);gl.deleteBuffer(m.geo.vb);gl.deleteBuffer(m.geo.ib);if(m.ownedTexture)gl.deleteTexture(m.tex);}remove(meshes,p.owned);remove(AREAS,p.areas);remove(OBST,p.obstacles);remove(inter,p.interactions);remove(LIGHTS,p.lights);p.owned=[];p.loaded=false;rooms[p.room].fix={em:[0,0,0]};}
 function load(p){if(p.loaded)return;const start=[meshes.length,AREAS.length,OBST.length,inter.length,LIGHTS.length],x=p.side*7.5,z=p.z,sg=p.side;
  const item=(key,dx,dz,height,yaw=0)=>placeModel(ctx,'furniture/'+key,{position:[x+dx,0,z+dz],height,yaw});
  const solid=(dx,dz,hx,hz)=>OBST.push({a:[x+dx-hx,z+dz-hz],b:[x+dx+hx,z+dz+hz]});
  box([x,-.09,z],[3.3,.09,2.6],[.45,.28,.14],14);box([x,2.9,z],[3.3,.08,2.6],[.72,.76,.68]);
  for(const dz of [-2.6,2.6]){box([x,1.45,z+dz],[3.3,1.45,.07],[.68,.72,.65]);box([x,.5,z+dz-sg*.01],[3.28,.45,.08],p.color);}
  // The inner wall is split around a full-height access opening, never painted over it.
  const inner=sg*4.2,outer=sg*10.8;
  for(const dz of [-1.65,1.65])box([inner,1.45,z+dz],[.06,1.45,.95],p.color);
  box([inner,2.58,z],[.06,.32,.7],p.color);box([outer,1.45,z],[.07,1.45,2.6],p.color);
  for(const dz of [-2.48,2.48])box([x,2.76,z+dz],[3.15,.025,.03],[.8,.63,.32],6,{em:[1.4,1.05,.55]});
  rooms[p.room].fix=box([x,2.8,z],[1.9,.025,.08],[.9,.8,.6],6,{em:[1.8,1.6,1.3]});
  LIGHTS.push({p:[x,2.55,z],c:[1,.86,.68],i:14,r:8,room:p.room});
  AREAS.push({a:[Math.min(inner,outer)+.28,z-2.32],b:[Math.max(inner,outer)-.28,z+2.32]});
  if(p.id==='kitchen'){
   for(let k=0;k<4;k++){item(['kitchenFridgeLarge','kitchenSink','kitchenStove','kitchenCabinetDrawer'][k],-2.2+k*1.3,-1.9,k?1:1.95);solid(-2.2+k*1.3,-1.9,.5,.45);if(k)item('kitchenCabinetUpper',-2.2+k*1.3,-2.1,.65).forEach(m=>m.model=M.T(0,1.9,0));}
   const coffee=item('kitchenCoffeeMachine',1.7,-1.9,.35);coffee.forEach(m=>m.model=M.T(0,1,0));
   box([x,.93,z+1.5],[1.6,.055,.5],[.76,.7,.54]);for(const dx of [-1.3,1.3])box([x+dx,.45,z+1.5],[.06,.45,.38],p.color);solid(0,1.5,1.6,.5);
  }else if(p.id==='living'){
   item('loungeSofaLong',.2,1.65,.95,Math.PI);solid(.2,1.65,1.65,.5);item('loungeChairRelax',2.3,-.2,1,-Math.PI/2);solid(2.3,-.2,.6,.65);
   item('tableCoffee',.3,.1,.42);solid(.3,.1,.7,.4);item('televisionModern',.2,-2.35,1.2).forEach(m=>m.model=M.T(0,.55,0));item('pottedPlant',-2.5,-1.8,1.4);item('lampRoundFloor',2.7,1.9,1.8);
   box([x+.3,.012,z+.3],[1.9,.01,1.25],[.3,.16,.12],5);
  }else if(p.id==='bathroom'){
   item('shower',-1.9,-1.55,2.35);solid(-1.9,-1.55,.65,.65);item('toilet',1.9,-1.8,.85);solid(1.9,-1.8,.4,.55);
   item('bathroomSink',1.9,1.7,.95,Math.PI);solid(1.9,1.7,.6,.45);item('bathroomMirror',1.9,2.45,.8,Math.PI).forEach(m=>m.model=M.T(0,1.25,0));item('bathroomCabinet',.3,1.95,1.3,Math.PI);solid(.3,1.95,.5,.4);
   item('bathtub',.3,-1.65,.6);solid(.3,-1.65,.75,.5);
   box([x,-.005,z],[3.2,.01,2.5],[.53,.7,.7],0);
   inter.push({label:()=>p.shower?'TURN SHOWER OFF':'RUN SHOWER / WATER RECYCLING',box:{min:[x-2.8,.5,z-2.5],max:[x-1,2.4,z-.6]},act:()=>{p.shower=!p.shower;notice(p.shower?'Warm water circulation active.':'Water recycled.');}});
   p.water=box([x-1.9,1.25,z-1.55],[.24,.85,.24],[.15,.58,.7],13);p.water.hidden=true;
  }else if(p.id==='gym'){
   for(const dz of [-1.45,1.45]){box([x+1,.14,z+dz],[1.35,.14,.5],[.06,.08,.1]);box([x+1,.29,z+dz],[1.2,.015,.42],[.17,.21,.23],7);for(const zz of [-.48,.48]){box([x-.3,1,z+dz+zz],[.04,.75,.04],[.7,.44,.14]);box([x+.15,1.7,z+dz+zz],[.5,.04,.04],[.7,.44,.14]);}box([x-.3,1.55,z+dz],[.08,.15,.42],[.07,.15,.18],6,{em:[.06,.2,.25]});solid(1,dz,1.4,.55);}
   box([x-2,.5,z-1.6],[.7,.07,.35],[.25,.12,.08],5);cylinder([x-2.8,1.2,z-1.6],.04,1.6,[.55,.6,.62],'x');for(const dx of [-2.7,-1.3])cylinder([x+dx,1.2,z-1.6],.3,.12,[.08,.1,.12],'x');solid(-2,-1.6,.85,.5);
  }else if(p.id==='pool'){
   // Recessed basin, tiled coping and broad submerged exit steps.
   box([x,-1.12,z],[2.45,.1,1.65],[.03,.26,.35]);for(const dx of [-2.5,2.5])box([x+dx,-.48,z],[.12,.6,1.75],[.23,.65,.66],0);for(const dz of [-1.7,1.7])box([x,-.48,z+dz],[2.5,.6,.12],[.23,.65,.66],0);
   // Hide central floor under the basin; keep the perimeter deck.
   meshes[start[0]].hidden=true;for(const dz of [-2.15,2.15])box([x,-.08,z+dz],[3.3,.08,.45],[.59,.49,.3],14);for(const dx of [-2.9,2.9])box([x+dx,-.08,z],[.4,.08,1.7],[.59,.49,.3],14);
   p.water=box([x,.025,z],[2.37,.012,1.57],[.025,.3,.4],13);
   for(let k=0;k<4;k++)box([x+2.15-k*.3,-.12-k*.24,z],[.18,.1,.65],[.38,.69,.67],0);
  }else{
   item('tableRound',.3,0,.8);solid(.3,0,.8,.8);for(const dx of [-1.2,1.8]){item('chairCushion',dx,0,.9,dx<0?Math.PI/2:-Math.PI/2);solid(dx,0,.4,.4);}for(const dx of [-2.5,2.5])for(const dz of [-1.9,1.9])item('pottedPlant',dx,dz,1.5);
  }
  p.owned=meshes.slice(start[0]);p.areas=AREAS.slice(start[1]);p.obstacles=OBST.slice(start[2]);p.interactions=inter.slice(start[3]);p.lights=LIGHTS.slice(start[4]);p.loaded=true;
 }
 for(const p of pods){p.room=rooms.length;rooms.push({name:p.name,on:true,t:9,fix:{em:[0,0,0]}});p.loaded=false;p.owned=[];
  const shell=new B();shell.box([p.side*7.5,1.4,p.z],[3.35,1.55,2.67]);p.shell=add(shell.build(),11,p.color,.5,.42,{ext:true});
  const b=new B();b.box([p.side*3.72,1.05,p.z],[.04,1.05,.7]);const mesh=add(b.build(),0,p.color,.45,.42);p.door={name:p.name,mesh,open:0,target:0,scan:-1,granted:0,idle:0,z:p.z,x:p.side*3.72,side:true,pads:[],systems:[],locked:true};doors.push(p.door);
  DOORAREAS.push({a:[p.side<0?-4.6:3.3,p.z-.4],b:[p.side<0?-3.3:4.6,p.z+.4],d:doors.length-1});
  box([p.side*3.9,-.04,p.z],[.45,.04,.7],[.33,.38,.36]);
  const sign=plac(label(p.name,512,80,28,'#f0ca88'),[p.side*3.61,2.45,p.z-.65],[0,0,1.3],[0,-.2,0]);
  inter.push({label:()=>p.phase==='deployed'?'OPEN '+p.name:'HABITAT CONTROL / '+p.name,box:{min:[p.side*3.72-.2,.7,p.z-.85],max:[p.side*3.72+.2,2.5,p.z+.85]},act:()=>{if(p.phase==='deployed')ctx.useDoor(p.door);else ctx.openPanel();}});
 }
 function sync(p){p.door.locked=p.phase!=='deployed';if(p.door.locked){p.door.scan=-1;p.door.target=0;p.door.verified=false;}if(p.phase==='deployed'){load(p);p.shell.hidden=false;}else{unload(p);p.shell.hidden=p.fraction<=0;}
  p.shell.model=M.mul(M.T(p.side*4.15*(1-p.fraction),0,0),M.S(Math.max(.001,p.fraction),1,1));
 }
 pods.forEach(sync);
 return {pods,get locked(){return flightInterlocked(pods);},request(id,deploy){const list=id==='all'?pods:pods.filter(p=>p.id===id);let problem='';for(const p of list){const error=requestHabitat(p,deploy,ctx.conditions());if(error)problem=error;sync(p);}notice(problem||(deploy?'Deploying habitat. Doors locked until pressure seals engage.':'Compacting habitat. Interior geometry unloaded.'));ctx.save();return !problem;},update(dt){let changed=false;for(const p of pods){changed=stepHabitat(p,dt)||changed;sync(p);if(p.id==='bathroom'&&p.loaded)p.water.hidden=!p.shower;}if(changed){ctx.save();ctx.changed();}},restore(saved){for(const p of pods){unload(p);p.phase=saved?.[p.id]==='deployed'?'deployed':'stowed';p.fraction=p.phase==='deployed'?1:0;sync(p);}},save:()=>serializeHabitats(pods),swimming(player){return pods.some(p=>p.id==='pool'&&p.loaded&&Math.abs(player.x-p.side*7.5)<2.35&&Math.abs(player.z-p.z)<1.55);},html(){return `<h3>EXPANDABLE HABITAT</h3><p>Three evenly spaced port / starboard pairs. Brake to a complete stop. Flight remains interlocked until all modules are compacted.</p><div class="grid2"><button data-act="habdeploy:all">DEPLOY ALL</button><button data-act="habstow:all">COMPACT ALL</button></div>${pods.map(p=>`<div class="row"><div>${p.name}<small>${p.side<0?'PORT':'STARBOARD'} · BAY ${p.z} · ${p.phase.toUpperCase()} · ${p.loaded?'INTERIOR LOADED':'INTERIOR UNLOADED'}</small></div><button data-act="${p.phase==='deployed'?'habstow':'habdeploy'}:${p.id}" ${['deploying','stowing'].includes(p.phase)?'disabled':''}>${p.phase==='deployed'?'COMPACT':'DEPLOY'}</button></div>`).join('')}<p>Connecting doors remain locked during every transition. An occupied compartment cannot compact. B: brake · T: tablet.</p>`;}};
}
