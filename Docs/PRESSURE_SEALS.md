# Pressure seals, room access, and interior consistency

## Defects addressed

- **Unenclosed core-to-pod joins:** the core wall is at |x| = 3.7 m and the room wall starts at |x| = 4.2 m. The former floor-only bridge left an exposed overhead/side gap. `interior-geometry.js` now defines an overlapping four-sided pressure collar from 3.64–4.28 m, with a 1.4 m wide, 2.1 m high passage.
- **Door/header gaps:** side-room and aft-room headers now meet the door seat. Moving leaves overlap the seats at the sides, head and deck instead of leaving a visible slit. Annexes have complete inner pressure walls. Their door assemblies are hidden while their parent room is compacted, rather than floating outside the ship.
- **Aft door usability:** the door face can be used from either side, as well as the handprint pads. No pinpoint pad aiming is required. The doors still scan, animate, close automatically, and obey fault and airlock interlocks. Collision passages reference the actual door index rather than inferring it from the room count.
- **Observation-window gaps:** the pressure panes now overlap the complete window aperture, including the lower and upper edges. The widened storage bulkhead also has shoulders/deckhead closure against the narrower quarters.
- **Washed-out materials:** twelve extra windows had raised the accumulated daylight factor from 1 to 3.4. Daylight is now a normalized aperture-weighted fraction in [0, 1], including when shades animate.

## Consistent visual kit

The original cabin, aft rooms and deployable rooms share graphite decking, blue-grey pressure panels, brushed trim and teal door leaves. Side rooms retain their functional furnishings and restrained room-color accents. All eight use the same wall skirting, panel ribs, light recesses, labelled frames and handprint indicators. Deck panels have broad, low-contrast seams instead of the previous dense diamond/grid pattern. Storage cases have protective hardware, recessed grips and cargo identification.

The existing licensed HD assets, embedded fallback models, recordings, saves and touch-resolution settings are retained. This is not an assertion that every asset has been replaced with an AAA production model. The nine model pairs have a reproducible structural audit, including decoded normals, finite attributes, index bounds, UVs, texture dimensions and manifest hashes. glTF's valid default-material primitives are counted explicitly in the report rather than mislabeled as missing files.

## Access routes

| Ship section | Connected destinations |
|---|---|
| Cockpit → corridor → quarters | Original forward rooms |
| Storage | Kitchen (port), living room (starboard) |
| Engineering | Bathroom (port), gym (starboard) |
| Bathroom | Fabrication workshop |
| Gym | Medical / recovery |
| Science lab | Pool (port), garden/dining (starboard) |
| Science lab → stern airlock | Exterior hatch; existing landing/docking and pressure interlocks retained |

A stopped ship is still required to deploy modules. Annexes deploy after their parent rooms; they compact before their parent rooms. Occupied-room protection, GPU unloading and save restoration remain in place. A fault-locked door is repaired using **Tablet → SYSTEMS → REPAIR**, not bypassed.

## Design reference and licensing

Subnautica's modular-room connections and compartmentalizing bulkheads informed the emphasis on visibly enclosed transitions and legible access routes. References: [1](https://subnautica.fandom.com/wiki/Multipurpose_Room_(Subnautica)), [3](https://subnautica.fandom.com/wiki/Bulkhead_(Subnautica)). No Subnautica meshes, textures, UI, audio or extracted game files were imported. HELIOPAUSE geometry and its existing licensed asset provenance are retained.

## Reproduce

```sh
npm ci --prefix BrowserPreview
npm --prefix BrowserPreview test
npm --prefix BrowserPreview run build
npm --prefix BrowserPreview run test:pressure-browser
npm --prefix BrowserPreview run test:annex-browser
npm --prefix BrowserPreview run test:mobile-browser
cd BrowserPreview
node scripts/audit-models.mjs
npx vite build --mode capture --outDir ../Artifacts/browser/capture-build
HP_CAPTURE=1 npm run test:pressure-browser
node scripts/capture-game-previews.mjs
```

The new pressure browser test walks the connected route with normal keyboard input and door interactions—no player-position fixtures—and returns through the doors and annexes. It also checks compaction and an actual repair-interlock cycle. Capture mode raises only the software raster cap. Screenshots are real browser output, not concept art.

The Unreal source receives matching header/leaf overlap, habitat roof closure, core collar and palette corrections. **UE 5.8 is not installed here:** UHT, compilation, cooking and native runtime geometry are not validated. Portable C++ rule tests do not establish Unreal runtime parity. Physical iPad/Safari testing and a full-game visual/performance audit remain outside the available evidence.
