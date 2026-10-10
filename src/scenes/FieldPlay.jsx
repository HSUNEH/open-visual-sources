import React,{useEffect,useRef,useState} from 'react';
import {assetUrl} from '../asset-url';
import {Slider} from './shared';
const fields=[
  ['소용돌이 격자','v.x = cos(p.y); v.y = sin(p.x);','서로 반대 방향으로 도는 작은 소용돌이들'],
  ['꽃잎의 궤도','float a = atan(p.y,p.x); float r = length(p); v = vec2(-p.y,p.x) * 0.28 + normalize(p + vec2(0.001)) * sin(a * 6.0 + r) * 1.4;','회전과 여섯 갈래의 힘이 만나는 궤도'],
  ['흐르는 물결','v.x = 1.4 + sin(p.y*1.8); v.y = sin(p.x*1.2) * 0.9;','가로 흐름을 가르는 반복되는 파동'],
];
export default function FieldPlay({paused}) {
  const frame=useRef(null),pausedRef=useRef(paused);pausedRef.current=paused;
  const [choice,setChoice]=useState(0),[speed,setSpeed]=useState(20),[ready,setReady]=useState(false),[error,setError]=useState('');
  const query=new URLSearchParams({code:fields[0][1],pc:'65536',dt:'.02',fo:'.985',dp:'.002',cm:'1',cx:'0',cy:'0',w:'14',h:'9'});
  useEffect(()=>{
    const timer=setInterval(()=>{
      const scene=frame.current?.contentWindow?.scene;
      if(scene){
        scene.vectorFieldEditorState.setCode(`vec2 get_velocity(vec2 p) { vec2 v = vec2(0.0); ${fields[0][1]} return v; }`);
        scene.setPaused(pausedRef.current);setReady(true);clearInterval(timer);
      }
    },100);
    const timeout=setTimeout(()=>{clearInterval(timer);if(!frame.current?.contentWindow?.scene)setError('벡터장을 시작하지 못했습니다. WebGL을 지원하는 브라우저에서 새로 생성해 주세요.');},15000);
    return()=>{clearInterval(timer);clearTimeout(timeout);frame.current?.contentWindow?.scene?.dispose();};
  },[]);
  useEffect(()=>{frame.current?.contentWindow?.scene?.setPaused(paused);},[paused]);
  function select(index) {
    setChoice(index);
    const scene=frame.current?.contentWindow?.scene;
    scene?.vectorFieldEditorState.setCode(`vec2 get_velocity(vec2 p) { vec2 v = vec2(0.0); ${fields[index][1]} return v; }`);
  }
  return <><div className="work-controls original-presets"><div className="preset-options">{fields.map(([name],i)=><button key={name} className={`control-button ${choice===i?'active':''}`} aria-pressed={choice===i} disabled={!ready} onClick={()=>select(i)}>{name}</button>)}</div></div>
    <div className="stage field-stage"><iframe ref={frame} src={`${assetUrl('vendor/fieldplay/exhibit.html')}?${query}`} title="Field Play 원본 GPU 벡터장"/>{!ready&&<div className="original-loading" role={error?'alert':'status'}>{error||'65,536개의 입자가 흐를 길을 계산하고 있습니다'}</div>}</div>
    <div className="work-controls"><Slider label="흐름 속도" value={speed} min={4} max={60} onChange={value=>{setSpeed(value);frame.current?.contentWindow?.scene?.setIntegrationTimeStep(value/1000);}}/><p className="control-note">{fields[choice][2]}.<br/>드래그로 공간 이동 · 65,536개의 입자</p></div>
  </>;
}
