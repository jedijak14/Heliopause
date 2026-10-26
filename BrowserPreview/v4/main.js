import {createExteriorShades} from './exterior-shades.js';
import {createSystemRenderer} from './system-renderer.js';
import {appendCatalog,scienceRows,scienceHTML,scienceSystems} from './science-catalog.js';
import {createAssetStream} from './asset-stream.js';
import catalogManifest from './catalog-assets.json' with {type:'json'};
import {freshWarp,engageWarp,cancelWarp,stepWarp} from './warp.js';
import {createWarpEffects} from './warp-effects.js';
import {createPremiumRenderer} from './premium-renderer.js';
import {nearestWorld,atmosphericForces,resolveTerrainContact,surfaceOffset,localFlightView,syncSurfaceFlight} from './planetary-flight.js';
import {requestPickup,stepPickup} from './pickup.js';
import {createHabitats} from './habitat.js';
import {placeModel} from './model-library.js';
import {createEntryEffects} from './entry-effects.js';
import {stationGeometry,alienGeometry} from './world-detail.js';
import {features,stepEncounter,surveyRelay} from './encounters.js';
import {createAlienAudio} from './alien-audio.js';
import {createCelestialRenderer} from './celestial-renderer.js';
import {dispatchRepair} from './maintenance.js';
import {integrate,fromEuler,rotate,toBody,attitude} from './flight-dynamics.js';
import {refitShip} from './ship-refit.js';
import {createSurfaceRenderer} from './surface-renderer.js';
import {KEPLER,profile,surfaceState,sampleTerrain,walkSurface,coordinates,arcDistance,colors,norm,basis,dot,moveOnGlobe} from './terrain.js';
import {pilotCommand} from './flight-controls.js';
import {freshVoyage,launchVoyage,stepVoyage,command,saveVoyage,loadVoyage,sites,distance,speed,objectives} from './voyage.js';
import {stepExpedition,selectTarget,pendingCredits} from '../src/exploration.js';
import {createVoicePlayer} from './voice-player.js';
import oldDialogue from '../../Shared/story.json' with {type:'json'};
import extraDialogue from '../../Shared/commander.json' with {type:'json'};
import breathURL from '../../Content/Audio/breathing_foley.wav';
const recordings=import.meta.glob('../assets/story/*.mp3',{eager:true,query:'?url',import:'default'});
"use strict";
const $=id=>document.getElementById(id);
const errEl=$("err");
function fail(m){errEl.style.display="block";errEl.textContent=m;throw new Error(m);}
window.addEventListener("error",e=>{errEl.style.display="block";errEl.textContent="Error: "+e.message+" (line "+e.lineno+")";});

/* ============================ MATH ============================ */
const PI=Math.PI,clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>t<0?0:t>1?1:t*t*(3-2*t);
function nrm(v){const l=Math.hypot(v[0],v[1],v[2])||1;return[v[0]/l,v[1]/l,v[2]/l];}
function vlerp(a,b,t){return[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];}
const M={
 id(){const o=new Float32Array(16);o[0]=o[5]=o[10]=o[15]=1;return o;},
 mul(a,b){const o=new Float32Array(16);for(let i=0;i<4;i++)for(let j=0;j<4;j++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+j]*b[i*4+k];o[i*4+j]=s;}return o;},
 T(x,y,z){const o=M.id();o[12]=x;o[13]=y;o[14]=z;return o;},
 S(x,y,z){const o=M.id();o[0]=x;o[5]=y;o[10]=z;return o;},
 persp(f,a,n,fr){const t=1/Math.tan(f/2),o=new Float32Array(16);o[0]=t/a;o[5]=t;o[10]=(fr+n)/(n-fr);o[11]=-1;o[14]=2*fr*n/(n-fr);return o;},
 look(e,c,u){let z=nrm([e[0]-c[0],e[1]-c[1],e[2]-c[2]]);
  let x=nrm([u[1]*z[2]-u[2]*z[1],u[2]*z[0]-u[0]*z[2],u[0]*z[1]-u[1]*z[0]]);
  const y=[z[1]*x[2]-z[2]*x[1],z[2]*x[0]-z[0]*x[2],z[0]*x[1]-z[1]*x[0]];
  const o=new Float32Array(16);
  o[0]=x[0];o[4]=x[1];o[8]=x[2];o[1]=y[0];o[5]=y[1];o[9]=y[2];o[2]=z[0];o[6]=z[1];o[10]=z[2];
  o[12]=-(x[0]*e[0]+x[1]*e[1]+x[2]*e[2]);o[13]=-(y[0]*e[0]+y[1]*e[1]+y[2]*e[2]);o[14]=-(z[0]*e[0]+z[1]*e[1]+z[2]*e[2]);o[15]=1;return o;},
 inv(a){const o=new Float32Array(16);
  const b00=a[0]*a[5]-a[1]*a[4],b01=a[0]*a[6]-a[2]*a[4],b02=a[0]*a[7]-a[3]*a[4],b03=a[1]*a[6]-a[2]*a[5],b04=a[1]*a[7]-a[3]*a[5],b05=a[2]*a[7]-a[3]*a[6],
  b06=a[8]*a[13]-a[9]*a[12],b07=a[8]*a[14]-a[10]*a[12],b08=a[8]*a[15]-a[11]*a[12],b09=a[9]*a[14]-a[10]*a[13],b10=a[9]*a[15]-a[11]*a[13],b11=a[10]*a[15]-a[11]*a[14];
  let d=b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06;if(!d)return M.id();d=1/d;
  o[0]=(a[5]*b11-a[6]*b10+a[7]*b09)*d;o[1]=(a[2]*b10-a[1]*b11-a[3]*b09)*d;o[2]=(a[13]*b05-a[14]*b04+a[15]*b03)*d;o[3]=(a[10]*b04-a[9]*b05-a[11]*b03)*d;
  o[4]=(a[6]*b08-a[4]*b11-a[7]*b07)*d;o[5]=(a[0]*b11-a[2]*b08+a[3]*b07)*d;o[6]=(a[14]*b02-a[12]*b05-a[15]*b01)*d;o[7]=(a[8]*b05-a[10]*b02+a[11]*b01)*d;
  o[8]=(a[4]*b10-a[5]*b08+a[7]*b06)*d;o[9]=(a[1]*b08-a[0]*b10-a[3]*b06)*d;o[10]=(a[12]*b04-a[13]*b02+a[15]*b00)*d;o[11]=(a[9]*b02-a[8]*b04-a[11]*b00)*d;
  o[12]=(a[5]*b07-a[4]*b09-a[6]*b06)*d;o[13]=(a[0]*b09-a[1]*b07+a[2]*b06)*d;o[14]=(a[13]*b01-a[12]*b03-a[14]*b00)*d;o[15]=(a[8]*b03-a[9]*b01+a[10]*b00)*d;return o;}
};

/* ============================ GL ============================ */
const canvas=$("gl");
const gl=canvas.getContext("webgl2",{antialias:true,alpha:false,depth:true,powerPreference:"high-performance"});
if(!gl)fail("WebGL2 is not available. Use a desktop Chrome/Edge/Firefox with hardware acceleration on.");
function cs(t,s,n){const h=gl.createShader(t);gl.shaderSource(h,s);gl.compileShader(h);if(!gl.getShaderParameter(h,gl.COMPILE_STATUS))fail("Shader "+n+":\n"+gl.getShaderInfoLog(h));return h;}
function prog(v,f,n){const p=gl.createProgram();gl.attachShader(p,cs(gl.VERTEX_SHADER,v,n));gl.attachShader(p,cs(gl.FRAGMENT_SHADER,f,n));gl.linkProgram(p);
 if(!gl.getProgramParameter(p,gl.LINK_STATUS))fail("Link "+n+":\n"+gl.getProgramInfoLog(p));return{p,c:{}};}
function U(P,n){let l=P.c[n];if(l===undefined){l=gl.getUniformLocation(P.p,n);P.c[n]=l;}return l;}

const QVS=`#version 300 es
layout(location=0) in vec2 a; out vec2 vUv;
void main(){vUv=a*.5+.5;gl_Position=vec4(a,1.,1.);}`;

const SKY_FS=`#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform vec3 uTint; uniform float uStyle; uniform int uBodyCount; uniform vec4 uBodies[6]; uniform vec3 uTints[6];
uniform mat4 uInvVP; uniform vec3 uCam,uSun,uPC; uniform float uPR,uAR,uTime;
float h31(vec3 p){p=fract(p*.3183099+vec3(.11,.17,.13));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float n3(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
 return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x),mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),
 mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p,int oc){float a=.5,s=0.;for(int i=0;i<8;i++){if(i>=oc)break;s+=a*n3(p);p=p*2.03+vec3(1.7,9.2,3.1);a*=.5;}return s;}
vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
vec3 stars(vec3 rd){vec3 c=vec3(0.);
 for(int l=0;l<3;l++){float sc=150.+float(l)*330.;vec3 p=rd*sc;vec3 i=floor(p);vec3 f=fract(p)-.5;float r=h31(i+float(l)*31.7);
  if(r>.972){vec3 of=vec3(h31(i+1.3),h31(i+2.7),h31(i+3.9))-.5;float d=length(f-of*.6);
   c+=pow(max(0.,1.-d*(10.+r*20.)),8.)*(.7+.3*sin(uTime*(1.+r*5.)+r*70.))*mix(vec3(.62,.75,1.),vec3(1.,.84,.62),h31(i+7.1))*(.8+r*1.6);}}
 float band=exp(-pow(abs(dot(rd,normalize(vec3(.35,.5,-.8))))*2.4,2.));
 return c+band*.03*vec3(.45,.48,.75)*(.5+fbm(rd*9.,4));}
void main(){
 vec4 w=uInvVP*vec4(vUv*2.-1.,1.,1.); vec3 rd=normalize(w.xyz/w.w-uCam);
 vec3 col=stars(rd);
 vec3 blue=vec3(.22,.5,1.),org=vec3(1.,.48,.18);
 vec3 oc=uCam-uPC; float b=dot(oc,rd); float c=dot(oc,oc)-uPR*uPR; float d=b*b-c;
 float nearest=1e30; bool hit=false;
 if(d>0.){float t=-b-sqrt(d);
  if(t>0.){hit=true;nearest=t;
   vec3 P=uCam+rd*t; vec3 N=normalize(P-uPC); vec3 q=N*2.6;
   float cont=fbm(q+vec3(13.2,4.7,9.1),7)*.82+fbm(q*.7+31.,4)*.3;
   float land=smoothstep(.5,.57,cont); float det=fbm(N*60.,4); float lat=abs(N.y);
   vec3 sea=mix(vec3(.01,.04,.12),vec3(.02,.12,.22),smoothstep(.34,.52,cont));
   sea=mix(sea,vec3(.05,.22,.3),smoothstep(.46,.5,cont));
   vec3 gnd=mix(vec3(.08,.15,.06),vec3(.36,.28,.16),fbm(q*3.+20.,4))*(.8+.4*det);
   gnd=mix(gnd,vec3(.88,.91,.95),smoothstep(.82,.93,lat));
   vec3 base=mix(sea,gnd,land)*uTint;if(uStyle>1.5)base=mix(vec3(.3,.15,.07),vec3(.8,.62,.36),.5+.5*sin(N.y*70.+fbm(N*8.,4)*3.));else if(uStyle>.5)base=mix(vec3(.06,.025,.018),vec3(.9,.16,.015),smoothstep(.5,.7,fbm(N*15.,5)));
   float ndl=dot(N,uSun),day=smoothstep(-.08,.3,ndl);
   vec3 H=normalize(uSun-rd); float spec=pow(max(dot(N,H),0.),120.)*(1.-land)*day;
   float cc=fbm(q*24.,5);
   float city=smoothstep(.6,.74,cc)*land*smoothstep(.12,-.15,ndl)*(1.-smoothstep(.6,.9,lat));
   vec3 cq=N*3.2+vec3(uTime*.003,0.,uTime*.0015);
   float cl=fbm(cq,7); float cloud=smoothstep(.5,.78,cl*.75+fbm(cq*2.5,4)*.33);
   vec3 lit=base*(.02+day*1.4)+spec*vec3(1.,.9,.75)*1.5+vec3(1.,.7,.35)*city*1.7*(1.-cloud*.8);
   lit=mix(lit,vec3(1.)*(.015+day*1.5),cloud*.9);
   float rim=pow(1.-max(dot(N,-rd),0.),2.5);
   lit+=mix(blue,org,exp(-pow(ndl*3.,2.))*.8)*rim*smoothstep(-.3,.4,ndl)*.9;
   col=lit;}}
 float tc=-b;
 if(tc>0.){vec3 cp=uCam+rd*tc; float dc=length(cp-uPC);
  if(dc<uAR){float h=clamp((dc-uPR)/(uAR-uPR),0.,1.); vec3 Nc=normalize(cp-uPC); float s=dot(Nc,uSun);
   float g=pow(1.-h,3.)*smoothstep(-.35,.35,s)*(hit?.3:1.);
   vec3 ac=mix(blue,org,exp(-pow(s*3.,2.))*.8);
   col=col*(1.-g*.7)+ac*g*1.6;}}
 float camH=(length(oc)-uPR)/(uAR-uPR);
 if(camH<1.){col+=blue*pow(1.-camH,2.)*.35*smoothstep(.2,-.4,rd.y)*(hit?0.:1.);}
 for(int i=0;i<6;i++){if(i>=uBodyCount)break;vec3 v=uCam-uBodies[i].xyz;float b2=dot(v,rd),d2=b2*b2-dot(v,v)+uBodies[i].w*uBodies[i].w;if(d2>0.){float t=-b2-sqrt(d2);if(t>0.&&t<nearest){nearest=t;hit=true;vec3 N=normalize(uCam+rd*t-uBodies[i].xyz);float detail=fbm(N*5.+float(i)*11.,5);float day=smoothstep(-.1,.5,dot(N,uSun));col=uTints[i]*(.16+.55*detail)*(.08+day)+vec3(.15,.3,.45)*pow(1.-max(0.,dot(N,-rd)),3.);}}}
 if(!hit){float sd=max(dot(rd,uSun),0.);col+=vec3(1.,.95,.85)*(pow(sd,2000.)*40.+pow(sd,90.)*.35);}
 col=aces(col);
 o=vec4(pow(col,vec3(.4545)),1.);
}`;

const PBR_VS=`#version 300 es
precision highp float;
layout(location=0) in vec3 aP; layout(location=1) in vec3 aN; layout(location=2) in vec2 aU; layout(location=3) in float aA;
uniform mat4 uVP,uModel;
out vec3 vW; out vec3 vN; out vec2 vUv; out float vAo;
void main(){vec4 w=uModel*vec4(aP,1.);vW=w.xyz;vN=mat3(uModel)*aN;vUv=aU;vAo=aA;gl_Position=uVP*w;}`;

const PBR_FS=`#version 300 es
precision highp float;
in vec3 vW; in vec3 vN; in vec2 vUv; in float vAo; out vec4 o;
uniform vec3 uCam; uniform float uTime;
uniform float uOpacity; uniform int uMat; uniform vec3 uAlb; uniform float uMet,uRgh; uniform vec3 uEm; uniform float uUvS; uniform vec4 uAux;
uniform sampler2D uMap;
uniform vec3 uSunDir,uSunCol; uniform float uSunK; uniform vec3 uAmb;
uniform int uNL; uniform vec3 uLP[6]; uniform vec3 uLC[6]; uniform float uLR[6];
uniform vec4 uFl; uniform vec3 uFlP,uFlD; uniform float uExp;
#define PI 3.14159265
float h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n2(vec2 x){vec2 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
float fbm2(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*n2(p);p=p*2.07+3.1;a*=.5;}return s;}
vec2 panel(vec2 uv,float c){vec2 g=uv/c,id=floor(g),f=fract(g),d=min(f,1.-f);
 float seam=1.-smoothstep(.004,.02,min(d.x,d.y));
 vec2 bp=abs(f-.5)-.44; float br=length(max(bp,vec2(0.)));
 float bolt=(1.-smoothstep(0.,.013,br))*step(0.,min(bp.x,bp.y)+.02);
 return vec2(seam*(.6+h21(id)*.5),bolt);}
float D_G(float NoH,float a){float a2=a*a,d=NoH*NoH*(a2-1.)+1.;return a2/(PI*d*d+1e-7);}
float V_S(float NoV,float NoL,float a){float a2=a*a;return .5/max(NoL*sqrt(NoV*NoV*(1.-a2)+a2)+NoV*sqrt(NoL*NoL*(1.-a2)+a2),1e-6);}
vec3 brdf(vec3 N,vec3 V,vec3 L,vec3 rad,vec3 alb,float met,float rg){
 float NoL=max(dot(N,L),0.); if(NoL<=0.)return vec3(0.);
 vec3 H=normalize(V+L); float NoV=max(dot(N,V),1e-4),NoH=max(dot(N,H),0.),VoH=max(dot(V,H),0.);
 float a=max(rg*rg,.002); vec3 F0=mix(vec3(.04),alb,met); vec3 F=F0+(1.-F0)*pow(1.-VoH,5.);
 return ((1.-F)*(1.-met)*alb/PI+F*D_G(NoH,a)*V_S(NoV,NoL,a))*rad*NoL;}
vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
void main(){
 vec3 N=normalize(vN),V=normalize(uCam-vW); if(dot(N,V)<0.)N=-N;
 vec2 uv=vUv*uUvS; vec3 alb=uAlb; float met=uMet,rg=uRgh; vec3 em=uEm; float cav=1.;
 if(uMat==9){float f=.04+.96*pow(1.-abs(dot(N,V)),5.);float sm=fbm2(vW.xy*2.2)*.5+fbm2(vW.xy*17.)*.2;
  vec3 c=vec3(.03,.05,.08)*(.25+sm)*(.2+f*4.5)+uAmb*f*1.5;o=vec4(pow(aces(c*uExp),vec3(.4545)),1.);return;}
 if(uMat==0){vec2 pf=panel(uv,1.);float g=fbm2(uv*3.1);alb*=(.85+.28*g)*(1.-pf.x*.45);alb=mix(alb,alb*1.6,pf.y*.6);
  rg=clamp(rg+g*.16-pf.y*.2,.05,1.);cav=1.-pf.x*.55;}
 else if(uMat==1){float b=fbm2(vec2(uv.x*160.,uv.y*4.));rg=clamp(rg+(b-.5)*.16,.04,1.);alb*=.9+.2*b;}
 else if(uMat==2){vec2 g=fract(uv*7.);float gr=clamp(smoothstep(.42,.46,abs(g.x-.5))+smoothstep(.42,.46,abs(g.y-.5)),0.,1.);
  float di=step(.7,fract((uv.x+uv.y)*5.))*step(.7,fract((uv.x-uv.y)*5.));float w=fbm2(uv*2.4);
  alb*=(.75+di*.35-gr*.35)*(.8+.4*w);rg=clamp(.6+gr*.25-w*.15-di*.2,.12,1.);met=clamp(met+di*.3,0.,1.);cav=1.-gr*.4;}
 else if(uMat==3){vec3 t=texture(uMap,vUv).rgb;em=t*(.86+.14*sin(vUv.y*900.))*1.7;alb=vec3(.01);met=0.;rg=.08;}
 else if(uMat==4){vec4 t=texture(uMap,vUv);float a=t.a*(1.-smoothstep(.55,.88,fbm2(vUv*9.))*.4);
  alb=mix(uAlb*(.88+.24*fbm2(uv*3.)),t.rgb,a);rg=mix(rg,.7,a);met=mix(met,0.,a);em=uEm*t.a;}
 else if(uMat==5){float g=fbm2(uv*34.);float q=max(smoothstep(.45,.5,abs(fract(uv.x*3.)-.5)),smoothstep(.45,.5,abs(fract(uv.y*3.)-.5)));
  alb*=(.8+.3*g)*(1.-q*.3);rg=clamp(.78-g*.15,.3,1.);met=0.;cav=1.-q*.3;}
 else if(uMat==7){float b=fbm2(uv*48.);alb*=.82+.3*b;rg=clamp(.8-b*.12,.3,1.);met=0.;}
 else if(uMat==8){rg=.25;met=0.;}
 else if(uMat==10){vec2 c=vUv-.5;float ring=smoothstep(.42,.39,length(c))-smoothstep(.37,.34,length(c));
  float palm=smoothstep(.17,.15,length(vec2(c.x,c.y+.06)*vec2(1.,1.15)));
  float fing=0.;for(int i=0;i<4;i++){float fx=-.12+float(i)*.08;fing=max(fing,smoothstep(.035,.025,abs(c.x-fx))*step(.04,c.y)*step(c.y,.28-abs(fx)*.5));}
  float thumb=smoothstep(.035,.025,length(vec2(c.x+.19,c.y+.02)*vec2(1.,.6)));
  float hand=max(max(palm,fing),thumb);
  float scan=exp(-pow((vUv.y-uAux.x)*16.,2.))*uAux.y;
  vec3 base=mix(vec3(.25,.6,1.),vec3(.3,1.,.55),uAux.z);
  em=base*(ring*1.2+hand*.55*(.5+uAux.w*.6))+base*scan*3.;alb=vec3(.015);met=0.;rg=.15;}
 else if(uMat==11){vec2 pf=panel(uv,1.5);float st=fbm2(vec2(uv.x*6.,uv.y*.5));
  alb*=(.8+.28*st)*(1.-pf.x*.5);alb=mix(alb,alb*1.4,pf.y*.5);rg=clamp(rg+st*.2-pf.y*.2,.1,1.);cav=1.-pf.x*.5;}
 else if(uMat==12){float weave=sin(uv.x*300.)*sin(uv.y*300.);alb*=.96+.025*weave;rg=.82;met=0.;}
 else if(uMat==13){N=normalize(N+vec3(sin(vW.z*8.+uTime*1.3)*.09,0.,cos(vW.x*9.-uTime)*.09));rg=.09;met=.3;em+=vec3(.01,.07,.09)*(1.+.4*sin(vW.x*5.+uTime));}
 else if(uMat==15){float cell=h21(floor(vW.xz*24.)+floor(vW.y*24.));float front=uAux.z>.5?clamp((vW.z+10.)/38.,0.,1.):fract(vW.y*.45);float threshold=front*.85+cell*.15;if(threshold>uAux.y)discard;float seam=max(step(.93,fract(vW.x*24.)),step(.93,fract(vW.z*24.)));alb*=1.-seam*.35;em+=vec3(.05,.32,.42)*(1.-smoothstep(0.,.035,uAux.y-threshold))*.5;rg=.21;met=.95;}
 else if(uMat==14){float grain=fbm2(vec2(vW.x*15.,vW.z*.7));alb*=.78+.4*grain;rg=.58;met=0.;}
 float ao=vAo*cav;
 vec3 col=brdf(N,V,uSunDir,uSunCol,alb,met,rg)*uSunK;
 for(int i=0;i<6;i++){if(i>=uNL)break;vec3 d=uLP[i]-vW;float d2=max(dot(d,d),.004),dist=sqrt(d2);
  float win=clamp(1.-pow(dist/uLR[i],4.),0.,1.);win*=win;col+=brdf(N,V,d/dist,uLC[i]*win/d2,alb,met,rg)*mix(.5,1.,ao);}
 if(uFl.x>.01){vec3 d=uFlP-vW;float dist=length(d)+1e-4;vec3 L=d/dist;float ca=dot(-L,uFlD);
  float cone=smoothstep(uFl.y,uFl.y+.06,ca)*(.75+.25*smoothstep(uFl.y+.1,1.,ca));
  float att=clamp(1.-dist/uFl.z,0.,1.);
  col+=brdf(N,V,L,vec3(1.,.96,.88)*uFl.x*cone*att*att*9./max(dist*dist,.25),alb,met,rg);}
 col+=alb*uAmb*ao*(1.-met*.6);
 vec3 R=reflect(-V,N);float env=.5+.5*R.y;vec3 F0=mix(vec3(.04),alb,met);
 col+=mix(uAmb*.5,uAmb*2.4,env)*F0*(1.-rg*.8)*ao;
 col+=pow(1.-max(dot(N,V),0.),5.)*uAmb*1.2*(1.-rg*.7)*ao;
 col+=em;
 col=aces(col*uExp);
 o=vec4(pow(col,vec3(.4545)),uOpacity);
}`;

