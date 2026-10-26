# v0.6.0 / ship refit and planetary surfaces

Active renderer: the user's supplied v4 HTML/WebGL2 base. UE 5.4 is source-only.

## Executed checks

- 27 portable JS tests: continuous expanded story travel, all 17 discovery destinations, pilot authority/undock guards, tablet controls surviving simulation updates, deterministic terrain on all eight solid bodies, globe seams/poles/circumnavigation, skimmer/recall, surface save validation, recorded-voice serialization.
- Offline systems browser test: real keyboard flight/brake, fixed sensors, 17 targets, recorded EVA/Commander playback, maintenance, invisible microbot takeover/loss and 390px tablet layout.
- Offline story browser test: original prologue lights, both original physical handprint scans and doorway walks, curtain, entry. Saved endgame fixture then tests station walking, exchange and preserved ending. Mid-campaign travel is covered continuously by rules, not an uninterrupted browser playthrough.
- Offline refit browser test: land on Kepler using the real UI, walk and use the skimmer far enough to stream terrain, collect samples, save/reload on the surface, recall/reboard; scan and physically walk through the three new aft doorways; P with tablet open; actual thrust/pitch/yaw tablet controls; Eidolon and Solis land/return from explicit arrival fixtures; mobile flight panel. No external HTTP requests or runtime errors in successful runs.
- Five Python checks, six companion voice tests, 24 preserved asset hashes, generated catalog synchronization, portable C++ ASan/UBSan suites.
- Inspected cockpit displays at full screenshot resolution and planetary terrain. Software Chromium uses reduced resolution by default; selected screenshots explicitly switch to high quality. This is not GPU/FPS certification.

## Boundaries and remaining validation

- No Unreal build/cook/runtime validation. Native uses HeliopauseCore and the shared 17-site catalog but does not mirror the new surface renderer, ship refit or latest browser campaign. No native executable is supplied.
- Bounded sector and compressed, deterministic procedural globes. Not an astronomical-scale simulation, infinite universe, photorealistic reconstruction, or seamless ship-to-ground flight: landing is a scene transition to a separate lander.
- Every solid body's terrain is mathematically available worldwide; globe sampling/seams/poles are tested. Browser traversal has sampled local regions, not walked every coordinate. Near terrain streams in discrete patches; distant tessellation and prop appearance can be visible. Decorative vegetation/rocks have no general rigid-body collision. Lander proximity is blocked.
- The surface skimmer changes travel speed/camera height; it is not a separately steerable animated vehicle model. Water traversal is simplified. Vesper has no solid landing surface.
- Surfaces use original stylized procedural terrain/props, not photographic assets. Specimens are a persistent research collection, not a new exchange currency. Cargo archives retain their existing trading flow.
- Six visible rooms map to four atmosphere/service zones; the refit does not claim six independent pressure simulations. Microbot props are removed; optics/repair autonomy remain.
- AI-generated dialogue and optional synthetic breathing; all 20 recordings are preserved. User voice overrides remain session-local. Storage failures are surfaced.
- The starfield does not rotate with sector heading; modeled bodies and destinations do. No universal frame-rate, pixel-perfect or native parity claim.

## Historical validation (earlier renderer, not current website)


## Executed checks

- 17 browser rule tests: atmosphere, interlocks, routing, drone health/control, save rejection, sector collision, trading/upgrades and campaign progression.
- The full campaign **simulation** test travels continuously from the orbital prologue to Kestrel, Pilgrim and Anchorage, archives both artifacts, triggers the ending and resumes exploration. It does not teleport between those destinations.
- Offline standalone Chromium systems smoke: pilot/cruise, fixed sensor input/culling, all four compartments, breach/interlock/repair, drone takeover/destruction/static, intrusion/security, local voice import/clear, quality, dialogs and 390px layout. Zero external HTTP requests or JS/shader errors in the run.
- Offline campaign UI test: begin/skip, tablet, lights, handprint, curtain, entry authorization; then a documented saved endgame fixture tests real station walking, exchange and ending. **This UI test does not play every mid-campaign travel leg**; the separate rule test covers that continuous route.
- Five Python source/asset checks, six local voice-queue tests, asset hash verification, shared-catalog synchronization, portable C++ simulation and exploration tests under ASan/UBSan.
- Browser scene screenshots inspected for opening, quarters, entry, engine, station, hull and mobile layout. Headless software rendering is not a GPU performance benchmark.

## Not verified

No Unreal Editor, UHT, UBT or UAT is installed here. Native source has **not been compiled, cooked, launched or profiled**. The included Unreal automation test is a future engine-side gate, not an executed test. Engine materials, input capture, packaged audio staging, runtime meshes and Canvas/UMG behavior all need native validation.

## Deliberate scope / limitations

- A bounded authored sector with three station interiors, not an infinite procedural universe, planetary surface game, multiplayer game or production-scale campaign.
- Flight uses simplified steering and braking. The atmospheric prologue uses a separate altitude/pitch/heat model; it is not a scientific orbital or six-degree-of-freedom rigidbody simulation.
- Navigation brakes for obstacles but has no general obstacle-avoidance planner. If a route is blocked, steer around the body manually before re-engaging navigation.
- Interior art and crowds are original stylized procedural geometry, not photogrammetry or motion-captured humans. Native and browser art differ.
- The deck selector is an inspection shortcut; ordinary walking respects doors/interlocks. Remote repair commands are intentionally available to avoid forcing entry into an unsafe compartment.
- Ten EVA recordings are AI-generated. Sentence subtitle timing is estimated from word counts and measured duration, **not forced alignment**. Custom voice overrides may not exactly match authored scene timing.
- Breathing is quiet optional synthesized foley, not a human breath recording. User audio may override EVA scenes; default sound can be muted.
- Save storage can be blocked/full/private; failure is surfaced. Ship motion/scans stop on reload. Prologue recovery reconstructs safe objective state rather than every animation/temperature frame.
- No universal frame-rate, pixel-perfect rendering or native feature-parity claim.
