import React, { useEffect, useRef } from 'react';

export function useLoop(callback, paused = false) {
  const latest = useRef(callback);
  latest.current = callback;
  const elapsed = useRef(0);
  useEffect(() => {
    let frame;
    let last;
    const tick = now => {
      const delta = last === undefined ? 0 : Math.min((now - last) / 1000, .05);
      last = now;
      if (!paused) elapsed.current += delta;
      latest.current(elapsed.current, paused ? 0 : delta);
      if (!paused) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [paused]);
}

export function canvasContext(canvas) {
  if (!canvas) return null;
  const { width, height } = canvas.getBoundingClientRect();
  if (!width || !height) return null;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { ctx, width, height };
}

export function random(seed) {
  let state = seed >>> 0;
  return () => { state += 0x6D2B79F5; let t = state; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

export function saveText(text, filename, type = 'image/svg+xml') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Slider({ label, value, onChange, min = 0, max = 100, step = 1, suffix = '' }) {
  return <label><span className="slider-label"><span>{label}</span><span>{value}{suffix}</span></span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))}/></label>;
}