const pSky=prog(QVS,SKY_FS,"sky"),pPBR=prog(PBR_VS,PBR_FS,"pbr");
const quad=gl.createVertexArray();gl.bindVertexArray(quad);
{const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);}
gl.bindVertexArray(null);

/* ============================ GEOMETRY ============================ */
class B{
 constructor(){this.p=[];this.n=[];this.u=[];this.a=[];this.i=[];}
 v(p,n,u,v,a){this.p.push(p[0],p[1],p[2]);this.n.push(n[0],n[1],n[2]);this.u.push(u,v);this.a.push(a);}
 q(A,Bv,C,D,n,uv,a){const b=this.p.length/3;this.v(A,n,uv[0],uv[1],a);this.v(Bv,n,uv[2],uv[3],a);this.v(C,n,uv[4],uv[5],a);this.v(D,n,uv[6],uv[7],a);this.i.push(b,b+1,b+2,b,b+2,b+3);}
 box(c,s,us,ao){us=us===undefined?1:us;ao=ao===undefined?1:ao;const[x,y,z]=c,[hx,hy,hz]=s;const UV=(w,h)=>[0,0,w*us,0,w*us,h*us,0,h*us];
  this.q([x-hx,y-hy,z+hz],[x+hx,y-hy,z+hz],[x+hx,y+hy,z+hz],[x-hx,y+hy,z+hz],[0,0,1],UV(2*hx,2*hy),ao);
  this.q([x+hx,y-hy,z-hz],[x-hx,y-hy,z-hz],[x-hx,y+hy,z-hz],[x+hx,y+hy,z-hz],[0,0,-1],UV(2*hx,2*hy),ao);
  this.q([x+hx,y-hy,z+hz],[x+hx,y-hy,z-hz],[x+hx,y+hy,z-hz],[x+hx,y+hy,z+hz],[1,0,0],UV(2*hz,2*hy),ao);
  this.q([x-hx,y-hy,z-hz],[x-hx,y-hy,z+hz],[x-hx,y+hy,z+hz],[x-hx,y+hy,z-hz],[-1,0,0],UV(2*hz,2*hy),ao);
  this.q([x-hx,y+hy,z+hz],[x+hx,y+hy,z+hz],[x+hx,y+hy,z-hz],[x-hx,y+hy,z-hz],[0,1,0],UV(2*hx,2*hz),ao);
  this.q([x-hx,y-hy,z-hz],[x+hx,y-hy,z-hz],[x+hx,y-hy,z+hz],[x-hx,y-hy,z+hz],[0,-1,0],UV(2*hx,2*hz),ao);}
 cyl(c,r,h,seg,ax,ao){ao=ao===undefined?1:ao;const b=this.p.length/3;
  for(let k=0;k<=seg;k++){const t=k/seg*PI*2,ct=Math.cos(t),st=Math.sin(t);let p0,p1,n;
   if(ax==="y"){n=[ct,0,st];p0=[c[0]+ct*r,c[1],c[2]+st*r];p1=[c[0]+ct*r,c[1]+h,c[2]+st*r];}
   else if(ax==="z"){n=[ct,st,0];p0=[c[0]+ct*r,c[1]+st*r,c[2]];p1=[c[0]+ct*r,c[1]+st*r,c[2]+h];}
   else{n=[0,ct,st];p0=[c[0],c[1]+ct*r,c[2]+st*r];p1=[c[0]+h,c[1]+ct*r,c[2]+st*r];}
   this.v(p0,n,k/seg*2,0,ao);this.v(p1,n,k/seg*2,1,ao);}
  for(let k=0;k<seg;k++){const j=b+k*2;this.i.push(j,j+1,j+3,j,j+3,j+2);}}
 plane(o,u,w,ao){ao=ao===undefined?1:ao;const Bv=[o[0]+u[0],o[1]+u[1],o[2]+u[2]],C=[o[0]+u[0]+w[0],o[1]+u[1]+w[1],o[2]+u[2]+w[2]],D=[o[0]+w[0],o[1]+w[1],o[2]+w[2]];
  const n=nrm([u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]]);this.q(o,Bv,C,D,n,[0,1,1,1,1,0,0,0],ao);}
 build(){const vao=gl.createVertexArray();gl.bindVertexArray(vao);const n=this.p.length/3,d=new Float32Array(n*9);
  for(let k=0;k<n;k++){d[k*9]=this.p[k*3];d[k*9+1]=this.p[k*3+1];d[k*9+2]=this.p[k*3+2];d[k*9+3]=this.n[k*3];d[k*9+4]=this.n[k*3+1];d[k*9+5]=this.n[k*3+2];d[k*9+6]=this.u[k*2];d[k*9+7]=this.u[k*2+1];d[k*9+8]=this.a[k];}
  const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,d,gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,36,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,36,12);
  gl.enableVertexAttribArray(2);gl.vertexAttribPointer(2,2,gl.FLOAT,false,36,24);gl.enableVertexAttribArray(3);gl.vertexAttribPointer(3,1,gl.FLOAT,false,36,32);
  const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint32Array(this.i),gl.STATIC_DRAW);
  gl.bindVertexArray(null);return{vao,vb,ib,count:this.i.length};}
}

/* ============================ TEXTURES ============================ */
function tex(w,h){const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t;}
function upload(t,cv){gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,cv);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);}
function cvs(w,h){const c=document.createElement("canvas");c.width=w;c.height=h;return c;}
const white=tex(1,1);gl.bindTexture(gl.TEXTURE_2D,white);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));
function label(text,w,h,size,color){const c=cvs(w,h),x=c.getContext("2d");x.font=`700 ${size}px Bahnschrift,"DIN Alternate",Arial,sans-serif`;
 x.textAlign="center";x.textBaseline="middle";x.fillStyle=color;x.fillText(text,w/2,h/2);
 x.globalCompositeOperation="destination-out";x.fillRect(0,h/2-size*.04,w,size*.07);const t=tex(w,h);upload(t,c);return t;}
function scr(w,h){const c=cvs(w,h);return{cv:c,x:c.getContext("2d"),t:tex(w,h),w,h};}
const S1=scr(512,300),S2=scr(512,300),S3=scr(512,300);
function chrome(s,title,acc){const x=s.x;x.fillStyle="#03090f";x.fillRect(0,0,s.w,s.h);x.strokeStyle=acc;x.globalAlpha=.5;x.lineWidth=2;x.strokeRect(6,6,s.w-12,s.h-12);x.globalAlpha=1;
 x.fillStyle=acc;x.font="bold 16px Consolas,monospace";x.textAlign="left";x.textBaseline="alphabetic";x.fillText(title,16,30);x.fillRect(16,38,s.w-32,1.5);}

/* ============================ AUDIO ============================ */
const A={ctx:null,musicVol:.35,breath:false,muted:false};
function noiseBuf(sec){const c=A.ctx,b=c.createBuffer(1,c.sampleRate*sec,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;return b;}
function impulse(sec){const c=A.ctx,len=Math.floor(c.sampleRate*sec),b=c.createBuffer(2,len,c.sampleRate);
 for(let ch=0;ch<2;ch++){const d=b.getChannelData(ch);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.8);}return b;}
function audioInit(){
 if(A.ctx){if(A.ctx.state==="suspended")A.ctx.resume();return;}
 const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
 const c=new AC();A.ctx=c;
 A.master=c.createGain();A.master.gain.value=.9;A.master.connect(c.destination);
 A.rev=c.createConvolver();A.rev.buffer=impulse(3.4);const rg=c.createGain();rg.gain.value=.5;A.rev.connect(rg);rg.connect(A.master);
 A.music=c.createGain();A.music.gain.value=A.musicVol;A.music.connect(A.master);A.music.connect(A.rev);
 A.sfx=c.createGain();A.sfx.gain.value=.85;A.sfx.connect(A.master);
 A.sfxRev=c.createGain();A.sfxRev.gain.value=.22;A.sfx.connect(A.sfxRev);A.sfxRev.connect(A.rev);
 A.amb=c.createGain();A.amb.gain.value=0;A.amb.connect(A.master);
 A.noise=noiseBuf(2);
 const hn=c.createBufferSource();hn.buffer=A.noise;hn.loop=true;const hl=c.createBiquadFilter();hl.type="lowpass";hl.frequency.value=130;const hg=c.createGain();hg.gain.value=.55;
 hn.connect(hl);hl.connect(hg);hg.connect(A.amb);hn.start();
 const ho=c.createOscillator();ho.frequency.value=57;const hog=c.createGain();hog.gain.value=.05;ho.connect(hog);hog.connect(A.amb);ho.start();
 A.mFilter=c.createBiquadFilter();A.mFilter.type="lowpass";A.mFilter.frequency.value=1100;A.mFilter.Q.value=.6;A.mFilter.connect(A.music);
 const lfo=c.createOscillator();lfo.frequency.value=.05;const lg=c.createGain();lg.gain.value=500;lfo.connect(lg);lg.connect(A.mFilter.frequency);lfo.start();
 const sub=c.createOscillator();sub.frequency.value=55;const sg=c.createGain();sg.gain.value=.05;sub.connect(sg);sg.connect(A.mFilter);sub.start();
 musicStep();bellStep();breathStep();
}
const CHORDS=[[110,164.81,220,261.63,329.63],[98,146.83,196,246.94,293.66],[87.31,130.81,174.61,220,261.63],[103.83,155.56,207.65,261.63,311.13]];
let chordI=0;
function musicStep(){const c=A.ctx,t=c.currentTime,ch=CHORDS[chordI++%CHORDS.length];
 ch.forEach((f,k)=>{[0,7].forEach(det=>{const o=c.createOscillator();o.type=k===0?"sine":"triangle";o.frequency.value=f;o.detune.value=det-3;
  const g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(k===0?.07:.028,t+3.5);g.gain.setValueAtTime(k===0?.07:.028,t+7);g.gain.linearRampToValueAtTime(0,t+11);
  o.connect(g);g.connect(A.mFilter);o.start(t);o.stop(t+11.2);});});
 setTimeout(musicStep,9000);}
const PENTA=[440,493.88,554.37,659.25,739.99,880,987.77];
function bellStep(){const c=A.ctx,t=c.currentTime;if(Math.random()<.6){const f=PENTA[Math.floor(Math.random()*PENTA.length)];
  [1,2.76].forEach((m,i)=>{const o=c.createOscillator();o.type="sine";o.frequency.value=f*m;const g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(i?.006:.022,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+4);o.connect(g);g.connect(A.music);o.start(t);o.stop(t+4.1);});}
 setTimeout(bellStep,2300+Math.random()*2500);}
function noiseShot(t,dur,type,f0,f1,q,peak,dest){const c=A.ctx,s=c.createBufferSource();s.buffer=A.noise;const f=c.createBiquadFilter();f.type=type;f.Q.value=q;
 f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(f1,t+dur);const g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+dur*.25);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
 s.connect(f);f.connect(g);g.connect(dest||A.sfx);s.start(t,Math.random());s.stop(t+dur+.05);}
function breathStep(){} // Optional saved foley is controlled by updateExtras.
const SFX={
 whoosh(){if(!A.ctx)return;const t=A.ctx.currentTime;noiseShot(t,.9,"bandpass",300,2200,1.2,.35);noiseShot(t+.05,.5,"lowpass",900,120,.7,.25);
  const o=A.ctx.createOscillator();o.frequency.setValueAtTime(90,t);o.frequency.exponentialRampToValueAtTime(40,t+.6);const g=A.ctx.createGain();g.gain.setValueAtTime(.18,t);g.gain.exponentialRampToValueAtTime(.0001,t+.7);o.connect(g);g.connect(A.sfx);o.start(t);o.stop(t+.75);},
 clunk(){if(!A.ctx)return;const t=A.ctx.currentTime;noiseShot(t,.12,"lowpass",900,150,.8,.35);const o=A.ctx.createOscillator();o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(55,t+.2);
  const g=A.ctx.createGain();g.gain.setValueAtTime(.2,t);g.gain.exponentialRampToValueAtTime(.0001,t+.3);o.connect(g);g.connect(A.sfx);o.start(t);o.stop(t+.35);},
 scan(){if(!A.ctx)return;const c=A.ctx,t=c.currentTime;const o=c.createOscillator();o.type="sine";o.frequency.setValueAtTime(500,t);o.frequency.linearRampToValueAtTime(1300,t+1.2);
  const g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.045,t+.1);g.gain.setValueAtTime(.045,t+1.1);g.gain.linearRampToValueAtTime(0,t+1.25);o.connect(g);g.connect(A.sfx);o.start(t);o.stop(t+1.3);},
 grant(){if(!A.ctx)return;const c=A.ctx,t=c.currentTime;[[880,0],[1318.5,.12]].forEach(([f,d])=>{const o=c.createOscillator();o.frequency.value=f;const g=c.createGain();g.gain.setValueAtTime(0,t+d);g.gain.linearRampToValueAtTime(.07,t+d+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d+1.2);o.connect(g);g.connect(A.sfx);o.start(t+d);o.stop(t+d+1.3);});},
 tap(){if(!A.ctx)return;const t=A.ctx.currentTime;noiseShot(t,.035,"highpass",3000,5000,.7,.08);},
 step(){if(!A.ctx)return;const t=A.ctx.currentTime;noiseShot(t,.11,"lowpass",420,90,.9,.13);},
 motor(){if(!A.ctx)return;const c=A.ctx,t=c.currentTime;const o=c.createOscillator();o.type="sawtooth";o.frequency.setValueAtTime(70,t);o.frequency.linearRampToValueAtTime(95,t+1.4);
  const f=c.createBiquadFilter();f.type="lowpass";f.frequency.value=400;const g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05,t+.2);g.gain.setValueAtTime(.05,t+1.2);g.gain.linearRampToValueAtTime(0,t+1.6);
  o.connect(f);f.connect(g);g.connect(A.sfx);o.start(t);o.stop(t+1.7);},
 alarm(){if(!A.ctx)return;const c=A.ctx,t=c.currentTime;[0,.35].forEach(d=>{const o=c.createOscillator();o.type="triangle";o.frequency.setValueAtTime(660,t+d);o.frequency.linearRampToValueAtTime(520,t+d+.3);const g=c.createGain();g.gain.setValueAtTime(.05,t+d);g.gain.exponentialRampToValueAtTime(.0001,t+d+.32);o.connect(g);g.connect(A.sfx);o.start(t+d);o.stop(t+d+.33);});}
};

/* ============================ VOICE ============================ */
const LINES={
 hale_1:{who:"CMDR. ROWAN HALE",text:"Two hundred and eleven days out. Still the most beautiful thing I've ever seen."},
 eva_intro_1:{who:"EVA",text:"Good morning, Commander. We have arrived in high orbit over Kepler-442b."},
 eva_intro_2:{who:"EVA",text:"All systems nominal. Your tablet is on your belt. Press T whenever you need me."},
 eva_obj_lights:{who:"EVA",text:"Tablet linked. Your quarters are dark. You can switch the lights from the LIGHTS page."},
 eva_obj_room:{who:"EVA",text:"Lights on. Private rooms need your handprint. Scan in at each door."},
 eva_obj_window:{who:"EVA",text:"Welcome home. Open the curtain. You've earned the view."},
 eva_obj_entry:{who:"EVA",text:"When you are ready, return to the cockpit and start the Entry Survey from the FLIGHT page."},
 eva_grant:{who:"EVA",text:"Handprint verified."},
 eva_shades:{who:"EVA",text:"Hull temperature rising. Deploying thermal shades."},
 eva_shades_up:{who:"EVA",text:"Temperatures nominal. Retracting shades."},
 eva_hold:{who:"EVA",text:"Holding at sixty kilometres. Survey sensors are recording. Climb back to orbit when ready."},
 eva_done:{who:"EVA",text:"Survey data uploaded. Good work, Commander. The ship is yours."}
};
// Retain every original v4 cue and every previously generated EVA line.
for(const line of [...oldDialogue.lines,...extraDialogue.lines,
{id:'earth_departure',speaker:'EVA',text:'Earth. Pacific departure terminal. Commander Hale, your transfer is ready. The Longhaul is waiting in orbit.',duration:8},
{id:'earth_commander',speaker:'HALE',text:'One last look at home. Oceans, clouds, and a sky we can breathe. Whatever waits out there, we bring a little of this with us.',duration:9},
{id:'earth_clearance',speaker:'EVA',text:'Flight clearance confirmed. Next stop: orbit. Beyond that, the deep reach. Welcome aboard, Commander.',duration:8}]){if(LINES[line.id]&&LINES[line.id].text!==line.text)LINES[line.id+'_original']={...LINES[line.id]};LINES[line.id]={who:line.speaker,text:line.text,duration:line.duration};}
for(const [alias,id] of [['eva_obj_lights','eva_quarters'],['eva_obj_window','eva_view']])LINES[alias]={...LINES[id]};
const sources=Object.fromEntries(Object.entries(recordings).map(([p,url])=>[p.split('/').pop().replace('.mp3',''),url]));sources.eva_obj_lights=sources.eva_quarters;sources.eva_obj_window=sources.eva_view;
const voicePlayer=createVoicePlayer({lines:LINES,sources,onCaption:line=>{$('sub').style.opacity=line?1:0;if(line){$('subw').textContent=line.who;$('subt').textContent=line.text;}},onError:text=>notice(text)});
const VOICE={files:voicePlayer.custom,tts:true};let subTimer=0;
function say(id){voicePlayer.tts=VOICE.tts;voicePlayer.enqueue(id);}

