import * as THREE from "three";
import { GLTF } from "three-stdlib";

export type SeedTroughAssemblyFull = GLTF & {
  nodes: {
    mesh0_mesh: THREE.Mesh;
    mesh0_mesh_1: THREE.Mesh;
    Seed_Trough: THREE.Mesh;
  };
  materials: {
    ['0.800000_0.800000_0.800000_0.000000_0.000000']: THREE.MeshStandardMaterial;
    ['0.400000_0.400000_0.400000_0.000000_0.000000']: THREE.MeshStandardMaterial;
    ['0.603922_0.647059_0.686275_0.000000_0.000000']: THREE.MeshStandardMaterial;
  };
}

export const SeedTroughAssembly = (model: SeedTroughAssemblyFull) => (props: any) => {
  const { nodes, materials } = model;
  return <group {...props} dispose={null}>
    <group position={[-0.003, -0.02, 0.027]}>
      <mesh geometry={nodes.mesh0_mesh.geometry} material={materials['0.800000_0.800000_0.800000_0.000000_0.000000']} />
      <mesh geometry={nodes.mesh0_mesh_1.geometry} material={materials['0.400000_0.400000_0.400000_0.000000_0.000000']} />
    </group>
    <mesh geometry={nodes.Seed_Trough.geometry} material={materials['0.603922_0.647059_0.686275_0.000000_0.000000']} position={[0.011, 0, 0]} />
  </group>
};
