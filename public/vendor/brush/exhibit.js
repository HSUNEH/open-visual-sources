import * as brush from './dist/brush.esm.js';
const W=900,H=550,paper='#f1e3d9';
let paused=false,raf=0,queue=[],pointer=null,tool='water',color='#b65445',size=24;
const canvas=brush.createCanvas(W,H,{parent:document.body,pixelDensity:Math.min(devicePixelRatio,1.5)});
canvas.setAttribute('aria-label','수채화와 연필로 직접 그리는 종이');
brush.scaleBrushes(3);brush.angleMode(brush.RADIANS);
function paint(operation){brush.push();brush.translate(-W/2,-H/2);operation();brush.pop();brush.render();}
function wash(x,y,r,c,opacity=180){brush.noStroke();brush.fill(c,opacity);brush.fillBleed(.22);brush.fillTexture(.45,.65);brush.circle(x,y,r,.25);}
function schedule(){if(!raf&&!paused&&queue.length)raf=requestAnimationFrame(tick);}
function tick(){raf=0;if(paused)return;const operation=queue.shift();if(operation)paint(operation);schedule();}
function reset(seed,preset=0){
  queue=[];brush.seed(seed);brush.noiseSeed(seed);brush.clear(paper);brush.render();
  let s=seed>>>0;const rand=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};
  if(preset===0){
    for(let i=0;i<5;i++){
      const x=190+i*125+(rand()-.5)*45,y=170+rand()*170,r=38+rand()*27;
      queue.push(()=>{brush.noFill();brush.set('HB','#53604a',1.2);brush.spline([[x-30,505],[x+20,y+100],[x,y]],.65);});
      for(let p=0;p<5;p++){const a=p/5*Math.PI*2;queue.push(()=>wash(x+Math.cos(a)*r*.7,y+Math.sin(a)*r*.55,r,['#bd6250','#bc8190','#d39a54'][i%3],220));}
      queue.push(()=>wash(x,y,12,'#705449',150));
      queue.push(()=>{brush.noStroke();brush.fill('#6d8060',210);brush.polygon([[x,y+75],[x-65,y+30],[x-40,y+86],[x,y+105]]);});
    }
  }else{
    for(let i=0;i<13;i++){const x=170+rand()*570,y=110+rand()*310,r=45+rand()*80,c=['#ad5544','#587d87','#9a8b56','#bc8190'][i%4];queue.push(()=>wash(x,y,r,c,180));}
    for(let i=0;i<7;i++){const y=100+i*55;queue.push(()=>{brush.noFill();brush.set('HB','#542f25',.65);brush.spline([[130,y],[350,y+55],[550,y-40],[780,y+15]],.65);});}
  }
  schedule();
}
function coords(event){const rect=canvas.getBoundingClientRect(),scale=Math.min(rect.width/W,rect.height/H);return{x:(event.clientX-rect.left-(rect.width-W*scale)/2)/scale,y:(event.clientY-rect.top-(rect.height-H*scale)/2)/scale};}
function stroke(next,previous){
  const c=color,r=size,t=tool;
  // Process a bounded number of real brush operations per frame, not one per
  // raw pointer event. Freehand input remains responsive on high-rate devices.
  if(queue.length>60)return;
  queue.push(()=>{if(t==='water')wash(next.x,next.y,r,c,145);else{brush.noFill();brush.set(t==='pencil'?'HB':'charcoal',c,t==='pencil'?1.5:r/8);brush.line(previous.x,previous.y,next.x,next.y);}});
  if(paused){paint(queue.pop());}else schedule();
}
canvas.addEventListener('pointerdown',event=>{if(event.button!==0||pointer)return;queue=[];canvas.setPointerCapture(event.pointerId);pointer={id:event.pointerId,...coords(event)};stroke(pointer,{x:pointer.x+.1,y:pointer.y+.1});});
canvas.addEventListener('pointermove',event=>{if(!pointer||pointer.id!==event.pointerId)return;const next=coords(event);if(Math.hypot(next.x-pointer.x,next.y-pointer.y)<(tool==='water'?size*.35:3))return;stroke(next,pointer);pointer={id:event.pointerId,...next};});
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>pointer=null);
window.addEventListener('blur',()=>pointer=null);
window.addEventListener('wheel',event=>{if(event.ctrlKey)return;event.preventDefault();parent.dispatchEvent(new CustomEvent('exhibit-wheel',{detail:{x:event.deltaX,y:event.deltaY,mode:event.deltaMode,shift:event.shiftKey}}));},{passive:false});
window.addEventListener('keydown',event=>{if(['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Escape',' '].includes(event.key)){event.preventDefault();parent.dispatchEvent(new KeyboardEvent('keydown',{key:event.key,code:event.code}));}});
window.exhibit={
  pause(value){paused=value;if(value){cancelAnimationFrame(raf);raf=0;}else schedule();},
  tool(value){tool=value;},color(value){color=value;},size(value){size=value;},
  compose:reset,
  clear(){queue=[];brush.clear(paper);brush.render();},
  save(){const a=document.createElement('a');a.download='brush-study.png';a.href=canvas.toDataURL('image/png');a.click();},
};
reset(Number(new URLSearchParams(location.search).get('seed'))||1);
