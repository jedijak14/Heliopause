#pragma once
#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "GameFramework/SaveGame.h"
#include "Tickable.h"
#include "ExplorationCore.h"
#include "WarpFlight.h"
#include "HPExpeditionSubsystem.generated.h"
UCLASS()
class HELIOPAUSE_API UHPExpeditionSave : public USaveGame
{
    GENERATED_BODY()
public:
    UPROPERTY() int32 Version=3;
    UPROPERTY() TMap<FName,bool> HabitatDeployment;
 UPROPERTY() int32 LandedPlanet=-1;
    UPROPERTY() TMap<FName,bool> RoomLights;
    UPROPERTY() TMap<FName,bool> DoorAccess;
    UPROPERTY() TMap<FName,bool> WindowStates;
    UPROPERTY() TArray<float> Pressure;
    UPROPERTY() TArray<float> Temperature;
    UPROPERTY() TArray<bool> Breaches;
    UPROPERTY() TArray<bool> Vents;
    UPROPERTY() bool CampaignStarted=false;
    UPROPERTY() int32 CampaignStep=0;
    UPROPERTY() float CampaignAltitude=400;
    UPROPERTY() FVector Position=FVector(0,0,.56);
    UPROPERTY() double Yaw=0;
    UPROPERTY() double Pitch=0;
    UPROPERTY() FQuat Orientation=FQuat::Identity;
    UPROPERTY() bool HasOrientation=false;
    UPROPERTY() double Roll=0;
    UPROPERTY() double Travel=0;
    UPROPERTY() int32 Target=3;
    UPROPERTY() int32 Docked=0;
    UPROPERTY() int32 Credits=0;
    UPROPERTY() int32 EngineLevel=0;
    UPROPERTY() int32 SensorLevel=0;
    UPROPERTY() int64 ScannedWide=0;
    UPROPERTY() int64 RecoveredWide=0;
    UPROPERTY() int64 SoldWide=0;
    UPROPERTY() int64 ArtifactSoldWide=0;
    UPROPERTY() int64 VisitedWide=1;
    // Retained for v1/v2 save migration.
    UPROPERTY() int32 Scanned=0;
    UPROPERTY() int32 Recovered=0;
    UPROPERTY() int32 Sold=0;
    UPROPERTY() int32 ArtifactSold=0;
    UPROPERTY() int32 Visited=1;
};
UCLASS()
class HELIOPAUSE_API UHPExpeditionSubsystem : public UGameInstanceSubsystem, public FTickableGameObject
{
    GENERATED_BODY()
public:
    virtual void Initialize(FSubsystemCollectionBase& Collection) override;
    virtual void Deinitialize() override;
    virtual void Tick(float Dt) override;
    virtual TStatId GetStatId() const override { RETURN_QUICK_DECLARE_CYCLE_STAT(UHPExpeditionSubsystem, STATGROUP_Tickables); }
    virtual bool IsTickable() const override { return !IsTemplate(); }
    virtual UWorld* GetTickableGameObjectWorld() const override { return GetWorld(); }
    bool Save();
    UFUNCTION(BlueprintCallable,Category="Flight|Warp") bool EngageWarp();
    UFUNCTION(BlueprintCallable,Category="Flight|Warp") bool CancelWarp();
    bool SelectTarget(int Index);
    UFUNCTION(BlueprintPure,Category="Flight|Warp") bool IsWarpActive() const { return Warp.active(); }
    UFUNCTION(BlueprintPure,Category="Flight|Warp") float GetWarpProgress() const { return float(Warp.progress); }
    UFUNCTION(BlueprintPure,Category="Flight|Warp") float GetWarpStrength() const { return float(Warp.strength); }
    bool IsSaveQueued() const { return bSaveQueued; }
    HPWarp::State Warp;
    bool Load();
    void RestoreShip(class AShipManager* Ship);
    bool Command(HelioExplore::Command Cmd);
    HelioExplore::State State;
    double Thrust=0,Turn=0,PitchControl=0,RollControl=0,VerticalControl=0,LateralControl=0;
    bool bSaveFailed=false;
    bool CampaignStarted=false;int CampaignStep=0;float CampaignAltitude=400;
private:
    UPROPERTY() TObjectPtr<UHPExpeditionSave> LoadedSnapshot;
    float SaveClock=0;
    bool bSaveQueued=false;
    void ClearFlightInput();
    void FinishWarp();
};
