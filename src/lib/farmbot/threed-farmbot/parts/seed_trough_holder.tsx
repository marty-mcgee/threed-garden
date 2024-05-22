import * as THREE from "three";
import { GLTF } from "three-stdlib";

export type SeedTroughHolderFull = GLTF & {
  nodes: {
    Seed_Trough_Holder_Mount_Plate: THREE.Mesh;
    M5_x_10mm_Screw: THREE.Mesh;
  }
  materials: {
    ['0.603922_0.647059_0.686275_0.000000_0.000000']: THREE.MeshStandardMaterial;
    ['0.800000_0.800000_0.800000_0.000000_0.000000']: THREE.MeshStandardMaterial;
  };
}

export const SeedTroughHolder = (model: SeedTroughHolderFull) => (props: JSX.IntrinsicElements["group"]) => {
  const { nodes, materials } = model;
  return <group {...props} dispose={null}>
    <mesh geometry={nodes.Seed_Trough_Holder_Mount_Plate.geometry} material={materials['0.603922_0.647059_0.686275_0.000000_0.000000']} position={[-0.002, 0.023, 0]} />
    <mesh geometry={nodes.M5_x_10mm_Screw.geometry} material={materials['0.800000_0.800000_0.800000_0.000000_0.000000']} position={[0.003, 0.013, 0.03]} rotation={[Math.PI / 2, Math.PI / 2, 0]} />
  </group>
};
