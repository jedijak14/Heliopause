# HELIOPAUSE

An offline, procedural spacecraft simulation **source preview** for Unreal Engine. The entry point is [`Heliopause.uproject`](Heliopause.uproject).

> **Release status:** v0.1.0-source-preview. The descriptor requests **Unreal Engine 5.8**, but this project has **not been compiled, cooked, launched, or profiled in Unreal**. No Unreal installation was available in the authoring environment, and 5.8-specific compatibility was not verified. This is not a packaged game or a certified UE 5.8 build.

The supplied browser source was truncated inside a post-process shader. This repository implements the requested mechanics as native C++, rather than wrapping incomplete HTML or renaming it to `.uproject`. It retains the SV-7 setting, cyan/amber terminal style, first-person controls, EVA event concept, tablet, and local/offline design. The original planet rendering and post-processing shaders are **not** reproduced.

## Open the project

1. Download and extract the **entire source ZIP** from the GitHub release, or clone this branch. The `.uproject` alone is not the game; keep `Source`, `Config`, and `Content` beside it.
2. Install Unreal Engine and the corresponding C++ toolchain. On Windows use Visual Studio 2022 with **Game development with C++** and the Windows SDK required by your engine. Linux requires the engine's supported Clang toolchain.
3. If a compatible 5.8 installation is available, generate project files and build **HeliopauseEditor / Development**. If you use another version, explicitly reassociate a local copy and test it; compatibility with older/newer versions is not promised.
4. Open `Heliopause.uproject`. The default `/Engine/Maps/Entry` map uses `HelioGameMode`, which generates the ship at runtime. No hand-authored `.umap` or fabricated binary `.uasset` is required.
5. Play in **Standalone Game** for reliable mouse capture and HUD clicking. Choose Story or Free Flight.

Build/package commands, test gates, and known limits: [Docs/BUILD.md](Docs/BUILD.md).

## Implemented source features

| Phase | Implementation |
|---|---|
| Foundation | 0.45-second camera blend into a dedicated cockpit pose; fixed left-hull, right-hull and front sensors; no chase camera; tapered array-built hull, layered panels, open engine bells and directional RCS nozzles. |
| Interior & safety | Bridge, crew quarters, cargo bay and engine room; rotating/pulsing power core; room-level visibility gating plus native primitive frustum culling; pressure and heat states; physical bulkhead collision; cruise airlock interlock and emergency lockdown. |
| Local autonomy | One security and two maintenance drones; health and idle/patrol/repair/controlled/destroyed states; compartment-graph routing with collision sweeps; remote control and destruction static; bounded random intrusions; 20 instanced, low-poly station pedestrians. |
| Offline audio | Bundled generated PCM audio; native user-file indexing and precedence; bounded event/subtitle queue; Windows installed-voice SAPI fallback; separate offline browser utility with MP3/WAV/OGG drag-and-drop and local `speechSynthesis`. |

**Scope matters:** flight is a **ship-frame systems simulation**, not a six-degree-of-freedom vehicle or orbital model. Dock/cruise are state changes; commanded thrust is displayed but does not physically move the ship. Station pedestrians are procedural 3D silhouettes rather than textured sprites. The native interface uses Unreal Canvas, not browser canvas. There are no accounts, multiplayer, telemetry, runtime downloads, cloud speech, savegames, or recorded EVA voice performances.

## Controls

| Input | Action |
|---|---|
| WASD / mouse | Walk or drive a selected drone / look |
| Shift / C | Run / toggle crouch |
| E | Enter/leave pilot seat, open nearby door, return from remote feed |
| T | Tablet; clickable FLIGHT, SENSORS, SYSTEMS, DRONES, VOICE, LOG |
| F / V | Flashlight / cycle three fixed hull cameras |
| 1 / 2 / 3 | Scanner / compartment repair tool / security pulse |
| Left click | Use selected tool |
| W / S in cockpit | Adjust displayed commanded thrust |
| Escape | Close tablet or open/close menu and release/capture cursor |

