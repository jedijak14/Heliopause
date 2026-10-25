#pragma once
#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "HelioGameMode.generated.h"
UCLASS()
class HELIOPAUSE_API AHelioGameMode : public AGameModeBase
{
    GENERATED_BODY()
public:
    AHelioGameMode();
    virtual void StartPlay() override;
};
