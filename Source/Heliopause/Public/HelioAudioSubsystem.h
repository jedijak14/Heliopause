#pragma once
#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "Tickable.h"
#include "HelioAudioSubsystem.generated.h"
class UAudioComponent;
class USoundWaveProcedural;
UCLASS()
class HELIOPAUSE_API UHelioAudioSubsystem : public UGameInstanceSubsystem, public FTickableGameObject
{
    GENERATED_BODY()
public:
    virtual void Initialize(FSubsystemCollectionBase& Collection) override;
    virtual void Deinitialize() override;
    virtual void Tick(float Dt) override;
    virtual TStatId GetStatId() const override { RETURN_QUICK_DECLARE_CYCLE_STAT(UHelioAudioSubsystem, STATGROUP_Tickables); }
    virtual bool IsTickable() const override { return !IsTemplate(); }
    virtual UWorld* GetTickableGameObjectWorld() const override { return GetWorld(); }
    void Rescan();
    void Enqueue(const FString& Key, const FString& Text);
    void Stop();
    bool bVoice = true;
    FString Subtitle;
    float SubtitleUntil = 0;
    TMap<FString, FString> Index;
    FString Status;
private:
    struct FEvent { FString Key; FString Text; };
    TArray<FEvent> Queue;
    UPROPERTY() TObjectPtr<UAudioComponent> Active;
    UPROPERTY() TObjectPtr<USoundWaveProcedural> Wave;
    UPROPERTY() TObjectPtr<UAudioComponent> Ambient;
    UPROPERTY() TObjectPtr<USoundWaveProcedural> AmbientWave;
    float Remaining = 0;
    float AmbientRemaining = 0;
    void* NativeVoice = nullptr;
    bool bOwnCom = false;
    bool PlayFile(const FString& Path, bool bAmbient = false);
};
