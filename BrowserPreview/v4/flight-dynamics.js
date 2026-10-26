// Right-handed ship frame: +X starboard, +Y up, -Z forward. km, seconds, radians.
export const FLIGHT={angularRate:.65,acceleration:2,rcs:.6};
export const unit=q=>{const l=Math.hypot(...q);return l>1e-12&&Number.isFinite(l)?q.map(x=>x/l):[0,0,0,1];};
export function multiply(a,b){return [a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]];}
export function rotate(q,v){return multiply(multiply(q,[...v,0]),[-q[0],-q[1],-q[2],q[3]]).slice(0,3);}
export function fromEuler(yaw=0,pitch=0,roll=0){return unit(multiply(multiply([0,Math.sin(yaw/2),0,Math.cos(yaw/2)],[Math.sin(pitch/2),0,0,Math.cos(pitch/2)]),[0,0,Math.sin(roll/2),Math.cos(roll/2)]));}
export function validOrientation(q){return Array.isArray(q)&&q.length===4&&q.every(Number.isFinite)&&Math.abs(Math.hypot(...q)-1)<.001;}
export function orient(e){if(!validOrientation(e.orientation))e.orientation=fromEuler(e.yaw,e.pitch,e.roll||0);return e.orientation;}
export function attitude(e,yaw=0,pitch=0,roll=0){e.orientation=unit(multiply(orient(e),fromEuler(yaw,pitch,roll)));telemetry(e);}
export function telemetry(e){const q=orient(e),f=rotate(q,[0,0,-1]),u=rotate(q,[0,1,0]),r=rotate(q,[1,0,0]);e.yaw=Math.atan2(-f[0],-f[2]);e.pitch=Math.asin(Math.max(-1,Math.min(1,f[1])));e.roll=Math.atan2(r[1],u[1]);}
export function integrate(e,dt,input={},maxSpeed=8){dt=Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:0));const axis=k=>Math.max(-1,Math.min(1,Number.isFinite(input[k])?input[k]:0));attitude(e,axis('turn')*dt*FLIGHT.angularRate,axis('pitch')*dt*FLIGHT.angularRate,axis('roll')*dt*FLIGHT.angularRate);const a=rotate(e.orientation,[axis('lateral')*FLIGHT.rcs,axis('vertical')*FLIGHT.rcs,-axis('throttle')*FLIGHT.acceleration]);e.velocity=e.velocity.map((x,i)=>x+a[i]*dt);const speed=Math.hypot(...e.velocity);if(speed>maxSpeed)e.velocity=e.velocity.map(x=>x*maxSpeed/speed);return e;}
export function toBody(e,v){const q=orient(e);return rotate([-q[0],-q[1],-q[2],q[3]],v);}
