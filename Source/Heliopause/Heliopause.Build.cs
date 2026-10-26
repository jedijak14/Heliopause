using UnrealBuildTool;
public class Heliopause : ModuleRules
{
    public Heliopause(ReadOnlyTargetRules Target) : base(Target)
    {
        PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;
        PublicDependencyModuleNames.AddRange(new[] { "Core", "CoreUObject", "Engine", "InputCore", "EnhancedInput", "UMG", "Slate", "SlateCore", "LevelSequence", "MovieScene", "ProceduralMeshComponent" });
        if (Target.Platform == UnrealTargetPlatform.Win64)
        {
            PublicSystemLibraries.AddRange(new[] { "sapi.lib", "ole32.lib" });
            PublicDefinitions.Add("HELIO_NATIVE_SPEECH=1");
        }
        else PublicDefinitions.Add("HELIO_NATIVE_SPEECH=0");
    }
}
