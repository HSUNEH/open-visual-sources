import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';
import {createHash} from 'node:crypto';
const ref='a12c7efa541b5770043a8d5470bffeacfd7b0435',records=[];
async function get(file,url){
  let bytes;try{bytes=await readFile(`public/vendor/nca/${file}`);}catch{}
  if(!bytes){const response=await fetch(url);if(!response.ok)throw Error(`${response.status} ${url}`);bytes=Buffer.from(await response.arrayBuffer());}
  await mkdir(dirname(`public/vendor/nca/${file}`),{recursive:true});await writeFile(`public/vendor/nca/${file}`,bytes);
  records.push({file:`vendor/nca/${file}`,url,sha256:createHash('sha256').update(bytes).digest('hex')});console.log(file,bytes.length);
}
const upstream=path=>`https://raw.githubusercontent.com/distillpub/post--growing-ca/${ref}/${path}`;
for(const file of ['ca.js','twgl.min.js'])await get(file,upstream(`public/${file}`));
for(const [id,emoji] of [['lizard','🦎'],['butterfly','🦋'],['ladybug','🐞']])await get(`models/${id}.json`,upstream(`public/webgl_models8/ex3_${encodeURIComponent(emoji)}.json`));
await get('LICENSE-models',upstream('LICENSE'));
await get('LICENSE-engine','https://raw.githubusercontent.com/google-research/self-organising-systems/3d5547ca48b60ecac459834e2c05c9ff5df87991/LICENSE');
await get('LICENSE-twgl','https://raw.githubusercontent.com/greggman/twgl.js/v4.14.2/LICENSE.md');
await get('LICENSE-noto-emoji-images','https://raw.githubusercontent.com/googlefonts/noto-emoji/f7abf9645ce10d923fb5e8bccf62e0ffae47b999/LICENSE');
await writeFile('public/vendor/nca-manifest.json',JSON.stringify(records,null,2)+'\n');
