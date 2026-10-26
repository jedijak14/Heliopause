# HELIOPAUSE — A Long Way Home

**v0.8.0 browser game + Unreal Engine 5.8 source preview.** Built on the supplied `Heliopause-v4.html` and the supplied `HeliopauseCore` architecture. Original audio masters, twenty recorded performances and existing saves are retained.

**Offline HTML:** [BrowserPreview/heliopause.html](BrowserPreview/heliopause.html). Download the complete file and open it in a WebGL2 browser. The embedded assets work without an account, server or connection. HTTPS hosting optionally streams hash-verified higher-resolution planet maps, rigged humans, spacecraft, furnishings and catalog data; AUDIO can disable streaming or clear its cache.

## v0.8 additions

Earth departure with rigged, breathing Rocketbox crew; Space-to-skip without a bottom skip button; NASA ISS/Shuttle/habitat models; web-sourced PBR furniture; sixteen additional cataloged exoplanets and seven explicitly hypothetical ocean visualizations; a cockpit science screen/full catalog record; smooth collision-checked warp with controlled cancellation; and fifteen externally shaded windows/full-hull nano-laminate coverage. The self-contained HTML retains offline models and previous recordings/saves.

**Scope and hardware:** [Streaming models and evidence labels](Docs/STREAMING_MODELS.md). Native-resolution ISS textures are memory-intensive; software graphics use reduced decoded images/raster resolution. No 1 GB content-library ceiling is imposed.

**Unreal is still uncompiled source, not full visual parity.** Native catalog/science/save updates and model import preparation are included. Native Earth/crew staging, premium scene assembly, warp visuals and full-hull shades remain unfinished. No native executable is supplied.

## Preserved gameplay

- **Manual orbital descent:** the ship's sector position, velocity and quaternion continue through atmosphere and terrain contact. No 3 km landing timer, terminal corridor, scene-controlled descent or automatic climb. Touchdown requires speed at most 12 m/s and alignment to the radial local horizon. The launch command releases clamps with an outward thruster impulse; you control the subsequent climb.
- **Six expandable rooms:** paired kitchen/living room, bathroom-shower/gym, and pool/dining bays. Stop, zero thrust and disengage autopilot to deploy. Transition doors lock; occupied rooms cannot compact; compacted interiors release their GPU geometry. Any non-compacted habitat blocks flight.
- **Ship and exploration:** third-person orbit camera plus fixed hull sensors, movable thermal shades, stern inner/outer airlock interlocks, surface exploration, specimens, skimmer, ship recall and saves. Physical Engineering repairs replace remote instant fixes. Microbots remain invisible.
- **Licensed art:** 37 Kenney CC0 models; Solar System Scope maps with native-resolution HD sources and embedded 2K fallback; a fetched **23,232-triangle NASA Moon model** used for Nacre/Borealis. Its original GLB is retained for Unreal import. NASA explicitly labels this model *color map only*, without topography. Other worlds use authored globe geometry. Fictional exoplanets are not scientific reconstructions.
- **Story and speech:** Earth opening, preserved orbital arrival recordings, followed by Kestrel → Cinder/Pelagos/Borealis → Pilgrim → Anchorage. Queued dialogue/subtitles, local recording playback, offline speech fallback, station crowds and trading remain. Breathing is optional synthetic foley.

## Controls

| Input | Action |
|---|---|
| P / PILOT | Take/leave the cockpit pilot seat |
| W/S, A/D | Forward/reverse thrust; yaw while piloting |
| R/F, Q/E | Pitch; roll while piloting |
| Shift/Ctrl, Z/X | Vertical; lateral thrusters |
| B | Brake and disengage navigation |
| WASD / mouse | Walk/look outside pilot mode |
| E / INTERACT | Physical handprint, curtain, repair or nearby interaction |
| T / TABLET | Navigation, flight, habitat, surface, systems, audio |
| V | First person, hull sensors and third-person orbit camera |

**Landing:** undock if needed, take the pilot seat and fly toward a solid world. Brake, align with its local horizon and manage your descent. SURFACE → MANUAL DESCENT only releases autopilot; it does not move the ship. After touchdown, walk aft through Science, isolate the inner hatch and open the exterior hatch. Reboard at the stern ramp; return to the pilot seat, close both hatches and compact habitats before manual liftoff. Vesper has no solid surface.

**Habitats:** HABITAT deploys/compacts individual bays or all bays. Return to the central deck before compaction. Do not expect flight while a bay is expanded.

## Build and test

```sh
bash Tools/test.sh
cd BrowserPreview
npm ci
npm test
npm run build
npm run test:browser
npm run test:campaign-browser
npm run test:refit-browser
npm run test:planetary-browser
npm run test:asset-browser
npm run test:habitat-browser
npm run test:integration-browser
npm run dev -- --port 5173
```

See [validation and limits](Docs/VALIDATION.md), [asset provenance](Docs/ASSETS.md), and [Unreal build/import gates](Docs/BUILD.md).

## Unreal 5.8: source, not a verified executable

[Heliopause.uproject](Heliopause.uproject) targets **5.8**. The existing Core is extended with quaternion flight, habitat loading/unloading and interlocks, licensed mesh loading, planetary contact/terrain source, stern airlocks, orbit camera and save fields. Editor import scripts prepare the licensed GLBs and planet materials.

**No Unreal Editor/UHT/UBT/UAT is installed here. Native source has not been compiled, imported, cooked, run or profiled.** Portable C++ tests are not engine validation. Browser/native visuals and behavior are not certified equivalent; native prologue flight, surface encounters/recall and art/streaming still have parity gaps.

This is a substantial playable browser update, **not completion of the requested photorealistic art pass or 100% native parity**. Interiors and crowds remain stylized; physics is arcade thrust/drag on compressed worlds, not scientific orbital dynamics. No universal FPS or “perfect” rendering claim is made.
