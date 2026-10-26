#include "FlightDynamics.h"
#include <iostream>
#include <iomanip>
int main(){HPFlight::Quat q{0,0,0,1};HPFlight::Vec v{0,0,0};std::cout<<std::setprecision(17)<<"[";for(int scenario=0;scenario<4;++scenario){q=HPFlight::euler(.1*scenario,.2*scenario,.3*scenario);v={0,0,-1};for(int j=0;j<2000;++j){double t=j*.016;HPFlight::integrate(q,v,.016,std::sin(t),std::cos(t*.7),std::sin(t*.3),std::cos(t*.2),std::sin(t*.4),std::cos(t*.8));}if(scenario)std::cout<<",";std::cout<<"[";for(int i=0;i<4;++i)std::cout<<(i?",":"")<<q[i];for(double x:v)std::cout<<","<<x;std::cout<<"]";}std::cout<<"]\n";}
