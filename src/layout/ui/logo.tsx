'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { LogoScene } from '#/layout/ui/logo-scene'
// ** NEXT Imports
import dynamic from 'next/dynamic'
// const MyScene = dynamic(() => import('#/layout/logo'), { ssr: false })
    
export default function Logo() {
  return (
    <div style={{ width: '48px', height: '48px' }}>
      <Canvas>
        <OrbitControls />
        <LogoScene />
      </Canvas>
    </div>
  )
}
