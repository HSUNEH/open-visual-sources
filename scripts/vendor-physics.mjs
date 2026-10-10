import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const ref='bfc4b63667c7e3ef683a7d6491c26f13c7e0d831',records=[];
await mkdir('public/vendor/physics',{recursive:true});
for(const [file,url] of [
  ['soft.html',`https://raw.githubusercontent.com/matthias-research/pages/${ref}/tenMinutePhysics/10-softBodies.html`],
  ['cloth.html',`https://raw.githubusercontent.com/matthias-research/pages/${ref}/tenMinutePhysics/15-selfCollision.html`],
  ['three.min.js','https://unpkg.com/three@0.139.2/build/three.min.js'],
  ['OrbitControls.js','https://unpkg.com/three@0.139.2/examples/js/controls/OrbitControls.js'],
  ['LICENSE-three','https://unpkg.com/three@0.139.2/LICENSE'],
]){
  const response=await fetch(url);if(!response.ok)throw Error(url);
  const bytes=Buffer.from(await response.arrayBuffer());await writeFile(`public/vendor/physics/${file}`,bytes);
  records.push({file:`vendor/physics/${file}`,url,sha256:createHash('sha256').update(bytes).digest('hex')});console.log(file,bytes.length);
}
await writeFile('public/vendor/physics-manifest.json',JSON.stringify(records,null,2)+'\n');
