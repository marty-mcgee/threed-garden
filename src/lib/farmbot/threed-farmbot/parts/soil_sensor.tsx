import * as THREE from "three";
import { InstancedBufferAttribute } from "three";
import { GLTF } from "three-stdlib";

type Mesh = THREE.Mesh & { instanceMatrix: InstancedBufferAttribute | undefined };

export type SoilSensorFull = GLTF & {
  nodes: {
    Soil_Sensor: Mesh;
    mesh0_mesh: Mesh;
    mesh0_mesh_1: Mesh;
    mesh0_mesh_2: Mesh;
    mesh0_mesh_3: Mesh;
    mesh0_mesh_4: Mesh;
    mesh0_mesh_5: Mesh;
    mesh0_mesh_6: Mesh;
    mesh0_mesh_7: Mesh;
    mesh0_mesh_8: Mesh;
    mesh0_mesh_9: Mesh;
    mesh0_mesh_10: Mesh;
    mesh0_mesh_11: Mesh;
    mesh0_mesh_12: Mesh;
    mesh0_mesh_13: Mesh;
    mesh0_mesh_14: Mesh;
    mesh0_mesh_15: Mesh;
    mesh0_mesh_16: Mesh;
    mesh0_mesh_17: Mesh;
    mesh0_mesh_18: Mesh;
    mesh0_mesh_19: Mesh;
    mesh0_mesh_20: Mesh;
    mesh0_mesh_21: Mesh;
    mesh0_mesh_22: Mesh;
    mesh0_mesh_23: Mesh;
    mesh0_mesh_24: Mesh;
    mesh0_mesh_25: Mesh;
    mesh584_mesh: Mesh;
    mesh584_mesh_1: Mesh;
    mesh584_mesh_2: Mesh;
    mesh584_mesh_3: Mesh;
    mesh584_mesh_4: Mesh;
    mesh584_mesh_5: Mesh;
    mesh584_mesh_6: Mesh;
    mesh584_mesh_7: Mesh;
    mesh584_mesh_8: Mesh;
    mesh584_mesh_9: Mesh;
    mesh584_mesh_10: Mesh;
    mesh584_mesh_11: Mesh;
    mesh584_mesh_12: Mesh;
    mesh584_mesh_13: Mesh;
    mesh584_mesh_14: Mesh;
    mesh584_mesh_15: Mesh;
    mesh584_mesh_16: Mesh;
    mesh584_mesh_17: Mesh;
  };
  materials: {
    PaletteMaterial001: THREE.MeshStandardMaterial;
  };
}

