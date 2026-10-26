import {profile} from './terrain.js';
import {createLunarModel} from './lunar-model.js';
import {createPlanetTextures} from './planet-textures.js';
// Analytic Rayleigh/Mie optical depth and finite-sample volumetric cloud shells.
// Embedded licensed maps/models are always available; verified HD maps are optional.
export const noiseGLSL=`
float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1)),f.x),f.y),f.z);}
float fbm(vec3 p){float s=0.,a=.5;for(int k=0;k<5;k++){s+=a*noise3(p);p=p*2.03+vec3(7.3,1.7,9.2);a*=.5;}return s;}
vec2 sphere(vec3 ro,vec3 rd,float r){float b=dot(ro,rd),h=b*b-dot(ro,ro)+r*r;if(h<0.)return vec2(-1);return vec2(-b-sqrt(h),-b+sqrt(h));}
vec3 tone(vec3 c){return pow(clamp(c*(2.51*c+.03)/(c*(2.43*c+.59)+.14),0.,1.),vec3(1./2.2));}
`;
const vertex=`#version 300 es
layout(location=0)in vec3 p;uniform mat4 vp,model;uniform float shellScale;out vec3 local;
void main(){local=p*shellScale;gl_Position=vp*model*vec4(p,1);}`;
const planetFS=`#version 300 es
precision highp float;in vec3 local;out vec4 o;uniform vec3 eye,sun;uniform float time,style,seed;uniform sampler2D albedoMap,cloudMap;uniform bool hasMap,hasCloud;
${noiseGLSL}
float crater(vec3 n){vec3 p=n*30.,cell=floor(p);float d=10.;for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++)for(int z=-1;z<=1;z++){vec3 i=cell+vec3(x,y,z),c=i+vec3(hash(i),hash(i+3.),hash(i+9.));d=min(d,length(c-p));}return .06*exp(-pow((d-.35)*18.,2.))-.04*exp(-d*d*28.);}
float relief(vec3 n){float h=fbm(n*22.+seed);if(style==2.||style==3.)h+=crater(n)*3.;return h;}
float cloud(vec3 p){float altitude=length(p)-1.;float layer=smoothstep(.008,.014,altitude)*(1.-smoothstep(.023,.03,altitude));vec3 n=normalize(p);vec2 uv=vec2(atan(n.z,n.x)/6.2831853+.5+time*.000005,asin(n.y)/3.14159265+.5);float field=hasCloud?texture(cloudMap,uv).r:fbm(p*8.+vec3(time*.001,0,seed));return smoothstep(.12,.7,field)*layer;}
void main(){vec3 n=normalize(local),v=normalize(eye-local),l=normalize(sun),t=normalize(cross(abs(n.y)>.9?vec3(1,0,0):vec3(0,1,0),n)),b=cross(n,t);float eps=max(.0015,max(length(dFdx(n)),length(dFdy(n)))*.6),h=relief(n);vec3 normal=normalize(n-t*(relief(normalize(n+t*eps))-h)*1.2-b*(relief(normalize(n+b*eps))-h)*1.2);
 float continental=fbm(n*4.+seed),detail=fbm(n*38.+seed),land=smoothstep(.46,.51,continental),ice=smoothstep(.78,.94,abs(n.y));vec3 albedo=mix(vec3(.008,.045,.09),mix(vec3(.05,.12,.035),vec3(.34,.25,.12),detail),land);float rough=mix(.12,.85,land);
 if(style==1.){land=smoothstep(.6,.66,continental);albedo=mix(vec3(.006,.075,.16),vec3(.12,.3,.19),land);} // Pelagos
 if(style==2.){float lava=smoothstep(.62,.72,fbm(n*42.+seed));albedo=mix(vec3(.045,.035,.03),vec3(1.1,.12,.008),lava);ice=0.;rough=.9;}
 if(style==3.){albedo=mix(vec3(.19,.29,.35),vec3(.76,.88,.91),smoothstep(.3,.6,continental+crater(n)));ice=0.;rough=.6;}
 if(style==4.){float dune=.5+.5*sin(n.y*130.+fbm(n*30.)*6.);albedo=mix(vec3(.34,.15,.045),vec3(.72,.43,.17),continental*.7+dune*.3);ice=0.;rough=.9;}
 if(style==5.){float bands=.5+.5*sin(n.y*85.+fbm(n*12.+vec3(time*.002,0,0))*7.);albedo=mix(vec3(.26,.12,.07),vec3(.85,.7,.43),bands);normal=n;ice=0.;rough=.9;}
 if(style==6.){albedo=mix(vec3(.12,.06,.2),vec3(.52,.38,.65),detail);ice=0.;rough=.5;}
 if(hasMap){vec2 uv=vec2(atan(n.z,n.x)/6.2831853+.5,asin(n.y)/3.14159265+.5);vec3 sampled=texture(albedoMap,uv).rgb;
 // Real Solar System reference maps, artist-tinted for fictional worlds, never claimed as measured exoplanet imagery.
 if(style==1.)sampled*=vec3(.55,.95,1.25);if(style==2.)sampled=sampled*vec3(.7,.42,.3)+vec3(.1,.005,0.)*smoothstep(.67,.75,detail);if(style==3.)sampled=mix(sampled,sampled*vec3(.7,1.1,1.3),.7);if(style==6.)sampled*=vec3(.9,.6,1.2);albedo=sampled;normal=normalize(mix(n,normal,.15));}
 albedo=mix(albedo,vec3(.8,.9,.95),hasMap?0.:ice);float ndl=max(0.,dot(normal,l)),spec=pow(max(0.,dot(normal,normalize(v+l))),mix(180.,12.,rough))*.5;float shadow=exp(-cloud(n*1.018+l*.012)*2.);vec3 c=albedo*(.025+ndl*1.6*shadow)+spec*ndl*shadow;
 if(style==2.)c+=vec3(1.,.06,.002)*smoothstep(.62,.72,fbm(n*42.+seed))*.8;
 // Sample the cloud volume between the solid surface and observer.
 vec3 rd=normalize(local-eye);vec2 shell=sphere(eye,rd,1.03);float start=max(0.,shell.x),end=length(local-eye);float stepSize=max(0.,end-start)/8.,trans=1.;vec3 cc=vec3(0.);if(style!=2.&&style!=3.&&style!=4.&&style!=5.&&style!=6.)for(int j=0;j<8;j++){vec3 p=eye+rd*(start+(float(j)+.5)*stepSize);float density=cloud(p),a=1.-exp(-density*stepSize*180.);float light=.025+.975*max(0.,dot(normalize(p),l));cc+=trans*a*vec3(.9,.94,1.)*light;trans*=1.-a;}c=c*trans+cc;o=vec4(tone(c),1);}
`;
const atmosphereFS=`#version 300 es
precision highp float;in vec3 local;out vec4 o;uniform vec3 eye,sun;uniform float style;
${noiseGLSL}
void main(){vec3 rd=normalize(local-eye),l=normalize(sun);vec2 hit=sphere(eye,rd,1.055);if(hit.y<0.)discard;float start=max(0.,hit.x),end=hit.y;vec2 ground=sphere(eye,rd,1.001);if(ground.x>0.)end=min(end,ground.x);float ds=(end-start)/12.;if(ds<=0.)discard;
 vec3 beta=vec3(5.8,13.5,33.1);if(style==2.||style==4.)beta=vec3(22.,15.,8.);if(style==6.)beta=vec3(19.,9.,28.);float od=0.;vec3 sum=vec3(0.);float mu=dot(rd,l),phase=.059683*(1.+mu*mu),g=.76,mie=(1.-g*g)/(12.566*pow(1.+g*g-2.*g*mu,1.5));
 for(int j=0;j<12;j++){vec3 p=eye+rd*(start+(float(j)+.5)*ds);float h=max(0.,length(p)-1.),density=exp(-h/.009);od+=density*ds;vec2 lightHit=sphere(p,l,1.055);float stepL=max(0.,lightHit.y)/4.,lightOD=0.;for(int k=0;k<4;k++){vec3 q=p+l*(float(k)+.5)*stepL;lightOD+=exp(-max(0.,length(q)-1.)/.009)*stepL;}float day=smoothstep(-.12,.02,dot(normalize(p),l));sum+=density*ds*exp(-beta*(od+lightOD))*day;}
 vec3 scattering=sum*(beta*phase+vec3(3.*mie))*2.;float alpha=clamp(1.-exp(-od*18.),0.,.8);o=vec4(scattering,alpha);}
`;
export function createCelestialRenderer({gl,B,M,prog,U}){
 const textures=createPlanetTextures(gl),lunar=createLunarModel(gl);
 const surface=prog(vertex,planetFS,'layered planet'),atmosphere=prog(vertex,atmosphereFS,'atmospheric scattering');
 const b=new B();for(let a=0;a<48;a++)for(let k=0;k<96;k++){const v=(j,i)=>{const p=j*Math.PI/48-Math.PI/2,t=i*Math.PI/48;return [Math.cos(p)*Math.sin(t),Math.sin(p),Math.cos(p)*Math.cos(t)];};const q=[v(a,k),v(a,k+1),v(a+1,k+1),v(a+1,k)];b.q(...q,q[0],[0,0,1,0,1,1,0,1],1);}const geo=b.build();
 const styles={11:1,10:2,7:3,12:3,16:4,13:5,15:6};
 function draw(i,model,vp,eye,time,sunDirection=[-.5,.65,.7]){const inv=M.inv(model),transform=(v,w)=>[0,1,2].map(j=>inv[j]*v[0]+inv[4+j]*v[1]+inv[8+j]*v[2]+inv[12+j]*w),localEye=transform(eye,1),sun=transform(sunDirection,0);
  function pass(p,scale){gl.useProgram(p.p);if(p===surface){const tex=i>=17&&profile(i)==='ocean'?null:textures.get(i),cloud=textures.clouds();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex||null);gl.uniform1i(U(p,'albedoMap'),0);gl.uniform1i(U(p,'hasMap'),tex?1:0);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,cloud||null);gl.uniform1i(U(p,'cloudMap'),1);gl.uniform1i(U(p,'hasCloud'),cloud?1:0);gl.activeTexture(gl.TEXTURE0);}gl.uniformMatrix4fv(U(p,'vp'),false,vp);gl.uniformMatrix4fv(U(p,'model'),false,M.mul(model,M.S(scale,scale,scale)));gl.uniform3fv(U(p,'eye'),localEye);gl.uniform3fv(U(p,'sun'),sun);gl.uniform1f(U(p,'shellScale'),scale);gl.uniform1f(U(p,'style'),styles[i]??({ocean:1,volcanic:2,ice:3,desert:4,gas:5,crystal:6}[profile(i)]||0));gl.uniform1f(U(p,'seed'),i*.731);gl.uniform1f(U(p,'time'),time);const mesh=p===surface&&[7,12].includes(i)&&lunar.geometry?lunar.geometry:geo;gl.bindVertexArray(mesh.vao);gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_INT,0);}
  gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);pass(surface,1);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);pass(atmosphere,1.055);gl.depthMask(true);gl.disable(gl.CULL_FACE);gl.disable(gl.BLEND);
 }return {draw,textures,lunar};
}
