# Asset provenance and inventory

No third-party models, textures, sound packs, voice recordings, fonts or shader libraries were downloaded.

| Asset | Persisted source | Runtime form |
|---|---|---|
| Faceted ship hull / panel layers | `HelioWorld.cpp`, BuildHull | Procedural mesh sections |
| Open engine bells / RCS nozzles | `HelioWorld.cpp`, Bell | 16-segment generated rings |
| Rooms, consoles, bunks, crates, power core | `HelioWorld.cpp`, BuildInterior | Procedural mesh + box collision |
| Drones / intruders | `HelioWorld.cpp` | Low-poly procedural bodies |
| Station crowd | `HelioWorld.cpp`, BuildStation/StepAI | Engine cube instancing, six parts/person |
| Star field | `HelioWorld.cpp`, BuildHull | One generated field mesh |
| Interface / static-cut effect | `HelioHUD.cpp` | Unreal Canvas draws |
| Browser interface | `BrowserVoice/*` | Local HTML/CSS/JS |
| `ambient_hum.wav` | `Content/Audio`, `Tools/generate_audio.py` | Original 8 s mono 22050 Hz PCM16 |
| `alarm_tone.wav` | same | Original 1 s two-tone PCM16 |
| `ui_confirm.wav` | same | Original 0.24 s confirmation PCM16 |

The hum is replayed natively. The other two tones are saved utility assets in the voice index, not recorded dialogue; you can rename/copy them to event keys for testing. No synthetic or recorded voice was represented as a real actor performance.

`Content/asset-manifest.json` records SHA-256 hashes of all custom binary audio assets. Recreate them with `python3 Tools/generate_audio.py`; check with `python3 Tools/asset_manifest.py --check`. The release ZIP additionally contains a hash of every included tracked file.

Unreal built-ins (`/Engine/BasicShapes/Cube`, `BasicShapeMaterial`, default font and Entry map) and the ProceduralMeshComponent plugin are licensed engine dependencies. They are not missing project assets or redistributed engine binaries. Their runtime resolution still requires a real cook/package verification.

User-supplied `Saved/Voice/` files are intentionally ignored by Git and excluded from release archives. Original project assets are included; private user recordings are not silently published.
