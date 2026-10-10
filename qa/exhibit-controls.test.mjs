import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { applyVowel, perturbLenia } from '../src/scenes/exhibit-controls.js';

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

test('Lenia stimulus visibly deforms real cells while preserving mass and bounds', () => {
  const field = Array.from({length:32}, (_,y) => Array.from({length:32}, (_,x) => Math.hypot(x-16,y-16)<8?.5:0));
  const before = structuredClone(field);
  assert.equal(perturbLenia(field,()=>.5), true);
  let changed = 0, beforeMass = 0, afterMass = 0;
  field.forEach((row,y)=>row.forEach((value,x)=>{
    assert.ok(value>=0 && value<=1);
    beforeMass += before[y][x]; afterMass += value;
    if(value!==before[y][x])changed++;
  }));
  assert.ok(changed>30, 'the effect must exceed a tiny colour change');
  assert.equal(afterMass, beforeMass);
  assert.equal(perturbLenia([[0,0],[0,0]]),false);
});

test('all three upstream Lenia species survive a visible stimulus for 300 generations', () => {
  const html = readFileSync('public/vendor/lenia/Lenia.html', 'utf8');
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)].map(m=>m[1]).filter(s=>!s.includes('document.addEventListener'));
  const forms = readFileSync('public/vendor/lenia/Lenia-LifeForms.js', 'utf8');
  const stubNames = ['PlotSurface','InitAllCanvas','ResetCounters','ResetStat','PositionCube','RefreshPlot','ShowOptions','ShowCounters','HighlightItem','DrawAllPanels','DrawAllGraphs','DrawSwatches','ShowCalculation'];
  // Run the vendored solver in a closure, with only its UI calls stubbed.
  const simulator = new Function('window','document','GIFEncoder', forms+'\n'+scripts.join('\n')+'\n'+stubNames.map(name=>`${name}=function(){};`).join('\n')+`\nreturn {
    preset(code) { PresetAnimal({fsize:7,animalCode:code}); TransformField(0,0,2,0,0); optCenter=Center_POS; },
    get field() { return field; },
    step() { NextGen(); CalcMoments(); }
  };`)({}, {querySelectorAll:()=>[],getElementById:()=>({})},function(){});
  for (const code of ['OG2','O2(a)','3G']) for (const direction of [.25,.75]) {
    simulator.preset(code);
    const before = simulator.field.map(row=>row.slice());
    const mass = before.flat().reduce((a,b)=>a+b,0);
    perturbLenia(simulator.field,()=>direction);
    let difference = 0;
    simulator.field.forEach((row,y)=>row.forEach((v,x)=>{difference+=Math.abs(v-before[y][x]);}));
    assert.ok(difference/mass>.1, `${code}: visible deformation`);
    for (let i=0;i<300;i++) simulator.step();
    const remaining = simulator.field.flat().reduce((a,b)=>a+b,0);
    assert.ok(remaining/mass>.4 && remaining<128*128*.5, `${code}: mass ${mass} → ${remaining}`);
  }
});
