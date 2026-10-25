#include "HelioAudioSubsystem.h"
#include "SimulationCore.h"
#include "Components/AudioComponent.h"
#include "Sound/SoundWaveProcedural.h"
#include "Kismet/GameplayStatics.h"
#include "HAL/FileManager.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"
#include "Engine/World.h"
#if HELIO_NATIVE_SPEECH
#include "Windows/AllowWindowsPlatformTypes.h"
#include <sapi.h>
#include "Windows/HideWindowsPlatformTypes.h"
#endif
void UHelioAudioSubsystem::Initialize(FSubsystemCollectionBase& Collection)
{
    Super::Initialize(Collection);
#if HELIO_NATIVE_SPEECH
    HRESULT Init=CoInitializeEx(nullptr,COINIT_APARTMENTTHREADED);
    bOwnCom=SUCCEEDED(Init);
    ISpVoice* Voice=nullptr;
    if(SUCCEEDED(CoCreateInstance(CLSID_SpVoice,nullptr,CLSCTX_ALL,IID_ISpVoice,reinterpret_cast<void**>(&Voice)))) NativeVoice=Voice;
#endif
    Rescan();
}
void UHelioAudioSubsystem::Deinitialize()
{
    Stop(); if(Ambient) Ambient->Stop();
#if HELIO_NATIVE_SPEECH
    if(NativeVoice) { static_cast<ISpVoice*>(NativeVoice)->Release(); NativeVoice=nullptr; }
    if(bOwnCom) CoUninitialize();
#endif
    Super::Deinitialize();
}
void UHelioAudioSubsystem::Rescan()
{
    Index.Empty();
    // User overrides last. Never search arbitrary disks, fetch URLs, or execute filenames.
    const FString Roots[]={FPaths::ProjectContentDir()/TEXT("Audio"),FPaths::ProjectSavedDir()/TEXT("Voice")};
    IFileManager::Get().MakeDirectory(*Roots[1],true);
    for(const FString& Root:Roots)
    {
        TArray<FString> Files; IFileManager::Get().FindFilesRecursive(Files,*Root,TEXT("*.wav"),true,false);
        Files.Sort();
        for(const auto& Path:Files) Index.Add(FPaths::GetBaseFilename(Path).ToLower(),Path);
    }
    Status=FString::Printf(TEXT("%d WAV assets / %s"),Index.Num(),NativeVoice?TEXT("local system voice ready"):TEXT("no system TTS; subtitles enabled"));
}
void UHelioAudioSubsystem::Enqueue(const FString& Key,const FString& Text)
{
    if(Queue.ContainsByPredicate([&](const FEvent& E){return E.Key==Key&&E.Text==Text;})) return;
    if(Queue.Num()>=8) Queue.RemoveAt(0);
    Queue.Add({Key.ToLower(),Text});
}
bool UHelioAudioSubsystem::PlayFile(const FString& Path,bool bAmbient)
{
    constexpr int64 Limit=16*1024*1024;
    const int64 Size=IFileManager::Get().FileSize(*Path);
    if(Size<12||Size>Limit||!GetWorld()) return false;
    TArray<uint8> Data; if(!FFileHelper::LoadFileToArray(Data,*Path)) return false;
    std::vector<uint8_t> Bytes(Data.GetData(),Data.GetData()+Data.Num()); Helio::Wave Parsed;
    if(!Helio::readWave(Bytes,Parsed)) return false;
    auto* Sound=NewObject<USoundWaveProcedural>(this);
    Sound->SetSampleRate(Parsed.rate); Sound->NumChannels=Parsed.channels;
    const float Duration=float(Parsed.pcm.size())/(Parsed.rate*Parsed.channels*2);
    Sound->Duration=Duration; Sound->SoundGroup=SOUNDGROUP_Voice;
    Sound->QueueAudio(Parsed.pcm.data(),static_cast<int32>(Parsed.pcm.size()));
    auto* Audio=UGameplayStatics::SpawnSound2D(GetWorld(),Sound,bAmbient?.12f:1.f,1,0,nullptr,false,false);
    if(!Audio) return false;
    if(bAmbient) { Ambient=Audio; AmbientWave=Sound; AmbientRemaining=Duration; }
    else { Wave=Sound; Active=Audio; Remaining=Duration+.1f; }
    return true;
}
void UHelioAudioSubsystem::Stop()
{
    Queue.Empty(); if(Active) { Active->Stop(); Active->DestroyComponent(); Active=nullptr; } Wave=nullptr; Remaining=0;
#if HELIO_NATIVE_SPEECH
    if(NativeVoice) static_cast<ISpVoice*>(NativeVoice)->Speak(nullptr,SPF_PURGEBEFORESPEAK,nullptr);
#endif
}
void UHelioAudioSubsystem::Tick(float Dt)
{
    if(!GetWorld()||!GetWorld()->IsGameWorld()) return;
    AmbientRemaining-=Dt;
    if(AmbientRemaining<=0)
    {
        if(Ambient) { Ambient->Stop(); Ambient->DestroyComponent(); Ambient=nullptr; }
        if(const auto* Path=Index.Find(TEXT("ambient_hum")))
        { if(!PlayFile(*Path,true)) AmbientRemaining=30; }
        else AmbientRemaining=30;
    }
    Remaining-=Dt;
#if HELIO_NATIVE_SPEECH
    if(NativeVoice)
    {
        SPVOICESTATUS VoiceStatus{};
        if(SUCCEEDED(static_cast<ISpVoice*>(NativeVoice)->GetStatus(&VoiceStatus,nullptr))&&VoiceStatus.dwRunningState==SPRS_IS_SPEAKING) return;
    }
#endif
    if(Remaining>0||Queue.IsEmpty()) return;
    if(Active) { Active->Stop(); Active->DestroyComponent(); Active=nullptr; } Wave=nullptr;
    const FEvent Event=Queue[0]; Queue.RemoveAt(0);
    Subtitle=Event.Text; SubtitleUntil=GetWorld()->GetTimeSeconds()+FMath::Max(4.f,Event.Text.Len()/14.f);
    if(!bVoice) return;
    if(const auto* Path=Index.Find(Event.Key)) if(PlayFile(*Path)) return;
#if HELIO_NATIVE_SPEECH
    if(NativeVoice&&SUCCEEDED(static_cast<ISpVoice*>(NativeVoice)->Speak(*Event.Text,SPF_ASYNC|SPF_IS_NOT_XML,nullptr)))
    { Remaining=.3f; return; }
#endif
    Remaining=3.f;
}
