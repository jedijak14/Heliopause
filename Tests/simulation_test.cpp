#include "SimulationCore.h"
#include <cassert>
#include <fstream>
#include <iostream>
#include <iterator>
#include <random>
using namespace Helio;
int main(int argc, char** argv)
{
    Atmosphere a, b;
    assert(!doorLocked(Flight::Docked,a,b));
    assert(!doorLocked(Flight::Cruise,a,b));
    assert(doorLocked(Flight::Emergency,a,b));
    assert(!airlockLocked(Flight::Docked));
    assert(airlockLocked(Flight::Cruise)&&airlockLocked(Flight::Emergency));
    a.breach=true;
    assert(doorLocked(Flight::Docked,a,b));
    for(int i=0;i<1000;++i) a.step(.1f);
    assert(a.pressure==0&&a.unsafe());
    a.breach=false;
    for(int i=0;i<1000;++i) a.step(.1f);
    assert(a.pressure==1&&!a.unsafe());
    a.venting=true;
    for(int i=0;i<1000;++i) a.step(.1f);
    assert(a.temperature==220&&a.unsafe());
    a.venting=false;
    for(int i=0;i<2000;++i) a.step(.1f);
    assert(a.temperature<22&&!a.unsafe());
    const float Before=a.pressure; a.step(-1); assert(a.pressure==Before);
    for(int mask=0;mask<8;++mask) for(int start=0;start<4;++start) for(int end=0;end<4;++end)
    {
        std::array<bool,3> locks{bool(mask&1),bool(mask&2),bool(mask&4)};
        const auto path=route(start,end,locks);
        bool blocked=false;
        for(int i=std::min(start,end);i<std::max(start,end);++i) blocked|=locks[i];
        assert(path.empty()==blocked);
        if(!blocked)
        {
            assert(path.front()==start&&path.back()==end);
            assert(path.size()==size_t(std::abs(start-end)+1));
            for(size_t i=1;i<path.size();++i) assert(!locks[std::min(path[i],path[i-1])]);
        }
    }
    assert(route(-1,3,{false,false,false}).empty());
    assert(route(0,4,{false,false,false}).empty());
    Bot bot; bot.damage(-10); assert(bot.health==100);
    bot.damage(50); assert(bot.health==50); bot.damage(80);
    assert(bot.health==0&&bot.state==BotState::Destroyed);
    bot.damage(100); assert(bot.health==0);
    assert(argc==2);
    std::ifstream input(argv[1],std::ios::binary);
    std::vector<uint8_t> bytes((std::istreambuf_iterator<char>(input)),{});
    Wave w; assert(readWave(bytes,w)); assert(w.channels==1&&w.rate==22050&&!w.pcm.empty());
    for(size_t cut=0;cut<bytes.size();cut+=97)
    { auto shortFile=std::vector<uint8_t>(bytes.begin(),bytes.begin()+cut); assert(!readWave(shortFile,w)); }
    auto bad=bytes; bad[20]=3; assert(!readWave(bad,w)); // float not PCM
    bad=bytes; bad[34]=8; assert(!readWave(bad,w)); // 8-bit not PCM16
    bad=bytes; bad[22]=6; assert(!readWave(bad,w)); // unsupported channels
    bad=bytes; bad[4]=bad[5]=bad[6]=bad[7]=255; assert(!readWave(bad,w));
    std::mt19937 rng(701);
    for(int i=0;i<10000;++i)
    {
        std::vector<uint8_t> fuzz(rng()%512); for(auto& c:fuzz) c=rng()%256;
        readWave(fuzz,w); // run under ASan/UBSan
    }
    std::cout<<"PASS: atmosphere, flight interlocks, 128 routes, drone lifecycle, WAV validation + 10k malformed buffers\n";
}
