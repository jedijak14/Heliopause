// Structural asset audit, not a claim of subjective visual perfection.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {NodeIO} from '@gltf-transform/core';import {ALL_EXTENSIONS} from '@gltf-transform/extensions';import draco from 'draco3dgltf';import {MeshoptDecoder} from 'meshoptimizer';
const root=path.resolve(import.meta.dirname,'..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'v4/model-assets.json')));
await MeshoptDecoder.ready;const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.decoder':await draco.createDecoderModule(),'meshopt.decoder':MeshoptDecoder}),report={scope:'All nine licensed streamed GLBs and their nine embedded offline counterparts; finite geometry, indices, materials, textures and manifest integrity. Not a visual-quality score.',models:[]};
for(const [id,entry]of Object.entries(manifest))for(const quality of ['HD','offline']){
 const file=path.join(root,quality==='HD'?'public/hd/models':'assets/models/offline',id+'.glb'),bytes=fs.readFileSync(file),sha256=createHash('sha256').update(bytes).digest('hex');if(quality==='HD'){assert.equal(bytes.length,entry.bytes);assert.equal(sha256,entry.sha256);}
 const doc=await io.read(file),r=doc.getRoot();let triangles=0,vertices=0,defaultMaterialPrimitives=0;
 for(const a of r.listAccessors()){const data=a.getArray();assert.ok(data&&data.every(Number.isFinite),`${id}: non-finite accessor`);}
 for(const mesh of r.listMeshes())for(const p of mesh.listPrimitives()){
  const pos=p.getAttribute('POSITION'),normal=p.getAttribute('NORMAL'),indices=p.getIndices();assert.ok(pos&&pos.getCount()>0,`${id}: missing positions`);assert.ok(normal&&normal.getCount()===pos.getCount(),`${id}: missing normals`);if(!p.getMaterial())defaultMaterialPrimitives++;
  if(indices)for(const i of indices.getArray())assert.ok(i>=0&&i<pos.getCount(),`${id}: bad index`);
  const mat=p.getMaterial();if(mat?.getBaseColorTexture()||mat?.getNormalTexture())assert.ok(p.getAttribute('TEXCOORD_0'),`${id}: texture without UVs`);
  vertices+=pos.getCount();if(p.getMode()===4)triangles+=(indices?.getCount()||pos.getCount())/3;
 }
 const textures=r.listTextures().map(t=>{assert.ok(t.getImage()?.length,`${id}: empty texture`);const size=t.getSize();assert.ok(size&&size.every(n=>n>0),`${id}: invalid texture`);return {size,mime:t.getMimeType()};});
 const record={id,quality,bytes:bytes.length,sha256,triangles,vertices,meshes:r.listMeshes().length,materials:r.listMaterials().length,defaultMaterialPrimitives,normalMappedMaterials:r.listMaterials().filter(m=>m.getNormalTexture()).length,skins:r.listSkins().length,textures};report.models.push(record);console.log(`${id} ${quality}: ${triangles} triangles, ${textures.length} textures, materials/UVs/normals valid`);
}
fs.mkdirSync(path.join(root,'../Previews/Pressure-Seals'),{recursive:true});fs.writeFileSync(path.join(root,'../Previews/Pressure-Seals/model-audit.json'),JSON.stringify(report,null,2)+'\n');console.log('PASS: 18 model variants.');