/* ============================ SHIP ============================ */
const MAT={HULL:0,TRIM:1,DECK:2,SCREEN:3,DECAL:4,FAB:5,POLY:7,GLOW:8,GLASS:9,PAD:10,EXT:11,CURT:12};
const meshes=[],glassMeshes=[];
function add(geo,mat,col,met,rgh,o){o=o||{};const m={geo,mat,col,met,rgh,em:o.em||[0,0,0],uv:o.uv||1,tex:o.tex||null,model:M.id(),ext:!!o.ext,aux:[1,0,0,0]};meshes.push(m);return m;}
const H=2.6;
// Interior shell
{const b=new B();
 b.box([0,H+.05,-5],[3,.05,2]);b.box([0,H+.05,-1],[1.2,.05,2]);b.box([0,H+.05,3],[2.5,.05,2]);
 b.box([-3.05,1.3,-5],[.05,1.35,2]);b.box([3.05,1.3,-5],[.05,1.35,2]);
 b.box([0,.45,-7.05],[3,.45,.05]);b.box([0,2.475,-7.05],[3,.175,.05]);b.box([-2.7,1.6,-7.05],[.3,.7,.05]);b.box([2.7,1.6,-7.05],[.3,.7,.05]);
 b.box([-1.8,1.3,-2.95],[1.2,1.35,.05]);b.box([1.8,1.3,-2.95],[1.2,1.35,.05]);b.box([0,2.375,-2.95],[.6,.275,.05]);
 b.box([-1.25,1.3,-1],[.05,1.35,2]);
 b.box([1.25,1.3,-2.5],[.05,1.35,.5]);b.box([1.25,1.3,.5],[.05,1.35,.5]);b.box([1.25,.5,-1],[.05,.5,1]);b.box([1.25,2.3,-1],[.05,.35,1]);
 b.box([-1.55,1.3,1.05],[.95,1.35,.05]);b.box([1.55,1.3,1.05],[.95,1.35,.05]);b.box([0,2.375,1.05],[.6,.275,.05]);
 b.box([2.55,1.3,3],[.05,1.35,2]);b.box([-1.55,1.3,5.05],[.95,1.35,.05]);b.box([1.55,1.3,5.05],[.95,1.35,.05]);b.box([0,2.375,5.05],[.6,.275,.05]);
 b.box([-2.55,1.3,1.5],[.05,1.35,.5]);b.box([-2.55,1.3,4.5],[.05,1.35,.5]);b.box([-2.55,.5,3],[.05,.5,1]);b.box([-2.55,2.3,3],[.05,.35,1]);
 for(const z of [-6.2,-3.8]){b.box([-2.93,1.3,z],[.07,1.3,.08],1,.9);b.box([2.93,1.3,z],[.07,1.3,.08],1,.9);b.box([0,2.55,z],[2.93,.05,.08],1,.9);}
 add(b.build(),MAT.HULL,[.12,.13,.145],.6,.45,{uv:1.1});}
{const b=new B();b.box([0,-.05,-5],[3,.05,2]);b.box([0,-.05,-1],[1.2,.05,2]);b.box([0,-.05,3],[2.5,.05,2]);add(b.build(),MAT.DECK,[.09,.095,.105],.55,.7);}
// trim: door frames, window frames, rails
{const b=new B();
 for(const z of [-2.95,1.05]){b.box([-.66,1.05,z],[.06,1.07,.08],2);b.box([.66,1.05,z],[.06,1.07,.08],2);b.box([0,2.15,z],[.72,.04,.08],2);}
 b.box([0,.88,-7.0],[2.42,.02,.03],2);b.box([0,2.32,-7.0],[2.42,.02,.03],2);b.box([-2.41,1.6,-7.0],[.02,.72,.03],2);b.box([2.41,1.6,-7.0],[.02,.72,.03],2);
 b.box([-.8,1.6,-7.02],[.03,.7,.03],2);b.box([.8,1.6,-7.02],[.03,.7,.03],2);
 b.box([1.2,1.0,-1],[.02,.02,1.02],2);b.box([1.2,2.0,-1],[.02,.02,1.02],2);b.box([1.13,2.18,-1],[.015,.015,1.1],2);
 b.box([-2.5,1.0,3],[.02,.02,1.02],2);b.box([-2.5,2.0,3],[.02,.02,1.02],2);b.box([-2.43,2.18,3],[.015,.015,1.1],2);
 b.cyl([-1.12,1.15,-2.7],.025,3.4,10,"z");
 add(b.build(),MAT.TRIM,[.56,.58,.62],1,.22,{uv:2});}
// cockpit furniture
{const b=new B();
 b.box([0,.4,-6.4],[2.4,.4,.5],1.4,.95);b.box([0,.82,-6.35],[2.42,.02,.56],1.4);
 for(const x of [-1.15,0,1.15])b.box([x,1.18,-6.67],[.55,.33,.05],1.2,.9);
 b.box([0,.38,-5.55],[.25,.38,.18],1.2,.9);
 add(b.build(),MAT.HULL,[.075,.082,.094],.72,.32,{uv:1.5});}
{const b=new B();
 b.box([0,.45,-5.1],[.32,.06,.32],1.5);b.box([0,.98,-4.76],[.32,.46,.07],1.5);b.box([0,1.55,-4.78],[.16,.12,.08],1.5);
 b.box([-.37,.66,-5.0],[.05,.15,.24],1.5);b.box([.37,.66,-5.0],[.05,.15,.24],1.5);
 b.box([1.6,.55,3.6],[.75,.08,1.05],1.2);
 add(b.build(),MAT.FAB,[.06,.068,.08],0,.8,{uv:1.6});}
{const b=new B();b.box([1.6,.67,4.4],[.6,.06,.2],1.5);add(b.build(),MAT.FAB,[.55,.56,.58],0,.85,{uv:2});}
{const b=new B();b.box([1.6,.66,3.25],[.77,.04,.72],1.3);add(b.build(),MAT.FAB,[.06,.12,.22],0,.85,{uv:1.4});}
{const b=new B();
 b.box([0,.2,-5.1],[.08,.2,.08],2);b.box([0,.025,-5.05],[.3,.025,.28],2);
 b.box([1.6,.24,3.6],[.8,.24,1.1],1.3);
 b.box([-1.05,1.0,-1.6],[.14,1.0,.55],1.3,.9);b.box([-1.05,1.0,-.45],[.14,1.0,.55],1.3,.9);
 b.box([-1.95,.36,4.75],[.02,.36,.02],2);b.box([-1.05,.36,4.75],[.02,.36,.02],2);b.box([-1.95,.36,4.5],[.02,.36,.02],2);b.box([-1.05,.36,4.5],[.02,.36,.02],2);
 add(b.build(),MAT.POLY,[.045,.048,.054],.05,.8,{uv:1.4});}
{const b=new B();b.box([-1.5,.74,4.62],[.5,.025,.2],2);b.box([.8,1.75,5.0],[.5,.02,.05],2);add(b.build(),MAT.TRIM,[.42,.44,.48],1,.3,{uv:2});}
// screens
function screen(cx,cy,cz,w,h,tilt,t){const b=new B(),c=Math.cos(tilt),s=Math.sin(tilt);b.plane([cx-w/2,cy+h/2*c,cz-h/2*s],[w,0,0],[0,-h*c,h*s]);return add(b.build(),MAT.SCREEN,[1,1,1],0,.1,{tex:t});}
const cockpitScreens=[screen(-1.15,1.18,-6.55,1.0,300/512,.12,S1.t),screen(0,1.18,-6.55,1.0,300/512,.12,S2.t),screen(1.15,1.18,-6.55,1.0,300/512,.12,S3.t)];
// placards
function plac(t,o,u,w){const b=new B();b.plane(o,u,w);add(b.build(),MAT.DECAL,[.12,.13,.145],.6,.45,{tex:t,em:[.05,.1,.15]});}
plac(label("COCKPIT · AUTHORIZED",512,64,34,"#cfe4f0"),[-.6,2.45,-2.895],[1.2,0,0],[0,-.15,0]);
plac(label("QUARTERS · PRIVATE",512,64,34,"#cfe4f0"),[.6,2.45,.995],[-1.2,0,0],[0,-.15,0]);
plac(label("SV-7 LONGHAUL",512,80,52,"#d8e2ea"),[-1.195,1.95,.6],[0,0,-1.5],[0,-.24,0]);
// glass
function glassPlane(o,u,w){const b=new B();b.plane(o,u,w);glassMeshes.push(b.build());}
glassPlane([-2.4,2.3,-7.04],[4.8,0,0],[0,-1.4,0]);glassPlane([1.24,2,-2],[0,0,2],[0,-1,0]);glassPlane([-2.54,2,2],[0,0,2],[0,-1,0]);

/* ---- rooms & lights ---- */
const rooms=[
 {name:"COCKPIT",on:true,t:9,lights:[0,1],fix:null},
 {name:"CORRIDOR",on:true,t:9,lights:[2],fix:null},
 {name:"QUARTERS",on:false,t:9,lights:[3,5],fix:null}];
const LIGHTS=[
 {p:[-1.8,2.45,-5],c:[.75,.87,1],i:6,r:7,room:0},{p:[1.8,2.45,-5],c:[.75,.87,1],i:6,r:7,room:0},
 {p:[0,2.45,-1],c:[.75,.87,1],i:5,r:6,room:1},{p:[0,2.45,3],c:[1,.84,.66],i:6.5,r:7,room:2},
 {p:[0,1.2,-5.9],c:[.3,.7,1],i:1.1,r:3,room:-1},{p:[-.5,1.0,4.55],c:[1,.75,.5],i:.8,r:2.5,room:2}];
function fixture(room,fn){const b=new B();fn(b);rooms[room].fix=add(b.build(),MAT.GLOW,[.3,.3,.3],0,.25);}
fixture(0,b=>{b.box([-1.8,2.585,-5],[.05,.012,1.6]);b.box([1.8,2.585,-5],[.05,.012,1.6]);});
fixture(1,b=>{b.box([0,2.585,-1],[.05,.012,1.6]);});
fixture(2,b=>{b.box([0,2.585,3],[.5,.012,.5]);});
const consoleGlow=add((()=>{const b=new B();b.box([0,.845,-6.05],[2.3,.004,.01]);return b.build();})(),MAT.GLOW,[.2,.4,.6],0,.2,{em:[.3,.9,1.5]});
function flick(t){if(t>1)return 1;const k=Math.floor(t*24),h=Math.abs(Math.sin(k*91.7)*4375.5)%1;if(t<.6)return h>.5?.85:.03;return .55+.45*(t-.6)/.4;}
function roomLevel(r){return r.on?flick(r.t):Math.max(0,1-r.t*3);}
function setRoom(i,on){const r=rooms[i];if(r.on===on)return;r.on=on;r.t=0;SFX.clunk();}

/* ---- doors with handprint pads ---- */
const doors=[];
function makeDoor(zc,zWall,name){const b=new B();b.box([0,1.05,zc],[.6,1.05,.025],1.3);
 const m=add(b.build(),MAT.HULL,[.14,.15,.17],.7,.38,{uv:1.3});
 const d={name,mesh:m,open:0,target:0,scan:-1,granted:0,idle:0,z:zWall,pads:[]};
 [[zWall-.056,-1],[zWall+.056,1]].forEach(([pz])=>{const pb=new B();pb.plane([.79,1.45,pz],[.22,0,0],[0,-.28,0]);
  const pm=add(pb.build(),MAT.PAD,[1,1,1],0,.2);d.pads.push(pm);
  inter.push({label:()=>d.scan>=0?"SCANNING…":(d.target?"CLOSE "+name:"SCAN HANDPRINT — "+name),box:{min:[.72,1.1,pz-.08],max:[1.08,1.5,pz+.08]},act:()=>useDoor(d)});});
 doors.push(d);return d;}
const inter=[];
makeDoor(-2.87,-2.95,"COCKPIT");makeDoor(.975,1.05,"QUARTERS");
function useDoor(d){if(d.locked){notice("Connecting door locked. Deploy the habitat and wait for pressure seals.");return;}if(d.airlock&&!airlockAllowed(d))return;if((d.systems||[0,1]).some(i=>voyage.systems.faults[i])){notice("Safety interlock. Repair the compartment using SYSTEMS.");return;}if(d.scan>=0)return;if(d.target){d.target=0;SFX.whoosh();return;}d.scan=0;SFX.scan();}

/* ---- windows & curtains ---- */
const windows=[];
function makeWindow(name,build,modelFn,box){const b=new B();build(b);const m=add(b.build(),MAT.CURT,[.62,.55,.38],0,.85,{uv:3});
 const w={name,mesh:m,open:true,k:0,modelFn};windows.push(w);
 inter.push({label:()=>(w.open?"CLOSE ":"OPEN ")+name+" SHADE",box,act:()=>setWindow(w,!w.open)});return w;}
makeWindow("COCKPIT SHADE",b=>b.box([0,-.72,0],[2.44,.72,.008],1),k=>M.T(0,2.32,-7.18),{min:[-2.4,.9,-7.06],max:[2.4,2.3,-6.85]});
makeWindow("CORRIDOR",b=>b.box([0,-.62,0],[.008,.62,1],1),k=>M.T(3.12,2.15,-1),{min:[1.0,.95,-2],max:[1.26,2.05,0]});
makeWindow("QUARTERS",b=>b.box([0,-.62,0],[.008,.62,1],1),k=>M.T(-3.65,2.15,3),{min:[-2.56,.95,2],max:[-2.3,2.05,4]});
function setWindow(w,open,force=false){if(game.autoShaded&&!force)return;if(w.open===open)return;w.open=open;SFX.motor();}

/* ---- exterior hull ---- */
{const b=new B();
 b.box([0,1.3,-5],[3.4,1.6,2.25],.5);b.box([0,.35,-8.1],[2.9,.55,.9],.5);b.box([0,.4,-9.4],[1.8,.4,.45],.5);
 b.box([0,1.3,-1],[1.65,1.55,1.85],.5);b.box([0,1.3,3],[2.95,1.6,2.2],.5);b.box([0,1.3,5.85],[2.4,1.25,.7],.5);
 b.box([-4.7,.75,1.6],[1.6,.1,1.8],.5);b.box([4.7,.75,1.6],[1.6,.1,1.8],.5);
 b.box([0,3.45,3.6],[.1,.55,1.3],.5);b.box([0,2.95,-1],[.8,.1,3.9],.5);
 add(b.build(),MAT.EXT,[.55,.57,.6],.35,.42,{ext:true,uv:.5});}
{const b=new B();b.cyl([-1.2,1.3,6.5],.62,1.3,20,"z");b.cyl([1.2,1.3,6.5],.62,1.3,20,"z");b.box([-6.3,.75,1.6],[.06,.3,1.6],1);b.box([6.3,.75,1.6],[.06,.3,1.6],1);
 add(b.build(),MAT.TRIM,[.32,.33,.36],1,.32,{ext:true,uv:1});}
const engGlow=add((()=>{const b=new B();b.cyl([-1.2,1.3,7.79],.5,.02,20,"z");b.cyl([1.2,1.3,7.79],.5,.02,20,"z");b.box([-1.2,1.3,7.8],[.42,.42,.005]);b.box([1.2,1.3,7.8],[.42,.42,.005]);return b.build();})(),MAT.GLOW,[.2,.3,.5],0,.2,{ext:true,em:[1.2,2.2,4]});
const canopyGlow=add((()=>{const b=new B();b.plane([-2.4,2.3,-7.26],[4.8,0,0],[0,-1.4,0]);return b.build();})(),MAT.GLOW,[.05,.07,.1],0,.1,{ext:true});
const winGlow=add((()=>{const b=new B();b.plane([1.66,2,-2],[0,0,2],[0,-1,0]);b.plane([-2.96,2,2],[0,0,2],[0,-1,0]);return b.build();})(),MAT.GLOW,[.05,.07,.1],0,.1,{ext:true});
const navL=add((()=>{const b=new B();b.box([-6.36,.75,1.6],[.02,.06,.06]);return b.build();})(),MAT.GLOW,[.3,0,0],0,.2,{ext:true});
const navR=add((()=>{const b=new B();b.box([6.36,.75,1.6],[.02,.06,.06]);return b.build();})(),MAT.GLOW,[0,.3,0],0,.2,{ext:true});

/* ============================ GAME STATE ============================ */
const R_PLANET=6371,AR_PLANET=R_PLANET+140;
const SUN=nrm([-.5,.35,.8]);
let voyage=freshVoyage();let atExchange=false,sceneTime=0,sceneCamera=0,saveClock=0;
const game={mode:"menu",story:true,cam:0,tab:false,flash:false,step:0,time:0,cutT:0,autoShaded:false,shadeMemo:[]};
const pl={x:-1.1,y:1.65,z:-4.1,yaw:0,pitch:-.05,vx:0,vz:0,bob:0,crouch:0};
const orbit={yaw:.8,pitch:.3,distance:53};
const flight={v:7640,pitch:0,tp:0,A:400,heat:0,ap:"none",warp:1};
const keys={};

/* ============================ INPUT ============================ */
let locked=false,dragging=false,dragMoved=0;
function lock(){if(game.tab||game.cam!==0||game.mode!=="play"||voyage.expedition.onStation)return;try{const r=canvas.requestPointerLock&&canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(e){}}
document.addEventListener("pointerlockchange",()=>{locked=document.pointerLockElement===canvas;});
canvas.addEventListener("mousedown",e=>{canvas.focus();if(game.mode!=="play")return;if(locked){if(e.button===0&&game.cam===0)interact();return;}dragging=true;dragMoved=0;lock();});
addEventListener("mouseup",()=>{if(dragging&&dragMoved<4&&game.mode==="play"&&game.cam===0&&!locked)interact();dragging=false;});
addEventListener("mousemove",e=>{if(!(locked||dragging)||game.mode!=="play")return;dragMoved+=Math.abs(e.movementX)+Math.abs(e.movementY);
 const k=locked?.0022:.004;
 if(game.cam===0){pl.yaw-=e.movementX*k;pl.pitch=clamp(pl.pitch-e.movementY*k,-1.5,1.5);}
 if(game.cam===4){orbit.yaw-=e.movementX*k;orbit.pitch=clamp(orbit.pitch+e.movementY*k,-.15,1.35);}
});
addEventListener("keydown",e=>{keys[e.code]=true;if(voyage.pilot&&!game.tab&&["KeyW","KeyS","KeyA","KeyD","KeyR","KeyF","KeyQ","KeyE","KeyB","KeyZ","KeyX","ShiftLeft","ControlLeft"].includes(e.code))e.preventDefault();
 if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code))e.preventDefault();

 if(game.mode==="scene"&&(e.code==="Space"||e.code==="Enter")){finishScene();return;}
 if(game.mode==="cut"&&(e.code==="Space"||e.code==="Enter")){endCutscene();return;}
 if(game.mode!=="play"||e.repeat||["INPUT","SELECT","TEXTAREA"].includes(e.target.tagName))return;
 if(e.code==="KeyT")toggleTab();
 if(e.code==="KeyP"){togglePilot();return;}
 if(game.tab)return;
 if(e.code==="KeyE"&&!voyage.pilot)interact();
 if(e.code==="KeyR"&&surface){surface.rover=!surface.rover;notice(surface.rover?"SURFACE SKIMMER · 32 M/S":"EXPLORING ON FOOT");}
 if(e.code==="KeyB"&&voyage.pilot){issuePilot("brake");}
 if(e.code==="KeyF"&&!voyage.pilot){game.flash=!game.flash;SFX.tap();}
 if(e.code==="KeyV"){setCam((game.cam+1)%5);}
});
addEventListener("keyup",e=>{keys[e.code]=false;});
addEventListener("blur",()=>{for(const k in keys)keys[k]=false;});

function fwd(){const c=Math.cos(pl.pitch);return[-Math.sin(pl.yaw)*c,Math.sin(pl.pitch),-Math.cos(pl.yaw)*c];}
function rayBox(o,d,mn,mx){let t0=0,t1=1e9;for(let i=0;i<3;i++){const iv=1/(Math.abs(d[i])<1e-9?1e-9:d[i]);let a=(mn[i]-o[i])*iv,b=(mx[i]-o[i])*iv;if(a>b){const s=a;a=b;b=s;}t0=Math.max(t0,a);t1=Math.min(t1,b);if(t1<t0)return -1;}return t0;}
function pick(){if(voyage.expedition.onStation||voyage.pilot||game.cam!==0||game.mode!=="play")return null;const o=[pl.x,pl.y,pl.z],d=fwd();let best=null,bt=2.4;
 for(const it of inter){const t=rayBox(o,d,it.box.min,it.box.max);if(t>=0&&t<bt){bt=t;best=it;}}return best;}
