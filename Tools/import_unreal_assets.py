"""Run INSIDE Unreal Editor 5.8's Python environment, not ordinary Python.
Imports licensed source meshes/maps and creates material assets. Nothing fabricated.
Example: UnrealEditor-Cmd.exe Heliopause.uproject -ExecutePythonScript=Tools/import_unreal_assets.py
Enable Python Editor Script Plugin and Editor Scripting Utilities first.
"""
import json
from pathlib import Path
import unreal
ROOT=Path(unreal.Paths.project_dir()).resolve()
tools=unreal.AssetToolsHelpers.get_asset_tools()
def task(file,destination,name=None):
 t=unreal.AssetImportTask();t.filename=str(file);t.destination_path=destination;t.automated=True;t.save=True;t.replace_existing=True
 if name:t.destination_name=name
 tools.import_asset_tasks([t])
 assets=[unreal.load_asset(p)for p in t.imported_object_paths]
 if not assets:raise RuntimeError('Asset import produced no assets: '+str(file))
 return assets
task(ROOT/'Content/ThirdParty/NASA/moon_small.glb','/Game/Imported/NASA','moon_small')
for p in sorted((ROOT/'Content/ThirdParty/Kenney').glob('*/*.glb')):
 task(p,'/Game/Imported/Kenney/'+p.parent.name.replace('-','_'))
for row in json.loads((ROOT/'Content/ThirdParty/PlanetMaps/manifest.json').read_text())['assets']:
 # PNGs avoid depending on Interchange WebP support on a particular engine installation.
 p=ROOT/'Content/ThirdParty/PlanetMaps/Unreal'/ (row['id']+'.png')
 if not p.exists():raise RuntimeError('Run Tools/prepare_unreal_maps.py first: '+str(p))
 textures=task(p,'/Game/Imported/PlanetMaps',row['id'])
 tex=next((a for a in textures if isinstance(a,unreal.Texture2D)),None)
 if not tex:raise RuntimeError('Texture2D missing: '+row['id'])
 tex.set_editor_property('srgb',True);tex.set_editor_property('never_stream',False)
 path='/Game/Imported/PlanetMaps/M_'+row['id'];mat=unreal.load_asset(path)
 if not mat:mat=tools.create_asset('M_'+row['id'],'/Game/Imported/PlanetMaps',unreal.Material,unreal.MaterialFactoryNew())
 unreal.MaterialEditingLibrary.delete_all_material_expressions(mat)
 sample=unreal.MaterialEditingLibrary.create_material_expression(mat,unreal.MaterialExpressionTextureSample,-300,0);sample.texture=tex
 unreal.MaterialEditingLibrary.connect_material_property(sample,'RGB',unreal.MaterialProperty.MP_BASE_COLOR)
 rough=unreal.MaterialEditingLibrary.create_material_expression(mat,unreal.MaterialExpressionConstant,-300,200);rough.set_editor_property('r',.72)
 unreal.MaterialEditingLibrary.connect_material_property(rough,'',unreal.MaterialProperty.MP_ROUGHNESS)
 unreal.MaterialEditingLibrary.recompile_material(mat);unreal.EditorAssetLibrary.save_asset(path)
unreal.EditorAssetLibrary.save_directory('/Game/Imported',only_if_is_dirty=True,recursive=True)
unreal.log('Heliopause licensed meshes and streaming planet textures imported. Run build, cook and runtime validation next.')
