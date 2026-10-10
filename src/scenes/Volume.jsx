import React,{useLayoutEffect,useMemo,useRef,useState} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {Slider} from './shared';
import {updateVolumeUniforms} from './volume-uniforms';

const vertex=`varying vec2 uv0;void main(){uv0=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const fragment=`
precision highp float;
varying vec2 uv0;
uniform float clock,threshold,cut,seed,sliceMode,aspect;
float hash(vec3 p){p=mod(p,8.);return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float field(vec3 p){vec3 q=p*3.+vec3(seed,clock*.22,clock*.11);return noise(q)*.72+noise(q*2.)*.28;}
void main(){
 vec3 bg=vec3(.141,.267,.345),col=bg;
 if(sliceMode>.5){
   vec3 p=vec3((uv0-.5)*2.,cut);
   float f=field(p);float mask=smoothstep(threshold-.018,threshold+.018,f);
   col=mix(vec3(.07,.16,.21),vec3(.95,.71,.39),mask);
   float contour=1.-smoothstep(.006,.017,abs(f-threshold));col=mix(col,vec3(1.,.95,.78),contour);
 } else {
   vec2 p=(uv0-.5)*2.;p.x*=aspect;
   vec3 ro=vec3(3.1,2.35,4.2),fw=normalize(-ro),right=normalize(cross(fw,vec3(0,1,0))),up=cross(right,fw);
   vec3 rd=normalize(fw*2.7+right*p.x+up*p.y);
   for(int i=0;i<150;i++){
     vec3 q=ro+rd*(3.5+float(i)*.027);
     if(max(abs(q.x),abs(q.y))>1.||q.z< -1.||q.z>cut)continue;
     if(field(q)>threshold){
       vec2 e=vec2(.016,0.);vec3 n=-normalize(vec3(field(q+e.xyy)-field(q-e.xyy),field(q+e.yxy)-field(q-e.yxy),field(q+e.yyx)-field(q-e.yyx)));
       bool face=abs(q.z-cut)<.035;
       if(face)n=vec3(0,0,1);
       float light=.27+.73*max(0.,dot(n,normalize(vec3(-2,4,5))));
       col=(face?vec3(.95,.71,.39):vec3(.34,.76,.75))*light;
       col+=vec3(.1,.18,.2)*pow(1.-max(0.,dot(n,-rd)),3.);
       break;
     }
   }
 }
 gl_FragColor=vec4(col,1.);
}`;
function Field({paused,density,cut,seed,sliceMode}){
  const material=useRef(null);
  const {invalidate,size}=useThree();
  const uniforms=useMemo(()=>({clock:{value:0},threshold:{value:.5},cut:{value:1},seed:{value:(seed%997)/71},sliceMode:{value:sliceMode?1:0},aspect:{value:1}}),[seed,sliceMode]);
  const aspect=size.width/Math.max(1,size.height);
  useLayoutEffect(()=>{
    updateVolumeUniforms(material.current,{density,cut,seed,aspect});
    // Demand-mode canvases must redraw when controls change while paused.
    invalidate();
  },[density,cut,seed,aspect,invalidate]);
  useFrame((_,dt)=>{
    updateVolumeUniforms(material.current,{density,cut,seed,aspect},paused?0:dt);
  });
  return <mesh><planeGeometry args={[2,2]}/><shaderMaterial ref={material} uniforms={uniforms} vertexShader={vertex} fragmentShader={fragment}/></mesh>;
}
export default function Volume({paused,seed}){
  const [density,setDensity]=useState(48),[cut,setCut]=useState(65);
  return <><div className="stage volume-lab"><div className="volume-object"><Canvas dpr={[1,1.5]} frameloop={paused?'demand':'always'} gl={{antialias:false}} fallback={<p>이 실험에는 WebGL이 필요합니다.</p>}><Field paused={paused} density={density} cut={cut} seed={seed}/></Canvas><span>3D 밀도장 · 잘라낸 입체</span></div><div className="volume-slice"><Canvas dpr={[1,1.5]} frameloop={paused?'demand':'always'} gl={{antialias:false}}><Field paused={paused} density={density} cut={cut} seed={seed} sliceMode/></Canvas><span>같은 위치의 2D 단면</span></div><p className="scene-instruction">단면 위치를 움직여 입체 내부를 잘라 보세요. 밝은 영역만 입체로 남습니다.</p></div><div className="work-controls"><Slider label="밀도 경계" value={density} onChange={setDensity} min={10} max={80}/><Slider label="단면 위치" value={cut} onChange={setCut} min={5} max={100} suffix="%"/><p className="control-note">움직이는 3D 노이즈를 입체와 단면으로 비교합니다. 자체 GLSL 원리 실험입니다.</p></div></>;
}
