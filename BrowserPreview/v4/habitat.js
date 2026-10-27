import {habitatState,requestHabitat,stepHabitat,flightInterlocked,serializeHabitats} from './habitat-state.js';
import {INTERIOR,habitatBounds,habitatEnvelope,habitatPassage} from './interior-geometry.js';
import {placeModel} from './model-library.js';
export function createHabitats(ctx){
 const {B,M,MAT,add,meshes,gl,AREAS,DOORAREAS,OBST,inter,doors,rooms,LIGHTS,plac,label,notice}=ctx,pods=habitatState();
 const box=(c,s,color,mat=MAT.HULL,opts={})=>{const b=new B();b.box(c,s);return add(b.build(),mat,color,.15,.6,opts);};
 const cylinder=(c,r,h,color,axis='y')=>{const b=new B();b.cyl(c,r,h,24,axis);return add(b.build(),1,color,.7,.3);};
 const remove=(list,owned)=>{for(const item of owned){const i=list.indexOf(item);if(i>=0)list.splice(i,1);}};
 function unload(p){if(!p.loaded)return;for(const m of p.owned){gl.deleteVertexArray(m.geo.vao);gl.deleteBuffer(m.geo.vb);gl.deleteBuffer(m.geo.ib);if(m.ownedTexture)gl.deleteTexture(m.tex);}remove(meshes,p.owned);remove(AREAS,p.areas);remove(OBST,p.obstacles);remove(inter,p.interactions);remove(LIGHTS,p.lights);p.owned=[];p.loaded=false;rooms[p.room].fix={em:[0,0,0]};}
 function load(p){if(p.loaded)return;const start=[meshes.length,AREAS.length,OBST.length,inter.length,LIGHTS.length],x=p.side*(p.center||7.5),z=p.z,sg=p.side;
  const item=(key,dx,dz,height,yaw=0)=>placeModel(ctx,'furniture/'+key,{position:[x+dx,0,z+dz],height,yaw});
  const solid=(dx,dz,hx,hz)=>OBST.push({a:[x+dx-hx,z+dz-hz],b:[x+dx+hx,z+dz+hz]});
  const {inner,outer}=habitatBounds(p),envelope=habitatEnvelope(p,pods.some(q=>q.parent===p.id));
  for(const part of envelope.boxes){const m=box(part.c,part.s,part.part==='floor'||part.part==='collar-floor'?INTERIOR.deck:INTERIOR.wall,part.part==='floor'||part.part==='collar-floor'?MAT.DECK:MAT.HULL);m.pressurePart=part.part;}
  // A consistent panel, skirting, and recessed light kit across all eight rooms.
  for(const dz of [-2.49,2.49]){
   box([x,.16,z+dz],[3.18,.1,.035],INTERIOR.trim,MAT.TRIM);
   box([x,.66,z+dz],[3.18,.035,.025],p.color,MAT.POLY);
   box([x,2.7,z+dz],[3.18,.07,.065],INTERIOR.seal,MAT.TRIM);
   box([x,2.68,z+dz-Math.sign(dz)*.055],[3.08,.018,.015],INTERIOR.light,MAT.GLOW,{em:[.9,1.15,1.25]});
   for(const dx of [-2.2,0,2.2])box([x+dx,1.47,z+dz],[.025,1.12,.025],INTERIOR.trim,MAT.TRIM);
  }
  rooms[p.room].fix=box([x,2.8,z],[1.9,.025,.08],INTERIOR.light,MAT.GLOW,{em:[1.5,1.7,1.8]});
  LIGHTS.push({p:[x,2.55,z],c:[.88,.94,1],i:5,r:6,room:p.room});
  AREAS.push({a:[Math.min(inner,outer)+.28,z-2.32],b:[Math.max(inner,outer)-.28,z+2.32]});
  if(p.parent)plac(label(p.name,1024,100,42,'#b8ded5'),[outer-sg*.08,2.35,z-sg*1.6],[0,0,sg*3.2],[0,-.32,0]);
  if(p.id==='kitchen'){
   solid(-2.8,0,.45,1.2);for(let k=1;k<4;k++){item(['kitchenFridgeLarge','kitchenSink','kitchenStove','kitchenCabinetDrawer'][k],-2.2+k*1.3,-1.9,1);solid(-2.2+k*1.3,-1.9,.5,.45);if(k)item('kitchenCabinetUpper',-2.2+k*1.3,-2.1,.65).forEach(m=>m.model=M.T(0,1.9,0));}
   const coffee=item('kitchenCoffeeMachine',1.7,-1.9,.35);coffee.forEach(m=>m.model=M.T(0,1,0));
   box([x,.93,z+1.5],[1.6,.055,.5],[.76,.7,.54]);for(const dx of [-1.3,1.3])box([x+dx,.45,z+1.5],[.06,.45,.38],p.color);solid(0,1.5,1.6,.5);
  }else if(p.id==='living'){
   solid(.2,1.65,1.65,.5);solid(2.3,-.2,.6,.65);
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
   meshes[start[0]].hidden=true;for(const dz of [-2.15,2.15])box([x,-.08,z+dz],[3.3,.08,.45],INTERIOR.deck,MAT.DECK);for(const dx of [-2.9,2.9])box([x+dx,-.08,z],[.4,.08,1.7],INTERIOR.deck,MAT.DECK);
   p.water=box([x,.025,z],[2.37,.012,1.57],[.025,.3,.4],13);
   for(let k=0;k<4;k++)box([x+2.15-k*.3,-.12-k*.24,z],[.18,.1,.65],[.38,.69,.67],0);
  }else if(p.id==='medical'){
   // Clear 1.4 m central access route; recovery furniture stays against the walls.
   for(const dz of [-1.65,1.65]){box([x+.5,.48,z+dz],[1.2,.12,.55],[.06,.12,.15],1);box([x+.5,.68,z+dz],[1.15,.1,.52],[.16,.32,.34],12);box([x+1.25,.82,z+dz],[.3,.07,.47],[.42,.49,.46],12);for(const dx of [-.4,1.4])for(const zz of [-.4,.4])box([x+dx,.18,z+dz+zz],[.05,.18,.05],[.18,.24,.26],1);box([x+1.95,1.24,z+dz],[.08,.28,.38],[.025,.045,.05],1);plac(label('STANDBY',256,80,26,'#6ac5b1'),[x+1.86,1.4,z+dz-.3],[0,0,.6],[0,-.3,0]);solid(.5,dz,1.25,.58);}
   item('bathroomCabinet',-2.5,1.6,1.65);solid(-2.5,1.6,.4,.5);item('pottedPlant',2.6,0,1.2);
   inter.push({label:()=> 'RECOVERY BAY / CHECK ENVIRONMENT',box:{min:[x-2.9,.6,z+.9],max:[x-2,2.3,z+2.3]},act:()=>ctx.medicalStatus()});
  }else if(p.id==='workshop'){
   for(const dz of [-1.7,1.7]){box([x,1.9,z+Math.sign(dz)*2.45],[2,.65,.04],[.08,.12,.14],1);const rack=new B();for(let k=0;k<7;k++){const xx=x-1.5+k*.5,zz=z+Math.sign(dz)*2.36;rack.box([xx,1.85,zz],[.035,.22,.035]);rack.box([xx,2.1,zz],[.11,.035,.035]);for(const d of [-.1,.1])rack.box([xx+d,2.17,zz],[.025,.08,.035]);}add(rack.build(),1,[.28,.34,.37],.7,.35);item('kitchenCabinetDrawer',0,dz,.95);box([x,.99,z+dz],[2,.06,.55],[.38,.26,.13],14);solid(0,dz,2,.6);for(const dx of [-1.6,1.6])box([x+dx,1.14,z+dz],[.24,.1,.24],[.12,.24,.28],1);}
   item('kitchenCabinetUpper',-2.6,0,1.7);solid(-2.6,0,.4,.7);
   inter.push({label:()=> 'FABRICATION / SERVICE INVENTORY',box:{min:[x-1.8,.5,z-2.4],max:[x+1.8,1.7,z-1.1]},act:()=>ctx.service()});
  }else{
   item('tableRound',.3,0,.8);solid(.3,0,.8,.8);for(const dx of [-1.2,1.8]){solid(dx,0,.4,.4);}for(const dx of [-2.5,2.5])for(const dz of [-1.9,1.9])item('pottedPlant',dx,dz,1.5);
  }
  p.owned=meshes.slice(start[0]);for(const m of p.owned)if(m.tex)m.ownedTexture=!meshes.slice(0,start[0]).some(other=>other.tex===m.tex);p.areas=AREAS.slice(start[1]);p.obstacles=OBST.slice(start[2]);p.interactions=inter.slice(start[3]);p.lights=LIGHTS.slice(start[4]);p.loaded=true;
 }
 for(const p of pods){const doorX=habitatBounds(p).door;p.room=rooms.length;rooms.push({name:p.name,on:true,t:9,fix:{em:[0,0,0]}});p.loaded=false;p.owned=[];
  const shell=new B();shell.box([p.side*(p.center||7.5),1.4,p.z],[3.35,1.55,2.67]);p.shell=add(shell.build(),11,p.color,.5,.42,{ext:true});
  const entryStart=meshes.length,b=new B(),leaf=habitatEnvelope(p).leaf;b.box(leaf.c,leaf.s);const mesh=add(b.build(),MAT.HULL,INTERIOR.door,.45,.42);p.door={name:p.name,mesh,open:0,target:0,scan:-1,granted:0,idle:0,z:p.z,x:doorX,side:true,pads:[],systems:[],locked:true};doors.push(p.door);
  DOORAREAS.push({...habitatPassage(p),d:doors.indexOf(p.door)});
  // Fixed gasket and frame form a pressure seat, not a floating slab.
  for(const dz of [-.77,.77]){box([doorX,1.05,p.z+dz],[.1,1.1,.045],INTERIOR.seal,MAT.POLY);box([doorX,1.1,p.z+dz+Math.sign(dz)*.06],[.12,1.1,.035],INTERIOR.trim,MAT.TRIM);}
  box([doorX,2.18,p.z],[.12,.08,.85],INTERIOR.trim,MAT.TRIM);
  box([doorX,-.04,p.z],[.15,.04,.85],INTERIOR.trim,MAT.TRIM);
  for(const face of [-1,1]){
   plac(label(p.name,1024,100,42,'#c4e0e2'),[doorX+face*.14,2.51,p.z+face*.65],[0,0,-face*1.3],[0,-.2,0]);
   const pad=new B();pad.plane([doorX+face*.14,1.55,p.z+face*.99],[0,0,-face*.22],[0,-.28,0]);p.door.pads.push(add(pad.build(),MAT.PAD,[1,1,1],0,.2));
  }
  inter.push({label:()=>p.phase==='deployed'?'OPEN '+p.name:'HABITAT CONTROL / '+p.name,box:{min:[doorX-.2,.7,p.z-.85],max:[doorX+.2,2.5,p.z+.85]},act:()=>{if(p.phase==='deployed')ctx.useDoor(p.door);else ctx.openPanel();}});p.entryMeshes=meshes.slice(entryStart);
 }
 function sync(p){for(const m of p.entryMeshes)m.hidden=!!p.parent&&pods.find(q=>q.id===p.parent)?.phase!=='deployed';p.door.locked=p.phase!=='deployed'||!!(p.parent&&pods.find(q=>q.id===p.parent)?.phase!=='deployed');if(p.door.locked){p.door.scan=-1;p.door.target=0;p.door.verified=false;}if(p.phase==='deployed'){load(p);p.shell.hidden=false;}else{unload(p);p.shell.hidden=p.fraction<=0;}
  p.shell.model=M.mul(M.T(p.side*((p.center||7.5)-3.35)*(1-p.fraction),0,0),M.S(Math.max(.001,p.fraction),1,1));
 }
 pods.forEach(sync);
 const pending=new Map();
 function requestOne(p,deploy){return requestHabitat(p,deploy,{...ctx.conditions(),pods});}
 function drain(){for(const [id,deploy]of pending){const p=pods.find(q=>q.id===id);if(p.phase===(deploy?'deployed':'stowed')){pending.delete(id);continue;}if(['deploying','stowing'].includes(p.phase))continue;if(deploy&&p.parent&&pods.find(q=>q.id===p.parent).phase!=='deployed')continue;if(!deploy&&pods.some(q=>q.parent===id&&q.phase!=='stowed'))continue;const error=requestOne(p,deploy);if(error){notice(error);pending.delete(id);}sync(p);}}
 return {pods,get locked(){return flightInterlocked(pods);},request(id,deploy){
  if(id==='all'){if(deploy){const reason=requestHabitat({...pods[0],phase:'stowed'},true,{...ctx.conditions(),pods});if(reason){notice(reason);return false;}}if(!deploy&&pods.some(p=>ctx.conditions().player&&ctx.conditions().player.x*p.side>(p.parent?10.5:3.1)&&Math.abs(ctx.conditions().player.z-p.z)<2.9)){notice('Compartment occupied. Return to the central deck before compacting.');return false;}pending.clear();for(const p of pods)pending.set(p.id,deploy);drain();notice(deploy?'Deploying core rooms, then connected annexes.':'Compacting annexes before their access rooms.');ctx.save();return true;}
  const p=pods.find(q=>q.id===id);if(!p)return false;pending.delete(id);const error=requestOne(p,deploy);sync(p);notice(error||(deploy?'Deploying habitat. Door locked until pressure seals engage.':'Compacting habitat. Interior geometry unloaded.'));ctx.save();return !error;},update(dt){drain();let changed=false;for(const p of pods){changed=stepHabitat(p,dt)||changed;sync(p);if(p.id==='bathroom'&&p.loaded)p.water.hidden=!p.shower;}if(changed){ctx.save();ctx.changed();}},restore(saved){pending.clear();const states=habitatState(saved);for(const p of pods){unload(p);p.phase=states.find(q=>q.id===p.id).phase;p.fraction=p.phase==='deployed'?1:0;sync(p);}},save:()=>serializeHabitats(pods),swimming(player){return pods.some(p=>p.id==='pool'&&p.loaded&&Math.abs(player.x-p.side*(p.center||7.5))<2.35&&Math.abs(player.z-p.z)<1.55);},html(){return `<h3>EXPANDABLE HABITAT</h3><p>Six core rooms plus two connected annexes. Workshop access: bathroom. Medical access: gym. Brake to a complete stop. Flight remains interlocked until all modules are compacted.</p><div class="grid2"><button data-act="habdeploy:all">DEPLOY ALL</button><button data-act="habstow:all">COMPACT ALL</button></div>${pods.map(p=>`<div class="row"><div>${p.name}<small>${p.side<0?'PORT':'STARBOARD'} · ${p.parent?'VIA '+p.parent.toUpperCase():'BAY '+p.z} · ${p.phase.toUpperCase()} · ${p.loaded?'INTERIOR LOADED':'INTERIOR UNLOADED'}</small></div><button data-act="${p.phase==='deployed'?'habstow':'habdeploy'}:${p.id}" ${['deploying','stowing'].includes(p.phase)?'disabled':''}>${p.phase==='deployed'?'COMPACT':'DEPLOY'}</button></div>`).join('')}<p>Connecting doors remain locked during every transition. An occupied compartment cannot compact. B: brake · T: tablet.</p>`;}};
}
