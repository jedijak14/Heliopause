#include "HelioWorld.h"
#include "HelioAudioSubsystem.h"
#include "ProceduralMeshComponent.h"
#include "Components/BoxComponent.h"
#include "Components/InstancedStaticMeshComponent.h"
#include "Components/PointLightComponent.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "Engine/StaticMesh.h"
#include "Engine/World.h"
#include "Engine/GameInstance.h"
#include "UObject/ConstructorHelpers.h"
#include "Components/DirectionalLightComponent.h"

namespace
{
const FLinearColor Hull(.12f,.19f,.24f), Pale(.45f,.55f,.6f), Dark(.025f,.045f,.06f), Cyan(.08f,.65f,.9f), Amber(.8f,.45f,.06f);
void AppendBox(TArray<FVector>& V, TArray<int32>& I, FVector C, FVector E)
{
    const int32 B = V.Num();
    V.Append({C+FVector(-E.X,-E.Y,-E.Z),C+FVector(E.X,-E.Y,-E.Z),C+FVector(E.X,E.Y,-E.Z),C+FVector(-E.X,E.Y,-E.Z),
              C+FVector(-E.X,-E.Y,E.Z),C+FVector(E.X,-E.Y,E.Z),C+FVector(E.X,E.Y,E.Z),C+FVector(-E.X,E.Y,E.Z)});
    const int32 Faces[] = {0,2,1,0,3,2,4,5,6,4,6,7,0,1,5,0,5,4,1,2,6,1,6,5,2,3,7,2,7,6,3,0,4,3,4,7};
    for (int32 N : Faces) I.Add(B+N);
}
}
AHelioWorld::AHelioWorld()
{
    PrimaryActorTick.bCanEverTick = true;
    Root = CreateDefaultSubobject<USceneComponent>(TEXT("ShipFrame")); SetRootComponent(Root);
    // Hard CDO references make these engine-provided resources visible to the cooker.
    static ConstructorHelpers::FObjectFinder<UMaterialInterface> Mat(TEXT("/Engine/BasicShapes/BasicShapeMaterial.BasicShapeMaterial"));
    static ConstructorHelpers::FObjectFinder<UStaticMesh> Cube(TEXT("/Engine/BasicShapes/Cube.Cube"));
    HullMaterial=Mat.Object; CrowdPrimitive=Cube.Object;
    auto* Sun=CreateDefaultSubobject<UDirectionalLightComponent>(TEXT("Sun"));
    Sun->SetupAttachment(Root); Sun->SetRelativeRotation(FRotator(-35,-40,0)); Sun->SetIntensity(2.0f); Sun->SetCastShadows(false);
    auto* Fill=CreateDefaultSubobject<UDirectionalLightComponent>(TEXT("SpaceFill"));
    Fill->SetupAttachment(Root); Fill->SetRelativeRotation(FRotator(40,140,0)); Fill->SetIntensity(.4f); Fill->SetCastShadows(false);
}
const TCHAR* AHelioWorld::RoomName(int R)
{
    static const TCHAR* Names[] = {TEXT("BRIDGE"),TEXT("CREW QUARTERS"),TEXT("CARGO BAY"),TEXT("ENGINE ROOM")};
    return Names[FMath::Clamp(R,0,3)];
}
FVector AHelioWorld::RoomCenter(int R) { return FVector(-1200.f * R, 0, 100); }
FTransform AHelioWorld::SeatTransform() { return FTransform(FRotator(0,0,0), FVector(370,0,168)); }
FTransform AHelioWorld::SensorTransform(int I)
{
    // Fixed hull sockets, never an orbit arm, chase offset or spring arm.
    static const FTransform Sensors[] = {
        FTransform(FRotator(-8,-100,0),FVector(-500,-940,260)),
        FTransform(FRotator(-8,100,0),FVector(-500,940,260)),
        FTransform(FRotator(0,0,0),FVector(810,0,210))};
    return Sensors[FMath::Clamp(I,0,2)];
}
UProceduralMeshComponent* AHelioWorld::Mesh(USceneComponent* Parent, const TArray<FVector>& V, const TArray<int32>& I, FLinearColor Color)
{
    auto* P = NewObject<UProceduralMeshComponent>(this);
    P->SetupAttachment(Parent); P->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    P->SetCastShadow(false); P->bUseAsyncCooking = true;
    P->RegisterComponent();
    // Split triangles for hard panel edges and correct nonuniform geometry normals.
    TArray<FVector> Vertices, Normals;
    TArray<int32> Triangles;
    TArray<FVector2D> UV;
    TArray<FLinearColor> Colors;
    for (int32 K=0; K+2<I.Num(); K+=3)
    {
        const FVector A=V[I[K]], B=V[I[K+1]], C=V[I[K+2]];
        const FVector N=FVector::CrossProduct(B-A,C-A).GetSafeNormal();
        for (int J=0; J<3; ++J)
        {
            Triangles.Add(Vertices.Num()); Vertices.Add(V[I[K+J]]);
            Normals.Add(N); UV.Add(FVector2D(J==1?1:0,J==2?1:0)); Colors.Add(Color);
        }
    }
    P->CreateMeshSection_LinearColor(0,Vertices,Triangles,Normals,UV,Colors,TArray<FProcMeshTangent>(),false);
    if (auto* Base=HullMaterial.Get())
    {
        const FString Key=Color.ToString();
        UMaterialInstanceDynamic* Mat=MaterialCache.FindRef(Key);
        if(!Mat) { Mat=UMaterialInstanceDynamic::Create(Base,this); Mat->SetVectorParameterValue(TEXT("Color"),Color); MaterialCache.Add(Key,Mat); }
        P->SetMaterial(0,Mat);
    }
    return P;
}
UBoxComponent* AHelioWorld::Collider(USceneComponent* Parent,FVector C,FVector E)
{
    auto* B=NewObject<UBoxComponent>(this); B->SetupAttachment(Parent); B->SetRelativeLocation(C);
    B->SetBoxExtent(E); B->SetCollisionProfileName(TEXT("BlockAll")); B->SetHiddenInGame(true); B->RegisterComponent(); return B;
}
UProceduralMeshComponent* AHelioWorld::Box(USceneComponent* Parent,FVector C,FVector E,FLinearColor Color,bool Collision)
{
    TArray<FVector> V; TArray<int32> I; AppendBox(V,I,C,E);
    if(Collision) Collider(Parent,C,E);
    return Mesh(Parent,V,I,Color);
}
UProceduralMeshComponent* AHelioWorld::Bell(USceneComponent* Parent,FVector Position,float Length,float Inlet,float Outlet,FRotator Rotation,FLinearColor Color)
{
    // Array-driven three-ring open nozzle, oriented along local -X.
    TArray<FVector> V; TArray<int32> I;
    constexpr int Sides=16;
    const float X[]={0,-Length*.55f,-Length}; const float R[]={Inlet,Outlet*.75f,Outlet};
    for(int Ring=0;Ring<3;++Ring) for(int S=0;S<Sides;++S)
    {
        const float A=2*PI*S/Sides; V.Add(Position+Rotation.RotateVector(FVector(X[Ring],FMath::Cos(A)*R[Ring],FMath::Sin(A)*R[Ring])));
    }
    for(int Ring=0;Ring<2;++Ring) for(int S=0;S<Sides;++S)
    {
        int A=Ring*Sides+S,B=Ring*Sides+(S+1)%Sides,C=A+Sides,D=B+Sides;
        I.Append({A,C,B,B,C,D});
    }
    auto* M=Mesh(Parent,V,I,Color); return M;
}
void AHelioWorld::BeginPlay()
{
    Super::BeginPlay();
    ExteriorRoot=NewObject<USceneComponent>(this); ExteriorRoot->SetupAttachment(Root); ExteriorRoot->RegisterComponent();
    StationRoot=NewObject<USceneComponent>(this); StationRoot->SetupAttachment(Root); StationRoot->RegisterComponent();
    BuildInterior(); BuildHull(); BuildStation();
    for(int I=0;I<3;++I)
    {
        BotPositions[I]=RoomCenter(I+1)+FVector(0,200,20);
        auto* B=Box(Root,FVector::ZeroVector,FVector(42,32,22),I==0?Cyan:Amber);
        B->SetRelativeLocation(BotPositions[I]); BotMeshes.Add(B);
    }
    RefreshDoors();
    Announce(TEXT("eva_welcome"),TEXT("SV-7 Longhaul online. Take the pilot seat on the bridge."));
}
void AHelioWorld::BuildInterior()
{
    for(int R=0;R<4;++R)
    {
        auto* Room=NewObject<USceneComponent>(this); Room->SetupAttachment(Root); Room->RegisterComponent(); Rooms.Add(Room);
        const float X=-1200.f*R;
        Box(Room,FVector(X,0,-18),FVector(600,700,18),Hull,true);
        Box(Room,FVector(X,0,414),FVector(600,700,14),Dark,true);
        Box(Room,FVector(X,-716,200),FVector(600,16,200),Hull,true);
        if(R!=2) Box(Room,FVector(X,716,200),FVector(600,16,200),Hull,true);
        else
        {
            Box(Room,FVector(X-350,716,200),FVector(250,16,200),Hull,true);
            Box(Room,FVector(X+350,716,200),FVector(250,16,200),Hull,true);
            Box(Room,FVector(X,716,330),FVector(100,16,70),Hull,true);
        }
        // Combine repeated ceiling struts and floor strips into two sections per room.
        TArray<FVector> V; TArray<int32> Ind;
        for(int S=-2;S<=2;++S) AppendBox(V,Ind,FVector(X+S*220,0,382),FVector(12,700,16));
        Mesh(Room,V,Ind,Pale);
        V.Reset(); Ind.Reset();
        for(int S=-1;S<=1;S+=2) AppendBox(V,Ind,FVector(X,S*530,2),FVector(580,4,2));
        Mesh(Room,V,Ind,Cyan);
        auto* Light=NewObject<UPointLightComponent>(this); Light->SetupAttachment(Room);
        Light->SetRelativeLocation(FVector(X,0,320)); Light->SetIntensity(14000);
        Light->SetAttenuationRadius(1100); Light->SetLightColor(FLinearColor(.55f,.75f,1));
        Light->SetCastShadows(false); Light->RegisterComponent(); Lights.Add(Light);
        if(R<3)
        {
            Box(Room,FVector(X-600,-410,200),FVector(16,290,200),Pale,true);
            Box(Room,FVector(X-600,410,200),FVector(16,290,200),Pale,true);
            Box(Room,FVector(X-600,0,330),FVector(16,120,70),Pale,true);
            auto* Door=Collider(Root,FVector(X-600,0,130),FVector(18,118,130));
            Box(Door,FVector::ZeroVector,FVector(18,118,130),Hull);
            Doors.Add(Door);
        }
    }
    Box(Rooms[3],FVector(-4200,0,200),FVector(16,700,200),Hull,true);
    // Forward bridge viewport: space is visible through the structural frame.
    Box(Rooms[0],FVector(616,0,55),FVector(16,700,55),Hull,true);
    Box(Rooms[0],FVector(616,0,360),FVector(16,700,40),Hull,true);
    Collider(Rooms[0],FVector(616,0,210),FVector(16,700,210));
    Box(Rooms[0],FVector(300,0,40),FVector(45,48,40),Dark,true);
    Box(Rooms[0],FVector(265,0,105),FVector(12,48,55),Pale,true);
    for(int S=-1;S<=1;S+=2)
    {
        Box(Rooms[0],FVector(420,S*210,65),FVector(100,100,65),Hull,true);
        Box(Rooms[0],FVector(420,S*210,133),FVector(80,80,3),Cyan);
    }
    for(int B=0;B<4;++B)
    {
        const FVector P(-1550+(B%2)*500,(B/2==0?-480:480),55);
        Box(Rooms[1],P,FVector(180,90,55),Dark,true);
        Box(Rooms[1],P+FVector(0,0,65),FVector(175,85,15),Pale);
    }
    TArray<FVector> CargoV; TArray<int32> CargoI;
    for(int C=0;C<8;++C)
    {
        FVector P(-2750+(C%4)*230,-440+(C/4)*800,65);
        AppendBox(CargoV,CargoI,P,FVector(85,80,65)); Collider(Rooms[2],P,FVector(85,80,65));
    }
    Mesh(Rooms[2],CargoV,CargoI,Amber);
    CoreMesh=Bell(Rooms[3],FVector::ZeroVector,180,70,90,FRotator(90,0,0),Cyan);
    CoreMesh->SetRelativeLocation(FVector(-3600,-380,100));
    CoreMaterial=UMaterialInstanceDynamic::Create(HullMaterial,this);
    CoreMesh->SetMaterial(0,CoreMaterial);
    Collider(Rooms[3],FVector(-3600,-380,180),FVector(130,130,180));
    for(int S=-1;S<=1;S+=2) Box(Rooms[3],FVector(-3600,S*560,80),FVector(400,60,80),Dark,true);
    auto* Airlock=Collider(Root,FVector(-2400,716,130),FVector(100,18,130));
    Box(Airlock,FVector::ZeroVector,FVector(100,18,130),Amber); Doors.Add(Airlock);
}
void AHelioWorld::BuildHull()
{
    // Tapered, faceted structural skin. No scaled primitive masquerading as the hull.
    struct FRing { float X, Width, Bottom, Top; };
    const FRing Rings[]={{800,340,-90,280},{500,810,-130,490},{-700,900,-160,520},{-3000,870,-160,490},{-4350,600,-120,350}};
    TArray<FVector> V; TArray<int32> I;
    for(const auto& R:Rings)
        V.Append({FVector(R.X,-R.Width*.65f,R.Bottom),FVector(R.X,R.Width*.65f,R.Bottom),FVector(R.X,R.Width,R.Bottom+100),FVector(R.X,R.Width,R.Top-100),
            FVector(R.X,R.Width*.65f,R.Top),FVector(R.X,-R.Width*.65f,R.Top),FVector(R.X,-R.Width,R.Top-100),FVector(R.X,-R.Width,R.Bottom+100)});
    for(int R=0;R<4;++R) for(int S=0;S<8;++S)
    { int A=R*8+S,B=R*8+(S+1)%8,C=A+8,D=B+8; I.Append({A,B,C,B,D,C}); }
    for(int S=1;S<7;++S) { I.Append({0,S+1,S,32,32+S,32+S+1}); }
    Mesh(ExteriorRoot,V,I,Hull);
    for(int Layer=0;Layer<3;++Layer)
    {
        V.Reset(); I.Reset();
        for(int P=0;P<14;++P)
        {
            const float X=-3200+P*245;
            const float Width=X>500?340:850;
            AppendBox(V,I,FVector(X,(Layer==0?-1:1)*(Width+6),180),FVector(100,8,Layer==2?20:95));
            if(Layer==1) AppendBox(V,I,FVector(X,0,515),FVector(90,450,7));
        }
        Mesh(ExteriorRoot,V,I,Layer==0?Pale:Layer==1?Dark:Amber);
    }
    for(int S=-1;S<=1;S+=2)
    {
        Bell(ExteriorRoot,FVector(-4200,S*430,130),400,100,190,FRotator::ZeroRotator,Pale);
        Bell(ExteriorRoot,FVector(-4270,S*430,130),280,60,120,FRotator::ZeroRotator,Cyan);
        for(int X=0;X<2;++X) for(int D=0;D<2;++D)
            Bell(ExteriorRoot,FVector(X==0?350:-3300,S*860,260),85,22,42,FRotator(D==0?0:90,S==1?-90:90,0),Pale);
    }
    // Single low-poly star field mesh; no per-star actors, textures or updates.
    V.Reset(); I.Reset(); FRandomStream Rand(1701);
    for(int S=0;S<650;++S)
    {
        const FVector P=Rand.VRand()*80000.f;
        AppendBox(V,I,P,FVector(Rand.FRandRange(25,80)));
    }
    Mesh(Root,V,I,FLinearColor::White);
}
void AHelioWorld::BuildStation()
{
    Box(StationRoot,FVector(-2400,2600,-30),FVector(1600,1900,30),Hull,true);
    for(int S=-1;S<=1;S+=2) Box(StationRoot,FVector(-2400+S*1580,2600,220),FVector(20,1900,220),Dark,true);
    Box(StationRoot,FVector(-2400,4480,220),FVector(1600,20,220),Dark,true);
    auto* L=NewObject<UPointLightComponent>(this); L->SetupAttachment(StationRoot); L->SetRelativeLocation(FVector(-2400,2600,600));
    L->SetIntensity(70000); L->SetAttenuationRadius(3500); L->SetCastShadows(false); L->RegisterComponent();
    // A single instanced silhouette mesh. No graphic sheets and no actor per citizen.
    // Includes head, torso, arms and legs as low-poly blocks in one saved engine-built mesh at runtime.
    Crowd=NewObject<UInstancedStaticMeshComponent>(this); Crowd->SetupAttachment(StationRoot);
    Crowd->SetStaticMesh(CrowdPrimitive);
    Crowd->SetCollisionEnabled(ECollisionEnabled::NoCollision); Crowd->SetCastShadow(false);
    Crowd->SetCullDistances(0,9000); Crowd->RegisterComponent();
    FRandomStream Rand(43);
    for(int C=0;C<20;++C)
    {
        FVector P(-2400+Rand.FRandRange(-1200,1200),Rand.FRandRange(1300,4100),0);
        CrowdPositions.Add(P); CrowdGoals.Add(P);
        for(int Part=0;Part<6;++Part) Crowd->AddInstance(FTransform(FRotator::ZeroRotator,P,FVector(.2f,.2f,.2f)));
    }
}
int AHelioWorld::RoomAt(FVector P) const { return FMath::Clamp(FMath::FloorToInt((600-P.X)/1200),0,3); }
bool AHelioWorld::IsDoorLocked(int I) const
{
    if(I<0||I>=4) return true;
    return I==3 ? Helio::airlockLocked(FlightMode) : Helio::doorLocked(FlightMode,Atmospheres[I],Atmospheres[I+1]);
}
bool AHelioWorld::IsDoorOpen(int I) const { return I>=0&&I<4&&DoorOpen[I]&&!IsDoorLocked(I); }
void AHelioWorld::RefreshDoors()
{
    for(int I=0;I<Doors.Num();++I)
    {
        if(IsDoorLocked(I)) DoorOpen[I]=false;
        Doors[I]->SetCollisionEnabled(IsDoorOpen(I)?ECollisionEnabled::NoCollision:ECollisionEnabled::QueryAndPhysics);
        // Move panel clear of the aperture, but retain a stable interaction/collision coordinate.
        const auto& Children=Doors[I]->GetAttachChildren();
        for(USceneComponent* Child:Children) Child->SetRelativeLocation(FVector(0,0,IsDoorOpen(I)?280:0));
    }
}
void AHelioWorld::ToggleDoor(int I)
{
    if(IsDoorLocked(I)) { Announce(TEXT("eva_alert"),TEXT("Bulkhead locked. Resolve atmosphere or flight interlock first.")); return; }
    DoorOpen[I]=!DoorOpen[I]; RefreshDoors();
}
void AHelioWorld::SetFlight(Helio::Flight Mode)
{
    FlightMode=Mode; if(Mode==Helio::Flight::Cruise) StoryStep=FMath::Max(StoryStep,1);
    RefreshDoors();
    Announce(TEXT("eva_status"),Mode==Helio::Flight::Docked?TEXT("Docking clamps secured. Cargo airlock available."):Mode==Helio::Flight::Cruise?TEXT("Cruise engaged. External airlock sealed."):TEXT("Emergency lockdown. All bulkheads secured."));
}
void AHelioWorld::TriggerHazard(int R,bool Thermal)
{
    if(R<0||R>=4) return;
    if(Thermal) Atmospheres[R].venting=true; else Atmospheres[R].breach=true;
    RefreshDoors(); Announce(TEXT("eva_alert"),FString::Printf(TEXT("Warning. %s in %s."),Thermal?TEXT("Thermal venting"):TEXT("Decompression"),RoomName(R)));
}
void AHelioWorld::RepairRoom(int R)
{
    if(R<0||R>=4) return;
    Atmospheres[R].venting=false; Atmospheres[R].breach=false;
    if(StoryStep==2&&R==3) StoryStep=3; RefreshDoors();
    Announce(TEXT("eva_repair"),TEXT("Repair complete. Wait for pressure and temperature to recover before opening bulkheads."));
}
void AHelioWorld::Board()
{
    if(Intruders>=4) return;
    const FVector P=RoomCenter(2)+FVector(120,120+Intruders*65,0);
    auto* A=Box(Root,FVector::ZeroVector,FVector(28,25,65),FLinearColor(.28f,.65f,.2f));
    A->SetRelativeLocation(P); AlienMeshes.Add(A); AlienPositions.Add(P); Intruders=AlienMeshes.Num();
    Announce(TEXT("eva_intrusion"),TEXT("Unidentified lifeform in the cargo bay. Security drone response requested."));
}
void AHelioWorld::SetControlledBot(int I)
{
    if(ControlledBot>=0&&Bots[ControlledBot].health>0) Bots[ControlledBot].state=Helio::BotState::Patrol;
    ControlledBot=(I>=0&&I<3&&Bots[I].health>0)?I:-1;
    if(ControlledBot>=0) Bots[ControlledBot].state=Helio::BotState::Controlled;
}
void AHelioWorld::DamageBot(int I,float Amount) { if(I>=0&&I<3) Bots[I].damage(Amount); }
bool AHelioWorld::MoveAgent(FVector& P,FVector Delta,float Radius) const
{
    FVector Next=P+Delta;
    Next.X=FMath::Clamp(Next.X,-4180.0+Radius,580.0-Radius);
    Next.Y=FMath::Clamp(Next.Y,-680.0+Radius,680.0-Radius);
    Next.Z=FMath::Clamp(Next.Z,60.0,340.0);
    for(int I=0;I<3;++I)
    {
        const float X=-600-1200*I;
        if(FMath::Abs(Next.X-X)<Radius+20 || ((P.X-X)*(Next.X-X)<0))
        {
            if(!IsDoorOpen(I)||FMath::Abs(Next.Y)>115-Radius) Next.X=P.X;
        }
    }
    FHitResult Hit;
    FCollisionQueryParams Params(SCENE_QUERY_STAT(DroneSweep),false);
    if(GetWorld()->SweepSingleByChannel(Hit,P,Next,FQuat::Identity,ECC_Visibility,FCollisionShape::MakeSphere(Radius),Params)) return false;
    const bool Moved=!P.Equals(Next); P=Next; return Moved;
}
void AHelioWorld::UseTool(FVector Origin,FVector Direction,int Tool)
{
    // Tools cannot reach through sealed rooms or partition walls.
    FHitResult Hit;
    GetWorld()->LineTraceSingleByChannel(Hit,Origin,Origin+Direction*1800,ECC_Visibility);
    const float Range=Hit.bBlockingHit?Hit.Distance:1800;
    if(Tool==0)
    {
        const int R=RoomAt(Origin); Announce(TEXT("eva_status"),FString::Printf(TEXT("%s. Pressure %.0f percent. Temperature %.0f Celsius."),RoomName(R),Atmospheres[R].pressure*100,Atmospheres[R].temperature));
    }
    else if(Tool==1) RepairRoom(RoomAt(Origin));
    else
    {
        for(int I=AlienPositions.Num()-1;I>=0;--I)
        {
            FVector To=AlienPositions[I]-Origin; const float Along=FVector::DotProduct(To,Direction);
            if(Along>0&&Along<Range&&(To-Direction*Along).Size()<95)
            { AlienMeshes[I]->DestroyComponent(); AlienMeshes.RemoveAt(I); AlienPositions.RemoveAt(I); Intruders=AlienPositions.Num(); break; }
        }
    }
}
void AHelioWorld::StepAI(float Dt)
{
    std::array<bool,3> Locked{IsDoorLocked(0),IsDoorLocked(1),IsDoorLocked(2)};
    for(int B=0;B<3;++B)
    {
        auto& Bot=Bots[B]; if(Bot.health<=0) continue;
        const int R=RoomAt(BotPositions[B]);
        if(Atmospheres[R].unsafe()) Bot.damage(Dt*(Atmospheres[R].temperature>65?9:4));
        if(Bot.state==Helio::BotState::Destroyed||Bot.state==Helio::BotState::Controlled) continue;
        if(B>0&&Atmospheres[R].unsafe())
        {
            Bot.state=Helio::BotState::Repair;
            if(Atmospheres[R].breach||Atmospheres[R].venting) RepairRoom(R);
        }
        else Bot.state=Helio::BotState::Patrol;
        const auto Path=Helio::route(R,BotGoals[B],Locked);
        if(Path.empty()) { Bot.state=Helio::BotState::Idle; continue; }
        FVector Goal=RoomCenter(BotGoals[B]); Goal.Z=140;
        if(Path.size()>1)
        {
            const int Door=FMath::Min(R,Path[1]); DoorOpen[Door]=true;
            const float DoorX=-600-1200*Door;
            // Approach centered aperture before crossing into next compartment.
            Goal=FVector(DoorX+(BotPositions[B].X>DoorX?130:-130),0,140);
            if(FMath::Abs(BotPositions[B].Y)<25&&FMath::Abs(BotPositions[B].X-DoorX)<170)
                Goal=FVector(DoorX+(BotPositions[B].X>DoorX?-170:170),0,140);
        }
        if(FVector::Dist(BotPositions[B],Goal)<40&&Path.size()==1) BotGoals[B]=(BotGoals[B]+1)%4;
        RefreshDoors(); MoveAgent(BotPositions[B],(Goal-BotPositions[B]).GetSafeNormal()*Dt*150,25);
        if(B==0) for(int A=AlienPositions.Num()-1;A>=0;--A) if(FVector::Dist(BotPositions[B],AlienPositions[A])<230)
        { AlienMeshes[A]->DestroyComponent(); AlienMeshes.RemoveAt(A); AlienPositions.RemoveAt(A); Intruders=AlienPositions.Num(); }
    }
    for(int A=0;A<AlienPositions.Num();++A)
    {
        FVector Delta(FMath::Sin(Clock*.23f+A)*Dt*35,FMath::Cos(Clock*.31f+A)*Dt*35,0);
        MoveAgent(AlienPositions[A],Delta,25); AlienMeshes[A]->SetRelativeLocation(AlienPositions[A]);
        for(int B=0;B<3;++B) if(FVector::Dist(BotPositions[B],AlienPositions[A])<140) Bots[B].damage(20*Dt);
    }
    if(FlightMode==Helio::Flight::Docked)
    {
        for(int C=0;C<CrowdPositions.Num();++C)
        {
            auto& P=CrowdPositions[C];
            if(FVector::Dist(P,CrowdGoals[C])<30) CrowdGoals[C]=FVector(FMath::FRandRange(-3600,-1200),FMath::FRandRange(1300,4100),0);
            FVector Dir=(CrowdGoals[C]-P).GetSafeNormal(); P+=Dir*Dt*65;
            const FRotator Rot=Dir.Rotation(); const float Swing=FMath::Sin(Clock*5+C)*12;
            const FVector Offsets[]={FVector(0,0,150),FVector(0,0,105),FVector(Swing,-24,100),FVector(-Swing,24,100),FVector(-Swing,-12,38),FVector(Swing,12,38)};
            const FVector Scales[]={FVector(.26f,.26f,.28f),FVector(.25f,.38f,.6f),FVector(.14f,.14f,.65f),FVector(.14f,.14f,.65f),FVector(.17f,.16f,.76f),FVector(.17f,.16f,.76f)};
            for(int Part=0;Part<6;++Part) Crowd->UpdateInstanceTransform(C*6+Part,FTransform(Rot,P+Rot.RotateVector(Offsets[Part]),Scales[Part]),false,false,true);
        }
        Crowd->MarkRenderStateDirty();
    }
}
void AHelioWorld::SetView(bool Exterior,FVector Eye,FRotator Rotation,float Fov,float Aspect)
{
    bExteriorView=Exterior;
    ExteriorRoot->SetVisibility(Exterior,true);
    // Conservative room-bound sphere test against diagonal view cone. Engine additionally
    // performs actual per-primitive frustum/occlusion culling; collision remains enabled.
    const float TanH=FMath::Tan(FMath::DegreesToRadians(Fov*.5f));
    const float Half=FMath::Atan(FMath::Sqrt(TanH*TanH+FMath::Square(TanH/FMath::Max(.1f,Aspect))));
    for(int R=0;R<Rooms.Num();++R)
    {
        const FVector To=RoomCenter(R)+FVector(0,0,100)-Eye;
        const float Dist=To.Size(), Radius=980;
        const bool Visible=!Exterior&&(Dist<=Radius||FVector::DotProduct(To.GetSafeNormal(),Rotation.Vector())>=FMath::Cos(Half+FMath::Asin(FMath::Min(1.f,Radius/Dist))));
        Rooms[R]->SetVisibility(Visible,true);
    }
    for(UBoxComponent* D:Doors) for(USceneComponent* Child:D->GetAttachChildren()) Child->SetVisibility(!Exterior,true);
    for(UProceduralMeshComponent* B:BotMeshes) B->SetVisibility(!Exterior);
    for(UProceduralMeshComponent* A:AlienMeshes) A->SetVisibility(!Exterior);
    StationRoot->SetVisibility(FlightMode==Helio::Flight::Docked,true);
}
void AHelioWorld::Tick(float Dt)
{
    Super::Tick(Dt); Clock+=Dt;
    for(auto& A:Atmospheres) A.step(Dt);
    if(FlightMode==Helio::Flight::Cruise)
    {
        FlightTime+=Dt;
        if(FlightTime>NextBoarding) { Board(); NextBoarding=FlightTime+FMath::FRandRange(90,180); }
        if(bStory&&StoryStep==1&&FlightTime>12) { TriggerHazard(3,true); StoryStep=2; }
    }
    AiAccumulator+=Dt;
    if(AiAccumulator>=.1f) { StepAI(FMath::Min(AiAccumulator,.25f)); AiAccumulator=0; RefreshDoors(); }
    for(int B=0;B<BotMeshes.Num();++B)
    {
        BotMeshes[B]->SetRelativeLocation(BotPositions[B]+FVector(0,0,Bots[B].health>0?FMath::Sin(Clock*3+B)*4: -50));
        BotMeshes[B]->SetRelativeRotation(FRotator(0,Bots[B].health>0?Clock*18:0,Bots[B].health>0?0:70));
    }
    if(CoreMesh) CoreMesh->SetRelativeRotation(FRotator(0,Clock*35,0));
    if(CoreMaterial) CoreMaterial->SetVectorParameterValue(TEXT("Color"),Cyan*(.6f+.4f*FMath::Sin(Clock*3)));
    for(int R=0;R<Lights.Num();++R) Lights[R]->SetLightColor(Atmospheres[R].unsafe()||Intruders>0?FLinearColor(1,.13f,.03f):FLinearColor(.55f,.75f,1));
}
FString AHelioWorld::Directive() const
{
    if(!bStory) return TEXT("FREE FLIGHT / explore, pilot, or test systems from the tablet");
    if(StoryStep==0) return TEXT("Take the bridge pilot seat [E], then engage cruise in TABLET / FLIGHT.");
    if(StoryStep==1) return TEXT("Monitor ship systems during cruise.");
    if(StoryStep==2) return TEXT("Engine thermal alert. Take a maintenance drone or use SYSTEMS / REPAIR.");
    return TEXT("Systems restored. Return to dock and explore the station via the cargo airlock.");
}
void AHelioWorld::Announce(const FString& Key,const FString& Text)
{
    if(auto* GI=GetGameInstance()) if(auto* A=GI->GetSubsystem<UHelioAudioSubsystem>()) A->Enqueue(Key,Text);
}
