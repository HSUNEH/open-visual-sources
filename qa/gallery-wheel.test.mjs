import test from 'node:test';
import assert from 'node:assert/strict';
import {createWheelGesture, wheelIntent} from '../src/gallery-wheel.js';
const move=(state,input,time)=>wheelIntent(state,input,time,1440,900);

test('one small wheel notch advances a work instead of snapping back',()=>{
  assert.deepEqual(move(createWheelGesture(),{y:110},0),{axis:'work',direction:1});
});
test('trackpad accumulates tiny deltas and consumes the entire inertial tail',()=>{
  const state=createWheelGesture();
  for(let i=0;i<7;i++)assert.equal(move(state,{y:5},i*16),null);
  assert.deepEqual(move(state,{y:5},112),{axis:'work',direction:1});
  for(let time=128;time<1800;time+=16)assert.equal(move(state,{y:3},time),null);
  assert.deepEqual(move(state,{y:80},2200),{axis:'work',direction:1});
});
test('native gallery and iframe events share a gesture across a scene change',()=>{
  const state=createWheelGesture();
  assert.deepEqual(move(state,{x:0,y:100},0),{axis:'work',direction:1});
  assert.equal(move(state,{x:0,y:110,mode:0,shift:false},20),null);
  assert.deepEqual(move(state,{y:-100},900),{axis:'work',direction:-1});
});
test('horizontal, shift, line and page wheel modes preserve intent',()=>{
  assert.deepEqual(move(createWheelGesture(),{x:70,y:10},0),{axis:'theme',direction:1});
  assert.deepEqual(move(createWheelGesture(),{y:-70,shift:true},0),{axis:'theme',direction:-1});
  assert.deepEqual(move(createWheelGesture(),{y:3,mode:1},0),{axis:'work',direction:1});
  assert.deepEqual(move(createWheelGesture(),{y:-1,mode:2},0),{axis:'work',direction:-1});
});
test('separate sub-threshold movements do not accumulate indefinitely',()=>{
  const state=createWheelGesture();
  assert.equal(move(state,{y:25},0),null);
  assert.equal(move(state,{y:25},500),null);
  assert.equal(move(state,{y:NaN},520),null);
});
