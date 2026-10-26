#pragma once
#include "ExplorationCore.h"
#include "ScienceCatalog.h"
#include <limits>
#include <vector>

// Portable implementation of BrowserPreview/v4/warp.js. Positions/radii are game km,
// not astronomical distances. Unreal owns presentation and cockpit/airlock permissions.
namespace HPWarp {
using Vec = HelioExplore::Vec;
struct Body { Vec position; double radius; };
enum class Phase { Idle, Charging, Cruising, Braking };
inline const char* name(Phase p) {
    switch(p) {case Phase::Charging:return "CHARGING";case Phase::Cruising:return "CRUISING";
    case Phase::Braking:return "BRAKING";default:return "IDLE";}
}
inline double dot(const Vec& a,const Vec& b) {return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
inline Vec mix(const Vec& a,const Vec& b,double t) {Vec r{};for(int k=0;k<3;++k)r[k]=a[k]+(b[k]-a[k])*t;return r;}
inline double smooth(double t) {return t*t*t*(10+t*(-15+6*t));}
inline double derivative(double t) {return 30*t*t*(1-t)*(1-t);}
inline bool finite(const Vec& v) {return std::all_of(v.begin(),v.end(),[](double x){return std::isfinite(x);});}
inline std::vector<Body> exclusions() {
    std::vector<Body> result;
    for(const auto& s:HelioExplore::Sites)
        if(s.kind==HelioExplore::Kind::Planet||s.kind==HelioExplore::Kind::Moon)result.push_back({s.position,s.radius+4});
    for(const auto& s:HPScience::Stars)result.push_back({s.position,s.radius});
    return result;
}
inline bool segmentClear(const Vec& a,const Vec& b,const std::vector<Body>& bodies) {
    if(!finite(a)||!finite(b))return false;
    const auto d=HelioExplore::minus(b,a);const double l=dot(d,d);
    for(const auto& body:bodies) {
        if(!finite(body.position)||!std::isfinite(body.radius)||body.radius<0)return false;
        const auto v=HelioExplore::minus(a,body.position);
        const double t=l?std::clamp(-dot(v,d)/l,0.,1.):0;
        Vec closest{};for(int k=0;k<3;++k)closest[k]=v[k]+t*d[k];
        if(HelioExplore::length(closest)<body.radius+.3)return false;
    }
    return true;
}
inline std::vector<Vec> route(const Vec& start,const Vec& goal,const std::vector<Body>& bodies) {
    if(segmentClear(start,goal,bodies))return {goal};
    std::vector<Vec> nodes{start,goal};
    for(const auto& b:bodies)for(int axis=0;axis<3;++axis)for(int sign:{-1,1}) {
        auto p=b.position;p[axis]+=sign*(b.radius+4);nodes.push_back(p);
    }
    std::vector<double> cost(nodes.size(),std::numeric_limits<double>::infinity());
    std::vector<int> previous(nodes.size(),-1);std::vector<bool> closed(nodes.size(),false);cost[0]=0;
    for(size_t step=0;step<nodes.size();++step) {
        int u=-1;
        for(size_t i=0;i<nodes.size();++i)if(!closed[i]&&(u<0||cost[i]<cost[u]))u=int(i);
        if(u<0||!std::isfinite(cost[u]))break;
        if(u==1) {
            std::vector<Vec> result;
            for(int v=1;v!=0;v=previous[v])result.push_back(nodes[v]);
            std::reverse(result.begin(),result.end());return result;
        }
        closed[u]=true;
        for(size_t v=0;v<nodes.size();++v)if(!closed[v]&&segmentClear(nodes[u],nodes[v],bodies)) {
            const double next=cost[u]+HelioExplore::length(HelioExplore::minus(nodes[u],nodes[v]));
            if(next<cost[v]){cost[v]=next;previous[v]=u;}
        }
    }
    return {};
}
struct State {
    Phase phase=Phase::Idle;
    double elapsed=0,progress=0,strength=0,length=0,duration=0,rate=0;
    double abortElapsed=0,abortStart=0,abortRate=0,abortDuration=0;
    int destination=-1;
    HPFlight::Quat startOrientation{0,0,0,1};
    std::vector<Vec> curve;
    std::vector<double> distances;
    bool active()const{return phase!=Phase::Idle;}
};
// Shared, testable permission boundary; start() below also validates flight state.
struct Permissions {
    bool pilot=false,navigation=false,habitatsStowed=false,landed=false,airlocksClosed=false,crewAboard=false;
};
inline const char* blocked(const Permissions& p) {
    if(!p.pilot||!p.navigation||!p.crewAboard)return "Take the pilot seat in free navigation before warp.";
    if(!p.habitatsStowed)return "Compact all habitat modules before warp.";
    if(p.landed)return "Release landing clamps and climb before warp.";
    if(!p.airlocksClosed)return "Close both pressure hatches before warp.";
    return nullptr;
}
inline const char* start(State& w,HelioExplore::State& e,const std::vector<Body>& bodies=exclusions()) {
    if(w.active())return "Warp field is already active.";
    if(!e.valid()||!finite(e.velocity))return "Invalid flight state; warp refused.";
    if(e.docked>=0||e.onStation)return "Undock before charging the warp field.";
    if(e.speed()>.35)return "Brake below 350 m/s before charging warp.";
    const auto& target=HelioExplore::Sites[e.target];
    const auto delta=HelioExplore::minus(e.position,target.position);const double distance=HelioExplore::length(delta);
    const double exit=target.radius+((target.kind==HelioExplore::Kind::Planet||target.kind==HelioExplore::Kind::Moon)?40:6);
    if(distance<exit+10)return "Already inside this destination's warp exclusion zone.";
    Vec goal{};for(int k=0;k<3;++k)goal[k]=target.position[k]+delta[k]/distance*exit;
    if(!segmentClear(e.position,e.position,bodies))return "Climb clear of the atmosphere before engaging warp.";
    const auto planned=route(e.position,goal,bodies);
    if(planned.empty())return "No safe warp corridor. Reposition in normal space.";
    std::vector<Vec> points{e.position};points.insert(points.end(),planned.begin(),planned.end());
    State next;next.startOrientation=e.orientation;next.phase=Phase::Charging;next.destination=e.target;
    for(size_t i=0;i+1<points.size();++i) {
        const auto& a=points[i?i-1:0];const auto& b=points[i];const auto& c=points[i+1];
        const auto& d=points[std::min(points.size()-1,i+2)];
        for(int j=0;j<128;++j) {
            const double t=double(j)/128;Vec p{};
            for(int k=0;k<3;++k)p[k]=.5*(2*b[k]+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t*t+(-a[k]+3*b[k]-3*c[k]+d[k])*t*t*t);
            next.curve.push_back(p);
        }
    }
    next.curve.push_back(goal);next.distances.push_back(0);
    for(size_t i=1;i<next.curve.size();++i) {
        if(!segmentClear(next.curve[i-1],next.curve[i],bodies))return "Curved corridor intersects an exclusion zone. Reposition before warp.";
        next.distances.push_back(next.distances.back()+HelioExplore::length(HelioExplore::minus(next.curve[i],next.curve[i-1])));
    }
    next.length=next.distances.back();next.duration=std::clamp(next.length/230,9.,70.);
    w=std::move(next);e.autopilot=false;e.scanning=false;e.velocity={0,0,0};
    e.message="WARP / FIELD CHARGING / B or manual input cancels.";return nullptr;
}
inline void cancel(State& w) {
    if(!w.active()||w.phase==Phase::Braking)return;
    if(w.phase==Phase::Charging){w.phase=Phase::Idle;w.strength=0;return;}
    w.abortDuration=std::max(.001,std::min(1.8,2*(1-w.progress)/std::max(.00001,w.rate)));
    w.phase=Phase::Braking;w.abortElapsed=0;w.abortStart=w.progress;w.abortRate=w.rate;
}
// Invalid timesteps are a no-op (no NaNs reach the engine). Caller clamps frame dt to .1s.
// Returns true exactly when a running field has ended.
inline bool step(State& w,HelioExplore::State& e,double dt) {
    if(!w.active()||!std::isfinite(dt)||dt<0)return false;
    w.elapsed+=dt;double progress,rate;
    if(w.phase==Phase::Braking) {
        w.abortElapsed=std::min(w.abortDuration,w.abortElapsed+dt);
        const double t=w.abortElapsed,T=w.abortDuration;
        progress=w.abortStart+w.abortRate*(t-t*t/(2*T));rate=w.abortRate*(1-t/T);
        if(t>=T)w.phase=Phase::Idle;
    }else {
        const double t=std::clamp((w.elapsed-3)/w.duration,0.,1.);
        progress=smooth(t);rate=derivative(t)/w.duration;
        w.phase=w.elapsed<3?Phase::Charging:t<1?Phase::Cruising:Phase::Idle;
    }
    w.progress=std::min(1.,progress);w.rate=rate;
    const double distance=w.length*w.progress;size_t i=1;
    while(i+1<w.distances.size()&&w.distances[i]<distance)++i;
    const double span=w.distances[i]-w.distances[i-1],t=span?(distance-w.distances[i-1])/span:0;
    const auto old=e.position;e.position=mix(w.curve[i-1],w.curve[i],std::clamp(t,0.,1.));
    e.totalTravel+=HelioExplore::length(HelioExplore::minus(e.position,old));
    for(int k=0;k<3;++k)e.velocity[k]=span?(w.curve[i][k]-w.curve[i-1][k])/span*w.length*rate:0;
    w.strength=!w.active()?0:std::min(1.,w.phase==Phase::Charging?w.elapsed/3:std::max(.05,rate*w.duration));
    const auto forward=HelioExplore::minus(w.curve[std::min(i+1,w.curve.size()-1)],w.curve[i?i-1:0]);
    const double norm=std::max(HelioExplore::length(forward),1e-12);
    auto target=HPFlight::euler(std::atan2(-forward[0],-forward[2]),std::asin(std::clamp(forward[1]/norm,-1.,1.)));
    double alignment=0;for(int k=0;k<4;++k)alignment+=target[k]*w.startOrientation[k];
    if(alignment<0)for(double& x:target)x=-x;
    const double blend=smooth(std::min(1.,w.elapsed/3));
    for(int k=0;k<4;++k)e.orientation[k]=w.startOrientation[k]*(1-blend)+target[k]*blend;
    e.orientation=HPFlight::unit(e.orientation);
    const auto f=HPFlight::rotate(e.orientation,{0,0,-1}),r=HPFlight::rotate(e.orientation,{1,0,0}),u=HPFlight::rotate(e.orientation,{0,1,0});
    e.yaw=std::atan2(-f[0],-f[2]);e.pitch=std::asin(std::clamp(f[1],-1.,1.));e.roll=std::atan2(r[1],u[1]);
    if(!w.active()){e.velocity={0,0,0};e.message="Warp field released. Manual flight.";return true;}
    e.message=std::string("WARP / ")+name(w.phase)+" / B: cancel";return false;
}
}
