"""Repack GLB image bufferViews. HD preserves texture dimensions and geometry.
Only offline derivatives downsample; materials, rigs, and Draco are retained.
"""
import json,struct,io,hashlib
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
def pack(source,destination,edge=None):
 b=source.read_bytes();length=struct.unpack_from('<I',b,12)[0];j=json.loads(b[20:20+length]);binary=b[28+length:];views=j.get('bufferViews',[]);image_views={im['bufferView']:im for im in j.get('images',[])if 'bufferView' in im};data=bytearray()
 for i,v in enumerate(views):
  raw=binary[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']]
  if i in image_views:
   image=Image.open(io.BytesIO(raw));image.load()
   if edge:image.thumbnail((edge,edge),Image.Resampling.LANCZOS)
   out=io.BytesIO();image.save(out,format='WEBP',quality=96 if not edge else 85,method=6);raw=out.getvalue();image_views[i]['mimeType']='image/webp'
  while len(data)%4:data.append(0)
  v['byteOffset']=len(data);v['byteLength']=len(raw);data+=raw
 # WebP uses EXT_texture_webp, not a nonstandard core image mime.
 for texture in j.get('textures',[]):
  if 'source' in texture:
   texture.setdefault('extensions',{})['EXT_texture_webp']={'source':texture.pop('source')}
 for key in ['extensionsUsed','extensionsRequired']:j[key]=list(dict.fromkeys(j.get(key,[])+['EXT_texture_webp']))
 j['buffers']=[{'byteLength':len(data)}];doc=json.dumps(j,separators=(',',':')).encode();doc+=b' '*((-len(doc))%4);data+=b'\0'*((-len(data))%4)
 blob=struct.pack('<III',0x46546c67,2,28+len(doc)+len(data))+struct.pack('<II',len(doc),0x4e4f534a)+doc+struct.pack('<II',len(data),0x004e4942)+data
 destination.parent.mkdir(parents=True,exist_ok=True);destination.write_bytes(blob);return {'bytes':len(blob),'sha256':hashlib.sha256(blob).hexdigest()}
if __name__=='__main__':
 import sys
 catalog=json.loads((ROOT/'BrowserPreview/v4/model-assets.json').read_text()) if len(sys.argv)>1 else {};source=ROOT/'Artifacts/source-assets/streaming'
 for ID in ['iss','shuttle','habitat','habitat-interior','sofa','chair','fridge','commander','officer']:
  if len(sys.argv)>1 and ID not in sys.argv[1:]:continue
  p=source/(ID+'.glb')
  if not p.exists():continue
  target=ROOT/'BrowserPreview/public/hd/models'/p.name;entry=pack(p,target);entry['url']='/hd/models/'+p.name;entry['type']='glb';entry['offline']=ID+'.glb'
  # ISS offline uses a NASA lower-detail original rather than decoding the large station on cold boot.
  low=source/'iss-offline.glb' if ID=='iss' and (source/'iss-offline.glb').exists() else p
  pack(low,ROOT/'BrowserPreview/assets/models/offline'/p.name,512)
  catalog[ID]=entry;print(ID,entry['bytes'],flush=True)
 (ROOT/'BrowserPreview/v4/model-assets.json').write_text(json.dumps(catalog,indent=2)+'\n')
