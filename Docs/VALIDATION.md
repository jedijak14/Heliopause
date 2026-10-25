# Validation ledger

## Executed in the authoring sandbox

- Python project/descriptor/input-packaging structure tests: **4 passed**.
- Bundled asset SHA-256 verification: **3 WAVs matched**.
- Node audio queue tests: **6 passed** (local precedence, offline-only fallback, cancellation, bounded queue/cache, invalid media fallback, clear).
- Portable C++17 tests with `-Wall -Wextra -Werror -pedantic` and **ASan/UBSan**: passed.
- C++ assertions cover pressure/heat recovery and bounds, dock/cruise/emergency interlocks, all **128** routing configurations, health/destruction, truncated/invalid WAVs, and **10,000** randomized malformed byte buffers.

A signedness warning in WAV block-alignment validation was found by the strict compiler and fixed before the successful run. These tests intentionally do not pretend to compile Unreal headers or exercise the renderer.

## Not executed / required before a game release

- [ ] Unreal 5.8 availability and exact toolchain verified.
- [ ] UHT and Development Editor compilation with no errors.
- [ ] `Heliopause.Core.*` Unreal automation tests pass.
- [ ] Startup map applies game mode; menu/Canvas hitboxes work in Standalone.
- [ ] Walking floor, walls, crouch, door collisions and station access work.
- [ ] Pilot enter/exit blends correctly with no body/camera snap or penetration.
- [ ] All three sensors retain fixed transforms while mouse input is ignored.
- [ ] Hull panels, engine bells, RCS direction and material colors render correctly.
- [ ] Interior render components disappear in external feeds without losing collision.
- [ ] Decompression, heat, recovery, cruise airlock lock and emergency lock work.
- [ ] Drone room routing and door opening tested across all compartment boundaries.
- [ ] Controlled-drone destruction cuts to static and returns safely.
- [ ] Maintenance repair and security response are observable in play.
- [ ] Boarding alert changes bridge lights and life-sign HUD count.
- [ ] Station pedestrians animate without collider or render-state regressions.
- [ ] Native WAV override, malformed WAV fallback, Windows SAPI and Linux captions tested.
- [ ] Browser file upload, IndexedDB persistence and local speech tested in real browsers offline.
- [ ] Cook/package and run without editor or network; bundled audio is present.
- [ ] Profile CPU/GPU at 1080p/1440p on named hardware using `stat unit`, `stat gpu`, Unreal Insights.
- [ ] Record sensor vs interior frame timing, peak memory and draw calls before asserting FPS/optimization targets.

## Known preview limitations

- Not a complete port of the incomplete WebGL game; its procedural planetary scattering/PBR/post stack is not included.
- Ship-frame simulation only: no orbital navigation, movable flight rigidbody, landing, terrain or destination travel.
- Native HUD is designed for desktop approximately 1280×720 or larger; small viewport layouts may overlap.
- Simplified art and lighting; no authored textures, weapon animations, skeletal rigs or complex behavior trees.
- Compartment graph routing plus sweeps, not general obstacle-solving pathfinding.
- Automatic bulkhead closure has no occupant-safety sensor yet.
- Browser upload/TTS companion and native game are separate workflows.
- Native runtime recordings must be PCM16 WAV; browser codecs may accept MP3/OGG.
- Installed system voices differ by OS/browser; no promise of voice availability. Subtitles always remain.
- No engine-version-specific optimization or performance measurement has been performed.
