import { sites, distance as siteDistance } from './exploration.js';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const color = {metal:0x34454e, dark:0x111b22, edge:0x66747c, cyan:0x69e4dc, amber:0xe4b073, white:0xd2d5c9};
function rng(seed=71) { return ()=>{seed=(seed*1664525+1013904223)>>>0; return seed/4294967296;}; }
const noiseGLSL=`
float hash(vec3 p){p=fract(p*.3183099+vec3(.11,.17,.13));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<6;i++){s+=noise(p)*a;p=p*2.03+vec3(4.1,1.7,9.2);a*=.5;}return s;}`;

export function createScene(canvas, state) {
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.6)); renderer.setClearColor(0x02060a);
  renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.15;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(68,1,.08,6000);
  const composer=new EffectComposer(renderer);composer.renderTarget1.samples=composer.renderTarget2.samples=4; composer.addPass(new RenderPass(scene,camera));
  const bloom=new UnrealBloomPass(new THREE.Vector2(800,600),.32,.5,1.05); composer.addPass(bloom); composer.addPass(new OutputPass());
  const mats={};
  // Original tileable micro-machining texture: material detail, not a stand-in image.
  const finishCanvas=document.createElement('canvas');finishCanvas.width=finishCanvas.height=256;
  const finishCtx=finishCanvas.getContext('2d'),finishRng=rng(682),finishPixels=finishCtx.createImageData(256,256);
  for(let i=0;i<finishPixels.data.length;i+=4){const v=160+finishRng()*55;finishPixels.data[i]=finishPixels.data[i+1]=finishPixels.data[i+2]=v;finishPixels.data[i+3]=255;}
  finishCtx.putImageData(finishPixels,0,0);finishCtx.strokeStyle='#858585';finishCtx.lineWidth=.3;
  for(let i=0;i<60;i++){const y=finishRng()*256,x=finishRng()*256;finishCtx.beginPath();finishCtx.moveTo(x,y);finishCtx.lineTo(x+finishRng()*25,y);finishCtx.stroke();}
  const surfaceFinish=new THREE.CanvasTexture(finishCanvas);surfaceFinish.wrapS=surfaceFinish.wrapT=THREE.RepeatWrapping;surfaceFinish.repeat.set(3,3);
  function mat(key,glow=false) {
    const id=key+'-'+glow;
    if(!mats[id]) mats[id]=glow?new THREE.MeshBasicMaterial({color:key}):new THREE.MeshStandardMaterial({color:key,metalness:.32,roughness:.57,bumpMap:surfaceFinish,bumpScale:.012});
    return mats[id];
  }
  function mesh(geo, material, parent, p=[0,0,0], rot=[0,0,0]) {
    const o=new THREE.Mesh(geo,material);o.position.set(...p);o.rotation.set(...rot);parent.add(o);return o;
  }
  const boxGeo=new THREE.BoxGeometry(1,1,1),boxCache=new Map();
  function box(parent,p,size,c=color.metal,glow=false,rot=[0,0,0]) {
    if(!glow&&Math.min(...size)>.1){const key=size.join(',');if(!boxCache.has(key))boxCache.set(key,new RoundedBoxGeometry(...size,2,Math.min(.065,Math.min(...size)*.23)));return mesh(boxCache.get(key),mat(c),parent,p,rot);}
    const o=mesh(boxGeo,mat(c,glow),parent,p,rot);o.scale.set(...size);return o;
  }
  function cylinder(parent,p,r1,r2,h,c=color.metal,rot=[0,0,0],segments=16) {return mesh(new THREE.CylinderGeometry(r1,r2,h,segments),mat(c),parent,p,rot);}
  function tube(parent,points,r,c,glow=false) { return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),points.length*4,r,6,false),mat(c,glow),parent); }
  function textTexture(text,sub='',w=1024,h=256) {
    const cv=document.createElement('canvas'); cv.width=w;cv.height=h;const ctx=cv.getContext('2d');
    ctx.fillStyle='#101d24';ctx.fillRect(0,0,w,h);ctx.fillStyle='#8fbbb9';ctx.fillRect(30,30,8,h-60);
    ctx.font=`600 ${h*.24}px 'Barlow Condensed', sans-serif`;ctx.fillStyle='#d4e6e4';ctx.fillText(text,65,h*.5);
    ctx.font=`${h*.09}px 'IBM Plex Mono', monospace`;ctx.fillStyle='#678b90';ctx.fillText(sub,68,h*.76);
    const t=new THREE.CanvasTexture(cv); t.colorSpace=THREE.SRGBColorSpace;return t;
  }
  function label(parent,text,sub,p,size=[3,.65],rot=[0,0,0]) {return mesh(new THREE.PlaneGeometry(...size),new THREE.MeshBasicMaterial({map:textTexture(text,sub),side:THREE.DoubleSide}),parent,p,rot);}
  function monitorTexture(type,seed=1) {
    const cv=document.createElement('canvas');cv.width=768;cv.height=400;const c=cv.getContext('2d'),r=rng(seed);
    c.fillStyle='#07181e';c.fillRect(0,0,768,400);c.strokeStyle='#12383e';c.lineWidth=1;
    for(let x=24;x<768;x+=40){c.beginPath();c.moveTo(x,50);c.lineTo(x,380);c.stroke();}
    for(let y=60;y<400;y+=40){c.beginPath();c.moveTo(24,y);c.lineTo(740,y);c.stroke();}
    c.fillStyle='#a4dfd8';c.font='22px IBM Plex Mono';c.fillText(type,25,35);c.fillStyle='#567d81';c.font='12px IBM Plex Mono';c.fillText('SV-7  /  FLIGHT SYSTEMS  //  SECURE',25,385);
    if(type.includes('VECTOR')){
      c.strokeStyle='#6bc5ba';for(let i=0;i<4;i++){c.beginPath();c.ellipse(360,205,45+i*42,30+i*22,-.35,0,Math.PI*2);c.stroke();}
      c.fillStyle='#e1ad6b';c.beginPath();c.arc(360,205,26,0,Math.PI*2);c.fill();c.fillStyle='#8ae1cc';c.fillRect(490,120,8,8);
      c.font='14px IBM Plex Mono';c.fillText('ASTERION IV',60,90);c.fillText('VECTOR 048.26',510,300);
    }else{
      for(let i=0;i<5;i++){c.fillStyle='#779b9c';c.font='15px IBM Plex Mono';c.fillText(['REACTOR','ATMOSPHERE','CONTAINMENT','PROPULSION','LIFE SUPPORT'][i],30,90+i*53);c.fillStyle='#16434b';c.fillRect(250,75+i*53,440,12);c.fillStyle=i===2?'#bc9d68':'#70c7b8';c.fillRect(250,75+i*53,280+r()*150,12);}
      c.strokeStyle='#6dd6be';c.beginPath();for(let x=20;x<748;x+=5){const y=345+Math.sin(x*.04)*7+Math.sin(x*.13)*3;x===20?c.moveTo(x,y):c.lineTo(x,y);}c.stroke();
    }
    const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;return t;
  }
  const screens=[monitorTexture('ORBITAL VECTOR',3),monitorTexture('SHIP DIAGNOSTICS',7),monitorTexture('REACTOR OUTPUT',2)];
  function display(parent,p,w,h,index=0,rot=[0,0,0]) {
    const g=new THREE.Group();g.position.set(...p);g.rotation.set(...rot);parent.add(g);
    box(g,[0,0,0],[w+.16,h+.16,.12],0x17272f);
    mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:screens[index],toneMapped:false}),g,[0,0,.067]);
    for(let i=0;i<5;i++)box(g,[-w*.4+i*.1,-h*.5-.043,.07],[.04,.015,.008],i===0?color.amber:color.cyan,true);
    return g;
  }
  const cabinAmbient=new THREE.HemisphereLight(0xddd7c7,0x1b2932,1.25);scene.add(cabinAmbient);
  const sun=new THREE.DirectionalLight(0xffd6a2,3.5);sun.position.set(-25,45,-45);scene.add(sun);
  const fill=new THREE.DirectionalLight(0x77bfd6,1.5);fill.position.set(5,10,25);scene.add(fill);
  const space=new THREE.Group();scene.add(space);
  const random=rng(73),starP=[],starC=[];
  for(let i=0;i<2200;i++) {const z=random()*2-1,a=random()*Math.PI*2,rr=Math.sqrt(1-z*z);starP.push(Math.cos(a)*rr*2500,z*2500,Math.sin(a)*rr*2500);const v=.2+random()*.8;starC.push(v,v*(.85+random()*.15),v*(.75+random()*.25));}
  const starGeo=new THREE.BufferGeometry();starGeo.setAttribute('position',new THREE.Float32BufferAttribute(starP,3));starGeo.setAttribute('color',new THREE.Float32BufferAttribute(starC,3));
  const starCanvas=document.createElement('canvas');starCanvas.width=starCanvas.height=24;const starCtx=starCanvas.getContext('2d'),starGradient=starCtx.createRadialGradient(12,12,0,12,12,12);starGradient.addColorStop(0,'#fff');starGradient.addColorStop(.2,'#ffffffdd');starGradient.addColorStop(1,'#ffffff00');starCtx.fillStyle=starGradient;starCtx.fillRect(0,0,24,24);
  space.add(new THREE.Points(starGeo,new THREE.PointsMaterial({size:2.1,map:new THREE.CanvasTexture(starCanvas),sizeAttenuation:false,vertexColors:true,transparent:true,depthWrite:false,opacity:.7})));
  const planetMat=new THREE.ShaderMaterial({uniforms:{time:{value:0}},vertexShader:`varying vec3 n;varying vec3 wp;void main(){n=normal;wp=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`
    varying vec3 n;varying vec3 wp;uniform float time;${noiseGLSL}
    void main(){vec3 N=normalize(n);vec3 q=N*3.2;float height=fbm(q+vec3(12.,2.,6.));float land=smoothstep(.47,.54,height);float mountains=fbm(q*7.);vec3 sea=mix(vec3(.018,.065,.082),vec3(.06,.25,.28),smoothstep(.3,.53,height));vec3 ground=mix(vec3(.17,.23,.19),vec3(.39,.34,.23),mountains);ground=mix(ground,vec3(.63,.67,.6),smoothstep(.73,.95,abs(N.y)));vec3 surface=mix(sea,ground,land);float cloud=smoothstep(.51,.67,fbm(N*6.+vec3(time*.003,0.,0.))*.8+fbm(N*19.)*.2);surface=mix(surface,vec3(.76,.81,.76),cloud*.8);float day=max(0.,dot(N,normalize(vec3(-.8,.7,.9))));vec3 col=surface*(.05+day*1.5);float city=step(.67,fbm(N*92.))*land*(1.-smoothstep(.0,.18,day));col+=city*vec3(.5,.22,.05);float rim=pow(1.-max(0.,dot(N,normalize(cameraPosition-wp))),3.);col+=rim*vec3(.1,.31,.39)*smoothstep(-.1,.3,day);gl_FragColor=vec4(col,1.);}`});
  const planet=mesh(new THREE.SphereGeometry(145,96,64),planetMat,space,[55,50,-390]);
  const atmosphere=mesh(new THREE.SphereGeometry(147,64,48),new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.BackSide,blending:THREE.AdditiveBlending,vertexShader:`varying vec3 N;varying vec3 V;void main(){vec4 p=modelViewMatrix*vec4(position,1.);N=normalize(normalMatrix*normal);V=normalize(-p.xyz);gl_Position=projectionMatrix*p;}`,fragmentShader:`varying vec3 N;varying vec3 V;void main(){float rim=pow(max(0.,1.-abs(dot(normalize(N),normalize(V)))),4.);gl_FragColor=vec4(vec3(.12,.48,.64)*rim,rim*.7);}`}),space,planet.position.toArray());
  // Tiny distant warm star; analytic glow, not a stock image.
  const glowCV=document.createElement('canvas');glowCV.width=glowCV.height=128;const gc=glowCV.getContext('2d'),gr=gc.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(255,236,195,1)');gr.addColorStop(.08,'rgba(255,213,145,.95)');gr.addColorStop(.25,'rgba(255,183,106,.18)');gr.addColorStop(1,'rgba(255,153,70,0)');gc.fillStyle=gr;gc.fillRect(0,0,128,128);
  const solar=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(glowCV),blending:THREE.AdditiveBlending,depthWrite:false}));solar.position.set(-280,105,-800);solar.scale.set(180,180,1);space.add(solar);
  let cinemaShot=null;const rooms=[],doorPanels=[],coreRings=[],droneModels=[],aliens=[],roomLights=[];
  function point(parent,p,c,intensity=30,range=15) {const l=new THREE.PointLight(c,intensity,range,2);l.position.set(...p);parent.add(l);return l;}
  function floor(parent,length=18) {
    box(parent,[0,-.17,0],[14,.3,length],0x1e2b32);
    const geos=[];
    for(let x=-6;x<=6;x+=2)for(let z=-length/2+1;z<length/2;z+=2){const g=new THREE.BoxGeometry(1.96,.025,1.96);g.translate(x,0,z);geos.push(g);}
    mesh(mergeGeometries(geos),mat(0x2b3b42),parent);geos.forEach(g=>g.dispose());
    for(const x of [-5.8,5.8]){box(parent,[x,.035,0],[.035,.025,length-.3],color.cyan,true);for(let z=-length/2;z<length/2;z+=2)box(parent,[x,.05,z],[.14,.03,.6],0x19373d);}
    for(const x of [-1.6,1.6])box(parent,[x,.025,0],[.03,.02,length],0x9b8258);
  }
  function rib(parent,z){
    for(const s of [-1,1]){
      box(parent,[s*6.8,2.15,z],[.18,4.3,.3],0x4c606b);
      box(parent,[s*5.6,4.55,z],[2.5,.2,.3],0x4c606b,false,[0,0,-s*.38]);
      box(parent,[s*6.62,2.1,z-.16],[.035,3.6,.04],color.cyan,true);
    }
    box(parent,[0,5,z],[9.1,.2,.3],0x52616a);
  }
  function hatch(parent,z,i,labelText='BULKHEAD') {
    const boundary=new THREE.Group();boundary.position.copy(parent.position);boundary.position.z+=z;scene.add(boundary);parent=boundary;z=0;
    for(const s of [-1,1])box(parent,[s*4.4,2.5,z],[5.2,5,.16],0x283941);
    box(parent,[0,4.4,z],[3.8,1.2,.2],0x344750);
    for(const s of [-1,1])box(parent,[s*1.95,1.9,z+.12],[.18,3.8,.28],color.edge);
    const panels=[];
    for(const s of [-1,1]){const g=new THREE.Group();g.position.set(s*.92,1.85,z);parent.add(g);box(g,[0,0,0],[1.82,3.7,.15],0x243c46);box(g,[s*.65,0,.09],[.05,3.3,.02],color.amber,true);box(g,[0,0,.11],[1.2,.045,.02],0x91a4a5);panels.push({g,s});}
    doorPanels.push({panels,index:i,boundary});label(parent,labelText,'PRESS E / AUTHORIZED CREW ONLY',[0,4.35,z+.13],[2.8,.55]);
    box(parent,[2.3,1.5,z+.13],[.3,.45,.09],0x101d24);box(parent,[2.3,1.5,z+.19],[.18,.28,.01],color.cyan,true);
  }
  function chair(parent,x,z){
    const g=new THREE.Group();g.position.set(x,0,z);parent.add(g);
    cylinder(g,[0,.4,0],.36,.48,.8,0x364c57);box(g,[0,.85,0],[1.1,.25,1.2],0x1c2a32);
    box(g,[0,1.55,.4],[1.05,1.5,.24],0x26333b,false,[-.13,0,0]);box(g,[0,2.36,.47],[.72,.32,.24],0x5b6565);
    for(const s of [-1,1]){box(g,[s*.65,1.3,0],[.16,.16,1],0x56636a);box(g,[s*.68,.9,.12],[.1,.65,.1],0x414b52);box(g,[s*.4,1.4,.24],[.06,1,.03],0x7f6950);}
    return g;
  }
  function bridge(){
    const g=new THREE.Group();scene.add(g);rooms.push(g);floor(g);rib(g,5);rib(g,-1.6);rib(g,-7.8);
    box(g,[0,5.2,1.2],[14,.2,15.6],0x17242d);
    for(const s of [-1,1]){
      box(g,[s*7,2.5,1.2],[.2,5,15.7],0x23343c);
      for(let z=-6;z<8;z+=2.6){box(g,[s*6.86,2.5,z],[.12,3,2.4],0x657574);box(g,[s*6.78,3.2,z],[.03,.06,1.8],0x71848b);box(g,[s*6.78,1.2,z],[.03,.08,1.8],0x8c7758);}
      for(let z=-3;z<6;z+=3)display(g,[s*6.72,2.4,z],2.1,1.2,1,[0,-s*Math.PI/2,0]);
      // Angled flight consoles, with embedded screens and individually machined controls.
      const c=new THREE.Group();c.position.set(s*3.7,1,-4.6);c.rotation.y=-s*.25;g.add(c);
      box(c,[0,-.5,0],[3.7,1,2.1],0x25343c);box(c,[0,.1,0],[3.9,.2,2.3],0x536168,false,[-.24,0,0]);
      display(c,[0,.6,-.35],3.15,1.45,s<0?0:1,[-.65,0,0]);
      for(let k=0;k<9;k++){box(c,[-1.5+k*.37,.34,.78],[.22,.06,.15],k%3===0?color.amber:0x4b7276,k%3===0);cylinder(c,[-1.45+k*.36,.38,.98],.045,.045,.06,color.edge);}
      chair(g,s*4,-1.7);roomLights.push({light:point(g,[s*4,2.7,-3.4],0x58bfc4,35,8),room:0,base:0x58bfc4});
      box(g,[s*4.3,4.9,.3],[.07,.05,12],color.white,true);
    }
    // Panoramic pressure window with thick structural mullions and sill.
    box(g,[0,.65,-8.2],[14,1.3,.35],0x394953);box(g,[0,5.15,-8.2],[14,.35,.35],0x3c515d);
    for(const s of [-1,1]){
      box(g,[s*6.5,3,-8.2],[.22,4.2,.35],0x627880,false,[0,0,-s*.16]);
      box(g,[s*2.9,3.15,-8.2],[.12,4.2,.25],0x455c67,false,[0,0,-s*.18]);
      box(g,[s*3.1,1.4,-8],[5.7,.08,.06],color.cyan,true);
    }
    box(g,[0,1.02,-5.8],[2.1,1.8,1],0x273942);display(g,[0,1.95,-5.3],1.9,.8,0,[-.22,0,0]);
    chair(g,0,1.6);hatch(g,9,0,'02 / HABITAT');
    label(g,'SV–7  LONGHAUL','INDEPENDENT DEEP SPACE TRANSPORT',[0,4.65,-8],[4.1,.33]);
    return g;
  }
  bridge();
  function compartment(index){
    const g=new THREE.Group();g.position.z=index*18;scene.add(g);rooms.push(g);floor(g);
    for(let z=-6;z<9;z+=6)rib(g,z);
    box(g,[0,5.2,0],[14,.2,18],0x1b2b34);
    for(const s of [-1,1]){
      if(index===1&&s===1){box(g,[7,.65,0],[.2,1.3,18],0x858b82);box(g,[7,4.7,0],[.2,.6,18],0x858b82);for(const z of [-6,6])box(g,[7,2.85,z],[.2,3.1,6],0x858b82);}else box(g,[s*7,2.5,0],[.2,5,18],0x858b82);box(g,[s*4.6,4.95,0],[.07,.06,17],color.white,true);
      tube(g,[[s*6.6,.4,-8],[s*6.6,4.2,-7],[s*6.6,4.2,8]],.08,0x9d8f70);
    }
    hatch(g,9,index<3?index:3,['','03 / LOGISTICS','04 / ENGINEERING','ENGINE ACCESS'][index]);label(g,['','02 / HABITAT','03 / LOGISTICS','04 / ENGINEERING'][index],'SV–7 LONGHAUL',[0,4.35,-8.9],[3.5,.5]);
    roomLights.push({light:point(g,[0,4.2,0],index===3?0x80bfff:0xa4ddd3,60,18),room:index,base:index===3?0x80bfff:0xa4ddd3});
    return g;
  }
  const crew=compartment(1);
  // Two berths, a dedicated work desk and a panoramic shutter: a deliberate cabin, not a prop pile.
  for(const s of [-1,1]){const z=4.5;
    box(crew,[s*4.6,.45,z],[3.8,.7,2.6],0x303e45);box(crew,[s*4.6,.9,z],[3.65,.25,2.5],0xb6b4a1);
    box(crew,[s*5.8,1.1,z],[.8,.25,2.1],0xd0ccbb);box(crew,[s*4.1,1.05,z],[1.9,.12,2.45],0x526e6a);
    box(crew,[s*6.75,1.7,z],[.18,2.4,2.8],0x3e5359);box(crew,[s*4.8,3,z],[4,.18,2.8],0x748079);
    box(crew,[s*5,2.85,z],[3,.05,.05],0xf0d8a7,true);label(crew,s<0?'COMMANDER':'GUEST','REST / RECOVER',[s*2.67,1.8,z],[1.5,.3],[0,-s*Math.PI/2,0]);
  }
  box(crew,[-4.8,1.5,-3.8],[3.5,.18,2],0x8f8a72);for(const x of [-6,-3.5])box(crew,[x,.75,-3.8],[.12,1.5,1.7],0x394c51);display(crew,[-4.7,2.35,-4.45],2.2,1.2,1);chair(crew,-4.5,-2);
  for(const z of [-3,3])box(crew,[6.8,2.85,z],[.3,3.2,.15],0x4d686e);for(const y of [1.3,4.4])box(crew,[6.8,y,0],[.3,.12,6],0x4d686e);
  const curtain=new THREE.Group();curtain.position.set(6.85,2.85,0);crew.add(curtain);box(curtain,[0,0,0],[.15,3,5.9],0x9b9783);for(let z=-2.8;z<3;z+=.3)box(curtain,[-.09,0,z],[.03,3,.035],0x7d8072);
  label(crew,'A PLACE TO CALL HOME','KEPLER-442b / ORBITAL OBSERVATION',[-6.85,3.8,0],[4,.5],[0,Math.PI/2,0]);
  const cargo=compartment(2);
  function crate(parent,p,size,seed){const g=new THREE.Group();g.position.set(...p);parent.add(g);box(g,[0,size[1]/2,0],size,seed%2?0x685844:0x43606a);for(const x of [-1,1])for(const z of [-1,1])box(g,[x*(size[0]/2-.08),size[1]/2,z*(size[2]/2-.08)],[.16,size[1]+.04,.16],0x202e33);for(const y of [.2,size[1]-.2])box(g,[0,y,size[2]/2+.02],[size[0],.09,.04],0x9b8d6a);label(g,`SV7 / ${String(804+seed).padStart(4,'0')}`,'SEALED · FLIGHT RATED',[0,size[1]*.6,size[2]/2+.045],[size[0]*.8,.3]);return g;}
  for(const s of [-1,1])for(let i=0;i<3;i++){crate(cargo,[s*4.2,0,-4+i*4],[3.2,1.7,2.7],i+4);if(i!==1)crate(cargo,[s*4.2,1.72,-4+i*4],[2.8,1.4,2.4],i+8);}
  for(let z=-7;z<8;z+=.55)box(cargo,[0,.035,z],[2.4,.025,.055],0x8e7952);
  label(cargo,'CARGO / 03','PAYLOAD 24.8 t  ·  GRAVITY LOCK ENGAGED',[0,4.35,-8.62],[3.8,.55]);
  const engine=compartment(3);
  const core=new THREE.Group();core.position.set(0,0,0);engine.add(core);
  cylinder(core,[0,.35,0],2,2.2,.7,0x374f5b);cylinder(core,[0,4.3,0],1.8,1.8,.5,0x374f5b);
  const coreGlow=mesh(new THREE.CylinderGeometry(.65,.65,3.2,32),new THREE.MeshBasicMaterial({color:0x87e8ed,transparent:true,opacity:.75}),core,[0,2.3,0]);
  for(let i=0;i<6;i++){const ring=mesh(new THREE.TorusGeometry(1.2+i*.055,.075,8,64),mat(i%2?color.cyan:color.edge,i%2===1),core,[0,1.1+i*.5,0],[Math.PI/2,0,0]);coreRings.push(ring);}
  for(let i=0;i<6;i++){const a=i*Math.PI/3,x=Math.cos(a)*1.6,z=Math.sin(a)*1.6;cylinder(core,[x,2.3,z],.1,.1,3.6,0x869799);tube(engine,[[x,.3,z],[x*1.8,.3,z*1.8],[x*1.8,.2,z*1.8+2]],.12,0x968970);}
  point(engine,[0,2.5,0],0x59d5f1,100,13);
  for(const s of [-1,1])for(let z=-4;z<=4;z+=4){cylinder(engine,[s*5,1.5,z],.65,.65,3,0x66757a);for(const y of [.3,2.7])cylinder(engine,[s*5,y,z],.7,.7,.15,0x283b44);display(engine,[s*4.3,2,z],.8,.6,2,[0,-s*Math.PI/2,0]);}
  label(engine,'HELIUM-3 / CORE 01','CONTAINMENT STABLE',[0,4.35,-8.62],[3.8,.55]);
  // Vessel exterior: beveled cross sections, independent armor plates, exposed machinery.
  const hull=new THREE.Group();scene.add(hull);
  const hullVerts=[],hullIndices=[];
  const rings=[[-10,3.6,4.5],[-6,7.4,5.5],[10,7.8,5.5],[52,7.3,5],[77,5.2,3.8]];
  for(const [z,w,h] of rings)for(const [x,y] of [[-.68,-.25],[.68,-.25],[1,.1],[1,.8],[.65,1],[-.65,1],[-1,.8],[-1,.1]])hullVerts.push(x*w,y*h,z);
  for(let r=0;r<4;r++)for(let j=0;j<8;j++){const a=r*8+j,b=r*8+(j+1)%8;hullIndices.push(a,b,a+8,b,b+8,a+8);}
  for(let j=1;j<7;j++)hullIndices.push(0,j+1,j,32,32+j,32+j+1);
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(hullVerts,3));geo.setIndex(hullIndices);geo.computeVertexNormals();mesh(geo,new THREE.MeshStandardMaterial({color:0x53616b,roughness:.6,metalness:.7,side:THREE.DoubleSide}),hull);
  for(let z=-4;z<71;z+=3.4)for(const s of [-1,1]){
    box(hull,[s*7.5,2.5,z],[.16,2.6,3.2],z%3>1?0x778083:0x33464f);box(hull,[s*7.6,1,z],[.2,.2,2.9],0xa18356);
    for(const k of [-1,1])box(hull,[s*7.65,2.5+k*.85,z],[.04,.06,2.6],0x253842);
    box(hull,[s*3,5.5,z],[5.4,.14,3.15],0x3d515c);box(hull,[s*3,5.61,z],[4.8,.02,.035],0x99a4a2);
  }
  for(const s of [-1,1]){
    label(hull,'SV–7 / LONGHAUL','DEEP SPACE TRANSPORT',[s*7.67,3,14],[8,1.3],[0,s*Math.PI/2,0]);
    mesh(new THREE.CylinderGeometry(1.25,2.15,5,32,1,true),new THREE.MeshStandardMaterial({color:0x354852,metalness:.7,roughness:.4,side:THREE.DoubleSide}),hull,[s*4.7,1.6,78],[Math.PI/2,0,0]);
    cylinder(hull,[s*4.7,1.6,81],1.9,1.7,.3,0x8da0a6,[Math.PI/2,0,0],32);
    mesh(new THREE.CircleGeometry(1.55,32),mat(0x62daf1,true),hull,[s*4.7,1.6,81.17]);
    for(let i=0;i<12;i++){const a=i*Math.PI/6;box(hull,[s*4.7+Math.cos(a)*1.65,1.6+Math.sin(a)*1.65,78],[.1,.1,4.8],0x8c9ca2);}
    for(const z of [-4,63])for(const y of [0,4]){mesh(new THREE.CylinderGeometry(.25,.5,.9,16,1,true),new THREE.MeshStandardMaterial({color:0x8a9a9f,metalness:.6,roughness:.4,side:THREE.DoubleSide}),hull,[s*8,y,z],[0,0,s*Math.PI/2]);box(hull,[s*7.6,y,z],[.6,.8,1.1],0x293c47);}
    tube(hull,[[s*6,4.8,52],[s*6,6,60],[s*5,5.6,75]],.18,0xa69b7c);
  }
  // Navigation lights and pressure window panels are actual geometry, not painted billboards.
  for(const s of [-1,1])box(hull,[s*2.7,2.8,-9.65],[2.5,2.1,.12],0x153b48);
  point(hull,[-7.7,3,-3],0xe0654b,8,6);point(hull,[7.7,3,-3],0x61dfbb,8,6);
  for(const s of [-1,1])box(hull,[s*7.7,3,-3],[.12,.12,.2],s<0?0xe0654b:0x61dfbb,true);
  function drone(index){
    const g=new THREE.Group();scene.add(g);box(g,[0,0,0],[.85,.38,.7],index===0?0x9c9276:0x687f86);box(g,[0,.02,-.38],[.52,.22,.12],0x132e3b);box(g,[0,.04,-.45],[.28,.07,.02],color.cyan,true);
    for(const s of [-1,1]){box(g,[s*.55,-.06,0],[.3,.22,.85],0x263d49);cylinder(g,[s*.55,.08,.2],.13,.13,.07,0x97acb0);cylinder(g,[s*.55,.08,-.2],.13,.13,.07,0x97acb0);}
    label(g,['K-01','M-02','F-03'][index],'AUTONOMOUS',[0,.2,.1],[.52,.13],[-Math.PI/2,0,0]);droneModels.push(g);return g;
  }
  for(let i=0;i<3;i++)drone(i);
  for(let i=0;i<4;i++){
    const g=new THREE.Group();cargo.add(g);mesh(new THREE.IcosahedronGeometry(.38,1),mat(0x7c8965),g,[0,.4,0]);for(let k=0;k<6;k++){const a=k*Math.PI/3;tube(g,[[0,.3,0],[Math.cos(a)*.55,.35,Math.sin(a)*.55],[Math.cos(a)*.7,0,Math.sin(a)*.7]],.045,0x647850);}g.position.set(i%2?2.2:-2.2,0,-2+i*1.8);aliens.push(g);
  }
  // Distant orbital logistics station, including lit habitat rings and docking spines.
  const station=new THREE.Group();station.position.set(-95,5,-75);station.rotation.set(.1,-.4,.25);scene.add(station);
  mesh(new THREE.TorusGeometry(18,.8,8,96),mat(0x6e7a7c),station,[0,0,0]);mesh(new THREE.TorusGeometry(18.3,.06,4,96),mat(color.amber,true),station);
  cylinder(station,[0,0,0],2.5,2.5,15,0x556d77,[Math.PI/2,0,0]);for(let i=0;i<6;i++){const a=i*Math.PI/3;box(station,[Math.cos(a)*9,Math.sin(a)*9,0],[18,.6,.6],0x687a82,false,[0,0,a]);}
  label(station,'ASTERION / 04','ORBITAL TRANSFER STATION',[0,5,8],[10,2]);
  // Repeated habitation modules, illumination, and photovoltaic radiator wings finish the station silhouette.
  for(let i=0;i<12;i++){const a=i*Math.PI/6,x=Math.cos(a)*18,y=Math.sin(a)*18;box(station,[x,y,0],[4,2.2,2.6],0x526773,false,[0,0,a+Math.PI/2]);for(const o of [-1,1])box(station,[x,y,o*1.32],[2.8,.15,.03],color.amber,true,[0,0,a+Math.PI/2]);}
  for(const s of [-1,1])for(let i=0;i<3;i++){box(station,[s*(25+i*7),0,-4],[6.5,11,.12],0x203a50);for(let k=-4;k<=4;k++)box(station,[s*(25+i*7),k,-3.92],[6.3,.035,.02],0x738997);tube(station,[[s*18,0,0],[s*20,0,-4],[s*42,0,-4]],.16,0x788d94);}
  // A connected sector rendered relative to the ship: distant geometry is projected
  // proportionally past 4,800 scene units to retain angular size without depth loss.
  const galaxy=new THREE.Group();scene.add(galaxy);
  const siteObjects=[];
  sites.forEach((site,index)=>{
    let object;
    if(index===6){object=new THREE.Group();object.add(planet,atmosphere);planet.position.set(0,0,0);atmosphere.position.set(0,0,0);object.userData.baseRadius=145;}
    else if(site.kind==='station'){object=index===0?station:station.clone(true);object.rotation.set(0,0,0);object.userData.baseRadius=1;}
    else if(site.kind==='moon'){object=new THREE.Group();const rock=new THREE.IcosahedronGeometry(1,4);const pos=rock.attributes.position;for(let v=0;v<pos.count;v++){const x=pos.getX(v),y=pos.getY(v),z=pos.getZ(v),r=1+.025*Math.sin(x*30)*Math.cos(z*24);pos.setXYZ(v,x*r,y*r,z*r);}rock.computeVertexNormals();mesh(rock,mat(0x9b9c92),object);object.userData.baseRadius=1;}
    else {object=new THREE.Group();const random=rng(900+index);
      if(site.kind==='field'){
        const geo=new THREE.IcosahedronGeometry(1,1),instances=new THREE.InstancedMesh(geo,mat(0x69665d),56),dummy=new THREE.Object3D();
        for(let k=0;k<56;k++){dummy.position.set((random()-.5)*170,(random()-.5)*90,(random()-.5)*170);dummy.rotation.set(random()*3,random()*3,random()*3);const r=1+random()*7;dummy.scale.set(r,r*.7,r*.9);dummy.updateMatrix();instances.setMatrixAt(k,dummy.matrix);}object.add(instances);
      }else if(site.kind==='derelict'){
        for(let k=0;k<6;k++){box(object,[(random()-.5)*5,(random()-.5)*3,k*5-15],[8-k*.6,3.5,4.7],0x505b5a,false,[0,0,(random()-.5)*.3]);for(const x of [-1,1])box(object,[x*3,1,k*5-15],[.12,5,.12],color.amber);}
        label(object,'KESTREL / S–09','SURVEY VESSEL · SIGNAL LOST',[0,2.9,-6],[8,1.3]);
      }else{
        for(let k=0;k<6;k++){const a=k*Math.PI/3;box(object,[Math.cos(a)*8,Math.sin(a)*8,0],[1.6,5,1.6],site.kind==='ruin'?0x737665:0x526f80,false,[0,0,a]);tube(object,[[0,0,0],[Math.cos(a)*6,Math.sin(a)*6,0],[Math.cos(a)*8,Math.sin(a)*8,0]],.15,0x7f948f);}
        mesh(new THREE.IcosahedronGeometry(2,1),mat(site.kind==='beacon'?color.amber:color.cyan,true),object);mesh(new THREE.TorusGeometry(5,.12,8,64),mat(0x8d9e95),object,[0,0,0],[Math.PI/3,0,0]);
      }
      object.userData.baseRadius=1;
    }
    galaxy.add(object);siteObjects.push(object);
  });
  const concourse=new THREE.Group();concourse.position.z=-150;scene.add(concourse);
  box(concourse,[0,-.15,0],[24,.3,34],0x2e4249);box(concourse,[0,6,0],[24,.2,34],0x1c3039);
  for(const side of [-1,1]){
    box(concourse,[side*12,3,0],[.3,6,34],0x354d55);
    for(let z=-14;z<=14;z+=7){box(concourse,[side*11.7,2.5,z],[.2,4.5,5.5],0x163742);box(concourse,[side*11.5,5,z],[.1,.08,5.8],color.cyan,true);display(concourse,[side*8.8,2,z],2.5,1.3,1,[0,-side*Math.PI/2,0]);box(concourse,[side*9.7,.75,z],[3,1.5,4],0x435b63);}
    box(concourse,[side*2,.035,0],[.035,.03,32],color.amber,true);box(concourse,[side*6,5.8,0],[.08,.05,30],color.white,true);
  }
  box(concourse,[0,3,-17],[24,6,.2],0x253e49);box(concourse,[0,3,17],[24,6,.2],0x253e49);
  label(concourse,'EXPLORATION EXCHANGE','SURVEYS · ARTIFACTS · SHIP UPGRADES',[0,4.5,-16.8],[10,1.3]);
  box(concourse,[0,1,-13],[7,2,1.7],0x566763);display(concourse,[0,2.4,-12.1],3.8,1.2,0);box(concourse,[0,1.9,16.7],[3.6,3.8,.2],0x3f606b);label(concourse,'SV–7 / DOCK AIRLOCK','RETURN TO VESSEL',[0,4.5,16.5],[5,.9],[0,Math.PI,0]);
  const stationName=label(concourse,'ASTERION ANCHORAGE','INDEPENDENT CARTOGRAPHERS GUILD',[0,5,-8],[9,1]);
  point(concourse,[0,5,0],0xb6d1c9,240,35);point(concourse,[0,4,-13],0xe2bb85,100,16);
  const citizens=[];
  for(let i=0;i<12;i++){const person=new THREE.Group();concourse.add(person);box(person,[0,1.05,0],[.42,.65,.28],i%2?0x697466:0x567684);mesh(new THREE.SphereGeometry(.16,10,8),mat(0xb29a7a),person,[0,1.55,0]);const legs=[];for(const side of [-1,1]){legs.push(box(person,[side*.13,.42,0],[.15,.8,.19],0x283e4c));box(person,[side*.3,1.03,0],[.14,.68,.18],0x546d71);}citizens.push({person,legs});}
  concourse.visible=false;let stationID=-1;
  const poses={bridge:{p:[0,3.05,.5],t:[0,2.8,-22],room:0},pilot:{p:[0,2.4,-2.8],t:[0,2.8,-30],room:0},port:{p:[-12,7,76],t:[-4,3,-20],room:-1},starboard:{p:[12,7,76],t:[4,3,-20],room:-1},station:{p:[0,2.1,-136],t:[0,2,-166],room:4},front:{p:[0,3,-11],t:[20,17,-390],room:-1},crew:{p:[0,2.15,24],t:[2.5,2.2,15],room:1},cargo:{p:[0,2.15,42],t:[0,2,30],room:2},engine:{p:[2.5,2.15,60],t:[0,2.1,53],room:3}};
  let active='bridge',targetPosition=new THREE.Vector3(),targetQuat=new THREE.Quaternion(),transition=0,lookYaw=0,lookPitch=0;
  const helper=new THREE.Object3D(),keys=new Set();let drag=null;
  let renderRoom=0,first=true;
  const bodyPositions=droneModels.map(g=>g.position.clone());
  function setView(view){
    const smooth=(active==='bridge'&&view==='pilot')||(active==='pilot'&&view==='bridge');
    active=view;lookYaw=lookPitch=0;
    if(view==='drone'){const d=state.drones[state.controlled];if(!d)return;renderRoom=d.room;targetPosition.set(0,1.6,d.room*18+4);helper.position.copy(targetPosition);helper.lookAt(0,1.4,d.room*18-5);bodyPositions[state.controlled].copy(targetPosition);}
    else {const pose=poses[view]||poses.bridge;renderRoom=pose.room;targetPosition.set(...pose.p);helper.position.copy(targetPosition);helper.lookAt(...pose.t);}
    // Object3D looks along +Z; camera looks along -Z.
    helper.rotateY(Math.PI);targetQuat.copy(helper.quaternion);transition=smooth?1:0;
    for(let i=0;i<rooms.length;i++)rooms[i].visible=i===renderRoom||(Math.abs(i-renderRoom)===1&&state.doors[Math.min(i,renderRoom)]&&renderRoom>=0&&renderRoom<4);doorPanels.forEach(d=>d.boundary.visible=renderRoom===d.index||renderRoom===d.index+1);hull.visible=renderRoom<0;concourse.visible=renderRoom===4;
    if(first||!smooth){camera.position.copy(targetPosition);camera.quaternion.copy(targetQuat);first=false;}
  }
  canvas.addEventListener('pointerdown',e=>{if(!state.inMenu&&!state.inCutscene&&!['port','starboard','front'].includes(active)){drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);canvas.classList.add('dragging');}});
  canvas.addEventListener('pointermove',e=>{if(!drag)return;lookYaw-=(e.clientX-drag.x)*.003;lookPitch=Math.max(-.75,Math.min(.75,lookPitch-(e.clientY-drag.y)*.003));drag={x:e.clientX,y:e.clientY};});
  canvas.addEventListener('pointerup',()=>{drag=null;canvas.classList.remove('dragging');});
  canvas.addEventListener('pointercancel',()=>{drag=null;canvas.classList.remove('dragging');});
  window.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]')||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;keys.add(e.code);});window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();drag=null;});
  function quality(value){const high=value==='high';renderer.setPixelRatio(Math.min(devicePixelRatio,high?1.6:1));bloom.enabled=high;for(const target of [composer.renderTarget1,composer.renderTarget2]){target.samples=high?4:0;target.dispose();}resize();}
  function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);composer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas);resize();setView('bridge');
  let fps=60,frameCount=0,frameTime=0,lastScreenRefresh=-1;
  function update(dt,time){
    if(!state.inCutscene)for(let i=0;i<rooms.length;i++)rooms[i].visible=i===renderRoom||(Math.abs(i-renderRoom)===1&&state.doors[Math.min(i,renderRoom)]&&renderRoom>=0&&renderRoom<4);
    roomLights.forEach(({light,room,base})=>{const r=state.rooms[room];light.intensity=(room===0?35:60)*(state.expedition?.campaign?.lights[room]===false?.06:1);const alert=r.breach||r.vent||r.pressure<65||r.temp>65||(room===0&&state.intruders>0);light.color.setHex(alert?0xff7450:base);});
    if(time-lastScreenRefresh>1){lastScreenRefresh=time;screens.forEach(t=>{const ctx=t.image.getContext('2d'),r=state.rooms[Math.min(3,Math.max(0,renderRoom))];ctx.fillStyle='#07181e';ctx.fillRect(20,362,720,35);ctx.font='13px IBM Plex Mono';ctx.fillStyle=r.breach||r.vent?'#eea477':'#8acfc0';ctx.fillText(`SV-7 / P ${r.pressure.toFixed(0)}% / T ${r.temp.toFixed(0)}C / ${state.intruders?'LIFE SIGN ALERT':'SYSTEM LINK ACTIVE'}`,24,385);t.needsUpdate=true;});}
    const campaign=state.expedition?.campaign;curtain.position.y+=( (campaign?.shadeOpen?6:2.85)-curtain.position.y)*Math.min(1,dt*3);cabinAmbient.intensity=renderRoom===1&&campaign?.lights[1]===false?.25:1.25;
    planetMat.uniforms.time.value=time;planet.rotation.y=time*.0015;
    coreRings.forEach((ring,i)=>{ring.rotation.x=Math.PI/2+Math.sin(time*.5+i)*.12;ring.rotation.z=time*(i%2?.15:-.15);});coreGlow.scale.x=coreGlow.scale.z=1+Math.sin(time*2)*.035;
    doorPanels.forEach(({panels,index})=>panels.forEach(({g,s})=>g.position.x+=(s*(state.doors[index]?2.75:.92)-g.position.x)*Math.min(dt*5,1)));
    if(!state.inMenu&&!state.inCutscene&&(state.walking||active==='drone')&&transition<.01&&!document.querySelector('dialog[open]')){
      let dx=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
      let dz=Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp'));
      const dir=new THREE.Vector3(dx,0,dz).normalize().applyQuaternion(camera.quaternion);dir.y=0;dir.normalize().multiplyScalar(dt*(keys.has('ShiftLeft')?5:2.8));
      const next=targetPosition.clone().add(dir);if(renderRoom===4){next.x=Math.max(-7.5,Math.min(7.5,next.x));next.z=Math.max(-161.8,Math.min(-134.5,next.z));}else{next.x=Math.max(-2.5,Math.min(2.5,next.x));next.z=Math.max(-7.8,Math.min(62,next.z));const room=Math.max(0,Math.min(3,Math.floor((next.z+9)/18)));if(room!==renderRoom){const door=Math.min(room,renderRoom),boundary=9+18*door;if(!state.doors[door]||Math.abs(next.x)>1.5)next.z=boundary+(room>renderRoom?-.4:.4);else{renderRoom=room;state.room=room;if(active==='drone'){state.drones[state.controlled].room=room;}else{active=['bridge','crew','cargo','engine'][room];state.view=active;state.walkThrough=true;}doorPanels.forEach(d=>d.boundary.visible=renderRoom===d.index||renderRoom===d.index+1);}}}
      if(renderRoom===3&&Math.hypot(next.x,next.z-54)<2.3){next.copy(targetPosition);}targetPosition.copy(next);
      if(active==='drone'&&state.controlled>=0)bodyPositions[state.controlled].copy(targetPosition);
    }
    const q=targetQuat.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(lookPitch,lookYaw,0,'YXZ')));
    camera.position.lerp(targetPosition,1-Math.exp(-dt*5));camera.quaternion.slerp(q,1-Math.exp(-dt*6));transition*=Math.exp(-dt*5);
    for(let i=0;i<3;i++){const d=state.drones[i],g=droneModels[i];g.visible=d.room===renderRoom&&d.health>0&&state.controlled!==i;if(state.controlled!==i)g.position.set(Math.sin(time*.25+i)*1.6,1.3+Math.sin(time*2+i)*.08,d.room*18+Math.cos(time*.18+i)*3);g.rotation.y=time*.12+i;}
    aliens.forEach((a,i)=>{a.visible=i<state.intruders;a.rotation.y=Math.sin(time*.2+i)*.4;});
    const exp=state.expedition;
    if(exp){
      const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(exp.pitch,exp.yaw,0,'YXZ')).invert();galaxy.quaternion.copy(q);space.quaternion.copy(q);
      siteObjects.forEach((o,i)=>{const site=sites[i],delta=new THREE.Vector3(...site.position).sub(new THREE.Vector3(...exp.position)).multiplyScalar(120);const factor=Math.min(1,4800/Math.max(1,delta.length()));o.position.copy(delta.multiplyScalar(factor));const celestial=site.kind==='planet'||site.kind==='moon';o.scale.setScalar(celestial?site.radius*120*factor/o.userData.baseRadius:factor);o.visible=celestial||siteDistance(exp,i)<60;});
      state.flightInput={turn:state.seat&&!state.inMenu&&!state.inCutscene&&!document.querySelector('dialog[open]')?Number(keys.has('KeyA'))-Number(keys.has('KeyD')):0,pitch:state.seat&&!state.inMenu&&!state.inCutscene&&!document.querySelector('dialog[open]')?Number(keys.has('KeyR'))-Number(keys.has('KeyF')):0};
      if(concourse.visible){
        if(stationID!==exp.docked){stationID=exp.docked;const old=stationName.material.map;stationName.material.map=textTexture(sites[exp.docked]?.name.toUpperCase()||'STATION','INDEPENDENT CARTOGRAPHERS GUILD');old.dispose();}
        state.atExchange=camera.position.z< -158&&Math.abs(camera.position.x)<4;
        citizens.forEach(({person,legs},i)=>{person.position.set((i%2?1:-1)*(4.5+(i%3)*.6),0,Math.sin(time*.13+i)*11);person.rotation.y=Math.cos(time*.13+i)>0?0:Math.PI;legs[0].rotation.x=Math.sin(time*4+i)*.22;legs[1].rotation.x=-legs[0].rotation.x;});
      }else state.atExchange=false;
    }else station.visible=state.mode==='dock';
    if(exp?.campaign?.mode==='story'&&exp.campaign.step<8){siteObjects.forEach((o,i)=>o.visible=i===6);siteObjects[6].position.set(120,30,-380);siteObjects[6].scale.setScalar(1.3+(400-exp.campaign.altitude)/500);}
    if(cinemaShot&&state.cinema){const p=poses[cinemaShot]||poses.bridge;const t=Math.min(1,state.cinema.elapsed/state.cinema.duration);camera.position.set(p.p[0]+(cinemaShot==='crew'?-.8:0),p.p[1]+.25,p.p[2]-t*1.2);camera.lookAt(...p.t);if(cinemaShot==='crew')camera.lookAt(6.8,2.6,18);}
    frameCount++;frameTime+=dt;if(frameTime>.7){fps=Math.round(frameCount/frameTime);frameCount=0;frameTime=0;}
    renderer.info.autoReset=false;renderer.info.reset();composer.render();
    return {fps,draws:renderer.info.render.calls,triangles:renderer.info.render.triangles,room:renderRoom};
  }
  return {setView,update,quality,resize,renderer,scene,camera,rooms,hull,startCinema(shot){cinemaShot=shot;keys.clear();setView(shot);},endCinema(){cinemaShot=null;keys.clear();},setMove(code,down){down?keys.add(code):keys.delete(code);},dispose(){resizeObserver.disconnect();composer.dispose();renderer.dispose();}};
}
