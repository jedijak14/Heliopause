## v0.7.0 asset and flight update

The active browser embeds licensed Kenney geometry, Solar System Scope 2K maps and a fetched NASA lunar mesh, with optional verified HTTPS HD maps. `planetary-flight.js` resolves manual flight against deterministic globe terrain; `habitat.js` loads/unloads eight room interiors, including two dependency-guarded annexes. `HPHabitat.cpp` and `HPPlanetaryWorld.cpp` extend the existing native Core; they are uncompiled. See the root README and Docs/VALIDATION.md for current behavior and explicit parity gaps.

### Current third-party production assets

- `Content/ThirdParty/Kenney/manifest.json`: 37 original CC0 GLBs; `meshes.json` and browser `models.json` are converted geometry/palette derivatives. Official kit licenses/provenance are retained.
- `Content/ThirdParty/PlanetMaps/manifest.json`: Solar System Scope, CC BY 4.0; original/derived hashes and dimensions. Embedded WebPs are 2048×1024; optional sources are 8192×4096, except Jupiter 4096×2048. No upscaling.
- `Content/ThirdParty/NASA/moon_small.glb`: fetched 13,799,876-byte Moon GLB, SHA-256 `12d3b0bb7fe214903f51447d1bc61710f442e92a11c703fcaca6d4e7ff8e67d4`. Original mirror commit, NASA SVS 14959 provenance, public-domain policy, modifications and derivative hash are in its `manifest.json`. 46,464 vertices / 23,232 triangles; NASA's **color-map-only** variant, not the topography model. Browser derivative `assets/models/nasa-moon.hpm` is embedded and retains topology, uniformly normalized.
- NASA credits: NASA's Goddard Space Flight Center. No endorsement implied. Source fetched through a pinned GitHub mirror; its hash also matches a separate repository's original-asset LFS pointer. The original NASA download was not independently byte-compared from this sandbox.

Reproduction: `Tools/fetch_kenney.py`, `convert_kenney.py`, `prepare_planet_assets.py`, `prepare_lunar_model.py`. Unreal import preparation: `prepare_unreal_maps.py`, `import_unreal_assets.py` (requires the editor; not executed here).

## Historical v0.6 refit / surface extension

The active v4 browser now uses `flight-controls.js` for authoritative pilot commands, `ship-refit.js` for the aft deck/exterior, `terrain.js` for deterministic unit-sphere terrain/movement and `surface-renderer.js` for streamed terrain and orbital globe meshes. Geometry and shaders are original procedural source, embedded offline; no downloaded placeholder images or visible drone models are used. All existing audio masters remain unchanged. The shared catalog has 17 sites. This is browser functionality, not verified native parity.

# v0.5.0 additions / preserved assets

The user attachment is saved byte-for-byte as `BrowserPreview/v4/Heliopause-v4.original.html`. The active renderer is derived from its custom WebGL2 geometry/shaders, not the older Three.js scene.

All ten earlier EVA PCM masters and MP3s remain. Ten additional masters/MP3s are saved: six Commander lines (`hale_*`), the corrected `eva_intro_1`, `eva_intro_2`, `eva_obj_room`, and `eva_obj_entry`. `Shared/commander.json` records their text/duration/provenance. `Tools/prepare_v4_audio.py` derives compressed copies without overwriting prior EVA masters. `eva_intro.wav` is preserved separately from the corrected greeting.

All speech is AI-generated using the selected voices. The optional breath asset is synthetic foley. The current browser preserves original v4 cue text alongside recorded variants; all bundled clips are available in its VOICE library. Additional planets/stations/crowds are authored procedural geometry/shader code in `v4/main.js`. Native and historical browser assets below remain in source.

# Asset provenance and retention

## Saved audio

`Content/Audio/Voice/eva_*.wav`: **ten original AI-generated EVA dialogue recordings**, using the user-selected voice. Mono PCM16 at 44.1 kHz. These are not human actor performances or cloned-identity claims.

`BrowserPreview/assets/story/*.mp3`: corresponding normalized 128 kbps browser copies. `Tools/prepare_story_audio.py --ffmpeg /path/to/ffmpeg` derives these and the shared cue catalog from the WAV masters. All ten are embedded into the standalone HTML.

`Content/Audio/breathing_foley.wav`: optional quiet procedural respiratory/cloth foley; **synthetic, not a human recording**, disabled by default. Reproducible with `Tools/generate_breath.py`. Ambient hum, confirmation and alarm WAVs remain saved too.

`Content/asset-manifest.json` records SHA-256 for all WAV assets; run `python3 Tools/asset_manifest.py --check` to verify. Native packaging stages Audio as loose NonUFS content. Native user PCM WAVs in `Saved/Voice` override bundled filenames; browser uploads are stored locally and never uploaded to a server.

## Art and interfaces

The browser's hull, cabins, shared bulkheads, berths, desk, curtain, reactor, drones, station modules, crowds, stars, planetary shader, monitor artwork and machined surface texture are authored procedural assets in `BrowserPreview/src/scene.js`. They are reproducible from source and saved inside the generated HTML. No model-service requests or stock-photo placeholders are needed.

Native art is constructed separately in `HPWorldBuilder.cpp`, using engine BasicShapes hard references and procedural hull/body meshes. Native art quality and engine resolution remain unverified until an Unreal run. No fake `.uasset` or `.umap` binaries are included.

UI icons/layout are source-authored. Three.js is MIT; Inter, Barlow Condensed and IBM Plex Mono use OFL licenses. Full notices are saved in `BrowserPreview/THIRD_PARTY_NOTICES.txt` and embedded in the standalone HTML.

Generated screenshots, browser runtimes, build scratch data and FFmpeg tooling remain in ignored `Artifacts/` or dependency directories, not in the release asset inventory.

## Rigged humans, NASA spacecraft and PBR interiors (v0.8)

See [STREAMING_MODELS.md](STREAMING_MODELS.md) and `Content/ThirdParty/Streaming/sources.json` for the nine-model streaming library, exact pins, hashes, individually verified licenses and offline/HD policies. The expanded OEC science snapshot is `Shared/exoplanets.json`; visualization assumptions are separate from its sourced astronomical fields. The library is extensible, not a claim to include all models on the Internet or observed maps of exoplanet surfaces.
