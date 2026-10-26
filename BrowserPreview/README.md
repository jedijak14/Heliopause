# HELIOPAUSE — supplied-v4 browser build

Download/open `heliopause.html` in a WebGL2 browser. Runtime assets, original shader art, procedural ship/station geometry, subtitles and twenty recorded dialogue clips are embedded. There are no external runtime requests. This is browser-native WebGL, not Unreal Pixel Streaming.

The active base is the user's uploaded v4 file, preserved in `v4/Heliopause-v4.original.html`. `index.html` and `v4/main.js` contain the working extension. The earlier Three.js source is retained under `src/` but is not the active renderer.

## Play

Choose STORY, CONTINUE or FREE FLIGHT. P takes the pilot seat. T opens the tablet; NAVIGATION supports target selection, course planning, scans/recovery, docking and exchange. In free flight, undock before thrusting. W/S adjust thrust; A/D yaw; R/F pitch; B brakes. Manual steering cancels autopilot. The ship moves through real sector coordinates.

Outside the pilot seat, WASD walks, Shift runs and C crouches. Mouse drag/click capture looks around. E uses a nearby handprint scanner or curtain. Scan BOTH doors and physically walk through them in the tutorial. V cycles fixed sensors; there is no chase camera. Space skips cinematic sequences. Phones get touch look/movement and tablet/pilot/interaction buttons. Desktop is recommended.

At stations, walk to the forward exchange to archive discoveries/upgrades; return to the rear airlock to reboard. SYSTEMS exposes repairs/hazard diagnostics, DRONES local autonomy and remote links. Rendering quality and optional quiet synthetic breathing are in AUDIO. Hardware uses full resolution; software renderers default to reduced resolution. This is not a hardware FPS guarantee.

## Story and planets

The orbital tutorial expands into Kestrel → Cinder → Pelagos → Borealis → Pilgrim → Anchorage. Vesper is an optional frontier gas giant. The sector has 14 destinations, including five planets, one moon and three walkable stations. Surfaces are not landable. The story has a definite ending; exploration continues afterward.

## Voice and saves

The fixed opening is serialized: the next EVA line cannot cancel its predecessor. Six newly recorded Commander lines use the selected AI voice. All ten earlier EVA masters/MP3s remain; ten extra clips include the new greeting/tutorial recordings. Original v4 cue texts remain in VOICE, with `_original` where necessary. Custom filenames must exactly match the line ID. Uploads stay in memory for this v4 session; they are not sent to a server. No claim of persistent custom uploads is made for this renderer.

Saves use `heliopause-v4-voyage-1` in localStorage, separate from older browser saves. Autosave runs every 15 active simulated seconds. Continue safely stops motion/scans and reconstructs prologue progress. Storage failures are surfaced. Starting STORY/FREE FLIGHT creates a fresh session; confirm before replacing an existing save.

## Develop and test

```sh
npm ci
npm test
npm run build
npm run test:browser
npm run test:campaign-browser
npm run dev -- --port 5173
```

Tests cover portable rules and offline Chromium. The extended campaign rule test uses continuous travel through all objectives; the UI test covers the opening, physical doors, entry, and a saved endgame fixture. See `../Docs/VALIDATION.md` for limits.

The build creates a tracked standalone HTML and SHA-256. Root `vercel.json` verifies and publishes that file only; it does not compile Unreal. Build caches, browser tooling and screenshots are ignored. Source-only release archives include original uploaded HTML, audio masters and generator scripts.
