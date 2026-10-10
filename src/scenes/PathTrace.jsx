import React,{useEffect,useRef,useState} from 'react';
import {assetUrl} from '../asset-url';
import {makeDocument} from './Originals';
import {Slider} from './shared';
const materials=[['Transparent Refractive','유리'],['Gold Metal','금'],['Copper Metal','구리']];
export default function PathTrace({paused}){
  const frame=useRef(null),pausedRef=useRef(paused);pausedRef.current=paused;
  const [source,setSource]=useState(''),[ready,setReady]=useState(false),[error,setError]=useState(''),[choice,setChoice]=useState(0),[position,setPosition]=useState(0);
  const api=()=>frame.current?.contentWindow?.exhibit;
  useEffect(()=>{let alive=true;(async()=>{try{const response=await fetch(assetUrl('vendor/pathtrace/Material_Roughness.html'));if(!response.ok)throw Error();const html=await response.text();if(alive)setSource(makeDocument(html,'pathtrace'));}catch{if(alive)setError('광선 추적기를 불러오지 못했습니다. 새로 생성해 주세요.');}})();return()=>{alive=false;};},[]);
  useEffect(()=>{if(!source)return;const timer=setInterval(()=>{if(api()){api().pause(pausedRef.current);setReady(true);clearInterval(timer);}},100);const timeout=setTimeout(()=>{clearInterval(timer);if(!api())setError('이 브라우저에서 광선 추적을 시작하지 못했습니다. WebGL2 지원 여부를 확인해 주세요.');},18000);return()=>{clearInterval(timer);clearTimeout(timeout);};},[source]);
  useEffect(()=>{api()?.pause(paused);},[paused]);
  return <><div className="work-controls original-presets"><div className="preset-options">{materials.map(([id,name],i)=><button key={id} className={`control-button ${choice===i?'active':''}`} aria-pressed={choice===i} disabled={!ready} onClick={()=>{setChoice(i);api()?.material(id);}}>{name}</button>)}</div></div><div className="stage pathtrace-stage">{source&&<iframe ref={frame} srcDoc={source} title="원본 Three.js Path Tracing 재질 실험"/>}{!ready&&<div className="original-loading" role={error?'alert':'status'}>{error||'빛이 반사되고 굴절되는 경로를 계산하고 있습니다'}</div>}</div><div className="work-controls"><Slider label="관찰 위치" value={position} min={-150} max={150} onChange={v=>{setPosition(v);api()?.position(v);}}/><p className="control-note">왼쪽은 매끈하게, 오른쪽은 거칠게.<br/>{paused?'재생하면 바꾼 재질과 위치가 반영됩니다.':'멈춰 바라볼수록 빛의 계산이 선명해집니다.'}</p></div></>;
}
