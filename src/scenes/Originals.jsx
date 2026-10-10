import React, { useEffect, useRef, useState } from 'react';
import { Slider } from './shared';
import { applyVowel, perturbLenia, enableFluidHover } from './exhibit-controls';
import { assetUrl } from '../asset-url';

const entries = {
  fluid: { title: 'WebGL Fluid Simulation', folder: 'fluid', file: null },
  lenia: { title: 'Lenia', folder: 'lenia', file: 'Lenia.html' },
  origami: { title: 'Origami Simulator', folder: 'origami', file: 'index.html' },
  voice: { title: 'Pink Trombone', folder: 'pink-trombone', file: 'index.html' },
};

// The upstream files remain untouched. This wrapper removes their site chrome,
// remote tracking and unused media, and exposes a small, local lifecycle API.
const lifecycle = `
  window.ga = function(){};
  window.gtag = function(){};
  window.renderMathInElement = function(){};
  window.exhibitPaused = false;
  const originalRAF = window.requestAnimationFrame.bind(window);
  const originalCancel = window.cancelAnimationFrame.bind(window);
  let callbacks = new Map(), serial = 0, tick = null;
  function scheduleFrame() { if (!window.exhibitPaused && !tick && callbacks.size) tick = originalRAF(flushFrame); }
  function flushFrame(time) { tick = null; if(window.exhibitPaused) return; const batch = callbacks; callbacks = new Map(); for(const callback of batch.values()) callback(time); scheduleFrame(); }
  window.requestAnimationFrame = callback => { const id = ++serial; callbacks.set(id, callback); scheduleFrame(); return id; };
  window.cancelAnimationFrame = id => callbacks.delete(id);
  window.setExhibitPaused = value => { window.exhibitPaused = value; if(value && tick) { originalCancel(tick); tick = null; } else scheduleFrame(); };
  window.addEventListener('error', event => { window.exhibitFailed = true; window.exhibitError = event.message; });
  window.addEventListener('wheel', event => {
    if(event.ctrlKey) return;
    event.preventDefault(); event.stopImmediatePropagation();
    parent.dispatchEvent(new CustomEvent('exhibit-wheel', {detail:{x:event.deltaX,y:event.deltaY}}));
  }, {capture:true,passive:false});
  window.addEventListener('keydown', event => {
    if(/INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
    if(['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Escape',' '].includes(event.key)) {
      event.preventDefault(); event.stopImmediatePropagation();
      parent.dispatchEvent(new KeyboardEvent('keydown',{key:event.key,code:event.code}));
    }
  }, true);
`;

