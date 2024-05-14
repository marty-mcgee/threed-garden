// 'use client'
// ==========================================================
// RESOURCES

import { RigidBody } from '@react-three/rapier'

export default function Floor({color = 'green', opacity = 1.0}: {color: string, opacity: number}) {
  return (
    <RigidBody type='fixed'>
      <mesh receiveShadow>
        <boxGeometry args={[2048, 0, 2048]} />
        <meshPhongMaterial color={color} opacity={opacity} transparent={true} />
      </mesh>
    </RigidBody>
  )
}
