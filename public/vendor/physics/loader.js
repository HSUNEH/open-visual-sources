(async()=>{
  try{
    window.physicsKind=new URLSearchParams(location.search).get('kind')==='cloth'?'cloth':'soft';
    const [response,adapter]=await Promise.all([fetch(`${physicsKind}.html`),fetch('adapter.js?v=1')]);
    if(!response.ok||!adapter.ok)throw Error('물리 엔진을 불러오지 못했습니다.');
    const doc=new DOMParser().parseFromString(await response.text(),'text/html');
    let source=[...doc.querySelectorAll('script:not([src])')].map(s=>s.textContent).join('\n');
    const boot=/initThreeScene\(\);\s*onWindowResize\(\);\s*initPhysics\(\);\s*update\(\);/;
    if(!boot.test(source))throw Error('원본 초기화 코드를 확인해 주세요.');
    source=source.replace(boot,'');
    const script=document.createElement('script');script.textContent=source+'\n'+await adapter.text();document.body.append(script);
  }catch(error){window.exhibitError=error.message;}
})();
