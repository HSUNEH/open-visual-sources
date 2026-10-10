import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MeshBVH, acceleratedRaycast } from 'three-mesh-bvh';
import { Slider } from './shared';

function Controls() {
  const { camera, gl, invalidate } = useThree();
  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = false;
    controls.target.set(0, .5, 0);
    controls.addEventListener('change', invalidate);
    controls.update();
    return () => controls.dispose();
  }, [camera, gl, invalidate]);
  return null;
}

function Environment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const generator = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const target = generator.fromScene(room, .04);
    scene.environment = target.texture;
    return () => { scene.environment = null; target.dispose(); room.dispose(); generator.dispose(); };
  }, [gl, scene]);
  return null;
}

function Sculpture({ kind, paused, speed, seed }) {
  const mesh = useRef(null);
  const dot = useRef(null);
  const { invalidate } = useThree();
  const geometry = useMemo(() => {
    const geo = new THREE.TorusKnotGeometry(1.34, kind === 'bvh' ? .35 : .29, 320, 40, seed % 2 === 0 ? 3 : 2, seed % 2 === 0 ? 4 : 3);
    if (kind === 'bvh') geo.boundsTree = new MeshBVH(geo);
    return geo;
  }, [kind, seed]);
  useEffect(() => () => { geometry.boundsTree = null; geometry.dispose(); }, [geometry]);
  useFrame((_, delta) => {
    if (!paused && mesh.current) {
      mesh.current.rotation.y += Math.min(delta, .05) * speed / 180;
      mesh.current.rotation.z += Math.min(delta, .05) * speed / 420;
    }
  });
  return <>
    <mesh ref={mesh} geometry={geometry} position={[0, .7, 0]} rotation={[.3, -.4, .2]} raycast={kind === 'bvh' ? acceleratedRaycast : THREE.Mesh.prototype.raycast} onPointerMove={event => {
      if (kind !== 'bvh' || !dot.current) return;
      dot.current.position.copy(event.point);
      dot.current.visible = true;
      invalidate();
    }} onPointerOut={() => { if (dot.current) dot.current.visible = false; invalidate(); }}>
      <meshPhysicalMaterial color={kind === 'bvh' ? '#c3abda' : '#b7cfbd'} roughness={.19} metalness={.88} clearcoat={.7} clearcoatRoughness={.2}/>
    </mesh>
    {kind === 'bvh' && <mesh ref={dot} visible={false}><sphereGeometry args={[.09, 20, 20]}/><meshBasicMaterial color="#f9ed85" depthTest={false}/></mesh>}
  </>;
}

function TerrainScanner({ paused, speed, seed }) {
  const mesh = useRef(null), marker = useRef(null), beam = useRef(null), time = useRef(0), hovered = useRef(false);
  const { invalidate } = useThree();
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(5.3, 4, 160, 128); geo.rotateX(-Math.PI / 2);
    const positions = geo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), z = positions.getZ(i);
      const height = Math.sin(x * 2.3 + seed) * Math.cos(z * 1.7) * .45 + Math.sin(x * 4 + z * 2) * .16 + Math.exp(-(x*x+z*z)*.35) * 1.2;
      positions.setY(i, height);
    }
    geo.computeVertexNormals(); geo.boundsTree = new MeshBVH(geo); return geo;
  }, [seed]);
  useEffect(() => () => { geometry.boundsTree = null; geometry.dispose(); }, [geometry]);
  const beamGeometry = useMemo(() => new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), []);
  useEffect(() => () => beamGeometry.dispose(), [beamGeometry]);
  function locate(point) {
    if (!marker.current) return;
    marker.current.position.copy(point);
    const positions = beamGeometry.attributes.position;
    positions.setXYZ(0, point.x, 3.4, point.z); positions.setXYZ(1, point.x, point.y, point.z); positions.needsUpdate = true;
    beamGeometry.computeBoundingSphere(); invalidate();
  }
  useFrame((_, delta) => {
    if (paused || hovered.current || !mesh.current) return;
    time.current += delta * speed / 35;
    ray.set(new THREE.Vector3(Math.sin(time.current * .4) * 2.2, 5, Math.cos(time.current * .7) * 1.6), new THREE.Vector3(0,-1,0));
    ray.firstHitOnly = true;
    const hit = ray.intersectObject(mesh.current)[0]; if (hit) locate(hit.point);
  });
  return <>
    <mesh ref={mesh} geometry={geometry} position={[0,.1,0]} raycast={acceleratedRaycast} onPointerMove={event => { hovered.current = true; locate(event.point); }} onPointerOut={() => { hovered.current = false; }}>
      <meshStandardMaterial color="#9bbaa8" roughness={.72} metalness={.12} wireframe/>
    </mesh>
    <mesh ref={marker}><sphereGeometry args={[.065,16,16]}/><meshBasicMaterial color="#f9ed85"/></mesh>
    <line ref={beam} geometry={beamGeometry}><lineBasicMaterial color="#f9ed85" transparent opacity={.7}/></line>
  </>;
}

