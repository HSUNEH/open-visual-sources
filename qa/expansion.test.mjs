import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import wfc from 'wavefunctioncollapse';
import {createSand,renderSand} from '../src/scenes/sand-engine.js';
import {random} from '../src/scenes/shared-random.js';

test('official Sandspiel WASM conserves sand and gravity moves it down in still air',async()=>{
  const engine=await createSand(await readFile('public/vendor/sandspiel/sandspiel.wasm'),32,32);
  try {
    engine.paint(10,3,4,2);
    function stats(){let mass=0,moment=0;const cells=engine.cells();for(let x=0;x<32;x++)for(let y=0;y<32;y++)if(cells[(x*32+y)*4]===2){mass++;moment+=y;}return{mass,moment};}
    const before=stats();for(let i=0;i<16;i++)engine.tick();const after=stats();
    assert.equal(after.mass,before.mass);assert.ok(after.moment>before.moment+100);
    const pixels=new Uint8ClampedArray(32*32*4);renderSand(engine.cells(),32,32,pixels);
    assert.equal(pixels[3],255);assert.equal(pixels[0],24);
    engine.reset();assert.equal(stats().mass,0);
  }finally{engine.dispose();}
});
test('WFC iterates real constraints, completes and produces deterministic valid pixels',()=>{
  const pixels=new Uint8Array(8*8*4);
  for(let y=0;y<8;y++)for(let x=0;x<8;x++){const i=(y*8+x)*4;pixels[i]=pixels[i+1]=pixels[i+2]=((x+y)%2)*255;pixels[i+3]=255;}
  function solve(){const model=new wfc.OverlappingModel(pixels,8,8,2,24,16,true,false,8);model.initialize();model.clear();const rng=random(42);let count=0;while(!model.isGenerationComplete()&&count++<1000)assert.equal(model.iterate(7,rng),true);assert.ok(model.isGenerationComplete());return model.graphics();}
  const a=solve(),b=solve();assert.deepEqual(a,b);
  for(let y=0;y<16;y++)for(let x=1;x<24;x++)assert.notEqual(a[(y*24+x)*4],a[(y*24+x-1)*4]);
});
