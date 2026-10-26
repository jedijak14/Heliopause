# Build and release gates

## Version contract

`EngineAssociation: "5.8"` requests that engine installation; it is not a compatibility certificate. This environment contains no Unreal Editor, UnrealBuildTool or Unreal Automation Tool. No engine-specific benchmark or binary validation was performed.

A source preview is appropriate until a licensed engine installation can run all checks below. Do not mark an untested source ZIP as a Windows/Linux game executable.

## Windows example (PowerShell)

Set `$UE` to the actual installed engine directory; these example paths are not provisioned by the repository.

```powershell
$UE = 'C:\Program Files\Epic Games\UE_5.8'
$Project = Join-Path $PWD 'Heliopause.uproject'
& "$UE\Engine\Build\BatchFiles\GenerateProjectFiles.bat" -project="$Project" -game -engine
& "$UE\Engine\Build\BatchFiles\Build.bat" HeliopauseEditor Win64 Development -Project="$Project" -WaitMutex
# Only continue after a successful editor build.
& "$UE\Engine\Binaries\Win64\UnrealEditor.exe" "$Project"
```

Asset import (after compilation, before runtime/cook validation):

1. Run `python Tools/prepare_unreal_maps.py` with Pillow installed to create PNG import derivatives.
2. Enable **Python Editor Script Plugin** and **Editor Scripting Utilities** in the editor.
3. Run `UnrealEditor-Cmd.exe Heliopause.uproject -ExecutePythonScript=Tools/import_unreal_assets.py` from the repository root. Confirm imported GLBs, NASA `moon_small`, and `M_earth/moon/mars/jupiter/clouds` material assets exist under `/Game/Imported`.
4. Inspect actual asset names/materials in Editor. Import naming and normalization are **not verified** here. Test rooms, airlocks, planetary collision/terrain, camera, atmosphere, save/restore and packaged texture availability before claiming parity.

Automation (after compilation):

```powershell
& "$UE\Engine\Binaries\Win64\UnrealEditor-Cmd.exe" "$Project" -unattended -nullrhi -nosound '-ExecCmds=Automation RunTests Heliopause; Quit' '-TestExit=Automation Test Queue Empty' '-ReportExportPath=Saved/Automation'
```

Cook/package (after interactive smoke tests):

```powershell
& "$UE\Engine\Build\BatchFiles\RunUAT.bat" BuildCookRun -project="$Project" -noP4 -platform=Win64 -clientconfig=Development -build -cook -map=/Engine/Maps/Entry -stage -pak -archive '-archivedirectory=Artifacts/Win64'
```

Inspect UBT/UAT exit codes and full logs. Runtime generated meshes are not precomputed Nanite assets. Browser files are shipped in the source release, but are not cooked into the Unreal game.

## Linux example

```sh
"$UE_ROOT/Engine/Build/BatchFiles/Linux/Build.sh" HeliopauseEditor Linux Development "$PWD/Heliopause.uproject" -WaitMutex
"$UE_ROOT/Engine/Binaries/Linux/UnrealEditor" "$PWD/Heliopause.uproject"
```

Use the engine's supported Linux toolchain. The native Windows TTS implementation is guarded with `HELIO_NATIVE_SPEECH`; Linux supports PCM recordings and subtitles only.

## Packaged-asset checks

1. Confirm `/Engine/Maps/Entry` cooks and applies `/Script/Heliopause.HeliopauseGameMode`.
2. Confirm BasicShapeMaterial and Cube resolve; they are hard references on the world actor CDO.
3. Verify `Content/Audio/*.wav` is staged as NonUFS loose content and usable with no network.
4. Create `Saved/Voice/eva_intro.wav` in the executable's actual project saved directory, rescan and test precedence.
5. Test packaged shipping behavior separately from PIE. No `.uasset`, `.umap`, or engine binaries are fabricated or included in the source preview.

## Reproducible source archive

`python3 Tools/package_source.py` archives only files tracked by Git, with a per-file SHA-256 manifest and source revision. Run it only on a clean committed tree. Build outputs, user audio, credentials and DerivedDataCache are excluded. The GitHub source prerelease targets the session branch commit and includes this archive; it does not change `main`.

On GitHub, `.github/workflows/release-source.yml` reacts to publication of this prerelease, reruns portable tests, builds the deterministic source ZIP, and attaches it with its checksum. This avoids relying on the authoring sandbox reaching GitHub's separate upload host. The workflow does **not** build Unreal binaries and is clearly labeled accordingly.
