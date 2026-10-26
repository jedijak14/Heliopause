#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "GameFramework/Character.h"
#include "GameFramework/GameModeBase.h"
#include "GameFramework/HUD.h"
#include "Subsystems/WorldSubsystem.h"
#include "Blueprint/UserWidget.h"
#include "UObject/Interface.h"
#include "InputActionValue.h"
#include "Tickable.h"
#include "FlightDynamics.h"
#include "HabitatRules.h"
#include "PlanetaryFlight.h"
#include "HeliopauseCore.generated.h"
class UStaticMesh; class UMaterialInterface; class UCameraComponent; class USpotLightComponent; class UPointLightComponent; class UStaticMeshComponent; class UAudioComponent; class UInputAction; class UInputMappingContext; class USoundBase; class USoundWaveProcedural; class ACameraActor; class ULevelSequence; class ULevelSequencePlayer; class UMaterialInstanceDynamic; class UProceduralMeshComponent; class UHPExpeditionSubsystem;
DECLARE_LOG_CATEGORY_EXTERN(LogHeliopause,Log,All);
UINTERFACE(BlueprintType)
class HELIOPAUSE_API UHPInteractable : public UInterface { GENERATED_BODY() };
class HELIOPAUSE_API IHPInteractable {
 GENERATED_BODY()
public:
 UFUNCTION(BlueprintNativeEvent,BlueprintCallable,Category="Heliopause") void Interact(AActor* InstigatorActor);
 UFUNCTION(BlueprintNativeEvent,BlueprintCallable,Category="Heliopause") FText GetPrompt() const;
};
USTRUCT(BlueprintType)
struct FHPVoiceLine {
 GENERATED_BODY()
 UPROPERTY(EditAnywhere,BlueprintReadWrite) FText Speaker;
 UPROPERTY(EditAnywhere,BlueprintReadWrite) FText Line;
 UPROPERTY(EditAnywhere,BlueprintReadWrite) TObjectPtr<USoundBase> Recording=nullptr;
};
DECLARE_DYNAMIC_MULTICAST_DELEGATE_ThreeParams(FHPSubtitleEvent,FText,Speaker,FText,Line,float,Duration);
UCLASS()
class HELIOPAUSE_API UEVASubsystem : public UWorldSubsystem, public FTickableGameObject {
 GENERATED_BODY()
public:
 virtual void Initialize(FSubsystemCollectionBase& C) override;
 virtual void Deinitialize() override;
 virtual void Tick(float Dt) override;
 virtual TStatId GetStatId() const override { RETURN_QUICK_DECLARE_CYCLE_STAT(UEVASubsystem,STATGROUP_Tickables); }
 virtual bool IsTickable() const override {return !IsTemplate();}
 virtual UWorld* GetTickableGameObjectWorld() const override{return GetWorld();}
 UFUNCTION(BlueprintCallable,Category="EVA") void Say(FName Id);
 UFUNCTION(BlueprintCallable,Category="EVA") void RegisterRecording(FName Id,USoundBase* Sound);
 UFUNCTION(BlueprintCallable,Category="EVA") void SetLine(FName Id,FText Speaker,FText Line);
 UFUNCTION(BlueprintCallable,Category="EVA") void Rescan();
 UFUNCTION(BlueprintCallable,Category="EVA") void Stop();
 UPROPERTY(BlueprintAssignable,Category="EVA") FHPSubtitleEvent OnSubtitle;
 FText CurrentSubtitle; float SubtitleRemaining=0; float LastDuration=0;
private:
 UPROPERTY() TMap<FName,FHPVoiceLine> Lines;
 UPROPERTY() TObjectPtr<UAudioComponent> Playback;
 UPROPERTY() TObjectPtr<USoundWaveProcedural> Stream;
 TMap<FName,FString> LocalFiles; TArray<FName> Queue;
 void* NativeVoice=nullptr;bool bOwnCom=false;float Remaining=0;
 void Add(const TCHAR* Id,const TCHAR* Who,const TCHAR* Text);
 bool PlayLocal(FName Id);
};
UCLASS()
class HELIOPAUSE_API ARoomLight : public AActor {
 GENERATED_BODY()
public:
 ARoomLight(); virtual void BeginPlay() override; virtual void Tick(float Dt) override;
 UPROPERTY(VisibleAnywhere,BlueprintReadOnly) TObjectPtr<UPointLightComponent> Light;
 UPROPERTY(VisibleAnywhere,BlueprintReadOnly) TObjectPtr<UStaticMeshComponent> Fixture;
 UPROPERTY(EditAnywhere,BlueprintReadOnly,Category="Room") FName RoomName=TEXT("COCKPIT");
 UPROPERTY(EditAnywhere,BlueprintReadOnly,Category="Room") float OnIntensity=5000;
 UPROPERTY(EditAnywhere,BlueprintReadOnly,Category="Room") bool bStartOn=true;
 UPROPERTY(EditAnywhere,Category="Room") TObjectPtr<USoundBase> SwitchSound;
 UFUNCTION(BlueprintCallable,Category="Room") void SetOn(bool bNewOn);
 UFUNCTION(BlueprintPure,Category="Room") bool IsOn() const{return bOn;}
private:
 bool bOn=true;float StateTime=10;
 UPROPERTY() TObjectPtr<UMaterialInstanceDynamic> FixtureMID;
 static float FlickerCurve(float T);
};
UCLASS()
class HELIOPAUSE_API AHandprintDoor : public AActor,public IHPInteractable {
 GENERATED_BODY()
public:
 AHandprintDoor();virtual void BeginPlay() override;virtual void Tick(float Dt) override;
 virtual void Interact_Implementation(AActor* InstigatorActor) override;virtual FText GetPrompt_Implementation() const override;
 UPROPERTY(VisibleAnywhere) TObjectPtr<USceneComponent> Root;
 UPROPERTY(VisibleAnywhere) TObjectPtr<UStaticMeshComponent> DoorMesh;
 UPROPERTY(VisibleAnywhere) TObjectPtr<UStaticMeshComponent> PadFront;
 UPROPERTY(VisibleAnywhere) TObjectPtr<UStaticMeshComponent> PadBack;
 UPROPERTY(VisibleAnywhere) TObjectPtr<UPointLightComponent> PadLight;
 UPROPERTY(EditAnywhere,BlueprintReadOnly,Category="Door") FName DoorName=TEXT("COCKPIT");
 UPROPERTY(EditAnywhere,Category="Door") float OpenHeight=300;
 UPROPERTY(EditAnywhere,Category="Door") float ScanTime=1.3f;
 UPROPERTY(EditAnywhere,Category="Door") float AutoCloseDelay=4;
 UPROPERTY(EditAnywhere,Category="Door") float AutoCloseDistance=250;
 UPROPERTY(EditAnywhere,Category="Door") TObjectPtr<USoundBase> ScanSound;
 UPROPERTY(EditAnywhere,Category="Door") TObjectPtr<USoundBase> GrantSound;
 UPROPERTY(EditAnywhere,Category="Door") TObjectPtr<USoundBase> OpenSound;
 UFUNCTION(BlueprintPure,Category="Door") bool IsOpen()const{return bTargetOpen;}
 bool HasOpenGap()const{return bTargetOpen||OpenAlpha>.01;}
 UFUNCTION(BlueprintCallable,Category="Door") void Close();
 UPROPERTY(BlueprintReadOnly,Category="Door") bool bAccessGranted=false;
 bool bSafetyLock=false,bDeploymentLock=false;int RoomA=0,RoomB=1;
 bool AccessBlocked()const{return bSafetyLock||bDeploymentLock;}
private:
 bool bTargetOpen=false,bSaidGrant=false;float OpenAlpha=0,ScanT=-1,Granted=0,IdleT=0;
 UPROPERTY() TArray<TObjectPtr<UMaterialInstanceDynamic>> PadMIDs;
};
UCLASS()
class HELIOPAUSE_API ACurtainWindow : public AActor,public IHPInteractable {
 GENERATED_BODY()
public:
 ACurtainWindow();virtual void BeginPlay()override;virtual void Tick(float Dt)override;
 virtual void Interact_Implementation(AActor* InstigatorActor)override;virtual FText GetPrompt_Implementation()const override;
 UPROPERTY(VisibleAnywhere) TObjectPtr<USceneComponent> Root;
 UPROPERTY(VisibleAnywhere) TObjectPtr<UStaticMeshComponent> CurtainMesh;
 UPROPERTY(EditAnywhere,BlueprintReadOnly,Category="Window") FName WindowName=TEXT("QUARTERS");
 UPROPERTY(EditAnywhere,Category="Window") FVector OpenOffset=FVector(0,0,320);
 UPROPERTY(EditAnywhere,Category="Window") bool bStartOpen=false;
 UPROPERTY(EditAnywhere,Category="Window") float Speed=2.2f;
 UPROPERTY(EditAnywhere,Category="Window") TObjectPtr<USoundBase> MotorSound;
 UFUNCTION(BlueprintCallable,Category="Window") void SetOpen(bool bNewOpen,bool bForce=false);
 UFUNCTION(BlueprintPure,Category="Window") bool IsOpen()const{return bOpen;}
 UPROPERTY(BlueprintReadOnly,Category="Window") bool bThermalLock=false;
private:
 bool bOpen=false;float Alpha=0;FVector ClosedLocation;
};
UENUM(BlueprintType)
enum class EHPAutopilot:uint8{Manual,EntrySurvey,Hold,ClimbToOrbit};
USTRUCT()
struct FHPHabitatModule {
 GENERATED_BODY()
 HPHabitat::State State;
 UPROPERTY() FName Name;
 UPROPERTY() int32 Side=1;
 UPROPERTY() float X=0;
 UPROPERTY() TObjectPtr<USceneComponent> Interior=nullptr;
 UPROPERTY() TObjectPtr<UStaticMeshComponent> Shell=nullptr;
 UPROPERTY() TObjectPtr<AHandprintDoor> Door=nullptr;
 UPROPERTY() TObjectPtr<UPointLightComponent> Light=nullptr;
};
UCLASS()
class HELIOPAUSE_API AShipManager : public AActor {
 GENERATED_BODY()
public:
 AShipManager();virtual void BeginPlay()override;virtual void Tick(float Dt)override;
 UFUNCTION(BlueprintPure,Category="Ship",meta=(WorldContext="WorldContextObject")) static AShipManager* GetShipManager(const UObject* WorldContextObject);
 UPROPERTY(EditAnywhere,Category="Setup") TArray<TObjectPtr<ACameraActor>> ExternalCameras;
 UPROPERTY(EditAnywhere,Category="Setup") TObjectPtr<AActor> AtmosphereActor;
 UPROPERTY(EditAnywhere,Category="Setup") float GroundRadiusKm=6360;
 UPROPERTY(EditAnywhere,Category="Setup") TObjectPtr<ULevelSequence> IntroSequence;
 UPROPERTY(EditAnywhere,Category="Setup") TMap<FName,TObjectPtr<USoundBase>> VoiceRecordings;
 UPROPERTY(EditAnywhere,Category="Setup") TObjectPtr<USoundBase> AlarmSound;
 UPROPERTY(BlueprintReadOnly,Category="Flight") float Velocity=7640;
 UPROPERTY(BlueprintReadOnly,Category="Flight") float Pitch=0;
 UPROPERTY(BlueprintReadOnly,Category="Flight") float Roll=0;
 UPROPERTY(BlueprintReadOnly,Category="Flight") float Yaw=0;
 UPROPERTY(BlueprintReadOnly,Category="Flight") FVector AtmosphericPositionKm=FVector(0,400,0);
 UFUNCTION(BlueprintCallable,Category="Flight") void SetManualInput(float Forward,float Turn,float PitchAxis,float RollAxis,float Vertical,float Lateral);
 void ReadFlightControls();
 HPFlight::Quat OrbitalOrientation{0,0,0,1};HPFlight::Vec OrbitalVelocity{0,0,-7.64};
 double FlightAxes[6]={};
 UPROPERTY(BlueprintReadOnly,Category="Flight") float TargetPitch=0;
 UPROPERTY(BlueprintReadOnly,Category="Flight") float Altitude=400;
 UPROPERTY(BlueprintReadOnly,Category="Flight") float Heat=0;
 UPROPERTY(BlueprintReadOnly,Category="Flight") float TimeWarp=1;
 UPROPERTY(BlueprintReadOnly,Category="Flight") EHPAutopilot Autopilot=EHPAutopilot::Manual;
 UPROPERTY(BlueprintReadOnly,Category="Flight") bool bThermalLock=false;
 UFUNCTION(BlueprintPure,Category="Flight") float GetVerticalSpeed()const;
 UFUNCTION(BlueprintCallable,Category="Flight") void SetAutopilot(EHPAutopilot Mode);
 UFUNCTION(BlueprintCallable,Category="Flight") void AdjustPitch(float DeltaDegrees);
 UFUNCTION(BlueprintCallable,Category="Flight") void AdjustThrust(float DeltaMs);
 UFUNCTION(BlueprintCallable,Category="Rooms") TArray<FName> GetRoomNames()const;
 UFUNCTION(BlueprintPure,Category="Rooms") bool IsRoomOn(FName Room)const;
 UFUNCTION(BlueprintCallable,Category="Rooms") void SetRoomLights(FName Room,bool bOn);
 UFUNCTION(BlueprintCallable,Category="Rooms") void SetAllLights(bool bOn);
 UFUNCTION(BlueprintCallable,Category="Rooms") TArray<ACurtainWindow*> GetWindows()const;
 UFUNCTION(BlueprintCallable,Category="Rooms") void SetWindowOpen(FName Name,bool bOpen);
 UFUNCTION(BlueprintCallable,Category="Rooms") void SetAllWindows(bool bOpen);
 UFUNCTION(BlueprintCallable,Category="Cameras") void SetCamera(int32 Index);
 UFUNCTION(BlueprintCallable,Category="Cameras") void CycleCamera();
 void OrbitCamera(float DeltaYaw,float DeltaPitch,float Zoom=0);
 bool IsOrbitCamera()const{return OrbitCameraIndex>0&&CameraIndex==OrbitCameraIndex;}
 UFUNCTION(BlueprintPure,Category="Cameras") int32 GetCameraIndex()const{return CameraIndex;}
 UFUNCTION(BlueprintPure,Category="Cameras") int32 GetCameraCount()const{return ExternalCameras.Num()+1;}
 UFUNCTION(BlueprintCallable,Category="Story") void BeginGame(bool bStory);
 UFUNCTION(BlueprintCallable,Category="Story") void SkipIntro();
 UFUNCTION(BlueprintCallable,Category="Story") void NotifyTabletOpened(){bTabletOpened=true;}
 UFUNCTION(BlueprintPure,Category="Story") FText GetObjectiveText()const;
 UFUNCTION(BlueprintPure,Category="Story") bool IsInCutscene()const{return bInCutscene;}
 int32 GetStoryStep()const{return StoryStep;}bool IsStory()const{return bStoryMode;}
 UHPExpeditionSubsystem* Expedition()const;
 void PlayScene(FName Id);void TogglePilot();void BoardStation();void ReturnToShip();bool AtExchange()const;
 void Repair(int Room);void RequestRepair(int Room);float RepairRemaining[4]={};void SetHazard(int Room,bool Thermal);void ControlDrone(int Index);void DriveDrone(FVector2D Input);void DamageDrone(int Index,float Damage);void ScanUse(int Tool);
 bool bPilot=false,bMenu=true;int ControlledDrone=-1;float StaticTime=0,Thrust=0;
 float Pressure[4]={1,1,1,1},Temperature[4]={21,21,21,21};bool Breach[4]={},Venting[4]={};
 float DroneHealth[3]={100,100,100};int DroneRoom[3]={2,3,1};int Intruders=0;
 void BuildShip();void UpdateWorld(float Dt);
 void BuildHabitats();void TickHabitats(float Dt);void LoadHabitat(int32 Index);void UnloadHabitat(int32 Index);
 bool RequestHabitat(int32 Index,bool Deploy);bool HabitatsInterlocked()const;
 UPROPERTY() TArray<FHPHabitatModule> Habitats;
 void AddLicensedModel(USceneComponent* Parent,const FString& Key,FVector Position,float Height,float Yaw=0);
 void TickPlanetaryWorld();void OnTerrainContact(const HPPlanet::Contact& Contact);void LaunchFromSurface();void BuildAirlock();
 bool bLanded=false,bOutsideShip=false;int32 LandedPlanet=-1;
 UPROPERTY() TObjectPtr<AHandprintDoor> InnerAirlock=nullptr;
 UPROPERTY() TObjectPtr<AHandprintDoor> OuterAirlock=nullptr;
 UPROPERTY() TObjectPtr<UProceduralMeshComponent> TerrainPatch=nullptr;
 HPFlight::Vec TerrainAnchor{0,1,0};int32 TerrainPlanet=-1;
private:
 UPROPERTY() TArray<TObjectPtr<ARoomLight>> Lights;
 UPROPERTY() TArray<TObjectPtr<ACurtainWindow>> Windows;
 UPROPERTY() TArray<TObjectPtr<AHandprintDoor>> Doors;
 UPROPERTY() TObjectPtr<ULevelSequencePlayer> IntroPlayer;
 UPROPERTY() TObjectPtr<ACameraActor> CinemaCamera;
 UPROPERTY() TObjectPtr<ACameraActor> DroneCamera;
 UPROPERTY() TObjectPtr<ACameraActor> OrbitView;
 int32 OrbitCameraIndex=-1;float OrbitYaw=145,OrbitPitch=22,OrbitDistance=6500;
 UPROPERTY() TArray<TObjectPtr<USceneComponent>> RoomRoots;
 UPROPERTY() TObjectPtr<USceneComponent> HullRoot;
 UPROPERTY() TObjectPtr<USceneComponent> StationRoot;
 UPROPERTY() TArray<TObjectPtr<USceneComponent>> SiteRoots;
 UPROPERTY() TArray<TObjectPtr<USceneComponent>> DroneRoots;
 UPROPERTY() TArray<TObjectPtr<USceneComponent>> CrowdRoots;
 UPROPERTY() TObjectPtr<USceneComponent> CoreRoot;
 UPROPERTY() TObjectPtr<UStaticMesh> CubeAsset;
 UPROPERTY() TObjectPtr<UMaterialInterface> SurfaceAsset;
 UPROPERTY() TMap<FString,TObjectPtr<UMaterialInstanceDynamic>> Materials;
 UStaticMeshComponent* Box(USceneComponent* Parent,FVector Position,FVector Size,FLinearColor Tint,bool Collision=false);
 TArray<bool> ShadeMemory;int CameraIndex=0;bool bStoryMode=false,bInCutscene=false,bSurveyed=false,bTabletOpened=false;
 int StoryStep=0;float HoldTime=0,CutTime=0,CutDuration=0,AIClock=0;FTimerHandle IntroLineTimer;FName CurrentScene;
 TArray<FName> SceneQueue;
 UFUNCTION() void OnIntroFinished();void TickFlight(float Dt);void UpdateThermalProtection();void TickStory();void AdvanceStory();void Say(FName Id);
 AHandprintDoor* FindDoor(FName Name)const;ACurtainWindow* FindWindow(FName Name)const;
};
UCLASS()
class HELIOPAUSE_API AHPEngineeringBreaker:public AActor,public IHPInteractable {
 GENERATED_BODY()
public:AHPEngineeringBreaker();
 virtual void Interact_Implementation(AActor* InstigatorActor)override;
 virtual FText GetPrompt_Implementation()const override;
};
UCLASS(Abstract)
class HELIOPAUSE_API UHPHudWidget:public UUserWidget{
 GENERATED_BODY()
public:
 virtual void NativeConstruct()override;
 UFUNCTION(BlueprintImplementableEvent,Category="HUD")void ShowSubtitle(const FText& Speaker,const FText& Line,float Duration);
 UFUNCTION(BlueprintPure,Category="HUD")FText GetPromptText()const;
 UFUNCTION(BlueprintPure,Category="HUD")FText GetObjectiveText()const;
 UFUNCTION(BlueprintPure,Category="HUD")FText GetFlightText()const;
 UFUNCTION(BlueprintPure,Category="HUD")float GetHeat()const;
private:UFUNCTION()void HandleSubtitle(FText Speaker,FText Line,float Duration);
};
UCLASS(Abstract)
class HELIOPAUSE_API UHPTabletWidget:public UUserWidget{
 GENERATED_BODY()
public:
 UFUNCTION(BlueprintPure,Category="Tablet")AShipManager* GetShip()const;
 UFUNCTION(BlueprintPure,Category="Tablet")FText GetClockText()const;
 UFUNCTION(BlueprintPure,Category="Tablet")FText GetDateText()const;
 UFUNCTION(BlueprintCallable,Category="Tablet")void CloseTablet();
 UFUNCTION(BlueprintCallable,Category="Tablet")void ToggleFlashlight();
};
UCLASS(Abstract)
class HELIOPAUSE_API UHPMainMenuWidget:public UUserWidget{
 GENERATED_BODY()
public:UFUNCTION(BlueprintCallable,Category="Menu")void StartGame(bool bStory);
 UFUNCTION(BlueprintCallable,Category="Menu")void QuitGame();
};
UCLASS()
class HELIOPAUSE_API AHeliopauseCharacter:public ACharacter{
 GENERATED_BODY()
public:
 AHeliopauseCharacter();virtual void BeginPlay()override;virtual void Tick(float Dt)override;virtual void SetupPlayerInputComponent(UInputComponent* Input)override;
 UPROPERTY(VisibleAnywhere,BlueprintReadOnly)TObjectPtr<UCameraComponent> Camera;
 UPROPERTY(VisibleAnywhere,BlueprintReadOnly)TObjectPtr<USpotLightComponent> Flashlight;
 UPROPERTY(VisibleAnywhere,BlueprintReadOnly)TObjectPtr<UAudioComponent> BreathAudio;
 UPROPERTY(EditAnywhere,Category="UI")TSubclassOf<UHPHudWidget> HudClass;
 UPROPERTY(EditAnywhere,Category="UI")TSubclassOf<UHPTabletWidget> TabletClass;
 UPROPERTY(EditAnywhere,Category="Audio") TObjectPtr<USoundBase> BreathingSound;
 UPROPERTY(EditAnywhere,Category="Audio") TObjectPtr<USoundBase> FootstepSound;
 UPROPERTY(EditAnywhere,Category="Audio") TObjectPtr<USoundBase> TabletSound;
 UPROPERTY(EditAnywhere,Category="Movement") float WalkSpeed=170;
 UPROPERTY(EditAnywhere,Category="Movement") float RunSpeed=320;
 UPROPERTY(EditAnywhere,Category="Interact")float InteractRange=240;
 UFUNCTION(BlueprintCallable,Category="Player")void ToggleTablet();
 UFUNCTION(BlueprintCallable,Category="Player")void ToggleFlashlight();
 UFUNCTION(BlueprintPure,Category="Player")FText GetCurrentPrompt()const;
 UFUNCTION(BlueprintPure,Category="Player")bool IsTabletOpen()const;
 void SetMenu(bool Open);bool bFallbackTablet=false;bool bBreathingEnabled=false;
private:
 UPROPERTY(Transient)TObjectPtr<UInputMappingContext> Mapping;
 UPROPERTY(Transient) TObjectPtr<UInputAction> MoveAction;
 UPROPERTY(Transient) TObjectPtr<UInputAction> LookAction;
 UPROPERTY(Transient) TObjectPtr<UInputAction> InteractAction;
 UPROPERTY(Transient) TObjectPtr<UInputAction> TabletAction;
 UPROPERTY(Transient) TObjectPtr<UInputAction> FlashAction;
 UPROPERTY(Transient) TObjectPtr<UInputAction> CameraAction;
 UPROPERTY(Transient) TObjectPtr<UInputAction> RunAction;
 UPROPERTY(Transient) TObjectPtr<UInputAction> CrouchAction;
 UPROPERTY(Transient) TObjectPtr<UInputAction> SkipAction;
 UPROPERTY()TObjectPtr<UHPHudWidget> HudWidget;
 UPROPERTY()TObjectPtr<UHPTabletWidget> TabletWidget;
 UPROPERTY() TObjectPtr<USoundWaveProcedural> BreathStream;
 TArray<uint8> BreathPCM;
 TWeakObjectPtr<AActor> FocusActor;float StepDistance=0;FVector BaseCameraOffset=FVector(0,0,64);
 void BuildInput();bool CanAct()const;
 void Move(const FInputActionValue& V);void Look(const FInputActionValue& V);void DoInteract(const FInputActionValue& V);void DoTablet(const FInputActionValue& V);void DoFlash(const FInputActionValue& V);void DoCamera(const FInputActionValue& V);void RunStart(const FInputActionValue& V);void RunStop(const FInputActionValue& V);void CrouchStart(const FInputActionValue& V);void CrouchStop(const FInputActionValue& V);void DoSkip(const FInputActionValue& V);
};
UCLASS()
class HELIOPAUSE_API AHPNativeHUD:public AHUD{
 GENERATED_BODY()
public:virtual void DrawHUD()override;virtual void NotifyHitBoxClick(FName Id)override;
private:int Tab=0;void Button(FName Id,const FString& Text,float X,float Y,float Width);void Text(const FString& T,float X,float Y,FLinearColor Color=FLinearColor(.7,.85,.85),float Scale=1);
};
UCLASS()
class HELIOPAUSE_API AHeliopauseGameMode:public AGameModeBase{
 GENERATED_BODY()
public:AHeliopauseGameMode();virtual void BeginPlay()override;
 UPROPERTY(EditAnywhere,Category="UI")TSubclassOf<UHPMainMenuWidget> MainMenuClass;
};
