"""Pinned licensed planet imagery; bounded offline and optional streamed resolutions.
Run with Python + Pillow. No credentials enter the game or generated manifests.
"""
import json,subprocess,pathlib,hashlib
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parents[1]
REV='df0d575fec59b7b6a3d3cc8c402982bd17675f98'
REPO='smithcg1/DigitalSolarSystem'
OUT=ROOT/'Content/ThirdParty/PlanetMaps';OUT.mkdir(parents=True,exist_ok=True)
raw=ROOT/'Artifacts/source-assets/solar-system-scope';raw.mkdir(parents=True,exist_ok=True)
rows=[]
for name,file in [('earth','8k_earth_daymap.jpg'),('moon','8k_moon.jpg'),('mars','8k_mars.jpg'),('jupiter','8k_jupiter.jpg'),('clouds','8k_earth_clouds.jpg')]:
 target=raw/file
 if not target.exists():
  info=json.loads(subprocess.check_output(['gh','api',f'repos/{REPO}/contents/{file}?ref={REV}']))
  target.write_bytes(subprocess.check_output(['gh','api','-H','Accept: application/vnd.github.raw',f'repos/{REPO}/git/blobs/{info["sha"]}']))
 image=Image.open(target).convert('RGB')
 if image.width!=2*image.height:raise ValueError(f'Not an equirectangular map: {file} {image.size}')
 variants={}
 for tier,width,q,folder in [('offline',2048,87,ROOT/'BrowserPreview/assets/planets'),('hd',min(8192,image.width),92,ROOT/'BrowserPreview/public/hd/planets')]:
  folder.mkdir(parents=True,exist_ok=True);dest=folder/(name+'.webp');image.resize((width,width//2),Image.Resampling.LANCZOS).save(dest,quality=q,method=6);data=dest.read_bytes();variants[tier]={'path':str(dest.relative_to(ROOT)),'width':width,'height':width//2,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
 rows.append({'id':name,'author':'Solar System Scope','license':'CC-BY-4.0','source':'https://www.solarsystemscope.com/textures/','mirror':f'https://github.com/{REPO}/blob/{REV}/{file}','originalDimensions':list(image.size),'originalSha256':hashlib.sha256(target.read_bytes()).hexdigest(),'variants':variants})
 print(name,image.size,variants['offline']['bytes'],variants['hd']['bytes'])
(OUT/'manifest.json').write_text(json.dumps({'assets':rows,'modifications':'JPEG to WebP; offline images downsampled to 2048 pixels. HD images retain native dimensions. No upscaling.'},indent=2)+'\n')
manifest={r['id']:{'url':'/hd/planets/'+r['id']+'.webp',**{k:v for k,v in r['variants']['hd'].items()if k!='path'}}for r in rows}
(ROOT/'BrowserPreview/v4/planet-assets.json').write_text(json.dumps(manifest,indent=2)+'\n')
