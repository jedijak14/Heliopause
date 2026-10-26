// Authored modular silhouettes assembled from reusable, offline procedural parts.
export function stationGeometry(B){const b=new B(),trim=new B(),light=new B();
 for(let k=0;k<24;k++){const a=k*Math.PI/12,x=Math.cos(a)*18,y=Math.sin(a)*18;b.cyl([x,y,-2.8],1.6,5.6,12,'z');trim.cyl([x,y,-2.95],1.72,.18,12,'z');trim.cyl([x,y,2.8],1.72,.18,12,'z');light.box([x,y,-3.04],[.45,.08,.03]);}
 b.cyl([0,0,-12],3.1,24,32,'z');for(const z of [-10,-5,0,5,10])trim.cyl([0,0,z],3.4,.22,32,'z');
 for(const side of [-1,1]){for(let row=0;row<3;row++){const y=(row-1)*8;trim.box([side*26,y,3],[15,.16,.16]);for(let col=0;col<8;col++){const x=side*(17+col*3.3);b.box([x,y,3],[1.45,3.2,.06]);for(let cell=0;cell<8;cell++)trim.box([x,y-2.8+cell*.8,2.91],[1.44,.025,.015]);}}
 for(let k=0;k<6;k++){const z=-9+k*3;b.box([side*5,0,z],[1.2,1.1,1.25]);for(const stripe of [-.8,.8])trim.box([side*5+stripe,0,z],[.04,1.14,1.3]);light.box([side*6.25,0,z],[.03,.1,.4]);}
 for(let k=0;k<6;k++)b.cyl([side*3.5,-3,-10+k*4],.16,6,8,'y');}
 return {body:b,trim,light};}
export function alienGeometry(B){const body=new B(),glyphs=new B();
 // Broken hexagonal buttresses around a suspended archive spindle.
 for(let k=0;k<6;k++){const a=k*Math.PI/3,x=Math.cos(a)*5,z=Math.sin(a)*5;body.cyl([x,-4,z],.7,9+(k%2)*2,6,'y');for(let j=0;j<7;j++){glyphs.box([x+.72,-2+j*1.1,z],[.03,.22,.28]);glyphs.box([x,-1.7+j*1.1,z+.72],[.23,.035,.03]);}}
 body.cyl([0,-5,0],2.4,11,6,'y');for(let j=0;j<8;j++){const r=2.5+(j%2)*.5;body.cyl([0,-4+j*1.4,0],r,.18,18,'y');for(let k=0;k<6;k++){const a=k*Math.PI/3;glyphs.box([Math.cos(a)*2.5,-3.5+j*1.2,Math.sin(a)*2.5],[.16,.3,.16]);}}return {body,glyphs};}
export function outpostGeometry(B){const b=new B(),trim=new B(),light=new B();
 for(const x of [-6,6]){b.cyl([x,1,0],2.4,8,16,'z');for(const z of [0,4,8])trim.cyl([x,1,z],2.5,.12,16,'z');b.box([x,.1,4],[2.6,.15,4.5]);for(const z of [1,7])for(const side of [-1,1])trim.box([x+side*2,.7,z],[.1,.7,.1]);light.box([x,1,-.06],[.9,.08,.03]);}
 b.box([0,1.2,4],[4,1,1.2]);trim.cyl([0,1,5],.1,11,10,'y');trim.cyl([0,10.5,5],1.7,.2,16,'y');for(const x of [-10,10]){b.box([x,1.6,5],[1.8,.06,5]);for(let k=0;k<12;k++)trim.box([x,1.68,k*.8],[1.8,.02,.02]);}
 for(let k=0;k<4;k++){const x=-4+k*2.5;b.box([x,.55,-5],[.9,.55,.7]);for(const z of [-5.5,-4.5])trim.box([x,.6,z],[.95,.6,.03]);}return {body:b,trim,light};}
