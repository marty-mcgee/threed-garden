import * as THREE from "three";
import { GLTF } from "three-stdlib";

export type VacuumPumpCoverFull = GLTF & {
  nodes: {
    M5_x_10mm_Screw: THREE.Mesh;
    Vacuum_Pump_Cover: THREE.Mesh;
  };
  materials: {
    ['0.800000_0.800000_0.800000_0.000000_0.000000']: THREE.MeshStandardMaterial;
    ['0.603922_0.647059_0.686275_0.000000_0.000000']: THREE.MeshStandardMaterial;
  };
}

export const VacuumPumpCover = (model: VacuumPumpCoverFull) =>
  (props: JSX.IntrinsicElements["group"]) => {
    const { nodes, materials } = model;
    return <group {...props} dispose={null}>
      <mesh geometry={nodes.M5_x_10mm_Screw.geometry}
        material={materials['0.800000_0.800000_0.800000_0.000000_0.000000']}
        position={[-0.01, -0.013, -0.145]}
        rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={nodes.Vacuum_Pump_Cover.geometry}
        material={materials['0.603922_0.647059_0.686275_0.000000_0.000000']}
        position={[0.057, -0.008, -0.255]}
        rotation={[0, 0, Math.PI]} />
    </group>;
  };
