# Mobile / iPad controls — priority update

This update targets the **browser game**. It does not implement native Unreal mobile packaging.

## Before starting Story

The start menu includes persisted, device-local settings, separate from voyage saves:

- **3D resolution:** 20%, 35%, 40%, 55%, 75% or 100%. Touch devices default to 55%; desktop defaults to 100%. Only WebGL resolution changes; UI text and SVG icons stay sharp.
- **On-screen controls:** automatic, always on, or keyboard/mouse. Detection uses touch capabilities, not a phone-width cutoff, so landscape iPads and desktop-mode tablets are included.
- **Look sensitivity:** adjustable from 0.4 to 1.6.

Touch devices cap rendering DPR at 1, model textures at 512 pixels and opening-scene shadow maps at 1024 pixels. They retain actual geometry and rigs. Lower resolution reduces GPU workload; it is not a guarantee of a particular frame rate. The existing software-renderer cap still applies in headless tests. In-game AUDIO & DISPLAY resolution controls update the saved preference too.

## Controls

Project-authored inline SVG pictograms have visible labels and accessible names; no external icon fonts, emoji or placeholder letters.

- Left pad: walk/strafe on foot; forward/reverse thrust and yaw in the pilot seat.
- Right pad in flight: pitch, roll, vertical thrust, lateral thrust and brake.
- Right pad on foot: hold Run/Crouch; toggle flashlight and camera.
- Bottom actions: tablet, pilot seat and interaction. The tablet action becomes Close while the tablet is open.
- Camera toggles between interior and orbit; drag to look/orbit and pinch to zoom in orbit. Other cameras remain available through the tablet.
- Surface actions have sample, skimmer, pickup and reboard pictograms.
- A touch-only **top** skip button handles opening and later cutscenes. Space still works; no bottom skip button was added.

Multiple pointers can hold thrust and pitch while another finger looks. Cancellation, loss of pointer capture, focus loss, resize and UI/mode changes release held touch inputs. Production movement, flight permissions, autopilot cancellation, docking clamps and habitat locks remain authoritative.

## Validation

- Mobile-only baseline build: 65 Node tests passed (62 existing plus 3 display/icon tests).
- Chromium touch emulation passed at 1024×768, 820×1180, 390×844 and 844×390; a desktop context was checked too.
- Browser assertions cover pre-story changes and persistence, actual raster dimensions, SVG/accessible labels, targets ≥44 CSS pixels, on-screen bounds, simultaneous thrust/pitch/look, autopilot cancellation, braking, pointer cancellation, tablet/input release, pinch zoom and top cutscene skipping.
- Actual renderer screenshots: [`../Previews/Mobile/`](../Previews/Mobile/).
- No page or WebGL errors in the mobile test.

**Not tested on physical iPads/iPhones or Safari/WebKit.** Software-renderer screenshots are not hardware benchmarks. Device memory, thermal throttling and browser-specific behavior still need real-device verification.

```sh
npm ci --prefix BrowserPreview
npm --prefix BrowserPreview test
npm --prefix BrowserPreview run build
npm --prefix BrowserPreview run test:mobile-browser
```
