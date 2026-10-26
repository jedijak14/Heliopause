#if WITH_DEV_AUTOMATION_TESTS
#include "Misc/AutomationTest.h"
#include "HeliopauseCore.h"
#include "ExplorationCore.h"
#include "WarpFlight.h"
#include "StoryCatalog.h"
IMPLEMENT_SIMPLE_AUTOMATION_TEST(FHPFrameworkTest,"Heliopause.Core.Framework",EAutomationTestFlags::EditorContext|EAutomationTestFlags::EngineFilter)
bool FHPFrameworkTest::RunTest(const FString& Parameters){
 TestTrue(TEXT("Character uses the replacement framework"),AHeliopauseCharacter::StaticClass()->IsChildOf(ACharacter::StaticClass()));
 TestTrue(TEXT("Door implements interaction"),AHandprintDoor::StaticClass()->ImplementsInterface(UHPInteractable::StaticClass()));
 TestTrue(TEXT("Curtain implements interaction"),ACurtainWindow::StaticClass()->ImplementsInterface(UHPInteractable::StaticClass()));
 TestEqual(TEXT("Bounded campaign cue count"),int(sizeof(HPStoryCues)/sizeof(HPStoryCues[0])),20);
 HelioExplore::State State;TestTrue(TEXT("Fresh expedition validates"),State.valid());TestEqual(TEXT("Exploration site count"),int(HelioExplore::Sites.size()),33);
 State.docked=-1;State.target=17;HPWarp::State Warp;
 TestTrue(TEXT("Warp starts on a safe corridor"),HPWarp::start(Warp,State)==nullptr);
 HPWarp::step(Warp,State,4);TestTrue(TEXT("Warp reaches cruise"),Warp.phase==HPWarp::Phase::Cruising);
 HPWarp::cancel(Warp);for(int I=0;I<200&&Warp.active();++I)HPWarp::step(Warp,State,.01);
 TestFalse(TEXT("Warp brake completes"),Warp.active());TestTrue(TEXT("Warp exit holds at rest"),State.speed()==0);
 return true;
}
#endif
