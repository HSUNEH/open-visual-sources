// Downloads unmodified, attributed upstream files; hashes pin the local snapshot.
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const files = [
  ['fishdraw.js', 'https://raw.githubusercontent.com/LingDong-/fishdraw/master/fishdraw.js'],
  ['fishdraw.LICENSE', 'https://raw.githubusercontent.com/LingDong-/fishdraw/master/LICENSE'],
  ['shan-shui.html', 'https://raw.githubusercontent.com/LingDong-/shan-shui-inf/master/index.html'],
  ['shan-shui.LICENSE', 'https://raw.githubusercontent.com/LingDong-/shan-shui-inf/master/LICENSE'],
];
for (const file of ['canvas.js', 'shape.js', 'state.js', 'step.js', 'util.js']) {
  files.push([`primitive/${file}`, `https://raw.githubusercontent.com/ondras/primitive.js/master/js/src/${file}`]);
}
files.push(['primitive/LICENSE', 'https://raw.githubusercontent.com/ondras/primitive.js/master/license.txt']);
await mkdir('public/vendor', { recursive: true });
await mkdir('public/vendor/primitive', { recursive: true });
const manifest = [];
for (const [file, url] of files) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(`public/vendor/${file}`, bytes);
  manifest.push({ file, url, sha256: createHash('sha256').update(bytes).digest('hex') });
  console.log(`Downloaded ${file} (${bytes.length} bytes)`);
}
await writeFile('public/vendor/manifest.json', JSON.stringify(manifest, null, 2) + '\n');
