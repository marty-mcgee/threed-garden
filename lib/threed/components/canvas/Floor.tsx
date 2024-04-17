import { RigidBody } from "@react-three/rapier";
import { Grid } from "@react-three/drei";

export default function Floor() {
  return (
    <RigidBody type="fixed">
      <mesh receiveShadow position={[0, -3.5, 0]}>
        <boxGeometry args={[300, 5, 300]} />
        <meshPhongMaterial color="black" opacity={0.5} transparent={true} />
      </mesh>
      <Grid
        args={[320, 320]}
        sectionColor={"black"}
        cellColor={"black"}
        position={[0, 0, 0]}
        userData={{ camExcludeCollision: true }} // this won't collide by camera ray
      />
    </RigidBody>
  );
}
