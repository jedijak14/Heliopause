#include "HeliopauseCore.h"
#include "HPExpeditionSubsystem.h"
#include "ProceduralMeshComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Components/PointLightComponent.h"
#include "Engine/World.h"
#include "Kismet/GameplayStatics.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"
#include "Materials/MaterialInstanceDynamic.h"
namespace {
TSharedPtr<FJsonObject> ModelLibrary(){static TSharedPtr<FJsonObject> Data;if(Data)return Data;FString Text;if(!FFileHelper::LoadFileToString(Text,*(FPaths::ProjectContentDir()/TEXT("ThirdParty/Kenney/meshes.json"))))return nullptr;FJsonSerializer::Deserialize(TJsonReaderFactory<>::Create(Text),Data);return Data;}
USceneComponent* RootFor(AActor* Owner,USceneComponent* Parent,FVector Position){auto* R=NewObject<USceneComponent>(Owner);R->SetupAttachment(Parent);R->SetRelativeLocation(Position);R->RegisterComponent();return R;}
}
void AShipManager::AddLicensedModel(USceneComponent* Parent,const FString& Key,FVector Position,float Height,float Yaw){
 const auto Data=ModelLibrary();if(!Data||!Data->HasTypedField<EJson::Object>(Key)){UE_LOG(LogHeliopause,Error,TEXT("Bundled mesh missing: %s"),*Key);return;}
 const auto Model=Data->GetObjectField(Key);const auto& Bounds=Model->GetArrayField(TEXT("bounds"));const auto& Lo=Bounds[0]->AsArray();const auto& Hi=Bounds[1]->AsArray();const double Scale=Height/FMath::Max(.001,Hi[1]->AsNumber()-Lo[1]->AsNumber()),CX=(Lo[0]->AsNumber()+Hi[0]->AsNumber())*.5,CZ=(Lo[2]->AsNumber()+Hi[2]->AsNumber())*.5;const FRotator Rotation(0,Yaw,0);
 for(const auto& Part:Model->GetArrayField(TEXT("parts"))){const auto P=Part->AsObject();const auto& Vals=P->GetArrayField(TEXT("vertices"));const auto& Color=P->GetArrayField(TEXT("color"));TArray<FVector> V,N;TArray<int32> I;
  for(int K=0;K+5<Vals.Num();K+=6){V.Add(Position+Rotation.RotateVector(FVector(-(Vals[K+2]->AsNumber()-CZ)*Scale,(Vals[K]->AsNumber()-CX)*Scale,(Vals[K+1]->AsNumber()-Lo[1]->AsNumber())*Scale)));N.Add(Rotation.RotateVector(FVector(-Vals[K+5]->AsNumber(),Vals[K+3]->AsNumber(),Vals[K+4]->AsNumber())));I.Add(I.Num());}
  auto* Mesh=NewObject<UProceduralMeshComponent>(this);Mesh->SetupAttachment(Parent);Mesh->RegisterComponent();Mesh->SetCollisionEnabled(ECollisionEnabled::NoCollision);Mesh->CreateMeshSection_LinearColor(0,V,I,N,TArray<FVector2D>(),TArray<FLinearColor>(),TArray<FProcMeshTangent>(),false);Mesh->SetCastShadow(true);auto* Mat=UMaterialInstanceDynamic::Create(SurfaceAsset,this);Mat->SetVectorParameterValue(TEXT("Color"),FLinearColor(Color[0]->AsNumber(),Color[1]->AsNumber(),Color[2]->AsNumber()));Mesh->SetMaterial(0,Mat);
 }
}
void AShipManager::BuildHabitats(){
 const TCHAR* Names[]={TEXT("KITCHEN"),TEXT("LIVING ROOM"),TEXT("BATHROOM / SHOWER"),TEXT("GYM"),TEXT("INDOOR POOL"),TEXT("GARDEN / DINING")};
 const FLinearColor Colors[]={FLinearColor(.12,.38,.32),FLinearColor(.19,.29,.49),FLinearColor(.14,.4,.47),FLinearColor(.58,.24,.11),FLinearColor(.06,.35,.4),FLinearColor(.29,.4,.16)};
 for(int I=0;I<6;++I){FHPHabitatModule H;H.Name=Names[I];H.Side=I%2?1:-1;H.X=-1200*(1+I/2);H.Shell=Box(HullRoot,FVector(H.X,H.Side*1120,150),FVector(1080,800,320),Colors[I]);H.Shell->SetVisibility(false);H.Door=GetWorld()->SpawnActor<AHandprintDoor>(FVector(H.X,H.Side*710,0),FRotator(0,90,0));H.Door->DoorName=H.Name;H.Door->RoomA=H.Door->RoomB=I/2+1;H.Door->bDeploymentLock=true;Doors.Add(H.Door);Habitats.Add(H);}
}
bool AShipManager::HabitatsInterlocked()const{for(const auto& H:Habitats)if(HPHabitat::locked(H.State))return true;return false;}
bool AShipManager::RequestHabitat(int32 I,bool Deploy){if(!Habitats.IsValidIndex(I)||bMenu||bInCutscene)return false;auto& H=Habitats[I];const auto* E=Expedition();const auto* Player=UGameplayStatics::GetPlayerPawn(this,0);const FVector P=Player?Player->GetActorLocation():FVector::ZeroVector;const bool Occupied=P.Y*H.Side>640&&FMath::Abs(P.X-H.X)<560;const double Speed=(!IsStory()||GetStoryStep()>=8)&&E?E->State.speed():Velocity/1000.;
 if(!HPHabitat::request(H.State,Deploy,Speed,E?FMath::Max(FMath::Abs(E->Thrust),FMath::Abs(Thrust)):FMath::Abs(Thrust),(E&&E->State.autopilot)||Autopilot!=EHPAutopilot::Manual,Occupied)){if(auto* Exp=Expedition())Exp->State.message="Habitat interlock: stop ship, disable autopilot and clear occupied rooms.";return false;}
 if(H.State.phase!=HPHabitat::Phase::Deployed){H.Door->bDeploymentLock=true;H.Door->Close();UnloadHabitat(I);}if(auto* Exp=Expedition())Exp->Save();return true;
}
void AShipManager::UnloadHabitat(int32 I){if(!Habitats.IsValidIndex(I))return;auto& H=Habitats[I];if(!H.Interior)return;TArray<USceneComponent*> Children;H.Interior->GetChildrenComponents(true,Children);for(int K=Children.Num()-1;K>=0;--K)Children[K]->DestroyComponent();H.Interior->DestroyComponent();H.Interior=nullptr;H.Light=nullptr;}
void AShipManager::LoadHabitat(int32 I){auto& H=Habitats[I];if(H.Interior)return;H.Interior=RootFor(this,GetRootComponent(),FVector(H.X,H.Side*1120,0));auto* R=H.Interior.Get();const FLinearColor Wall(.63,.69,.64),Teal(.12,.38,.35),Wood(.42,.25,.12),Metal(.55,.58,.58);const float Inner=-H.Side*400,Outer=H.Side*400;
 if(I!=4)Box(R,FVector(0,0,-8),FVector(1080,800,16),Wood,true);Box(R,FVector(0,0,310),FVector(1080,800,16),Wall,true);
 for(int Side:{-1,1})Box(R,FVector(Side*540,0,150),FVector(16,800,300),Wall,true);Box(R,FVector(0,Outer,150),FVector(1080,16,300),Teal,true);
 for(int X:{-330,330})Box(R,FVector(X,Inner,150),FVector(420,16,300),Teal,true);Box(R,FVector(0,Inner,295),FVector(240,16,30),Wall,true);Box(R,FVector(0,Inner-H.Side*20,-5),FVector(240,90,10),Metal,true);
 H.Light=NewObject<UPointLightComponent>(this);H.Light->SetupAttachment(R);H.Light->SetRelativeLocation(FVector(0,0,275));H.Light->SetIntensity(9000);H.Light->SetAttenuationRadius(850);H.Light->SetLightColor(FLinearColor(1,.87,.7));H.Light->RegisterComponent();
 auto Model=[&](const TCHAR* Key,FVector P,float Height,float Yaw=0){AddLicensedModel(R,FString(TEXT("furniture/"))+Key,P,Height,Yaw);};
 if(I==0){Model(TEXT("kitchenFridgeLarge"),FVector(390,240,0),195);Model(TEXT("kitchenSink"),FVector(390,50,0),100);Model(TEXT("kitchenStove"),FVector(390,-130,0),100);Model(TEXT("kitchenCabinetDrawer"),FVector(390,-290,0),100);Model(TEXT("kitchenCabinetUpper"),FVector(430,-110,210),65);Model(TEXT("kitchenCoffeeMachine"),FVector(390,-280,100),35);Box(R,FVector(-260,0,95),FVector(120,480,12),Wood,true);}
 else if(I==1){Model(TEXT("loungeSofaLong"),FVector(-350,0,0),105,180);Model(TEXT("loungeChairRelax"),FVector(0,250,0),110,-90);Model(TEXT("tableCoffee"),FVector(-90,0,0),45);Model(TEXT("televisionModern"),FVector(450,0,80),120);Model(TEXT("pottedPlant"),FVector(380,300,0),160);Model(TEXT("lampRoundFloor"),FVector(-400,280,0),180);}
 else if(I==2){Model(TEXT("shower"),FVector(350,-240,0),240);Model(TEXT("bathtub"),FVector(350,100,0),70);Model(TEXT("toilet"),FVector(-350,250,0),85,180);Model(TEXT("bathroomSink"),FVector(-390,-100,0),95,180);Model(TEXT("bathroomMirror"),FVector(-470,-100,145),80,180);Model(TEXT("bathroomCabinet"),FVector(-400,-290,0),135);}
 else if(I==3){for(int Side:{-1,1}){Box(R,FVector(0,Side*240,15),FVector(340,100,30),FLinearColor(.06,.08,.09),true);for(int Y:{-45,45})Box(R,FVector(160,Side*240+Y,105),FVector(8,8,180),Metal,true);Box(R,FVector(160,Side*240,170),FVector(30,90,35),Teal);}Box(R,FVector(-360,0,55),FVector(100,300,20),Wood,true);for(int Y:{-100,100})Box(R,FVector(-360,Y,130),FVector(60,14,60),Metal);Box(R,FVector(-360,0,130),FVector(8,270,8),Metal);}
 else if(I==4){Box(R,FVector(0,0,-115),FVector(780,460,20),Teal,true);for(int X:{-465,465})Box(R,FVector(X,0,-8),FVector(150,800,16),Wood,true);for(int Y:{-325,325})Box(R,FVector(0,Y,-8),FVector(780,150,16),Wood,true);for(int X:{-390,390})Box(R,FVector(X,0,-55),FVector(20,480,110),Teal,true);for(int Y:{-230,230})Box(R,FVector(0,Y,-55),FVector(780,20,110),Teal,true);Box(R,FVector(0,0,-10),FVector(760,440,2),FLinearColor(.02,.32,.42));for(int K=0;K<4;++K)Box(R,FVector(330-K*35,0,-20-K*24),FVector(40,130,15),Wall,true);}
 else{Model(TEXT("tableRound"),FVector(0,0,0),85);for(int Y:{-160,160})Model(TEXT("chairCushion"),FVector(0,Y,0),95,Y<0?90:-90);for(int X:{-400,400})for(int Y:{-280,280})Model(TEXT("pottedPlant"),FVector(X,Y,0),175);}
}
void AShipManager::TickHabitats(float Dt){auto* E=Expedition();for(int I=0;I<Habitats.Num();++I){auto& H=Habitats[I];const auto Previous=H.State.phase;HPHabitat::step(H.State,Dt);const bool Deployed=H.State.phase==HPHabitat::Phase::Deployed;H.Door->bDeploymentLock=!Deployed;if(!Deployed){H.Door->Close();UnloadHabitat(I);}else LoadHabitat(I);H.Shell->SetRelativeLocation(FVector(H.X,H.Side*(720+400*H.State.fraction),150));H.Shell->SetRelativeScale3D(FVector(10.8,8*FMath::Max(.001,H.State.fraction),3.2));H.Shell->SetVisibility(H.State.fraction>0&&GetCameraIndex()>0&&!(E&&E->State.onStation));if(H.Interior)H.Interior->SetVisibility(GetCameraIndex()==0&&!(E&&E->State.onStation),true);if(Previous!=H.State.phase&&E)E->Save();}}
