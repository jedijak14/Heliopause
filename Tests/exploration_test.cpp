#include "ExplorationCore.h"
#include <cassert>
#include <iostream>
using namespace HelioExplore;
void arrive(State& e,int target){assert(e.select(target));if(e.docked>=0)assert(e.command(Command::Undock));assert(e.command(Command::Navigate));int count=0;while(e.autopilot&&count++<5000)e.step(.1);assert(!e.autopilot);assert(count<5000);assert(e.distance(target)<(Sites[target].kind==Kind::Station?.6:2.5));assert(e.speed()<.35);}
void scan(State& e){assert(e.command(Command::Scan));for(int i=0;i<65;++i)e.step(.1);assert(e.scanned&bit(e.target));}
int main(){
 State e;assert(e.valid());assert(!e.command(Command::Navigate));assert(!e.command(Command::Sell));
 arrive(e,4);scan(e);assert(e.command(Command::Recover));assert(!e.command(Command::Recover));assert(e.pending()==530);
 arrive(e,0);assert(e.command(Command::Dock));assert(!e.command(Command::Sell));assert(e.command(Command::Board));assert(!e.command(Command::Undock));assert(e.command(Command::Sell));assert(e.credits==530);assert(!e.command(Command::Sell));assert(e.command(Command::Engine));assert(e.engine==1&&e.credits==180);assert(!e.command(Command::Sensor));assert(e.command(Command::Return));
 State late;late.scanned=bit(4);late.onStation=true;assert(late.command(Command::Sell));assert(late.credits==280);late.onStation=false;late.docked=-1;late.select(4);late.position={24,-3,-53.5};assert(late.command(Command::Recover));assert(late.pending()==250);late.onStation=true;late.docked=0;assert(late.command(Command::Sell));assert(late.credits==530);assert(!late.command(Command::Sell));
 State bad=e;bad.target=99;assert(!bad.valid());bad=e;bad.position[0]=1e12;assert(!bad.valid());bad=e;bad.recovered|=bit(3);assert(!bad.valid());
 State movement;movement.command(Command::Undock);for(int i=0;i<100;++i)movement.step(.1,.5,.2);assert(movement.totalTravel>1&&movement.yaw>0);
 State boundary;boundary.docked=-1;boundary.position=Sites[6].position;boundary.position[2]+=Sites[6].radius+.16;boundary.velocity={0,0,-20};boundary.step(.1,1);assert(boundary.speed()==0);assert(boundary.valid());
 std::cout<<"PASS: native exploration travel, survey, recovery, docking, exchange, upgrades, duplicate rewards, collision and save validation\n";
}
