import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import * as THREE from 'three';

async function original(kind){
 const html=await readFile(`public/vendor/physics/${kind}.html`,'utf8');
 assert.match(html,/Permission is hereby granted, free of charge/);
 const source=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n').replace(/initThreeScene\(\);\s*onWindowResize\(\);\s*initPhysics\(\);\s*update\(\);/,'');
 return vm.runInNewContext(source+`;({${kind==='soft'?'SoftBody,bunnyMesh':'Cloth'}})`,{THREE,document:{getElementById:()=>({})},console,performance});
}
test('original soft body has a bounded mesh, deforms under grab and remains finite',async()=>{
 const {SoftBody,bunnyMesh}=await original('soft');const body=new SoftBody(bunnyMesh,new THREE.Scene());
 assert.equal(body.numParticles,333);const before=body.pos.slice();
 body.startGrab(new THREE.Vector3(body.pos[0],body.pos[1],body.pos[2]));body.moveGrabbed(new THREE.Vector3(.4,1.4,.1));body.endGrab(null,new THREE.Vector3());
 for(let frame=0;frame<40;frame++)for(let s=0;s<8;s++){body.preSolve(1/480,[0,-10,0]);body.solve(1/480);body.postSolve(1/480);}
 assert.ok(body.pos.every(Number.isFinite));assert.ok(body.pos.some((v,i)=>Math.abs(v-before[i])>.05));
});
test('original self-colliding cloth works at 900 particles with pinned corners',async()=>{
 const {Cloth}=await original('cloth');const cloth=new Cloth(new THREE.Scene(),30,30,.04,.035,.1);
 cloth.invMass[29]=0;cloth.invMass[899]=0;const corner=cloth.pos.slice(87,90),before=cloth.pos.slice();
 for(let f=0;f<40;f++)cloth.simulate(1/60,8,[0,-10,0]);
 assert.equal(cloth.numParticles,900);assert.ok(cloth.pos.every(Number.isFinite));assert.deepEqual(cloth.pos.slice(87,90),corner);
 assert.ok(cloth.pos.some((v,i)=>Math.abs(v-before[i])>.05));
});
test('map budget and provenance retain originals and isolate worker calculation',async()=>{
 const source=await readFile('public/vendor/mapgen/source/config.js','utf8');assert.match(source,/spacing: 5.5/);
 const bundle=await readFile('public/vendor/mapgen/build/_bundle.js','utf8');assert.match(bundle,/_worker\.js/);
 const data=await readFile('public/vendor/mapgen/build/points-10.data');assert.ok(data.length<100000);
 const build=await readFile('scripts/vendor-mapgen.mjs','utf8');assert.match(build,/1024/);assert.match(build,/768/);
});
