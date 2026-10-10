import React, { useEffect, useRef, useState } from 'react';
import FFT from 'fft.js';
import * as Tone from 'tone';
import { Play, Square } from 'lucide-react';
import { Slider, canvasContext, useLoop } from './shared';

function Spectrum({ paused, ink }) {
  const canvas = useRef(null), audio = useRef(null);
  const fft = useRef(new FFT(1024));
  const input = useRef(new Float32Array(1024));
  const output = useRef(new Float64Array(2048));
  const mounted = useRef(true);
  const pauseRef = useRef(paused); pauseRef.current = paused;
  const [frequency, setFrequency] = useState(220);
  const [wave, setWave] = useState('sine');
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  function stop() {
    if (audio.current) { audio.current.oscillator.stop(); audio.current.context.close().catch(() => {}); audio.current = null; }
    if (mounted.current) setPlaying(false);
  }
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; stop(); }; }, []);
  useEffect(() => { if (paused) stop(); }, [paused]);
  useEffect(() => { audio.current?.oscillator.frequency.setTargetAtTime(frequency, audio.current.context.currentTime, .05); }, [frequency]);
  useEffect(() => { if(audio.current)audio.current.oscillator.type=wave; }, [wave]);
  async function toggle() {
    if (audio.current) { stop(); return; }
    try {
      const context = new AudioContext();
      const oscillator = context.createOscillator(), gain = context.createGain(), analyser = context.createAnalyser();
      analyser.fftSize = 1024; oscillator.type = wave; oscillator.frequency.value = frequency; gain.gain.value = .05;
      oscillator.connect(gain); gain.connect(analyser); analyser.connect(context.destination);
      audio.current = { context, oscillator, analyser }; oscillator.start();
      await context.resume();
      if (!mounted.current || pauseRef.current) { stop(); return; }
      setPlaying(true); setError('');
    } catch { stop(); setError('오디오를 시작하지 못했습니다. 다시 재생해 주세요.'); }
  }
  function draw(time) {
    const surface = canvasContext(canvas.current); if (!surface) return;
    const { ctx, width, height } = surface;
    const samples = input.current;
    if (audio.current) audio.current.analyser.getFloatTimeDomainData(samples);
    else for (let i = 0; i < samples.length; i++) { const phase=i*frequency/48000+time*.1; samples[i]=.65*(wave==='sine'?Math.sin(phase*Math.PI*2):wave==='square'?(Math.sin(phase*Math.PI*2)>0?1:-1):2*(phase-Math.floor(phase)) -1); }
    fft.current.realTransform(output.current, samples);
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = ink; ctx.lineWidth = 1.4; ctx.beginPath();
    const amp = playing ? 11 : .6;
    for (let i = 0; i < 1024; i++) { const x = i / 1023 * width, y = height * .23 + samples[i] * height * .16 * amp; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    ctx.globalAlpha = .16; ctx.beginPath(); ctx.moveTo(0, height * .48); ctx.lineTo(width, height * .48); ctx.stroke(); ctx.globalAlpha = 1;
    const bins = 80;
    for (let i = 1; i <= bins; i++) {
      const re = output.current[i * 2], im = output.current[i * 2 + 1];
      const magnitude = Math.sqrt(re * re + im * im) / 512;
      const h = Math.min(height * .38, Math.log(1 + magnitude * (playing ? 800 : 40)) / 4 * height * .36);
      ctx.fillStyle = i % 3 === 0 ? '#bbd789' : '#87aa8c';
      ctx.fillRect((i - 1) * width / bins, height - 24 - Math.max(2, h), Math.max(1, width / bins - 3), Math.max(2, h));
    }
  }
  useLoop(draw, paused);
  useEffect(() => { if (paused) draw(0); }, [frequency, paused, wave]);
  return <><div className="work-controls original-presets"><div className="preset-options">{[["sine","순음"],["square","사각파"],["sawtooth","톱니파"]].map(([id,label])=><button key={id} className={`control-button ${wave===id?"active":""}`} aria-pressed={wave===id} onClick={()=>setWave(id)}>{label}</button>)}</div></div><div className="stage sound-stage"><canvas ref={canvas} aria-label="시간 영역의 파형과 fft.js로 계산한 주파수 스펙트럼"/><div className="fft-labels"><span>WAVEFORM / FFT</span><span>{playing ? 'LIVE AUDIO' : 'SYNTHETIC PREVIEW'}</span></div></div><div className="work-controls"><Slider label="음높이" value={frequency} onChange={setFrequency} min={80} max={880} step={10} suffix=" Hz"/><button className={`control-button ${playing ? 'active' : ''}`} onClick={toggle} disabled={paused}>{playing ? <Square size={13}/> : <Play size={13}/>} {playing ? '소리 끄기' : '소리 듣기'}</button>{error && <p role="alert">{error}</p>}<p className="control-note">같은 음높이에서 파형을 바꿔 보세요.<br/>배음이 늘수록 소리가 거칠어집니다.</p></div></>;
}