function interact(){if(surface){surfaceInteract();return;}if(voyage.expedition.onStation){if(atExchange){page='NAVIGATION';if(!game.tab)toggleTab();else renderTab();}else if(pl.z>94)returnFromStation();return;}if(voyage.controlled>=0){repairRoom(voyage.drones[voyage.controlled].room);return;}if(voyage.pilot)return;const h=pick();if(h)h.act();else if(pl.z< -3.5)togglePilot();}
function setCam(c){if(surface)return;if(voyage.expedition.onStation&&c!==0)return;game.cam=c;SFX.tap();if(c!==0)game.flash=false;}

/* ---- collision ---- */
const AREAS=[{a:[-2.7,-6.7],b:[2.7,-3.3]},{a:[-.6,-2.7],b:[.9,.7]},{a:[-2.2,1.3],b:[2.2,4.7]}];
const DOORAREAS=[{a:[-.3,-3.45],b:[.3,-2.55],d:0},{a:[-.3,.55],b:[.3,1.45],d:1}];
const OBST=[{a:[-2.45,-6.95],b:[2.45,-5.85]},{a:[-.4,-5.45],b:[.4,-4.7]},{a:[-.3,-5.75],b:[.3,-5.35]},{a:[.78,2.48],b:[2.45,4.72]},{a:[-2.02,4.4],b:[-1,5.0]}];
function walkable(x,z){if(voyage.expedition.onStation)return x> -5.5&&x<5.5&&z>80.5&&z<99;if(voyage.controlled>=0)return Math.abs(x)<1&&z> -6&&z<22;const r=.28;let inside=false;
 for(const A_ of AREAS)if(x>=A_.a[0]&&x<=A_.b[0]&&z>=A_.a[1]&&z<=A_.b[1]){inside=true;break;}
 if(!inside)for(const D of DOORAREAS)if(!doors[D.d].locked&&doors[D.d].open>.85&&x>=D.a[0]&&x<=D.b[0]&&z>=D.a[1]&&z<=D.b[1]){inside=true;break;}
 if(!inside)return false;
 for(const o of OBST)if(x>o.a[0]-r&&x<o.b[0]+r&&z>o.a[1]-r&&z<o.b[1]+r)return false;
 return true;}

/* ============================ TABLET ============================ */
const PAGES=["HABITAT","NAVIGATION","SURFACE","STORAGE","SYSTEMS","DRONES","STATUS","LIGHTS","WINDOWS","CAMERAS","FLIGHT","VOICE","AUDIO"];
let page="STATUS";
const tnav=$("tnav"),tbody=$("tbody");
function toggleTab(){game.tab=!game.tab;$("tab").classList.toggle("up",game.tab);SFX.tap();
 if(game.tab){if(document.exitPointerLock)document.exitPointerLock();renderTab();if(!surface&&game.story&&game.step===0)advance();}
 else{canvas.focus();}}
function onoff(on){return on?"on":"";}
function renderTab(){
 tnav.innerHTML=PAGES.map(p=>`<div class="${p===page?"sel":""}" data-page="${p}">${p}</div>`).join("");
 let h="";
 if(page==="NAVIGATION")h=navigationHTML();if(page==="SURFACE")h=surfacePanelHTML();if(page==="STORAGE")h=storageHTML();
 if(page==="SYSTEMS")h=systemsHTML();if(page==="HABITAT")h=habitats.html();
 if(page==="DRONES")h=dronesHTML();
 if(page==="STATUS"){h=`<h3>STATUS</h3><div class="hint">SV-7 LONGHAUL · EVA ONLINE</div>
  <div class="clock" data-live="clock"></div><div class="hint" data-live="date"></div>
  <div class="row"><div>HULL TEMPERATURE<small data-live="heatTxt"></small></div><div class="bar hot"><i data-live="heatBar"></i></div></div>
  <div class="row"><div>ALTITUDE<small data-live="alt"></small></div><div>VELOCITY<small data-live="vel"></small></div></div>
  <div class="row"><div>PITCH<small data-live="pit"></small></div><div>VERTICAL SPEED<small data-live="vs"></small></div></div>
  <div class="row"><div>AUTOPILOT<small data-live="ap"></small></div><div>SHADES<small data-live="shade"></small></div></div>`;}
 if(page==="LIGHTS"){h=`<h3>LIGHTING</h3><div class="hint">WIRELESS ROOM CONTROL</div>`+
  rooms.map((r,i)=>`<div class="row"><div>${r.name}<small>${r.on?"ON":"OFF"}</small></div><button class="${onoff(r.on)}" data-act="light:${i}">${r.on?"TURN OFF":"TURN ON"}</button></div>`).join("")+
  `<div class="grid2"><button data-act="lightall:1">ALL ON</button><button data-act="lightall:0">ALL OFF</button></div>`;}
 if(page==="WINDOWS"){h=`<h3>WINDOWS</h3><div class="hint">EXTERIOR NANO-LAMINATE · CLOSE ALL TO WRAP THE HULL${game.autoShaded?" · EVA THERMAL LOCK ACTIVE":""}</div>`+
  windows.map((w,i)=>`<div class="row"><div>${w.name}<small>${w.open?"OPEN":"CLOSED"}</small></div><button ${game.autoShaded?"disabled":""} data-act="win:${i}">${w.open?"CLOSE":"OPEN"}</button></div>`).join("")+
  `<div class="grid2"><button ${game.autoShaded?"disabled":""} data-act="winall:1">OPEN ALL</button><button ${game.autoShaded?"disabled":""} data-act="winall:0">CLOSE ALL</button></div>`;}
 if(page==="CAMERAS"){h=`<h3>CAMERAS</h3><div class="hint">V CYCLES VIEWS · THIRD PERSON: DRAG TO ORBIT, SCROLL TO ZOOM</div>`+
  ["FIRST PERSON","PORT HULL","STARBOARD HULL","FORWARD HULL","THIRD PERSON / ORBIT"].map((n,i)=>`<div class="row"><div>${n}</div><button class="${onoff(game.cam===i)}" data-act="cam:${i}">${game.cam===i?"ACTIVE":"VIEW"}</button></div>`).join("")+
  `<div class="row"><div>FLASHLIGHT<small>F KEY · FIRST PERSON ONLY</small></div><button class="${onoff(game.flash)}" data-act="flash">${game.flash?"ON":"OFF"}</button></div>`;}
 if(page==="FLIGHT"&&voyage.active){h=pilotPanelHTML();}
 if(page==="FLIGHT"&&!voyage.active){const ap=flight.ap;h=`<h3>FLIGHT · PILOT AUTHORITY</h3><button data-act="pilot">${voyage.pilot?"LEAVE PILOT SEAT":"TAKE PILOT SEAT"}</button><div class="hint">VERTICAL SPEED = VELOCITY × SIN(PITCH)</div>
  <div class="row"><div>ENTRY SURVEY<small>DESCEND TO 60 KM · TIME ×12 · EVA MANAGES HEAT</small></div><button class="${onoff(ap==="entry")}" data-act="ap:entry" ${flight.A<=61?"disabled":""}>ENGAGE</button></div>
  <div class="row"><div>CLIMB TO ORBIT<small>RETURN TO 400 KM</small></div><button class="${onoff(ap==="climb")}" data-act="ap:climb" ${flight.A>=399?"disabled":""}>ENGAGE</button></div>
  <div class="row"><div>AUTOPILOT OFF<small>MANUAL REMOTE CONTROL</small></div><button class="${onoff(ap==="none")}" data-act="ap:none">MANUAL</button></div>
  <div class="row"><div>PITCH<small data-live="pit"></small></div><div><button data-act="pitch:-1" ${ap!=="none"?"disabled":""}>NOSE DOWN</button> <button data-act="pitch:1" ${ap!=="none"?"disabled":""}>NOSE UP</button></div></div>
  <div class="row"><div>THRUST<small data-live="vel"></small></div><div><button data-act="thr:-1" ${ap!=="none"?"disabled":""}>− 50 M/S</button> <button data-act="thr:1" ${ap!=="none"?"disabled":""}>+ 50 M/S</button></div></div>
  <div class="row"><div>ALTITUDE<small data-live="alt"></small></div><div>V/S<small data-live="vs"></small></div></div>`;}
 if(page==="VOICE"){h=`<h3>VOICE LINES</h3><div class="hint">LOAD YOUR OWN RECORDINGS · FILE NAME MUST CONTAIN THE LINE ID (E.G. eva_intro_1.mp3)</div>
  <input type="file" id="vfiles" accept="audio/*" multiple>
  <div class="row"><div>BROWSER SPEECH FALLBACK<small>USED WHEN NO RECORDING IS LOADED</small></div><button class="${onoff(VOICE.tts)}" data-act="tts">${VOICE.tts?"ON":"OFF"}</button></div>`+
  `<button data-act="stopvoice">STOP PLAYBACK</button>`+Object.keys(LINES).map(id=>`<div class="row"><div>${id}<small>${VOICE.files[id]?"RECORDING LOADED":"NO RECORDING"} · ${LINES[id].who}</small></div><button data-act="play:${id}">PLAY</button></div>`).join("");}
 if(page==="AUDIO"){h=`<h3>AUDIO & DISPLAY</h3><div class="row"><div>PLANET ASSETS<small data-asset-status></small></div><button data-act="stream">${celestialRenderer.textures.stream.enabled?"USE OFFLINE ONLY":"ENABLE ONLINE HD"}</button></div><button data-act="assetclear">CLEAR DOWNLOADED HD CACHE</button><div class="hint">Embedded 2K planet maps always available. Online: hash-verified native-resolution sources, GPU detail capped at 4K; one HD surface resident at a time. Solar System Scope · CC BY 4.0. Fictional worlds use artist-tinted reference maps. Nacre/Borealis use NASA Goddard’s 23,232-triangle Moon model (color-map-only, public domain), adapted with these maps. Rigged crew: Microsoft Rocketbox (MIT). Streamed NASA spacecraft / ISS and habitat models. PBR furnishings: Wayfair / Khronos, CC0 and CC BY 4.0. Offline GLBs retain human rigs and full geometry. Online HD keeps original texture dimensions. Verified cache bounded to 2 GiB; no external CDN required.</div><div class="grid2"><button data-act="quality:1">HIGH RESOLUTION${softwareGPU?" · SOFTWARE GPU CAP":""}</button><button data-act="quality:0.4">EFFICIENT RENDERING</button></div><button data-act="mute">${A.muted?"UNMUTE ALL AUDIO":"MUTE ALL AUDIO"}</button><div class="hint">PROCEDURAL SCORE · RECORDED DIALOGUE · OPTIONAL SYNTHETIC BREATHING</div>
  <div class="row"><div>MUSIC VOLUME<small data-live="mvol"></small></div><div><button data-act="mus:-1">−</button> <button data-act="mus:1">+</button></div></div>
  <div class="row"><div>BREATHING<small>FIRST PERSON</small></div><button class="${onoff(A.breath)}" data-act="breath">${A.breath?"ON":"OFF"}</button></div>`;}
 tbody.innerHTML=h;liveTab();updatePilotHUD();}
function liveTab(){if(!game.tab)return;const assetStatus=tbody.querySelector("[data-asset-status]");if(assetStatus)assetStatus.textContent=premium.status.status+' | '+celestialRenderer.textures.stream.status;if(page==='SURFACE'){const b=tbody.querySelector('[data-act="hatch"]');if(b)b.textContent=outerHatch.target?'CLOSE EXTERIOR HATCH':'OPEN EXTERIOR HATCH';}const now=new Date(),vs=flight.v*Math.sin(flight.pitch*PI/180);
 const L={clock:now.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",second:"2-digit"}),date:now.toDateString().toUpperCase()+" · SHIP TIME",
  heatTxt:Math.round(flight.heat*100)+" %",alt:flight.A.toFixed(1)+" KM",vel:flight.v.toFixed(0)+" M/S",pit:(flight.pitch>=0?"+":"")+flight.pitch.toFixed(1)+"°",
  vs:(vs>=0?"+":"")+vs.toFixed(0)+" M/S",ap:flight.ap.toUpperCase(),shade:game.autoShaded?"THERMAL LOCK":"MANUAL",mvol:Math.round(A.musicVol*100)+" %"};
 tbody.querySelectorAll("[data-live]").forEach(el=>{const k=el.dataset.live;if(k==="heatBar")el.style.width=Math.round(flight.heat*100)+"%";else if(L[k]!==undefined)el.textContent=L[k];});}
tnav.addEventListener("click",e=>{const p=e.target.dataset.page;if(p){page=p;SFX.tap();renderTab();}});
tbody.addEventListener("click",e=>{const a=e.target.dataset.act;if(!a)return;SFX.tap();const[k,v]=a.split(":");
 if(handleExtra(k,v)){renderTab();return;}
 if(["ap","pitch","thr"].includes(k)&&!voyage.pilot){notice("Take the pilot seat before issuing flight commands.");return;}
 if(k==="light")setRoom(+v,!rooms[+v].on);
 if(k==="lightall")rooms.forEach((r,i)=>setRoom(i,v==="1"));
 if(k==="win")setWindow(windows[+v],!windows[+v].open);
 if(k==="winall")windows.forEach(w=>setWindow(w,v==="1"));
 if(k==="cam")setCam(+v);
 if(k==="flash")game.flash=!game.flash;
 if(k==="ap"&&voyage.active){issuePilot(v==="none"?"manual":v);renderTab();return;}
 if(k==="ap"){if(v!=="none"&&!flightReady())return;if(game.story&&game.step<7&&((v==="entry"&&game.step!==4)||(v==="climb"&&game.step!==6))){notice("Follow the current survey objective first.");return;}flight.ap=v;if(v==="none"){flight.warp=1;}}
 if(k==="pitch")issuePilot("pitch",Number(v)*Math.PI/180);
 if(k==="thr")issuePilot("thrust",Number(v)*.05);
 if(k==="tts")VOICE.tts=!VOICE.tts;
 if(k==="play")say(v);
 if(k==="mus"){A.musicVol=clamp(A.musicVol+.1*(+v),0,1);if(A.music)A.music.gain.value=A.musicVol;}
 if(k==="breath")A.breath=!A.breath;
 renderTab();});
tbody.addEventListener("change",e=>{if(e.target.id!=="vfiles")return;const files=[...e.target.files];
 files.forEach(f=>{const n=f.name.toLowerCase();Object.keys(LINES).forEach(id=>{if(n.replace(/\.[^.]+$/,"")===id){if(VOICE.files[id])URL.revokeObjectURL(VOICE.files[id]);VOICE.files[id]=URL.createObjectURL(f);}});});renderTab();});

/* ============================ STORY ============================ */
const STEPS=[
 {d:"Open your tablet — press T.",done:()=>false,line:"eva_obj_lights"},
 {d:"Turn on the QUARTERS lights from the tablet (LIGHTS page).",done:()=>rooms[2].on,line:"eva_obj_room"},
 {d:"Go to your quarters. Scan your handprint at each door.",done:()=>pl.z>1.5&&doors.slice(0,2).every(d=>d.verified),line:"eva_obj_window"},
 {d:"Open the quarters curtain (look at the window and press E).",done:()=>windows[2].open&&pl.z>1.5,line:"eva_obj_entry"},
 {d:"Return to the cockpit. Tablet → FLIGHT → ENTRY SURVEY.",done:()=>flight.ap==="entry"||flight.A<350,line:null},
 {d:"Ride out the entry heat. EVA will deploy the thermal shades.",done:()=>flight.A<=61,line:null},
 {d:"Climb back to orbit (FLIGHT → CLIMB TO ORBIT).",done:()=>flight.A>=399&&flight.ap==="none"&&game.surveyed,line:null},
 {d:"Orbital survey complete. Open NAVIGATION for the Kestrel signal.",done:()=>false,line:null}];
function advance(){const s=STEPS[game.step];if(s&&s.line)say(s.line);game.step=Math.min(game.step+1,STEPS.length-1);}
function storyTick(){if(surface)return;if(!game.story){$('objd').textContent='FREE EXPLORATION — '+(voyage.expedition.onStation?'Walk to the exchange.':'P pilot · T navigation · WASD/RF flight · B brake');return;}if(game.step>=7){launchVoyage(voyage);$('objd').textContent=objectives[voyage.phase];return;}const s=STEPS[game.step];if(game.step>0&&s.done())advance();$('objd').textContent=STEPS[game.step].d;}
windows[2].open=false;windows[2].k=1;

/* ============================ CUTSCENE ============================ */
const CUT_LEN=27;
const cutEvents=[[.5,()=>say('earth_departure')],[9,()=>say('earth_commander')],[18,()=>say('earth_clearance')]];
let cutNext=0;
function startCutscene(){game.mode="cut";game.cutT=0;cutNext=0;document.body.classList.add("cine");flight.A=40000;}
function endCutscene(){if(game.mode!=="cut")return;const arrival=game.cutT>=CUT_LEN;premium.leaveEarth();document.body.classList.remove("cine");$("fade").style.opacity=0;game.mode="play";flight.A=400;initializeOrbitalWorld();
 pl.x=-1.1;pl.z=-4.1;pl.yaw=0;pl.pitch=-.05;voicePlayer.stop();$("sub").style.opacity=0;if(arrival){say("hale_1");say("eva_intro_1");say("eva_intro_2");}
 if(game.story){game.step=0;}$("prompt").textContent="";canvas.focus();}
function cutCam(t){
 if(t<6){const u=ease(t/6);return{eye:vlerp([22,12,40],[15,8,26],u),tgt:[0,1,8],ext:true};}
 if(t<10.5){const u=ease((t-6)/4.5);return{eye:vlerp([15,8,26],[10,11,5],u),tgt:[0,1,8],ext:true};}
 if(t<14.5){const u=ease((t-10.5)/4);return{eye:vlerp([3,2.6,-17],[.6,1.9,-9.2],u),tgt:[0,1.6,-7],ext:true};}
 const u=ease((t-14.5)/9);return{eye:[0,1.65,-4.4],tgt:vlerp([.4,1.3,-10],[-.3,1.1,-10],u),ext:false};}

/* ============================ RENDER ============================ */
const gpuInfo=gl.getExtension('WEBGL_debug_renderer_info');
const softwareGPU=gpuInfo&&/swiftshader|llvmpipe|software/i.test(gl.getParameter(gpuInfo.UNMASKED_RENDERER_WEBGL));
let renderScale=softwareGPU?.25:1;
let VW=2,VH=2,renderDT=0;
function resize(){const dpr=Math.min(window.devicePixelRatio||1,1.5)*(softwareGPU?Math.min(.25,renderScale):renderScale);VW=Math.max(2,Math.floor(innerWidth*dpr));VH=Math.max(2,Math.floor(innerHeight*dpr));canvas.width=VW;canvas.height=VH;}
addEventListener("resize",resize);resize();
const lP=new Float32Array(18),lC=new Float32Array(18),lR=new Float32Array(6);
function planetCenter(){if(flight.sharedWorld&&!voyage.active)return bodyPosition(KEPLER);if(voyage.active)return bodyPosition(primaryPlanet());const d0=nrm([0,-.6,-1]),a=-flight.pitch*PI/180,c=Math.cos(a),s=Math.sin(a);
 const d=[d0[0],d0[1]*c-d0[2]*s,d0[1]*s+d0[2]*c];const r=R_PLANET+flight.A,cy=Math.cos(flight.yaw||0),sy=Math.sin(flight.yaw||0);return[(d[0]*cy-d[2]*sy)*r,d[1]*r,(d[0]*sy+d[2]*cy)*r];}
