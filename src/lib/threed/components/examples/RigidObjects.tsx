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
      <RigidBody position={[1550, 200, 200]}>
        <Text
          scale={0.2}
          color='black'
          maxWidth={10}
          textAlign='center'
          position={[0, 1, 0]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          m: 0.5
        </Text>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[50, 50, 50]} />
          <meshStandardMaterial color={'brown'} />
        </mesh>
      </RigidBody>
      <RigidBody position={[1450, 200, 200]}>
        <Text
          scale={0.2}
          color='black'
          maxWidth={10}
          textAlign='center'
          position={[0, 1, 0]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          m: 0.5
        </Text>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[50, 50, 50]} />
          <meshStandardMaterial color={'brown'} />
        </mesh>
      </RigidBody>
      <RigidBody position={[1500, 200, 0]} colliders={false}>
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
        <CuboidCollider args={[50, 50, 50]} />
        <mesh receiveShadow castShadow>
          <boxGeometry args={[100, 100, 100]} />
          <meshStandardMaterial color={'brown'} />
        </mesh>
      </RigidBody>
      <RigidBody position={[1500, 200, -200]} colliders={false}>
        <Text
          scale={0.2}
          color='black'
          maxWidth={10}
          textAlign='center'
          position={[0, 1.5, 0]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          mass: 1.5
        </Text>
        <CuboidCollider args={[150 / 2, 150 / 2, 150 / 2]} />
        <mesh receiveShadow castShadow>
          <boxGeometry args={[150, 150, 150]} />
          <meshStandardMaterial color={'brown'} />
        </mesh>
      </RigidBody>
      <RigidBody position={[1500, 200, -500]} colliders={false}>
        <Text
          scale={0.2}
          color='black'
          maxWidth={10}
          textAlign='center'
          position={[0, 2, 0]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          mass: 2
        </Text>
        <CuboidCollider args={[100, 100, 100]} />
        <mesh receiveShadow castShadow>
          <boxGeometry args={[200, 200, 200]} />
          <meshStandardMaterial color={'brown'} />
        </mesh>
      </RigidBody>

      {/* Fun toy using mass as m */}
      {/* <RigidBody position={[1500, 0, -1000]} colliders={false}>
        <Text
          scale={2}
          color='black'
          maxWidth={10}
          textAlign='center'
          position={[0, 10, 0]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          mass: 2.5
        </Text>
        <CylinderCollider args={[3, 250]} position={[0, 0, 0]} />
        <BallCollider args={[250]} />
        <mesh receiveShadow castShadow>
          <cylinderGeometry args={[250, 20, 50]} />
          <meshStandardMaterial color={'brown'} />
        </mesh>
      </RigidBody> */}
    </group>
  )
}
