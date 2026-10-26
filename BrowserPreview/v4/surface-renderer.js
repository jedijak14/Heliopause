import {basis,dot,norm,cross,moveOnGlobe,sampleTerrain,colors,arcDistance} from './terrain.js';
// A camera-relative terrain patch is resampled from the same globe used in orbit.
// Buffers are explicitly freed on every streaming rebuild.
export function createSurfaceRenderer({gl,B,M,prog,U}){
 const shader=prog(`#version 300 es
 layout(location=0)in vec3 p;layout(location=1)in vec3 n;uniform mat4 vp,model;out vec3 P,N;
 void main(){P=(model*vec4(p,1)).xyz;N=mat3(model)*n;gl_Position=vp*vec4(P,1);}`,`#version 300 es
 precision highp float;in vec3 P,N;uniform vec3 color,eye,fog;uniform float haze;out vec4 o;
 void main(){float light=.38+.68*max(0.,dot(normalize(N),normalize(vec3(-.5,.8,.3))));float grain=.96+.04*sin(P.x*2.3+sin(P.z*3.))*sin(P.z*4.2);vec3 c=color*light*grain;c=mix(c,fog,1.-exp(-length(P-eye)*haze));o=vec4(pow(max(c,vec3(0)),vec3(.78)),1);}`,'terrain');
 const sky=prog(`#version 300 es
 layout(location=0)in vec2 p;out vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,1,1);}`,`#version 300 es
 precision highp float;in vec2 uv;out vec4 o;uniform mat4 inv;uniform vec3 eye,tint;
 float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
 void main(){vec4 w=inv*vec4(uv*2.-1.,1.,1.);vec3 d=normalize(w.xyz/w.w-eye);float y=max(0.,d.y);vec3 c=mix(tint*1.3,tint*vec3(.35,.55,.85),pow(y,.45));float sun=max(0.,dot(d,normalize(vec3(-.5,.8,.3))));c+=vec3(1.,.85,.6)*(pow(sun,400.)*.7+pow(sun,24.)*.12);if(d.y>.02){vec2 p=d.xz/max(d.y,.08)*2.;float f=0.,a=.5;for(int k=0;k<4;k++){f+=noise(p)*a;p=p*2.03+13.;a*=.5;}float cloud=smoothstep(.48,.7,f)*smoothstep(.02,.2,d.y);c=mix(c,vec3(.87,.9,.9),cloud*.65);}o=vec4(c,1);}`,'surface sky');
 const skyVAO=gl.createVertexArray();gl.bindVertexArray(skyVAO);const skyBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,skyBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
 function cone(b,p,r,h,segments=9){for(let k=0;k<segments;k++){const a=k*Math.PI*2/segments,c=(k+1)*Math.PI*2/segments,A=[p[0]+Math.cos(a)*r,p[1],p[2]+Math.sin(a)*r],C=[p[0]+Math.cos(c)*r,p[1],p[2]+Math.sin(c)*r],tip=[p[0],p[1]+h,p[2]],N=norm([Math.cos((a+c)/2),r/h,Math.sin((a+c)/2)]);b.q(A,tip,tip,C,N,[0,0,.5,1,.5,1,1,0],1);b.q(p,A,C,p,[0,-1,0],[0,0,1,0,1,1,0,0],1);}}
 let anchor=null,parts=[],planet=-1;
 function free(){for(const p of parts){gl.deleteVertexArray(p.geo.vao);gl.deleteBuffer(p.geo.vb);gl.deleteBuffer(p.geo.ib);}parts=[];anchor=null;}
 function local(n,r,h){const b=basis(anchor),v=n.map((x,i)=>x*(r+h)-anchor[i]*r);return [dot(v,b.east),dot(v,b.up),dot(v,b.south)];}
 function piece(b,color){if(b.i.length)parts.push({geo:b.build(),color});}
 function rebuild(s){free();anchor=[...s.n];planet=s.planet;const groups={};const get=k=>groups[k]??(groups[k]=new B());
  function patch(size,steps,hole){const gap=size/steps,grid=[];for(let z=0;z<=steps;z++){const row=[];for(let x=0;x<=steps;x++){const n=moveOnGlobe(anchor,x*gap-size/2,z*gap-size/2,s.radius),t=sampleTerrain(s.planet,n);row.push({p:local(n,s.radius,Math.max(0,t.height)),t});}grid.push(row);}for(let z=0;z<steps;z++)for(let x=0;x<steps;x++){const cx=(x+.5)*gap-size/2,cz=(z+.5)*gap-size/2;if(hole&&Math.abs(cx)<hole&&Math.abs(cz)<hole)continue;const a=grid[z][x],b=grid[z+1][x],c=grid[z+1][x+1],d=grid[z][x+1],u=b.p.map((v,i)=>v-a.p[i]),v=d.p.map((v,i)=>v-a.p[i]);get(a.t.biome).q(a.p,b.p,c.p,d.p,norm(cross(u,v)),[0,0,0,1,1,1,1,0],1);}}
  patch(3072,96,96);patch(192,64,0);for(const [k,b]of Object.entries(groups))piece(b,colors[k]);
  // Stable globe-grid prop placement, not random regeneration around the player.
  const trees=new B(),trunks=new B(),stones=new B();const lat=Math.asin(anchor[1]),lon=Math.atan2(anchor[0],anchor[2]),cell=24/s.radius,ix=Math.floor(lon/cell),iy=Math.floor(lat/cell);
  for(let a=-7;a<=7;a++)for(let b=-7;b<=7;b++){const x=ix+a,y=iy+b,hash=Math.abs(Math.sin(x*12.9898+y*78.233+s.planet)*43758.5453)%1;if(hash<.32)continue;const phi=(y+.35)*cell,theta=(x+hash)*cell,n=[Math.cos(phi)*Math.sin(theta),Math.sin(phi),Math.cos(phi)*Math.cos(theta)],t=sampleTerrain(s.planet,n);if(t.height<2||arcDistance(n,s.lander,s.radius)<8||arcDistance(n,anchor,s.radius)>90)continue;const p=local(n,s.radius,t.height-.5),h=4+hash*7;
   if(t.biome==='grass'&&hash>.58){trunks.cyl(p,.2,h,6,'y');for(let j=0;j<3;j++)cone(trees,[p[0],p[1]+h*.3+j*h*.2,p[2]],(3-j)*.85,h*.5,9);}
   else{cone(stones,p,.8+hash*2,t.biome==='crystal'?h:1+hash*2,7);}}
  piece(trunks,[.26,.19,.12]);piece(trees,[.12,.29,.17]);piece(stones,sampleTerrain(s.planet,anchor).type==='crystal'?[.55,.4,.72]:[.36,.37,.33]);
 }
 const lander=new B();lander.box([0,1.6,0],[2,1.1,2.8]);lander.box([0,2.7,-1.6],[1.4,.35,1]);for(const x of [-2.5,2.5])for(const z of [-2,2]){lander.box([x,.65,z],[.12,.65,.12]);lander.box([x,.05,z],[.65,.05,.65]);}lander.box([0,.35,-3.5],[.8,.12,1.4]);const landerGeo=lander.build();const glass=new B();glass.box([0,2.15,-2.82],[1.3,.4,.02]);const glassGeo=glass.build();
 function render(s,yaw,pitch,w,h){if(!anchor||planet!==s.planet||arcDistance(anchor,s.n,s.radius)>35)rebuild(s);const t=sampleTerrain(s.planet,s.n),eye=local(s.n,s.radius,Math.max(0,t.height)+1.7+(s.rover?1:0));const f=[-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)],vp=M.mul(M.persp(72*Math.PI/180,w/h,.1,5000),M.look(eye,eye.map((x,i)=>x+f[i]),[0,1,0]));const fog=t.type==='desert'?[.58,.4,.26]:t.type==='crystal'?[.32,.27,.48]:t.type==='volcanic'?[.33,.24,.2]:[.32,.52,.64];
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,w,h);gl.clearColor(...fog,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.disable(gl.CULL_FACE);gl.disable(gl.BLEND);gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.disable(gl.DEPTH_TEST);gl.useProgram(sky.p);gl.uniformMatrix4fv(U(sky,'inv'),false,M.inv(vp));gl.uniform3fv(U(sky,'eye'),eye);gl.uniform3fv(U(sky,'tint'),fog);gl.bindVertexArray(skyVAO);gl.drawArrays(gl.TRIANGLES,0,3);gl.enable(gl.DEPTH_TEST);gl.useProgram(shader.p);gl.uniformMatrix4fv(U(shader,'vp'),false,vp);gl.uniform3fv(U(shader,'eye'),eye);gl.uniform3fv(U(shader,'fog'),fog);gl.uniform1f(U(shader,'haze'),.0009);
  function draw(geo,color,model){gl.uniformMatrix4fv(U(shader,'model'),false,model);gl.uniform3fv(U(shader,'color'),color);gl.bindVertexArray(geo.vao);gl.drawElements(gl.TRIANGLES,geo.count,gl.UNSIGNED_INT,0);}for(const p of parts)draw(p.geo,p.color,M.id());
  if(s.recall===0){const lp=local(s.lander,s.radius,Math.max(0,sampleTerrain(s.planet,s.lander).height));const model=M.T(...lp);draw(landerGeo,[.65,.66,.58],model);draw(glassGeo,[.05,.19,.25],model);}
 }
 const globes=new Map();
 function globe(i,radius,model,vp,eye){
  if(!globes.has(i)){const groups={};const vertex=(a,b)=>{const lat=a*Math.PI/32-Math.PI/2,lon=b*Math.PI/32,n=[Math.cos(lat)*Math.sin(lon),Math.sin(lat),Math.cos(lat)*Math.cos(lon)],t=sampleTerrain(i,n);return {n,p:n.map(x=>x*(1+Math.max(0,t.height)/radius)),biome:t.biome};};for(let a=0;a<32;a++)for(let b=0;b<64;b++){const q=[vertex(a,b),vertex(a+1,b),vertex(a+1,b+1),vertex(a,b+1)],key=q[0].biome,geo=groups[key]??(groups[key]=new B());geo.q(...q.map(v=>v.p),norm(q.reduce((v,t)=>v.map((x,j)=>x+t.n[j]),[0,0,0])),[0,0,0,1,1,1,1,0],1);}globes.set(i,Object.entries(groups).map(([key,b])=>({geo:b.build(),color:colors[key]})));}
  gl.useProgram(shader.p);gl.uniformMatrix4fv(U(shader,'vp'),false,vp);gl.uniformMatrix4fv(U(shader,'model'),false,model);gl.uniform3fv(U(shader,'eye'),eye);gl.uniform3f(U(shader,'fog'),0,0,0);gl.uniform1f(U(shader,'haze'),0);for(const p of globes.get(i)){gl.uniform3fv(U(shader,'color'),p.color);gl.bindVertexArray(p.geo.vao);gl.drawElements(gl.TRIANGLES,p.geo.count,gl.UNSIGNED_INT,0);}
 }
 return {render,free,globe,get triangleCount(){return parts.reduce((n,p)=>n+p.geo.count/3,0);}};
}
