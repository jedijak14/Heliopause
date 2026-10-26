#pragma once
#include "ExplorationCore.h"
#include <limits>
namespace HPPlanet {
using Vec=HPFlight::Vec;
inline double dot(const Vec& a,const Vec& b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
inline double length(const Vec& a){return std::sqrt(dot(a,a));}
inline Vec unit(Vec a){const double l=length(a);for(auto& x:a)x/=l>1e-12?l:1;return a;}
inline double mix(double a,double b,double t){return a+(b-a)*t;}
inline double hash(double x,double y,double z,double seed){const double v=std::sin(x*127.1+y*311.7+z*74.7+seed*17.17)*43758.5453;return v-std::floor(v);}
inline double noise(Vec p,int seed){Vec i{},f{};for(int k=0;k<3;++k){i[k]=std::floor(p[k]);f[k]=p[k]-i[k];f[k]=f[k]*f[k]*(3-2*f[k]);}auto v=[&](int x,int y,int z){return hash(i[0]+x,i[1]+y,i[2]+z,seed);};return mix(mix(mix(v(0,0,0),v(1,0,0),f[0]),mix(v(0,1,0),v(1,1,0),f[0]),f[1]),mix(mix(v(0,0,1),v(1,0,1),f[0]),mix(v(0,1,1),v(1,1,1),f[0]),f[1]),f[2]);}
inline double fbm(const Vec& n,double scale,int seed){double sum=0,a=.55;for(int k=0;k<5;++k){sum+=noise({n[0]*scale,n[1]*scale,n[2]*scale},seed+k)*a;scale*=2.07;a*=.48;}return sum;}
inline double height(int i,const Vec& n){const double c=fbm(n,4,i+91),ridge=1-std::abs(2*fbm(n,22,i+91)-1),detail=fbm(n,110,i+91);double h=(c-.47)*460+std::pow(ridge,5)*48+(detail-.5)*7;if(i==11)h-=50;if(i==7||i==12)h+=28;if(i==10)h+=80;if(i==16)h=35+c*95+std::sin(n[0]*180+n[2]*60)*8;if(i==15)h+=70;return h;}
struct World{int planet=-1;double altitude=std::numeric_limits<double>::infinity(),radius=0;Vec n{0,1,0};};
inline World nearest(const HelioExplore::State& e){World out;for(int i=0;i<int(HelioExplore::Sites.size());++i){const auto& s=HelioExplore::Sites[i];if(s.kind!=HelioExplore::Kind::Planet&&s.kind!=HelioExplore::Kind::Moon)continue;Vec d=HelioExplore::minus(e.position,s.position);for(auto& x:d)x*=1000;const Vec n=unit(d);const double alt=length(d)-s.radius*1000-std::max(0.,height(i,n));if(alt<out.altitude)out={i,alt,s.radius*1000,n};}return out;}
inline double atmosphere(HelioExplore::State& e,const World& w,double dt){if(w.planet<0||w.planet==13||w.altitude>12000)return 0;const double density=std::exp(-std::max(0.,w.altitude)/2400),drag=std::exp(-density*.08*std::clamp(dt,0.,.1));for(auto& v:e.velocity)v*=drag;return std::min(1.,density*std::pow(length(e.velocity)/1.5,3));}
struct Contact{int planet=-1;bool soft=false;double speed=0;Vec n{0,1,0};};
inline Contact contact(HelioExplore::State& e,const Vec& old){const Vec delta=HelioExplore::minus(e.position,old);const double distance=length(delta)*1000;for(int i=0;i<int(HelioExplore::Sites.size());++i){const auto& s=HelioExplore::Sites[i];if(i==13||(s.kind!=HelioExplore::Kind::Planet&&s.kind!=HelioExplore::Kind::Moon))continue;const double r=s.radius*1000;if(length(HelioExplore::minus(old,s.position))*1000-distance>r+300)continue;
 auto normal=[&](double t){Vec p{};for(int k=0;k<3;++k)p[k]=old[k]+delta[k]*t-s.position[k];return unit(p);};auto clearance=[&](double t){Vec p{};for(int k=0;k<3;++k)p[k]=old[k]+delta[k]*t-s.position[k];return length(p)*1000-r-std::max(0.,height(i,unit(p)))-.45;};double last=0;const int count=std::clamp(int(std::ceil(distance/10)),1,512);for(int step=0;step<=count;++step){const double t=double(step)/count;if(clearance(t)<=0&&!(clearance(t)>-.001&&dot(e.velocity,normal(t))>0)){double lo=last,hi=t;for(int k=0;k<22;++k){const double mid=(lo+hi)*.5;if(clearance(mid)<=0)hi=mid;else lo=mid;}const auto n=normal(lo);const double ground=r+std::max(0.,height(i,n))+.45,speed=length(e.velocity)*1000;const bool soft=speed<=12&&dot(HPFlight::rotate(e.orientation,{0,1,0}),n)>.94;for(int k=0;k<3;++k)e.position[k]=s.position[k]+n[k]*ground/1000;e.velocity={0,0,0};e.autopilot=false;return {i,soft,speed,n};}last=t;}}
 return {};
}
}
