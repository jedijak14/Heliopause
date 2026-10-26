"""Fetch pinned, licensed model sources. Large originals stay in ignored Artifacts.
Production derivatives are built separately; never silently truncate a source.
"""
import json,subprocess,hashlib,concurrent.futures
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];STAGE=ROOT/'Artifacts/source-assets/streaming';STAGE.mkdir(parents=True,exist_ok=True)
COMMITS={'microsoft/Microsoft-Rocketbox':'0943055db6ec570bcef9f2c8b41c9e5467c808f9','nasa/NASA-3D-Resources':'11ebb4ee043715aefbba6aeec8a61746fad67fa7','KhronosGroup/glTF-Sample-Assets':'8f492390ddc7a2ae221a1369ef560589cf8c70fb'}
rows=[]
def tree(repo):return json.loads(subprocess.check_output(['gh','api',f'repos/{repo}/git/trees/{COMMITS[repo]}?recursive=1']))['tree']
rocket=tree('microsoft/Microsoft-Rocketbox');nasa=tree('nasa/NASA-3D-Resources');khronos=tree('KhronosGroup/glTF-Sample-Assets')
def add(repo,row,target,license,credit):rows.append(dict(repo=repo,commit=COMMITS[repo],path=row['path'],gitBlob=row['sha'],bytes=row['size'],local=target,license=license,credit=credit))
for name,ID in [('Pilot_Male_01','commander'),('Pilot_Female_01','officer')]:
 prefix=f'Assets/Avatars/Professions/{name}/'
 for x in rocket:
  if not x['path'].startswith(prefix):continue
  relative=x['path'][len(prefix):]
  if relative==f'Export/{name}_facial.fbx' or (relative.startswith('Textures/') and relative.endswith('.tga') and 'wrinkle' not in relative):add('microsoft/Microsoft-Rocketbox',x,f'{ID}/{Path(relative).name}','MIT','Copyright (c) 2020 Microsoft / Microsoft Rocketbox')
for ID,name in [('commander','m_idle_breathe_01.max.fbx'),('officer','f_idle_breathe_01.max.fbx')]:
 path='Assets/Animations/all_animations_max_motextr_static/'+name
 add('microsoft/Microsoft-Rocketbox',next(x for x in rocket if x['path']==path),ID+'-idle.fbx','MIT','Copyright (c) 2020 Microsoft / Microsoft Rocketbox')
for ID,name in [('commander','m_walk_neutral.max.fbx'),('officer','f_walk_neutral.max.fbx')]:
 path='Assets/Animations/all_animations_max_motextr_xy/'+name
 add('microsoft/Microsoft-Rocketbox',next(x for x in rocket if x['path']==path),ID+'-walk.fbx','MIT','Copyright (c) 2020 Microsoft / Microsoft Rocketbox')
for ID,path in [('iss-offline','3D Models/International Space Station (ISS) (B)/International Space Station (ISS) (B).glb'),('iss','3D Models/International Space Station (ISS) (D) (IGOAL)/International Space Station (ISS).glb'),('shuttle','3D Models/Space Shuttle (D)/Space Shuttle (D).glb'),('habitat','3D Models/Habitat Demonstration Unit/Habitat Demonstration Unit (part 1).glb'),('habitat-interior','3D Models/Habitat Demonstration Unit/Habitat Demonstration Unit (part 2).glb')]:
 add('nasa/NASA-3D-Resources',next(x for x in nasa if x['path']==path),f'{ID}.glb','NASA media usage guidelines; repository states free and without copyright','NASA / NASA 3D Resources; no endorsement')
for ID,name,license,credit in [('sofa','GlamVelvetSofa','CC BY 4.0','Wayfair LLC / Eric Chadwick'),('chair','SheenChair','CC0','Wayfair LLC / Eric Chadwick'),('fridge','CommercialRefrigerator','CC BY 4.0','Darmstadt Graphics Group / Eric Chadwick / Sean Thomas')]:
 path=f'Models/{name}/glTF-Binary/{name}.glb';add('KhronosGroup/glTF-Sample-Assets',next(x for x in khronos if x['path']==path),f'{ID}.glb',license,credit)
 for x in khronos:
  if x['path']==f'Models/{name}/README.md':add('KhronosGroup/glTF-Sample-Assets',x,f'licenses/{name}.md',license,credit)
for repo,filename in [('microsoft/Microsoft-Rocketbox','LICENSE.md'),('nasa/NASA-3D-Resources','README.md')]:
 tr=rocket if repo.startswith('microsoft') else nasa;add(repo,next(x for x in tr if x['path']==filename),'licenses/'+repo.split('/')[0]+'.md','See file',repo)
def fetch(row):
 p=STAGE/row['local'];p.parent.mkdir(parents=True,exist_ok=True)
 data=p.read_bytes() if p.exists() else subprocess.check_output(['gh','api','-H','Accept: application/vnd.github.raw',f"repos/{row['repo']}/git/blobs/{row['gitBlob']}"])
 assert len(data)==row['bytes'] and hashlib.sha1(f'blob {len(data)}\0'.encode()+data).hexdigest()==row['gitBlob'],row['path']
 p.write_bytes(data);row['sha256']=hashlib.sha256(data).hexdigest()
 if p.suffix=='.tga':
  from PIL import Image
  Image.open(p).save(p.with_suffix('.png'))
 print(row['local'],len(data),flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=4)as pool:list(pool.map(fetch,rows))
out=ROOT/'Content/ThirdParty/Streaming';out.mkdir(parents=True,exist_ok=True);(out/'sources.json').write_text(json.dumps(rows,indent=2)+'\n')
for p in (STAGE/'licenses').glob('*'):(out/p.name).write_bytes(p.read_bytes())
