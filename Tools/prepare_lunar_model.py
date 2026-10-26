"""Fetch a pinned mirror of NASA SVS 14959's color-map-only Moon GLB.
Keep the original for Unreal import; extract original topology for offline WebGL.
No claim of scanned topography: this is explicitly NASA's no-height-map variant.
"""
from pathlib import Path
import hashlib,json,struct,subprocess,math
ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'Content/ThirdParty/NASA';DEST.mkdir(parents=True,exist_ok=True)
SHA='12d3b0bb7fe214903f51447d1bc61710f442e92a11c703fcaca6d4e7ff8e67d4'
p=DEST/'moon_small.glb'
if not p.exists():
 cached=ROOT/'Artifacts/source-assets/nasa/moon_small.glb'
 data=cached.read_bytes() if cached.exists() else subprocess.check_output(['gh','api','-H','Accept: application/vnd.github.raw','repos/antaripdebgupta/c3-archive/git/blobs/19bf19b7860edb5e3394bb51d96d5cf127656c9f'])
 if hashlib.sha256(data).hexdigest()!=SHA:raise ValueError('Moon model integrity mismatch')
 p.write_bytes(data)
b=p.read_bytes();assert hashlib.sha256(b).hexdigest()==SHA
assert b[:4]==b'glTF' and struct.unpack_from('<I',b,4)[0]==2
l=struct.unpack_from('<I',b,12)[0];j=json.loads(b[20:20+l]);binary=b[28+l:]
def accessor(index):
 a=j['accessors'][index];v=j['bufferViews'][a['bufferView']];n={'SCALAR':1,'VEC2':2,'VEC3':3}[a['type']];fmt={5126:'f',5123:'H',5125:'I'}[a['componentType']]
 size=struct.calcsize('<'+fmt*n);stride=v.get('byteStride',size);offset=v.get('byteOffset',0)+a.get('byteOffset',0)
 return [struct.unpack_from('<'+fmt*n,binary,offset+k*stride)for k in range(a['count'])]
primitive=j['meshes'][0]['primitives'][0];positions=accessor(primitive['attributes']['POSITION']);indices=[x[0]for x in accessor(primitive['indices'])]
radius=max(math.sqrt(sum(x*x for x in p))for p in positions)
packed=struct.pack('<II',len(positions),len(indices))+b''.join(struct.pack('<3f',*(x/radius for x in p))for p in positions)+struct.pack('<'+'I'*len(indices),*indices)
asset=ROOT/'BrowserPreview/assets/models/nasa-moon.hpm';asset.parent.mkdir(parents=True,exist_ok=True);asset.write_bytes(packed)
manifest={'name':'NASA SVS Moon — color-map-only model','credit':"NASA's Goddard Space Flight Center",'source':'https://svs.gsfc.nasa.gov/14959/','originalURL':'https://svs.gsfc.nasa.gov/vis/a010000/a014900/a014959/moon_small.glb','license':'Public domain, NASA SVS usage policy; no endorsement','policy':'https://svs.gsfc.nasa.gov/help/','mirror':'https://github.com/antaripdebgupta/c3-archive/blob/aef184bb52619e2f1f20ab7e48463cd1e5efe66a/public/models/moon_small.glb','sourceSHA256':SHA,'sourceBytes':len(b),'vertices':len(positions),'triangles':len(indices)//3,'browserBytes':len(packed),'browserSHA256':hashlib.sha256(packed).hexdigest(),'modifications':['Geometry uniformly normalized to unit bounding radius; original topology retained.','Browser uses Solar System Scope lunar imagery and fictional tints on the NASA geometry.','Original GLB retained for Unreal import, with its original embedded 4096-square atlas.'],'caveat':'NASA labels this variant COLOR MAP ONLY, without topography. It is not a scanned terrain mesh. Fictional Nacre/Borealis are not scientific reconstructions.'}
(DEST/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps(manifest,indent=2))
