#include "PlanetaryFlight.h"
#include <cassert>
#include <iostream>
int main(){HelioExplore::State e;e.docked=-1;e.target=14;const auto& s=HelioExplore::Sites[14];const double h=std::max(0.,HPPlanet::height(14,{0,1,0}));e.position={s.position[0],s.position[1]+s.radius+(h+1)/1000,s.position[2]};e.velocity={0,-.005,0};HPPlanet::Contact hit;for(int i=0;i<10&&hit.planet<0;++i){auto old=e.position;e.step(.1,0,0,0,0,0,0,true);hit=HPPlanet::contact(e,old);}assert(hit.planet==14&&hit.soft);assert(std::abs(HPPlanet::nearest(e).altitude-.45)<.001);e.velocity={0,.008,0};const auto old=e.position;e.step(.1,0,0,0,0,0,0,true);assert(HPPlanet::contact(e,old).planet<0);std::cout<<"PASS: native continuous-flight swept terrain touchdown kernel\n";}
