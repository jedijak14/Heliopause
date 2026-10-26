## v0.6 refit / surface extension

The active v4 browser now uses `flight-controls.js` for authoritative pilot commands, `ship-refit.js` for the aft deck/exterior, `terrain.js` for deterministic unit-sphere terrain/movement and `surface-renderer.js` for streamed terrain and orbital globe meshes. Geometry and shaders are original procedural source, embedded offline; no downloaded placeholder images or visible drone models are used. All existing audio masters remain unchanged. The shared catalog has 17 sites. This is browser functionality, not verified native parity.

# Supplied v4 base

`Heliopause-v4.original.html` is the user's uploaded file, preserved unchanged. The active build starts from its document in `../index.html` and its extracted/extended script in `main.js`. It retains the bespoke WebGL2 ship, PBR/planet shaders, handprint doors, curtains, tablet and procedural score. This is not a reskin of the older Three.js renderer.

`voyage.js` adds the extended, continuously navigable campaign/economy. `voice-player.js` serializes recordings and subtitles: the old timed opening fired the second EVA line while the first was still speaking. The replacement waits for the active audio to end. Missing/blocked recordings retain captions; installed speech fallback selects only local voices.

All ten previous EVA WAV/MP3 pairs remain intact. Ten additional recorded clips provide six Commander performances, a corrected EVA greeting, and three v4 tutorial lines. All original v4 line texts remain in the voice library (colliding versions have `_original` IDs). The original `eva_intro.wav` has NOT been overwritten by the corrected `eva_intro_1.wav`.

New worlds: Cinder (volcanic), Pelagos (ocean), Borealis (ice), Vesper (banded gas giant). Three are required in the expanded story; Vesper remains a post-story/free-exploration destination. The sector has 14 destinations, including five planets, one moon and three inhabited stations. Planet surfaces are not walkable.

The old `../src/main.js`, `scene.js` and old browser scripts are retained as the earlier implementation/reference, but are not imported by the active entry point. Shared portable simulation tests still cover those rules. `test:browser` and `test:campaign-browser` now run the v4-specific checks.
