# Terminal, character motion and connected-room upgrade

## Implemented

### Earth opening (browser)
- Airport set dressing: gate counters and monitors, check-in kiosks, queue posts/belts, luggage with handles/ribs/tags, luggage cart, departure/wayfinding boards, ceiling slats, floor markings, planters, apron markings, bollards and a service tug.
- Walnut/charcoal/teal architectural palette instead of the pale empty terminal. Real Rocketbox characters, Khronos/Wayfair furniture and NASA spacecraft remain in use.
- Establishing camera eases into a closer commander shot. The officer stands beside the desk, not behind an occluding monitor. NASA shuttle orientation is corrected before bounding-box fitting; its unrelated node animation is not played as a humanoid animation.
- Original 27-second story sequence, dialogue scheduling and Space-to-skip are retained. No bottom skip button was added.

### Animation safety (browser)
- Matching male/female neutral-walk FBXs from the pinned Microsoft Rocketbox revision. Sources and SHA-256 hashes are in `Content/ThirdParty/Streaming/sources.json`; derivatives in `BrowserPreview/assets/animations/`.
- No ad-hoc Head/Spine quaternion manipulation. Station occupants no longer rotate their entire bodies sinusoidally while standing.
- Per-instance animation mixers, skeletal cloning and authored breathing remain. Walk clips retain local quaternion channels plus source vertical root motion; planar root travel is applied to the actor at the source stride rate and fitted character scale.
- Validate target binding, duplicate channels, strictly ordered finite key times, unit quaternions and bounded root motion. No limb translations or animated scales. The female `Bip01` is a skeleton ancestor rather than a skin joint; it is explicitly supported. Unused Footsteps helpers are excluded when they are not joints.
- Tests sample 160 animation steps per character, checking unchanged limb offsets/scales, finite world matrices and normalized rotations. This checks mathematical/binding invariants, **not every possible pose or every GPU**. Walk videos and stills provide visual evidence.

### Eight connected rooms
The original six room IDs and saved states are preserved.

| New room | Access | Browser center | Purpose |
|---|---|---|---|
| Fabrication workshop | Through bathroom outer door | x −14.1, z 14 | Tool racks, workbenches, cabinet; service bench dispatches a real engineering repair through existing microbot maintenance |
| Medical / recovery | Through gym outer door | x +14.1, z 14 | Two recovery berths, standby monitors, supply cabinet and live pressure/coolant/fault readout |

- Parents must deploy before annexes. Parents cannot compact while their annex is active. Occupied annexes cannot compact.
- DEPLOY ALL sequences core rooms then annexes; COMPACT ALL reverses dependencies. Each stage takes eight simulated seconds. Parent geometry remains available until its annex finishes compacting.
- Transition doors lock, flight stays interlocked, compacted interiors unload, and orphaned annex saves are repaired to a safe stowed state.
- Parent outer walls now have actual openings. Annex doors bridge both walkable bounds. Furniture and collisions leave a central route.
- **Existing access defects fixed:** engineering console and breaker interaction volumes intercepted the gym doorway; the science catalog volume intercepted the pool doorway. Console regions now match actual consoles, and the breaker panel is mounted at z 16 instead of across the z 14 entrance.
- Less washed-out panel materials and lower light intensity across habitats; new annex signs, cloth berths, tool racks and standby displays.
- Medical is an environmental/recovery compartment, **not a new clinical diagnosis or healing simulation**.

## Unreal source boundary

The supplied `HeliopauseCore` is extended, not replaced: eight native modules, matching parent relationships, outboard doorway geometry, occupancy/parent compaction guards, furnished annexes and dependency-safe save restoration. Legacy native room names remain stable.

**Unreal Engine 5.8 is not installed here.** These changes have not passed UHT/UBT, editor placement, collision traversal, cooking or engine runtime tests. The native terminal set and native walking-clip import/playback are not implemented by this browser visual upgrade. Browser/native visual or functional 100% parity is therefore **not claimed**. Portable kernel tests do not establish an Unreal build.

## Validation and reproduction

```sh
npm ci --prefix BrowserPreview
npm --prefix BrowserPreview test
bash Tools/test.sh
npm --prefix BrowserPreview run build
npm --prefix BrowserPreview run test:annex-browser
npm --prefix BrowserPreview run test:habitat-browser
npm --prefix BrowserPreview run test:premium-browser
npm --prefix BrowserPreview run test:premium-online
```

The deterministic annex integration suite uses normal UI buttons and keyboard input with a controlled animation clock. Suppressing intermediate GPU draw calls makes simulation checks fast; final screenshots use actual rendering. It verifies six core door interactions, continuous keyboard traversal through both parent/annex door pairs, occupied/parent guards, eight-room save reconstruction, ordered unload and a completed workshop repair job. There are no new player-accessible teleports or test shortcuts.

See [`../Previews/README.md`](../Previews/README.md) for capture commands, media scope, attribution and resolution. `Previews/validation.md` records results for this update. Software-rendered media is not a hardware performance benchmark or evidence of a full campaign playthrough.
