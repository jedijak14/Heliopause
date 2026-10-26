# HELIOPAUSE — A Long Way Home

**v0.5.0 browser game + UE 5.4 source preview.** The active browser build uses the user's supplied **Heliopause-v4.html** as its base, preserving its ship, shaders, interiors, physical interactions and score.

**Offline game:** [`BrowserPreview/heliopause.html`](BrowserPreview/heliopause.html). Download and open the entire file in a WebGL2 browser. It embeds all runtime assets and needs no server, account or API key. The Vercel project publishes the same checksum-verified file.

## This update

- **Drivable ship:** pilot seat, W/S thrust, A/D yaw, R/F pitch and B brake; real sector-position updates. Manual steering cancels navigation. A visibility-graph route planner guides autopilot around planetary obstacles.
- **Four new worlds:** Cinder, Pelagos, Borealis and Vesper. The bounded sector now contains 14 destinations, five planets, one moon and three walkable station concourses with crowds.
- **Longer story:** orbital shakedown → Kestrel recorder → Cinder/Pelagos/Borealis surveys → Pilgrim archive → Anchorage exchange → voiced ending. Free exploration remains open afterward.
- **Dialogue:** six new AI-generated Commander performances using the user-selected voice; corrected EVA greeting and three recorded tutorial lines. All ten previous EVA recordings and the original v4 cue texts remain available. The opening is queued, so the second cue no longer cancels “Good morning, Commander.”
- **Retained systems:** handprint scans, doors, lighting, thermal curtains, fixed port/starboard/forward hull sensors (no chase camera), atmosphere/repair controls, drones, station crowds, exchange/upgrades and local saves.

Breathing is optional quiet **synthetic** foley, not a human recording. Dialogue is AI-generated, not a human acting claim. The universe is authored/bounded, not infinite; planets are orbital destinations, not landing surfaces.

## Controls

| Input | Action |
|---|---|
| P / PILOT | Take or leave the pilot seat |
| WASD / mouse | Walk/look; when piloting, W/S thrust and A/D yaw |
| R/F / B while piloting | Pitch / brake |
| E / INTERACT | Door scanner, curtain or nearby station interaction |
| T / TABLET | Navigation, ship systems, drone links, lighting, flight, audio |
| V | Fixed hull sensors / first person |
| Space | Skip a cinematic |

**Free flight:** P → T → NAVIGATION → UNDOCK, then close the tablet and use flight controls. Dock to enter a station. Walk forward to its exchange before selling discoveries or buying upgrades; return to the rear airlock to reboard.

## Build and verify

```sh
bash Tools/test.sh
cd BrowserPreview
npm ci
npm test
npm run build
npm run test:browser
npm run test:campaign-browser
npm run dev -- --port 5173
```

22 portable JavaScript tests include continuous travel through every expanded story objective, manual piloting, obstacle routing and non-interrupting dialogue. Offline Chromium tests exercise real keyboard flight, recorded audio, physical handprint scans/doorway walks, station exchange and ending. The endgame UI test uses a saved fixture; the rule test covers continuous mid-campaign travel. See [validation](Docs/VALIDATION.md).

## Unreal source status

[`Heliopause.uproject`](Heliopause.uproject) targets **UE 5.4** and uses the replacement `HeliopauseCore` architecture rather than the old competing actors. It includes the shared 14-destination catalog, the earlier bounded campaign and runtime-generated world/UI.

**No Unreal Editor/UHT/UBT/UAT is available here. Native source is uncompiled, uncooked and unverified; there is no packaged native executable.** The latest v4 browser's extra planetary story chapters/Commander dialogue are not claimed to be fully mirrored in native gameplay. See [build gates](Docs/BUILD.md).

[Supplied-v4 source notes](BrowserPreview/v4/README.md) · [browser guide](BrowserPreview/README.md) · [asset provenance](Docs/ASSETS.md) · [architecture](Docs/ARCHITECTURE.md).