const adapters = {
  fluid: `
    config.DYE_RESOLUTION = 512; config.BLOOM_RESOLUTION = 128; config.SUNRAYS = false;
    config.BACK_COLOR = {r:22,g:46,b:42}; config.DENSITY_DISSIPATION = .5;
    config.CURL = 45; config.VELOCITY_DISSIPATION = 1.475;
    initFramebuffers(); updateKeywords(); multipleSplats(7);
    (${enableFluidHover.toString()})(canvas, pointers[0], updatePointerDownData, updatePointerUpData, () => window.exhibitPaused);
    window.exhibit = {
      pause(value) { config.PAUSED = value; setExhibitPaused(value); },
      burst() { multipleSplats(10); render(null); },
      viscosity(value) { config.CURL = value; config.VELOCITY_DISSIPATION = .1 + (100-value)/40; },
    };
  `,
  lenia: `
    const perturbLenia = ${perturbLenia.toString()};
    PopulateCatalogue = function(){};
    window.addEventListener('load', () => {
      document.body.appendChild(canvas1.can);
      COLOR_ZERO.splice(0, 3, 24/17, 42/17, 52/17);
      optAid = Aid_OFF;
      optCenter = Center_POS;
      PresetAnimal({fsize:7,animalCode:'OG2'}); TransformField(0,0,2,0,0); optCenter=Center_POS; DrawAllPanels();
      window.exhibit = {
        pause(value) { isRunning = !value; setExhibitPaused(value); DrawAllPanels(); },
        species(code) { PresetAnimal({fsize:7,animalCode:code}); TransformField(0,0,2,0,0); optCenter=Center_POS; DrawAllPanels(); },
        disturb() {
          if(!perturbLenia(field)) return false;
          NextGen(false); CalcMoments(); DrawAllPanels();
          return true;
        },
      };
    });
  `,
  origami: `
    const origamiReady = setInterval(() => {
      if(!window.globals?.model?.getGeometry()?.attributes.position) return;
      clearInterval(origamiReady);
      globals.numSteps = 35;
      globals.color1 = '54767b'; globals.color2 = 'ece5d5';
      globals.model.setMeshMaterial(); globals.threeView.setBackgroundColor('e9e8f0');
      globals.threeView.onWindowResize(); globals.threeView.setCameraIso();
      globals.threeView.camera.zoom = 18; globals.threeView.camera.updateProjectionMatrix();
      window.exhibit = {
        pause(value) { globals.simulationRunning = !value; setExhibitPaused(value); },
        fold(value) { globals.setCreasePercent(value / 100); globals.shouldChangeCreasePercent = true; },
        model(value) { globals.importer.importDemoFile(value); },
      };
    }, 50);
    setTimeout(() => clearInterval(origamiReady), 15000);
  `,
  voice: `
    const applyVowel = ${applyVowel.toString()};
    UI.inAboutScreen = false; UI.aboutButton.switchedOn = false;
    UI.shapeToFitScreen = function() {
      this.width = Math.min(innerWidth,innerHeight)-10;
      this.left_margin = (innerWidth-this.width)/2; this.top_margin = (innerHeight-this.width)/2;
      for(const canvas of [tractCanvas,backCanvas]) {
        canvas.style.width = this.width+'px'; canvas.style.height = this.width+'px';
        canvas.style.left = this.left_margin+'px'; canvas.style.top = this.top_margin+'px';
      }
    };
    UI.shapeToFitScreen(); Glottis.UIFrequency = 140;
    AudioSystem.audioContext.suspend();
    applyVowel(Tract, TractUI, 0);
    let master;
    window.exhibit = {
      pause(value) { setExhibitPaused(value); if(value) AudioSystem.audioContext.suspend(); },
      async voice(value) {
        if(value) {
          if(!AudioSystem.started) {
            AudioSystem.started = true; AudioSystem.startSound();
            AudioSystem.scriptProcessor.disconnect();
            master = AudioSystem.audioContext.createGain(); master.gain.value = .16;
            AudioSystem.scriptProcessor.connect(master); master.connect(AudioSystem.audioContext.destination);
          }
          await AudioSystem.audioContext.resume();
        } else await AudioSystem.audioContext.suspend();
      },
      vowel(index) {
        applyVowel(Tract, TractUI, index);
      },
      pitch(value) { Glottis.UIFrequency = value; },
    };
  `,
};

