import React, { Component, Suspense, lazy, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, ArrowDown, ArrowUp, ArrowLeft, ArrowRight, Pause, Play, RotateCcw, X, Search, List, Info, Maximize, Minimize } from 'lucide-react';
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import { themes, totalWorks } from './catalog';
import './style.css';
import './scene-styles.css';
import './exhibit-styles.css';
import './expansion-styles.css';

const Drawing = lazy(() => import('./scenes/Drawing'));
const Spatial = lazy(() => import('./scenes/Spatial'));
const Interactive = lazy(() => import('./scenes/Interactive'));
const Kinetic = lazy(() => import('./scenes/Kinetic'));
const Originals = lazy(() => import('./scenes/Originals'));
const Volume = lazy(() => import('./scenes/Volume'));
const Sand = lazy(() => import('./scenes/Sand'));
const FieldPlay = lazy(() => import('./scenes/FieldPlay'));
const WaveFunction = lazy(() => import('./scenes/WaveFunction'));
const sceneMap = { fish: Drawing, landscape: Drawing, line: Drawing, cloud: Volume, sculpture: Spatial, bvh: Spatial, primitive: Interactive, thread: Interactive, delaunay: Interactive, physics: Kinetic, morph: Kinetic, fluid: Originals, lenia: Originals, origami: Originals, sand: Sand, fieldplay: FieldPlay, wfc: WaveFunction };

function initialLocation() {
  const id = location.hash.slice(1).split('/').pop();
  for (let t = 0; t < themes.length; t++) {
    const w = themes[t].items.findIndex(item => item.id === id);
    if (w >= 0) return [t, w];
  }
  return [0, 0];
}

class SceneBoundary extends Component {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  render() {
    return this.state.error ? <div className="scene-message"><p>이 작품을 불러오지 못했습니다.</p><button onClick={() => this.setState({ error: false })}>다시 시도</button><a href={this.props.url} target="_blank" rel="noreferrer">원본 프로젝트 열기 <ArrowUpRight size={16} /></a></div> : this.props.children;
  }
}

function Mark() {
  return <svg viewBox="0 0 32 32" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="2.3"><path d="M16 2v28M2 16h28M6.1 6.1l19.8 19.8M6.1 25.9 25.9 6.1"/><circle cx="16" cy="16" r="6"/></g></svg>;
}

