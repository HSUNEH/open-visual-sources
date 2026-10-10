import React, { useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { canvasContext, saveText, useLoop } from './shared';
import { assetUrl } from '../asset-url';

function Fish({ paused, seed, ink, reduced }) {
  const canvas = useRef(null);
  const worker = useRef(null);
  const art = useRef(null);
  const progress = useRef(0);
  const cycle = useRef(0);
  const count = useRef(1);
  const waiting = useRef(false);
  const [version, setVersion] = useState(0);
  const [error, setError] = useState('');
  function generate() {
    waiting.current = true;
    worker.current?.postMessage({ seed: `Open Visuals ${seed}.${count.current}` });
  }
  useEffect(() => {
    const w = new Worker(assetUrl('workers/fish.js'));
    worker.current = w;
    w.onmessage = event => {
      if (event.data.error) { setError(event.data.error); return; }
      art.current = event.data;
      progress.current = 0; cycle.current = 0; waiting.current = false;
      setVersion(v => v + 1);
    };
    w.onerror = () => setError('물고기를 생성하지 못했습니다. 새로 생성 버튼으로 다시 시도해 주세요.');
    generate();
    return () => w.terminate();
  }, [seed]);
  function draw(_, delta) {
    const surface = canvasContext(canvas.current);
    if (!surface || !art.current) return;
    const { ctx, width, height } = surface;
    const lines = art.current.lines;
    progress.current = paused || reduced ? 1 : Math.min(1, progress.current + delta / 4);
    cycle.current += delta;
    if (cycle.current > 15 && !waiting.current) { count.current++; generate(); }
    ctx.clearRect(0, 0, width, height);
    const scale = Math.min(width / 520, height / 310);
    ctx.save(); ctx.translate((width - 500 * scale) / 2, (height - 300 * scale) / 2); ctx.scale(scale, scale);
    ctx.strokeStyle = ink; ctx.lineWidth = .65; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const end = Math.floor(lines.length * progress.current);
    ctx.beginPath();
    for (let i = 0; i < end; i++) { const points = lines[i]; if (!points.length) continue; ctx.moveTo(...points[0]); for (let j = 1; j < points.length; j++) ctx.lineTo(...points[j]); }
    ctx.stroke(); ctx.restore();
  }
  useLoop(draw, paused);
  useEffect(() => { if (paused && version) draw(0, 0); }, [version, paused]);
  return <><div className="stage fish-stage"><canvas ref={canvas} aria-label="fishdraw 원본 코드가 생성한 물고기 선화"/><span className="fish-meta">SPECIMEN {String(seed * 100 + count.current).padStart(4, '0')}</span>{!version && <div className="scene-message">{error || '새로운 물고기를 그리고 있습니다'}</div>}</div><div className="work-controls"><button className="control-button" disabled={!version} onClick={() => saveText(art.current.svg, `fishdraw-${seed}-${count.current}.svg`)}><Download size={14}/>이 물고기 저장</button><p className="control-note">15초마다 새로운 물고기.<br/>한 번도 같지 않은 선의 조합.</p></div></>;
}

function Landscape({ paused, seed }) {
  const frame = useRef(null);
  const elapsed = useRef(0);
  const [ready, setReady] = useState(false);
  function configure() {
    const w = frame.current.contentWindow;
    const doc = frame.current.contentDocument;
    const style = doc.createElement('style');
    style.textContent = 'html,body{margin:0!important;overflow:hidden!important;background:transparent!important}#SETTING,#SOURCE_BTN,#L,#R,td:has(#L),td:has(#R){display:none!important}table,tbody,tr,td{display:block!important;width:100%!important;height:100%!important;margin:0!important;padding:0!important;border:0!important}#BG{width:100%!important;height:100vh!important;background:none!important}#SVG{width:100%!important;height:100%!important}';
    doc.head.append(style);
    w.MEM.windx = Math.max(1300, frame.current.clientWidth * 1.5);
    w.update();
    setReady(true);
  }
  useLoop((_, dt) => {
    if (!ready) return;
    const w = frame.current?.contentWindow;
    if (!w?.MEM) return;
    elapsed.current += dt;
    w.MEM.cursx += dt * 18;
    if (elapsed.current > 4) {
      w.MEM.chunks = w.MEM.chunks.filter(chunk => chunk.x > w.MEM.cursx - w.MEM.windx * 2);
      w.update(); elapsed.current = 0;
    } else w.viewupdate();
  }, paused);
  return <><div className="stage landscape-stage"><iframe key={seed} ref={frame} src={`${assetUrl('vendor/shan-shui.html')}?seed=openvisuals${seed}`} title="Shan Shui Infinite 원본 생성 산수화" onLoad={configure}/>{!ready && <div className="scene-message">산과 나무를 그리고 있습니다</div>}</div><div className="work-controls"><button className="control-button" disabled={!ready} onClick={() => saveText(frame.current.contentDocument.getElementById('BG').innerHTML, `shan-shui-${seed}.svg`)}><Download size={14}/>이 풍경 저장</button><p className="control-note">산 너머 또 다른 산.<br/>풍경은 천천히 이어집니다.</p></div></>;
}

function Line({ seed, paused }) {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState('city');
  const [edition, setEdition] = useState(1);
  const workerRef = useRef(null), busy = useRef(false), sequence = useRef(0);
  function generate() { if (!busy.current && workerRef.current) { busy.current = true; workerRef.current.postMessage({ seed: seed + sequence.current++ * 7919, mode }); } }
  useEffect(() => {
    const worker = new Worker(new URL('./line.worker.js', import.meta.url), { type: 'module' });
    workerRef.current = worker; busy.current = false;
    worker.onmessage = event => { busy.current = false; if (event.data.error) setError(event.data.error); else { setSvg(event.data.svg.replace(/stroke="black"/g, 'stroke="currentColor"').replace('<svg ', '<svg viewBox="0 0 1000 630" ')); setEdition(sequence.current); } };
    worker.onerror = () => { busy.current = false; setError('선화를 생성하지 못했습니다. 새로 생성해 주세요.'); };
    generate();
    return () => worker.terminate();
  }, [seed, mode]);
  useEffect(() => { if (paused) return; const timer = setInterval(generate, 5000); return () => clearInterval(timer); }, [paused, seed, mode]);
  return <><div className="stage line-stage">{svg ? <div style={{ width: '100%', height: '100%' }} dangerouslySetInnerHTML={{ __html: svg }}/> : <div className="scene-message">{error || '보이는 선과 가려진 선을 계산하고 있습니다'}</div>}</div><div className="work-controls original-presets"><div className="preset-options">{[['city','층층의 도시'],['orbits','구의 군집'],['terrain','산의 능선']].map(([id,label])=><button key={id} className={`control-button ${mode===id?'active':''}`} aria-pressed={mode===id} onClick={()=>setMode(id)}>{label}</button>)}</div></div><div className="work-controls"><button className="control-button" disabled={!svg} onClick={() => saveText(svg.replaceAll('currentColor', '#383254'), `ln-${mode}-${seed}-${edition}.svg`)}><Download size={14}/>선화 저장</button><p className="control-note">{paused ? '자동 생성 일시정지' : '5초마다 새로운 장면'} · #{edition}<br/>표면 뒤에 가려진 선을 실제로 제거합니다.</p>{error && <p role="alert">{error}</p>}</div></>;
}

export default function Drawing(props) { return props.kind === 'fish' ? <Fish {...props}/> : props.kind === 'landscape' ? <Landscape {...props}/> : <Line {...props}/>; }
