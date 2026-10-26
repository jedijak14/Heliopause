"""Convert committed HD WebP originals losslessly to editor-import PNGs.
Requires Pillow. Generated PNGs are ignored; the compact WebPs are the source of truth.
"""
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1];out=root/'Content/ThirdParty/PlanetMaps/Unreal';out.mkdir(exist_ok=True)
for p in (root/'BrowserPreview/public/hd/planets').glob('*.webp'):
 Image.open(p).save(out/(p.stem+'.png'));print(p.stem)