function makeDocument(source, kind) {
  const entry = entries[kind];
  const base = new URL(assetUrl(`vendor/${entry.folder}/`), location.origin).href;
  const documentText = kind === 'fluid'
    ? `<html><head></head><body><canvas aria-label="손으로 휘젓는 유체"></canvas><div class="promo"><button class="promo-close"></button><a id="apple_link"></a><a id="google_link"></a></div><script src="dat.gui.min.js"></script><script src="script.js"></script></body></html>`
    : source;
  const doc = new DOMParser().parseFromString(documentText, 'text/html');
  doc.querySelectorAll('script[src^="http"],link[href^="http"],img,meta[http-equiv]').forEach(node => node.remove());
  doc.querySelectorAll('script:not([src])').forEach(node => { if (/googletagmanager|gtag\('config'/.test(node.textContent)) node.remove(); });
  const baseElement = doc.createElement('base'); baseElement.href = base; doc.head.prepend(baseElement);
  const control = doc.createElement('script'); control.textContent = lifecycle; baseElement.after(control);
  const style = doc.createElement('style');
  style.textContent = `html,body{margin:0!important;min-width:0!important;width:100%;height:100%;overflow:hidden!important}body{background:transparent!important}.promo,.dg{display:none!important}
    ${kind === 'fluid' ? 'canvas{width:100%;height:100%;display:block;touch-action:none}' : ''}
    ${kind === 'lenia' ? 'body>*{visibility:hidden}body>#canvas1{visibility:visible!important;position:fixed!important;left:50%!important;top:50%!important;transform:translate(-50%,-50%);width:min(90vw,90vh)!important;height:min(90vw,90vh)!important;border:0!important;border-radius:50%}' : ''}
    ${kind === 'origami' ? 'body>*:not(#threeContainer){display:none!important}#threeContainer{display:block!important;position:fixed!important;inset:0!important;width:100%!important;height:100%!important}#threeContainer canvas{width:100%!important;height:100%!important}' : ''}`;
  doc.head.appendChild(style);
  const bridge = doc.createElement('script'); bridge.textContent = adapters[kind]; doc.body.appendChild(bridge);
  return '<!doctype html>' + doc.documentElement.outerHTML;
}

export default function Originals({ kind, paused }) {
  const frame = useRef(null), pausedRef = useRef(paused); pausedRef.current = paused;
  const [source, setSource] = useState(''), [ready, setReady] = useState(false), [error, setError] = useState('');
  const [value, setValue] = useState(kind === 'origami' ? 60 : kind === 'voice' ? 140 : 45);
  const [choice, setChoice] = useState(0), [playing, setPlaying] = useState(false);
  const [stimuli, setStimuli] = useState(0), [stimulusBusy, setStimulusBusy] = useState(false);
  const [stimulusEmpty, setStimulusEmpty] = useState(false);
  const stimulusTimer = useRef(null);
  useEffect(() => () => clearTimeout(stimulusTimer.current), []);
  const playingRef = useRef(false), generation = useRef(0);
  function api() { return frame.current?.contentWindow?.exhibit; }
  useEffect(() => {
    let alive = true;
    const entry = entries[kind];
    (async () => {
      try {
        const response = entry.file ? await fetch(assetUrl(`vendor/${entry.folder}/${entry.file}`)) : null;
        if (response && !response.ok) throw new Error('Source unavailable');
        const html = response ? await response.text() : '';
        if (alive) setSource(makeDocument(html, kind));
      } catch { if (alive) setError('원본 작품을 불러오지 못했습니다. 새로 생성 버튼으로 다시 시도해 주세요.'); }
    })();
    return () => { alive = false; generation.current++; api()?.voice?.(false); };
  }, [kind]);
  useEffect(() => {
    api()?.pause(paused);
    if (paused) { generation.current++; api()?.voice?.(false); playingRef.current = false; setPlaying(false); }
  }, [paused]);
  useEffect(() => {
    if (!source) return;
    const timer = setInterval(() => {
      if (api()) { api().pause(pausedRef.current); setReady(true); clearInterval(timer); }
    }, 120);
    const timeout = setTimeout(() => { clearInterval(timer); if (!api()) setError('이 브라우저에서 작품을 시작하지 못했습니다. WebGL 지원 여부를 확인하거나 새로 생성해 주세요.'); }, 18000);
    return () => { clearInterval(timer); clearTimeout(timeout); };
  }, [source]);
  async function toggleVoice() {
    if (!ready || paused) return;
    const token = ++generation.current;
    const next = !playingRef.current; playingRef.current = next;
    try { await api().voice(next); if (token === generation.current && !pausedRef.current) setPlaying(next); else api()?.voice(false); }
    catch { playingRef.current = false; setPlaying(false); setError('소리를 시작하지 못했습니다. 다시 재생해 주세요.'); }
  }
  function update(value) { setValue(value); if(kind === 'origami') api()?.fold(value); else if(kind === 'voice') api()?.pitch(value); else api()?.viscosity(value); }
  const options = kind === 'lenia' ? ['회전 · Gyrorbium', '유영 · Orbium', '쌍둥이 · Hydrogeminium'] : kind === 'origami' ? ['물폭탄 접기', '미우라 접기', '종이학'] : ['아', '에', '우'];
  function select(index) {
    setChoice(index);
    if (kind === 'lenia') { api()?.species(['OG2', 'O2(a)', '3G'][index]); setStimuli(0); setStimulusEmpty(false); }
    if (kind === 'origami') { api()?.model(['Tessellations/huffmanWaterbomb.svg','Tessellations/miura-ori.svg','Origami/flat_crane.svg'][index]); api()?.fold(value); }
    if (kind === 'voice') api()?.vowel(index);
  }
  function stimulate() {
    if (!ready || stimulusBusy) return;
    const changed = api()?.disturb();
    setStimulusEmpty(!changed);
    if (changed) setStimuli(count => count + 1);
    setStimulusBusy(true);
    stimulusTimer.current = setTimeout(() => setStimulusBusy(false), 800);
  }
  return <>
    <div className={`stage original-stage original-${kind}`}>
      {source && <iframe ref={frame} title={entries[kind].title} srcDoc={source} className={kind === 'voice' && !playing ? 'voice-idle' : ''} allow="autoplay"/>}
      {kind === 'lenia' && ready && <p className="lenia-feedback" role="status">{stimulusEmpty ? '생명체가 사라졌습니다. 위에서 패턴을 다시 선택해 주세요.' : stimuli ? `자극 ${stimuli}회 · 몸체를 옆으로 휘었습니다.${paused ? ' 재생하면 이후 반응을 볼 수 있습니다.' : ''}` : '몸체를 휘어 놓으면 어떻게 반응할까요?'}</p>}
      {!ready && !error && <div className="original-loading" role="status">원본 시뮬레이터를 준비하고 있습니다</div>}
      {error && <div className="original-loading" role="alert">{error}</div>}
    </div>
    {kind !== 'fluid' && <div className="work-controls original-presets"><div className="preset-options" aria-label={kind === 'voice' ? '모음 선택' : '패턴 선택'}>{options.map((option, i) => <button key={option} className={`control-button ${choice === i ? 'active' : ''}`} aria-pressed={choice === i} disabled={!ready} onClick={() => select(i)}>{option}</button>)}</div></div>}
    <div className={`work-controls original-controls ${kind === 'voice' ? 'voice-controls' : kind === 'fluid' ? 'fluid-controls' : ''}`}>
      {kind !== 'lenia' && <Slider label={kind === 'origami' ? '접힌 정도' : kind === 'voice' ? '목소리 높이' : '소용돌이 강도'} value={value} onChange={update} min={kind === 'voice' ? 80 : 0} max={kind === 'voice' ? 320 : 100} suffix={kind === 'origami' ? '%' : kind === 'voice' ? ' Hz' : ''}/>}
      {kind === 'fluid' && <button className="control-button" disabled={!ready} onClick={() => api()?.burst()}>색 폭발시키기</button>}
      {kind === 'lenia' && <button className="control-button" disabled={!ready || stimulusBusy} onClick={stimulate}>몸체에 자극 주기</button>}
      {kind === 'voice' && <button className={`control-button ${playing ? 'active' : ''}`} disabled={!ready || paused} onClick={toggleVoice}>{playing ? '발성 멈추기' : '발성 시작'}</button>}
      {kind !== 'lenia' && <p className="control-note">{kind === 'fluid' ? '클릭 없이 커서를 움직여 보세요. 터치 화면에서는 손가락으로 물감을 흐르게 합니다.' : kind === 'origami' ? '슬라이더로 펼치고 접기 · 드래그로 회전. 종이의 변형을 실제로 계산합니다.' : '발성을 켠 뒤 혀와 입안을 드래그하세요. 녹음 없이 성도를 계산해 만든 목소리입니다.'}</p>}
    </div>
  </>;
}
