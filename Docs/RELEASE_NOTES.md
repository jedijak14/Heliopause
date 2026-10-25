# HELIOPAUSE v0.1.0 — Unreal source preview

A new native C++ project built from the supplied incomplete WebGL design and four-phase feature brief.

## Included

- `Heliopause.uproject`, game/editor targets, input/render/packaging config.
- Procedural SV-7 hull, engine bells, RCS nozzles, four compartments and station.
- Pilot-seat camera blend, three hard-mounted hull feeds and Canvas bridge tablet.
- Room atmosphere faults and bulkhead interlocks.
- Three local drones, compartment routing, static-cut destruction, intrusions and lightweight crowds.
- Original bundled WAV assets, native offline WAV index and Windows local speech fallback.
- Offline browser MP3/WAV/OGG upload and local-only `speechSynthesis` utility.
- Portable tests, asset manifest, Unreal automation test source and validation checklist.

## Download

Extract **Heliopause-v0.1.0-source-preview.zip** and keep all folders beside `Heliopause.uproject`. The archive contains source and project assets, not a playable executable. `SOURCE-MANIFEST.json` identifies the revision and every file hash; the adjacent SHA256 file verifies the archive.

## Important limitations

**Source prerelease — no Unreal build included.** The descriptor targets UE 5.8, but engine compatibility, compilation, cooking, gameplay rendering and performance have not been verified. There was no Unreal installation in the authoring environment. Flight is a stationary ship-frame systems simulation rather than physical/orbital flight. The incomplete browser shader stack was not ported.

Native audio overrides accept PCM16 WAV; native MP3 is not implemented. Browser uploading/system voices are a separate companion utility. Native Linux fallback is subtitles. Engine built-ins are provided by your own licensed installation.

## Tests run

Four Python structure/asset tests, six Node voice tests, three asset hash checks, and portable C++ assertions with ASan/UBSan passed, including 128 routing configurations and 10,000 malformed WAV buffers. These checks do **not** replace an Unreal build or runtime QA.

See `Docs/BUILD.md` and `Docs/VALIDATION.md` for the remaining release gates.
