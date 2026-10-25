# HELIOPAUSE — interactive HTML preview

**Open `heliopause.html` in a current desktop browser.** It is a complete, standalone file: no server, installation, API keys, CDN, or internet connection is needed. WebGL2/hardware acceleration must be available.

The HTML is a **browser-native interpretation** of the Unreal source project, not Unreal Pixel Streaming and not evidence of an Unreal build. Its bespoke meshes, shader-based planet/atmosphere, monitor art, machined material finishes, icons, locally bundled fonts, and original audio are all present. No stock-image stand-ins, missing-asset tiles, model downloads, or placeholder art are used.

## Explore

- **Drag** the scene to look around. Hull cameras are fixed and intentionally ignore dragging.
- **Take pilot seat** (or **E**) unlocks station keeping, cruise, thrust, and emergency controls.
- The lower **deck selector** opens the bridge, crew quarters, cargo bay, and animated engine room.
- **Explore compartment**, then **WASD** to walk, **Shift** to run, **E** near a bulkhead to pass it. Phones expose directional touch buttons. Room inspection is freely accessible; walking respects pressure/flight interlocks.
- **Ship systems**: select a room on the schematic; inject a pressure/thermal fault, inspect interlocks, open doors or restore atmosphere.
- **Drone link**: take control, move/look, simulate damage, observe destruction static. Security and maintenance units also act locally.
- **1** scans; **2** repairs; **3** contains an intruder in the cargo bay. **V** cycles sensors, **T** toggles systems, **H** opens controls.
- **Mission log** records session events. Cruise schedules an engine fault after 22 simulated seconds and occasional intrusions.
- **Settings**: high/efficient rendering, local audio uploads, system-voice fallback. The speaker button enables sound only after a user gesture. Browser speech uses installed local voices only; where unavailable, text remains.

A compact responsive layout and touch looking/view controls are included. Desktop is recommended for compartment exploration. The fullscreen button depends on browser/iframe permission; the app reports when permission is denied.

## What is simulated

This preview has local state, atmosphere recovery, interlocks, graph-based autonomous movement, drone health, cruise telemetry and alerts. It is **not a full orbital/rigidbody flight simulator**. The station is an exterior model, not an explorable station level. The deck selector is a preview inspection control, not a claim that a physical player can teleport through a locked door. Geometry remains in a local ship frame; stars/planet rotation and core movement are visual animation. Session state resets on reload; uploaded voice files persist in IndexedDB when the browser permits it.

## Rebuild from source

```sh
cd BrowserPreview
npm ci
npm run dev -- --port 5173  # binds 0.0.0.0; Arena preview hosts accepted
npm run build             # produces heliopause.html + its SHA-256 checksum
npm test                  # portable browser simulation rules
npm run test:browser       # offline Chromium interaction and rendering smoke test
```

Build dependencies are locked in `package-lock.json`. `node_modules`, `build`, browser binaries and screenshots are ignored. The generated **`heliopause.html` is intentionally tracked**, so the deliverable survives without dependencies or a build step. `scripts/finalize.mjs` embeds all third-party notices and creates `heliopause.html.sha256`.

The browser smoke test uses the npm-distributed Linux Chromium executable, including its NSS runtime libraries, and stores scratch files/screenshots only under the repository's ignored `Artifacts/browser`. It is a Linux test tool; other platforms can use their own Chrome/Playwright installation.

## Verification

- Seven Node simulation tests pass, including all 128 room routing configurations.
- The **built HTML** was opened from `file://` with Chromium's network set offline, not just tested through Vite.
- Smoke coverage: pilot/cruise controls; fixed sensor input; exterior interior-culling; all four compartment views; breach/interlock/repair; drone control and destruction static; intrusions/security pulse; journal; voice-file indexing/clearing; quality selector; desktop and 390px layout; dialogs.
- No external HTTP requests, JavaScript errors or shader compile errors were observed in that smoke test.
- Desktop, hull, engine, mobile and static-cut screenshots were visually inspected during development. Headless GPU emulation is **not** a hardware FPS benchmark.

The scene is rendered in real time. Render quality can vary with device/browser/GPU. There is no promise of universal pixel-perfect output or a specific frame rate.

## Asset provenance

Original art is reproducible in `src/scene.js`: tapered hull/panels, open engine bells/RCS, material microfinish, room fittings, reactor, drone forms, procedural lifeforms, station modules and solar arrays, screen labels, stars, and planetary noise/atmosphere shaders. Original UI icons/layout live in `src/main.js` and `src/style.css`. The ambient hum and confirmation sound come from the project's saved `Content/Audio` assets.

Three.js (MIT) and Barlow Condensed, IBM Plex Mono and Inter fonts (OFL) are bundled under their own licenses; full texts are in `THIRD_PARTY_NOTICES.txt` and embedded in the single HTML file. Runtime imports do not point to third-party websites.

## Vercel hosting

The repository-root `vercel.json` publishes this preview as a static website. Its build command verifies the committed HTML checksum and copies only the HTML, checksum and third-party notices into the ignored `site/` directory. It installs no dependencies and does not attempt to compile Unreal.

Vercel project settings: repository root, framework **Other**, build command `node BrowserPreview/scripts/deploy.mjs`, output **site**. `/` serves the experience; `/heliopause.html` exposes the same standalone file. Security headers allow only local/embedded assets; voice uploads remain local to the visitor's browser.
