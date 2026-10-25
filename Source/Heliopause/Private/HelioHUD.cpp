#include "HelioHUD.h"
#include "HelioPawn.h"
#include "HelioWorld.h"
#include "HelioAudioSubsystem.h"
#include "Engine/Canvas.h"
#include "Engine/Engine.h"
#include "Engine/GameInstance.h"
#include "Engine/World.h"
#include "GameFramework/PlayerController.h"
namespace
{
const FLinearColor Ink(.65f,.85f,1), Muted(.28f,.46f,.57f), Gold(1,.72f,.34f), Green(.4f,1,.7f), Red(1,.3f,.2f);
const TCHAR* TabNames[]={TEXT("FLIGHT"),TEXT("SENSORS"),TEXT("SYSTEMS"),TEXT("DRONES"),TEXT("VOICE"),TEXT("LOG")};
}
void AHelioHUD::Label(const FString& Text,float X,float Y,FLinearColor Color,float Scale)
{
    DrawText(Text,Color,X,Y,GEngine->GetSmallFont(),Scale,false);
}
void AHelioHUD::Button(FName Id,const FString& Text,float X,float Y,float W,bool Active)
{
    DrawRect(Active?FLinearColor(.06f,.25f,.32f,.98f):FLinearColor(.025f,.07f,.1f,.98f),X,Y,W,34);
    DrawLine(X,Y+34,X+W,Y+34,Active?Ink:Muted);
    Label(Text,X+12,Y+9,Active?Green:Ink);
    AddHitBox(FVector2D(X,Y),FVector2D(W,34),Id,true);
}
void AHelioHUD::DrawHUD()
{
    Super::DrawHUD();
    auto* P=Cast<AHelioPawn>(GetOwningPawn()); if(!Canvas||!P||!P->Ship) return;
    auto* S=P->Ship; const float W=Canvas->SizeX,H=Canvas->SizeY;
    auto* Audio=GetGameInstance()->GetSubsystem<UHelioAudioSubsystem>();
    if(P->bMenu)
    {
        DrawRect(FLinearColor(.003f,.012f,.025f,.96f),0,0,W,H);
        for(int I=0;I<100;++I)
        {
            const float X=FMath::Frac(I*.618034f)*W,Y=FMath::Frac(I*.414214f)*H;
            DrawRect(FLinearColor(.2f,.4f,.6f,.45f),X,Y,1.5f,1.5f);
        }
        const float X=W*.5f-145;
        Label(TEXT("H E L I O P A U S E"),W*.5f-245,H*.22f,Ink,2.4f);
        Label(TEXT("A LONG WAY OUT / SV-7 LONGHAUL"),X,H*.22f+52,Muted);
        Button(TEXT("story"),TEXT("STORY / RESUME"),X,H*.4f,290);
        Button(TEXT("free"),TEXT("FREE FLIGHT"),X,H*.4f+44,290);
        Button(TEXT("help"),TEXT("CONTROLS"),X,H*.4f+88,290);
        if(bHelp)
        {
            Label(TEXT("WASD move | Mouse look | Shift run | C crouch"),W*.5f-250,H*.7f);
            Label(TEXT("E seat / door / return | T tablet | F light | V sensors"),W*.5f-250,H*.7f+24);
            Label(TEXT("1 scanner | 2 repair tool | 3 security pulse | LMB use"),W*.5f-250,H*.7f+48);
            Label(TEXT("Cockpit W/S commanded thrust | ESC menu / release cursor"),W*.5f-250,H*.7f+72);
        }
        Label(TEXT("OFFLINE / SOURCE PREVIEW 0.1 / NO NETWORK SERVICES"),W*.5f-230,H-40,Muted);
        return;
    }
    Label(TEXT("DIRECTIVE"),22,18,Muted);
    Label(S->Directive(),22,39,Gold);
    const int Room=S->RoomAt(P->GetActorLocation());
    Label(FString::Printf(TEXT("SV-7 / %s"),AHelioWorld::RoomName(Room)),22,H-90);
    Label(FString::Printf(TEXT("SUIT %.0f%%   PRESSURE %.0f%%   TEMP %.0f C"),P->Health,S->Atmospheres[Room].pressure*100,S->Atmospheres[Room].temperature),22,H-66);
    const TCHAR* Tools[]={TEXT("SCANNER"),TEXT("REPAIR"),TEXT("SECURITY PULSE")};
    Label(FString::Printf(TEXT("TOOL %d / %s"),P->Tool+1,Tools[P->Tool]),22,H-42,Gold);
    Label(TEXT("T TABLET / F LIGHT / V SENSOR / E INTERACT"),FMath::Max(22.f,W-390),H-24,Muted);
    const FString Mode=S->FlightMode==Helio::Flight::Docked?TEXT("DOCKED"):S->FlightMode==Helio::Flight::Cruise?TEXT("CRUISE"):TEXT("LOCKDOWN");
    Label(Mode,W-180,20,Green);
    Label(FString::Printf(TEXT("LIFE SIGNS / %d"),S->Intruders),W-180,44,S->Intruders?Red:Muted);
    if(!P->bTablet)
    {
        const float X=W*.5f,Y=H*.5f;
        DrawLine(X-24,Y,X-10,Y,Ink); DrawLine(X+10,Y,X+24,Y,Ink);
        DrawLine(X,Y-24,X,Y-10,Ink); DrawLine(X,Y+10,X,Y+24,Ink);
        DrawRect(Gold,X-1,Y-1,2,2);
        Label(P->Prompt(),X-150,H*.64f,Gold);
    }
    if(P->View==EHelioView::Cockpit)
    {
        DrawLine(W*.3f,H*.72f,W*.7f,H*.72f,Muted);
        Label(TEXT("PILOT LINK / FIRST PERSON"),W*.5f-120,H*.72f+12,Green);
        Label(FString::Printf(TEXT("COMMANDED THRUST %.0f%% / SHIP-FRAME SIM"),P->Throttle*100),W*.5f-180,H*.72f+35);
    }
    else if(P->View==EHelioView::Drone)
    {
        for(float Y=0;Y<H;Y+=4) DrawLine(0,Y,W,Y,FLinearColor(0,0,0,.2f));
        Label(FString::Printf(TEXT("DRONE LINK %d / %.0f%%"),S->ControlledBot+1,S->Bots[S->ControlledBot].health),W*.5f-100,75,Green);
    }
    else if(P->View!=EHelioView::Walking)
    {
        const TCHAR* Views[]={TEXT("LEFT HULL"),TEXT("RIGHT HULL"),TEXT("FRONT FACING")};
        Label(FString::Printf(TEXT("FIXED SENSOR / %s"),Views[int(P->View)-int(EHelioView::LeftHull)]),W*.5f-120,75,Green);
    }
    if(P->bTablet) Tablet(P);
    if(Audio&&GetWorld()->GetTimeSeconds()<Audio->SubtitleUntil)
    {
        DrawRect(FLinearColor(0,0,0,.8f),W*.1f,H-144,W*.8f,44);
        Label(TEXT("EVA / ")+Audio->Subtitle,W*.1f+10,H-132,Ink);
    }
    if(P->StaticUntil>GetWorld()->GetTimeSeconds())
    {
        DrawRect(FLinearColor(.01f,.01f,.01f,1),0,0,W,H);
        for(int I=0;I<180;++I)
        {
            const float V=FMath::FRandRange(.05f,.3f);
            DrawRect(FLinearColor(V,V,V,1),0,FMath::FRand()*H,W,FMath::FRandRange(1,7));
        }
        Label(TEXT("S I G N A L   L O S T"),W*.5f-170,H*.5f,Red,1.8f);
    }
}
void AHelioHUD::Tablet(AHelioPawn* P)
{
    auto* S=P->Ship;
    const float W=FMath::Min(940.f,float(Canvas->SizeX)-30), H=FMath::Min(590.f,float(Canvas->SizeY)-70);
    const float X=(Canvas->SizeX-W)*.5f,Y=(Canvas->SizeY-H)*.5f;
    DrawRect(FLinearColor(.015f,.035f,.055f,.98f),X,Y,W,H);
    Label(TEXT("SV-7 / CREW TERMINAL"),X+20,Y+16,Ink,1.2f);
    for(int T=0;T<6;++T) Button(FName(*FString::Printf(TEXT("tab%d"),T)),TabNames[T],X+15,Y+55+T*44,135,Tab==T);
    Button(TEXT("close"),TEXT("CLOSE [T]"),X+15,Y+H-50,135);
    const float BX=X+175,BY=Y+60,BW=W-195;
    if(Tab==0)
    {
        Label(TEXT("FLIGHT CONTROL / PILOT SEAT REQUIRED"),BX,BY,Gold);
        Label(P->bInSeat?TEXT("Pilot biometric link active."):TEXT("Walk to the bridge seat and press E."),BX,BY+30);
        Button(TEXT("dock"),TEXT("DOCK / OPEN STATION ROUTE"),BX,BY+65,BW,S->FlightMode==Helio::Flight::Docked);
        Button(TEXT("cruise"),TEXT("CRUISE / SEAL EXTERNAL AIRLOCK"),BX,BY+110,BW,S->FlightMode==Helio::Flight::Cruise);
        Button(TEXT("emergency"),TEXT("EMERGENCY / LOCK ALL BULKHEADS"),BX,BY+155,BW,S->FlightMode==Helio::Flight::Emergency);
        Label(TEXT("Local ship-frame simulation; no orbital navigation model."),BX,BY+215,Muted);
        Label(TEXT("Interior doors remain available in cruise unless unsafe."),BX,BY+242,Muted);
        Label(FString::Printf(TEXT("Cruise time %.0f s"),S->FlightTime),BX,BY+285);
    }
    else if(Tab==1)
    {
        Label(TEXT("HULL-MOUNTED SENSOR ARRAY"),BX,BY,Gold);
        Button(TEXT("left"),TEXT("LEFT HULL / FIXED SOCKET"),BX,BY+45,BW,P->View==EHelioView::LeftHull);
        Button(TEXT("right"),TEXT("RIGHT HULL / FIXED SOCKET"),BX,BY+90,BW,P->View==EHelioView::RightHull);
        Button(TEXT("front"),TEXT("FRONT FACING / FIXED SOCKET"),BX,BY+135,BW,P->View==EHelioView::Front);
        Button(TEXT("return"),TEXT("RETURN TO CREW / COCKPIT"),BX,BY+190,BW);
        Label(TEXT("Hard-mounted feeds. Mouse look disabled. No orbital chase cam."),BX,BY+255,Muted);
        Label(TEXT("Exterior feeds hide all interior render components."),BX,BY+280,Muted);
    }
    else if(Tab==2)
    {
        for(int R=0;R<4;++R)
        {
            const auto& A=S->Atmospheres[R]; const float RY=BY+R*97;
            Label(FString::Printf(TEXT("%s / %.0f%% / %.0f C %s"),AHelioWorld::RoomName(R),A.pressure*100,A.temperature,A.unsafe()?TEXT("! ISOLATED"):TEXT("NOMINAL")),BX,RY,A.unsafe()?Red:Green);
            const float Gap=8, Cell=(BW-3*Gap)/4;
            Button(FName(*FString::Printf(TEXT("breach%d"),R)),TEXT("BREACH"),BX,RY+28,Cell);
            Button(FName(*FString::Printf(TEXT("vent%d"),R)),TEXT("VENT"),BX+Cell+Gap,RY+28,Cell);
            Button(FName(*FString::Printf(TEXT("repair%d"),R)),TEXT("REPAIR"),BX+2*(Cell+Gap),RY+28,Cell);
            Button(FName(*FString::Printf(TEXT("door%d"),R)),S->IsDoorLocked(R)?TEXT("LOCKED"):S->IsDoorOpen(R)?TEXT("CLOSE"):TEXT("OPEN"),BX+3*(Cell+Gap),RY+28,Cell);
        }
        Label(TEXT("Door 4 = cargo airlock. Hazard buttons are sandbox test controls."),BX,BY+400,Muted);
    }
    else if(Tab==3)
    {
        Label(TEXT("LOCAL AUTONOMOUS SYSTEMS / NO NETWORK"),BX,BY,Gold);
        const TCHAR* States[]={TEXT("IDLE"),TEXT("PATROL"),TEXT("REPAIR"),TEXT("CONTROLLED"),TEXT("DESTROYED")};
        for(int B=0;B<3;++B)
        {
            const auto& Bot=S->Bots[B]; float RY=BY+38+B*90;
            Label(FString::Printf(TEXT("%s %d / %s / %.0f%% / %s"),B==0?TEXT("SECURITY"):TEXT("MAINTENANCE"),B+1,States[int(Bot.state)],Bot.health,AHelioWorld::RoomName(S->RoomAt(S->BotPositions[B]))),BX,RY,Bot.health>0?Ink:Red);
            Button(FName(*FString::Printf(TEXT("bot%d"),B)),TEXT("TAKE CONTROL"),BX,RY+25,BW*.58f);
            Button(FName(*FString::Printf(TEXT("damage%d"),B)),TEXT("TEST DAMAGE -50"),BX+BW*.61f,RY+25,BW*.39f);
        }
        Button(TEXT("board"),TEXT("SIMULATE BOARDING EVENT"),BX,BY+325,BW);
        Label(TEXT("WASD / mouse / tools. Destruction cuts feed to static."),BX,BY+380,Muted);
    }
    else if(Tab==4)
    {
        auto* A=GetGameInstance()->GetSubsystem<UHelioAudioSubsystem>();
        Label(TEXT("LOCAL VOICE INDEX / USER FILES TAKE PRIORITY"),BX,BY,Gold);
        Label(TEXT("Drop PCM16 WAV files into Saved/Voice, then RESCAN."),BX,BY+30);
        Label(TEXT("MP3 + browser voice fallback: BrowserVoice/index.html"),BX,BY+54,Muted);
        Button(TEXT("rescan"),TEXT("RESCAN LOCAL FILES"),BX,BY+85,BW*.48f);
        Button(TEXT("voice"),A&&A->bVoice?TEXT("VOICE ON"):TEXT("VOICE OFF"),BX+BW*.52f,BY+85,BW*.48f,A&&A->bVoice);
        Button(TEXT("testvoice"),TEXT("TEST / EVA ALERT"),BX,BY+130,BW);
        if(A)
        {
            Label(A->Status,BX,BY+180,Green);
            TArray<FString> Keys; A->Index.GetKeys(Keys); Keys.Sort();
            for(int I=0;I<FMath::Min(Keys.Num(),7);++I) Label(Keys[I],BX,BY+215+I*23,Muted);
            if(Keys.Num()>7) Label(FString::Printf(TEXT("+ %d more indexed files"),Keys.Num()-7),BX,BY+383,Muted);
        }
    }
    else
    {
        Label(TEXT("MISSION LOG / LONGHAUL"),BX,BY,Gold);
        Label(TEXT("01 / Pilot the ship from the first-person bridge seat."),BX,BY+45);
        Label(TEXT("02 / Engage cruise. Watch the engine-room status."),BX,BY+85);
        Label(TEXT("03 / Repair locally, remotely, or with a maintenance drone."),BX,BY+125);
        Label(TEXT("04 / Return to dock. Exit through the cargo airlock."),BX,BY+165);
        Label(TEXT("Safety: decompression and heat isolate adjacent rooms."),BX,BY+230,Muted);
        Label(TEXT("Maintenance drones route through unlocked compartments."),BX,BY+255,Muted);
        Label(TEXT("Unknown lifeforms may board during cruise. Use tool 3."),BX,BY+280,Muted);
    }
}
void AHelioHUD::NotifyHitBoxClick(FName Name)
{
    auto* P=Cast<AHelioPawn>(GetOwningPawn()); if(!P||!P->Ship) return;
    auto* S=P->Ship; const FString Id=Name.ToString();
    if(P->bMenu)
    {
        if(Id==TEXT("help")) bHelp=!bHelp;
        if(Id==TEXT("story")||Id==TEXT("free")) { S->bStory=Id==TEXT("story"); P->SetMenu(false); }
        return;
    }
    if(!P->bTablet) return;
    if(Id.StartsWith(TEXT("tab"))) { Tab=FMath::Clamp(FCString::Atoi(*Id.Mid(3)),0,5); return; }
    if(Id==TEXT("close")) { P->bTablet=false; P->SetMenu(false); return; }
    if(P->bInSeat)
    {
        if(Id==TEXT("dock")) S->SetFlight(Helio::Flight::Docked);
        if(Id==TEXT("cruise")) S->SetFlight(Helio::Flight::Cruise);
        if(Id==TEXT("emergency")) S->SetFlight(Helio::Flight::Emergency);
    }
    if(Id==TEXT("left")) P->SetView(EHelioView::LeftHull);
    if(Id==TEXT("right")) P->SetView(EHelioView::RightHull);
    if(Id==TEXT("front")) P->SetView(EHelioView::Front);
    if(Id==TEXT("return")) P->ExitRemote();
    if(Id.StartsWith(TEXT("breach"))) S->TriggerHazard(FCString::Atoi(*Id.Mid(6)),false);
    if(Id.StartsWith(TEXT("vent"))) S->TriggerHazard(FCString::Atoi(*Id.Mid(4)),true);
    if(Id.StartsWith(TEXT("repair"))) S->RepairRoom(FCString::Atoi(*Id.Mid(6)));
    if(Id.StartsWith(TEXT("door"))) S->ToggleDoor(FCString::Atoi(*Id.Mid(4)));
    if(Id.StartsWith(TEXT("bot"))) P->SelectBot(FCString::Atoi(*Id.Mid(3)));
    if(Id.StartsWith(TEXT("damage"))) S->DamageBot(FCString::Atoi(*Id.Mid(6)),50);
    if(Id==TEXT("board")) S->Board();
    if(auto* A=GetGameInstance()->GetSubsystem<UHelioAudioSubsystem>())
    {
        if(Id==TEXT("rescan")) A->Rescan();
        if(Id==TEXT("voice")) { A->bVoice=!A->bVoice; A->Stop(); }
        if(Id==TEXT("testvoice")) A->Enqueue(TEXT("eva_alert"),TEXT("Warning. Atmospheric containment requires attention."));
    }
}
