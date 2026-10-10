// Pinned upstream releases; keep their bytes unchanged and record provenance.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';
const manifest=[];
async function get(file,repo,ref,path) {
  const url=`https://raw.githubusercontent.com/${repo}/${ref}/${path}`;
  let bytes;
  try { bytes=await readFile(`public/${file}`); } catch {}
  if(!bytes) {const response=await fetch(url);if(!response.ok)throw Error(`${response.status} ${url}`);bytes=Buffer.from(await response.arrayBuffer());}
  await mkdir(dirname(`public/${file}`),{recursive:true});await writeFile(`public/${file}`,bytes);
  manifest.push({file,url,sha256:createHash('sha256').update(bytes).digest('hex')});
  console.log(file,bytes.length);
}
await get('vendor/sandspiel/sandspiel.wasm','MaxBittker/sandspiel','24a63c60428cae13714946118f025d5d1484b344','354dd2ae780207d6d78d.module.wasm');
await get('vendor/sandspiel/LICENSE','MaxBittker/sandspiel','9936e06b07a583aedfba9589c0cead2917f405fb','LICENSE');
for(const file of ['index-YF36ta8P.js','vueApp-CW4N62Qh.js','vueApp-W5cJhiE8.css','parser-DwgkW_yS.js','CCapture.all.min-D30alvaS.js'])
  await get(`vendor/fieldplay/assets/${file}`,'anvaka/fieldplay','2f0643ce57f36b60559c554dca608235524e5c1a',`assets/${file}`);
await get('vendor/fieldplay/LICENSE','anvaka/fieldplay','11d602df5338e7bd80b10c01334f60594c396539','LICENSE');
await get('vendor/fieldplay/LICENSE-webgl-wind','mapbox/webgl-wind','b1f6468d90d2f39763a8795a5042f316a32ff3c8','LICENSE');
for(const file of ['samples/Flowers.png','samples/Paths.png','samples/Maze.png','LICENSE'])
  await get(`vendor/wfc/${file}`,'mxgmn/WaveFunctionCollapse','de7d22e705e816b62b4d613199d0463820fcaef3',file);
await writeFile('public/vendor/expansion-manifest.json',JSON.stringify(manifest,null,2)+'\n');
await writeFile('public/vendor/wfc/LICENSE-port',await readFile('node_modules/wavefunctioncollapse/LICENSE'));
