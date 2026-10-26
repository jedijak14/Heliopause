#pragma once
#include <algorithm>
#include <cmath>
namespace HPHabitat {
enum class Phase { Stowed,Deploying,Deployed,Stowing };
struct State {Phase phase=Phase::Stowed;double fraction=0;};
inline bool locked(const State& s){return s.phase!=Phase::Stowed;}
inline bool request(State& s,bool deploy,double speed,double throttle,bool autopilot,bool occupied){
 if(s.phase==Phase::Deploying||s.phase==Phase::Stowing)return false;
 if(deploy){if(s.phase==Phase::Deployed)return true;if(!std::isfinite(speed)||!std::isfinite(throttle)||speed>.001||std::abs(throttle)>.001||autopilot)return false;s.phase=Phase::Deploying;}
 else{if(s.phase==Phase::Stowed)return true;if(occupied)return false;s.phase=Phase::Stowing;}return true;
}
inline void step(State& s,double dt){if(!std::isfinite(dt))return;dt=std::clamp(dt,0.,.1);if(s.phase==Phase::Deploying){s.fraction=std::min(1.,s.fraction+dt/8);if(s.fraction>=1)s.phase=Phase::Deployed;}if(s.phase==Phase::Stowing){s.fraction=std::max(0.,s.fraction-dt/8);if(s.fraction<=0)s.phase=Phase::Stowed;}}
}
