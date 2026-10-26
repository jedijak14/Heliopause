// Small visibility graph around inflated spherical bodies, evaluated when a course is set.
const dist=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
export function segmentClear(a,b,bodies){const d=b.map((x,i)=>x-a[i]),l=d.reduce((s,x)=>s+x*x,0);return bodies.every(o=>{const v=a.map((x,i)=>x-o.position[i]);const t=l?Math.max(0,Math.min(1,-v.reduce((s,x,i)=>s+x*d[i],0)/l)):0;return Math.hypot(...v.map((x,i)=>x+t*d[i]))>=o.radius+.3;});}
export function planRoute(start,goal,bodies){if(segmentClear(start,goal,bodies))return [goal];const nodes=[start,goal];for(const b of bodies)for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){const p=[...b.position];p[axis]+=sign*(b.radius+4);nodes.push(p);}const cost=nodes.map(()=>Infinity),prev=nodes.map(()=>-1),closed=new Set();cost[0]=0;
 for(let step=0;step<nodes.length;step++){let u=-1;for(let i=0;i<nodes.length;i++)if(!closed.has(i)&&(u<0||cost[i]<cost[u]))u=i;if(u<0||!Number.isFinite(cost[u]))break;if(u===1){const result=[];for(let v=1;v!==0;v=prev[v])result.unshift(nodes[v]);return result;}closed.add(u);for(let v=0;v<nodes.length;v++)if(!closed.has(v)&&segmentClear(nodes[u],nodes[v],bodies)){const n=cost[u]+dist(nodes[u],nodes[v]);if(n<cost[v]){cost[v]=n;prev[v]=u;}}}
 return [];
}
