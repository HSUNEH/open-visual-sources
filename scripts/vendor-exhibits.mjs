// Download upstream snapshots and museum open-access images, preserving source bytes.
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';

const manifest = [];
async function download(file, url) {
  let bytes;
  try { if (!process.argv.includes('--refresh') && !(file.startsWith('artworks/') && /\.(jpg|png)$/.test(file) && process.argv.includes('--refresh-images'))) bytes = await readFile(`public/${file}`); } catch {}
  if (!bytes) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${response.status}: ${url}`);
    bytes = Buffer.from(await response.arrayBuffer());
  }
  await mkdir(dirname(`public/${file}`), { recursive: true });
  await writeFile(`public/${file}`, bytes);
  manifest.push({ file, url, sha256: createHash('sha256').update(bytes).digest('hex') });
  console.log(file, bytes.length);
  return bytes.toString();
}
const raw = (repo, file) => `https://raw.githubusercontent.com/${repo}/master/${file}`;
for (const file of ['script.js', 'dat.gui.min.js', 'LDR_LLL1_0.png', 'LICENSE']) {
  await download(`vendor/fluid/${file}`, raw('PavelDoGreat/WebGL-Fluid-Simulation', file));
}
for (const file of ['Lenia.html', 'Lenia-LifeForms.js', 'libs/MersenneTwister19937.js', 'libs/jsgif/LZWEncoder.js', 'libs/jsgif/NeuQuant.js', 'libs/jsgif/GIFEncoder.js', 'libs/plotly-latest.min.js']) {
  await download(`vendor/lenia/${file}`, raw('Chakazul/Lenia', `JavaScript/${file}`));
}
await download('vendor/lenia/LICENSE.md', raw('Chakazul/Lenia', 'LICENSE.md'));
const origami = await download('vendor/origami/index.html', raw('amandaghassaei/OrigamiSimulator', 'index.html'));
const paths = [...origami.matchAll(/(?:src|href)=["']((?:dependencies|js|css)\/[^"']+)["']/g)].map(m => m[1]);
for (const file of new Set([...paths, 'LICENSE', 'assets/Tessellations/huffmanWaterbomb.svg', 'assets/Tessellations/miura-ori.svg'])) {
  // The optional Miura filename is discovered from the upstream index below.
  if (file.endsWith('miura-ori.svg')) continue;
  await download(`vendor/origami/${file}`, raw('amandaghassaei/OrigamiSimulator', file));
}
const models = [...origami.matchAll(/data-url=["']([^"']+)["']/g)].map(m => m[1]).filter(p => /miura|crane/i.test(p));
for (const file of new Set(models)) await download(`vendor/origami/assets/${file}`, raw('amandaghassaei/OrigamiSimulator', `assets/${file}`));
await download('vendor/pink-trombone/index.html', 'https://dood.al/pinktrombone/');
const paintings = [];
for (const [id, name, artist] of [[28560, '아를의 침실', '빈센트 반 고흐'], [16568, '수련', '클로드 모네'], [24645, '가나가와 해변의 높은 파도', '가쓰시카 호쿠사이']]) {
  const url = `https://api.artic.edu/api/v1/artworks/${id}?fields=id,title,artist_display,image_id,is_public_domain`;
  const record = JSON.parse(await download(`artworks/${id}.json`, url));
  if (!record.data.is_public_domain) throw new Error(`Artwork ${id} is not public domain`);
  // Museum IIIF currently refuses downloads; use its CC0 Wikimedia mirrors.
  const filename = { 28560: 'Vincent_van_Gogh_-_The_Bedroom_-_1926.417_-_Art_Institute_of_Chicago.jpg', 16568: 'Claude_Monet_-_Water_Lilies_-_1933.1157_-_Art_Institute_of_Chicago.jpg', 24645: 'The_Great_Wave_off_Kanagawa.png' }[id];
  const hash = createHash('md5').update(filename).digest('hex');
  const image = `https://upload.wikimedia.org/wikipedia/commons/thumb/${hash[0]}/${hash.slice(0, 2)}/${filename}/960px-${filename}`;
  const extension = id === 24645 ? 'png' : 'jpg';
  await download(`artworks/${id}.${extension}`, image);
  paintings.push({ id, name, artist, image: `/artworks/${id}.${extension}`, source: `https://www.artic.edu/artworks/${id}`, mirror: `https://commons.wikimedia.org/wiki/File:${filename}`, license: 'CC0 · Art Institute of Chicago' });
}
await writeFile('public/artworks/manifest.json', JSON.stringify(paintings, null, 2) + '\n');
await writeFile('public/vendor/exhibits-manifest.json', JSON.stringify(manifest, null, 2) + '\n');
