// 'use client'
// ==========================================================
// RESOURCES

import { RigidBody } from '@react-three/rapier'

export default function Floor() {
  return (
    <RigidBody type='fixed' position={[0, 0, 0]}>
      <mesh receiveShadow>
        <boxGeometry args={[2048, 0, 2048]} />
        <meshPhongMaterial color='black' opacity={0.7} transparent={true} />
      </mesh>
    </RigidBody>
  )
}
