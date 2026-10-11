import { Controls } from './Controls';
import React,{useEffect,useRef,useState} from 'react';
import {Download} from 'lucide-react';
import {assetUrl} from '../asset-url';
import {Slider} from './shared';
const colors=[['#b65445','테라코타'],['#587d87','청록'],['#6d8060','올리브'],['#bc8190','분홍'],['#542f25','갈색']];
export default function Brush({paused,seed}){
  const frame=useRef(null),pausedRef=useRef(paused);pausedRef.current=paused;
  const [ready,setReady]=useState(false),[error,setError]=useState(''),[tool,setTool]=useState('water'),[color,setColor]=useState(colors[0][0]),[size,setSize]=useState(24);
  const api=()=>frame.current?.contentWindow?.exhibit;
  useEffect(()=>{const timer=setInterval(()=>{if(api()){api().pause(pausedRef.current);setReady(true);clearInterval(timer);}},100);const timeout=setTimeout(()=>{clearInterval(timer);if(!api())setError('붓을 불러오지 못했습니다. WebGL2를 지원하는 브라우저에서 새로 생성해 주세요.');},15000);return()=>{clearInterval(timer);clearTimeout(timeout);};},[]);
  useEffect(()=>{api()?.pause(paused);},[paused]);
  return <><div className="work-controls original-presets"><div className="preset-options">{[['water','수채화'],['pencil','연필'],['charcoal','목탄']].map(([id,name])=><button key={id} className={`control-button ${tool===id?'active':''}`} aria-pressed={tool===id} disabled={!ready} onClick={()=>{setTool(id);api()?.tool(id);}}>{name}</button>)}</div></div>
    <div className="stage brush-stage"><iframe ref={frame} src={`${assetUrl('vendor/brush/exhibit.html')}?seed=${seed}`} title="p5.brush 원본 질감 붓"/>{!ready&&<div className="original-loading" role={error?'alert':'status'}>{error||'물감과 종이의 질감을 준비하고 있습니다'}</div>}<Controls className="brush-palette" aria-label="물감 색">{colors.map(([hex,name])=><button key={hex} className={color===hex?'selected':''} aria-label={name} aria-pressed={color===hex} disabled={!ready} style={{'--swatch':hex}} onClick={()=>{setColor(hex);api()?.color(hex);}}/>)}</Controls></div>
    <Controls className="work-controls brush-controls"><Slider label="붓 크기" value={size} min={8} max={48} onChange={v=>{setSize(v);api()?.size(v);}}/><div className="brush-actions"><button className="control-button" disabled={!ready} onClick={()=>api()?.compose(seed+1,1)}>색 겹침 예시</button><button className="control-button" disabled={!ready} onClick={()=>api()?.clear()}>종이 비우기</button><button className="control-button" disabled={!ready} onClick={()=>api()?.save()} aria-label="그림 저장"><Download size={14}/></button></div><p className="control-note">붓과 색을 고르고 직접 그려 보세요.<br/>수채화는 겹칠수록 종이 위에 스며듭니다.</p></Controls></>;
}
