// Local scene/lifecycle around Matthias Müller's unmodified MIT solver.
const exhibitCloth=window.physicsKind==='cloth';
let exhibitRAF=0,exhibitFrames=0,exhibitCost=0,exhibitLast=0,exhibitDisposed=false,exhibitGrabs=0,exhibitStiffness=40,exhibitBending;
gThreeScene=new THREE.Scene();gThreeScene.background=new THREE.Color(0xdbe7ed);
gThreeScene.add(new THREE.HemisphereLight(0xffffff,0x6e8490,.7));
const exhibitLight=new THREE.DirectionalLight(0xffffff,.7);exhibitLight.position.set(-2,4,3);gThreeScene.add(exhibitLight);
gRenderer=new THREE.WebGLRenderer({antialias:true});gRenderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
document.getElementById('container').appendChild(gRenderer.domElement);
gRenderer.domElement.setAttribute('aria-label','물체를 잡아 끌어 변형해 보세요');
gCamera=new THREE.PerspectiveCamera(38,innerWidth/innerHeight,.01,30);
gCamera.position.set(0,1.25,3);gCamera.lookAt(0,.75,0);
gCameraControl=new THREE.OrbitControls(gCamera,gRenderer.domElement);gCameraControl.target.set(0,.75,0);gCameraControl.enableZoom=false;gCameraControl.enablePan=false;gCameraControl.update();
const exhibitFloor=new THREE.Mesh(new THREE.PlaneGeometry(20,20),new THREE.MeshBasicMaterial({color:0xd3e1e8}));exhibitFloor.rotation.x=-Math.PI/2;exhibitFloor.position.y=-.005;gThreeScene.add(exhibitFloor);
gPhysicsScene.numSubsteps=8;gPhysicsScene.paused=new URLSearchParams(location.search).get('paused')==='1';gGrabber=new Grabber();
function exhibitObject(){return exhibitCloth?gPhysicsScene.cloth:gPhysicsScene.objects[0];}
function exhibitDraw(){const obj=exhibitObject();if(exhibitCloth)obj.updateVisMeshes();else obj.updateMeshes();gRenderer.render(gThreeScene,gCamera);}
function exhibitRemove(){const obj=exhibitObject();if(!obj)return;for(const key of ['surfaceMesh','triMesh','backMesh','edgeMesh'])if(obj[key]){gThreeScene.remove(obj[key]);obj[key].geometry.dispose();obj[key].material.dispose();}}
function exhibitReset(){
  gGrabber.end();exhibitRemove();
  if(exhibitCloth){
    const nx=30,ny=30;gPhysicsScene.cloth=new Cloth(gThreeScene,nx,ny,.04,.035,.1);
    const c=gPhysicsScene.cloth;c.invMass[ny-1]=0;c.invMass[(nx-1)*ny+ny-1]=0;exhibitBending=Uint8Array.from(c.compliances,v=>v>.001?1:0);
    for(let i=0;i<c.numParticles;i++){c.pos[i*3+2]=.06*Math.sin(i/ny*.5);c.prevPos[i*3+2]=c.pos[i*3+2];}
    c.triMesh.material.color.set(0x376d8a);c.backMesh.material.color.set(0x91b7c6);c.edgeMesh.material.color.set(0x173849);
  }else{
    const b=new SoftBody(bunnyMesh,gThreeScene);gPhysicsScene.objects=[b];b.surfaceMesh.material.color.set(0x487f95);b.translate(0,.3,0);
  }
  exhibitApplyStiffness(exhibitStiffness);exhibitDraw();
}
function exhibitApplyStiffness(value){
  exhibitStiffness=value;const obj=exhibitObject();if(!obj)return;
  if(exhibitCloth){for(let i=0;i<obj.numConstraints;i++)if(exhibitBending[i])obj.compliances[i]=.001+(100-value)/100*.8;}
  else obj.edgeCompliance=(100-value)*2;
}
function exhibitSchedule(){if(!exhibitRAF&&!gPhysicsScene.paused&&!exhibitDisposed)exhibitRAF=requestAnimationFrame(exhibitTick);}
function exhibitTick(time){exhibitRAF=0;if(gPhysicsScene.paused||exhibitDisposed)return;
  if(time-exhibitLast>=15){exhibitLast=time;const start=performance.now();simulate();exhibitDraw();exhibitCost=exhibitCost*.9+(performance.now()-start)*.1;exhibitFrames++;}exhibitSchedule();}
