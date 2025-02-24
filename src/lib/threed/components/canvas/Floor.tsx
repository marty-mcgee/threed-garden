// 'use client'
// ==========================================================
// RESOURCES

import { RigidBody } from '@react-three/rapier'

export default function Floor({color = 'black', opacity = 1.0}: {color: string, opacity: number}) {
  return (
    <RigidBody type='fixed' position={[0, 0, 0]}>
      <mesh receiveShadow>
        <boxGeometry args={[20480, -1, 20480]} />
        {/* <meshPhongMaterial color={color} opacity={opacity} transparent={true} /> */}
        <meshStandardMaterial color={color} />
      </mesh>
    </RigidBody>
  )
}
