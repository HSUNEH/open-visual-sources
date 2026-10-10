// 2s settled + .45s dispersal + .55s assembly, with continuous particle paths.
export function advanceLineTransition(state, delta, hasNext, reduced = false) {
  state.elapsed += delta;
  let swap = false;
  if (reduced) {
    if (state.elapsed >= 3 && hasNext) { state.elapsed = 0; swap = true; }
    state.phase = 'hold';
    return { swap, progress: 0 };
  }
  if (state.phase === 'hold' && state.elapsed >= 2 && hasNext) {
    state.phase = 'out'; state.elapsed = 0;
  }
  if (state.phase === 'out' && state.elapsed >= .45) {
    state.phase = 'in'; state.elapsed -= .45; swap = true;
  }
  if (state.phase === 'in' && state.elapsed >= .55) {
    state.phase = 'hold'; state.elapsed = 0;
  }
  return { swap, progress: state.phase === 'out' ? state.elapsed : state.phase === 'in' ? .45+state.elapsed : 0 };
}

// Equal arc-length samples keep fine detail and bound canvas work. The original
// SVG is untouched for settled frames and downloads.
export function sampleLineArtwork(svg, count = 9000) {
  const segments = [];
  let length = 0;
  for (const match of svg.matchAll(/<polyline\b[^>]*points="([^"]*)"[^>]*\/?>/g)) {
    const points = match[1].trim().split(/\s+/).map(p=>p.split(',').map(Number));
    for (let i=1; i<points.length; i++) {
      const [x,y]=points[i-1], [ex,ey]=points[i], distance=Math.hypot(ex-x,ey-y);
      if (!Number.isFinite(distance) || !distance) continue;
      segments.push({x,y,dx:ex-x,dy:ey-y,start:length,length:distance}); length+=distance;
    }
  }
  if (!segments.length) return new Float32Array();
  const result = new Float32Array(count*2);
  let index=0;
  for (let i=0;i<count;i++) {
    const distance=(i+.5)/count*length;
    while(index<segments.length-1 && distance>segments[index].start+segments[index].length) index++;
    const s=segments[index], t=(distance-s.start)/s.length;
    result[i*2]=s.x+s.dx*t; result[i*2+1]=s.y+s.dy*t;
  }
  return result;
}

const smooth = t => { t=Math.max(0,Math.min(1,t)); return t*t*(3-2*t); };
export function lineParticle(from,to,index,progress) {
  const x=from[index*2], y=from[index*2+1], tx=to[index*2], ty=to[index*2+1];
  const noise=Math.sin(index*127.1+311.7)*43758.5453, random=noise-Math.floor(noise), angle=index*2.399963;
  const radius=45+random*125, cx=(x+tx)/2+Math.cos(angle)*radius, cy=(y+ty)/2+Math.sin(angle)*radius*.8;
  const t=progress<=.45 ? smooth((progress-random*.07)/(.45-random*.07)) : smooth((progress-.45)/(.55-random*.07));
  const curl=Math.sin(t*Math.PI)*14*Math.sin(angle+progress*5);
  return progress<=.45 ? [x+(cx-x)*t+curl,y+(cy-y)*t-curl*.6] : [cx+(tx-cx)*t+curl,cy+(ty-cy)*t-curl*.6];
}
