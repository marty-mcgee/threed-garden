// 'use client'
// ==========================================================
// RESOURCES

import { RigidBody } from '@react-three/rapier'

export default function Floor() {
  return (
    <RigidBody type='fixed'>
      <mesh receiveShadow>
        <boxGeometry args={[2048, 0, 2048]} />
        <meshPhongMaterial color='green' opacity={1.5} transparent={true} />
      </mesh>
    </RigidBody>
  )
}
