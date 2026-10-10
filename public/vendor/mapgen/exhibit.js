let error='',strokes=0;window.addEventListener('error',event=>{error=event.message;});window.addEventListener('unhandledrejection',event=>{error=String(event.reason);});
window.alert=message=>{error=message;};
const canvas=document.querySelector('canvas');canvas.addEventListener('pointerdown',()=>strokes++);
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();error='그래픽 연결이 끊겼습니다. 새로 생성해 주세요.';});
window.exhibit={
 status:()=>({...window.mapgen?.status(),ready:!!window.mapgen?.status().ready&&!error,error,strokes}),
 tool(id){if(['mountain','valley','ocean','shallow'].includes(id))document.getElementById(id).click();},
 size(id){if(['small','medium','large'].includes(id))document.getElementById(id).click();},
 rain(value){const input=document.querySelector('#slider-raininess input');if(input){input.value=value;input.dispatchEvent(new Event('input'));}},
 reset(){document.getElementById('button-reset').click();},
 pause(){}, // No automatic simulation: map changes only on user input.
 dispose(){window.mapgen?.dispose();canvas.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext();}
};
window.addEventListener('wheel',event=>{if(event.ctrlKey)return;event.preventDefault();parent.dispatchEvent(new CustomEvent('exhibit-wheel',{detail:{x:event.deltaX,y:event.deltaY,mode:event.deltaMode,shift:event.shiftKey}}));},{passive:false});
window.addEventListener('keydown',event=>{if(['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Escape',' '].includes(event.key)){event.preventDefault();parent.dispatchEvent(new KeyboardEvent('keydown',{key:event.key,code:event.code}));}});