// Do not let the original grabber silently unpause an explicitly paused scene.
run=function(){};
let exhibitPointer=null;
const exhibitCanvas=gRenderer.domElement;
exhibitCanvas.addEventListener('pointerdown',event=>{
 if(event.button!==0||exhibitPointer!==null)return;
 exhibitPointer=event.pointerId;exhibitCanvas.setPointerCapture(event.pointerId);gGrabber.start(event.clientX,event.clientY);
 if(gGrabber.physicsObject){exhibitGrabs++;gCameraControl.enabled=false;}
});
exhibitCanvas.addEventListener('pointermove',event=>{if(exhibitPointer!==event.pointerId)return;gGrabber.move(event.clientX,event.clientY);exhibitDraw();});
function exhibitRelease(){gGrabber.end();exhibitPointer=null;gCameraControl.enabled=true;}
for(const event of ['pointerup','pointercancel','lostpointercapture'])exhibitCanvas.addEventListener(event,exhibitRelease);
window.addEventListener('blur',exhibitRelease);
gCameraControl.addEventListener('change',()=>{if(exhibitObject())exhibitDraw();});
window.addEventListener('resize',()=>{gCamera.aspect=innerWidth/innerHeight;gCamera.updateProjectionMatrix();gRenderer.setSize(innerWidth,innerHeight);exhibitDraw();});
window.addEventListener('wheel',event=>{if(event.ctrlKey)return;event.preventDefault();event.stopImmediatePropagation();parent.dispatchEvent(new CustomEvent('exhibit-wheel',{detail:{x:event.deltaX,y:event.deltaY,mode:event.deltaMode,shift:event.shiftKey}}));},{capture:true,passive:false});
window.addEventListener('keydown',event=>{if(['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Escape',' '].includes(event.key)){event.preventDefault();parent.dispatchEvent(new KeyboardEvent('keydown',{key:event.key,code:event.code}));}});
exhibitCanvas.addEventListener('webglcontextlost',event=>{event.preventDefault();window.exhibitError='그래픽 연결이 끊겼습니다. 새로 생성해 주세요.';cancelAnimationFrame(exhibitRAF);});
window.exhibit={
 pause(value){gPhysicsScene.paused=value;exhibitLast=0;if(value){cancelAnimationFrame(exhibitRAF);exhibitRAF=0;exhibitRelease();}else exhibitSchedule();},
 stiffness:exhibitApplyStiffness,reset:exhibitReset,
 impulse(){const obj=exhibitObject();if(exhibitCloth){for(let i=0;i<obj.numParticles;i++)obj.vel[i*3+2]+=1.2;}else{for(let i=0;i<obj.numParticles;i++){obj.pos[i*3+1]=.06+(obj.pos[i*3+1]-.06)*.55;obj.vel[i*3+1]=0;}}exhibitDraw();},
 status(){const obj=exhibitObject();let checksum=0;for(let i=0;i<obj.pos.length;i++)checksum+=obj.pos[i]*(i%7+1);return {ready:!window.exhibitError,kind:physicsKind,paused:gPhysicsScene.paused,frames:exhibitFrames,simulationMs:exhibitCost,particles:obj.numParticles,grabs:exhibitGrabs,checksum,error:window.exhibitError};},
 dispose(){exhibitDisposed=true;cancelAnimationFrame(exhibitRAF);gCameraControl.dispose();exhibitRemove();exhibitFloor.geometry.dispose();exhibitFloor.material.dispose();gRenderer.dispose();gRenderer.forceContextLoss();}
};
gRenderer.setSize(innerWidth,innerHeight);exhibitReset();exhibitSchedule();
