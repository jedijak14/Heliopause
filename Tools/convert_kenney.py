"""Bake the selected CC0 glTF scene transforms/palette into offline triangle batches.
Requires Pillow (texture palette decoding only). Original GLBs remain importable in UE.
"""
import json,struct,pathlib,math,io
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parents[1]
ID=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]
def mul(a,b):return [sum(a[k*4+j]*b[i*4+k]for k in range(4))for i in range(4)for j in range(4)]
def matrix(n):
 if 'matrix'in n:return n['matrix']
 x,y,z,w=n.get('rotation',[0,0,0,1]);s=n.get('scale',[1,1,1]);t=n.get('translation',[0,0,0])
 a=[1-2*y*y-2*z*z,2*x*y+2*w*z,2*x*z-2*w*y,0,2*x*y-2*w*z,1-2*x*x-2*z*z,2*y*z+2*w*x,0,2*x*z+2*w*y,2*y*z-2*w*x,1-2*x*x-2*y*y,0,*t,1]
 for k in range(3):
  for j in range(3):a[k*4+j]*=s[k]
 return a
def point(m,v,n=False):
 # All selected models use orthogonal TRS. Inverse transpose for normals.
 a=[sum(m[k*4+j]*v[k]/(sum(m[k*4+l]**2 for l in range(3))if n else 1)for k in range(3))+(0 if n else m[12+j])for j in range(3)]
 if n:
  d=math.hypot(*a)or 1;a=[x/d for x in a]
 return [round(x,5)for x in a]
models={}
for path in sorted((ROOT/'Content/ThirdParty/Kenney').glob('*/*.glb')):
 raw=path.read_bytes();size=struct.unpack_from('<I',raw,12)[0];g=json.loads(raw[20:20+size]);buf=raw[28+size:];groups={}
 def acc(i):
  a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];c={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']];fmt={5126:'f',5123:'H',5125:'I',5121:'B'}[a['componentType']];s=struct.calcsize(fmt)*c;off=v.get('byteOffset',0)+a.get('byteOffset',0);return [struct.unpack_from('<'+fmt*c,buf,off+k*v.get('byteStride',s))for k in range(a['count'])]
 images=[]
 for image in g.get('images',[]):
  if 'uri'in image:data=(path.parent/image['uri']).read_bytes()
  else:v=g['bufferViews'][image['bufferView']];data=buf[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']]
  images.append(Image.open(io.BytesIO(data)).convert('RGB'))
 def node(i,parent):
  n=g['nodes'][i];m=mul(parent,matrix(n))
  if 'mesh'in n:
   for p in g['meshes'][n['mesh']]['primitives']:
    at=p['attributes'];ps=acc(at['POSITION']);ns=acc(at['NORMAL']);uv=acc(at['TEXCOORD_0'])if 'TEXCOORD_0'in at else[(0,0)]*len(ps);indices=[x[0]for x in acc(p['indices'])]if 'indices'in p else list(range(len(ps)));mat=g.get('materials',[{}])[p.get('material',0)];pbr=mat.get('pbrMetallicRoughness',{});color=pbr.get('baseColorFactor',[1,1,1,1]);image=None
    if 'baseColorTexture'in pbr:image=images[g['textures'][pbr['baseColorTexture']['index']]['source']]
    for a in range(0,len(indices),3):
     ix=indices[a:a+3];col=color[:3]
     if image:
      u,v=[sum(uv[k][j]for k in ix)/3 for j in range(2)];px=image.getpixel((min(image.width-1,max(0,int(u*image.width))),min(image.height-1,max(0,int(v*image.height)))));col=[round((x/255)**2.2,5)for x in px]
     key=tuple(round(x,4)for x in col)+(round(color[3],2),);dest=groups.setdefault(key,[])
     for k in ix:dest.extend(point(m,ps[k])+point(m,ns[k],True))
  for c in n.get('children',[]):node(c,m)
 for n in g['scenes'][g.get('scene',0)]['nodes']:node(n,ID)
 parts=[{'color':list(k[:3]),'alpha':k[3],'vertices':v}for k,v in groups.items()];xyz=[v[j:j+3]for v in groups.values()for j in range(0,len(v),6)];bounds=[[min(p[j]for p in xyz)for j in range(3)],[max(p[j]for p in xyz)for j in range(3)]];models[path.parent.name+'/'+path.stem]={'bounds':bounds,'parts':parts}
out=ROOT/'BrowserPreview/v4/models.json';out.write_text(json.dumps(models,separators=(',',':'))+'\n');print(len(models),'models',out.stat().st_size,'bytes')
for k in ['furniture/shower','furniture/kitchenStove','space-station/wall-detail','space/hangar_largeA']:print(k,models[k]['bounds'])
