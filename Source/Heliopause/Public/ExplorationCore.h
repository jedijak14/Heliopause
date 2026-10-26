#pragma once
#include "SectorCatalog.h"
#include "FlightDynamics.h"
#include <algorithm>
#include <cmath>
#include <cstdint>
#include <string>
namespace HelioExplore {
using Vec=std::array<double,3>;
inline double length(const Vec& v){return std::sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]);}
inline Vec minus(const Vec& a,const Vec& b){return {a[0]-b[0],a[1]-b[1],a[2]-b[2]};}
inline uint32_t bit(int i){return uint32_t(1)<<i;}
enum class Command { Undock, Navigate, Brake, Dock, Board, Return, Scan, Recover, Sell, Engine, Sensor };
struct State {
    Vec position{0,0,.56},velocity{0,0,0};
    HPFlight::Quat orientation{0,0,0,1};
    double roll=0;
    double yaw=0,pitch=0,scanProgress=0,totalTravel=0;
    int target=3,docked=0,credits=0,engine=0,sensor=0;
    uint32_t scanned=0,recovered=0,sold=0,artifactSold=0,visited=1;
    bool onStation=false,autopilot=false,scanning=false,complete=false;
    std::string message="Undock, survey Glasswake, and return to a station exchange.";
    double distance(int i) const {if(i<0||i>=int(Sites.size()))return 1e9;return std::max(0.0,length(minus(position,Sites[i].position))-Sites[i].radius);}
    double speed() const {return length(velocity);}
    double maxSpeed() const {return 8+engine*4;}
    double scanRange() const {return 2.5+sensor*2;}
    int pending() const {int sum=0;for(int i=0;i<int(Sites.size());++i){if((scanned&bit(i))&&!(sold&bit(i)))sum+=Sites[i].reward;if((recovered&bit(i))&&!(artifactSold&bit(i)))sum+=250;}return sum;}
    bool select(int i){if(i<0||i>=int(Sites.size()))return false;target=i;autopilot=false;scanning=false;scanProgress=0;return true;}
    bool respond(bool ok,const std::string& text){message=text;return ok;}
    bool command(Command cmd){
        const auto& s=Sites[target];
        switch(cmd){
        case Command::Undock:
            if(onStation||docked<0)return respond(false,"Return aboard a docked ship before undocking.");
            docked=-1;velocity={0,0,0};return respond(true,"Moorings released. Free flight available.");
        case Command::Navigate:
            if(docked>=0||onStation)return respond(false,"Undock before engaging navigation.");
            autopilot=!autopilot;scanning=false;return respond(true,autopilot?std::string("Course set for ")+s.name:"Manual flight enabled.");
        case Command::Brake:autopilot=false;velocity={0,0,0};return respond(true,"Thrusters holding position.");
        case Command::Dock:
            if(s.kind!=Kind::Station||distance(target)>.6||speed()>.35)return respond(false,"Dock within 0.6 km of a station at less than 0.35 km/s.");
            docked=target;velocity={0,0,0};autopilot=false;scanning=false;visited|=bit(target);return respond(true,std::string(s.name)+": docking clamps secured.");
        case Command::Board:
            if(docked<0)return respond(false,"Dock at an inhabited station first.");
            onStation=true;return respond(true,"Station concourse: approach the exploration exchange.");
        case Command::Return:onStation=false;return respond(true,"Returned aboard SV-7 Longhaul.");
        case Command::Scan:
            if(docked>=0||distance(target)>scanRange()||speed()>.35)return respond(false,"Hold position inside scanner range.");
            if(scanned&bit(target))return respond(false,"This discovery is already recorded.");
            scanning=true;scanProgress=0;return respond(true,std::string("Surveying ")+s.name);
        case Command::Recover:
            if(!s.artifact||!(scanned&bit(target))||distance(target)>1.8||speed()>.35||(recovered&bit(target)))return respond(false,"Scan an unarchived artifact site and hold within 1.8 km.");
            recovered|=bit(target);return respond(true,std::string("Artifact recovered: ")+s.name);
        case Command::Sell:{
            if(!onStation||docked<0||!pending())return respond(false,"Bring new discoveries to a station exchange.");
            const int gain=pending();credits+=gain;sold|=scanned;artifactSold|=recovered;complete=true;
            for(int i=0;i<int(Sites.size());++i)if(Sites[i].reward>0&&!(sold&bit(i)))complete=false;
            return respond(true,"Archive accepted. +"+std::to_string(gain)+" credits.");}
        case Command::Engine:case Command::Sensor:{
            int& level=cmd==Command::Engine?engine:sensor;int cost=(level+1)*(cmd==Command::Engine?350:250);
            if(!onStation||docked<0||level>=3||credits<cost)return respond(false,"Upgrade requires a station exchange and sufficient credits (max level 3).");
            credits-=cost;++level;return respond(true,"Ship upgrade installed.");}
        }
        return false;
    }
    void step(double dt,double throttle=0,double turn=0,double pitchInput=0,double rollInput=0,double vertical=0,double lateral=0,bool terrainFlight=false){
        dt=std::clamp(std::isfinite(dt)?dt:0.0,0.0,.1);
        if(docked>=0||onStation){velocity={0,0,0};return;}
        if(turn||pitchInput||rollInput||vertical||lateral||throttle)autopilot=false;
        Vec desired{};
        if(autopilot){const auto& s=Sites[target];const Vec delta=minus(s.position,position);const double d=length(delta),stop=s.radius+(s.kind==Kind::Station?.42:1.3);
            if(d<stop+.04){velocity={0,0,0};autopilot=false;message=std::string("Arrived at ")+s.name;return;}
            const double rate=std::min(maxSpeed(),std::max(.1,(d-stop)*.8));for(int i=0;i<3;++i)desired[i]=delta[i]/d*rate;
            yaw=std::atan2(-delta[0],-delta[2]);pitch=std::asin(std::clamp(delta[1]/d,-1.0,1.0));
        orientation=HPFlight::euler(yaw,pitch);roll=0;
        }else{HPFlight::integrate(orientation,velocity,dt,throttle,turn,pitchInput,rollInput,vertical,lateral,maxSpeed());const auto f=HPFlight::rotate(orientation,{0,0,-1}),r=HPFlight::rotate(orientation,{1,0,0}),u=HPFlight::rotate(orientation,{0,1,0});yaw=std::atan2(-f[0],-f[2]);pitch=std::asin(std::clamp(f[1],-1.,1.));roll=std::atan2(r[1],u[1]);}
        Vec next=position;const double alpha=std::min(1.0,dt*(autopilot?3:1.5));for(int i=0;i<3;++i){if(autopilot)velocity[i]+=(desired[i]-velocity[i])*alpha;next[i]+=velocity[i]*dt;}
        for(const auto& body:Sites)if(body.kind==Kind::Planet||body.kind==Kind::Moon){const Vec segment=minus(next,position),offset=minus(position,body.position);double len2=0,dot=0;for(int i=0;i<3;++i){len2+=segment[i]*segment[i];dot+=offset[i]*segment[i];}const double t=len2?std::clamp(-dot/len2,0.0,1.0):0;Vec closest=offset;for(int i=0;i<3;++i)closest[i]+=t*segment[i];if(!(terrainFlight && &body!=&Sites[13])&&length(closest)<body.radius+.15){velocity={0,0,0};autopilot=false;message="Proximity brake. Steer around the celestial body.";return;}}
        totalTravel+=length(minus(next,position));position=next;
        if(scanning){if(distance(target)>scanRange()||speed()>.35){scanning=false;scanProgress=0;message="Survey interrupted. Hold inside scanner range.";}else{scanProgress+=dt/(6-sensor);if(scanProgress>=1){scanning=false;scanProgress=1;scanned|=bit(target);message=std::string("Discovery recorded: ")+Sites[target].name;}}}
    }
    bool valid() const {
        if(!HPFlight::valid(orientation)||!std::isfinite(roll))return false;
        for(double v:position)if(!std::isfinite(v)||std::abs(v)>=1e6)return false;
        if(!std::isfinite(yaw)||!std::isfinite(pitch)||!std::isfinite(totalTravel)||totalTravel<0)return false;
        if(target<0||target>=int(Sites.size())||docked< -1||docked>=int(Sites.size()))return false;
        if(docked>=0&&(Sites[docked].kind!=Kind::Station||distance(docked)>.7))return false;
        if(credits<0||credits>10000000||engine<0||engine>3||sensor<0||sensor>3)return false;
        const uint32_t mask=(uint32_t(1)<<Sites.size())-1;
        if(((scanned|recovered|sold|artifactSold|visited)&~mask)||(sold&~scanned)||(recovered&~scanned)||(artifactSold&~recovered))return false;
        for(int i=0;i<int(Sites.size());++i)if((recovered&bit(i))&&!Sites[i].artifact)return false;
        return true;
    }
};
}
