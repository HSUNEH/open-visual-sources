import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createGrowthClock} from '../public/vendor/nca/clock.js';

test('NCA growth speed is proportional and independent of screen refresh rate',()=>{
  for(const hz of [30,60,120])for(const speed of [.25,.5,1,2,4]){
    const clock=createGrowthClock();let total=0;
    for(let i=0;i<=hz;i++)total+=clock.steps(i*1000/hz,speed);
    assert.equal(total,Math.min(180*speed,12*hz));
  }
});

test('NCA pause/reset discards elapsed time and slow frames cannot queue a burst',()=>{
  const clock=createGrowthClock();clock.steps(0,4);
  assert.equal(clock.steps(10000,4),12);
  assert.equal(clock.steps(10000,4),0);
  clock.reset();assert.equal(clock.steps(20000,.25),0);
  assert.equal(clock.steps(20000+1000/60,.25),0);
  assert.equal(clock.steps(20000+2000/60,.25),1);
});

test('NCA bundles three distinct original regeneration networks with valid quantized layers',async()=>{
  const weights=[];
  for(const name of ['lizard','butterfly','ladybug']){
    const source=await readFile(`public/vendor/nca/models/${name}.json`,'utf8');
    weights.push(source);
    const model=JSON.parse(source);
    assert.equal(model.length,2);
    assert.deepEqual(model.map(layer=>[layer.in_ch,layer.out_ch]),[[48,128],[128,16]]);
    for(const layer of model){
      assert.equal(Buffer.from(layer.data_b64,'base64').length,(layer.in_ch+1)*layer.out_ch);
      assert.ok(Number.isFinite(layer.weight_scale)&&layer.weight_scale>0);
      assert.ok(Number.isFinite(layer.bias_scale)&&layer.bias_scale>0);
    }
  }
  assert.equal(new Set(weights).size,3);
  const manifest=JSON.parse(await readFile('public/vendor/nca-manifest.json'));
  for(const record of manifest.filter(record=>record.file.includes('/models/')))assert.match(decodeURIComponent(record.url),/\/webgl_models8\/ex3_/);
});