function render(eye,tgt,ext,fov){
 const P=M.persp(fov*PI/180,VW/VH,.05,500),V=M.look(eye,tgt,[0,1,0]),VP=M.mul(P,V),iVP=M.inv(VP);
 if(typeof targetMarker!=='undefined'){targetMarker.hidden=!voyage.pilot||!voyage.active||game.tab||game.mode!=='play'||game.cam!==0;if(!targetMarker.hidden){const p=bodyPosition(voyage.expedition.target),clip=[0,1,2,3].map(j=>VP[j]*p[0]+VP[4+j]*p[1]+VP[8+j]*p[2]+VP[12+j]);targetMarker.style.left=clamp((clip[0]/Math.max(.01,clip[3])*.5+.5)*innerWidth,90,innerWidth-90)+'px';targetMarker.style.top=clamp((.5-clip[1]/Math.max(.01,clip[3])*.5)*innerHeight,190,Math.max(200,innerHeight*.4))+'px';targetMarker.textContent=(clip[3]<0?'↶ ':'◇ ')+sites[voyage.expedition.target].name+' · '+distance(voyage.expedition).toFixed(1)+' KM';}}
 const nearby=(voyage.active||flight.sharedWorld)?nearestWorld(voyage.expedition,sites):null;
 if(nearby&&!nearby.gas&&nearby.altitude<20000&&!voyage.expedition.onStation){const e=voyage.expedition,world=grounded||{planet:nearby.planet,radius:nearby.radius,n:nearby.n,lander:nearby.n,origin:nearby.n,walked:0,samples:[],recall:0};world.n=nearby.n;celestialRenderer.textures.focus(nearby.planet);terrainRenderer.render(world,0,0,VW,VH,game.time,{orbital:true,camera:anchor=>localFlightView(e,nearby,eye,tgt,anchor),altitude:nearby.altitude,fov,drawShip:false,globe:(vp,cam,model,axes)=>celestialRenderer.draw(nearby.planet,model,vp,cam,game.time,[dot(SUN,axes.east),dot(SUN,axes.up),dot(SUN,axes.south)])});gl.clear(gl.DEPTH_BUFFER_BIT);}else if(grounded){terrainRenderer.render(grounded,0,0,VW,VH,game.time,{cameraEye:eye,cameraTarget:tgt,fov,drawShip:false});gl.clear(gl.DEPTH_BUFFER_BIT);}else{
 gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,VW,VH);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);
 gl.useProgram(pSky.p);gl.uniformMatrix4fv(U(pSky,"uInvVP"),false,iVP);gl.uniform3fv(U(pSky,"uCam"),eye);gl.uniform3fv(U(pSky,"uSun"),SUN);
 gl.uniform3fv(U(pSky,"uPC"),planetCenter());const radius=voyage.active?sites[primaryPlanet()].radius*120:R_PLANET;gl.uniform1f(U(pSky,"uPR"),0);gl.uniform1f(U(pSky,"uAR"),.001);gl.uniform3fv(U(pSky,"uTint"),[1,1,1]);gl.uniform1i(U(pSky,"uBodyCount"),0);gl.uniform1f(U(pSky,"uTime"),game.time);
 gl.bindVertexArray(quad);gl.drawArrays(gl.TRIANGLES,0,3);
 gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.depthMask(true);
 renderGlobeBodies(M.mul(M.persp(fov*PI/180,VW/VH,.1,1e8),V),eye);gl.clear(gl.DEPTH_BUFFER_BIT);
 }
 // Composite warp optics into the exterior before drawing the pressure hull and cockpit.
 warpEffects.render(warp.strength,game.time,VW,VH);
 gl.useProgram(pPBR.p);gl.uniformMatrix4fv(U(pPBR,"uVP"),false,VP);gl.uniform3fv(U(pPBR,"uCam"),eye);gl.uniform1f(U(pPBR,"uTime"),game.time);
 gl.uniform3fv(U(pPBR,"uSunDir"),SUN);gl.uniform3f(U(pPBR,"uSunCol"),4.2,3.95,3.6);
 const open=windows.reduce((s,w,i)=>s+(1-w.k)*(i===0?.6:.2),0);
 if(voyage.expedition.onStation){gl.uniform1f(U(pPBR,"uSunK"),.4);gl.uniform3f(U(pPBR,"uAmb"),.48,.57,.62);gl.uniform1i(U(pPBR,"uNL"),0);gl.uniform4f(U(pPBR,"uFl"),0,0,1,0);gl.uniform1f(U(pPBR,"uExp"),1.1);}
 else if(ext){gl.uniform1f(U(pPBR,"uSunK"),1);gl.uniform3f(U(pPBR,"uAmb"),.05,.08,.13);gl.uniform1i(U(pPBR,"uNL"),0);gl.uniform4f(U(pPBR,"uFl"),0,0,1,0);gl.uniform1f(U(pPBR,"uExp"),1.0);}
 else{gl.uniform1f(U(pPBR,"uSunK"),.12*open);gl.uniform3f(U(pPBR,"uAmb"),.014+.05*open,.018+.08*open,.026+.13*open);
  [...LIGHTS].sort((a,b)=>Math.hypot(...a.p.map((v,i)=>v-eye[i]))-Math.hypot(...b.p.map((v,i)=>v-eye[i]))).slice(0,6).forEach((L,i)=>{const lv=L.room<0?1:roomLevel(rooms[L.room]);lP.set(L.p,i*3);lC[i*3]=L.c[0]*L.i*lv;lC[i*3+1]=L.c[1]*L.i*lv;lC[i*3+2]=L.c[2]*L.i*lv;lR[i]=L.r;});
  gl.uniform3fv(U(pPBR,"uLP[0]"),lP);gl.uniform3fv(U(pPBR,"uLC[0]"),lC);gl.uniform1fv(U(pPBR,"uLR[0]"),lR);gl.uniform1i(U(pPBR,"uNL"),6);
  const f=fwd();gl.uniform4f(U(pPBR,"uFl"),game.flash&&game.mode==="play"?1:0,.9,14,0);
  gl.uniform3f(U(pPBR,"uFlP"),eye[0]+Math.cos(pl.yaw)*.18,eye[1]-.15,eye[2]-Math.sin(pl.yaw)*.18);gl.uniform3fv(U(pPBR,"uFlD"),f);gl.uniform1f(U(pPBR,"uExp"),1.35);}
 if(ext&&voyage.active){const station=sites.map((s,i)=>({s,i})).filter(x=>x.s.kind==='station').sort((a,b)=>distance(voyage.expedition,a.i)-distance(voyage.expedition,b.i))[0];if(station&&distance(voyage.expedition,station.i)<10){const p=bodyPosition(station.i),factor=Math.min(1,340/Math.max(1,Math.hypot(...p)));for(let k=0;k<2;k++){lP.set(p.map((x,j)=>(x+(j===0?(k?15:-15):0))*factor),k*3);lC.set([15,19,24].map(x=>x*(.9+.1*Math.sin(game.time*2+k))),k*3);lR[k]=70;}gl.uniform3fv(U(pPBR,'uLP[0]'),lP);gl.uniform3fv(U(pPBR,'uLC[0]'),lC);gl.uniform1fv(U(pPBR,'uLR[0]'),lR);gl.uniform1i(U(pPBR,'uNL'),2);}}
 gl.activeTexture(gl.TEXTURE0);gl.uniform1i(U(pPBR,"uMap"),0);
 for(const m of [...meshes.filter(m=>!(m.alpha<1)&&m.mat!==13),...meshes.filter(m=>m.alpha<1||m.mat===13)]){if(m.hidden)continue;if(m.zone==='station'){if(!voyage.expedition.onStation)continue;}else if(m.space){if(!voyage.active||voyage.expedition.onStation)continue;}else{if(voyage.expedition.onStation||m.ext!==ext)continue;}
  const alpha=m.mat===13?.76:(m.alpha??1);gl.uniform1f(U(pPBR,"uOpacity"),alpha);if(alpha<1){gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);}else gl.disable(gl.BLEND);gl.uniformMatrix4fv(U(pPBR,"uModel"),false,m.model);gl.uniform1i(U(pPBR,"uMat"),m.mat);gl.uniform3fv(U(pPBR,"uAlb"),m.col);
  gl.uniform1f(U(pPBR,"uMet"),m.met);gl.uniform1f(U(pPBR,"uRgh"),m.rgh);gl.uniform3fv(U(pPBR,"uEm"),m.em);gl.uniform1f(U(pPBR,"uUvS"),m.uv);gl.uniform4fv(U(pPBR,"uAux"),m.aux);
  gl.bindTexture(gl.TEXTURE_2D,m.tex||white);gl.bindVertexArray(m.geo.vao);gl.drawElements(gl.TRIANGLES,m.geo.count,gl.UNSIGNED_INT,0);}
 if(!ext&&!voyage.expedition.onStation){gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);gl.depthMask(false);gl.uniform1i(U(pPBR,"uMat"),9);gl.uniformMatrix4fv(U(pPBR,"uModel"),false,M.id());
  for(const g of glassMeshes){gl.bindVertexArray(g.vao);gl.drawElements(gl.TRIANGLES,g.count,gl.UNSIGNED_INT,0);}
  gl.depthMask(true);gl.disable(gl.BLEND);}
 const space=voyage.active&&!voyage.expedition.onStation?sites.map((s,i)=>({s,i})).filter(({s,i})=>s.kind==='station'&&distance(voyage.expedition,i)<80).map(({i})=>{const p=bodyPosition(i),scale=Math.min(1,340/Math.max(1,Math.hypot(...p)));return {index:i,position:p.map(v=>v*scale),scale};}):[];
 premium.frame({view:V,projection:P,width:VW,height:VH,time:game.time,dt:renderDT,onStation:voyage.expedition.onStation,pods:habitats.pods,space,exterior:ext});
}

/* ---- MFD drawing ---- */
function drawScreens(){const t=game.time,vs=flight.v*Math.sin(flight.pitch*PI/180);
 {const s=S1,x=s.x;chrome(s,"SHIP · ROOMS","#49c8ff");x.font="14px Consolas,monospace";
  rooms.slice(0,6).forEach((r,i)=>{const y=65+i*27;x.fillStyle="rgba(50,150,200,.12)";x.fillRect(16,y-18,s.w-32,26);x.fillStyle="#8fd8f5";x.textAlign="left";x.fillText(r.name,26,y);
   x.textAlign="right";x.fillStyle=r.on?"#7dffb0":"#46708a";x.fillText(r.on?"LIGHTS ON":"LIGHTS OFF",s.w-26,y);});
  x.fillStyle="#8fd8f5";x.textAlign="left";x.fillText("BULKHEADS "+doors.filter(d=>d.open>.5).length+" / "+doors.length+" OPEN",26,238);
  x.textAlign="left";x.fillStyle=flight.heat>.35?"#ff7a6b":"#8fd8f5";x.fillText("HULL TEMP "+Math.round(flight.heat*100)+"%",26,262);upload(s.t,s.cv);}
 {const s=S2,x=s.x,acc="#7dffb0";chrome(s,"ATTITUDE","#7dffb0");const cx=s.w/2,cy=170,R=100,ppd=4;
  x.save();x.beginPath();x.arc(cx,cy,R,0,PI*2);x.clip();x.translate(cx,cy);x.rotate(-(flight.roll||0));x.translate(-cx,-cy);x.fillStyle="#06243a";x.fillRect(cx-R,cy-R,2*R,2*R);x.fillStyle="#2a1a0c";x.fillRect(cx-R,cy+flight.pitch*ppd,2*R,2*R);
  x.strokeStyle=acc;x.lineWidth=2;x.beginPath();x.moveTo(cx-R,cy+flight.pitch*ppd);x.lineTo(cx+R,cy+flight.pitch*ppd);x.stroke();
  x.font="11px Consolas,monospace";x.textAlign="center";for(let d=-30;d<=30;d+=5){if(!d)continue;const y=cy+flight.pitch*ppd-d*ppd;x.strokeStyle="rgba(125,255,176,.7)";x.lineWidth=1;x.beginPath();x.moveTo(cx-30,y);x.lineTo(cx+30,y);x.stroke();x.fillStyle="#b6ffd6";x.fillText(d,cx+44,y+4);}
  x.restore();const raw=voyage.active?voyage.expedition:flight.body;const vv=raw?toBody(raw,raw.velocity):[0,0,-1],den=Math.max(.1,Math.abs(vv[2])),vx=cx+clamp(vv[0]/den*65,-75,75),vy=cy-clamp(vv[1]/den*65,-75,75);x.strokeStyle='#fff4b0';x.lineWidth=2;x.beginPath();x.arc(vx,vy,7,0,PI*2);x.moveTo(vx-16,vy);x.lineTo(vx-7,vy);x.moveTo(vx+7,vy);x.lineTo(vx+16,vy);x.stroke();x.strokeStyle=acc;x.beginPath();x.arc(cx,cy,R,0,PI*2);x.stroke();x.strokeStyle="#ffcb6b";x.lineWidth=3;x.beginPath();x.moveTo(cx-44,cy);x.lineTo(cx-12,cy);x.moveTo(cx+12,cy);x.lineTo(cx+44,cy);x.stroke();
  x.font="14px Consolas,monospace";x.fillStyle="#9fe8c4";x.textAlign="left";x.fillText("VEL "+flight.v.toFixed(0)+" m/s",16,290);x.textAlign="right";x.fillText("V/S "+(vs>=0?"+":"")+vs.toFixed(0)+" m/s",s.w-16,290);
  x.textAlign="left";x.fillText("PCH "+flight.pitch.toFixed(1)+"°",16,64);x.textAlign="right";x.fillText("ALT "+flight.A.toFixed(1)+" km",s.w-16,64);upload(s.t,s.cv);}
 {const s=S3,x=s.x,index=voyage.active?voyage.expedition.target:KEPLER,rows=scienceRows(sites[index],index),page=Math.floor(t/7)%Math.ceil(rows.length/4);chrome(s,'SCIENCE · '+sites[index].name.toUpperCase(),'#70dacc');x.textAlign='left';for(let i=0;i<4;i++){const row=rows[page*4+i];if(!row)continue;x.fillStyle='#6baea8';x.font='11px Consolas,monospace';x.fillText(row[0],18,66+i*53);x.fillStyle='#d1e8e5';x.font='12px Consolas,monospace';const text=row[1];x.fillText(text.slice(0,67),18,85+i*53);if(text.length>67)x.fillText(text.slice(67,134),18,100+i*53);}x.font='11px Consolas,monospace';x.fillStyle='#d8b67c';x.fillText('CATALOG '+(page+1)+'/'+Math.ceil(rows.length/4)+' · FULL RECORD: TABLET / NAVIGATION',18,304);upload(s.t,s.cv);}}


/* ============================ UPDATE ============================ */
function updateFlight(dt){if(surface||grounded||habitats.locked){if(habitats.locked){flight.v=0;flight.ap="none";if(flight.body)flight.body.velocity=[0,0,0];voyage.expedition.velocity=[0,0,0];voyage.expedition.autopilot=false;voyage.throttle=0;}stepVoyage(voyage,dt,{},game.story,true);return;}if(voyage.active||(flight.sharedWorld&&flight.ap==="none")){updateNavigation(dt);return;}
 const input=flightInput(),manualInput=Object.values(input).some(x=>x!==0);if(manualInput&&flight.ap!=='none'){flight.ap='none';flight.body=null;}if(voyage.pilot&&!game.tab&&keys.KeyB)issuePilot('brake');
 if(flight.ap==='none'){if(!flight.body)flight.body={orientation:fromEuler(flight.yaw||0,flight.pitch*PI/180,flight.roll||0),velocity:rotate(fromEuler(flight.yaw||0,flight.pitch*PI/180,flight.roll||0),[0,0,-flight.v/1000])};integrate(flight.body,dt,input,9);flight.pitch=flight.body.pitch*180/PI;flight.tp=flight.pitch;flight.yaw=flight.body.yaw;flight.roll=flight.body.roll;flight.v=Math.hypot(...flight.body.velocity)*1000;flight.A=clamp(flight.A+flight.body.velocity[1]*dt,55,40000);flight.warp=1;}else flight.body=null;
 if(flight.ap==="entry"){flight.tp=-6;flight.warp=12;if(flight.A<=60.5){flight.ap="hold";flight.A=60;game.surveyed=true;say("eva_hold");}}
 else if(flight.ap==="climb"){flight.tp=8;flight.warp=12;flight.v=Math.min(7640,flight.v+dt*flight.warp*40);if(flight.A>=400){flight.A=400;flight.ap="none";flight.tp=0;flight.warp=1;}}
 else if(flight.ap==="hold"){flight.tp=0;flight.warp=4;}
 else flight.warp=1;
 if(flight.ap!=="none")flight.pitch+=(flight.tp-flight.pitch)*Math.min(1,dt*.9);
 const dens=flight.A<140?Math.exp(-(flight.A-60)/25):0;
 if(flight.ap!=="climb"&&flight.ap!=="none")flight.v=Math.max(1800,flight.v-dens*flight.v*.012*dt*flight.warp);
 if(flight.ap!=="hold"&&flight.ap!=="none")flight.A=clamp(flight.A+flight.v*Math.sin(flight.pitch*PI/180)/1000*dt*flight.warp,55,40000);
 if(flight.A<=61)game.surveyed=true;if(flight.sharedWorld){const e=voyage.expedition,n=norm(e.position.map((v,i)=>v-sites[KEPLER].position[i]));e.position=sites[KEPLER].position.map((v,i)=>v+n[i]*(sites[KEPLER].radius+flight.A));e.orientation=fromEuler(flight.yaw||0,flight.pitch*PI/180,flight.roll||0);e.velocity=rotate(e.orientation,[0,0,-flight.v/1000]);}
 const ht=Math.min(1,dens*Math.pow(flight.v/7640,2)*1.5);flight.heat+=(ht-flight.heat)*Math.min(1,dt*.6);
}
function updateThermalShades(dt){if(grounded||surface||habitats.locked||warp.phase!=='idle')flight.heat*=Math.exp(-dt*.6);
 if(flight.heat>.35&&!game.autoShaded){game.autoShaded=true;game.shadeMemo=windows.map(w=>w.open);windows.forEach(w=>setWindow(w,false,true));say("eva_shades");SFX.alarm();if(game.tab)renderTab();}
 if(flight.heat<.15&&game.autoShaded){game.autoShaded=false;windows.forEach((w,i)=>setWindow(w,game.shadeMemo[i],true));say("eva_shades_up");if(game.tab)renderTab();}
}
function updateShip(dt){
 rooms.forEach(r=>{r.t+=dt;const lv=roomLevel(r);r.fix.em=[1.5*lv,1.85*lv,2.3*lv];});
 rooms[2].fix.em=rooms[2].fix.em.map((v,i)=>v*[1.1,.9,.7][i]);
 windows.forEach(w=>{const tgt=w.open?0:1;w.k+=(tgt-w.k)*Math.min(1,dt*2.2);w.mesh.model=w.modelFn(w.k);w.mesh.hidden=w.k<.005;});
 doors.forEach(d=>{
  if(d.locked){d.scan=-1;d.target=0;}
  if(d.scan>=0){d.scan+=dt;if(d.scan>=1.3){d.verified=true;d.scan=-1;d.granted=1;d.target=1;d.idle=0;SFX.grant();SFX.whoosh();if(!d.saidOnce){say("eva_grant");d.saidOnce=true;}}}
  const near=d.side?Math.abs(pl.x-d.x)<1.6&&Math.abs(pl.z-d.z)<1.3:Math.abs(pl.z-d.z)<1.6&&Math.abs(pl.x)<1.4;
  if(d.target&&!near){d.idle+=dt;if(d.idle>4){d.target=0;SFX.whoosh();}}else d.idle=0;
  d.open+=(d.target-d.open)*Math.min(1,dt*3.2);if(!d.target)d.granted=Math.max(0,d.granted-dt);
  d.mesh.model=M.T(0,d.open*2.15,0);if(d.exterior)d.exterior.model=M.mul(M.T(0,d.open*2.1,0),M.S(1,Math.max(.001,1-d.open),1));
  const aux=[d.scan>=0?1-d.scan/1.3:-1,d.scan>=0?1:0,d.granted,.6+.4*Math.sin(game.time*2)];d.pads.forEach(p=>p.aux=aux);});
 const open=1-windows[0].k;canopyGlow.em=[.15+.3*roomLevel(rooms[0]),.25+.45*roomLevel(rooms[0]),.4+.6*roomLevel(rooms[0])].map(v=>v*(.3+.7*open));
 winGlow.em=[.3,.4,.6].map(v=>v*Math.max(roomLevel(rooms[1]),roomLevel(rooms[2])));
 const p=.75+.25*Math.sin(game.time*9);engGlow.em=[1.2*p,2.2*p,4*p];
 const blink=(game.time%1.4)<.12?3:.05;navL.em=[blink,0,0];navR.em=[0,blink,0];
 consoleGlow.em=[.3,.9,1.5];}
let stepAcc=0;
function updatePlayer(dt){
 if(surface){updateSurfacePlayer(dt);return;}if(game.tab||game.cam!==0||voyage.pilot)return;
 let mf=0,ms=0;if(keys.KeyW||keys.ArrowUp)mf++;if(keys.KeyS||keys.ArrowDown)mf--;if(keys.KeyD||keys.ArrowRight)ms++;if(keys.KeyA||keys.ArrowLeft)ms--;
 const sp=(keys.ShiftLeft||keys.ShiftRight)?3.1:1.7,sy=Math.sin(pl.yaw),cy=Math.cos(pl.yaw);
 let wx=-sy*mf+cy*ms,wz=-cy*mf-sy*ms;const l=Math.hypot(wx,wz);if(l>0){wx/=l;wz/=l;}
 const k=Math.min(1,dt*10);pl.vx+=(wx*sp-pl.vx)*k;pl.vz+=(wz*sp-pl.vz)*k;
 const nx=pl.x+pl.vx*dt,nz=pl.z+pl.vz*dt;
 if(walkable(nx,pl.z))pl.x=nx;else pl.vx=0;if(walkable(pl.x,nz))pl.z=nz;else pl.vz=0;
 pl.crouch+=((keys.KeyC?1:0)-pl.crouch)*Math.min(1,dt*9);
 const spd=Math.hypot(pl.vx,pl.vz);pl.bob+=spd*dt*6.2;stepAcc+=spd*dt;if(stepAcc>.75){stepAcc=0;SFX.step();}
 pl.y=(habitats.swimming(pl)?.55:1.65)-pl.crouch*.55+Math.sin(pl.bob)*.02*Math.min(spd/2,1);}

