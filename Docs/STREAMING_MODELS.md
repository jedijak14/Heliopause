# v0.8 streaming / Earth departure update

## Implemented in the standalone browser

- An Earth-side Pacific departure terminal opens the story with Commander Rowan Hale and a second officer visibly present. These are licensed Microsoft Rocketbox skinned human models, not capsule people. The corresponding male/female Rocketbox breathing takes animate their skeletons. Blink and approximate speaking expressions use facial shapes. New Earth dialogue uses the existing local speech/subtitle fallback; the recorded arrival dialogue and all existing uploaded/embedded recordings remain intact.
- Space skips the opening and subsequent scenes. The bottom skip button is removed.
- A Three.js PBR pass shares the supplied game's WebGL2 context, camera matrices and depth buffer. It renders the glTF humans and licensed NASA/Khronos assets alongside—not in place of—the existing game. Twelve station crew now use these human rigs.
- Nine model identities have self-contained offline GLBs and hash-pinned, on-demand HD versions: commander, officer, ISS, Shuttle, NASA habitat parts 1/2, sofa, chair and refrigerator. The full ISS uses NASA's IGOAL model; the embedded fallback uses NASA's smaller ISS B. The authored Longhaul remains the player ship; this is not a replacement of every spacecraft with a NASA vehicle.
- The living room, galley and dining room use web-sourced PBR furnishings. Their instances unload when the corresponding room compacts; existing collision/interlock rules remain. Existing Kenney CC0 furnishings remain elsewhere.
- Sixteen additional cataloged exoplanets across five systems expand navigation from 17 to 33 destinations. Seven ocean visualizations are explicitly hypothetical. No resolved exoplanet surface maps or confirmed oceans are claimed. The complete selected OEC snapshot fields, aliases, uncertainties, original update dates and source descriptions are accessible in Navigation. The cockpit science screen rotates through them. This is **all fields in the selected snapshot**, not every published measurement of every planet.
- Warp charges, follows a collision-checked curved corridor, accelerates/decelerates smoothly, and exits outside the destination exclusion zone. Manual input/B requests a controlled field exit. Charging automatically aligns the ship with the corridor. Stars and planets remain rendered at their changing positions rather than being replaced by a loading screen. Chart distances, star radii and FTL travel are fictional compressed game coordinates, not astrophysical distances.
- Fifteen window controls (twelve new observation windows) operate external nano-laminate shutters. Close All or thermal protection wraps the hull, radiators, fairings and deployed habitat envelopes with a progressive surface effect. No visible flying nanobot props are used. Airlock opening is interlocked while the full wrap remains deployed.

## Streaming, memory and offline behavior

`model-assets.json` and `catalog-assets.json` pin exact SHA-256 and byte lengths. Downloads are same-origin HTTPS only, reject redirects and excess bytes, and support cancellation, a 180-second large-model deadline and failure backoff. At most two downloads run concurrently per asset service. The shared IndexedDB cache is LRU-bounded to 2 GiB and evicts from small metadata records without reading every cached binary into memory. Storage denial does not prevent offline play.

The standalone HTML contains all nine offline models, Draco WASM, Meshopt decoder, maps and recordings. No CDN fetch is needed to open it locally. High-LOD human geometry, skin and more than 100 facial targets per primitive remain in the model files. The renderer uploads only five facial shapes currently used for expressions; duplicate/unused data are pruned and geometry is quantized/compressed by glTF Transform/Meshopt. Offline maps are 512px; HD maps retain source dimensions.

**Memory matters even on high-end machines:** the HD ISS alone contains 220 images, approximately 2.04 GiB decoded before GPU mipmaps. Native-resolution hardware rendering therefore needs substantial free RAM/VRAM (plan for an 8 GiB-class GPU and ample system RAM). Software WebGL (SwiftShader/llvmpipe) is detected and decodes model images two at a time at 512px and caps raster scale at 0.25, while keeping the streamed model geometry. Software tests do not validate native-resolution GPU performance. The content library is not restricted to this initial pack or a 1 GB total; the limits above govern concurrent working memory/cache, not the available library.

## Rebuild the model library

```sh
python3 -m venv .venv
.venv/bin/pip install Pillow
npm --prefix BrowserPreview ci
.venv/bin/python Tools/fetch_streaming_models.py
node BrowserPreview/scripts/convert-rocketbox.mjs
.venv/bin/python Tools/pack_streaming_glb.py
node BrowserPreview/scripts/compress-models.mjs
python3 Tools/fetch_exoplanet_catalog.py
python3 Tools/generate_sector.py
python3 Tools/generate_science.py
npm --prefix BrowserPreview run build
```

Requires configured `gh` access to public GitHub repositories. Source FBX/TGA/archive data stay in ignored `Artifacts/source-assets/streaming`; the pinned manifest verifies Git blob hashes, sizes and SHA-256. The compressor updates the runtime manifest after packing. Selective repacking accepts model IDs as arguments. Do not publish an intermediate pack before its final hashes are refreshed.

Source identities/licenses: `Content/ThirdParty/Streaming/sources.json`, copied source READMEs and `BrowserPreview/THIRD_PARTY_NOTICES.txt`. Microsoft Rocketbox is MIT; NASA media usage conditions apply; furniture is individually CC0 or CC BY 4.0, not assumed to inherit Khronos' code license. The OEC database license is reproduced. Sponza was excluded because its source license was not appropriate for this pack.

## Unreal 5.8: actual status, not a parity claim

The supplied Core remains the native implementation. This update extends the shared native destination catalog to 33, generates the scientific fields and terrain profiles, and widens native discovery storage to 64 bits. Save version 3 retains/migrates version 1/2 fields. The native HUD exposes catalog evidence/fiction fields. Portable C++ tests cover the enlarged discovery mask and shared terrain/flight rules.

`node BrowserPreview/scripts/prepare-unreal-models.mjs` creates decoded, PNG-textured glTF import sources in ignored `Content/ThirdParty/Streaming/Unreal`. This removes browser-specific Draco/Meshopt/WebP dependencies before `Tools/import_unreal_assets.py` runs **inside Unreal Editor**. Commander and sofa preparation were exercised locally; Unreal Interchange import itself was not.

**Not completed or validated:** native Earth staging/crew placement, native premium model scene assembly, equivalent native warp visuals and full-ship nano-laminate rendering. No Unreal 5.8 UHT/UBT build, import, cook, packaged executable or runtime test was possible here. The source preview is not 100% browser/native parity and must not be represented as such.

Post-release continuation: native warp motion/control integration and portable parity checks are now present on this branch; see `NATIVE_WARP.md`. Engine compilation, presentation and save integration still need validation.
