// Deterministic simulation clock for integration/capture tooling only. No runtime cheats or player controls.
export async function installManualClock(page){await page.addInitScript(()=>{
 let callbacks=[],clock=0,skipDraw=false;window.requestAnimationFrame=cb=>(callbacks.push(cb),callbacks.length);
 for(const method of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced']){const original=WebGL2RenderingContext.prototype[method];WebGL2RenderingContext.prototype[method]=function(...args){if(!skipDraw)return original.apply(this,args);};}
 window.advanceGame=(seconds,draw=false)=>{if(!clock)clock=performance.now();const n=Math.max(1,Math.ceil(seconds/.05));skipDraw=!draw;for(let i=0;i<n;i++){clock+=seconds*1000/n;const current=callbacks;callbacks=[];for(const cb of current)cb(clock);}skipDraw=false;};
});}
export const advance=(page,seconds,draw=false)=>page.evaluate(({seconds,draw})=>window.advanceGame(seconds,draw),{seconds,draw});
