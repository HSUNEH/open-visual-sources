import {createCA} from './ca.js';
import {createGrowthClock} from './clock.js';
const canvas=document.querySelector('canvas'),gl=canvas.getContext('webgl',{preserveDrawingBuffer:true,alpha:false});
const models=new Map(),allowed=['lizard','butterfly','ladybug'];
let ca,paused=new URLSearchParams(location.search).get('paused')==='1',raf=0,loading=false,request=0,selected='lizard',speed=1,radius=8,pointer=null,holdUntil=0,paintCount=0,disposed=false;
const clock=createGrowthClock();
window.exhibitError='';
function draw(){if(!ca||disposed)return;twgl.bindFramebufferInfo(gl);ca.draw();}
function schedule(){if(!raf&&!paused&&!loading&&!disposed&&ca)raf=requestAnimationFrame(tick);}
function tick(time){raf=0;if(paused||loading||disposed)return;if(!pointer&&time>holdUntil){const count=clock.steps(time,speed);for(let i=0;i<count;i++)ca.step();}else clock.reset();draw();schedule();}
async function select(id){
  if(!allowed.includes(id))return;
  const ticket=++request;loading=true;window.exhibitError='';cancelAnimationFrame(raf);raf=0;
  try{
    if(!gl)throw Error('WebGL을 사용할 수 없습니다.');
    if(!models.has(id)){const response=await fetch(`./models/${id}.json`);if(!response.ok)throw Error('모델 파일을 불러오지 못했습니다.');models.set(id,await response.json());}
    if(disposed||ticket!==request)return;
    if(ca)ca.setWeights(models.get(id));else ca=createCA(gl,models.get(id),[64,64]);
    selected=id;ca.reset();clock.reset();paintCount=0;pointer=null;holdUntil=0;loading=false;draw();schedule();
  }catch(error){if(ticket===request){loading=false;window.exhibitError=error.message||'NCA를 시작하지 못했습니다.';}}
}
function reset(){if(!ca||loading)return;pointer=null;holdUntil=0;ca.reset();clock.reset();paintCount=0;draw();schedule();}
function erase(x,y){if(!ca||loading)return;ca.paint(x,y,radius,'clear');paintCount++;draw();}
function coordinates(event){const box=canvas.getBoundingClientRect(),side=Math.min(box.width,box.height);return {x:(event.clientX-box.left-(box.width-side)/2)*64/side,y:(event.clientY-box.top-(box.height-side)/2)*64/side};}
canvas.addEventListener('pointerdown',event=>{if(event.button!==0||pointer||loading)return;const point=coordinates(event);if(point.x<0||point.y<0||point.x>=64||point.y>=64)return;canvas.setPointerCapture(event.pointerId);pointer={id:event.pointerId,...point};erase(point.x,point.y);});
canvas.addEventListener('pointermove',event=>{if(!pointer||pointer.id!==event.pointerId)return;const next=coordinates(event),distance=Math.hypot(next.x-pointer.x,next.y-pointer.y),count=Math.max(1,Math.ceil(distance/(radius*.5)));for(let i=1;i<=Math.min(count,64);i++){const t=i/count,x=pointer.x+(next.x-pointer.x)*t,y=pointer.y+(next.y-pointer.y)*t;if(x>=0&&y>=0&&x<64&&y<64)erase(x,y);}pointer={id:event.pointerId,...next};});
function release(){pointer=null;holdUntil=performance.now()+350;}
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,release);
window.addEventListener('blur',release);
window.addEventListener('wheel',event=>{if(event.ctrlKey)return;event.preventDefault();parent.dispatchEvent(new CustomEvent('exhibit-wheel',{detail:{x:event.deltaX,y:event.deltaY,mode:event.deltaMode,shift:event.shiftKey}}));},{passive:false});
window.addEventListener('keydown',event=>{if(['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Escape',' '].includes(event.key)){event.preventDefault();parent.dispatchEvent(new KeyboardEvent('keydown',{key:event.key,code:event.code}));}});
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();cancelAnimationFrame(raf);raf=0;window.exhibitError='그래픽 연결이 끊겼습니다. 새로 생성해 주세요.';});
window.exhibit={
  select,reset,
  pause(value){paused=value;clock.reset();if(value){cancelAnimationFrame(raf);raf=0;pointer=null;}else schedule();},
  size(value){radius=Math.max(3,Math.min(14,Number(value)||8));},
  speed(value){speed=Math.max(.25,Math.min(4,Number(value)||1));clock.reset();},
  damage(){if(loading||!ca)return;erase(32,29);holdUntil=performance.now()+500;},
  status(){return {ready:!!ca&&!loading,loading,selected,paused,speed,steps:ca?.getStepCount()||0,paintCount,error:window.exhibitError};},
  // Read-only diagnostic: compare actual rendered pixels before damage/after recovery.
  measure(){if(!ca)return null;draw();const pixels=new Uint8Array(512*512*4);gl.readPixels(0,0,512,512,gl.RGBA,gl.UNSIGNED_BYTE,pixels);let ink=0;for(let i=0;i<pixels.length;i+=4)if(Math.min(pixels[i],pixels[i+1],pixels[i+2])<220)ink++;return {ink,steps:ca.getStepCount(),paintCount};},
  dispose(){disposed=true;request++;cancelAnimationFrame(raf);gl?.getExtension('WEBGL_lose_context')?.loseContext();},
};
select('lizard');
