#include "HPExpeditionSubsystem.h"
#include "Kismet/GameplayStatics.h"
#include "Engine/World.h"
#include "HeliopauseCore.h"
void UHPExpeditionSubsystem::Initialize(FSubsystemCollectionBase& C){Super::Initialize(C);Load();}
void UHPExpeditionSubsystem::Deinitialize(){Save();Super::Deinitialize();}
void UHPExpeditionSubsystem::Tick(float Dt){if(!GetWorld()||!GetWorld()->IsGameWorld())return;if(auto* Ship=AShipManager::GetShipManager(this))if(Ship->bMenu||Ship->IsInCutscene()||(Ship->IsStory()&&Ship->GetStoryStep()<8))return;State.step(Dt,Thrust,Turn,PitchControl);SaveClock+=Dt;if(SaveClock>15){SaveClock=0;Save();}}
bool UHPExpeditionSubsystem::Command(HelioExplore::Command Cmd){const bool Ok=State.command(Cmd);if(Cmd==HelioExplore::Command::Brake)Thrust=0;if(Ok)Save();return Ok;}
bool UHPExpeditionSubsystem::Save(){
    auto* S=Cast<UHPExpeditionSave>(UGameplayStatics::CreateSaveGameObject(UHPExpeditionSave::StaticClass()));if(!S)return false;
    S->CampaignStarted=CampaignStarted;S->CampaignStep=CampaignStep;S->CampaignAltitude=CampaignAltitude;
    S->Position=FVector(State.position[0],State.position[1],State.position[2]);S->Yaw=State.yaw;S->Pitch=State.pitch;S->Travel=State.totalTravel;
    S->Target=State.target;S->Docked=State.docked;S->Credits=State.credits;S->EngineLevel=State.engine;S->SensorLevel=State.sensor;
    S->Scanned=State.scanned;S->Recovered=State.recovered;S->Sold=State.sold;S->ArtifactSold=State.artifactSold;S->Visited=State.visited;
    bSaveFailed=!UGameplayStatics::SaveGameToSlot(S,TEXT("Heliopause_Expedition_v1"),0);return !bSaveFailed;
}
bool UHPExpeditionSubsystem::Load(){
    auto* S=Cast<UHPExpeditionSave>(UGameplayStatics::LoadGameFromSlot(TEXT("Heliopause_Expedition_v1"),0));if(!S||S->Version!=1)return false;
    HelioExplore::State Candidate;Candidate.position={S->Position.X,S->Position.Y,S->Position.Z};Candidate.yaw=S->Yaw;Candidate.pitch=S->Pitch;Candidate.totalTravel=S->Travel;
    Candidate.target=S->Target;Candidate.docked=S->Docked;Candidate.credits=S->Credits;Candidate.engine=S->EngineLevel;Candidate.sensor=S->SensorLevel;
    Candidate.scanned=S->Scanned;Candidate.recovered=S->Recovered;Candidate.sold=S->Sold;Candidate.artifactSold=S->ArtifactSold;Candidate.visited=S->Visited;
    if(!Candidate.valid())return false;
    Candidate.pitch=std::clamp(Candidate.pitch,-1.3,1.3);Candidate.complete=true;
    for(int i=0;i<int(HelioExplore::Sites.size());++i)if(HelioExplore::Sites[i].reward>0&&!(Candidate.sold&HelioExplore::bit(i)))Candidate.complete=false;
    CampaignStarted=S->CampaignStarted;CampaignStep=FMath::Clamp(S->CampaignStep,0,11);CampaignAltitude=FMath::Clamp(S->CampaignAltitude,55.f,400.f);
    State=Candidate;State.message="Expedition restored. Ship holding position.";return true;
}
