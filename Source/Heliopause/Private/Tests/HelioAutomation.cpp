#if WITH_DEV_AUTOMATION_TESTS
#include "Misc/AutomationTest.h"
#include "HelioWorld.h"
#include "SimulationCore.h"
IMPLEMENT_SIMPLE_AUTOMATION_TEST(FHelioSafetyTest,"Heliopause.Core.Safety",EAutomationTestFlags::ApplicationContextMask|EAutomationTestFlags::EngineFilter)
bool FHelioSafetyTest::RunTest(const FString& Parameters)
{
    Helio::Atmosphere A,B;
    TestFalse(TEXT("Docked nominal door is unlocked"),Helio::doorLocked(Helio::Flight::Docked,A,B));
    A.breach=true;
    TestTrue(TEXT("Breach isolates adjacent rooms"),Helio::doorLocked(Helio::Flight::Cruise,A,B));
    TestTrue(TEXT("Cruise seals outer airlock"),Helio::airlockLocked(Helio::Flight::Cruise));
    TestTrue(TEXT("Blocked graph produces no route"),Helio::route(0,3,{false,true,false}).empty());
    return true;
}
IMPLEMENT_SIMPLE_AUTOMATION_TEST(FHelioSensorTest,"Heliopause.Core.FixedSensors",EAutomationTestFlags::ApplicationContextMask|EAutomationTestFlags::EngineFilter)
bool FHelioSensorTest::RunTest(const FString& Parameters)
{
    const auto L=AHelioWorld::SensorTransform(0),R=AHelioWorld::SensorTransform(1),F=AHelioWorld::SensorTransform(2);
    TestTrue(TEXT("Port sensor at negative Y"),L.GetLocation().Y<0);
    TestTrue(TEXT("Starboard sensor at positive Y"),R.GetLocation().Y>0);
    TestTrue(TEXT("Forward sensor ahead of cockpit"),F.GetLocation().X>AHelioWorld::SeatTransform().GetLocation().X);
    TestTrue(TEXT("Sensors are fixed"),L.Equals(AHelioWorld::SensorTransform(0)));
    return true;
}
#endif
