import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';
import {createHash} from 'node:crypto';
const records=[];
async function download(folder,repo,ref,path,sourcePath=path) {
  const file=`vendor/${folder}/${path}`,url=`https://raw.githubusercontent.com/${repo}/${ref}/${sourcePath}`;
  let bytes;try{bytes=await readFile(`public/${file}`);}catch{}
  if(!bytes){const response=await fetch(url);if(!response.ok)throw Error(`${response.status} ${url}`);bytes=Buffer.from(await response.arrayBuffer());}
  await mkdir(dirname(`public/${file}`),{recursive:true});await writeFile(`public/${file}`,bytes);
  records.push({file,url,sha256:createHash('sha256').update(bytes).digest('hex')});console.log(file,bytes.length);
}
for(const file of ['dist/brush.esm.js','LICENSE.md'])await download('brush','acamposuribe/p5.brush','0e85177597313b00905396e19efc7b1a5f134e8b',file);
for(const file of ['Material_Roughness.html','LICENSE','css/default.css','js/three.module.min.js','js/three.core.min.js','js/stats.module.js','js/lil-gui.module.min.js','js/MobileJoystickControls.js','js/PathTracingCommon.js','js/InitCommon.js','js/Material_Roughness.js','textures/BlueNoise_R_128.png','shaders/common_PathTracing_Vertex.glsl','shaders/Material_Roughness_Fragment.glsl','shaders/ScreenCopy_Fragment.glsl','shaders/ScreenOutput_Fragment.glsl'])
  await download('pathtrace','erichlof/THREE.js-PathTracing-Renderer','a930973667faf4502b427a01dd338a19522c8f6c',file);
await download('pathtrace','mrdoob/three.js','r185','LICENSE-three','LICENSE');
await download('pathtrace','georgealways/lil-gui','v0.17.0','LICENSE-lil-gui','LICENSE.md');
await download('pathtrace','mrdoob/stats.js','r17','LICENSE-stats','LICENSE');
await writeFile('public/vendor/brush-pathtrace-manifest.json',JSON.stringify(records,null,2)+'\n');
