import { Controls } from './Controls';
import React, { useEffect, useRef, useState } from 'react';
import DelaunayStudy from './Delaunay';
import { Upload, Download } from 'lucide-react';
import { Slider, canvasContext, random, useLoop, saveText } from './shared';
import { primitiveAdapter } from './primitive-adapter';
import { assetUrl } from '../asset-url';

const paintings = [
  { id: 28560, title: '아를의 침실', artist: '고흐' },
  { id: 16568, title: '수련', artist: '모네' },
  { id: 24645, title: '큰 파도', artist: '호쿠사이' },
];
const paintingPath = id => assetUrl(`artworks/${id}.${id === 24645 ? 'png' : 'jpg'}`);
const portraits = [
  {id:'mona-lisa',title:'모나리자',artist:'다빈치',file:'Mona_Lisa,_by_Leonardo_da_Vinci,_from_C2RMF_retouched.jpg',crop:[.2,.10,.65]},
  {id:'pearl-earring',title:'진주 귀걸이 소녀',artist:'페르메이르',file:'1665_Girl_with_a_Pearl_Earring.jpg',crop:[.10,.08,.80]},
  {id:'van-gogh',title:'자화상',artist:'고흐',file:'Vincent_van_Gogh_-_Self-Portrait_-_Google_Art_Project.jpg',crop:[.17,.04,.69]},
];

function defaultImage(kind) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
  const c = canvas.getContext('2d');
  c.fillStyle = kind === 'thread' ? '#fff' : '#eac5a2'; c.fillRect(0, 0, 128, 128);
  if (kind === 'thread') {
    c.strokeStyle = '#202723'; c.lineWidth = 2; c.beginPath(); c.moveTo(67, 112); c.bezierCurveTo(48, 90, 83, 64, 62, 19); c.stroke();
    [[58, 39, -.7], [75, 60, .7], [51, 78, -.8], [77, 92, .9]].forEach(([x, y, angle]) => { c.save(); c.translate(x, y); c.rotate(angle); c.fillStyle = '#253329'; c.beginPath(); c.ellipse(0, 0, 11, 22, 0, 0, 7); c.fill(); c.restore(); });
  } else {
    c.fillStyle = '#f5ddba'; c.beginPath(); c.arc(85, 37, 22, 0, 7); c.fill();
    for (const [color, y, points] of [['#9d7f89', 66, [0, 77, 32, 40, 69, 82, 100, 54, 128, 70]], ['#54767b', 87, [0, 60, 38, 98, 74, 58, 128, 101]], ['#294f54', 109, [0, 100, 38, 84, 82, 112, 128, 92]]]) {
      c.fillStyle = color; c.beginPath(); c.moveTo(0, y); for (let i = 0; i < points.length; i += 2) c.lineTo(points[i], points[i + 1]); c.lineTo(128, 128); c.lineTo(0, 128); c.closePath(); c.fill();
    }
  }
  return c.getImageData(0, 0, 128, 128);
}

