#include "HPExpeditionSubsystem.h"
#include "Kismet/GameplayStatics.h"
#include "Engine/World.h"
#include "HeliopauseCore.h"
#include "EngineUtils.h"
void UHPExpeditionSubsystem::Initialize(FSubsystemCollectionBase& C){Super::Initialize(C);Load();}
void UHPExpeditionSubsystem::Deinitialize(){Save();Super::Deinitialize();}
void UHPExpeditionSubsystem::Tick(float Dt){if(!GetWorld()||!GetWorld()->IsGameWorld())return;if(auto* Ship=AShipManager::GetShipManager(this))if(Ship->bMenu||Ship->IsInCutscene()||(Ship->IsStory()&&Ship->GetStoryStep()<8))return;if(auto* Ship=AShipManager::GetShipManager(this);Ship&&(Ship->HabitatsInterlocked()||Ship->bLanded)){Thrust=0;State.velocity={0,0,0};State.autopilot=false;}else{const auto Old=State.position;const auto World=HPPlanet::nearest(State);const double Heat=HPPlanet::atmosphere(State,World,Dt),Precision=World.altitude<500?.01+.99*std::clamp(World.altitude/500,0.,1.):1.;State.step(Dt,Thrust*Precision,Turn,PitchControl,RollControl,VerticalControl*Precision,LateralControl*Precision,!State.autopilot);const auto Contact=HPPlanet::contact(State,Old);if(auto* Ship=AShipManager::GetShipManager(this)){Ship->Heat=Heat;if(Contact.planet>=0)Ship->OnTerrainContact(Contact);}}SaveClock+=Dt;if(SaveClock>15){SaveClock=0;Save();}}
bool UHPExpeditionSubsystem::Command(HelioExplore::Command Cmd){if(auto* Ship=AShipManager::GetShipManager(this);Ship&&Ship->HabitatsInterlocked()&&(Cmd==HelioExplore::Command::Navigate||Cmd==HelioExplore::Command::Undock)){State.message="Compact all habitats before flight.";return false;}const bool Ok=State.command(Cmd);if(Cmd==HelioExplore::Command::Brake)Thrust=0;if(Ok)Save();return Ok;}
bool UHPExpeditionSubsystem::Save(){
    auto* S=Cast<UHPExpeditionSave>(UGameplayStatics::CreateSaveGameObject(UHPExpeditionSave::StaticClass()));if(!S)return false;
    S->CampaignStarted=CampaignStarted;S->CampaignStep=CampaignStep;S->CampaignAltitude=CampaignAltitude;
    S->Position=FVector(State.position[0],State.position[1],State.position[2]);S->Yaw=State.yaw;S->Pitch=State.pitch;S->Roll=State.roll;S->Orientation=FQuat(State.orientation[0],State.orientation[1],State.orientation[2],State.orientation[3]);S->HasOrientation=true;S->Travel=State.totalTravel;
    S->Target=State.target;S->Docked=State.docked;S->Credits=State.credits;S->EngineLevel=State.engine;S->SensorLevel=State.sensor;
    S->ScannedWide=State.scanned;S->RecoveredWide=State.recovered;S->SoldWide=State.sold;S->ArtifactSoldWide=State.artifactSold;S->VisitedWide=State.visited;
    if(auto* Ship=AShipManager::GetShipManager(this)){S->LandedPlanet=Ship->bLanded?Ship->LandedPlanet:-1;for(const auto& H:Ship->Habitats)S->HabitatDeployment.Add(H.Name,H.State.phase==HPHabitat::Phase::Deployed);for(FName Name:Ship->GetRoomNames())S->RoomLights.Add(Name,Ship->IsRoomOn(Name));for(ACurtainWindow* W:Ship->GetWindows())if(W)S->WindowStates.Add(W->WindowName,W->IsOpen());for(TActorIterator<AHandprintDoor> D(GetWorld());D;++D)S->DoorAccess.Add(D->DoorName,D->bAccessGranted);for(int I=0;I<4;++I){S->Pressure.Add(Ship->Pressure[I]);S->Temperature.Add(Ship->Temperature[I]);S->Breaches.Add(Ship->Breach[I]);S->Vents.Add(Ship->Venting[I]);}}
    bSaveFailed=!UGameplayStatics::SaveGameToSlot(S,TEXT("Heliopause_Expedition_v1"),0);return !bSaveFailed;
}
bool UHPExpeditionSubsystem::Load(){
    auto* S=Cast<UHPExpeditionSave>(UGameplayStatics::LoadGameFromSlot(TEXT("Heliopause_Expedition_v1"),0));if(!S||(S->Version<1||S->Version>3))return false;
    HelioExplore::State Candidate;Candidate.position={S->Position.X,S->Position.Y,S->Position.Z};Candidate.yaw=S->Yaw;Candidate.pitch=S->Pitch;Candidate.roll=S->Roll;Candidate.orientation=S->HasOrientation?HPFlight::Quat{S->Orientation.X,S->Orientation.Y,S->Orientation.Z,S->Orientation.W}:HPFlight::euler(S->Yaw,S->Pitch);Candidate.totalTravel=S->Travel;
    Candidate.target=S->Target;Candidate.docked=S->Docked;Candidate.credits=S->Credits;Candidate.engine=S->EngineLevel;Candidate.sensor=S->SensorLevel;
    Candidate.scanned=S->Version>=3?S->ScannedWide:uint32(S->Scanned);Candidate.recovered=S->Version>=3?S->RecoveredWide:uint32(S->Recovered);Candidate.sold=S->Version>=3?S->SoldWide:uint32(S->Sold);Candidate.artifactSold=S->Version>=3?S->ArtifactSoldWide:uint32(S->ArtifactSold);Candidate.visited=S->Version>=3?S->VisitedWide:uint32(S->Visited);
    if(!Candidate.valid())return false;
    Candidate.pitch=std::clamp(Candidate.pitch,-1.5707963267948966,1.5707963267948966);Candidate.complete=true;
    for(int i=0;i<int(HelioExplore::Sites.size());++i)if(HelioExplore::Sites[i].reward>0&&!(Candidate.sold&HelioExplore::bit(i)))Candidate.complete=false;
    CampaignStarted=S->CampaignStarted;CampaignStep=FMath::Clamp(S->CampaignStep+(S->Version==1&&S->CampaignStep>=9?3:0),0,14);CampaignAltitude=FMath::Clamp(S->CampaignAltitude,55.f,400.f);
    LoadedSnapshot=S;State=Candidate;State.message="Expedition restored. Ship holding position.";return true;
}

