#pragma once
#include "CoreMinimal.h"
#include "GameFramework/HUD.h"
#include "HelioHUD.generated.h"
class AHelioPawn;
UCLASS()
class HELIOPAUSE_API AHelioHUD : public AHUD
{
    GENERATED_BODY()
public:
    virtual void DrawHUD() override;
    virtual void NotifyHitBoxClick(FName BoxName) override;
private:
    int Tab = 0;
    bool bHelp = false;
    void Label(const FString& Text, float X, float Y, FLinearColor Color = FLinearColor(.65f,.85f,1.f), float Scale = 1.f);
    void Button(FName Id, const FString& Text, float X, float Y, float W, bool Active = false);
    void Tablet(AHelioPawn* Pawn);
};
