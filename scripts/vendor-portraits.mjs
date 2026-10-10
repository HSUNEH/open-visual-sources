import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const records = [
  {id:'mona-lisa',title:'모나리자',artist:'다빈치',file:'Mona_Lisa,_by_Leonardo_da_Vinci,_from_C2RMF_retouched.jpg',crop:[.2,.10,.65]},
  {id:'pearl-earring',title:'진주 귀걸이 소녀',artist:'페르메이르',file:'1665_Girl_with_a_Pearl_Earring.jpg',crop:[.10,.08,.80]},
  {id:'van-gogh',title:'자화상',artist:'고흐',file:'Vincent_van_Gogh_-_Self-Portrait_-_Google_Art_Project.jpg',crop:[.17,.04,.69]},
];
const manifest=[];
for (const record of records) {
  const hash=createHash('md5').update(record.file).digest('hex');
  const url=`https://upload.wikimedia.org/wikipedia/commons/thumb/${hash[0]}/${hash.slice(0,2)}/${record.file}/960px-${record.file}`;
  const image=`artworks/${record.id}.jpg`;
  let bytes;
  try { bytes=await readFile(`public/${image}`); } catch {}
  if (!bytes || process.argv.includes('--refresh')) {
    const response=await fetch(url);
    if(!response.ok)throw new Error(`${response.status}: ${url}`);
    if(!response.headers.get('content-type')?.startsWith('image/'))throw new Error('Not an image');
    bytes=Buffer.from(await response.arrayBuffer());
    await writeFile(`public/${image}`,bytes);
  }
  manifest.push({...record,image,url,source:`https://commons.wikimedia.org/wiki/File:${record.file}`,license:'Public domain · PD-Art',sha256:createHash('sha256').update(bytes).digest('hex')});
  console.log(image,bytes.length);
}
await writeFile('public/artworks/portraits.json',JSON.stringify(manifest,null,2)+'\n');