/* ============================ HUD ============================ */
function hud(){if(surface){$('objd').textContent='Explore '+sites[surface.planet].name+' · R skimmer · E sample / reboard';$('tl').innerHTML=`SURFACE / ${sampleTerrain(surface.planet,surface.n).biome.toUpperCase()}<br>EXPLORED ${Math.round(surface.walked)} M<br>SPECIMENS ${(voyage.samples||[]).length}`;$('tr').textContent='EVA · SURFACE LINK ONLINE';$('prompt').textContent=hatchDistance()<6?'E · REBOARD SV-7':'E · COLLECT SPECIMEN';return;}atExchange=voyage.expedition.onStation&&pl.z<83;const vs=voyage.active?voyage.expedition.velocity[1]*1000:(flight.body?.velocity[1]*1000||flight.v*Math.sin(flight.pitch*PI/180));
 $("tl").innerHTML=`VEL <b>${flight.v.toFixed(0)}</b> M/S &nbsp; ALT <b>${flight.A.toFixed(1)}</b> KM<br>PITCH <b>${(flight.pitch>=0?"+":"")+flight.pitch.toFixed(1)}°</b> &nbsp; V/S <b>${(vs>=0?"+":"")+vs.toFixed(0)}</b> M/S<br>CAM <b>${["FIRST PERSON","PORT HULL","STARBOARD HULL","FORWARD HULL","THIRD PERSON / ORBIT"][game.cam]}</b>${game.flash?" · <b>LIGHT</b>":""}`;
 const now=new Date();$("tr").innerHTML=`${now.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}<br>AP <b>${flight.ap.toUpperCase()}</b>${flight.warp>1?" · ×"+flight.warp:""}<br>HEAT <b style="color:${flight.heat>.35?"#ff7a6b":"#eaf6ff"}">${Math.round(flight.heat*100)}%</b>`;
 $("heat").style.opacity=(flight.heat*.9*(game.cam===0?(1-windows[0].k*.85):1)).toFixed(3);
 if(voyage.active)$("tl").innerHTML+=`<br>SECTOR ${speed(voyage.expedition).toFixed(2)} KM/S · THRUST ${Math.round(voyage.throttle*100)}%<br>${sites[voyage.expedition.target].name.toUpperCase()} · ${distance(voyage.expedition).toFixed(2)} KM${voyage.pilot?" · PILOT":""}`;
 const h=pick();const pr=$("prompt");if(h&&!game.tab){pr.textContent="[ E / CLICK ]  "+(typeof h.label==="function"?h.label():h.label);pr.style.opacity=1;}else pr.style.opacity=0;
 $("ret").style.opacity=game.cam===0?.9:0;}

/* ============================ LOOP ============================ */
let last=performance.now(),scrAcc=0,hudAcc=0;
function frame(now){const dt=Math.min((now-last)/1000,.1);last=now;renderDT=dt;
 if(game.mode==="menu"){requestAnimationFrame(loop);return;}
 if(document.hidden){requestAnimationFrame(loop);return;}
 game.time+=dt;voicePlayer.tick(dt);updateAmbience(dt);updateExtras(dt);

 habitats.update(dt);updateShip(dt);exteriorShades.update(dt,game.autoShaded,habitats.pods);
 scrAcc+=dt;if(scrAcc>.2){scrAcc=0;drawScreens();}
 if(A.amb){const target=(game.mode==="play"&&game.cam===0)||(game.mode==="cut"&&game.cutT>14.5)?.9:.25;A.amb.gain.value+=(target-A.amb.gain.value)*Math.min(1,dt*2);}
 if(game.mode==="cut"){
  if(premium.earthReady)game.cutT+=dt;const t=game.cutT;
  flight.A=t<12?400*Math.pow(100,1-ease(t/12)):400;
  while(cutNext<cutEvents.length&&t>=cutEvents[cutNext][0]){cutEvents[cutNext][1]();cutNext++;}
  premium.earthScene(t,VW,VH,dt,voicePlayer.active?.who==='HALE');$('prompt').textContent=premium.earthReady?'EARTH · BEFORE THE JOURNEY · SPACE TO SKIP':'PREPARING CREW MODELS…';
  if(t>=CUT_LEN&&!voicePlayer.busy)endCutscene();
 } else if(game.mode==="scene"){sceneTime+=dt;const station=voyage.expedition.onStation;const e=station?[0,2.2,95]:sceneCamera===1?[-1.1,1.65,-4.1]:[0,2,-8];render(e,station?[0,1.6,82]:[0,1.6,-30],!station&&sceneCamera!==1,65);if(sceneTime>1&&!voicePlayer.busy)finishScene();}else {
  updateFlight(dt);updateThermalShades(dt);updatePlayer(dt);
  const shake=flight.heat>.2?(flight.heat-.2)*.02:0,sx=(Math.random()-.5)*shake,sy2=(Math.random()-.5)*shake;
  if(surface){renderSurface();}else if(game.cam===0){const e=[pl.x+sx,pl.y+sy2,pl.z],f=fwd();render(e,[e[0]+f[0],e[1]+f[1],e[2]+f[2]],false,voyage.pilot?Math.max(72,Math.atan(Math.tan(52*PI/180)/(VW/VH))*360/PI):72);}
  else if(game.cam===4){const r=orbit.distance,c=Math.cos(orbit.pitch);render([Math.sin(orbit.yaw)*r*c,3+Math.sin(orbit.pitch)*r,8+Math.cos(orbit.yaw)*r*c],[0,1.3,8],true,62);}
  else{const poses=[null,[[-8.4,3.3,25],[-2,1,-9]],[[8.4,3.3,25],[2,1,-9]],[[0,1.6,-10.7],[0,1.6,-30]]];const c=poses[game.cam];render(c[0],c[1],true,65);}
  if(!surface){entryEffects.render(flight.heat*.6,game.time);}
  hudAcc+=dt;if(hudAcc>.1){hudAcc=0;hud();storyTick();liveTab();}
 }
 requestAnimationFrame(loop);}
function loop(t){try{frame(t);}catch(e){fail("Runtime error: "+(e&&e.message?e.message:e));}}

/* ============================ MENU ============================ */
const mcv=$("mcv"),mx=mcv.getContext("2d");let mstars=[];
function mresize(){mcv.width=innerWidth;mcv.height=innerHeight;mstars=[];for(let i=0;i<320;i++)mstars.push([Math.random()*mcv.width,Math.random()*mcv.height,Math.random()*1.4+.2,Math.random()*6.28]);}
mresize();addEventListener("resize",mresize);
function menuLoop(t){if(game.mode!=="menu")return;const w=mcv.width,h=mcv.height;mx.fillStyle="#02060b";mx.fillRect(0,0,w,h);
 const g=mx.createRadialGradient(w*.5,h*1.55,h*.2,w*.5,h*1.55,h*1.15);g.addColorStop(0,"#0b2a45");g.addColorStop(.82,"#0a2238");g.addColorStop(.86,"rgba(70,150,255,.35)");g.addColorStop(.9,"rgba(0,0,0,0)");
 mstars.forEach(s=>{mx.globalAlpha=.4+.6*(.5+.5*Math.sin(t*.001*s[2]*2+s[3]));mx.fillStyle="#cfe6ff";mx.fillRect(s[0],s[1],s[2],s[2]);});mx.globalAlpha=1;
 mx.fillStyle=g;mx.fillRect(0,0,w,h);requestAnimationFrame(menuLoop);}
requestAnimationFrame(menuLoop);
function begin(story){if(loadVoyage()&&!confirm("Start a new session and replace the saved expedition?"))return;audioInit();game.story=story;$("menu").style.display="none";drawScreens();canvas.focus();
 if(story)startCutscene();else{premium.leaveEarth();game.mode="play";flight.A=400;voyage.active=true;voyage.phase=1;voyage.expedition.docked=0;}}
$("bStory").addEventListener("click",()=>begin(true));
$("bFree").addEventListener("click",()=>begin(false));
requestAnimationFrame(loop);

/* ====================== V4 EXPEDITION EXTENSIONS ======================
   The attached HTML's ship, shaders, interaction and score remain the base.
   Sector movement is simulated in km; geometry is rendered in ship coordinates.
*/
function notice(text){$('notice').textContent=text;$('notice').classList.add('show');clearTimeout(notice.timer);notice.timer=setTimeout(()=>$('notice').classList.remove('show'),4200);}
function togglePilot(){if(surface)return;if(game.mode!=='play'||voyage.expedition.onStation)return;if(!voyage.pilot&&(pl.z> -3.3||pl.z< -6.8||Math.abs(pl.x)>2.7)){notice('Walk to the cockpit to take the pilot seat.');return;}if(voyage.controlled>=0)releaseDrone();voyage.pilot=!voyage.pilot;setCam(0);pl.x=0;pl.z=voyage.pilot?-4.95:-4.1;pl.y=voyage.pilot?1.58:1.65;pl.yaw=0;pl.pitch=voyage.pilot?-.2:-.05;pl.vx=pl.vz=0;if(voyage.pilot&&game.tab){game.tab=false;$("tab").classList.remove("up");canvas.focus();}notice(voyage.pilot?'PILOT LINK — W/S forward/reverse · AD yaw · RF pitch · QE roll · Shift/Ctrl vertical · B brake. T navigation.':'Pilot link released.');}
function flightInput(){if(game.tab||!voyage.pilot||habitats.locked||grounded)return {};return {throttle:Number(!!keys.KeyW)-Number(!!keys.KeyS),turn:Number(!!keys.KeyA)-Number(!!keys.KeyD),pitch:Number(!!keys.KeyR)-Number(!!keys.KeyF),roll:Number(!!keys.KeyQ)-Number(!!keys.KeyE),vertical:Number(!!(keys.ShiftLeft||keys.ShiftRight))-Number(!!(keys.ControlLeft||keys.ControlRight)),lateral:Number(!!keys.KeyX)-Number(!!keys.KeyZ)};}
function updateNavigation(dt){if(warp.phase!=='idle'){const e=voyage.expedition,input=flightInput();if(Object.values(input).some(v=>typeof v==='number'&&v!==0)||keys.KeyB)cancelWarp(warp);const done=stepWarp(warp,e,dt);stepVoyage(voyage,dt,{},game.story,true);flight.v=speed(e)*1000;flight.pitch=e.pitch*180/PI;flight.roll=e.roll||0;flight.ap='warp';flight.A=(nearestWorld(e,sites)?.altitude||0)/1000;if(done){voyage.throttle=0;flight.ap='none';notice(e.message);saveGame();}return;}const e=voyage.expedition,input=flightInput();input.throttle=input.throttle||voyage.throttle;const old=[...e.position],world=nearestWorld(e,sites);if(voyage.pilot&&!game.tab&&keys.KeyB)issuePilot('brake');
 // Low-altitude RCS precision affects acceleration, not attitude or existing momentum.
 if(world&&world.altitude<500){for(const key of ['throttle','vertical','lateral'])if(input[key])input[key]*=.01+.99*clamp(world.altitude/500,0,1);}
 const heat=atmosphericForces(e,world,dt);if(!voyage.active)stepExpedition(e,dt,{...input,throttle:input.throttle||voyage.throttle,terrainFlight:true});stepVoyage(voyage,dt,{...input,throttle:input.throttle||voyage.throttle,terrainFlight:!e.autopilot},game.story);const contact=resolveTerrainContact(e,old,sites);
 if(contact){voyage.throttle=0;if(contact.soft){grounded={planet:contact.planet,radius:sites[contact.planet].radius*1000,n:[...contact.n],lander:[...contact.n],origin:[...contact.n],orientation:[...e.orientation],walked:0,samples:[],recall:0};notice('TOUCHDOWN · Flight state retained. Open the stern airlock to explore.');saveGame();}else{voyage.systems.faults[3]=true;notice('HARD CONTACT · Engines isolated. Repair, level the ship and approach below 12 m/s.');}}
 flight.v=speed(e)*1000;flight.pitch=e.pitch*180/PI;flight.roll=e.roll||0;flight.tp=flight.pitch;flight.ap=e.autopilot?'navigation':'none';flight.heat+=(heat-flight.heat)*Math.min(1,dt*2);if(e.onStation)return;flight.A=(nearestWorld(e,sites)?.altitude||0)/1000;}

function startScene(ids){if(!ids.length)return;game.mode='scene';sceneTime=0;sceneCamera=voyage.phase===7?1:0;game.tab=false;$('tab').classList.remove('up');document.exitPointerLock?.();document.body.classList.add('cine');ids.forEach(say);}
function finishScene(){voicePlayer.stop();game.mode='play';document.body.classList.remove('cine');sceneTime=0;canvas.focus();}
function saveGame(){if(warp.phase!=='idle'){warp.saveRequested=true;notice('Save queued for the controlled warp exit.');return false;}voyage.habitats=habitats.save();voyage.grounded=grounded;voyage.shipState={lights:rooms.map(r=>r.on),doors:doors.map(d=>!!d.verified),windows:windows.map(w=>w.open)};voyage.surface=surface;const ok=saveVoyage(voyage,{step:game.step,altitude:flight.A,story:game.story});if(!ok)notice('Save unavailable. Browser storage may be blocked or full.');return ok;}
function boardStation(){if(!command(voyage,'board')){notice(voyage.expedition.message);return;}voyage.pilot=false;voyage.controlled=-1;setCam(0);pl.x=0;pl.z=97;pl.y=1.65;pl.yaw=0;pl.pitch=0;game.tab=false;$('tab').classList.remove('up');notice('Exchange ahead. Return through the rear airlock to reboard.');}
function returnFromStation(){if(!voyage.expedition.onStation||pl.z<94){notice('Walk back to the rear airlock first.');return;}command(voyage,'return');pl.x=0;pl.z=-4.1;pl.yaw=0;pl.pitch=0;setCam(0);atExchange=false;saveGame();}
const roomLabels=['COCKPIT','CORRIDOR / QUARTERS','STORAGE / SCIENCE','ENGINEERING'];
function systemsHTML(){return '<h3>ATMOSPHERE & MAINTENANCE</h3><div class="hint">REMOTE REPAIR / SAFE COMPARTMENT ISOLATION</div>'+roomLabels.map((n,i)=>`<div class="row"><div>${n}<small>${voyage.systems.pressure[i].toFixed(0)}% · ${voyage.systems.temperature[i].toFixed(0)}°C · ${voyage.systems.faults[i]?'ISOLATED':'STABLE'}</small></div><div><button data-act="repair:${i}">REPAIR</button></div></div>`).join('')+`<div class="row"><span>INTRUDERS ${voyage.systems.intruders}</span><button data-act="security">SECURITY PULSE</button></div>`;}
function dronesHTML(){return '<h3>MICROBOT SERVICE SWARM</h3>'+voyage.drones.map((d,i)=>`<div class="row"><div>${d.name}<small>${d.hp.toFixed(0)}% · ${roomLabels[d.room]}</small></div><div><button data-act="drone:${i}" ${d.hp<=0?'disabled':''}>${voyage.controlled===i?'RELEASE':'CONTROL'}</button></div></div>`).join('')+'<div class="hint">Invisible microbots / remote optical link. WASD and mouse: link motion. E repairs the current compartment. Destroyed links return to crew.</div>';}
function navigationHTML(){const e=voyage.expedition;return `<h3>ASTERION REACH / ${sites.length} DESTINATIONS</h3><div class="hint">${game.story?objectives[voyage.phase]:'FREE EXPLORATION — SPACE & STATIONS'}</div><button data-act="pilot">${voyage.pilot?'LEAVE PILOT SEAT':'TAKE PILOT SEAT'}</button><div class="row"><div>${e.credits} CR<small>DRIVE ${e.engine}/3 · SCANNER ${e.sensor}/3</small></div><button data-act="save">SAVE</button></div><label for="target">DESTINATION</label><select id="target">${sites.map((s,i)=>`<option value="${i}" ${e.target===i?'selected':''}>${s.name} · ${s.kind}</option>`).join('')}</select><div class="row"><div>${sites[e.target].name}<small data-nav="range">${distance(e).toFixed(2)} KM · ${speed(e).toFixed(2)} KM/S</small></div><div data-nav="course">${e.autopilot?'AUTO':e.docked>=0?'DOCKED':'MANUAL'}</div></div><div class="hint" data-nav="message">${e.message}</div>
 ${e.onStation?`<div class="hint" data-nav="exchange">${atExchange?'EXCHANGE CONNECTED':'WALK FORWARD TO THE EXCHANGE'}</div><div class="grid2"><button data-act="nav:sell">ARCHIVE · ${pendingCredits(e)} CR</button><button data-act="nav:engine">DRIVE UPGRADE</button><button data-act="nav:sensor">SCANNER UPGRADE</button><button data-act="return">RETURN TO SHIP</button></div>`:`<div class="grid2">${e.docked>=0?'<button data-act="nav:undock">UNDOCK</button><button data-act="board">ENTER STATION</button>':'<button data-act="nav:navigate">ENGAGE / CANCEL COURSE</button><button data-act="nav:brake">BRAKE / HOLD</button><button data-act="nav:scan">SURVEY</button><button data-act="nav:recover">RECOVER ARTIFACT</button><button data-act="nav:dock">DOCK</button>'}</div><div class="row"><span>THRUST <b id="thrust-value">${Math.round(voyage.throttle*100)}%</b></span><input id="thrust" type="range" min="-100" max="100" value="${voyage.throttle*100}" aria-label="Ship thrust"></div>`}
 <button data-act="warp">${warp.phase==='idle'?'ENGAGE WARP CORRIDOR':'CANCEL WARP · CONTROLLED EXIT'}</button>${scienceHTML(sites[e.target],e.target)}<details><summary>DISCOVERY JOURNAL / ${e.scanned.length}</summary>${e.scanned.map(i=>`<h4>${sites[i].name}</h4><p>${sites[i].lore}</p>`).join('')||'<p>Survey a destination to begin your journal.</p>'}</details>`;}
