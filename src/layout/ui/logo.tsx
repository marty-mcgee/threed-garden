// 'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { LogoScene } from '#/layout/ui/logo-scene'
    
export default function Logo() {
  return (
    <Canvas>
      <OrbitControls />
      <LogoScene />
    </Canvas>
  )
}
