#pragma once
#include <array>
#include <cmath>
#include <algorithm>
// Portable flight kernel, same units/conventions/equations as v4/flight-dynamics.js.
namespace HPFlight {
using Vec=std::array<double,3>;using Quat=std::array<double,4>;
inline Quat unit(Quat q){double l=0;for(double x:q)l+=x*x;l=std::sqrt(l);if(!std::isfinite(l)||l<1e-12)return {0,0,0,1};for(double& x:q)x/=l;return q;}
inline Quat mul(const Quat&a,const Quat&b){return {a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]};}
inline Vec rotate(const Quat&q,const Vec&v){const auto r=mul(mul(q,{v[0],v[1],v[2],0}),{-q[0],-q[1],-q[2],q[3]});return {r[0],r[1],r[2]};}
inline Quat euler(double y=0,double p=0,double r=0){return unit(mul(mul({0,std::sin(y/2),0,std::cos(y/2)},{std::sin(p/2),0,0,std::cos(p/2)}),{0,0,std::sin(r/2),std::cos(r/2)}));}
inline double axis(double v){return std::clamp(std::isfinite(v)?v:0.,-1.,1.);}
inline void integrate(Quat&q,Vec&v,double dt,double thrust,double yaw,double pitch,double roll,double vertical,double lateral,double limit=8){dt=std::clamp(std::isfinite(dt)?dt:0.,0.,.1);q=unit(mul(q,euler(axis(yaw)*dt*.65,axis(pitch)*dt*.65,axis(roll)*dt*.65)));const Vec a=rotate(q,{axis(lateral)*.6,axis(vertical)*.6,-axis(thrust)*2});double speed=0;for(int i=0;i<3;++i){v[i]+=a[i]*dt;speed+=v[i]*v[i];}speed=std::sqrt(speed);if(speed>limit)for(double& x:v)x*=limit/speed;}
inline bool valid(const Quat&q){double l=0;for(double v:q){if(!std::isfinite(v))return false;l+=v*v;}return std::abs(std::sqrt(l)-1)<.001;}
}
