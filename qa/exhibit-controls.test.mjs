import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { applyVowel, gentlyPerturb } from '../src/scenes/exhibit-controls.js';

test('vowel presets change the upstream audio target, not just the tongue drawing', () => {
  const html = readFileSync('public/vendor/pink-trombone/index.html', 'utf8');
  const context = vm.createContext({ sampleRate: 48000, UI: { touchesWithMouse: [] }, temp: {}, tractCanvas: {height:600} });
  vm.runInContext(html.slice(html.indexOf('Math.clamp ='), html.indexOf('var backCanvas =')) + html.slice(html.indexOf('var Tract ='), html.indexOf('function makeButton(')), context);
  context.Tract.init();
  const shapes = [];
  for (let i = 0; i < 3; i++) {
    applyVowel(context.Tract, context.TractUI, i);
    const target = Array.from(context.Tract.targetDiameter);
    assert.deepEqual(target, Array.from(context.Tract.restDiameter));
    for (let step = 0; step < 100; step++) context.Tract.reshapeTract(.01);
    assert.deepEqual(Array.from(context.Tract.diameter), target);
    assert.ok(target.every(v => Number.isFinite(v) && v > 0));
    shapes.push(target);
  }
  assert.notDeepEqual(shapes[0], shapes[1]);
  assert.notDeepEqual(shapes[1], shapes[2]);
  assert.ok(shapes[2].at(-1) < shapes[0].at(-1), 'rounded lips for 우');
});

test('Lenia stimulus preserves empty background and perturbs live cells by at most .02', () => {
  const field = Array.from({length:32}, (_,y) => Array.from({length:32}, (_,x) => Math.hypot(x-16,y-16)<8?.5:0));
  const before = structuredClone(field);
  assert.equal(gentlyPerturb(field,()=>.5), true);
  let changed = 0;
  field.forEach((row,y)=>row.forEach((value,x)=>{
    assert.ok(value>=before[y][x] && value-before[y][x]<=.0200001);
    if(before[y][x]===0)assert.equal(value,0);
    if(value!==before[y][x])changed++;
  }));
  assert.ok(changed>0);
  assert.equal(gentlyPerturb([[0,0],[0,0]]),false);
});
