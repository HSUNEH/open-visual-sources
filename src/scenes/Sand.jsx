import { Controls } from './Controls';
import React,{useEffect,useRef,useState} from 'react';
import {createSand,renderSand} from './sand-engine';
import {assetUrl} from '../asset-url';
import {Slider,useLoop,random} from './shared';

const materials=[[2,'모래'],[3,'물'],[6,'불'],[7,'나무'],[11,'식물'],[9,'얼음'],[13,'돌'],[0,'지우개']];
export default function Sand({paused,seed}) {
  const canvas=useRef(null),engine=useRef(null),drawing=useRef(null),accumulator=useRef(0);
  const [ready,setReady]=useState(false),[error,setError]=useState(''),[material,setMaterial]=useState(2),[brush,setBrush]=useState(10),[preset,setPreset]=useState(0);
  function draw() {
    if(!engine.current||!canvas.current)return;
    const e=engine.current,ctx=canvas.current.getContext('2d'),pixels=ctx.createImageData(e.width,e.height);
    renderSand(e.cells(),e.width,e.height,pixels.data);ctx.putImageData(pixels,0,0);
  }
  function reset(index=0) {
    const e=engine.current;if(!e)return;
    e.reset();setPreset(index);const rand=random(seed),{width:w,height:h}=e;
    for(let x=0;x<w;x+=3)e.paint(x,h-4,8,13);
    if(index===0) {
      for(let y=h-28;y<h-8;y+=4)for(let x=6;x<w-6;x+=4)e.paint(x,y,7,3);
      for(let y=15;y<48;y+=4)for(let x=32;x<76;x+=4)e.paint(x+rand()*4,y,5,2);
      for(let x=106;x<156;x+=4)e.paint(x,67,7,7);
      for(let y=50;y<67;y+=4)for(let x=110;x<154;x+=4)e.paint(x,y,5,9);
    } else {
      for(let y=h-27;y<h-8;y+=4)for(let x=6;x<w-6;x+=4)e.paint(x,y,7,3);
      for(let x=20;x<w-15;x+=30) {
        for(let y=h-34;y>h-70;y-=3)e.paint(x,y,5,7);
        e.paint(x,h-72,13,11);
      }
      for(let x=10;x<w-10;x+=6)e.paint(x,h-31,6,2);
    }
    draw();
  }
  useEffect(()=>{
    let alive=true;
    (async()=>{try {
      const response=await fetch(assetUrl('vendor/sandspiel/sandspiel.wasm'));if(!response.ok)throw Error();
      const e=await createSand(await response.arrayBuffer());
      if(!alive){e.dispose();return;}engine.current=e;reset();setReady(true);
    }catch{if(alive)setError('모래 실험을 불러오지 못했습니다. 새로 생성해 주세요.');}})();
    return()=>{alive=false;engine.current?.dispose();engine.current=null;};
  },[seed]);
  useLoop((_,dt)=>{
    if(!engine.current)return;
    accumulator.current+=dt;
    if(drawing.current)engine.current.paint(drawing.current.x,drawing.current.y,brush,material);
    while(accumulator.current>=1/45){engine.current.tick();accumulator.current-=1/45;}
    draw();
  },paused);
  function point(event) {const r=canvas.current.getBoundingClientRect();return{x:(event.clientX-r.left)/r.width*192,y:(event.clientY-r.top)/r.height*128};}
  function paint(event) {
    if(!engine.current||!drawing.current)return;
    const next=point(event),old=drawing.current,steps=Math.max(1,Math.ceil(Math.hypot(next.x-old.x,next.y-old.y)/2));
    for(let i=1;i<=steps;i++)engine.current.paint(old.x+(next.x-old.x)*i/steps,old.y+(next.y-old.y)*i/steps,brush,material);
    drawing.current=next;draw();
  }
  return <>
    <div className="work-controls original-presets"><div className="preset-options">{['모래와 얼음','작은 숲'].map((name,i)=><button className={`control-button ${preset===i?'active':''}`} key={name} aria-pressed={preset===i} disabled={!ready} onClick={()=>reset(i)}>{name}</button>)}</div></div>
    <div className="stage sand-stage"><canvas ref={canvas} width="192" height="128" aria-label="모래, 물, 불을 그려 넣는 Sandspiel 실험" onPointerDown={event=>{if(!ready)return;event.currentTarget.setPointerCapture(event.pointerId);drawing.current=point(event);paint(event);}} onPointerMove={paint} onPointerUp={()=>drawing.current=null} onPointerCancel={()=>drawing.current=null} onLostPointerCapture={()=>drawing.current=null}/>{!ready&&<div className="original-loading" role={error?'alert':'status'}>{error||'모래와 물의 규칙을 불러오고 있습니다'}</div>}
    <Controls className="sand-materials" aria-label="그릴 물질">{materials.map(([id,name])=><button key={id} className={`control-button ${material===id?'active':''}`} aria-pressed={material===id} disabled={!ready} onClick={()=>setMaterial(id)}>{name}</button>)}</Controls></div>
    <Controls className="work-controls"><Slider label="붓 크기" value={brush} min={2} max={26} onChange={setBrush}/><p className="control-note">물질을 고르고 화면에 그려 보세요.<br/>모래는 가라앉고, 불은 나무를 태웁니다.</p><button className="control-button" disabled={!ready} onClick={()=>{engine.current.paint(133,60,23,6);draw();}}>얼음 옆에 불 놓기</button></Controls>
  </>;
}
