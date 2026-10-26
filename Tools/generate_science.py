#!/usr/bin/env python3
import json,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1];pack=json.loads((root/'Shared/exoplanets.json').read_text());q=lambda s:json.dumps(str(s),ensure_ascii=True)
lines=['#pragma once','#include <array>','#include <string_view>','namespace HPScience {','struct Field {int site;const char* key;const char* value;};','inline constexpr Field Fields[]={']
for i,w in enumerate(pack['worlds'],17):
 science=w['science'];rows=[('VISUALIZATION',science['visualization']),('NAVIGATION','Compressed fictional coordinates; not physical star separations.')]
 for group in ['planet','star','system']:
  for f in science[group]:
   unit={'period':'days','semimajoraxis':'AU','inclination':'deg','temperature':'K (catalog estimate)','distance':'pc','transittime':'JD','age':'Gyr'}.get(f['key'],'')
   if f['key'] in ['mass','radius']:unit=('M_'if f['key']=='mass'else 'R_')+('Sun'if group=='star'else 'Jup')
   rows.append((group.upper()+' / '+f['key'],f['value']+' '.join(' · '+k+' '+v for k,v in f['attributes'].items())+' '+unit))
 rows += [('INTERPRETATION',s)for s in science['estimates']]+[('UNKNOWN / UNCONFIRMED',s)for s in science['unknown']]+[('SOURCE',science['source'])]
 for key,value in rows:lines.append('    {'+str(i)+','+q(key)+','+q(value)+'},')
lines+=['};','inline constexpr const char* Profiles[]={'+','.join(q(w['profile'])for w in pack['worlds'])+'};','inline std::string_view profile(int i){return i>=17&&i<33?Profiles[i-17]:"";}','}'];text='\n'.join(lines)+'\n';p=root/'Source/Heliopause/Public/ScienceCatalog.h'
if '--check' in sys.argv:assert p.read_text()==text;print('PASS: science field and terrain profile catalogs synchronized')
else:p.write_text(text)