void UHPExpeditionSubsystem::RestoreShip(AShipManager* Ship){if(!Ship||!LoadedSnapshot)return;const auto* S=LoadedSnapshot.Get();const auto W=HPPlanet::nearest(State);Ship->bLanded=S->LandedPlanet==W.planet&&W.planet>=0&&W.planet!=13&&FMath::Abs(W.altitude-.45)<1;Ship->LandedPlanet=Ship->bLanded?W.planet:-1;for(int I=0;I<Ship->Habitats.Num();++I){auto& H=Ship->Habitats[I];if(const bool* Deployed=S->HabitatDeployment.Find(H.Name);Deployed&&*Deployed){H.State.phase=HPHabitat::Phase::Deployed;H.State.fraction=1;Ship->LoadHabitat(I);}}for(const auto& P:S->RoomLights)Ship->SetRoomLights(P.Key,P.Value);for(const auto& P:S->WindowStates)Ship->SetWindowOpen(P.Key,P.Value);for(TActorIterator<AHandprintDoor> D(GetWorld());D;++D)if(const bool* Access=S->DoorAccess.Find(D->DoorName))D->bAccessGranted=*Access;for(int I=0;I<4;++I){if(S->Pressure.IsValidIndex(I)&&FMath::IsFinite(S->Pressure[I]))Ship->Pressure[I]=FMath::Clamp(S->Pressure[I],0.f,1.f);if(S->Temperature.IsValidIndex(I)&&FMath::IsFinite(S->Temperature[I]))Ship->Temperature[I]=FMath::Clamp(S->Temperature[I],-80.f,220.f);if(S->Breaches.IsValidIndex(I))Ship->Breach[I]=S->Breaches[I];if(S->Vents.IsValidIndex(I))Ship->Venting[I]=S->Vents[I];}}
