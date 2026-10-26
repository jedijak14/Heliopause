# Architecture — replacement framework

## Native UE 5.4

`Source/Heliopause/Public/HeliopauseCore.h` is the reflected umbrella header; `Private/HeliopauseCore.cpp` owns the sole primary game module and the supplied framework's implementations. Supporting translation units are not a competing actor framework:

- `IHPInteractable`: trace-driven door/curtain interaction.
- `UEVASubsystem`: local PCM recordings, optional registered assets, bounded speech/subtitle queue, Windows installed SAPI fallback. Linux falls back to subtitles when no recording exists.
- `ARoomLight`, `AHandprintDoor`, `ACurtainWindow`: switch/flicker state, timed authentication/autoclose/collision, thermal shade memory/interlock.
- `AShipManager`: flight/survey state, story objectives, camera sequences, compartments, drones and station operations.
- `AHeliopauseCharacter`: runtime EnhancedInput mapping, first-person movement, pilot/drone controls, flashlight, optional breathing and tablet.
- `UHPHudWidget`, `UHPTabletWidget`, `UHPMainMenuWidget`: Blueprint extension interfaces. No authored UMG assets are required for basic operation: `AHPNativeHUD` implements a concrete Canvas menu/tablet/HUD in `HPNativeHUD.cpp`.
- `AHeliopauseGameMode`: runtime spawn/setup on the engine Entry map.
- `HPWorldBuilder.cpp`: ship/station geometry and scene updates under `AShipManager`.
- `UHPExpeditionSubsystem` / `UHPExpeditionSave`: game-instance exploration rules and versioned local SaveGame. Campaign progress is included.

No legacy `HelioWorld`, `HelioPawn`, `HelioHUD`, `HelioGameMode` or `HelioAudioSubsystem` remains. Native compilation, cooking, rendering and runtime behavior still require verification in Unreal.

## Shared data and portable rules

`Shared/sector.json` is the canonical ten-site catalog; `Tools/generate_sector.py` produces `SectorCatalog.h`. `Shared/story.json` holds original dialogue, scene names, measured audio durations and approximate sentence timings; `Tools/generate_story.py` produces `StoryCatalog.h`. Both generators support `--check`.

`SimulationCore.h` contains engine-independent room routing, atmosphere, drone and WAV rules. `ExplorationCore.h` contains sector flight, braking/collision, docking, scans, artifacts, trade and upgrade rules. Portable tests exercise these without Unreal. Survey sales and artifact sales have separate accounting so a data-first sale cannot strand an artifact objective.

## Earlier browser implementation (retained reference)

- `model.js`: compartment safety, local autonomy and simulation clock.
- `exploration.js`: navigation/economy/save validation.
- `campaign.js`: bounded 12-state story and entry/hold/climb simulation, independent of DOM/rendering.
- `campaign-ui.js`: start/continue/free menu, queued authored camera shots, recorded audio and subtitles, pause/skip handling.
- `scene.js`: Three.js procedural art, coherent room spacing/shared boundary doors, walking, cameras, relative sector rendering, station crowds.
- `main.js`, `navigation.js`, `style.css`: responsive controls and in-place DOM reconciliation.

All browser runtime assets are embedded into the tracked standalone HTML. WebGL2 is required. Saves use localStorage; user voice files use IndexedDB when permitted. No backend, account, network speech or telemetry is needed. Browser and native simulation/rendering are separate implementations, not a C++/WASM binary or a claim of full feature/render parity.

## Active supplied-v4 browser

`BrowserPreview/index.html` + `v4/main.js` derive from the preserved uploaded HTML. The custom WebGL2 renderer, ship, shaders, tablet, interactions and score are retained. `v4/voyage.js` adds extended objectives, flight/economy integration, autonomous state and validated saves. `v4/voice-player.js` owns one serialized playback/caption channel. `src/route-planner.js` adds spherical-body visibility-graph navigation. Shared exploration rules and the sector catalog are reused; the old Three.js entry point is not imported.