function repairRoom(i){if(i<0||i>3)return;const r=dispatchRepair(voyage,i);notice(r.message);}
let crewPose=null;
function releaseDrone(){voyage.controlled=-1;if(crewPose)Object.assign(pl,crewPose);crewPose=null;setCam(0);}
function handleExtra(k,v){if(k==='warp'){if(warp.phase!=='idle'){cancelWarp(warp);return true;}if(!flightReady()||!voyage.pilot||!voyage.active){notice('Take the pilot seat and enter free navigation before warp.');return true;}const problem=engageWarp(warp,voyage.expedition,sites,scienceSystems);notice(problem||'Warp field charging. Systems remain visible throughout transit.');if(!problem){voyage.throttle=0;game.tab=false;$('tab').classList.remove('up');}return true;}if(k==='stream'){const enabled=!celestialRenderer.textures.stream.enabled;premium.models.setEnabled(enabled);catalogStream.setEnabled(enabled);celestialRenderer.textures.setEnabled(enabled);return true;}if(k==='assetclear'){premium.models.clear();celestialRenderer.textures.clear();return true;}if(k==='habdeploy'||k==='habstow'){habitats.request(v,k==='habdeploy');return true;}if(k==='disembark'){if(outerHatch.open>.85)disembark();else notice('Open the exterior hatch first.');return true;}if(k==='takeoff'){takeoff();return true;}if(k==='hatch'){useDoor(outerHatch);return true;}if(k==='pilotcmd'){issuePilot(v);return true;}else if(k==='yaw'||k==='roll'){issuePilot(k,+v);return true;}else if(k==='rover'){if(surface)surface.rover=!surface.rover;return true;}else if(k==='sample'){collectSample();return true;}else if(k==='surface'){landOnPlanet();}else if(k==='ascend'){leaveSurface();}else if(k==='recall'){recallLander();}else if(k==='quality'){renderScale=Number(v);resize();}else if(k==='mute'){A.muted=!A.muted;voicePlayer.setMuted(A.muted);if(A.master)A.master.gain.value=A.muted?0:.9;}else if(k==='pilot')togglePilot();else if(k==='save'){if(saveGame())notice('Expedition saved on this device.');}else if(k==='nav'){if(warp.phase!=='idle'){cancelWarp(warp);notice('Warp field braking before normal-space commands.');return true;}if(['navigate','undock'].includes(v)&&!flightReady())return true;if(surface){notice('Return to orbit before issuing ship commands.');return true;}command(voyage,v,atExchange);notice(voyage.expedition.message);saveGame();}else if(k==='board')boardStation();else if(k==='return')returnFromStation();else if(k==='repair')repairRoom(+v);else if(k==='security')voyage.systems.intruders=Math.max(0,voyage.systems.intruders-1);else if(k==='drone'){if(surface||voyage.expedition.onStation){notice('Return to the ship before linking microbot optics.');return true;}if(voyage.controlled===+v)releaseDrone();else if(voyage.drones[+v]?.hp>0){if(!crewPose)crewPose={x:pl.x,y:pl.y,z:pl.z,yaw:pl.yaw,pitch:pl.pitch};voyage.controlled=+v;voyage.pilot=false;pl.x=0;pl.y=1.2;pl.z=[-4,-1,8,14][voyage.drones[+v].room];setCam(0);if(game.tab)toggleTab();}}else if(k==='stopvoice')voicePlayer.stop();else return false;return true;}
tbody.addEventListener('change',e=>{if(e.target.id==='target'){cancelWarp(warp);selectTarget(voyage.expedition,+e.target.value);renderTab();}});
tbody.addEventListener('input',e=>{if(e.target.id==='thrust'){if(!voyage.pilot){e.target.value=0;notice('Take the pilot seat first.');return;}issuePilot('thrust',+e.target.value/100-voyage.throttle);e.target.value=voyage.throttle*100;$('thrust-value').textContent=Math.round(voyage.throttle*100)+'%';}});
const breathAudio=new Audio(breathURL);breathAudio.loop=true;breathAudio.volume=.16;
function updateExtras(dt){if(game.mode==='play'&&voyage.active&&!surface&&voyage.expedition.target===8&&!voyage.expedition.scanned.includes(8)&&distance(voyage.expedition)<2&&speed(voyage.expedition)>.35){voyage.sentinelExposure=(voyage.sentinelExposure||0)+dt;if(voyage.sentinelExposure>6&&!voyage.sentinelWarned){voyage.sentinelWarned=true;voyage.systems.faults[2]=true;notice('Sentinel interdiction: cargo circuit isolated. Hold position and survey to establish a handshake.');}}if(flight.heat>.85){voyage.heatExposure=(voyage.heatExposure||0)+dt;if(voyage.heatExposure>8&&!voyage.heatFault){voyage.heatFault=true;voyage.systems.faults[3]=true;notice('Coolant overload. Dispatch a service swarm or reset the engineering breakers.');}}if(game.mode==='play'){if(!voyage.active)stepVoyage(voyage,dt,{},false);if(game.story&&voyage.pending.length&&!voicePlayer.busy){const cues=voyage.pending.splice(0);if(voyage.phase===7)startScene(cues);else cues.forEach(say);}saveClock+=dt;if(saveClock>15){saveClock=0;saveGame();}if(voyage.controlled>=0&&voyage.drones[voyage.controlled].hp<=0){releaseDrone();$('signal-loss').classList.add('show');setTimeout(()=>$('signal-loss').classList.remove('show'),2000);}}
 const breathe=A.breath&&!A.muted&&game.mode==='play'&&game.cam===0&&!voyage.pilot&&!voyage.expedition.onStation;if(breathe){if(breathAudio.paused)breathAudio.play().catch(()=>{});}else breathAudio.pause();
 updatePilotHUD();if(game.tab&&page==='NAVIGATION'){const e=voyage.expedition;const q=k=>tbody.querySelector(`[data-nav="${k}"]`);if(q('range'))q('range').textContent=`${distance(e).toFixed(2)} KM · ${speed(e).toFixed(2)} KM/S`;if(q('message'))q('message').textContent=e.message+(e.scanning?` / ${Math.round(e.scanProgress*100)}%`:'');if(q('exchange'))q('exchange').textContent=atExchange?'EXCHANGE CONNECTED':'WALK FORWARD TO THE EXCHANGE';if(q('course'))q('course').textContent=e.autopilot?'AUTOPILOT':e.docked>=0?'DOCKED':'MANUAL';}
 updateSpaceMeshes();updateStationCrowd();
}
document.addEventListener('visibilitychange',()=>{last=performance.now();if(document.hidden){voicePlayer.pause();breathAudio.pause();A.ctx?.suspend();}else{voicePlayer.resume();A.ctx?.resume();}});addEventListener('pagehide',()=>{if(game.mode!=='menu')saveGame();voicePlayer.stop();breathAudio.pause();});
function restoreGame(){const saved=loadVoyage();if(!saved){notice('No valid save found on this device.');return;}audioInit();premium.leaveEarth();voyage=saved.voyage;game.story=saved.prologue.story;game.step=saved.prologue.step;game.mode='play';flight.A=saved.prologue.altitude;game.surveyed=game.step>=6;rooms[2].on=game.step>=2;doors.forEach(d=>d.verified=game.step>=3);flight.ap='none';flight.v=0;if(!voyage.active){flight.sharedWorld=true;const radius=Math.hypot(...voyage.expedition.position.map((v,i)=>v-sites[KEPLER].position[i]));if(radius>1000||voyage.expedition.docked>=0)initializeOrbitalWorld();}if(game.step===6&&flight.A>=399)flight.A=60;pl.x=0;pl.z=-4.1;$('menu').style.display='none';$('objd').textContent=voyage.active?objectives[voyage.phase]:STEPS[game.step].d;if(voyage.shipState){rooms.forEach((r,i)=>{r.on=voyage.shipState.lights[i]??r.on;});doors.forEach((d,i)=>d.verified=voyage.shipState.doors[i]??d.verified);windows.forEach((w,i)=>w.open=voyage.shipState.windows[i]??w.open);}habitats.restore(voyage.habitats);grounded=voyage.grounded||null;if(voyage.surface){surface=voyage.surface;pl.yaw=0;pl.pitch=-.1;}canvas.focus();}
$('bContinue').addEventListener('click',restoreGame);$('quickTablet').addEventListener('click',()=>{if(game.mode==='play')toggleTab();});$('quickPilot').addEventListener('click',togglePilot);$('quickInteract').addEventListener('click',()=>{if(game.mode==='play')interact();});
for(const button of document.querySelectorAll('[data-key]')){button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);keys[button.dataset.key]=true;});for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>keys[button.dataset.key]=false);}
let touch=null;canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&game.mode==='play'&&[0,4].includes(game.cam)){touch=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);}});canvas.addEventListener('pointermove',e=>{if(touch&&e.pointerType==='touch'){if(game.cam===4){orbit.yaw-=(e.clientX-touch[0])*.004;orbit.pitch=clamp(orbit.pitch+(e.clientY-touch[1])*.004,-.15,1.35);}else{pl.yaw-=(e.clientX-touch[0])*.004;pl.pitch=clamp(pl.pitch-(e.clientY-touch[1])*.004,-1.5,1.5);}touch=[e.clientX,e.clientY];}});for(const ev of ['pointerup','pointercancel'])canvas.addEventListener(ev,()=>touch=null);
const celestial=sites.map((s,i)=>({s,i})).filter(({s})=>['planet','moon'].includes(s.kind));
function primaryPlanet(){const e=voyage.expedition;if(['planet','moon'].includes(sites[e.target].kind))return e.target;return celestial.reduce((a,b)=>distance(e,a.i)<distance(e,b.i)?a:b).i;}
function toLocal(v){return toBody(voyage.expedition,v);}
function bodyPosition(i){const scale=['planet','moon'].includes(sites[i].kind)?1000:120;return toLocal(sites[i].position.map((x,j)=>(x-voyage.expedition.position[j])*scale));}
const planetTints={6:[.65,1,.85],7:[.8,.85,.95],10:[1.7,.55,.22],11:[.12,.65,1.5],12:[1.1,1.45,1.7],13:[1.5,1,.55]};
function setPlanetUniforms(){const p=voyage.active?primaryPlanet():6;gl.uniform3fv(U(pSky,'uTint'),voyage.active?(planetTints[p]||[1,1,1]):[1,1,1]);gl.uniform1f(U(pSky,'uStyle'),p===13?2:p===10?1:0);const others=voyage.active?celestial.filter(x=>x.i!==p).sort((a,b)=>distance(voyage.expedition,a.i)-distance(voyage.expedition,b.i)).slice(0,6):[];const b=new Float32Array(24),t=new Float32Array(18);others.forEach(({s,i},k)=>{b.set([...bodyPosition(i),s.radius*120],k*4);t.set(planetTints[i]||[.6,.7,.8],k*3);});gl.uniform1i(U(pSky,'uBodyCount'),others.length);gl.uniform4fv(U(pSky,'uBodies[0]'),b);gl.uniform3fv(U(pSky,'uTints[0]'),t);}
const spaceObjects=[];
for(let i=0;i<sites.length;i++){const site=sites[i];if(['planet','moon'].includes(site.kind))continue;const b=new B();if(site.kind==='station'){const parts=stationGeometry(B);for(const [key,geo] of Object.entries(parts)){const m=add(geo.build(),key==='light'?MAT.GLOW:MAT.EXT,key==='body'?[.12,.19,.25]:[.5,.56,.57],.8,.33,{em:key==='light'?[.2,.8,1.5]:[0,0,0]});m.space=true;spaceObjects.push({m,i});}continue;}else if(site.kind==='field'){for(let k=0;k<36;k++){const a=k*2.399;b.box([Math.cos(a)*k*2,Math.sin(k*3.1)*20,Math.sin(a)*k*2],[1+k%4,1.5,2]);}}else if(site.kind==='derelict'){for(let k=0;k<6;k++){b.box([Math.sin(k)*2,0,k*4],[3,.8,1.9]);b.box([3,2,k*4],[.12,2,.12]);}}else{const parts=alienGeometry(B);for(const [key,geo] of Object.entries(parts)){const m=add(geo.build(),key==='glyphs'?MAT.GLOW:MAT.EXT,key==='glyphs'?[.08,.8,.65]:[.065,.08,.09],.8,.3,{em:key==='glyphs'?[.05,1.2,.8]:[0,0,0]});m.space=true;m.alien=key==='glyphs';spaceObjects.push({m,i});}continue;}const m=add(b.build(),MAT.HULL,[.26,.34,.37],.65,.5);m.space=true;spaceObjects.push({m,i});}
const stationMeshes=[],citizens=[];
function stationPiece(b,color,em=[0,0,0]){const m=add(b.build(),em.some(x=>x)?MAT.GLOW:MAT.HULL,color,.3,.55,{em});m.zone='station';stationMeshes.push(m);return m;}
{const b=new B();b.box([0,-.1,90],[6,.1,10]);b.box([0,3.4,90],[6,.1,10]);for(const x of [-6,6])b.box([x,1.7,90],[.1,1.7,10]);for(const z of [80,100])b.box([0,1.7,z],[6,1.7,.1]);stationPiece(b,[.25,.35,.4]);}
{const b=new B();b.box([0,.6,81.3],[2.2,.6,.4]);for(const x of [-4.5,4.5])for(const z of [85,90,95]){b.box([x,.4,z],[.7,.4,1]);b.box([x,1,z],[.1,.8,1]);}stationPiece(b,[.5,.54,.48]);}
{const b=new B();for(const x of [-3,3])b.box([x,3.25,90],[.04,.02,9]);b.box([0,1.4,81],[1.6,.2,.02]);stationPiece(b,[.3,.7,.8],[.5,1.2,1.5]);}
function stationLabel(text,pos,size){const b=new B();b.plane(pos,[size,0,0],[0,-size*.15,0]);const m=add(b.build(),MAT.SCREEN,[1,1,1],0,.3,{tex:label(text,1024,128,48,'#91d4ec')});m.zone='station';}
stationLabel('EXPLORATION EXCHANGE',[-2.6,2.8,80.2],5.2);stationLabel('SV-7 / DOCK AIRLOCK',[-2,2.8,99.8],4);

const droneMeshes=[]; // Microbots are below visible scale. No floating drone props are rendered.
function updateSpaceMeshes(){for(const {m,i} of spaceObjects){if(m.alien)m.em=[.1,.9+.5*Math.sin(game.time*2),.7];const p=bodyPosition(i);if(m.sentinel!==undefined){const t=game.time*.25+m.sentinel*PI*2/3;p[0]+=Math.cos(t)*12;p[1]+=Math.sin(t*1.4)*4;p[2]+=Math.sin(t)*12;m.em=voyage.expedition.scanned.includes(8)?[.04,.35,.2]:[.7,.1,.03];}const len=Math.hypot(...p),scale=Math.min(1,340/Math.max(len,1));m.hidden=!voyage.active||distance(voyage.expedition,i)>80||(sites[i].kind==='station'&&premium.hasStation(i));m.model=M.mul(M.T(...p.map(x=>x*scale)),M.S(scale,scale,scale));}droneMeshes.forEach((m,i)=>{const d=voyage.drones[i];m.hidden=d.hp<=0||voyage.controlled===i||voyage.expedition.onStation;m.model=M.T(Math.sin(game.time*.3+i)*.3,1.1+Math.sin(game.time+i)*.04,[-4,-1,3,3][d.room]);});}
function updateStationCrowd(){citizens.forEach((m,i)=>m.model=M.T((i%2?1:-1)*(2.7+i%3*.6),Math.sin(game.time*3+i)*.015,90+Math.sin(game.time*.12+i)*7));}
window.heliopause={get shadeCoverage(){return exteriorShades.fraction;},get warp(){return warp;},get models(){return premium.status;},get transit(){return landingTransit;},get surface(){return surface;},get planetAssets(){return {lunarTriangles:(celestialRenderer.lunar.geometry?.count||0)/3,lunarError:celestialRenderer.lunar.error,loaded:celestialRenderer.textures.loaded,online:celestialRenderer.textures.stream.enabled,status:celestialRenderer.textures.stream.status};},get terrainTriangles(){return terrainRenderer.triangleCount;},walkable,get habitats(){return habitats.pods;},get orbit(){return orbit;},get meshes(){return meshes;},get grounded(){return grounded;},version:'0.8.0-source-preview',game,flight,player:pl,rooms,doors,windows,get voyage(){return voyage;},voice:voicePlayer,sites,gl,get camera(){return game.cam;}};

