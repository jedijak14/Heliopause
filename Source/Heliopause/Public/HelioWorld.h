#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "SimulationCore.h"
#include "HelioWorld.generated.h"
class UProceduralMeshComponent;
class UBoxComponent;
class UInstancedStaticMeshComponent;
class UPointLightComponent;
class UMaterialInstanceDynamic;
class UMaterialInterface;
class UStaticMesh;

UCLASS()
class HELIOPAUSE_API AHelioWorld : public AActor
{
    GENERATED_BODY()
public:
    AHelioWorld();
    virtual void BeginPlay() override;
    virtual void Tick(float Dt) override;
    static const TCHAR* RoomName(int Room);
    static FVector RoomCenter(int Room);
    static FTransform SensorTransform(int Index);
    static FTransform SeatTransform();
    int RoomAt(FVector Location) const;
    bool MoveAgent(FVector& Position, FVector Delta, float Radius = 35.f) const;
    void SetView(bool Exterior, FVector Eye, FRotator Rotation, float Fov, float Aspect);
    void SetFlight(Helio::Flight Mode);
    void ToggleDoor(int Index);
    void TriggerHazard(int Room, bool Thermal);
    void RepairRoom(int Room);
    void Board();
    void SetControlledBot(int Index);
    void DamageBot(int Index, float Amount);
    void UseTool(FVector Origin, FVector Direction, int Tool);
    bool IsDoorLocked(int Index) const;
    bool IsDoorOpen(int Index) const;
    Helio::Flight FlightMode = Helio::Flight::Docked;
    std::array<Helio::Atmosphere, 4> Atmospheres;
    std::array<Helio::Bot, 3> Bots;
    std::array<FVector, 3> BotPositions;
    int ControlledBot = -1;
    int Intruders = 0;
    float FlightTime = 0;
    bool bStory = true;
    int StoryStep = 0;
    FString Directive() const;
private:
    UPROPERTY() TMap<FString, TObjectPtr<UMaterialInstanceDynamic>> MaterialCache;
    UPROPERTY() TObjectPtr<UMaterialInterface> HullMaterial;
    UPROPERTY() TObjectPtr<UStaticMesh> CrowdPrimitive;
    UPROPERTY() TObjectPtr<USceneComponent> Root;
    UPROPERTY() TArray<TObjectPtr<USceneComponent>> Rooms;
    UPROPERTY() TObjectPtr<USceneComponent> ExteriorRoot;
    UPROPERTY() TObjectPtr<USceneComponent> StationRoot;
    UPROPERTY() TArray<TObjectPtr<UBoxComponent>> Doors;
    UPROPERTY() TArray<TObjectPtr<UProceduralMeshComponent>> BotMeshes;
    UPROPERTY() TArray<TObjectPtr<UProceduralMeshComponent>> AlienMeshes;
    UPROPERTY() TArray<TObjectPtr<UPointLightComponent>> Lights;
    UPROPERTY() TObjectPtr<UProceduralMeshComponent> CoreMesh;
    UPROPERTY() TObjectPtr<UMaterialInstanceDynamic> CoreMaterial;
    UPROPERTY() TObjectPtr<UInstancedStaticMeshComponent> Crowd;
    std::array<bool, 4> DoorOpen{false, false, false, false};
    std::array<int, 3> BotGoals{1, 2, 3};
    TArray<FVector> AlienPositions;
    TArray<FVector> CrowdPositions;
    TArray<FVector> CrowdGoals;
    float AiAccumulator = 0;
    float NextBoarding = 90;
    float Clock = 0;
    bool bExteriorView = false;
    void BuildInterior();
    void BuildHull();
    void BuildStation();
    void StepAI(float Dt);
    void RefreshDoors();
    void Announce(const FString& Event, const FString& Text);
    UProceduralMeshComponent* Mesh(USceneComponent* Parent, const TArray<FVector>& Vertices, const TArray<int32>& Indices, FLinearColor Color);
    UProceduralMeshComponent* Box(USceneComponent* Parent, FVector Center, FVector Extent, FLinearColor Color, bool Collision = false);
    UProceduralMeshComponent* Bell(USceneComponent* Parent, FVector Position, float Length, float Inlet, float Outlet, FRotator Rotation, FLinearColor Color);
    UBoxComponent* Collider(USceneComponent* Parent, FVector Center, FVector Extent);
};
