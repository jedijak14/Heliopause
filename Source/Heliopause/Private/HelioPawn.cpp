#include "HelioPawn.h"
#include "HelioWorld.h"
#include "Camera/CameraComponent.h"
#include "Components/CapsuleComponent.h"
#include "Components/InputComponent.h"
#include "Components/SpotLightComponent.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "GameFramework/PlayerController.h"
#include "Engine/World.h"
#include "EngineUtils.h"

AHelioPawn::AHelioPawn()
{
    PrimaryActorTick.bCanEverTick=true;
    GetCapsuleComponent()->InitCapsuleSize(32,90);
    GetCharacterMovement()->MaxWalkSpeed=270;
    GetCharacterMovement()->GetNavAgentPropertiesRef().bCanCrouch=true;
    bUseControllerRotationYaw=true;
    Camera=CreateDefaultSubobject<UCameraComponent>(TEXT("FirstPersonCamera"));
    Camera->SetupAttachment(GetRootComponent()); Camera->SetRelativeLocation(FVector(0,0,64));
    Camera->FieldOfView=80; Camera->bUsePawnControlRotation=false;
    Flashlight=CreateDefaultSubobject<USpotLightComponent>(TEXT("SuitLight"));
    Flashlight->SetupAttachment(Camera); Flashlight->SetIntensity(8000);
    Flashlight->SetAttenuationRadius(1800); Flashlight->SetInnerConeAngle(15); Flashlight->SetOuterConeAngle(32);
    Flashlight->SetCastShadows(false);
}
void AHelioPawn::BeginPlay()
{
    Super::BeginPlay(); SetActorLocation(FVector(-320,0,96));
    for(TActorIterator<AHelioWorld> It(GetWorld());It;++It) { Ship=*It; break; }
    SetMenu(true);
}
void AHelioPawn::SetupPlayerInputComponent(UInputComponent* I)
{
    Super::SetupPlayerInputComponent(I);
    I->BindAxis(TEXT("Forward"),this,&AHelioPawn::Forward); I->BindAxis(TEXT("Right"),this,&AHelioPawn::Right);
    I->BindAxis(TEXT("Yaw"),this,&AHelioPawn::Yaw); I->BindAxis(TEXT("Pitch"),this,&AHelioPawn::Pitch);
    I->BindAction(TEXT("Interact"),IE_Pressed,this,&AHelioPawn::Interact);
    I->BindAction(TEXT("Tablet"),IE_Pressed,this,&AHelioPawn::ToggleTablet);
    I->BindAction(TEXT("Light"),IE_Pressed,this,&AHelioPawn::ToggleLight);
    I->BindAction(TEXT("Camera"),IE_Pressed,this,&AHelioPawn::CycleCamera);
    I->BindAction(TEXT("Run"),IE_Pressed,this,&AHelioPawn::Run); I->BindAction(TEXT("Run"),IE_Released,this,&AHelioPawn::Walk);
    I->BindAction(TEXT("Crouch"),IE_Pressed,this,&AHelioPawn::ToggleCrouch);
    I->BindAction(TEXT("Fire"),IE_Pressed,this,&AHelioPawn::Fire);
    I->BindAction(TEXT("Tool1"),IE_Pressed,this,&AHelioPawn::Tool1);
    I->BindAction(TEXT("Tool2"),IE_Pressed,this,&AHelioPawn::Tool2);
    I->BindAction(TEXT("Tool3"),IE_Pressed,this,&AHelioPawn::Tool3);
    I->BindAction(TEXT("Release"),IE_Pressed,this,&AHelioPawn::Release);
}
void AHelioPawn::SetMenu(bool Open)
{
    bMenu=Open;
    if(auto* PC=Cast<APlayerController>(Controller))
    {
        PC->bShowMouseCursor=Open||bTablet; PC->bEnableClickEvents=true;
        PC->bEnableMouseOverEvents=true;
        if(Open||bTablet)
        {
            FInputModeGameAndUI Mode; Mode.SetHideCursorDuringCapture(false);
            Mode.SetLockMouseToViewportBehavior(EMouseLockMode::DoNotLock); PC->SetInputMode(Mode);
        }
        else PC->SetInputMode(FInputModeGameOnly());
    }
    ForwardAxis=RightAxis=0;
}
void AHelioPawn::Forward(float V) { ForwardAxis=(bMenu||bTablet)?0:V; }
void AHelioPawn::Right(float V) { RightAxis=(bMenu||bTablet)?0:V; }
void AHelioPawn::Yaw(float V)
{
    if(bMenu||bTablet||View==EHelioView::LeftHull||View==EHelioView::RightHull||View==EHelioView::Front) return;
    AddControllerYawInput(V*.7f);
}
void AHelioPawn::Pitch(float V)
{
    if(bMenu||bTablet||View==EHelioView::LeftHull||View==EHelioView::RightHull||View==EHelioView::Front) return;
    AddControllerPitchInput(V*.7f);
}
bool AHelioPawn::CanPilot() const { return FVector::Dist2D(GetActorLocation(),AHelioWorld::SeatTransform().GetLocation())<280; }
void AHelioPawn::SetView(EHelioView Mode)
{
    if(!Ship) return;
    if(Mode==EHelioView::Cockpit&&!bInSeat)
    {
        if(!CanPilot()) return;
        bInSeat=true;
    }
    if(View==EHelioView::Walking&&Mode!=EHelioView::Walking)
    {
        SavedWalkLocation=GetActorLocation(); SavedWalkRotation=GetControlRotation();
    }
    if(View==EHelioView::Drone&&Mode!=EHelioView::Drone) Ship->SetControlledBot(-1);
    BlendLocation=Camera->GetComponentLocation(); BlendRotation=Camera->GetComponentQuat(); BlendAlpha=0;
    View=Mode;
    if(Mode==EHelioView::Walking)
    {
        bInSeat=false; GetCharacterMovement()->SetMovementMode(MOVE_Walking);
        if(Controller) Controller->SetControlRotation(SavedWalkRotation);
        SetActorLocation(SavedWalkLocation);
    }
    else
    {
        GetCharacterMovement()->StopMovementImmediately(); GetCharacterMovement()->DisableMovement();
        if(Controller) Controller->SetControlRotation(FRotator::ZeroRotator);
    }
}
void AHelioPawn::SelectBot(int I)
{
    if(!Ship||I<0||I>=3||Ship->Bots[I].health<=0) return;
    Ship->SetControlledBot(I); SetView(EHelioView::Drone);
    bTablet=false; SetMenu(false);
}
void AHelioPawn::ExitRemote() { SetView(bInSeat?EHelioView::Cockpit:EHelioView::Walking); }
void AHelioPawn::Interact()
{
    if(bMenu||bTablet||!Ship) return;
    if(View!=EHelioView::Walking)
    {
        if(View==EHelioView::Cockpit) SetView(EHelioView::Walking); else ExitRemote(); return;
    }
    if(CanPilot()) { SetView(EHelioView::Cockpit); return; }
    const FVector P=GetActorLocation();
    for(int I=0;I<3;++I) if(FVector::Dist2D(P,FVector(-600-1200*I,0,0))<240) { Ship->ToggleDoor(I); return; }
    if(FVector::Dist2D(P,FVector(-2400,716,0))<240) Ship->ToggleDoor(3);
}
void AHelioPawn::ToggleTablet() { if(!bMenu) { bTablet=!bTablet; SetMenu(false); } }
void AHelioPawn::ToggleLight() { if(!bMenu) Flashlight->ToggleVisibility(); }
void AHelioPawn::CycleCamera()
{
    if(bMenu||!Ship) return;
    if(View==EHelioView::LeftHull) SetView(EHelioView::RightHull);
    else if(View==EHelioView::RightHull) SetView(EHelioView::Front);
    else if(View==EHelioView::Front) ExitRemote();
    else SetView(EHelioView::LeftHull);
}
void AHelioPawn::Run() { GetCharacterMovement()->MaxWalkSpeed=470; }
void AHelioPawn::Walk() { GetCharacterMovement()->MaxWalkSpeed=270; }
void AHelioPawn::ToggleCrouch() { if(bIsCrouched) UnCrouch(); else Crouch(); }
void AHelioPawn::Fire()
{
    if(!bMenu&&!bTablet&&Ship&&StaticUntil<GetWorld()->GetTimeSeconds()) Ship->UseTool(Camera->GetComponentLocation(),Camera->GetForwardVector(),Tool);
}
void AHelioPawn::Tool1() { Tool=0; } void AHelioPawn::Tool2() { Tool=1; } void AHelioPawn::Tool3() { Tool=2; }
void AHelioPawn::Release()
{
    if(bTablet) { bTablet=false; SetMenu(false); }
    else SetMenu(!bMenu);
}
FString AHelioPawn::Prompt() const
{
    if(View!=EHelioView::Walking) return TEXT("E / RETURN TO CREW");
    if(CanPilot()) return TEXT("E / ACTIVATE PILOT SEAT");
    const FVector P=GetActorLocation();
    for(int I=0;I<4;++I)
    {
        const FVector D=I==3?FVector(-2400,716,0):FVector(-600-1200*I,0,0);
        if(FVector::Dist2D(P,D)<240) return Ship&&Ship->IsDoorLocked(I)?TEXT("BULKHEAD LOCKED / CHECK TABLET"):TEXT("E / TOGGLE BULKHEAD");
    }
    return FString();
}
void AHelioPawn::Tick(float Dt)
{
    Super::Tick(Dt);
    if(!Ship) for(TActorIterator<AHelioWorld> It(GetWorld());It;++It) { Ship=*It; break; }
    if(!Ship) return;
    if(View==EHelioView::Walking&&!bMenu&&!bTablet)
    {
        const FRotator YawOnly(0,GetControlRotation().Yaw,0);
        AddMovementInput(YawOnly.Vector(),ForwardAxis);
        AddMovementInput(FRotationMatrix(YawOnly).GetUnitAxis(EAxis::Y),RightAxis);
    }
    const float Now=GetWorld()->GetTimeSeconds();
    if(View==EHelioView::Drone&&Ship->ControlledBot>=0)
    {
        const int B=Ship->ControlledBot;
        if(Ship->Bots[B].health<=0)
        {
            StaticUntil=Now+2; ExitRemote();
        }
        else if(!bMenu&&!bTablet)
        {
            const FRotator Rot(0,GetControlRotation().Yaw,0);
            Ship->MoveAgent(Ship->BotPositions[B],(Rot.Vector()*ForwardAxis+FRotationMatrix(Rot).GetUnitAxis(EAxis::Y)*RightAxis).GetClampedToMaxSize(1)*Dt*350,25);
        }
    }
    FTransform Target;
    if(View==EHelioView::Walking)
        Target=FTransform(GetControlRotation(),GetActorLocation()+FVector(0,0,bIsCrouched?35:64));
    else if(View==EHelioView::Cockpit)
    {
        FRotator Rot=GetControlRotation(); Rot.Pitch=FMath::Clamp(FRotator::NormalizeAxis(Rot.Pitch),-45.0,50.0); Rot.Yaw=FMath::Clamp(FRotator::NormalizeAxis(Rot.Yaw),-85.0,85.0);
        Target=FTransform(Rot,AHelioWorld::SeatTransform().GetLocation());
        if(!bMenu&&!bTablet) Throttle=FMath::Clamp(Throttle+ForwardAxis*Dt*.2f,0.f,1.f);
    }
    else if(View==EHelioView::Drone&&Ship->ControlledBot>=0)
        Target=FTransform(GetControlRotation(),Ship->BotPositions[Ship->ControlledBot]+FVector(35,0,18));
    else Target=AHelioWorld::SensorTransform(static_cast<int>(View)-static_cast<int>(EHelioView::LeftHull));
    BlendAlpha=FMath::Min(1.f,BlendAlpha+Dt/0.45f);
    const float Smooth=BlendAlpha*BlendAlpha*(3-2*BlendAlpha);
    Camera->SetWorldLocation(FMath::Lerp(BlendLocation,Target.GetLocation(),Smooth));
    Camera->SetWorldRotation(FQuat::Slerp(BlendRotation,Target.GetRotation(),Smooth));
    const bool Exterior=View==EHelioView::LeftHull||View==EHelioView::RightHull||View==EHelioView::Front;
    int32 W=1920,H=1080; if(auto* PC=Cast<APlayerController>(Controller)) PC->GetViewportSize(W,H);
    Ship->SetView(Exterior,Camera->GetComponentLocation(),Camera->GetComponentRotation(),Camera->FieldOfView,float(W)/FMath::Max(1,H));
    // Remote operation does not protect the abandoned physical body from local hazards.
    if(!bMenu&&FMath::Abs(GetActorLocation().Y)<700)
    {
        const auto& A=Ship->Atmospheres[Ship->RoomAt(GetActorLocation())];
        Health=FMath::Clamp(Health+(A.unsafe()?-8.f:2.f)*Dt,0.f,100.f);
        if(Health<=0)
        {
            if(View!=EHelioView::Walking) SetView(EHelioView::Walking);
            SetActorLocation(FVector(-320,0,96)); Health=100; StaticUntil=Now+2;
        }
    }
    if(GetActorLocation().Z<-1000) SetActorLocation(FVector(-320,0,96));
}
