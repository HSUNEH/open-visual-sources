import React,{useEffect,useRef,useState} from 'react';
import {assetUrl} from '../asset-url';
import {ArrowRight} from 'lucide-react';
const samples=[['Flowers','꽃밭',3,2],['Paths','연결된 길',3,8],['Maze','미로',2,8]];
export default function WaveFunction({paused,seed}) {
  const canvas=useRef(null),worker=useRef(null),pausedRef=useRef(paused);pausedRef.current=paused;
  const [choice,setChoice]=useState(0),[iteration,setIteration]=useState(0),[status,setStatus]=useState('표본의 규칙을 읽고 있습니다'),[error,setError]=useState('');
  useEffect(()=>{
    let alive=true;setError('');setStatus('표본의 규칙을 읽고 있습니다');
    const w=new Worker(new URL('./wfc.worker.js',import.meta.url),{type:'module'});worker.current=w;
    w.onmessage=({data})=>{
      if(data.error){setError(data.error);return;}
      if(data.retry){setStatus(`막힌 길을 되짚고 있습니다 · ${data.retry}회`);return;}
      canvas.current?.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(data.pixels),64,40),0,0);
      setStatus(data.complete?'완성 · 같은 규칙, 전혀 다른 결과':'가능한 조합을 하나씩 좁히고 있습니다');
    };
    w.onerror=()=>setError('규칙 계산을 시작하지 못했습니다. 다시 생성해 주세요.');
    const image=new Image();
    image.onload=()=>{
      if(!alive)return;
      const c=document.createElement('canvas');c.width=image.width;c.height=image.height;
      const ctx=c.getContext('2d');ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,c.width,c.height).data;
      w.postMessage({type:'init',pixels,width:c.width,height:c.height,pattern:samples[choice][2],symmetry:samples[choice][3],seed:seed+iteration*7919,paused:pausedRef.current},[pixels.buffer]);
    };
    image.onerror=()=>{if(alive)setError('표본 이미지를 불러오지 못했습니다. 다시 생성해 주세요.');};
    image.src=assetUrl(`vendor/wfc/samples/${samples[choice][0]}.png`);
    return()=>{alive=false;w.terminate();};
  },[choice,iteration,seed]);
  useEffect(()=>{worker.current?.postMessage({type:'pause',paused});},[paused]);
  return <><div className="work-controls original-presets"><div className="preset-options">{samples.map(([,name],i)=><button key={name} className={`control-button ${choice===i?'active':''}`} aria-pressed={choice===i} onClick={()=>setChoice(i)}>{name}</button>)}</div></div>
    <div className="stage wfc-stage"><figure className="wfc-sample"><img src={assetUrl(`vendor/wfc/samples/${samples[choice][0]}.png`)} alt={`${samples[choice][1]} 원본 표본`}/><figcaption>작은 표본</figcaption></figure><ArrowRight className="wfc-arrow" aria-hidden="true"/><figure className="wfc-result"><canvas ref={canvas} width="64" height="40" aria-label="표본의 인접 규칙으로 생성하는 새로운 패턴"/><figcaption role="status">{paused?'계산 일시정지':status}</figcaption></figure>{error&&<div className="original-loading" role="alert">{error}</div>}</div>
    <div className="work-controls"><button className="control-button" onClick={()=>setIteration(v=>v+1)}>같은 규칙으로 다시 생성</button><p className="control-note">작은 표본에서 이웃의 규칙을 배웁니다.<br/>흐린 가능성이 하나의 패턴으로 정해집니다.</p></div>
  </>;
}
