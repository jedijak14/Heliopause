# Pressure-seal repair validation — 2026-10-26

Current standalone SHA-256: `fdcdbec262011e1bcff77c34c2a78139718f5d0dbb0c0b9b4493fa196c29db1c`.

| Check | Result / scope |
|---|---|
| Node tests | **72 passed**; includes sampled collar/wall closure, clear passages, door-seat overlap, connected annex planes and normalized daylight |
| New pressure-route browser test | **PASS on final standalone**; walks from cockpit through all aft doors and back, enters all six core pods and both annexes, returns, compacts and checks fault → actual repair → opening |
| Mobile browser | **PASS on final standalone**; Chromium touch emulation, not physical iPad/Safari |
| Annex browser | **PASS on final standalone**; interaction, real walking, parent/occupied guards, save restoration, GPU unload and workshop repair |
| Full legacy refit browser | **PASS during this repair**, before the last material/visibility adjustments; terrain, save/return, all aft rooms, flight UI and three landable worlds. The final-build room route is independently rerun above |
| Model audit | **18/18 HD/offline variants passed**; hashes, finite decoded attributes, normals, indices, UVs and embedded texture dimensions; one upstream ISS primitive uses glTF's valid default material |
| Portable C++/JS suite | **PASS**; sanitizer tests, 8,000 flight parity steps, 117 warp cases / 3,624 snapshots, habitat and touchdown rules; **not an Unreal compile** |
| Render capture | **PASS**; 14 walking-route collar/entrance/annex views and nine room/exterior views; no page or WebGL errors |

See [pressure-seal gallery](Pressure-Seals/README.md), [model audit](Pressure-Seals/model-audit.json) and [implementation notes](../Docs/PRESSURE_SEALS.md). The 41-media checksum manifest contains the original terminal/assets/mobile evidence plus the newly captured/updated room evidence. Original mobile screenshots are retained as historical priority-build evidence, not silently relabeled as this build.

Only the listed suites were rerun here. Full GitHub CI, physical-device performance, all possible views/campaign states, and UE 5.8 rendering are not claimed. The Vercel production deployment from PR #4 is historical; these branch changes have not been merged or published to it.

---

## Historical validation (before this repair)

### Validation record — 2026-10-26

## Publication order

The mobile-only change was committed and pushed **first**, as requested: `c5fc576`. The terminal/animation/annex work follows in a separate commit. No new pull request has been merged automatically.

## Final combined build

Standalone browser SHA-256:

`93063ee51663e80b7879baa699ff5304d81f8ed6d113b0959e5bdda7f40ae31c`

| Check | Result |
|---|---|
| Node tests | **68 passed**, zero failures |
| Mobile-only priority baseline | **65 passed**; touch browser suite passed |
| Combined mobile browser suite | **PASS** — phone/tablet portrait/landscape, persisted pre-story settings and actual resolution changes, SVG controls, 44px+ targets, simultaneous thrust/pitch/look, autopilot cancellation, brake, pointer cancel, tablet release, pinch zoom, top skip, desktop opt-in; no page/WebGL errors |
| Combined annex browser suite | **PASS** — all six core door interactions; keyboard traversal through gym→medical and bathroom→workshop; parent/occupancy guards; eight-room save restoration and ordered unload; real workshop repair job completes |
| Character invariants | **PASS** — 160 sampled steps per rig, bound tracks, finite/unit quaternions, unchanged limb offsets/scales, bounded authored vertical root motion |
| Whitespace / patch check | **PASS** |

## Broader checks completed during the terminal/room stage

These were run before the mobile follow-up and final small resource-ownership/guard corrections, **not all against the final combined HTML hash**:

- Full habitat browser regression: **PASS**. Moving-ship refusal, sequential eight-room deployment, locked transition doors, keyboard traversal, occupied-room refusal, flight lock, orbit/zoom camera, furnished-room captures, geometry unload, persistence, actual terrain touchdown, exterior hatch, disembark/reboard and liftoff.
- Premium offline browser: **PASS**. Embedded GLB/Draco/Meshopt, Earth crew, Space skip, exterior shades, science catalog, UI warp/braking and shared WebGL renderer.
- Premium HTTPS test with production CSP: **PASS**. HD commander/officer/shuttle, full 56.6 MB ISS stream, twelve rigged station occupants and offline continuation; no model/page/WebGL errors.
- `Tools/test.sh`: **PASS**. Portable exploration/flight/habitat/terrain/warp rules; 8,000 browser/C++ flight steps at 1e−10; 117 warp cases / 3,624 snapshots at 1e−7; sanitizers; 194 safe warp traversals / four conservative refusals. Negative-speed habitat deployment refusal is also covered.

The final combined mobile and annex suites were rerun after integration. GitHub CI provides additional exact-commit regression checks; local results are not a statement that pending remote CI has finished.

## Visual evidence

- 21 terminal/asset/room PNGs plus three mobile PNGs.
- A 12-second silent opening-camera preview and two three-second neutral-walk previews.
- All three MP4s decoded to completion without errors.
- Actual renderer captures reported no model/page/WebGL errors; joint counts: commander 81, officer 80.
- Mid-walk frames and terminal/room views were visually inspected; viewport-only fixtures are private tooling, not player teleports.
- Room-gallery HUD overlays predate the mobile overlay change; `Mobile/` records the mobile priority build. Room geometry and material captures remain representative of the integrated rooms.

See [render report](render-report.json), [media checksums](manifest.json), [implementation scope](../Docs/TERMINAL_AND_ANNEXES.md) and [mobile scope](../Docs/MOBILE_CONTROLS.md).

## Explicitly unverified

- **No Unreal Engine 5.8 build, UHT/UBT, cook or native runtime validation.** Native annex source was added; native airport staging and native walk-clip playback remain unfinished. Full browser/Unreal parity is not claimed.
- **No physical iPad/iPhone/Safari/WebKit test.** Chromium touch emulation is not a device benchmark.
- No high-end hardware frame-rate, memory/thermal benchmark, exhaustive animation-pose review or complete campaign playthrough for this combined build.
- Medical is an environmental/recovery room, not a new diagnosis/healing mechanic. Preview videos are silent; they do not test audio synchronization.
