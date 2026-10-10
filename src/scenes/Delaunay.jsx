import React, {useEffect,useRef,useState} from 'react';
import {Delaunay} from 'd3-delaunay';
import {canvasContext,random} from './shared';

export default function DelaunayStudy({seed,ink}) {
  const canvas=useRef(null),drag=useRef(-1),selected=useRef(-1);
  const [mode,setMode]=useState('cells'),[version,setVersion]=useState(0),[count,setCount]=useState(20);
  const nodes=useRef([]);
  function reset(value) { const rand=random(value); nodes.current=Array.from({length:20},()=>[.05+rand()*.9,.05+rand()*.9]);setCount(20);setVersion(v=>v+1); }
  useEffect(()=>reset(seed),[seed]);
  function draw() {
    const surface=canvasContext(canvas.current);if(!surface||!nodes.current.length)return;
    const {ctx,width,height}=surface;ctx.clearRect(0,0,width,height);
    const points=nodes.current.map(([x,y])=>[x*width,y*height]);
    const delaunay=Delaunay.from(points),voronoi=delaunay.voronoi([0,0,width,height]);
    const colors=['#aabca1','#cad4b4','#bdd09e','#d9dfca','#9cab8d','#c6cbaf'];
    for(let i=0;i<points.length;i++){ctx.beginPath();voronoi.renderCell(i,ctx);ctx.fillStyle=colors[i%colors.length];ctx.fill();}
    ctx.strokeStyle='#e5ead9';ctx.lineWidth=2;ctx.beginPath();voronoi.render(ctx);ctx.stroke();
    if(mode==='triangles'){ctx.strokeStyle=ink;ctx.lineWidth=1.4;ctx.beginPath();delaunay.render(ctx);ctx.stroke();}
    points.forEach(([x,y],i)=>{ctx.fillStyle=i===selected.current?'#fff':ink;ctx.strokeStyle=ink;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,i===selected.current?7:4,0,Math.PI*2);ctx.fill();ctx.stroke();});
  }
  useEffect(()=>{draw();const observer=new ResizeObserver(draw);observer.observe(canvas.current);return()=>observer.disconnect();},[version,mode,ink]);
  function position(event){const r=canvas.current.getBoundingClientRect();return [(event.clientX-r.left)/r.width,(event.clientY-r.top)/r.height];}
  function down(event){
    event.preventDefault();canvas.current.focus();const p=position(event),r=canvas.current.getBoundingClientRect();
    let nearest=-1,best=18;
    nodes.current.forEach((v,i)=>{const d=Math.hypot((v[0]-p[0])*r.width,(v[1]-p[1])*r.height);if(d<best){best=d;nearest=i;}});
    if(mode==='erase'){if(nearest>=0&&nodes.current.length>3)nodes.current.splice(nearest,1);selected.current=-1;}
    else {if(nearest<0&&nodes.current.length<150){nodes.current.push(p);nearest=nodes.current.length-1;}drag.current=selected.current=nearest;canvas.current.setPointerCapture(event.pointerId);}
    setCount(nodes.current.length);setVersion(v=>v+1);
  }
  function move(event){if(drag.current<0)return;nodes.current[drag.current]=position(event).map(v=>Math.max(.005,Math.min(.995,v)));draw();}
  function keys(event){
    if(event.key==='Enter'&&nodes.current.length<150){nodes.current.push([.5,.5]);selected.current=nodes.current.length-1;}
    else if((event.key==='Delete'||event.key==='Backspace')&&selected.current>=0&&nodes.current.length>3){nodes.current.splice(selected.current,1);selected.current=-1;}
    else if(event.key.startsWith('Arrow')&&selected.current>=0){event.stopPropagation();const p=nodes.current[selected.current];p[0]=Math.max(.01,Math.min(.99,p[0]+(event.key==='ArrowRight'?.015:event.key==='ArrowLeft'?-.015:0)));p[1]=Math.max(.01,Math.min(.99,p[1]+(event.key==='ArrowDown'?.015:event.key==='ArrowUp'?-.015:0)));}
    else return;
    event.preventDefault();setCount(nodes.current.length);setVersion(v=>v+1);
  }
  return <><div className="work-controls original-presets"><div className="preset-options">{[['cells','영역 보기'],['triangles','삼각망 보기'],['erase','점 지우기']].map(([id,label])=><button key={id} className={`control-button ${mode===id?'active':''}`} aria-pressed={mode===id} onClick={()=>setMode(id)}>{label}</button>)}</div></div><div className="stage delaunay-stage"><canvas ref={canvas} tabIndex={0} aria-label="보로노이 편집기. 빈 곳 클릭으로 점 추가, 점 드래그로 이동. Enter 추가, 방향키 이동, Delete 삭제." onPointerDown={down} onPointerMove={move} onPointerUp={()=>drag.current=-1} onPointerCancel={()=>drag.current=-1} onKeyDown={keys}/><p className="scene-instruction">빈 곳에 점 추가 · 점을 잡아 드래그 · 각 색은 가장 가까운 점의 영역</p></div><div className="work-controls"><button className="control-button" onClick={()=>reset(crypto.getRandomValues(new Uint32Array(1))[0])}>점 다시 배치</button><p className="control-note" aria-live="polite">{count}개의 점 · 최대 150개<br/>삼각망 보기로 보로노이와 Delaunay의 관계를 비교하세요.</p></div></>;
}