/* ================== PILOT / SURFACE REFIT ================== */
let surface=null,landingTransit=null,grounded=null;
const entryEffects=createEntryEffects({gl,prog,U});
const celestialRenderer=createCelestialRenderer({gl,B,M,prog,U});
const premium=createPremiumRenderer(gl,canvas);
const starRenderer=createSystemRenderer({gl,B,M,prog,U,toLocal});
const warp=freshWarp(),warpEffects=createWarpEffects({gl,prog,U}),catalogStream=createAssetStream({manifest:catalogManifest});
catalogStream.load('exoplanets').then(bytes=>{if(!bytes)return;try{appendCatalog(sites,JSON.parse(new TextDecoder().decode(bytes)));celestial.splice(0,celestial.length,...sites.map((s,i)=>({s,i})).filter(({s})=>['planet','moon'].includes(s.kind)));}catch(e){console.warn('Catalog rejected',e.message);}});
const terrainRenderer=createSurfaceRenderer({gl,B,M,prog,U});
refitShip({B,M,MAT,add,meshes,rooms,LIGHTS,fixture,plac,label,makeDoor,AREAS,DOORAREAS,OBST,inter,openStorage:()=>{page='STORAGE';if(!game.tab)toggleTab();else renderTab();},openSystems:()=>{page='SYSTEMS';if(!game.tab)toggleTab();else renderTab();}});
function issuePilot(type,amount=0){if(warp.phase!=='idle'){cancelWarp(warp);notice('Warp field braking. Manual controls resume at field exit.');return;}if(flight.sharedWorld&&!voyage.active){const r=pilotCommand({...voyage,active:true},flight,type,amount);if(r.ok&&type==='thrust')voyage.throttle=clamp(voyage.throttle+amount,-1,1);if(r.ok&&type==='brake')voyage.throttle=0;if(r.ok)flight.ap='none';return r.ok;}if(!['brake','manual'].includes(type)&&!flightReady())return false;if(surface){notice('The ship is holding orbit. Return aboard to pilot.');return false;}const r=pilotCommand(voyage,flight,type,amount);if(!r.ok)notice(r.message);return r.ok;}
function pilotPanelHTML(){const e=voyage.expedition;return `<h3>FLIGHT CONTROL / DIRECT LINK</h3><div class="hint">${voyage.pilot?'PILOT AUTHORITY ACTIVE':'PILOT SEAT REQUIRED'} · ${e.docked>=0?'DOCKING CLAMPS ENGAGED':e.autopilot?'AUTOPILOT':'MANUAL'}</div><button data-act="pilot">${voyage.pilot?'LEAVE PILOT SEAT':'TAKE PILOT SEAT'}</button><div class="row"><div>THRUST <b data-pilot="throttle"></b><small data-pilot="velocity"></small></div><div>PITCH <b data-pilot="pitch"></b><small data-pilot="yaw"></small></div></div><div class="grid2">${e.docked>=0?'<button data-act="nav:undock">UNDOCK</button>':''}<button data-act="pilotcmd:manual">MANUAL</button><button data-act="nav:navigate">AUTOPILOT TO TARGET</button><button data-act="pilotcmd:brake">BRAKE / ZERO THRUST</button><button data-act="thr:2">THRUST +10%</button><button data-act="thr:-2">THRUST −10%</button><button data-act="pitch:5">PITCH UP 5°</button><button data-act="pitch:-5">PITCH DOWN 5°</button><button data-act="roll:0.0872665">ROLL LEFT</button><button data-act="roll:-0.0872665">ROLL RIGHT</button><button data-act="yaw:0.0872665">YAW LEFT 5°</button><button data-act="yaw:-0.0872665">YAW RIGHT 5°</button></div><div class="hint">W/S: forward/reverse · A/D: yaw · R/F: pitch · Q/E: roll · Shift/Ctrl: vertical · Z/X: strafe · B: brake<br>Close tablet to fly with the keyboard. Buttons remain usable with the tablet open.</div>`;}
const pilotHUD=document.createElement('section');pilotHUD.id='pilotHUD';pilotHUD.innerHTML='<div id="pilotReadout"></div><div class="pilotButtons"><button data-flight="manual">MANUAL</button><button data-flight="undock">UNDOCK</button><button data-flight="navigate">AUTOPILOT</button><button data-flight="brake">BRAKE</button></div>';document.body.append(pilotHUD);
pilotHUD.addEventListener('click',e=>{const a=e.target.dataset.flight;if(!a)return;if(warp.phase!=='idle'){cancelWarp(warp);return;}if(['undock','navigate'].includes(a)){if(!flightReady())return;command(voyage,a);notice(voyage.expedition.message);}else issuePilot(a);});
const surfaceHUD=document.createElement('section');surfaceHUD.id='surfaceHUD';surfaceHUD.innerHTML='<div id="surfaceReadout"></div><div class="pilotButtons"><button data-surface="sample">COLLECT SAMPLE</button><button data-surface="rover">R · SKIMMER</button><button data-surface="recall">REQUEST PICKUP</button><button data-surface="ascend">REBOARD SV-7</button></div>';document.body.append(surfaceHUD);surfaceHUD.addEventListener('click',e=>{if(e.target.dataset.surface)handleExtra(e.target.dataset.surface);});
function updatePilotHUD(){pilotHUD.hidden=game.mode!=='play'||!voyage.pilot||game.tab||!!surface;surfaceHUD.hidden=game.mode!=='play'||!surface||game.tab;const e=voyage.expedition;
 if(!pilotHUD.hidden){$('pilotReadout').textContent=voyage.active?`${warp.phase!=='idle'?'WARP '+warp.phase.toUpperCase():e.docked>=0?'DOCKED':e.autopilot?'AUTOPILOT':'MANUAL'} · THRUST ${Math.round(voyage.throttle*100)}% · ${(speed(e)*1000).toFixed(0)} M/S · PITCH ${(e.pitch*180/PI).toFixed(1)}° · ROLL ${((e.roll||0)*180/PI).toFixed(1)}°`:`KEPLER ORBIT · ${flight.ap.toUpperCase()} · ${flight.v.toFixed(0)} M/S · ${flight.A.toFixed(1)} KM`;const w=nearestWorld(e,sites);if(w&&!w.gas&&w.altitude<20000){const pitch=Math.asin(clamp(dot(rotate(e.orientation,[0,0,-1]),w.n),-1,1))*180/PI,roll=Math.atan2(dot(rotate(e.orientation,[1,0,0]),w.n),dot(rotate(e.orientation,[0,1,0]),w.n))*180/PI;$('pilotReadout').textContent+=` · AGL ${w.altitude.toFixed(1)} M · V/S ${(dot(e.velocity,w.n)*1000).toFixed(1)} M/S · LOCAL ${pitch.toFixed(1)}° / ${roll.toFixed(1)}°`;}pilotHUD.querySelector('[data-flight="undock"]').hidden=!voyage.active||e.docked<0;pilotHUD.querySelector('[data-flight="navigate"]').hidden=!voyage.active;}
 const vals={throttle:Math.round(voyage.throttle*100)+'%',velocity:(speed(e)*1000).toFixed(0)+' M/S',pitch:(e.pitch*180/PI).toFixed(1)+'°',yaw:'HEADING '+((e.yaw*180/PI%360+360)%360).toFixed(1)+'°'};tbody.querySelectorAll('[data-pilot]').forEach(n=>n.textContent=vals[n.dataset.pilot]);
 if(surface){const c=coordinates(surface.n);$('surfaceReadout').textContent=`${sites[surface.planet].name.toUpperCase()} · ${surface.rover?'SKIMMER':sampleTerrain(surface.planet,surface.n).height<0?'SWIMMING':'ON FOOT'} · ${c.latitude.toFixed(3)}°, ${c.longitude.toFixed(3)}° · SUIT ${Math.round(surface.suit??100)}% ${surface.hazard||''} · SHIP ${surface.recall>0?'INBOUND':Math.round(arcDistance(surface.n,surface.lander,surface.radius))+' M'}`;$('surfaceHUD').querySelector('[data-surface="ascend"]').disabled=surface.recall>0||hatchDistance()>6;$('quickPilot').disabled=true;}else $('quickPilot').disabled=false;
}
function landingCandidate(){return voyage.active?voyage.expedition.target:KEPLER;}
function landingBlocked(){if(habitats.locked)return "Compact all habitat modules before landing.";const i=landingCandidate(),e=voyage.expedition;if(!['planet','moon'].includes(sites[i].kind))return 'Select a planet or moon in NAVIGATION.';if(profile(i)==='gas')return 'Vesper is a gas giant with no solid landing surface. Survey it from orbit.';if(e.onStation||voyage.controlled>=0)return 'Return to the ship and release the microbot optical link first.';if(voyage.active&&e.docked>=0)return 'Undock before descending.';if(game.autoShaded||flight.heat>.35)return 'Wait for thermal lock to clear before launching the lander.';return '';}
function surfacePanelHTML(){if(grounded&&!surface)return `<h3>SV-7 / LANDED</h3><p>${sites[grounded.planet].name} · Landing gear secured. Walk aft through Science to the stern pressure airlock.</p><div class="grid2"><button data-act="hatch">${outerHatch.target?'CLOSE':'OPEN'} EXTERIOR HATCH</button><button data-act="disembark">DISEMBARK AT STERN RAMP</button><button data-act="takeoff">RELEASE CLAMPS / MANUAL LIFTOFF</button><button data-act="save">SAVE</button></div><p>Exterior hatch requires the inner hatch closed. Close both hatches and compact all habitats before launch.</p>`;if(surface){const c=coordinates(surface.n);return `<h3>${sites[surface.planet].name.toUpperCase()} / SURFACE</h3><p>Latitude ${c.latitude.toFixed(4)}° · Longitude ${c.longitude.toFixed(4)}°</p><p>${Math.round(surface.walked)} m explored · ${surface.samples.length} specimens collected</p><div class="grid2"><button data-act="sample">COLLECT GEOLOGICAL SAMPLE</button><button data-act="rover">${surface.rover?'DISMOUNT':'DEPLOY'} SURFACE SKIMMER</button><button data-act="recall">REQUEST PICKUP</button><button data-act="ascend">REBOARD SV-7</button><button data-act="save">SAVE SURFACE POSITION</button></div><div class="hint">WASD to explore · mouse/touch to look · R toggles skimmer<br>A complete procedural globe, with no map-edge barriers. Return to the stern ramp to reboard. Launch from the ship after closing the airlock.</div>`;}const reason=landingBlocked();return `<h3>PLANETARY EXPEDITION</h3><h4>${sites[landingCandidate()].name}</h4><p>Walk, swim or use the surface skimmer. Terrain, coastlines and biomes are generated in three dimensions across the entire globe. World sizes are compressed for exploration.</p><p>${reason||'Landing corridor clear. Fly directly into the atmosphere. Landing never starts a cinematic or relocates the ship.'}</p><button data-act="surface" ${reason?'disabled':''}>MANUAL DESCENT / RELEASE AUTOPILOT</button><div class="hint">Kepler-442b is available during the opening story. Other solid worlds are reached through NAVIGATION. Vesper has no solid ground.</div>`;}
function disembark(){if(!grounded||outerHatch.open<.85)return;if(pl.z<24.5||Math.abs(pl.x)>.6){notice('Walk through Science to the stern airlock before disembarking.');return;}surface=grounded;surface.n=surfaceOffset(surface,0,31.5);voyage.pilot=false;game.cam=0;pl.yaw=0;pl.pitch=-.06;game.tab=false;$('tab').classList.remove('up');saveGame();notice('Surface EVA. E at the stern ramp reboards SV-7.');}
function hatchDistance(){if(!surface)return Infinity;return arcDistance(surface.n,surfaceOffset(surface,0,28),surface.radius);}
function updateSurfacePlayer(dt){const arrived=stepPickup(surface,dt);syncSurfaceFlight(voyage.expedition,surface,sites,dt);if(arrived){terrainRenderer.free();saveGame();notice('SV-7 landed beside your position. Reboard at the stern ramp.');}if(stepEncounter(surface,dt)){surface.suit=100;surface.recall=0;surface.n=surfaceOffset(surface,0,31.5);leaveSurface();notice('Suit critical. Emergency extraction to the ship.');return;}if(game.tab){walkSurface(surface,0,0,dt);return;}const f=Number(!!(keys.KeyW||keys.ArrowUp))-Number(!!(keys.KeyS||keys.ArrowDown)),s=Number(!!(keys.KeyD||keys.ArrowRight))-Number(!!(keys.KeyA||keys.ArrowLeft));walkSurface(surface,-Math.sin(pl.yaw)*f+Math.cos(pl.yaw)*s,-Math.cos(pl.yaw)*f-Math.sin(pl.yaw)*s,dt);}
function renderSurface(){terrainRenderer.render(surface,pl.yaw,pl.pitch,VW,VH,game.time);}
function collectSample(){if(!surface)return;const t=sampleTerrain(surface.planet,surface.n),c=coordinates(surface.n),id=`${surface.planet}/${Math.floor(c.latitude*10)}/${Math.floor(c.longitude*10)}/${t.biome}`;voyage.samples??=[];if(voyage.samples.some(s=>s.id===id)){notice('This survey cell has already been sampled. Explore further.');return;}if(voyage.samples.length>=128){notice('Specimen storage is full.');return;}voyage.samples.push({id,planet:surface.planet,biome:t.biome});if(surface.samples.length<50)surface.samples.push(id);saveGame();notice(`${t.biome.toUpperCase()} specimen catalogued in STORAGE.`);}
function surfaceInteract(){if(surveyRelay(surface)){const e=voyage.expedition;if(!e.scanned.includes(surface.planet))e.scanned.push(surface.planet);say('eva_discovery');notice('Precursor relay decoded. Survey data added to the ship archive.');saveGame();return;}if(surface.recall===0&&hatchDistance()<=6)leaveSurface();else collectSample();}
function recallLander(){if(!surface)return;if(habitats.locked){notice('Compact all habitat modules in HABITAT before requesting pickup.');return;}outerHatch.target=innerHatch.target=0;if(requestPickup(surface))notice('SV-7 pickup inbound. Landing thrusters active; keep clear of the approach.');else notice('Pickup already inbound.');}
function leaveSurface(){if(!surface)return;if(hatchDistance()>6){notice('Return within 6 m of the stern ramp to reboard SV-7.');return;}grounded=surface;surface=null;voyage.surface=null;pl.x=0;pl.z=25;pl.y=1.65;pl.yaw=0;pl.pitch=0;pl.vx=pl.vz=0;outerHatch.target=0;game.tab=false;$('tab').classList.remove('up');saveGame();notice('Aboard SV-7. Exterior hatch closing. Open the inner airlock after pressure isolation.');}
function storageHTML(){const e=voyage.expedition,samples=voyage.samples||[];return `<h3>STORAGE / CARGO MANIFEST</h3><div class="hint">AFT OF QUARTERS · CONNECTED STORAGE, ENGINEERING & SCIENCE DECK</div><div class="row"><span>RECOVERED ARCHIVES</span><b>${e.recovered.filter(i=>!e.artifactSold.includes(i)).length}</b></div>${e.recovered.filter(i=>!e.artifactSold.includes(i)).map(i=>`<p>${sites[i].name} · secured for station exchange</p>`).join('')}<div class="row"><span>GEOLOGICAL SPECIMENS</span><b>${samples.length} / 128</b></div>${samples.map(s=>`<p>${sites[s.planet].name} · ${s.biome.toUpperCase()} · sealed specimen</p>`).join('')||'<p>No surface samples yet. Land on a solid world and collect specimens.</p>'}<div class="hint">Surface specimens are retained for research. Recovered story archives are sold at station exchanges.</div>`;}
function renderGlobeBodies(VP,eye){if(voyage.expedition.onStation)return;if(voyage.active)starRenderer.draw(VP,voyage.expedition,game.time);celestialRenderer.textures.focus(voyage.active?primaryPlanet():KEPLER);const bodies=voyage.active?celestial:[{i:KEPLER,s:sites[KEPLER]}];for(const {i,s} of bodies){const pos=(voyage.active||flight.sharedWorld)?bodyPosition(i):planetCenter(),r=(voyage.active||flight.sharedWorld)?s.radius*1000:R_PLANET,factor=1;const scale=r*factor;let rotation=M.id();if(voyage.active||flight.sharedWorld){const axes=[[1,0,0],[0,1,0],[0,0,1]].map(toLocal);axes.forEach((a,k)=>a.forEach((v,j)=>rotation[k*4+j]=v));}const model=M.mul(M.T(...pos.map(x=>x*factor)),M.mul(rotation,M.S(scale,scale,scale)));celestialRenderer.draw(i,model,VP,eye,game.time,(voyage.active||flight.sharedWorld)?toLocal(SUN):SUN);}}

// Engineering breaker: physical access is the non-microbot repair path.
{const b=new B();b.box([2.07,1.35,14],[.025,.35,.5]);add(b.build(),MAT.POLY,[.06,.09,.1],.5,.5);const handles=new B();for(const z of [13.7,14,14.3])handles.box([1.99,1.3,z],[.08,.17,.025]);add(handles.build(),MAT.TRIM,[.8,.5,.15],.6,.4);inter.unshift({label:()=> 'RESET ENGINEERING BREAKERS',box:{min:[1.8,.8,13.4],max:[2.15,1.8,14.6]},act:()=>{voyage.systems.faults.fill(false);notice('Breakers reset. Pressure seals and coolant pumps recovering.');SFX.clunk();saveGame();}});}

let alienAmbience=null;
function updateAmbience(dt){if(!A.ctx||!A.master)return;if(!alienAmbience)alienAmbience=createAlienAudio(A.ctx,A.master);let strength=0;if(game.mode==='play'){if(surface){const f=features(surface);strength=Math.max(.12,1-arcDistance(surface.n,f.relay,surface.radius)/100);}else if(voyage.active&&[5,8,9].includes(voyage.expedition.target))strength=clamp(1-distance(voyage.expedition)/15,0,1);}alienAmbience.update(dt,strength,A.muted||document.hidden);}

function landOnPlanet(){if(surface||grounded)return;if(!voyage.pilot){notice('Take the pilot seat. Fly the ship down manually; landing does not move or guide you.');return;}if(habitats.locked){notice('Compact all habitats before descent.');return;}voyage.expedition.autopilot=false;flight.ap='none';game.tab=false;$('tab').classList.remove('up');notice('MANUAL DESCENT · Pitch toward the surface, control thrust and brake. Level to local horizon; touchdown below 12 m/s. No landing autopilot.');}
function takeoff(){if(!grounded||surface||!voyage.pilot||habitats.locked||outerHatch.open>.01||outerHatch.target||innerHatch.open>.01||innerHatch.target){notice('Take the pilot seat, close both hatches and compact habitats before launching.');return;}const e=voyage.expedition;e.velocity=grounded.lander.map(v=>v*.008);grounded=null;voyage.grounded=null;flight.v=8;game.tab=false;$('tab').classList.remove('up');saveGame();notice('Landing clamps released. Manual flight: Shift/Ctrl vertical thrust; no target altitude or scripted climb.');}
// Pilgrim's guardians orbit its archive. Surveying decodes their IFF handshake.
for(let k=0;k<3;k++){const b=new B();b.cyl([0,-.6,0],.9,1.2,8,'y');for(let j=0;j<4;j++){const a=j*PI/2;b.box([Math.cos(a)*1.5,0,Math.sin(a)*1.5],[.5,.08,.5]);}const m=add(b.build(),MAT.EXT,[.15,.19,.19],.8,.3,{em:[.04,.18,.14]});m.space=true;m.sentinel=k;spaceObjects.push({m,i:8});}

const targetMarker=document.createElement('div');targetMarker.id='targetMarker';targetMarker.hidden=true;document.body.append(targetMarker);



// Compact bays keep no interior GPU buffers or collision objects alive.
const habitats=createHabitats({B,M,MAT,add,meshes,gl,AREAS,DOORAREAS,OBST,inter,doors,rooms,LIGHTS,plac,label,notice,useDoor,
 conditions:()=>({speed:voyage.active?speed(voyage.expedition):flight.v/1000,throttle:voyage.throttle,autopilot:voyage.expedition.autopilot||flight.ap!=='none',transit:!!surface?.pickup||warp.phase!=='idle',player:!surface&&!voyage.expedition.onStation?pl:null}),
 openPanel:()=>{page='HABITAT';if(!game.tab)toggleTab();else renderTab();},save:saveGame,changed:()=>{if(game.tab&&page==='HABITAT')renderTab();}});
function flightReady(){if(habitats.locked){notice('FLIGHT INTERLOCK · Compact all habitat modules before moving.');return false;}if(grounded){notice('Landed. Use SURFACE → RELEASE CLAMPS / MANUAL LIFTOFF first.');return false;}if(outerHatch.open>.01||outerHatch.target){notice('Close the exterior hatch before flight.');return false;}return true;}
canvas.addEventListener('wheel',e=>{if(game.cam===4){e.preventDefault();orbit.distance=clamp(orbit.distance+e.deltaY*.035,32,110);}},{passive:false});
// Recessed shade cassettes and warm brass/teal accents.
{const b=new B();b.box([0,2.38,-6.94],[2.5,.065,.06]);for(const [x,z]of [[1.13,-1],[-2.43,3]])b.box([x,2.2,z],[.06,.05,1.05]);add(b.build(),MAT.TRIM,[.52,.36,.16],.7,.35);}
{const b=new B();for(const x of [-.58,.86])b.box([x,.04,-1],[.025,.012,1.65]);add(b.build(),MAT.GLOW,[.05,.35,.3],.3,.4,{em:[.02,.15,.13]});}
// Pressure airlock: independently animated inner and outer hatches, mutually interlocked.
const innerHatch=makeDoor(23.05,23.05,'STERN AIRLOCK'),outerHatch=makeDoor(26,26,'EXTERIOR HATCH');innerHatch.airlock='inner';outerHatch.airlock='outer';innerHatch.systems=outerHatch.systems=[];
DOORAREAS.push({a:[-.31,22.65],b:[.31,23.55],d:doors.indexOf(innerHatch)},{a:[-.31,25.6],b:[.31,26.4],d:doors.indexOf(outerHatch)});AREAS.push({a:[-.34,23.35],b:[.34,25.72]});
{const b=new B();b.box([0,-.05,24.6],[.7,.05,1.65]);b.box([0,2.65,24.6],[.7,.05,1.65]);for(const x of [-.7,.7])b.box([x,1.3,24.6],[.07,1.3,1.65]);add(b.build(),MAT.HULL,[.28,.42,.43],.3,.5).exteriorInterior=true;const cap=new B();for(const x of [-1.5,1.5])cap.box([x,1.3,26],[.8,1.3,.06]);cap.box([0,2.4,26],[.7,.3,.06]);add(cap.build(),MAT.EXT,[.24,.39,.4],.5,.4,{ext:true});outerHatch.exterior=add(outerHatch.mesh.geo,MAT.EXT,[.7,.43,.15],.5,.4,{ext:true});const ramp=new B();ramp.box([0,-.12,27.2],[.7,.08,1.2]);add(ramp.build(),MAT.EXT,[.26,.32,.33],.6,.5,{ext:true});}
function airlockAllowed(d){if(d===outerHatch){if(!d.target&&exteriorShades.fraction>.01){notice('Retract the exterior nano-laminate before opening the airlock.');return false;}if(!grounded&&voyage.expedition.docked<0){notice('Vacuum interlock. Land or dock before opening the exterior hatch.');return false;}if(innerHatch.open>.01||innerHatch.target){innerHatch.target=0;notice('Inner hatch closing. Wait for pressure isolation.');return false;}}else if(outerHatch.open>.01||outerHatch.target){outerHatch.target=0;notice('Exterior hatch closing. Wait for pressure isolation.');return false;}return true;}
inter.unshift({label:()=>outerHatch.open>.85?'DISEMBARK SV-7':'OPEN EXTERIOR HATCH',box:{min:[-.6,.5,25.85],max:[.6,2.2,26.1]},act:()=>{if(outerHatch.open>.85){if(grounded)disembark();else if(voyage.expedition.docked>=0)boardStation();}else useDoor(outerHatch);}});
for(const side of [-1,1])for(let k=0;k<6;k++){
 const placed=placeModel({B,add},'space-station/wall-detail',{position:[side*5.83,0,82+k*3],height:3.2,yaw:side*Math.PI/2});placed.forEach(m=>{m.zone='station';stationMeshes.push(m);});
}
for(const [key,pos,height,yaw]of [['space-station/table-display-planet',[3.3,0,84],1.3,0],['space-station/computer-wide',[-4.3,0,86],1.4,Math.PI/2],['furniture/loungeSofaLong',[4.4,0,92],1,-Math.PI/2],['furniture/pottedPlant',[-4.8,0,96],1.8,0],['furniture/pottedPlant',[4.8,0,96],1.8,0]])placeModel({B,add},key,{position:pos,height,yaw}).forEach(m=>{m.zone='station';stationMeshes.push(m);});
for(let i=0;i<sites.length;i++)if(sites[i].kind==='station')for(const [key,pos,height]of [['space/hangar_largeA',[0,-8,-17],8],['space/satelliteDish_detailed',[0,19,0],7],['space/craft_cargoA',[12,-6,-17],3]])placeModel({B,add},key,{position:pos,height}).forEach(m=>{m.space=true;spaceObjects.push({m,i});});

terrainRenderer.setShipSource(()=>meshes.filter(m=>(m.ext||m.exteriorInterior)&&!m.hidden));

innerHatch.exterior=add(innerHatch.mesh.geo,MAT.EXT,[.24,.42,.4],.35,.6,{ext:true});

function initializeOrbitalWorld(){if(voyage.active)return;const e=voyage.expedition,n=norm([0,.6,1]);e.docked=-1;e.target=KEPLER;e.position=sites[KEPLER].position.map((v,i)=>v+n[i]*(sites[KEPLER].radius+flight.A));e.velocity=[0,0,0];flight.v=0;e.orientation=fromEuler(0,0,0);e.autopilot=false;flight.sharedWorld=true;}
terrainRenderer.setPlanetTextureSource(i=>celestialRenderer.textures.get(i));

// Twelve additional observation windows, with external shutter meshes and pressure glass.
for(const z of [6.15,9.85,12.15,15.85,18.15,21.85])for(const side of [-1,1]){
 const x=side*3.7,out=side*4.42,name=(side<0?'PORT':'STARBOARD')+' OBSERVATION '+z.toFixed(0);
 const pane=new B();pane.box([x,1.65,z],[.012,.55,.7]);glassMeshes.push(pane.build());
 const trim=new B();for(const y of [1.07,2.23])trim.box([x,y,z],[.05,.035,.75]);for(const dz of [-.73,.73])trim.box([x,1.65,z+dz],[.05,.58,.025]);add(trim.build(),MAT.TRIM,[.3,.4,.42],.7,.35);
 const ext=new B();ext.box([out,1.65,z],[.015,.55,.7]);add(ext.build(),MAT.GLASS,[.05,.16,.21],.6,.15,{ext:true,alpha:.7});
 makeWindow(name,b=>b.box([0,-.55,0],[.02,.55,.7]),k=>M.T(out,2.2,z),{min:[x-.16,1,z-.7],max:[x+.16,2.2,z+.7]});
}
const exteriorShades=createExteriorShades({B,M,add,windows,pods:habitats.pods});
