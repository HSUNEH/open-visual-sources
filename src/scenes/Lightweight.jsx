import React,{useEffect,useRef,useState} from 'react';
import {assetUrl} from '../asset-url';
import {Slider} from './shared';

export default function Lightweight({kind,paused}){
  const map=kind==='mapgen',frame=useRef(null),pausedRef=useRef(paused),initialPaused=useRef(paused);pausedRef.current=paused;
  const [choice,setChoice]=useState(map?'mountain':'soft'),[ready,setReady]=useState(false),[error,setError]=useState(''),[value,setValue]=useState(map?90:40);
  const api=()=>frame.current?.contentWindow?.exhibit;
  useEffect(()=>{
    let connected=false;setReady(false);setError('');
    const timer=setInterval(()=>{const engine=api();const state=engine?.status();if(!state||(!map&&state.kind!==choice))return;if(!connected&&state.ready){engine.pause(pausedRef.current);if(map){engine.tool(choice);engine.size('medium');engine.rain(value/100);}else engine.stiffness(value);connected=true;}setReady(!!state.ready);setError(state.error||'');},250);
    const timeout=setTimeout(()=>{if(!connected)setError('작품을 불러오지 못했습니다. WebGL 지원 여부를 확인하거나 새로 생성해 주세요.');},15000);
    return()=>{clearInterval(timer);clearTimeout(timeout);};
  },[map,map?'map':choice]);
  useEffect(()=>{api()?.pause(paused);},[paused]);
  useEffect(()=>()=>api()?.dispose(),[]);
  const options=map?[['mountain','산맥'],['valley','평지'],['ocean','바다']]:[['soft','말랑한 토끼'],['cloth','천']];
  function select(id){if(id===choice)return;if(map){setChoice(id);api()?.tool(id);}else{api()?.dispose();setReady(false);setError('');setChoice(id);}}
  return <>
    <div className="work-controls original-presets"><div className="preset-options">{options.map(([id,label])=><button key={id} className={`control-button ${choice===id?'active':''}`} aria-pressed={choice===id} disabled={!ready&&!error} onClick={()=>select(id)}>{label}</button>)}</div></div>
    <div className={`stage ${map?'mapgen':'softphysics'}-stage`}><iframe key={map?'map':choice} ref={frame} src={`${assetUrl(`vendor/${map?'mapgen':'physics'}/exhibit.html`)}?v=1&kind=${map?'map':choice}&paused=${initialPaused.current?1:0}`} title={map?'Mapgen4 원본 지형 생성기':'Ten Minute Physics 원본 소프트바디와 천'}/>{(!ready||error)&&<div className="original-loading" role={error?'alert':'status'}>{error||'작은 규칙으로 장면을 만들고 있습니다'}</div>}<p className="lightweight-instruction">{map?'산맥·평지·바다 선택 → 지도 위 드래그':paused?'잠시 멈춤 · 재생하면 물리가 다시 움직입니다':'물체를 잡아 끌어 보세요 · 빈 곳은 시점 회전'}</p></div>
    <div className="work-controls lightweight-controls"><Slider label={map?'강수량':'단단함'} value={value} min={map?10:0} max={map?180:100} suffix="%" onChange={v=>{setValue(v);if(map)api()?.rain(v/100);else api()?.stiffness(v);}}/><div className="lightweight-actions">{!map&&<button className="control-button" disabled={!ready||paused} onClick={()=>api()?.impulse()}>{choice==='cloth'?'바람 한 번':'꾹 누르기'}</button>}<button className="control-button" disabled={!ready} onClick={()=>api()?.reset()}>{map?'그린 지형 되돌리기':'처음 모양으로'}</button></div><p className="control-note">{map?'지형을 그릴 때만 다시 계산합니다.':'가벼운 격자로 실제 변형을 계산합니다.'}<br/>{map?'강수량을 바꾸면 강줄기도 달라집니다.':'직접 잡아 늘린 뒤 놓아 보세요.'}</p></div>
  </>;
}
