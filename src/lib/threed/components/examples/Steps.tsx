// 'use client'
// ==========================================================
// RESOURCES

import { RigidBody } from '@react-three/rapier'

export default function Steps() {
  return (
    <group>
      {/* Small steps */}
      <RigidBody type='fixed' position={[0, 0.0, 250]}>
        <mesh receiveShadow>
          <boxGeometry args={[200, 10, 10]} />
          <meshStandardMaterial color={'saddlebrown'} />
        </mesh>
      </RigidBody>
      <RigidBody type='fixed' position={[0, 0.0, 300]}>
        <mesh receiveShadow>
          <boxGeometry args={[200, 10, 10]} />
          <meshStandardMaterial color={'saddlebrown'} />
        </mesh>
      </RigidBody>
      <RigidBody type='fixed' position={[0, 0.0, 350]}>
        <mesh receiveShadow>
          <boxGeometry args={[200, 10, 10]} />
          <meshStandardMaterial color={'saddlebrown'} />
        </mesh>
      </RigidBody>
      <RigidBody type='fixed' position={[0, 0.0, 400]}>
        <mesh receiveShadow>
          <boxGeometry args={[200, 10, 10]} />
          <meshStandardMaterial color={'saddlebrown'} />
        </mesh>
      </RigidBody>
      <RigidBody type='fixed' position={[0, 0.0, 550]}>
        <mesh receiveShadow>
          <boxGeometry args={[200, 10, 200]} />
          <meshStandardMaterial color={'saddlebrown'} />
        </mesh>
      </RigidBody>
    </group>
  )
}
