// 'use client'
// ==========================================================
// RESOURCES

import { RigidBody } from "@react-three/rapier";
import { Grid } from "@react-three/drei";

export default function Floor() {
  return (
    <RigidBody type="fixed">
      <mesh receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[300, 0, 300]} />
        <meshPhongMaterial color="black" opacity={0.9} transparent={true} />
      </mesh>
      {/* <Grid
        args={[320, 320]}
        sectionColor={"white"}
        cellColor={"white"}
        position={[0, 0, 0]}
        rotation={[Math.PI/2, 0, 0]}
        userData={{ camExcludeCollision: false }} // this won't collide by camera ray
      /> */}
    </RigidBody>
  );
}
