import test from 'node:test';
import assert from 'node:assert/strict';
import {createExteriorShades} from '../v4/exterior-shades.js';
test('exterior wrap has valid cap normals, nozzle/ramp covers and reversible deployed-pod coverage',()=>{
 const normals=[],boxes=[],cylinders=[];
 class B {q(a,b,c,d,n){normals.push(n);}box(c,s){boxes.push({c,s});}cyl(c,r,h){cylinders.push({c,r,h});}build(){return {};}}
 const add=(geo,mat,col,met,rgh,options={})=>({geo,mat,col,met,rgh,...options});
 const windows=[{open:true,k:0,mesh:{geo:{},model:[]}}],pods=[{side:-1,z:8,loaded:true}];
 const effect=createExteriorShades({B,M:{},add,windows,pods});
 assert.ok(normals.length>=144);for(const n of normals)assert.ok(Math.abs(Math.hypot(...n)-1)<1e-12);
 assert.ok(normals.some(n=>n[2]===-1));assert.ok(cylinders.some(c=>c.c[2]+c.h>=27.54));
 assert.ok(boxes.some(b=>b.c[2]===27.2&&b.s[2]>=1.2));
 effect.update(2.5,true,pods);assert.equal(effect.fraction,.5);effect.update(2.5,true,pods);assert.equal(effect.fraction,1);assert.equal(pods[0].shade.hidden,false);
 effect.update(5,false,pods);assert.equal(effect.fraction,0);assert.equal(effect.shell.hidden,true);assert.equal(pods[0].shade.hidden,true);
 windows[0].open=false;effect.update(5,false,pods);assert.equal(effect.fraction,1);
 pods[0].loaded=false;effect.update(0,false,pods);assert.equal(pods[0].shade.hidden,true);
});
