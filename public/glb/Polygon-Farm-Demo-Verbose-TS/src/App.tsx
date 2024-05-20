
import React, { Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stage } from '@react-three/drei'
import { Model } from './Model'
export default function Viewer() {
  const ref = useRef()
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ fov: 50 }}>
      <Suspense fallback={null}>
        {/* @ts-expect-error */}
        <Stage controls={ref} preset="rembrandt" intensity={1}  environment="city">
          <Model />
        </Stage>
      </Suspense>
      <OrbitControls ref={ref} />
    </Canvas>
  )
}