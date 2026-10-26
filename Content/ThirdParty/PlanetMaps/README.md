# Planet surface maps — Solar System Scope

**Author:** Solar System Scope. **License:** [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Original source and license statement: https://www.solarsystemscope.com/textures/.

The source maps use NASA imagery/elevation with authored color adjustments and, in unmapped areas, fictional fill. They are not measured maps of the fictional exoplanets in this game. Credit does not imply NASA or the asset author endorses this game.

`manifest.json` records original SHA-256, pinned GitHub mirror, real image dimensions, derived-file hashes, and modifications. Sources were downloaded at their native 8K dimensions (Jupiter's file is actually 4K, despite its upstream filename). No image is upscaled. Offline 2K WebP maps are embedded in the HTML. Native-resolution WebP maps are in `BrowserPreview/public/hd/planets/` for optional same-origin streaming and Unreal import. All copies and adaptations retain this attribution and the embedded in-game credits.

These are **surface maps**, not fetched GLB geometry. The game supplies the globe mesh; calling these scanned planet meshes would be incorrect. NASA STL relief samples inspected during research are flat bas-relief prints, not globe models, and are not used as substitute planets.

Rebuild: `python Tools/prepare_planet_assets.py` (requires Pillow and authenticated GitHub CLI for source retrieval). Source downloads remain in ignored `Artifacts/source-assets/`; committed derivatives are reproducible from pinned source hashes.
