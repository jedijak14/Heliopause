#include "WarpFlight.h"
#include <cassert>
#include <iostream>
#include <limits>

HelioExplore::State ship(int target=17){HelioExplore::State s;s.docked=-1;s.target=target;return s;}
int main(){
    using namespace HPWarp;
    Permissions p{true,true,true,false,true,true};assert(!blocked(p));
    for(int i=0;i<6;++i){auto bad=p;switch(i){case 0:bad.pilot=false;break;case 1:bad.navigation=false;break;case 2:bad.habitatsStowed=false;break;case 3:bad.landed=true;break;case 4:bad.airlocksClosed=false;break;case 5:bad.crewAboard=false;break;}assert(blocked(bad));}
    auto e=ship();State w;assert(!start(w,e));const auto original=e.position;
    step(w,e,2);assert(w.phase==Phase::Charging&&e.position==original);const double elapsed=w.elapsed;
    assert(!step(w,e,std::numeric_limits<double>::quiet_NaN()));assert(!step(w,e,-1));assert(w.elapsed==elapsed);
    cancel(w);assert(!w.active()&&w.strength==0&&e.speed()==0);
    const auto bodies=exclusions();int accepted=0,rejected=0;
    // Every destination from three distinct starting points; check actual frame chords as well as the preflight curve.
    for(double dt:{.025,.1})for(const auto& pos:std::vector<Vec>{{0,0,.56},{1000,1000,1000},{8000,-500,1000}})for(int target=0;target<int(HelioExplore::Sites.size());++target){
        auto s=ship(target);s.position=pos;State warp;
        if(start(warp,s)){++rejected;assert(!warp.active()&&s.position==pos);continue;}
        ++accepted;
        for(size_t j=1;j<warp.curve.size();++j)assert(segmentClear(warp.curve[j-1],warp.curve[j],bodies));
        int count=0;while(warp.active()&&count++<10000){const auto old=s.position;step(warp,s,dt);assert(segmentClear(old,s.position,bodies));assert(s.valid());}
        assert(count<10000&&s.speed()==0&&warp.progress==1&&warp.strength==0);
        const auto& t=HelioExplore::Sites[target];const double exit=t.radius+((t.kind==HelioExplore::Kind::Planet||t.kind==HelioExplore::Kind::Moon)?40:6);
        assert(std::abs(HelioExplore::length(HelioExplore::minus(s.position,t.position))-exit)<1e-7);
    }
    assert(accepted>50);
    for(double stop:{.5,3.1,5.,8.,10.}){
        auto a=ship(),b=ship();State wa,wb;assert(!start(wa,a));assert(!start(wb,b));
        const int n=int(stop*100+.5);for(int i=0;i<n;++i)step(wa,a,.01);for(int i=0;i<n/10;++i)step(wb,b,.1);
        assert(HelioExplore::length(HelioExplore::minus(a.position,b.position))<1e-7);
        const auto old=a.position;cancel(wa);assert(a.position==old);
        double speed=a.speed();for(int i=0;i<200&&wa.active();++i){const auto before=a.position;cancel(wa);step(wa,a,.01);assert(a.speed()<=speed+1e-7);assert(segmentClear(before,a.position,bodies));speed=a.speed();}
        assert(!wa.active()&&a.speed()==0);
    }
    auto bad=ship();bad.velocity[0]=1;State empty;assert(start(empty,bad));bad=ship();bad.target=999;assert(start(empty,bad));
    bad=ship();bad.position=HPScience::Stars[0].position;assert(start(empty,bad));bad=ship();bad.velocity[0]=std::numeric_limits<double>::infinity();assert(start(empty,bad));
    // Mutating the selector cannot redirect an already committed corridor.
    auto a=ship(),b=ship();State wa,wb;assert(!start(wa,a));assert(!start(wb,b));b.target=32;
    for(int i=0;i<100;++i){step(wa,a,.1);step(wb,b,.1);}assert(a.position==b.position);
    std::cout<<"PASS: native warp permissions, "<<accepted<<" safe routes / "<<rejected<<" conservative refusals, frame timing, braking, exact exits and invalid-state guards (not an Unreal build).\n";
}
