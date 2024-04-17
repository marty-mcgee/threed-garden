// 'use client'
// ==========================================================
// RESOURCES

import { RigidBody } from "@react-three/rapier";

export default function Steps() {
  return (
    <>
      {/* Small steps */}
      <RigidBody type="fixed" position={[0, 0.0, 5]}>
        <mesh receiveShadow>
          <boxGeometry args={[4, 0.2, 0.2]} />
          <meshStandardMaterial color={"saddlebrown"} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" position={[0, 0.0, 6]}>
        <mesh receiveShadow>
          <boxGeometry args={[4, 0.2, 0.2]} />
          <meshStandardMaterial color={"saddlebrown"} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" position={[0, 0.0, 7]}>
        <mesh receiveShadow>
          <boxGeometry args={[4, 0.2, 0.2]} />
          <meshStandardMaterial color={"saddlebrown"} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" position={[0, 0.0, 8]}>
        <mesh receiveShadow>
          <boxGeometry args={[4, 0.2, 0.2]} />
          <meshStandardMaterial color={"saddlebrown"} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" position={[0, 0.0, 11]}>
        <mesh receiveShadow>
          <boxGeometry args={[4, 0.2, 4]} />
          <meshStandardMaterial color={"saddlebrown"} />
        </mesh>
      </RigidBody>
    </>
  );
}
