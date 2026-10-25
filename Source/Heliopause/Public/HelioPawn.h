#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "HelioPawn.generated.h"
class UCameraComponent;
class USpotLightComponent;
class AHelioWorld;
UENUM()
enum class EHelioView : uint8 { Walking, Cockpit, LeftHull, RightHull, Front, Drone };
UCLASS()
class HELIOPAUSE_API AHelioPawn : public ACharacter
{
    GENERATED_BODY()
public:
    AHelioPawn();
    virtual void BeginPlay() override;
    virtual void Tick(float Dt) override;
    virtual void SetupPlayerInputComponent(UInputComponent* Input) override;
    void SetView(EHelioView Mode);
    void SelectBot(int Index);
    void Interact();
    void ExitRemote();
    void SetMenu(bool Open);
    bool CanPilot() const;
    UPROPERTY() TObjectPtr<UCameraComponent> Camera;
    UPROPERTY() TObjectPtr<USpotLightComponent> Flashlight;
    UPROPERTY() TObjectPtr<AHelioWorld> Ship;
    EHelioView View = EHelioView::Walking;
    bool bTablet = false;
    bool bMenu = true;
    int Tool = 0;
    float Health = 100;
    float StaticUntil = 0;
    float Throttle = 0;
    bool bInSeat = false;
    FString Prompt() const;
private:
    FVector SavedWalkLocation;
    FRotator SavedWalkRotation;
    FVector BlendLocation;
    FQuat BlendRotation;
    float BlendAlpha = 1;
    float ForwardAxis = 0;
    float RightAxis = 0;
    void Forward(float Value);
    void Right(float Value);
    void Yaw(float Value);
    void Pitch(float Value);
    void ToggleTablet();
    void ToggleLight();
    void CycleCamera();
    void Run();
    void Walk();
    void ToggleCrouch();
    void Fire();
    void Tool1();
    void Tool2();
    void Tool3();
    void Release();
};
