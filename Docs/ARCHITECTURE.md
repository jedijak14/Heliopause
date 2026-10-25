# Architecture and phase mapping

## Coordinate contract

All structural data uses Unreal centimeters, +X forward, +Y starboard, +Z up. The ship frame is stationary in this preview. Compartment centers are `(0,0,100)`, `(-1200,0,100)`, `(-2400,0,100)`, `(-3600,0,100)`; each interior is 1200 × 1400 × 400 cm. Bridge pilot eye: `(370,0,168)`. Seat activation is proximity-gated.

Camera transforms live in `AHelioWorld::SeatTransform/SensorTransform`. Port `(-500,-940,260)` and starboard `(-500,940,260)` look outward/back along the hull; front `(810,0,210)` looks forward. Sensor mouse look is disabled. A `0.45 s` smoothstep position / quaternion blend connects views. The physical walking body remains at its saved position while remote viewing, so environmental damage still applies. No spring arm or orbital/chase camera exists.

## Runtime ownership

- **HelioGameMode**: creates the procedural world and selects native pawn/HUD classes.
- **HelioWorld**: ship/room meshes and simple colliders, hull sockets, station, interlocks, hazards and local agents.
- **HelioPawn**: walking, seat/remote view transitions, flashlight, tools, remote drone input and static cut.
- **HelioHUD**: Canvas menu/tablet, clickable hitboxes, cockpit overlay, alerts and subtitles. This is a desktop prototype, not a mobile/scalable UMG design.
- **HelioAudioSubsystem**: local WAV index, user precedence, bounded queue and Windows SAPI fallback.
- **SimulationCore.h**: engine-independent pressure/heat rules, interlock policy, bounded graph routing, drone lifecycle and WAV parser.

All runtime entities are local. There are no network requests or remote identity services.

## Structural meshes

The hull is a five-ring eight-sided tapered skin, with separate batched panel/color layers. Engine and RCS bells use three 16-segment open rings with explicit orientation. Repeated struts, strips and cargo crates are batched by group. Shared color material instances avoid one material instance per panel; the animated core has its own instance. Simple box collision is separate from graphics, avoiding synchronous procedural collision cooking.

Interior room roots are render-hidden in hull sensor mode. Otherwise a conservative bounding-sphere / diagonal-view-cone test skips room roots; Unreal's normal primitive frustum culling handles exact clipping. Doors retain collision even when invisible. This is not portal occlusion, World Partition, Nanite, HLOD, or a measured replacement for the engine culler.

## Atmosphere and interlocks

Each room independently tracks pressure, temperature, breach and thermal venting. Unsafe states lock adjacent bulkheads; emergency mode locks all internal doors. Cruise closes/locks the cargo airlock. Repair removes the fault but pressure and temperature recover gradually. There is no fluid exchange through doors, airflow, or detailed thermodynamics in this preview.

SYSTEMS exposes explicit hazard-injection/repair controls for testing. Door hitboxes and nearby `E` interaction call the same policy, so the UI cannot override locks. A future build should add player-overlap protection before automatic door closure.

## Agents

The compartment graph is a four-node linear topology. BFS excludes locked edges; drones center themselves on apertures and sweep against collision when moving. This is not full NavMesh A* and does not solve arbitrary within-room obstacle layouts. Unlocked doors can be opened by local AI. Maintenance drones repair their current unsafe room. Security drones patrol and neutralize nearby intruders. A dead controlled drone triggers a two-second static overlay and returns to the physical body or cockpit.

At most four passive intruders can exist; cruise schedules boarding checks 90–180 seconds apart. Bridge lights and HUD life-sign counts change. A station crowd uses 20 pedestrians × six body-part instances in a single ISM component, updated at 10 Hz. These are low-poly silhouettes, not imported sprites or character rigs.

## Audio

Native search order: bundled `Content/Audio` first; `Saved/Voice` last. Lowercase basename is the event key. Recursive scan happens only at initialization or explicit rescan, not per frame. WAV decode is limited to 16 MiB per event and validates RIFF chunk lengths, PCM format, sample rate, channels and block alignment. Malformed/unsupported assets fall back rather than being executed or decoded as arbitrary formats.

Speech has an eight-entry deduplicated pending queue, uses asynchronous Windows SAPI calls, and maintains captions. One event and one ambient stream can be active. Linux does not silently substitute a cloud service. The browser utility has its own bounded queue, local-file-first lookup, local-only system speech selection, revocable Blob URLs and IndexedDB persistence. It is not connected to the Unreal event bus.
