"""Fetch a small, pinned CC0 model selection from the Kenney redistribution."""
import subprocess,json,pathlib,base64,hashlib
ROOT=pathlib.Path(__file__).resolve().parents[1]/'Content/ThirdParty/Kenney'
REV='3694c6879e487c108f55677be7dd2ca75b07cc3b'
PACKS={
'furniture':'kitchenStove kitchenSink kitchenFridgeLarge kitchenCabinetDrawer kitchenCabinetUpper kitchenCoffeeMachine loungeSofaLong loungeChairRelax tableCoffee televisionModern pottedPlant books shower toilet bathroomSink bathroomMirror bathroomCabinet bathtub tableRound chairCushion lampRoundFloor',
'space-station':'wall-detail wall-window-banner structure table-display-planet computer-wide chair-armrest-headrest container-tall floor-detail pipe-ring-colored',
'space':'hangar_largeA corridor_window corridor_cross satelliteDish_detailed craft_cargoA machine_generatorLarge supports_high'}
def fetch(path):
 p=ROOT/path;p.parent.mkdir(parents=True,exist_ok=True)
 if not p.exists():
  obj=json.loads(subprocess.check_output(['gh','api',f'repos/shorepine/kenney/contents/3d/{path}?ref={REV}']))
  p.write_bytes(base64.b64decode(obj['content']))
 return {'path':path,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size}
assets=[]
for kit,names in PACKS.items():
 for name in names.split():assets.append(fetch(f'{kit}/{name}.glb'))
assets.append(fetch('space-station/Textures/colormap.png'))
(ROOT/'manifest.json').write_text(json.dumps({'author':'Kenney','license':'CC0-1.0','mirror':'https://github.com/shorepine/kenney','revision':REV,'originals':['https://kenney.nl/assets/furniture-kit','https://kenney.nl/assets/space-station-kit','https://kenney.nl/assets/space-kit'],'assets':assets},indent=2)+'\n')
print(len(assets),'files',sum(x['bytes']for x in assets),'bytes')
