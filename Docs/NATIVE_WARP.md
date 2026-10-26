# Native warp continuation — source, not a verified Unreal build

This branch extends the supplied `UHPExpeditionSubsystem` / `AShipManager` architecture. It does not introduce a second pawn, ship controller or save subsystem. The released v0.8 HTML and live browser deployment are unchanged by this continuation.

## Implemented

- `WarpFlight.h`: portable game-kilometre route planning, planet/moon exclusion shells, five catalog star exclusion spheres, checked Catmull–Rom corridors, three-second charging, quintic acceleration/deceleration, tangent quaternion alignment, exact exit positions and bounded controlled braking. It updates the existing expedition position, velocity and travel counter; it is not a teleport or a separate travel coordinate system.
- Native star positions/radii are generated from the same pinned `Shared/exoplanets.json` as the browser. These are **compressed fictional navigation coordinates**, not astronomical distances or measured stellar radii.
- Native fallback tablet: select a destination under EXPEDITION, take the pilot seat, then FLIGHT → ENGAGE WARP. The control becomes a controlled-brake request while active. HUD shows phase and progress. Blueprint-callable subsystem controls and read-only progress/strength accessors are also supplied.
- Warp engagement requires free-navigation story authority, crew/pilot control, stowed habitats, released landing clamps, closed pressure hatches, an undocked ship, low speed and a clear corridor. Habitat deployment is blocked even during the stationary charge phase.
- B, manual axes, navigation/target changes and legacy autopilot/pitch/thrust requests cancel through controlled braking. Commands other than braking are **not executed** while the field is active; issue them again after release. Normal flight/atmosphere integration does not also run during a warp frame.
- Ordinary saves are deferred until field exit. Field/velocity state is not serialized. Engine shutdown instead saves the current corridor position at rest; load rejects an active field. These Unreal save-path changes have not been exercised in-engine.
- Thermal protection is now updated outside the legacy-flight early return. Heat cools while landed, habitat-locked or warping; the source can restore the remembered window state after the thermal threshold clears. This is not the unfinished native full-hull shade renderer.
- Station-return movement now requires an actual station visit and a successful expedition command; it cannot teleport a character out of a flight/habitat context.

## Executed evidence

`bash Tools/test.sh` includes:

- **117 browser/native warp route and cancellation cases / 3,624 snapshots**, comparing acceptance, sampled curve size, length, duration, phase, elapsed time, progress, strength, rate, travel, position, velocity, quaternion and attitude to `1e-7` absolute tolerance. Mixed timesteps match the same portable formulas, **not Unreal frame scheduling**.
- **194 successful traversals** (97 routes at both 0.025 and 0.1-second steps) with every actual frame chord tested against planet and star exclusions; four conservative refusals (two cases at both rates). Exact exits and zero final velocity, cancellation/frame-rate tests, permission failures and invalid-state/delta-time guards run with ASan/UBSan.
- Existing source/audio/catalog/save validation, planetary/habitat kernels and the 8,000-step six-axis flight comparison also pass. Browser rule/model tests remain **62/62**.

An Unreal automation source test has been updated for 33 destinations and a warp/brake smoke test, but **has not been executed**. Native invalid/non-finite timesteps are ignored; the browser kernel throws on invalid active-field timesteps. Valid-input numerical behavior is what the parity comparison covers.

## Still required

No Unreal Editor, UHT, UBT, cooking, import, packaging, runtime/FPS verification or actual save migration was available in this environment. In particular, native warp streaks/post-processing and star visual scene assembly are not implemented by this change. Existing world objects should follow the authoritative expedition motion, but engine presentation is unverified.

Earth-side staging and crew, premium imported scene assembly, full exterior nano-laminate rendering, and other documented browser/native gaps remain. This is **not full parity** and not a native executable.

### Engine acceptance checklist (pending)

1. Build the 5.8 target and run `Heliopause.Core.Framework` in Editor automation.
2. At the pilot seat, select TRAPPIST-1 b, undock, close both hatches and engage warp; verify live world motion and HUD phase/progress.
3. During charging and cruise separately, exercise B, every manual flight axis, target change and legacy autopilot controls. Confirm no snap to normal-space speed and no second integration step.
4. Attempt deployment while charging; confirm refusal. Repeat engagement with deployed rooms, open hatches, landing clamps, station/drone control and excessive speed.
5. Save during charging, cruise and braking; verify deferred writes, exit persistence and stationary resume. Quit mid-warp and confirm safe held-position recovery.
6. Confirm thermal window restoration, story/audio progression after arrival, and normal manual flight after exit.
