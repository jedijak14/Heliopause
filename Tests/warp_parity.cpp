#include "WarpFlight.h"
#include <iostream>
#include <iomanip>
int main(){
    std::cout<<std::setprecision(17)<<'[';int cases;std::cin>>cases;
    for(int scenario=0;scenario<cases;++scenario){
        if(scenario)std::cout<<',';
        HelioExplore::State s;s.docked=-1;double yaw,pitch,roll;int cancelAt;
        std::cin>>s.target>>s.position[0]>>s.position[1]>>s.position[2]>>yaw>>pitch>>roll>>cancelAt;
        s.orientation=HPFlight::euler(yaw,pitch,roll);HPWarp::State w;
        const bool ok=!HPWarp::start(w,s);
        std::cout<<"{\"accepted\":"<<(ok?"true":"false")<<",\"curve\":"<<w.curve.size()<<",\"length\":"<<w.length<<",\"duration\":"<<w.duration<<",\"snapshots\":[";
        bool first=true;const double dt[]={.016,.033,.1,.025};
        for(int i=0;ok&&w.active()&&i<10000;++i){
            if(i==cancelAt)HPWarp::cancel(w);
            HPWarp::step(w,s,dt[i%4]);
            if(i%17==0||!w.active()){
                if(!first)std::cout<<',';
                first=false;std::cout<<'['<<i<<','<<int(w.phase)<<','<<w.elapsed<<','<<w.progress<<','<<w.strength<<','<<w.rate<<','<<s.totalTravel;
                for(double v:s.position)std::cout<<','<<v;
                for(double v:s.velocity)std::cout<<','<<v;
                for(double v:s.orientation)std::cout<<','<<v;
                std::cout<<','<<s.yaw<<','<<s.pitch<<','<<s.roll<<']';
            }
        }
        std::cout<<"]}";
    }
    std::cout<<"]\n";
}
