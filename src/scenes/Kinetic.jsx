import { Controls } from './Controls';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Matter from 'matter-js';
import { interpolate } from 'flubber';
import { Slider, canvasContext, random, useLoop } from './shared';

function Physics({ paused, seed }) {
  const canvas = useRef(null), engine = useRef(null), mouse = useRef(null);
  const [gravity, setGravity] = useState(50);
  const [experiment,setExperiment]=useState('cradle');
  const rand = useMemo(() => random(seed), [seed]);
  const size = useRef({ width: 0, height: 0 });
  const colors = ['#8b9467', '#b88c61', '#cbc083', '#738272', '#494d37'];
  const add = (x, y) => {
    const radius = 12 + rand() * 17;
    const options = { restitution: .65, friction: .25, render: { fillStyle: colors[Math.floor(rand() * colors.length)] } };
    const body = rand() > .5 ? Matter.Bodies.circle(x, y, radius, options) : Matter.Bodies.polygon(x, y, 5 + Math.floor(rand() * 3), radius, options);
    if (engine.current) {
      const dynamic = Matter.Composite.allBodies(engine.current.world).filter(b => !b.isStatic);
      if (dynamic.length > 55) Matter.Composite.remove(engine.current.world, dynamic[0]);
      Matter.Composite.add(engine.current.world, body);
    }
  };
  useEffect(() => {
    const s = canvasContext(canvas.current); if (!s) return;
    const e = Matter.Engine.create(); engine.current = e; e.gravity.y = gravity / 50;
    function boundaries(width, height) {
      const old = Matter.Composite.allBodies(e.world).filter(b => b.isStatic); Matter.Composite.remove(e.world, old);
      Matter.Composite.add(e.world, [Matter.Bodies.rectangle(width / 2, height + 25, width + 100, 50, { isStatic: true }), Matter.Bodies.rectangle(-25, height / 2, 50, height * 4, { isStatic: true }), Matter.Bodies.rectangle(width + 25, height / 2, 50, height * 4, { isStatic: true })]);
      size.current = { width, height };
    }
    boundaries(s.width, s.height);
    const m = Matter.Mouse.create(canvas.current); m.pixelRatio = Math.min(devicePixelRatio || 1, 2); mouse.current = m;
    canvas.current.removeEventListener('wheel', m.mousewheel); canvas.current.removeEventListener('mousewheel', m.mousewheel); canvas.current.removeEventListener('DOMMouseScroll', m.mousewheel);
    const constraint = Matter.MouseConstraint.create(e, { mouse: m, constraint: { stiffness: .16, render: { visible: false } } });
    Matter.Composite.add(e.world, constraint);
    if(experiment==='cradle'){
      const radius=Math.min(28,s.width/16),length=s.height*.52,start=s.width/2-radius*4.1;
      for(let i=0;i<5;i++){
        const ball=Matter.Bodies.circle(start+i*radius*2.05,s.height*.16+length,radius,{restitution:.995,friction:0,frictionAir:.0001,slop:.001,label:'pendulum',render:{fillStyle:colors[i]}});
        const rope=Matter.Constraint.create({pointA:{x:start+i*radius*2.05,y:s.height*.16},bodyB:ball,length,stiffness:1,label:'rope'});
        Matter.Composite.add(e.world,[ball,rope]);
        if(i===0)Matter.Body.setPosition(ball,{x:start-length*.65,y:s.height*.16+length*.76});
      }
    } else for (let i=0;i<16;i++) Matter.Composite.add(e.world,Matter.Bodies.rectangle(s.width*.15+i*s.width*.043,s.height-42,Math.max(7,s.width*.012),80,{restitution:.15,friction:.5,render:{fillStyle:colors[i%5]}}));
    // Arrange a useful still for viewers who prefer reduced motion.
    if(experiment!=='cradle') for (let i = 0; i < 25; i++) Matter.Engine.update(e, 1000 / 60);
    const observer = new ResizeObserver(() => { const current = canvasContext(canvas.current); if (current) boundaries(current.width, current.height); }); observer.observe(canvas.current);
    return () => { observer.disconnect(); Matter.Mouse.setElement(m, document.createElement('canvas')); Matter.Composite.clear(e.world, false); Matter.Engine.clear(e); engine.current = null; };
  }, [seed,experiment]);
  useEffect(() => { if (engine.current) engine.current.gravity.y = gravity / 50; }, [gravity]);
  useLoop((_, delta) => {
    if (!engine.current) return;
    if (delta) Matter.Engine.update(engine.current, Math.min(delta * 1000, 1000 / 60));
    const s = canvasContext(canvas.current); if (!s) return;
    const { ctx, width, height } = s; ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle='#45432988';ctx.lineWidth=1.2;
    for(const rope of Matter.Composite.allConstraints(engine.current.world))if(rope.label==='rope'){ctx.beginPath();ctx.moveTo(rope.pointA.x,rope.pointA.y);ctx.lineTo(rope.bodyB.position.x,rope.bodyB.position.y);ctx.stroke();}
    for (const body of Matter.Composite.allBodies(engine.current.world)) {
      if (body.isStatic) continue;
      ctx.fillStyle = body.render.fillStyle; ctx.beginPath();
      if (body.circleRadius) ctx.arc(body.position.x, body.position.y, body.circleRadius, 0, Math.PI * 2);
      else body.vertices.forEach((v, i) => i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y));
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#e8e6cf77'; ctx.lineWidth = 1; ctx.stroke();
    }
  }, paused);
  return <><div className="work-controls original-presets"><div className="preset-options">{[['cradle','뉴턴의 진자'],['domino','도미노']].map(([id,label])=><button key={id} className={`control-button ${experiment===id?'active':''}`} aria-pressed={experiment===id} onClick={()=>setExperiment(id)}>{label}</button>)}</div></div><div className="stage physics-stage"><canvas ref={canvas} aria-label="Matter.js로 움직이는 물체. 빈 곳을 클릭하면 새 물체가 떨어집니다." onPointerDown={event => {
    const r = event.currentTarget.getBoundingClientRect(), point = { x: event.clientX - r.left, y: event.clientY - r.top };
    if (engine.current && !Matter.Query.point(Matter.Composite.allBodies(engine.current.world), point).length) add(point.x, point.y);
  }}/></div><Controls className="work-controls"><Slider label="중력" value={gravity} onChange={setGravity} min={0} max={100}/><button className="control-button" disabled={paused} onClick={() => {const body=Matter.Composite.allBodies(engine.current.world).find(b=>!b.isStatic);if(body)Matter.Body.setVelocity(body,{x:experiment==='cradle'?-12:5,y:0});}}>첫 물체 밀기</button><p className="control-note">{experiment==='cradle'?'한쪽 진자를 당겨 놓으면 반대편으로 운동량이 전달됩니다.':'첫 물체를 밀어 연쇄적으로 쓰러뜨려 보세요.'}</p></Controls></>;
}

