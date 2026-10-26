# v0.6.0 — pilot repairs, ship refit and planetary expeditions

- Fix stale tablet flight writes, P while tablet open, thrust while docked, and clipped/wrong-aspect cockpit screens. Add visible pilot controls and live readouts.
- Add connected storage, engineering and science rooms with physical scanned doors, room lighting, maintenance access and cargo/specimen manifest. Expand the faceted exterior with radiator wings and engine pods.
- Remove visible drone props; retain invisible microbot autonomy and remote optics.
- Add Kepler-442b, Eidolon and Solis Dune (17 destinations total). Model solid-body globes and stream their terrain for walking, swimming and skimmer exploration. Add lander recall, reboarding, geological specimens and surface saves. Vesper remains non-landable.
- Preserve all 20 voice recordings, original prologue/campaign, station crowds, fixed hull sensors and offline standalone distribution.
- Add five portable regressions and an offline browser refit/surface suite. Correct the tutorial to require its original two doors, not every new aft door.

Browser feature update only. Surfaces are stylized, compressed procedural worlds; landing is a transition, not seamless atmospheric piloting. Native UE 5.4 is uncompiled source without this renderer/refit parity. See VALIDATION.md.

# v0.5.0 — supplied-v4 browser expansion

- Adopt the user's uploaded HTML as the active base; preserve its original file.
- Fix the greeting interruption and record the corrected delivery without deleting the prior EVA clip.
- Add six AI-generated Commander performances, using the selected voice; preserve existing EVA recordings and original v4 text cues.
- Add manual sector piloting/braking and obstacle-aware course planning.
- Add Cinder, Pelagos, Borealis, Vesper; extend story through three planetary surveys, Pilgrim, return and ending.
- Retain fixed hull sensors, physical door scans/walking, curtains, lighting, repair systems, drones, crowds, stations, exchange and saves.
- Add focused offline UI, expanded continuous-campaign, and speech regression tests.

Browser build is executable; UE 5.4 remains uncompiled source with the earlier native campaign. No native parity or hardware performance certification is claimed.

# v0.4.0 — A Long Way Home (browser + UE 5.4 source preview)

- Replace the old native gameplay actors/module with the supplied HeliopauseCore architecture and EnhancedInput.
- Add concrete runtime world, menus, tablet, HUD, station travel and exploration saves around that framework.
- Add a bounded 12-state campaign, ten skippable voiced scenes, subtitles and ending; retain free exploration after completion.
- Add ten saved synthetic EVA recordings and quieter optional respiratory foley.
- Rework browser quarters into two berths, a desk and an opening thermal curtain; align compartment spacing, share boundary doors and support continuous walking through open bulkheads.
- Add ten-site exploration, three station concourses with crowds, surveys/artifacts, exchange trade and upgrades.
- Fix data-first artifact-sale softlocks, storage exception handling, drone/station guards, navigation input override and story resume cases.
- Expand portable and offline browser tests, source-only release packaging and checksum-verified static hosting.

**Release boundary:** runnable browser build plus native source. No Unreal build or packaged native executable is certified. See VALIDATION.md for exact test coverage and limitations. The earlier v0.1.0 source prerelease is historical and does not contain this campaign/framework replacement.
