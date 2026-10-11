import { Controls } from './Controls';
import React,{useEffect,useRef,useState} from 'react';
import {assetUrl} from '../asset-url';
import {Slider} from './shared';
const presets=[['lizard','도마뱀'],['butterfly','나비'],['ladybug','무당벌레']];
export default function NeuralCA({paused}){
  const frame=useRef(null),initialPaused=useRef(paused),pausedRef=useRef(paused);pausedRef.current=paused;
  const [choice,setChoice]=useState('lizard'),[ready,setReady]=useState(false),[error,setError]=useState(''),[size,setSize]=useState(8),[speed,setSpeed]=useState(1),[steps,setSteps]=useState(0);
  const settings=useRef({size,speed});settings.current={size,speed};
  const api=()=>frame.current?.contentWindow?.exhibit;
  useEffect(()=>{let connected=false;const timer=setInterval(()=>{const engine=api();if(!engine)return;const state=engine.status();if(!connected){engine.pause(pausedRef.current);engine.speed(settings.current.speed);engine.size(settings.current.size);connected=true;}setReady(state.ready);setError(state.error);setSteps(state.steps);},250);const timeout=setTimeout(()=>{if(!api())setError('복원 엔진을 불러오지 못했습니다. WebGL을 지원하는 브라우저에서 새로 생성해 주세요.');},15000);return()=>{clearInterval(timer);clearTimeout(timeout);api()?.dispose();};},[]);
  useEffect(()=>{api()?.pause(paused);},[paused]);
  function select(id){setChoice(id);setReady(false);setError('');api()?.select(id);}
  return <><div className="work-controls original-presets"><div className="preset-options">{presets.map(([id,name])=><button key={id} className={`control-button ${choice===id?'active':''}`} aria-pressed={choice===id} disabled={!ready&&!error} onClick={()=>select(id)}>{name}</button>)}</div></div>
    <div className="stage nca-stage"><iframe ref={frame} src={`${assetUrl('vendor/nca/exhibit.html')}?v=growth-speed-1&paused=${initialPaused.current?1:0}`} title="NCA 원본 신경망 — 지우면 스스로 복원되는 그림"/>{(!ready||error)&&<div className="original-loading" role={error?'alert':'status'}>{error||'복원을 학습한 작은 신경망을 불러오고 있습니다'}</div>}<p className="nca-instruction">{paused?'잠시 멈춤 · 재생하면 다시 자랍니다':steps<100?'하나의 씨앗에서 자라는 중':'그림을 드래그해서 지워 보세요'}</p></div>
    <Controls className="work-controls nca-controls"><div className="nca-speed"><Slider label="세포 성장 속도" value={speed} min={.25} max={4} step={.25} suffix="×" onChange={value=>{setSpeed(value);api()?.speed(value);}}/></div><Slider label="지우개 크기" value={size} min={3} max={14} onChange={value=>{setSize(value);api()?.size(value);}}/><div className="nca-actions"><button className="control-button" disabled={!ready} onClick={()=>api()?.damage()}>한 조각 지우기</button><button className="control-button" disabled={!ready} onClick={()=>api()?.reset()}>씨앗부터 다시</button></div><p className="control-note">느리게 자라는 과정부터 빠른 복원까지.<br/>전부 지웠다면 ‘씨앗부터 다시’를 눌러 주세요.</p></Controls>
  </>;
}
