import wfc from 'wavefunctioncollapse';
import {random} from './shared-random';
let model,rng,paused=false,timer,failures=0;
function step() {
  if(!model||paused)return;
  const ok=model.iterate(7,rng),complete=model.isGenerationComplete();
  if(!ok) {
    if(++failures>12){postMessage({error:'이 규칙으로 완성하지 못했습니다. 다시 생성하거나 다른 표본을 골라 주세요.'});return;}
    model.clear();postMessage({retry:failures});
  } else {
    const pixels=model.graphics();
    postMessage({pixels,complete},[pixels.buffer]);
  }
  if(!complete)timer=setTimeout(step,36);
}
onmessage=({data})=>{
  clearTimeout(timer);
  if(data.type==='init') {
    try {
      failures=0;paused=data.paused;rng=random(data.seed);
      model=new wfc.OverlappingModel(data.pixels,data.width,data.height,data.pattern,64,40,true,false,data.symmetry);
      model.initialize();model.clear();postMessage({pixels:model.graphics(),complete:false});
    }catch{postMessage({error:'규칙을 읽지 못했습니다. 다른 표본을 고르거나 다시 생성해 주세요.'});return;}
  }else paused=data.paused;
  if(!model?.isGenerationComplete())step();
};
