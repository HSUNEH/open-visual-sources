// 2.5s settled + .2s scatter + .3s gather. Time only advances while playing.
export function advanceLineTransition(state, delta, hasNext, reduced = false) {
  state.elapsed += delta;
  let swap = false;
  if (reduced) {
    if (state.elapsed >= 3 && hasNext) { state.elapsed = 0; swap = true; }
    state.phase = 'hold';
    return { swap, amount: 0 };
  }
  if (state.phase === 'hold' && state.elapsed >= 2.5 && hasNext) {
    state.phase = 'out'; state.elapsed = 0;
  }
  if (state.phase === 'out' && state.elapsed >= .2) {
    state.phase = 'in'; state.elapsed -= .2; swap = true;
  }
  if (state.phase === 'in' && state.elapsed >= .3) {
    state.phase = 'hold'; state.elapsed = 0;
  }
  const amount = state.phase === 'out' ? (state.elapsed/.2)**2
    : state.phase === 'in' ? (1-state.elapsed/.3)**3 : 0;
  return { swap, amount };
}

export function fragmentLineArtwork(svg) {
  const bins = Array.from({ length: 32 }, () => []);
  for (const match of svg.matchAll(/<polyline\b[^>]*points="([^"]*)"[^>]*\/>/g)) {
    const points = match[1].trim().split(/\s+/).map(p=>p.split(',').map(Number));
    const x = points.reduce((sum,p)=>sum+p[0],0)/points.length;
    const y = points.reduce((sum,p)=>sum+p[1],0)/points.length;
    const cell = Math.min(3,Math.max(0,Math.floor(y/157.5)))*8 + Math.min(7,Math.max(0,Math.floor(x/125)));
    bins[cell].push(match[0]);
  }
  const fragments = bins.map((lines,index)=>{
    const x=(index%8+.5)*125,y=(Math.floor(index/8)+.5)*157.5;
    return {markup:lines.join(''),x,y,dx:(x-500)*.7,dy:(y-315)*.8+((index%3)-1)*65,angle:((index*7)%19)-9};
  }).filter(f=>f.markup);
  const markup = `<svg viewBox="0 0 1000 630" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0,630) scale(1,-1)">${fragments.map(f=>`<g data-fragment>${f.markup}</g>`).join('')}</g></svg>`;
  return { markup, fragments };
}
