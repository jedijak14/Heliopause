#include "HelioGameMode.h"
#include "HelioPawn.h"
#include "HelioHUD.h"
#include "HelioWorld.h"
#include "Engine/World.h"
#include "EngineUtils.h"
#include "GameFramework/PlayerController.h"
AHelioGameMode::AHelioGameMode()
{
    DefaultPawnClass = AHelioPawn::StaticClass();
    HUDClass = AHelioHUD::StaticClass();
    PlayerControllerClass = APlayerController::StaticClass();
}
void AHelioGameMode::StartPlay()
{
    // Runtime-only scene: no uncooked or fabricated binary map assets.
    bool Found = false;
    for (TActorIterator<AHelioWorld> It(GetWorld()); It; ++It) Found = true;
    if (!Found) GetWorld()->SpawnActor<AHelioWorld>();
    Super::StartPlay();
}
