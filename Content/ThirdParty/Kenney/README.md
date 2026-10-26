# Kenney — CC0 model selection

Author: **Kenney**, https://kenney.nl. License: **CC0 1.0 Universal** (public-domain dedication), https://creativecommons.org/publicdomain/zero/1.0/.

Original packs: [Furniture Kit](https://kenney.nl/assets/furniture-kit), [Space Station Kit](https://kenney.nl/assets/space-station-kit), [Space Kit](https://kenney.nl/assets/space-kit).

Downloaded from the public [shorepine/kenney redistribution](https://github.com/shorepine/kenney), pinned at `3694c6879e487c108f55677be7dd2ca75b07cc3b`. `manifest.json` records every source file, byte length and SHA-256. These are original GLBs, not generated substitute geometry. They can be imported into Unreal Editor; they are not cooked Unreal assets.

`Tools/fetch_kenney.py` retrieves this exact selection using GitHub CLI. `Tools/convert_kenney.py` (Python + Pillow) bakes node transforms and palette colors into `BrowserPreview/v4/models.json`. The browser bundles that file into the standalone HTML with no runtime downloads. Glass transparency is retained; texture palette colors are baked per triangle. All models retain their original geometry.
