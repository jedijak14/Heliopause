using UnrealBuildTool;
using System.Collections.Generic;
public class HeliopauseEditorTarget : TargetRules
{
    public HeliopauseEditorTarget(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Editor;
        DefaultBuildSettings = BuildSettingsVersion.Latest;
        IncludeOrderVersion = EngineIncludeOrderVersion.Latest;
        ExtraModuleNames.Add("Heliopause");
    }
}
