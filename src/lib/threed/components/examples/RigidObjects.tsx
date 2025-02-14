// 'use client'
// ==========================================================
// RESOURCES

import { Text } from '@react-three/drei'
import {
  BallCollider,
  CuboidCollider,
  CylinderCollider,
  RigidBody,
} from '@react-three/rapier'

export default function RigidObjects() {
  return (
    <group>
      {/* Rigid body boxes */}
      <RigidBody position={[15, 2, 2]}>
        <Text
          scale={0.2}
          color='black'
          maxWidth={10}
          textAlign='center'
          position={[0, 1, 0]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          m: 0.25
        </Text>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color={'brown'} />
        </mesh>
      </RigidBody>
      <RigidBody position={[15.1, 2, 2]}>
        <Text
          scale={0.2}
          color='black'
          maxWidth={10}
          textAlign='center'
          position={[0, 1, 0]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          m: 0.25
        </Text>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color={'brown'} />
        </mesh>
      </RigidBody>
      <RigidBody position={[15, 2, 0]} colliders={false}>
        <Text
          scale={0.2}
          color='black'
          maxWidth={10}
          textAlign='center'
          position={[0, 1, 0]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          mass: 1
        </Text>
        <CuboidCollider args={[0.5, 0.5, 0.5]} />
        <mesh receiveShadow castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={'brown'} />
        </mesh>
      </RigidBody>
      <RigidBody position={[15, 2, -2]} colliders={false}>
        <Text
          scale={0.2}
          color='black'
          maxWidth={10}
          textAlign='center'
          position={[0, 1.5, 0]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          mass: 3
        </Text>
        <CuboidCollider args={[1.5 / 2, 1.5 / 2, 1.5 / 2]} />
        <mesh receiveShadow castShadow>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshStandardMaterial color={'brown'} />
        </mesh>
      </RigidBody>
      <RigidBody position={[15, 2, -5]} colliders={false}>
        <Text
          scale={0.2}
          color='black'
          maxWidth={10}
          textAlign='center'
          position={[0, 2, 0]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          mass: 8
        </Text>
        <CuboidCollider args={[1, 1, 1]} />
        <mesh receiveShadow castShadow>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color={'brown'} />
        </mesh>
      </RigidBody>

      {/* Fun toy using mass as m */}
      <RigidBody colliders={false} position={[1500, 0, -1000]}>
        <Text
          scale={2}
          color='black'
          maxWidth={10}
          textAlign='center'
          position={[0, 10, 0]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          mass: 2
        </Text>
        <CylinderCollider args={[3, 250]} position={[0, 0, 0]} />
        <BallCollider args={[250]} />
        <mesh receiveShadow castShadow>
          <cylinderGeometry args={[250, 20, 50]} />
          <meshStandardMaterial color={'brown'} />
        </mesh>
      </RigidBody>
    </group>
  )
}
