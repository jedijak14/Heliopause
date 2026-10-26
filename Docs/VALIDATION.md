# v0.5.0 / supplied-v4 validation

Active renderer: the user's uploaded HTML, not the older Three.js implementation.

- 22 JS tests pass, including the expanded continuous Kestrel → Cinder → Pelagos → Borealis → Pilgrim → Anchorage campaign and subsequent Vesper exploration, real manual translation/turning/braking, every discovery destination, save validation, and the EVA interruption regression.
- Offline v4 Chromium systems test passes: keyboard piloting changes actual coordinates; fixed hull sensors ignore look input; 14 navigation targets; embedded EVA/Commander audio with serialization; repair controls; drone takeover/destruction; mobile tablet. No runtime errors or HTTP requests observed.
- Offline v4 story test passes: opening/skip, lights, BOTH physical handprint scans and doorway walks, curtain, pilot/entry controls. A documented saved endgame fixture then walks through a station, archives discoveries and triggers the retained EVA ending. This is not a claim of UI-playing every mid-campaign travel leg.
- Five Python source/asset checks, six companion voice tests, WAV hash checks, catalog synchronization and ASan/UBSan portable C++ suites.
- Software Chromium selects reduced render resolution; screenshots are not a hardware quality/FPS benchmark. Native rendering remains unverified.

## Remaining boundaries

- No Unreal build/cook/runtime validation. Native gameplay retains the earlier campaign; expanded browser chapters are not full native feature parity.
- Bounded authored sector, simplified flight and orbital survey. No planetary landing, infinite generation, multiplayer or scientific orbital dynamics.
- AI-generated dialogue, optional synthetic breath foley. Existing EVA recordings are retained; no human actor/breath recording claim. Captions are whole-line in the supplied-v4 renderer, not forced-aligned word timing.
- Browser routing uses an inflated-body visibility graph; emergency proximity braking remains a fallback. Native navigation has braking but not the new graph planner.
- Stylized procedural crowds/stations, not motion-captured/textured humans. The attached ship geometry is retained; remote systems pages are not a claim of additional physical cabin decks.
- User voice overrides are session-local in v4. Versioned localStorage saves can fail when blocked/full; errors are surfaced.

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
