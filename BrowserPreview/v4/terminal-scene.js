import * as T from 'three';
// Authored airport set: all dimensions in metres. Imported characters/furniture are added by the shared renderer.
export function buildTerminal(earth){
 const mat=(c,r=.7,m=0)=>new T.MeshStandardMaterial({color:c,roughness:r,metalness:m});
 const palette={floor:mat(0x283b44,.8),steel:mat(0x293d46,.38,.65),wood:mat(0x795039,.68),teal:mat(0x145451),fabric:mat(0x294957),amber:mat(0xc89849,.45,.4),rubber:mat(0x131d24),leaf:mat(0x3d6550)};
 function surfaceTexture(wood=false){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d'),data=x.createImageData(256,256);let seed=1729;for(let y=0;y<256;y++)for(let a=0;a<256;a++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const grain=(seed/4294967296-.5)*20+(wood?12*Math.sin(a*.4+Math.sin(y*.03)*1.8):0),v=wood?195:210,k=(y*256+a)*4;data.data.set([v+grain,v+grain,v+grain,255],k);}x.putImageData(data,0,0);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(wood?1:20,wood?1:20);return t;}
 palette.floor.map=surfaceTexture();palette.floor.color.setHex(0x52616a);palette.wood.map=surfaceTexture(true);
 const box=(p,s,m)=>{const a=new T.Mesh(new T.BoxGeometry(...s),m);a.position.fromArray(p);a.castShadow=a.receiveShadow=true;earth.add(a);return a;};
 const cyl=(p,r,h,m)=>{const a=new T.Mesh(new T.CylinderGeometry(r,r,h,20),m);a.position.fromArray(p);a.castShadow=a.receiveShadow=true;earth.add(a);return a;};
 function sign(lines,p,w,h,{background='#0b252e',color='#f0d29a',size=50}={}){const c=document.createElement('canvas');c.width=1024;c.height=Math.round(1024*h/w);const x=c.getContext('2d');x.fillStyle=background;x.fillRect(0,0,c.width,c.height);x.strokeStyle='#4c7278';x.lineWidth=5;x.strokeRect(5,5,c.width-10,c.height-10);x.fillStyle=color;x.font=`500 ${size}px sans-serif`;lines.forEach((line,i)=>x.fillText(line,38,(i+1)*c.height/(lines.length+1)));const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;const mesh=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:texture}));mesh.position.fromArray(p);earth.add(mesh);return mesh;}
 earth.background=new T.Color(0x628997);earth.fog=new T.FogExp2(0x628997,.0017);
 box([0,-.14,0],[55,.28,45],palette.floor);box([0,5,-3],[55,.3,35],mat(0x1b2f38));
 // Slatted ceiling and restrained luminous fixtures, not a white emissive ceiling.
 for(let x=-24;x<=24;x+=2){box([x,4.72,-3],[.12,.3,25],palette.wood);if(x%6===0)box([x+.3,4.52,-3],[.07,.035,16],new T.MeshStandardMaterial({color:0xedd6a5,emissive:0xffdb9b,emissiveIntensity:.7}));}
 const glass=new T.MeshPhysicalMaterial({color:0x7ba2a5,transparent:true,opacity:.12,roughness:.1,depthWrite:false});
 for(let x=-25;x<=25;x+=5){box([x,2.4,-15],[.16,5,.2],palette.steel);box([x+2.5,2.4,-15],[4.8,4.8,.035],glass);}
 for(let x=-25;x<25;x+=2.5)for(let z=-12;z<18;z+=2.5){box([x,.003,z],[.013,.002,2.5],palette.steel);box([x,.003,z],[2.5,.002,.013],palette.steel);}
 // Apron/runway, markings, safety bollards and a parked ground-service tug.
 box([0,-.22,-40],[100,.2,50],mat(0x36434a));box([0,-.4,-125],[500,.1,120],mat(0x265965,.28,.15));
 for(let x=-40;x<45;x+=7)box([x,-.1,-31],[3,.015,.15],palette.amber);
 for(const x of [-12,-10,10,12])cyl([x,.45,-17],.09,.9,palette.amber);
 box([-8,.45,-23],[2,.65,1.2],palette.teal);box([-8,1.05,-23],[.8,.6,1.1],palette.steel);
 for(const x of [-8.65,-7.35])for(const z of [-23.6,-22.4]){const wheel=cyl([x,.25,z],.28,.15,palette.rubber);wheel.rotation.x=Math.PI/2;}
 // Gate check-in desk, touchscreen kiosks and boarding lanes.
 box([3.6,.52,-3.5],[3.4,1.04,.85],palette.wood);box([3.6,1.08,-3.5],[3.6,.12,1],palette.steel);
 for(const x of [2.6,4.6]){box([x,1.3,-3.65],[.08,.4,.1],palette.steel);box([x,1.52,-3.65],[.65,.4,.09],palette.rubber);sign(['SV-7  /  CLEARED'],[x,1.52,-3.59],.6,.33,{size:55,color:'#a7dfd5'});}
 sign(['04   DEEP REACH','CREW BOARDING'],[3.6,2.7,-4.05],3.7,1,{size:68});
 for(const z of [-1,1.3,3.6])for(const x of [4.8,6.8]){cyl([x,.5,z],.035,1,palette.steel);cyl([x,.04,z],.18,.07,palette.steel);}
 for(const x of [4.8,6.8])box([x,.85,1.3],[.035,.07,4.6],palette.teal);
 for(const x of [-4.3,-3]){box([x,.65,-4.5],[.6,1.3,.5],palette.steel);const screen=sign(['CHECK IN','CREW / VISITOR'],[x,1.45,-4.22],.65,.5,{size:85,color:'#9fd9cc'});screen.rotation.x=-.12;}
 // Suitcases: ribs, handles, wheels and tags rather than anonymous cubes.
 function luggage(x,z,c){const m=mat(c,.48);box([x,.43,z],[.45,.7,.28],m);for(let a=-.17;a<.2;a+=.07)box([x+a,.43,z+.147],[.016,.58,.015],palette.steel);for(const a of [-.16,.16]){cyl([x+a,.07,z],.055,.07,palette.rubber);box([x+a,1,z],[.018,.45,.018],palette.steel);}box([x,1.23,z],[.34,.04,.045],palette.rubber);box([x+.1,.69,z+.16],[.07,.12,.01],palette.amber);}
 luggage(1.3,1,0xb27543);luggage(-2.2,-2,0x265d67);luggage(5,-5,0x683f39);
 // Luggage cart and planters flank, but never fill, the boarding lane.
 box([-6,.18,-2],[1.5,.12,.9],palette.steel);for(const x of [-6.6,-5.4])for(const z of [-2.35,-1.65])cyl([x,.07,z],.09,.12,palette.rubber);box([-6.7,.7,-2],[.035,1,.8],palette.steel);luggage(-6,-2,0x8c6d47);
 for(const x of [-9,9])for(const z of [-8,2]){box([x,.35,z],[.65,.7,.65],palette.wood);cyl([x,1.05,z],.06,1.4,palette.wood);for(let k=0;k<9;k++){const leaf=new T.Mesh(new T.SphereGeometry(.4,10,8),palette.leaf);leaf.scale.set(1.2,.3,.5);leaf.position.set(x+Math.sin(k)*.32,1.1+k*.09,z+Math.cos(k)*.25);leaf.rotation.z=Math.sin(k)*.7;earth.add(leaf);}}
 sign(['PACIFIC ORBITAL PORT','EARTH   /   DEPARTURES'],[-1,3.65,-9.8],8,1.3,{size:67});
 sign(['DEPARTURES       GATE      STATUS','SV-7  DEEP REACH    04       BOARDING','LUNAR TRANSFER    06       ON TIME','ORBITAL FREIGHT   02       LOADING'],[-7,2.8,-7],4.2,2,{size:40,color:'#a5d6d1'});
 sign(['04  >    BOARDING'],[0,.015,-2],2.8,.6,{size:65}).rotation.x=-Math.PI/2;
 for(let z=-9;z<8;z+=1.2)box([-1.5,.012,z],[.06,.005,.6],palette.amber);
 return {sign};
}