export const SoilSensor = (model: SoilSensorFull) => (props: JSX.IntrinsicElements["group"]) => {
  const { nodes, materials } = model;
  return <group {...props} dispose={null}>
    <mesh geometry={nodes.Soil_Sensor.geometry} material={materials.PaletteMaterial001} position={[0, 0, -0.015]} />
    <instancedMesh args={[nodes.mesh0_mesh.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh0_mesh.instanceMatrix} />
    <instancedMesh args={[nodes.mesh0_mesh_1.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh0_mesh_1.instanceMatrix} />
    <instancedMesh args={[nodes.mesh0_mesh_2.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh0_mesh_2.instanceMatrix} />
    <instancedMesh args={[nodes.mesh0_mesh_3.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh0_mesh_3.instanceMatrix} />
    <instancedMesh args={[nodes.mesh0_mesh_4.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh0_mesh_4.instanceMatrix} />
    <instancedMesh args={[nodes.mesh0_mesh_5.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh0_mesh_5.instanceMatrix} />
    <instancedMesh args={[nodes.mesh0_mesh_6.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh0_mesh_6.instanceMatrix} />
    <instancedMesh args={[nodes.mesh0_mesh_7.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh0_mesh_7.instanceMatrix} />
    <instancedMesh args={[nodes.mesh0_mesh_8.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh0_mesh_8.instanceMatrix} />
    <instancedMesh args={[nodes.mesh0_mesh_9.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh0_mesh_9.instanceMatrix} />
    <instancedMesh args={[nodes.mesh0_mesh_10.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh0_mesh_10.instanceMatrix} />
    <instancedMesh args={[nodes.mesh0_mesh_11.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh0_mesh_11.instanceMatrix} />
    <instancedMesh args={[nodes.mesh0_mesh_12.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh0_mesh_12.instanceMatrix} />
    <instancedMesh args={[nodes.mesh0_mesh_13.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh0_mesh_13.instanceMatrix} />
    <instancedMesh args={[nodes.mesh0_mesh_14.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh0_mesh_14.instanceMatrix} />
    <instancedMesh args={[nodes.mesh0_mesh_15.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh0_mesh_15.instanceMatrix} />
    <instancedMesh args={[nodes.mesh0_mesh_16.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh0_mesh_16.instanceMatrix} />
    <instancedMesh args={[nodes.mesh0_mesh_17.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh0_mesh_17.instanceMatrix} />
    <instancedMesh args={[nodes.mesh0_mesh_18.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh0_mesh_18.instanceMatrix} />
    <instancedMesh args={[nodes.mesh0_mesh_19.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh0_mesh_19.instanceMatrix} />
    <instancedMesh args={[nodes.mesh0_mesh_20.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh0_mesh_20.instanceMatrix} />
    <instancedMesh args={[nodes.mesh0_mesh_21.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh0_mesh_21.instanceMatrix} />
    <instancedMesh args={[nodes.mesh0_mesh_22.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh0_mesh_22.instanceMatrix} />
    <instancedMesh args={[nodes.mesh0_mesh_23.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh0_mesh_23.instanceMatrix} />
    <instancedMesh args={[nodes.mesh0_mesh_24.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh0_mesh_24.instanceMatrix} />
    <instancedMesh args={[nodes.mesh0_mesh_25.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh0_mesh_25.instanceMatrix} />
    <instancedMesh args={[nodes.mesh584_mesh.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh584_mesh.instanceMatrix} />
    <instancedMesh args={[nodes.mesh584_mesh_1.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh584_mesh_1.instanceMatrix} />
    <instancedMesh args={[nodes.mesh584_mesh_2.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh584_mesh_2.instanceMatrix} />
    <instancedMesh args={[nodes.mesh584_mesh_3.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh584_mesh_3.instanceMatrix} />
    <instancedMesh args={[nodes.mesh584_mesh_4.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh584_mesh_4.instanceMatrix} />
    <instancedMesh args={[nodes.mesh584_mesh_5.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh584_mesh_5.instanceMatrix} />
    <instancedMesh args={[nodes.mesh584_mesh_6.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh584_mesh_6.instanceMatrix} />
    <instancedMesh args={[nodes.mesh584_mesh_7.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh584_mesh_7.instanceMatrix} />
    <instancedMesh args={[nodes.mesh584_mesh_8.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh584_mesh_8.instanceMatrix} />
    <instancedMesh args={[nodes.mesh584_mesh_9.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh584_mesh_9.instanceMatrix} />
    <instancedMesh args={[nodes.mesh584_mesh_10.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh584_mesh_10.instanceMatrix} />
    <instancedMesh args={[nodes.mesh584_mesh_11.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh584_mesh_11.instanceMatrix} />
    <instancedMesh args={[nodes.mesh584_mesh_12.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh584_mesh_12.instanceMatrix} />
    <instancedMesh args={[nodes.mesh584_mesh_13.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh584_mesh_13.instanceMatrix} />
    <instancedMesh args={[nodes.mesh584_mesh_14.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh584_mesh_14.instanceMatrix} />
    <instancedMesh args={[nodes.mesh584_mesh_15.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh584_mesh_15.instanceMatrix} />
    <instancedMesh args={[nodes.mesh584_mesh_16.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh584_mesh_16.instanceMatrix} />
    <instancedMesh args={[nodes.mesh584_mesh_17.geometry, materials.PaletteMaterial001, 8]} instanceMatrix={nodes.mesh584_mesh_17.instanceMatrix} />
  </group>
};
