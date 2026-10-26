#include "HabitatRules.h"
#include <cassert>
#include <iostream>
int main(){using namespace HPHabitat;State s;assert(!request(s,true,.1,0,false,false));assert(!request(s,true,0,0,true,false));assert(request(s,true,0,0,false,false));assert(locked(s));assert(!request(s,false,0,0,false,false));for(int i=0;i<81;++i)step(s,.1);assert(s.phase==Phase::Deployed);assert(!request(s,false,0,0,false,true));assert(request(s,false,0,0,false,false));for(int i=0;i<81;++i)step(s,.1);assert(!locked(s));std::cout<<"PASS: native habitat interlock, occupancy, transition and compaction kernel\n";}
