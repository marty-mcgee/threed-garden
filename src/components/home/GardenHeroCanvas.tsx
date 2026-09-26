'use client';

import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Html, Line, OrbitControls } from '@react-three/drei';

type Props = { active: boolean; reducedMotion: boolean; reset: number; onReady: () => void; onFailure: () => void };

function Plant({ position, flowering = false }: { position: [number, number, number]; flowering?: boolean }) {
  return <group position={position}>
    <mesh castShadow position={[0, .18, 0]}><cylinderGeometry args={[.018, .025, .36, 6]} /><meshStandardMaterial color="#4e7941" /></mesh>
    {Array.from({ length: 5 }, (_, i) => <group key={i} rotation={[0, i * Math.PI * 2 / 5, 0]}>
      <mesh castShadow position={[.085, .18 + i * .015, 0]} rotation={[0, 0, -.6]} scale={[.11, .045, .22]}><sphereGeometry args={[1, 8, 6]} /><meshStandardMaterial color={i % 2 ? '#75a54c' : '#3d824c'} roughness={.85} /></mesh>
    </group>)}
    {flowering && <mesh castShadow position={[0, .38, 0]}><icosahedronGeometry args={[.065, 1]} /><meshStandardMaterial color="#df7950" /></mesh>}
  </group>;
}

function Box({ position, size, color }: { position: [number, number, number]; size: [number, number, number]; color: string }) {
  return <mesh position={position} castShadow receiveShadow><boxGeometry args={size} /><meshStandardMaterial color={color} roughness={.9} /></mesh>;
}

function Garden() {
  return <group>
    <Box position={[0, -.15, 0]} size={[4.6, .25, 4.6]} color="#335a41" />
    <gridHelper args={[4.5, 9, '#8ca77a', '#50735a']} position={[0, -.019, 0]} />
    <Box position={[0, .14, 0]} size={[1.12, .25, 2.32]} color="#463126" />
    {[-.6, .6].map(x => <Box key={x} position={[x, .18, 0]} size={[.09, .4, 2.4]} color="#b08957" />)}
    {[-1.2, 1.2].map(z => <Box key={z} position={[0, .18, z]} size={[1.29, .4, .09]} color="#c59963" />)}
    {[-.57, .57].flatMap(x => [-1.17, 1.17].map(z => <Box key={`${x}-${z}`} position={[x, .24, z]} size={[.13, .52, .13]} color="#d2ac78" />))}
    {[-.3, .3].flatMap((x, col) => [-.85, -.3, .3, .85].map((z, row) => <Plant key={`${x}-${z}`} position={[x, .28, z]} flowering={(row + col) % 2 === 0} />))}
    {[0, 1, 2, 3].map(i => <Box key={i} position={[1.45, .015, -.9 + i * .6]} size={[.55, .07, .46]} color="#b7b8a1" />)}
    <mesh castShadow position={[-1.35, .16, -.9]}><cylinderGeometry args={[.24, .17, .32, 12]} /><meshStandardMaterial color="#ac6346" /></mesh>
    <Plant position={[-1.35, .3, -.9]} flowering />
    <Line points={[[-.6, .02, 1.48], [.6, .02, 1.48]]} color="#c5d8a4" lineWidth={1} />
    <Line points={[[-.83, .02, -1.2], [-.83, .02, 1.2]]} color="#c5d8a4" lineWidth={1} />
    {[-.6, .6].map(x => <Line key={x} points={[[x, .02, 1.39], [x, .02, 1.57]]} color="#c5d8a4" />)}
    {[-1.2, 1.2].map(z => <Line key={z} points={[[-.92, .02, z], [-.74, .02, z]]} color="#c5d8a4" />)}
    <Html center position={[0, .08, 1.6]} style={{ pointerEvents: 'none' }}><span className="whitespace-nowrap rounded bg-green-950/85 px-2 py-1 text-[10px] text-emerald-100">1.2 m</span></Html>
    <Html center position={[-.98, .08, 0]} style={{ pointerEvents: 'none' }}><span className="whitespace-nowrap rounded bg-green-950/85 px-2 py-1 text-[10px] text-emerald-100">2.4 m</span></Html>
  </group>;
}

function CameraRig({ active, reducedMotion, reset }: Pick<Props, 'active' | 'reducedMotion' | 'reset'>) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const { camera, invalidate } = useThree();
  const [intro, setIntro] = useState(true);
  useEffect(() => { const timer = setTimeout(() => setIntro(false), 4500); return () => clearTimeout(timer); }, []);
  useEffect(() => {
    camera.position.set(4.7, 4, 5.2);
    controls.current?.target.set(0, 0, 0);
    controls.current?.update();
    invalidate();
  }, [reset, camera, invalidate]);
  return <OrbitControls ref={controls} makeDefault enabled={active} enablePan={false} enableDamping={false} minDistance={3.6} maxDistance={10} minPolarAngle={.2} maxPolarAngle={Math.PI / 2.2} autoRotate={active && !reducedMotion && intro} autoRotateSpeed={.6} onStart={() => setIntro(false)} />;
}

function ContextGuard({ onFailure }: Pick<Props, 'onFailure'>) {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = () => onFailure();
    canvas.addEventListener('webglcontextlost', lost);
    return () => canvas.removeEventListener('webglcontextlost', lost);
  }, [gl, onFailure]);
  return null;
}

export default function GardenHeroCanvas(props: Props) {
  return <Canvas style={{ position: 'absolute', inset: 0 }} shadows dpr={[1, 1.5]} frameloop={props.active ? 'demand' : 'never'} camera={{ position: [4.7, 4, 5.2], fov: 42 }} gl={{ alpha: true, antialias: true }} onCreated={props.onReady} fallback={<span>Interactive 3D requires a browser with canvas support.</span>}>
    <ambientLight intensity={.7} />
    <hemisphereLight args={['#e4f3da', '#254531', 1.4]} />
    <directionalLight position={[3, 6, 2]} intensity={2.5} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} shadow-normalBias={.04} />
    <Garden />
    <CameraRig active={props.active} reducedMotion={props.reducedMotion} reset={props.reset} />
    <ContextGuard onFailure={props.onFailure} />
  </Canvas>;
}
