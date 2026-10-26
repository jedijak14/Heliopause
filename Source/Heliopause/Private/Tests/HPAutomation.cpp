#if WITH_DEV_AUTOMATION_TESTS
#include "Misc/AutomationTest.h"
#include "HeliopauseCore.h"
#include "ExplorationCore.h"
#include "StoryCatalog.h"
IMPLEMENT_SIMPLE_AUTOMATION_TEST(FHPFrameworkTest,"Heliopause.Core.Framework",EAutomationTestFlags::EditorContext|EAutomationTestFlags::EngineFilter)
bool FHPFrameworkTest::RunTest(const FString& Parameters){
 TestTrue(TEXT("Character uses the replacement framework"),AHeliopauseCharacter::StaticClass()->IsChildOf(ACharacter::StaticClass()));
 TestTrue(TEXT("Door implements interaction"),AHandprintDoor::StaticClass()->ImplementsInterface(UHPInteractable::StaticClass()));
 TestTrue(TEXT("Curtain implements interaction"),ACurtainWindow::StaticClass()->ImplementsInterface(UHPInteractable::StaticClass()));
 TestEqual(TEXT("Bounded campaign cue count"),int(sizeof(HPStoryCues)/sizeof(HPStoryCues[0])),10);
 HelioExplore::State State;TestTrue(TEXT("Fresh expedition validates"),State.valid());TestEqual(TEXT("Exploration site count"),int(HelioExplore::Sites.size()),17);return true;
}
#endif