Start near the bridge center, walk toward the forward consoles, and press **E** when the pilot-seat prompt appears. Engage cruise from **TABLET → FLIGHT**. In Story mode an engine thermal fault is scheduled after 12 seconds of cruise. Maintenance drones may fix it autonomously. Use **SYSTEMS** to inject hazards for testing, or **DRONES** to take over a bot. Return to dock and leave via the cargo bay's starboard airlock to see the station crowd.

## Local audio

### Unreal

Put uncompressed **16-bit PCM mono/stereo WAV** files (8–96 kHz, at most 16 MiB each) in `Saved/Voice/`, then select **VOICE → RESCAN**. Match these basenames:

```text
eva_welcome.wav
eva_alert.wav
eva_status.wav
eva_repair.wav
eva_intrusion.wav
ambient_hum.wav
```

User files override the bundled `Content/Audio` index. Invalid/unsupported recordings fall back to installed Windows speech, or subtitles if that is unavailable. Native MP3 decoding is deliberately **not** claimed. Convert recordings before copying them, for example with your locally installed FFmpeg:

```sh
ffmpeg -i eva_alert.mp3 -ac 1 -ar 22050 -c:a pcm_s16le eva_alert.wav
```

On Linux, native fallback is **subtitles**, not TTS. Windows speech requires an installed SAPI voice. Ambient audio is a separately replayed short loop, not guaranteed sample-gapless.

### Browser utility

Open [`BrowserVoice/index.html`](BrowserVoice/index.html) directly in a modern browser, or serve the repository locally with `python3 -m http.server`. Drop files or choose a folder. Audio is stored in local IndexedDB where permitted; private/file modes may be session-only. The queue accepts only browser voices marked `localService`; it never selects cloud voices. If none are available, subtitles remain. Browser MP3 support depends on the browser's codecs.

This utility is **standalone**, not embedded in or automatically synchronized with the Unreal executable. It preserves the requested browser upload/fallback workflow without incorrectly treating `window.speechSynthesis` as an Unreal API.

## All source assets are included

- Procedural hull, interior, drone, lifeform, and crowd definitions: `Source/Heliopause/Private/HelioWorld.cpp`.
- Three original generated WAV files: `Content/Audio/`; regeneration: `python3 Tools/generate_audio.py`.
- SHA-256 inventory: `Content/asset-manifest.json`; check: `python3 Tools/asset_manifest.py --check`.
- Native HUD: `HelioHUD.cpp`; browser utility visuals: `BrowserVoice/style.css`.
- Engine dependencies: bundled BasicShapes cube/material, engine default font, Entry map, ProceduralMeshComponent plugin. These are supplied by your licensed Unreal installation, not redistributed here. Hard CDO asset references and packaging configuration preserve the required cook/staging dependencies.

No remote asset URLs, npm runtime dependencies, external model packs or missing custom binaries are required. See [Docs/ASSETS.md](Docs/ASSETS.md).

## Tests and optimization

```sh
bash Tools/test.sh
```

The portable suite checks project structure, bundled WAVs, asset hashes, audio precedence/cancellation/fallback, pressure/temperature bounds, interlocks, all 128 compartment-route configurations, drone destruction and malformed WAV handling under ASan/UBSan.

These are **not** Unreal compile or runtime tests. Additional Unreal automation tests are included under `Source/Heliopause/Private/Tests`, but were not run here.

Performance-oriented implementation choices include shared material instances, batched repeated geometry, simple collision instead of runtime triangle-mesh cooking, 10 Hz agent/crowd updates, a single crowd instance component, bounded event/AI counts, exterior-view interior hiding, and disabled Lumen/virtual-shadow-map defaults. **No FPS, GPU memory, UE 5.8 optimization or platform-performance claim has been measured.** See [Docs/VALIDATION.md](Docs/VALIDATION.md) before promoting this prerelease.

## Layout

```text
Heliopause.uproject    Unreal entry point
Source/               Native game/editor targets and runtime module
Config/               Default map, rendering, input and audio staging
Content/Audio/        Saved, reproducible PCM assets
BrowserVoice/         Offline browser audio companion
Tests/                Portable tests (no Unreal license required)
Tools/                Tests, asset generation and source-release packaging
Docs/                 Build, asset, architecture and validation notes
```

Repository license: [LICENSE](LICENSE). Unreal Engine and its built-in resources remain subject to Epic's license.
