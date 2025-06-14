'use client'

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import "./App.css";
import { Lights } from "./components/Lights";
import { Gizmo } from "./components/Gizmo";
// import { GUI } from "./components/GUI";
import { Terrain } from "./components/Terrain";

export default function App() {
  return (
    <div 
      id='threedTerrains'
      style={{ 
        display: 'flex', 
        flexDirection: 'column',
        flexGrow: '0',
        width: '100vw',
        height: 'calc(100vh - 64px)',
        overflow: 'hidden',
      }}
    >
      {/* <GUI /> */}
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [7, 5, 7], near: 0.1, far: 20, fov: 50 }}
      >
        <Gizmo />
        <Lights />
        <OrbitControls
          autoRotate={false}
          autoRotateSpeed={0.2}
          enablePan={false}
          minDistance={3}
          maxDistance={12}
        />
        <Terrain />
      </Canvas>
    </div>
  );
}
