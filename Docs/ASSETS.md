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
