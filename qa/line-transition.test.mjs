import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceLineTransition, sampleLineArtwork, lineParticle } from '../src/scenes/line-transition.js';
import { enableFluidHover } from '../src/scenes/exhibit-controls.js';

test('ln has a 3-second cycle with one-second particle flight and freezes at delta zero',()=>{
  const state={phase:'hold',elapsed:0};
  advanceLineTransition(state,2,true); assert.equal(state.phase,'out');
  const moving=advanceLineTransition(state,.2,true); assert.ok(moving.progress>0);
  const frozen={...state}; advanceLineTransition(state,0,true); assert.deepEqual(state,frozen);
  assert.equal(advanceLineTransition(state,.25,true).swap,true);
  assert.equal(state.phase,'in');
  advanceLineTransition(state,.55,true); assert.equal(state.phase,'hold');
});
test('ln waits for a prepared scene and reduced motion skips scattering',()=>{
  const state={phase:'hold',elapsed:0};
  assert.equal(advanceLineTransition(state,3,false).progress,0);
  const reduced=advanceLineTransition({phase:'hold',elapsed:0},3,true,true);
  assert.deepEqual(reduced,{swap:true,progress:0});
});
test('particles sample real strokes, remain continuous at the swap and land exactly',()=>{
  const from=sampleLineArtwork('<polyline points="0,0 100,0 100,100"/>',100);
  const to=sampleLineArtwork('<polyline points="100,100 200,100 200,200"/>',100);
  assert.equal(from.length,200);
  for(let i=0;i<100;i++) {
    assert.ok(from[i*2+1]===0 || from[i*2]===100);
    assert.deepEqual(lineParticle(from,to,i,0),[from[i*2],from[i*2+1]]);
    const last=lineParticle(from,to,i,1);
    assert.ok(Math.hypot(last[0]-to[i*2],last[1]-to[i*2+1])<1e-9);
    const a=lineParticle(from,to,i,.45-1e-7),b=lineParticle(from,to,i,.45+1e-7);
    assert.ok(Math.hypot(a[0]-b[0],a[1]-b[1])<.001);
  }
});
test('Fluid hover arms mouse movement without a click, ignores touch and respects pause',()=>{
  const events=new Map(),pointer={down:false,moved:false};let paused=false,starts=0;
  const canvas={width:800,height:400,getBoundingClientRect:()=>({left:10,top:20,width:400,height:200}),addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:name=>events.delete(name)};
  const cleanup=enableFluidHover(canvas,pointer,(p,id,x,y)=>{starts++;p.down=true;p.x=x;p.y=y},p=>p.down=false,()=>paused);
  events.get('pointerenter')({pointerType:'touch',clientX:20,clientY:30});assert.equal(starts,0);
  events.get('pointerenter')({pointerType:'mouse',clientX:20,clientY:30});assert.equal(starts,1);assert.equal(pointer.x,20);
  events.get('mousemove')({clientX:30,clientY:40});assert.equal(starts,1);
  events.get('pointerleave')();assert.equal(pointer.down,false);
  paused=true;events.get('mousemove')({clientX:30,clientY:40});assert.equal(starts,1);
  paused=false;events.get('mousemove')({clientX:30,clientY:40});assert.equal(starts,2);
  cleanup();assert.equal(events.size,0);
});