function App() {
  const initial = useRef(initialLocation());
  const [themeIndex, setThemeIndex] = useState(initial.current[0]);
  const [positions, setPositions] = useState(() => themes.map((_, i) => i === initial.current[0] ? initial.current[1] : 0));
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [hidden, setHidden] = useState(document.hidden);
  const [seed, setSeed] = useState(() => crypto.getRandomValues(new Uint32Array(1))[0]);
  const [dialog, setDialog] = useState(null);
  const [query, setQuery] = useState('');
  const [immersive, setImmersive] = useState(false);
  const horizontal = useRef(null);
  const columns = useRef([]);
  const modal = useRef(null);
  const frameWheel = useRef({ time: 0, x: 0, y: 0 });
  const theme = themes[themeIndex];
  const workIndex = positions[themeIndex];
  const item = theme.items[workIndex];
  const behavior = reduced ? 'instant' : 'smooth';

  function navigate(t, w = positions[t]) {
    if (t < 0 || t >= themes.length || w < 0 || w >= themes[t].items.length) return;
    setPositions(previous => previous.map((p, i) => i === t ? w : p));
    setThemeIndex(t);
    horizontal.current.scrollTo({ left: t * horizontal.current.clientWidth, behavior });
    columns.current[t]?.scrollTo({ top: w * columns.current[t].clientHeight, behavior });
  }
  useEffect(() => {
    const [t, w] = initial.current;
    horizontal.current.scrollLeft = t * horizontal.current.clientWidth;
    columns.current[t].scrollTop = w * columns.current[t].clientHeight;
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);
  useEffect(() => {
    history.replaceState(null, '', `#/${theme.id}/${item.id}`);
    document.title = `${item.name} — Open Visuals`;
    document.querySelector('meta[name="theme-color"]').content = item.background;
  }, [item.id, theme.id]);
  useEffect(() => {
    const onHash = () => { const [t, w] = initialLocation(); navigate(t, w); };
    const onResize = () => {
      horizontal.current.scrollTo({ left: themeIndex * horizontal.current.clientWidth, behavior: 'instant' });
      columns.current.forEach((col, t) => col.scrollTo({ top: positions[t] * col.clientHeight, behavior: 'instant' }));
    };
    const onKey = event => {
      if (event.key === 'Escape') { setImmersive(false); return; }
      if (dialog || /INPUT|TEXTAREA|SELECT|BUTTON/.test(event.target.tagName) || event.target.isContentEditable) return;
      const moves = { ArrowDown: [themeIndex, workIndex + 1], ArrowUp: [themeIndex, workIndex - 1], ArrowLeft: [themeIndex - 1], ArrowRight: [themeIndex + 1] };
      if (moves[event.key]) { event.preventDefault(); navigate(...moves[event.key]); }
      if (event.code === 'Space') { event.preventDefault(); setPaused(value => !value); }
    };
    window.addEventListener('hashchange', onHash);
    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', onKey);
    const onFrameWheel = event => {
      if (dialog) return;
      const wheel = frameWheel.current, now = performance.now();
      if (now - wheel.time < 750) return;
      wheel.x += event.detail.x; wheel.y += event.detail.y;
      if (Math.max(Math.abs(wheel.x), Math.abs(wheel.y)) < 60) return;
      if (Math.abs(wheel.x) > Math.abs(wheel.y)) navigate(themeIndex + Math.sign(wheel.x));
      else navigate(themeIndex, workIndex + Math.sign(wheel.y));
      wheel.time = now; wheel.x = wheel.y = 0;
    };
    window.addEventListener('exhibit-wheel', onFrameWheel);
    return () => { window.removeEventListener('hashchange', onHash); window.removeEventListener('resize', onResize); window.removeEventListener('keydown', onKey); window.removeEventListener('exhibit-wheel', onFrameWheel); };
  }, [themeIndex, workIndex, dialog, positions]);
  useEffect(() => {
    if (dialog && !modal.current.open) modal.current.showModal();
    else if (!dialog && modal.current.open) modal.current.close();
  }, [dialog]);
  useEffect(() => {
    const sync = () => horizontal.current?.querySelectorAll('.work-controls').forEach(node => { node.inert = immersive; });
    sync();
    const observer = new MutationObserver(sync);
    if (immersive) observer.observe(horizontal.current, { childList: true, subtree: true });
    return () => { observer.disconnect(); horizontal.current?.querySelectorAll('.work-controls').forEach(node => { node.inert = false; }); };
  }, [immersive]);

  return <div className={`exhibition ${item.dark ? 'dark' : ''} ${immersive ? 'immersive' : ''}`} style={{ '--paper': item.background, '--ink': item.ink }}>
    <a href="#exhibition" className="skip-link" onClick={event => { event.preventDefault(); horizontal.current.focus({ preventScroll: true }); }}>작품으로 바로가기</a>
    <header className="header" inert={immersive}>
      <button className="brand" onClick={() => navigate(0, 0)} aria-label="Open Visuals 첫 작품"><Mark/><span>open<br/>visuals<span className="brand-dot">.</span></span></button>
      <nav className="theme-nav" aria-label="작품 테마">
        {themes.map((t, i) => <button key={t.id} aria-current={i === themeIndex ? 'page' : undefined} onClick={() => navigate(i)}><span className="theme-en">{t.en}</span><span className="theme-ko">{t.title}</span>{i === themeIndex && <motion.span layoutId="theme-line" className="theme-line" transition={{ duration: reduced ? 0 : .35 }}/>}</button>)}
      </nav>
      <button className="catalog-button" onClick={() => setDialog('index')}><List size={18}/><span>작품 목록</span><span className="total">{totalWorks}</span></button>
    </header>

    <main id="exhibition" tabIndex={-1} className="horizontal-gallery" ref={horizontal} aria-label="좌우로 테마, 위아래로 작품 탐색" onScroll={event => {
      if (event.target !== horizontal.current) return;
      const index = Math.round(event.currentTarget.scrollLeft / event.currentTarget.clientWidth);
      if (index >= 0 && index < themes.length) setThemeIndex(index);
    }}>
      {themes.map((t, ti) => <div key={t.id} ref={el => columns.current[ti] = el} className="theme-column" aria-label={t.title} aria-hidden={ti !== themeIndex} onScroll={event => {
        const index = Math.round(event.currentTarget.scrollTop / event.currentTarget.clientHeight);
        if (index >= 0 && index < t.items.length) setPositions(previous => previous[ti] === index ? previous : previous.map((p, i) => i === ti ? index : p));
      }}>
        {t.items.map((work, wi) => {
          const active = ti === themeIndex && wi === positions[ti];
          const Scene = sceneMap[work.renderer];
          return <section key={work.id} className={`work ${work.dark ? 'dark' : ''}`} style={{ '--paper': work.background, '--ink': work.ink }} aria-label={`${work.name} — ${work.subtitle}`}>
            <div className="work-context" inert={immersive}><span>{work.medium}</span><span>{work.code}</span></div>
            {active && <SceneBoundary key={`${work.id}-${seed}`} url={`https://github.com/${work.repo}`}>
              <Suspense fallback={<div className="scene-message"><span className="loading-orbit"/>작품을 준비하고 있습니다</div>}>
                <Scene kind={work.renderer} paused={paused || hidden || !!dialog} reduced={reduced} seed={seed} ink={work.ink}/>
              </Suspense>
            </SceneBoundary>}
            <div className="work-caption" inert={immersive}>
              <h1>{work.name}<span className="title-dot">.</span></h1>
              <h2>{work.subtitle}</h2>
              <p>{work.description}</p>
              <div className="credit"><span>{work.author}</span><span className="credit-divider"/><button tabIndex={active ? 0 : -1} onClick={() => setDialog('about')}>작품과 코드 <ArrowUpRight size={14}/></button></div>
            </div>
          </section>;
        })}
      </div>)}
    </main>

    <aside className="work-rail" inert={immersive} aria-label="현재 테마의 작품">
      <span className="rail-count">{String(workIndex + 1).padStart(2, '0')}<span> / {String(theme.items.length).padStart(2, '0')}</span></span>
      <div className="rail-dots">{theme.items.map((work, index) => <button key={work.id} onClick={() => navigate(themeIndex, index)} aria-label={work.name} aria-current={index === workIndex ? 'true' : undefined}><span/></button>)}</div>
      <span className="rail-label">EXPLORE THE POSSIBILITIES</span>
    </aside>

    <div className="playback-controls">
      <button className="icon-button" onClick={() => setPaused(value => !value)} aria-label={paused ? '작품 움직임 재개' : '작품 움직임 일시정지'} title={paused ? '움직임 재개' : '일시정지'}>{paused ? <Play size={17}/> : <Pause size={17}/>}</button>
      <button className="icon-button" onClick={() => setSeed(s => s + 1)} aria-label="작품 새로 생성" title="새로 생성"><RotateCcw size={17}/></button>
      <button className="icon-button" onClick={() => setImmersive(value => !value)} aria-label={immersive ? '작품 정보 표시' : '작품만 보기'} title="작품만 보기">{immersive ? <Minimize size={17}/> : <Maximize size={17}/>}</button>
    </div>
    <footer className="footer" inert={immersive}>
      <span className="footer-note"><span className={`live-dot ${paused ? 'paused' : ''}`}/>{paused ? '잠시 멈춘 장면' : '지금, 코드가 만드는 장면'}</span>
      <div className="navigation-hint"><span><ArrowLeft size={13}/><ArrowRight size={13}/> 테마</span><span><ArrowUp size={13}/><ArrowDown size={13}/> 작품</span></div>
      <div className="next-controls"><button className="previous" aria-label="이전 작품" disabled={workIndex === 0} onClick={() => navigate(themeIndex, workIndex - 1)}><ArrowUp size={17}/></button><button className="next" onClick={() => workIndex < theme.items.length - 1 ? navigate(themeIndex, workIndex + 1) : navigate((themeIndex + 1) % themes.length, 0)}><span>{workIndex < theme.items.length - 1 ? '다음 작품' : '다음 테마'}</span><ArrowDown size={17}/></button></div>
    </footer>
    <div className="sr-only" aria-live="polite">{theme.title}, {item.name}, {workIndex + 1} / {theme.items.length}</div>

    <dialog ref={modal} className="info-dialog" onCancel={() => setDialog(null)} onClick={event => { if (event.target === modal.current) setDialog(null); }}>
      <div className="dialog-content">
        <button className="dialog-close icon-button" onClick={() => setDialog(null)} aria-label="닫기"><X size={21}/></button>
        {dialog === 'index' ? <><h2>코드가 만드는<br/>풍경들<span className="title-dot">.</span></h2><p className="dialog-intro">다섯 개의 테마, {totalWorks}개의 열린 가능성.</p><label className="search-field"><Search size={18}/><input autoFocus placeholder="작품, 작가, 테마 검색" value={query} onChange={e => setQuery(e.target.value)} aria-label="작품 검색"/></label>
          {themes.map((t, ti) => { const matches = t.items.filter(work => `${work.name} ${work.author} ${work.subtitle} ${t.title} ${t.en}`.toLowerCase().includes(query.toLowerCase())); return matches.length ? <div key={t.id} className="index-group"><h3>{t.title}<span>{t.en}</span></h3>{matches.map(work => <button key={work.id} className="index-row" onClick={() => { navigate(ti, t.items.indexOf(work)); setDialog(null); }}><span>{work.name}<small>{work.subtitle}</small></span><ArrowUpRight size={19}/></button>)}</div> : null; })}
          {!themes.some(t => t.items.some(work => `${work.name} ${work.author} ${work.subtitle} ${t.title} ${t.en}`.toLowerCase().includes(query.toLowerCase()))) && <p className="empty-state">찾는 작품이 없습니다. 다른 이름으로 검색해 보세요.</p>}
        </> : <><h2>{item.name}<span className="title-dot">.</span></h2><p className="dialog-intro">{item.description}</p><dl><dt>만든 사람</dt><dd>{item.author}</dd><dt>이 전시의 구현</dt><dd>{item.implementation}</dd><dt>라이선스</dt><dd>{item.license}</dd><dt>컬렉션 번호</dt><dd>{item.code}</dd></dl><p>{item.hint}</p><a className="source-link" href={`https://github.com/${item.repo}`} target="_blank" rel="noreferrer">원본 소스 보기 <ArrowUpRight size={19}/></a>{item.demo && <a className="source-link secondary" href={item.demo} target="_blank" rel="noreferrer">작가의 원본 데모 <ArrowUpRight size={19}/></a>}<div className="about-collection"><Info size={18}/><p>제공된 오픈소스 컬렉션에서 고른 작품들입니다. 원본 실행, 브라우저 포트, 원리를 체험하는 자체 데모를 구분해 표기했습니다.</p></div></>}
      </div>
    </dialog>
  </div>;
}

createRoot(document.getElementById('root')).render(<App/>);