const vertexShader = `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const fragmentShader = `
precision highp float;
varying vec2 vUv;
uniform float uTime,uDensity,uSeed;
float hash(vec3 p){ p=mod(p,vec3(8.));return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float field(vec3 p){vec3 q=p*2.1+vec3(uTime*.1,uSeed,0.);float n=noise(q)*.55+noise(q*2.)*.3+noise(q*4.)*.15;return max(0.,n-.34+(uDensity-.5)*.35)*smoothstep(1.55,.62,length(p*vec3(1.,1.2,1.)));}
void main(){vec2 uv=(vUv-.5)*3.8;vec3 ro=vec3(uv,3.);vec3 rd=vec3(0.,0.,-1.);vec4 sum=vec4(0.);for(int i=0;i<72;i++){vec3 p=ro+rd*(float(i)*.06+.7);float d=field(p);if(d>.005){float light=clamp((d-field(p+vec3(-.2,.24,.16)))*5.,0.,1.);vec3 col=mix(vec3(.34,.5,.57),vec3(1.,.96,.86),light*.85+clamp(p.y*.2+.45,0.,1.)*.4);float a=d*.31;sum.rgb+=(1.-sum.a)*col*a;sum.a+=(1.-sum.a)*a;}if(sum.a>.99)break;}gl_FragColor=vec4(sum.rgb/max(sum.a,.001),sum.a);}
`;
function Cloud({ paused, density, seed }) {
  const material = useRef(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uDensity: { value: density / 100 }, uSeed: { value: seed * .731 } }), [seed]);
  useEffect(() => { if (material.current) material.current.uniforms.uDensity.value = density / 100; }, [density]);
  useFrame((_, delta) => { if (!paused && material.current) material.current.uniforms.uTime.value += Math.min(delta, .05); });
  return <mesh position={[0, .7, 0]}><planeGeometry args={[6, 6]}/><shaderMaterial ref={material} transparent depthWrite={false} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader}/></mesh>;
}

export default function Spatial({ kind, paused, seed }) {
  const [value, setValue] = useState(kind === 'cloud' ? 65 : 28);
  return <><div className="stage three-stage"><Canvas camera={{ position: kind === 'bvh' ? [0,3.4,7.5] : [0, .3, 7.5], fov: 42 }} dpr={[1, 1.6]} frameloop={paused ? 'demand' : 'always'} gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }} fallback={<div className="three-fallback">이 브라우저에서 WebGL을 사용할 수 없습니다. 작품과 코드에서 원본을 확인할 수 있습니다.</div>}>
    {kind === 'cloud' ? <Cloud paused={paused} density={value} seed={seed}/> : <><Environment/><ambientLight intensity={.8}/><directionalLight position={[3, 5, 4]} intensity={3} color="#f4e6d3"/><directionalLight position={[-4, 1, -3]} intensity={4} color="#8ccee0"/>{kind === 'bvh' ? <TerrainScanner paused={paused} speed={value} seed={seed}/> : <Sculpture kind={kind} paused={paused} speed={value} seed={seed}/>}<Controls/></>}
  </Canvas></div><div className="work-controls"><Slider label={kind === 'cloud' ? '구름 밀도' : kind === 'bvh' ? '탐사 속도' : '회전 속도'} value={value} onChange={setValue} min={kind === 'cloud' ? 15 : 0}/><p className="control-note">{kind === 'cloud' ? '주기적 3D 노이즈의 자체 GLSL 실험입니다.' : kind === 'bvh' ? '40,960개의 삼각형. 지형을 가리키면 자동 탐사 대신 손끝을 따라갑니다.' : '드래그해서 다른 각도에서 바라보세요.'}</p></div></>;
}