function Sequencer({ paused, seed }) {
  const [preset,setPreset]=useState(0);
  const patterns=[[[0,3,6],[2,5],[1,4,7],[0,4]],[[0,2,4,6],[1,5],[3,7],[0,2,6]],[[0,7],[2,6],[1,4],[0,5]]];
  function choosePreset(index){setPreset(index);setPattern(patterns[index].map(row=>Array.from({length:8},(_,i)=>row.includes(i))));setTempo([92,128,68][index]);}
  const [pattern, setPattern] = useState(() => Array.from({ length: 4 }, (_, row) => Array.from({ length: 8 }, (_, col) => (col + row * 2 + seed) % (row + 3) === 0)));
  const patternRef = useRef(pattern); patternRef.current = pattern;
  const [tempo, setTempo] = useState(92);
  const [step, setStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const synth = useRef(null), sequence = useRef(null), mounted = useRef(true), effect=useRef(null), drum=useRef(null);
  const pauseRef = useRef(paused); pauseRef.current = paused;
  const notes = [['E5','C5','A4','D4'],['G4','D4','A3','D3'],['B4','G4','E4','C4']][preset];
  const notesRef=useRef(notes);notesRef.current=notes;
  function stop() { Tone.getTransport().stop(); sequence.current?.dispose(); sequence.current = null; synth.current?.dispose(); synth.current = null;effect.current?.dispose();effect.current=null;drum.current?.dispose();drum.current=null; if (mounted.current) { setPlaying(false); setStep(-1); } }
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; stop(); }; }, []);
  useEffect(() => { Tone.getTransport().bpm.value = tempo; }, [tempo]);
  useEffect(() => { if (paused) stop(); }, [paused]);
  async function toggle() {
    if (playing) { stop(); return; }
    setStarting(true);
    try {
      await Tone.start(); if (!mounted.current || pauseRef.current) return;
      effect.current=new Tone.FeedbackDelay('8n',.32).toDestination();effect.current.wet.value=.28;
      synth.current = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'triangle' }, envelope: { attack: .015, decay: .3, sustain: .1, release: 1.2 }, volume: -17 }).connect(effect.current);
      drum.current=new Tone.MembraneSynth({volume:-20,pitchDecay:.03,octaves:5}).toDestination();
      sequence.current = new Tone.Sequence((time, col) => {
        if (!mounted.current || !synth.current) return;
        notesRef.current.forEach((note, row) => { if (patternRef.current[row][col]) synth.current.triggerAttackRelease(note, '8n', time); });
        if(col===0||col===4)drum.current?.triggerAttackRelease('C2','16n',time);
        Tone.getDraw().schedule(() => { if (mounted.current) setStep(col); }, time);
      }, [0, 1, 2, 3, 4, 5, 6, 7], '8n').start(0);
      Tone.getTransport().bpm.value = tempo; Tone.getTransport().start(); setPlaying(true); setError('');
    } catch { stop(); setError('오디오를 시작하지 못했습니다. 다시 시도해 주세요.'); }
    finally { if (mounted.current) setStarting(false); }
  }
  return <><div className="work-controls original-presets"><div className="preset-options">{["잔향의 숲","미니멀 비트","느린 밤"].map((label,index)=><button key={label} className={`control-button ${preset===index?"active":""}`} aria-pressed={preset===index} onClick={()=>choosePreset(index)}>{label}</button>)}</div></div><div className="stage sound-stage"><div className="sequencer" aria-label="4개 음과 8개 박자로 만드는 시퀀서">{notes.map((note, row) => <React.Fragment key={note}><span className="note-label">{note}</span>{pattern[row].map((selected, col) => <button key={col} className={`sequence-cell ${selected ? 'selected' : ''} ${step === col ? 'beat' : ''}`} aria-label={`${note}, ${col + 1}번째 박자`} aria-pressed={selected} onClick={() => setPattern(p => p.map((r, ri) => ri === row ? r.map((v, ci) => ci === col ? !v : v) : r))}/>)}</React.Fragment>)}</div></div><div className="work-controls"><Slider label="템포" value={tempo} onChange={setTempo} min={50} max={160} suffix=" BPM"/><button className={`control-button ${playing ? 'active' : ''}`} onClick={toggle} disabled={paused || starting}>{playing ? <Square size={13}/> : <Play size={13}/>} {starting ? '소리 준비 중' : playing ? '재생 멈추기' : '내 패턴 재생'}</button>{error && <p role="alert">{error}</p>}<p className="control-note">동그라미를 눌러 음표를 놓으세요.<br/>킥과 딜레이 위에 나만의 루프.</p></div></>;
}
export default function Sound(props) { return props.kind === 'fft' ? <Spectrum {...props}/> : <Sequencer {...props}/>; }