function ImageStudy({ kind, paused, seed }) {
  const choices = kind === 'thread' ? portraits : paintings;
  const source = useRef(null), result = useRef(null), worker = useRef(null);
  const [input, setInput] = useState(() => defaultImage(kind));
  const [limit, setLimit] = useState(kind === 'thread' ? 1200 : 400);
  const [count, setCount] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(choices[0].id);
  const selectedPainting = choices.find(p=>p.id===selected);
  const [vector, setVector] = useState('');
  const request = useRef(0);
  useEffect(() => { selectPainting(choices[0]); }, []);
  useEffect(() => {
    const w = kind === 'primitive' ? primitiveAdapter() : new Worker(new URL('./image.worker.js', import.meta.url), { type: 'module' }); worker.current = w;
    source.current.width = source.current.height = input.width;
    if (result.current) result.current.width = result.current.height = 1200;
    source.current.getContext('2d').putImageData(input, 0, 0);
    w.onmessage = event => {
      if (event.data.svg) setVector(event.data.svg);
      else if (result.current && event.data.lines) {
        const ctx=result.current.getContext('2d'), scale=1200/input.width;
        ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#fff';ctx.fillRect(0,0,1200,1200);
        // The optimizer removes 20/255 gray per line. Match that ink budget
        // instead of depositing roughly twice as much ink in the final image.
        ctx.scale(scale,scale);ctx.strokeStyle='rgba(16,20,18,.12)';ctx.lineWidth=.65;ctx.lineCap='round';
        const lines=event.data.lines; for(let i=0;i<lines.length;i+=4){ctx.beginPath();ctx.moveTo(lines[i],lines[i+1]);ctx.lineTo(lines[i+2],lines[i+3]);ctx.stroke();}
      }
      setCount(event.data.count);
    };
    w.onerror = () => { if (worker.current === w) setError('이미지 변환이 중단되었습니다. 새로 생성해 주세요.'); };
    w.postMessage({ type: 'init', pixels: input.data, size: input.width, kind, seed, limit, paused });
    setCount(0); setVector(''); setError('');
    return () => { w.terminate(); };
  }, [input, kind, seed]);
  useEffect(() => () => { request.current++; }, []);
  useEffect(() => { worker.current?.postMessage({ type: 'paused', value: paused }); }, [paused]);
  useEffect(() => { worker.current?.postMessage({ type: 'limit', value: limit }); }, [limit]);
  async function readImage(file, id, crop) {
    try {
      const bitmap = await createImageBitmap(file);
      const offscreen = document.createElement('canvas'); offscreen.width = offscreen.height = 256;
      const ctx = offscreen.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 256, 256);
      const side = Math.min(bitmap.width, bitmap.height) * (crop?.[2] || 1);
      const x = crop ? bitmap.width*crop[0] : (bitmap.width-side)/2;
      const y = crop ? bitmap.height*crop[1] : (bitmap.height-side)/2;
      ctx.drawImage(bitmap, x, y, side, side, 0, 0, 256, 256);
      bitmap.close();
      if (request.current === id) setInput(ctx.getImageData(0, 0, 256, 256));
    } catch { if (request.current === id) setError('이미지를 읽지 못했습니다. 다른 파일로 시도해 주세요.'); }
    finally { if (request.current === id) setBusy(false); }
  }
  async function selectPainting(painting) {
    const id = ++request.current; setBusy(true); setError(''); setSelected(painting.id);
    try {
      const response = await fetch(paintingPath(painting.id));
      if (!response.ok) throw new Error('Image unavailable');
      await readImage(await response.blob(), id, painting.crop);
    } catch { if (request.current === id) { setBusy(false); setError('명화를 불러오지 못했습니다. 다시 선택해 주세요.'); } }
  }
  function upload(event) {
    const file = event.target.files[0]; if (!file) return;
    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') { setError('JPG, PNG, WebP 같은 이미지 파일을 골라 주세요.'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('10MB 이하의 이미지를 골라 주세요.'); return; }
    const id = ++request.current; setBusy(true); setError(''); setSelected(null);
    readImage(file, id); event.target.value = '';
  }
  function download() { if (kind==='primitive') { saveText(vector,'primitive-vector.svg');return; } const anchor = document.createElement('a'); anchor.download = `${kind}-1200px.png`; anchor.href = result.current.toDataURL('image/png'); anchor.click(); }
  return <>
    <div className="stage image-study">
      <div className="study-original"><canvas ref={source} aria-label="변환할 원본 이미지"/><span className="study-label">INPUT</span></div>
      <div className="study-result">
        {kind === 'primitive' ? <div className="primitive-vector" role="img" aria-label="primitive.js가 삼각형으로 재구성한 고해상도 벡터 이미지" dangerouslySetInnerHTML={{__html:vector}}/> : <canvas ref={result} aria-label="1200px로 렌더링한 실선 이미지" style={{borderRadius:'50%'}}/>}
        <span className="study-label">{busy ? '이미지 준비 중' : `${count} / ${limit} ${kind === 'thread' ? 'THREADS · 1200px' : 'TRIANGLES · VECTOR'}`}</span>
      </div>
      <Controls className="painting-picker" aria-label={kind === 'thread' ? '얼굴 이미지로 바로 체험' : '명화로 바로 체험'}>
        {choices.map(painting => <button key={painting.id} onClick={() => selectPainting(painting)} aria-pressed={selected === painting.id} aria-label={`${painting.artist} ${painting.title} 선택`}><img src={paintingPath(painting.id)} alt=""/><span>{painting.artist}<small>{painting.title}</small></span></button>)}
        {selectedPainting && <a className="painting-credit" href={kind === 'thread' ? `https://commons.wikimedia.org/wiki/File:${selectedPainting.file}` : `https://www.artic.edu/artworks/${selected}`} target="_blank" rel="noreferrer">{kind === 'thread' ? 'Wikimedia Commons · Public domain ↗' : 'Art Institute of Chicago · CC0 ↗'}</a>}
      </Controls>
    </div>
    <Controls className="work-controls">
      <label className="control-button upload-control"><Upload size={14}/>{busy ? '이미지 읽는 중' : '내 이미지 넣기'}<input type="file" accept="image/png,image/jpeg,image/webp,image/avif" aria-label="변환할 이미지 업로드" onChange={upload} disabled={busy}/></label>
      <div className="extra-control"><Slider label={kind === 'thread' ? '목표 선 개수' : '목표 도형 개수'} value={limit} onChange={setLimit} min={kind === 'thread' ? 300 : 100} max={kind === 'thread' ? 2400 : 700} step={100}/></div>
      <button className="control-button extra-control" onClick={download}><Download size={13}/>결과 저장</button>
      {error && <p className="image-error" role="alert">{error}</p>}
      <p className="control-note">{kind === 'thread' ? '원리를 체험하는 자체 데모.' : 'primitive.js 브라우저 포트.'}<br/>업로드한 이미지는 전송되지 않습니다.</p>
    </Controls>
  </>;
}

export default function Interactive(props) { return props.kind === 'delaunay' ? <DelaunayStudy {...props}/> : <ImageStudy {...props}/>; }
