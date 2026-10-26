#!/usr/bin/env python3
"""Pinned, reproducible OEC snapshot. Retains every field/uncertainty, not just preferred values."""
import subprocess,json,hashlib,xml.etree.ElementTree as ET,pathlib,html
ROOT=pathlib.Path(__file__).resolve().parents[1]
REPO='OpenExoplanetCatalogue/open_exoplanet_catalogue';PIN='fd375cc7e9102f2978e23b7788697926ca9f41ff'
TREE=json.loads(subprocess.check_output(['gh','api',f'repos/{REPO}/git/trees/{PIN}?recursive=1']))['tree']
lookup={r['path']:r for r in TREE};names=['TRAPPIST-1','LHS 1140','TOI-1452','Kepler-22','Kepler-62']
def raw(path):
 r=lookup[path];b=subprocess.check_output(['gh','api','-H','Accept: application/vnd.github.raw',f'repos/{REPO}/git/blobs/{r["sha"]}']);assert hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()==r['sha'];return b,r['sha']
def fields(node):return [{'key':c.tag,'value':html.unescape(c.text or '').strip(),'attributes':c.attrib}for c in node if c.tag not in ('planet','star','binary')]
worlds=[];systems=[]
for si,name in enumerate(names):
 path=f'systems/{name}.xml';b,sha=raw(path);root=ET.fromstring(b);stars=root.findall('.//star');center=[1500+si*1400,(-1 if si%2 else 1)*180,-1700-si*1350];systems.append({'id':name,'position':center,'radius':50,'fields':fields(root),'stars':[fields(s) for s in stars]})
 for pi,planet in enumerate(root.findall('.//planet')):
  name=planet.findtext('name');identifier=name.lower().replace(' ','-');ocean= name in ['TRAPPIST-1 e','TRAPPIST-1 f','LHS 1140 b','TOI-1452 b','Kepler-22 b','Kepler-62 e','Kepler-62 f'];radius=float(planet.findtext('radius') or .13);profile='ocean'if ocean else 'desert';position=[center[0]+220+pi*145,center[1]+pi*25,center[2]+230+pi*70]
  worlds.append({'id':'oec-'+identifier,'name':name,'kind':'planet','position':position,'radius':max(7,min(35,radius*70)),'reward':350,'artifact':False,'profile':profile,'system':systems[-1]['id'],'lore':'Cataloged exoplanet. Surface, weather, oceans, ecology, and compressed navigation coordinates are fictional visualizations, not resolved observations.','science':{'source':f'https://github.com/{REPO}/blob/{PIN}/{path}','blob':sha,'sha256':hashlib.sha256(b).hexdigest(),'planet':fields(planet),'star':fields(stars[0]),'system':fields(root),'visualization':'Hypothetical ocean world; liquid water and habitability NOT confirmed.'if ocean else 'Artist-created terrestrial terrain; actual surface conditions unknown.','estimates':['Catalog values are literature estimates with uncertainties; a confirmed planet is not a confirmed habitable world.','Catalog temperature may be equilibrium/model temperature, NOT measured surface temperature.'],'unknown':['Resolved surface maps','Ocean coverage','Life','Breathable air']}})
pack={'version':1,'snapshot':'2026-10-26','sourceCommit':PIN,'systems':systems,'worlds':worlds};b=(json.dumps(pack,indent=2,ensure_ascii=False)+'\n').encode()
for p in [ROOT/'Shared/exoplanets.json',ROOT/'BrowserPreview/public/hd/catalog/exoplanets.json']:p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b)
p=ROOT/'BrowserPreview/v4/catalog-assets.json';p.write_text(json.dumps({'exoplanets':{'url':'/hd/catalog/exoplanets.json','bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}},indent=2)+'\n')
license,_=raw('README.md');(ROOT/'Content/ThirdParty/Streaming/open-exoplanet-catalogue.md').write_bytes(license)
print(len(worlds),'worlds',len(systems),'systems',len(b),'bytes')
