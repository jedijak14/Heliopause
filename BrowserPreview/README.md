# HELIOPAUSE — supplied-v4 browser game, v0.7.0

Open `heliopause.html` directly in a WebGL2 browser. It embeds the ship, 20 recordings, licensed models and 2K planet maps. No server/account is required. HTTPS hosting may optionally download hash-verified HD maps; AUDIO → USE OFFLINE ONLY disables that traffic. This is HTML/WebGL, not Unreal Pixel Streaming.

See the repository [README](../README.md) for controls and [validation](../Docs/VALIDATION.md) for executed checks and limitations.

- Full manual 6DOF; autopilot only on explicit command, canceled by manual input.
- Ship-controlled descent uses sector position, velocity and quaternion through terrain contact. SURFACE does not teleport or start a terminal descent. Level and brake below 12 m/s; isolate/open the stern airlock to disembark.
- HABITAT deploys six side rooms only while stopped. Doors lock during transitions; compacted geometry unloads; occupied modules cannot compact; expanded modules block flight.
- V cycles sensors and third-person orbit camera. Mouse drag or wheel adjusts orbit view.
- Whole-globe procedural surface exploration, skimmer, specimens, physical ship pickup/reboarding and saves. Planet maps are visual reference imagery, not terrain elevation data.
- Source model/map provenance and reproduction scripts are under `Content/ThirdParty` and `Tools`. Nacre/Borealis use a fetched NASA Moon mesh. Interiors and crowds are still stylized—not a completed photorealistic art pass.

`v4/Heliopause-v4.original.html` preserves the supplied original unchanged. `src/main.js`/`scene.js` are historical, not the active renderer. `v4/main.js` is the active game. Native source targets UE 5.8 but is not compiled/verified.
