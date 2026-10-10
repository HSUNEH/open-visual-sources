import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { themes, totalWorks } from '../src/catalog.js';

test('17 visual works retain four themes and exclude every sound exhibit', () => {
  assert.equal(themes.length, 4); assert.equal(totalWorks, 17);
  const works = themes.flatMap(theme => theme.items);
  assert.equal(new Set(works.map(work => work.id)).size, 17);
  for (const work of works) for (const field of ['repo', 'license', 'implementation', 'renderer']) assert.ok(work[field], `${work.id}: ${field}`);
  for (const id of ['lenia', 'fluid', 'origami', 'shan-shui','sandspiel','fieldplay','wfc']) assert.ok(works.some(work => work.id === id));
  assert.ok(!themes.some(theme=>theme.id==='sound'));
  for (const id of ['pink-trombone','fft','tone']) assert.ok(!works.some(work=>work.id===id));
});

test('every upstream snapshot and painting matches its provenance hash', async () => {
  const manifests = [
    ['public/vendor/manifest.json', 'public/vendor/'],
    ['public/vendor/exhibits-manifest.json', 'public/'],
    ['public/vendor/expansion-manifest.json', 'public/'],
  ];
  for (const [file, base] of manifests) {
    const records = JSON.parse(await readFile(file));
    for (const record of records) {
      const bytes = await readFile(base + record.file);
      assert.equal(createHash('sha256').update(bytes).digest('hex'), record.sha256, record.file);
      assert.ok(record.url.startsWith('https://'));
    }
  }
});

test('three bundled paintings have public-domain museum evidence and CC0 mirror sources', async () => {
  const paintings = JSON.parse(await readFile('public/artworks/manifest.json'));
  assert.equal(paintings.length, 3);
  for (const painting of paintings) {
    const evidence = JSON.parse(await readFile(`public/artworks/${painting.id}.json`));
    assert.equal(evidence.data.is_public_domain, true);
    assert.match(painting.license, /CC0/);
    assert.match(painting.mirror, /^https:\/\/commons.wikimedia.org\/wiki\/File:/);
    const bytes = await readFile('public' + painting.image); assert.ok(bytes.length > 10000);
  }
});

test('three face-centred Threading presets retain source provenance and image hashes', async () => {
  const portraits=JSON.parse(await readFile('public/artworks/portraits.json'));
  assert.equal(portraits.length,3);
  for (const portrait of portraits) {
    assert.match(portrait.source,/^https:\/\/commons.wikimedia.org\/wiki\/File:/);
    assert.equal(portrait.license,'Public domain · PD-Art');
    assert.equal(createHash('sha256').update(await readFile('public/'+portrait.image)).digest('hex'),portrait.sha256);
    assert.equal(portrait.crop.length,3);
  }
});