function flower(points, radius, amplitude, frequency) {
  return Array.from({ length: points }, (_, i) => { const a = i / points * Math.PI * 2, r = radius + amplitude * Math.cos(a * frequency); return `${i ? 'L' : 'M'}${200 + Math.cos(a) * r},${200 + Math.sin(a) * r}`; }).join(' ') + 'Z';
}
function Morph({ paused, seed }) {
  const [speed, setSpeed] = useState(35);
  const [manual,setManual]=useState(false),[blend,setBlend]=useState(0);
  const dragPointer=useRef(null);
  function dragShape(event) {
    const rect=event.currentTarget.getBoundingClientRect();
    setBlend(Math.round(Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width))*100));
  }
  function endDrag(event) {
    if(dragPointer.current!==event.pointerId)return;
    dragPointer.current=null;
    if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
  }
  const paths = useRef([]);
  const interpolators = useMemo(() => {
    const shapes = [flower(96, 110, 33, 5), flower(96, 125, 15, 3), flower(96, 105, 37, 8), flower(96, 123, 0, 1)];
    return shapes.map((shape, i) => interpolate(shape, shapes[(i + 1) % shapes.length], { maxSegmentLength: 5 }));
  }, [seed]);
  function draw(time) {
    const t = manual ? blend/100*(interpolators.length-1) : time * speed / 110 + seed%4;
    if(manual)time=0;
    paths.current.forEach((path, i) => { if (!path) return; const phase = t + i * .12, n = Math.floor(phase), fraction = phase - n; const smooth = fraction * fraction * (3 - 2 * fraction); path.setAttribute('d', interpolators[n % interpolators.length](smooth)); path.setAttribute('transform', `rotate(${time * 4 + i * 9},200,200)`); });
  }
  useLoop(draw, paused || manual);
  useEffect(() => { if (manual) draw(0); }, [manual, blend]);
  return <><div className="stage morph-stage"><svg viewBox="0 0 400 400" role="img" tabIndex={0} aria-label="좌우로 드래그해 변형하는 Flubber 윤곽. 방향키로도 조절할 수 있습니다."
    onPointerDown={event=>{if(event.button!==0||dragPointer.current!==null)return;event.preventDefault();dragPointer.current=event.pointerId;event.currentTarget.setPointerCapture(event.pointerId);event.currentTarget.focus();setManual(true);dragShape(event);}}
    onPointerMove={event=>{if(dragPointer.current===event.pointerId)dragShape(event);}}
    onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={()=>dragPointer.current=null} onBlur={()=>dragPointer.current=null}
    onKeyDown={event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();event.stopPropagation();setManual(true);setBlend(v=>event.key==='Home'?0:event.key==='End'?100:Math.max(0,Math.min(100,v+(event.key==='ArrowRight'?5:-5))));}}
  >{[0, 1, 2, 3].map(i => <path key={i} ref={node => paths.current[i] = node} fill={i === 3 ? '#345d68' : 'none'} stroke="#345d68" strokeWidth={.9} opacity={i === 3 ? 1 : .18 + i * .15}/>)}</svg><p className="scene-instruction">그림을 좌우로 드래그해 직접 변형하세요</p></div><Controls className="work-controls"><button className={`control-button ${manual?'active':''}`} onClick={()=>setManual(v=>!v)}>{manual?'자동 변화로 전환':'내 손으로 변형'}</button>{manual?<Slider label="형태 보간" value={blend} onChange={setBlend} min={0} max={100} suffix="%"/>:<Slider label="형태 변화 속도" value={speed} onChange={setSpeed} min={5} max={80}/>}<p className="control-note">그림을 직접 드래그하거나 슬라이더로 조절하세요. 일시정지 중에도 변형할 수 있습니다.</p></Controls></>;
}
export default function Kinetic(props) { return props.kind === 'physics' ? <Physics {...props}/> : <Morph {...props}/>; }
