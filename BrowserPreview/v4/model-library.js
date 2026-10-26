import models from './models.json' with {type:'json'};
/** Import the real CC0 triangle geometry into our lightweight WebGL mesh builder. */
export function modelParts(B,key,{position=[0,0,0],scale=1,yaw=0,height}={}){
 const asset=models[key];if(!asset)throw new Error(`Missing bundled model: ${key}`);
 const [lo,hi]=asset.bounds;if(height)scale=height/(hi[1]-lo[1]);const c=Math.cos(yaw),s=Math.sin(yaw),cx=(lo[0]+hi[0])/2,cz=(lo[2]+hi[2])/2;
 return asset.parts.map(part=>{const b=new B(),v=part.vertices;for(let k=0;k<v.length;k+=6){const x=(v[k]-cx)*scale,y=(v[k+1]-lo[1])*scale,z=(v[k+2]-cz)*scale,nx=v[k+3],ny=v[k+4],nz=v[k+5];b.v([position[0]+c*x+s*z,position[1]+y,position[2]-s*x+c*z],[c*nx+s*nz,ny,-s*nx+c*nz],0,0,1);b.i.push(b.i.length);}return {builder:b,color:part.color,alpha:part.alpha,source:key};});
}
export function placeModel(ctx,key,options={},flags={}){return modelParts(ctx.B,key,options).map(p=>{const m=ctx.add(p.builder.build(),8,p.color,.15,.6,flags);m.source=key;m.alpha=p.alpha;return m;});}
export const modelCatalog=Object.keys(models);
