# v0.7.0 validation — 2026-10-26

Active renderer: supplied-v4 HTML/WebGL2. Unreal 5.8 is **uncompiled source only**.

## Executed locally

- **56 JavaScript rule/asset tests**: flight authority, travel/story/economy, rooms, terrain, saves, voice queue, integrity-checked asset streaming; continuous manual sector movement, swept terrain touchdown, high-speed contact, liftoff clearance, camera continuity across 3 km and across terrain rebuild anchors, ship orientation and pickup pose synchronization.
- **Portable native checks:** preserved audio hashes, five Python project checks, six voice tests, synchronized catalogs, ASan/UBSan simulation/exploration/habitat/planetary kernels. Quaternion flight matched JS for 8,000 mixed-axis steps within 1e-10. This does not compile any Unreal translation unit.
- **Baseline browser:** real keyboard flight/brake, hull sensors, destinations, recorded EVA/Commander queue, maintenance, microbot loss, mobile tablet. Offline, no runtime errors.
- **Story browser:** opening, lights, physical handprint scans/doorway walks, curtain and entry controls; saved endgame fixture covers station walking, exchange and ending. Not an uninterrupted playthrough of every campaign leg.
- **Refit browser:** physical surface walking/skimmer, samples, save/reload, pickup/reboard, aft doorways, pilot/tablet controls, three solid worlds and mobile layout. Arrival fixtures establish position/velocity; production contact performs touchdown. No terminal descent state is injected.
- **Habitat browser:** six room deployment, moving-ship refusal, transition locks, room entry, occupancy refusal, flight lock, orbit/zoom camera, room screenshots, GPU unload, persistence, hatch/disembark/reboard and manual liftoff.
- **Planetary browser:** production motion crosses the former 3 km boundary without a transit scene or autopilot; a separate near-ground fixture exercises soft contact and manual liftoff. Loaded NASA mesh verified at 23,232 triangles. No JS/GL errors. This is not a single uninterrupted descent from 400 km.
- **Rendering/integration browser:** six planet styles, six flight axes/reverse/coasting, gas-giant guard, Cinder terrain contact, hazard damage and suit save.
- **Asset browser:** production CSP headers, embedded NASA mesh, routed HTTPS real downloads/hash verification, HD cache/offline switch, all five embedded map decodes, file mode with zero HTTP requests. Uses a hermetic routed origin, not a claim that a particular deployment was tested.

Software-rendered screenshots were inspected. They demonstrate functional, stylized scenes—not photorealism or GPU/FPS certification. Earlier suites are rerun when related code changes; the CI workflow runs all seven browser suites on committed builds.

## Explicit remaining limits

- **No native build/runtime validation or full parity certification.** Native prologue retains its older survey flight path; native contact/terrain is integrated with expedition flight. Native surface encounters, recall, detailed art and online streaming are not fully equivalent to the browser. Imported `.uasset` materials/meshes have not been generated here.
- Manual browser descent uses one flight state. The optional opening survey autopilot and explicitly requested surface pickup still have authored behaviors. Neither is the removed 3 km landing program.
- Collision uses swept ship-centre terrain contact, not full rigidbody/hull-footprint collision. Landing alignment uses radial up rather than a fitted ground plane. No gravity/orbital-mechanics solver. Worlds are compressed and bounded in an authored sector.
- The terrain is deterministic procedural terrain, **not elevation reconstructed from the photographic maps**. Near-patch LOD, map/biome disagreement, prop appearance, visible seams and cloud banding can occur. Decorative vegetation/furniture does not have universal rigidbody collision.
- Six habitat interiors are modeled and functional but stylized. General PBR glTF materials, production-quality character animation and a complete high-quality model replacement are unfinished.
- The fetched NASA Moon GLB is the **color-map-only** variant; it is not the topography variant. Browser keeps its topology but applies Solar System Scope lunar maps/tints. Native import retains the original atlas. These are fictional-world adaptations, not measured exoplanets.
- HD assets may be 8K on disk but GPU textures are capped at 4K; one HD planet surface is resident. Clouds remain the embedded 2K map. Streaming requires HTTPS; embedded assets remain available offline.
- Saves preserve progress, stable habitats, landed/surface state, samples and ship settings. Motion/scans stop on reload and interrupted pickup is recovered safely, not replayed frame-for-frame. Storage restrictions are reported.

## Historical results

The v0.6.0 release used scene-based surface entry and a separate lander. Those limitations do **not** describe the current manual-descent implementation. Historical test logs/screenshots in ignored `Artifacts/` are not substituted for current checks.
