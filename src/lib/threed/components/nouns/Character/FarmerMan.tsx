// @ts-nocheck /* OR @ ts-ignore OR @ ts-expect-error */
// 'use client'
// ==========================================================
// RESOURCES

import * as THREE from 'three'
import React, { useRef } from 'react' // (instances of): , useMemo, useContext, createContext
import { useGLTF, useAnimations } from '@react-three/drei' // (instances of): , Merged
import { GLTF } from 'three-stdlib'

const file = 'https://threedpublic.s3.us-west-2.amazonaws.com/assets/threeds/synty/polygon/farm/Characters/SK_Chr_Farmer_Male_01.glb'
const texture = 'https://threedpublic.s3.us-west-2.amazonaws.com/assets/threeds/synty/polygon/_Textures/PolygonFarm_Texture_01_A.png'

type GLTFResult = GLTF & {
  nodes: {
    SK_Chr_Farmer_Male_01: THREE.SkinnedMesh
    Pelvis: THREE.Bone
    spine_01: THREE.Bone
    spine_02: THREE.Bone
    spine_03: THREE.Bone
    neck_01: THREE.Bone
    head: THREE.Bone
    clavicle_l: THREE.Bone
    UpperArm_L: THREE.Bone
    lowerarm_l: THREE.Bone
    Hand_L: THREE.Bone
    thumb_01_l: THREE.Bone
    thumb_02_l: THREE.Bone
    thumb_03_l: THREE.Bone
    indexFinger_01_l: THREE.Bone
    indexFinger_02_l: THREE.Bone
    indexFinger_03_l: THREE.Bone
    indexFinger_04_l: THREE.Bone
    finger_01_l: THREE.Bone
    finger_02_l: THREE.Bone
    finger_03_l: THREE.Bone
    finger_04_l: THREE.Bone
    clavicle_r: THREE.Bone
    UpperArm_R: THREE.Bone
    lowerarm_r: THREE.Bone
    Hand_R: THREE.Bone
    thumb_01_r: THREE.Bone
    thumb_02_r: THREE.Bone
    thumb_03_r: THREE.Bone
    indexFinger_01_r: THREE.Bone
    indexFinger_02_r: THREE.Bone
    indexFinger_03_r: THREE.Bone
    indexFinger_04_r: THREE.Bone
    finger_01_r: THREE.Bone
    finger_02_r: THREE.Bone
    finger_03_r: THREE.Bone
    finger_04_r: THREE.Bone
    Thigh_R: THREE.Bone
    calf_r: THREE.Bone
    Foot_R: THREE.Bone
    ball_r: THREE.Bone
    toes_r: THREE.Bone
    Thigh_L: THREE.Bone
    calf_l: THREE.Bone
    Foot_L: THREE.Bone
    ball_l: THREE.Bone
    toes_l: THREE.Bone
  }
  materials: {
    lambert2: THREE.MeshStandardMaterial
  }
}

type ActionName = 'Take 001'
type GLTFActions = Record<ActionName, THREE.AnimationAction>

// ** TESTING -- Instances Of <CharacterModel>
// const context = createContext()
// export function Instances({ children, ...props }) {
//   const { nodes } = useGLTF(file) as GLTFResult
//   const instances = useMemo(
//     () => ({
//       SKChrFarmerMale: nodes.SK_Chr_Farmer_Male_01,
//     }),
//     [nodes]
//   )
//   return (
//     <Merged meshes={instances} {...props}>
//       {(instances) => <context.Provider value={instances} children={children} />}
//     </Merged>
//   )
// }

export default function Model(props: JSX.IntrinsicElements['group']) {
  // const instances = useContext(context)
  const group = useRef<THREE.Group>()
  const { nodes, materials, animations } = useGLTF(file)
  const { actions } = useAnimations<GLTFActions>(animations, group)
  return (
    <group ref={group} {...props} dispose={null}>
      <group>
        <group name="RootNode">
          {/*
          <instances.SKChrFarmerMale name="SK_Chr_Farmer_Male_01" />
          <group name="Root">
            <group name="Pelvis_$AssimpFbx$_Translation" position={[0, 87.628, 0]}>
              <group name="Pelvis_$AssimpFbx$_PreRotation" rotation={[-0.179, 0.022, 0.006]}>
                <group name="Pelvis_$AssimpFbx$_PostRotation" rotation={[0.255, 1.548, 1.345]}>
                  <primitive object={nodes.Pelvis} />
                </group>
              </group>
            </group>
            <group name="ik_foot_root_$AssimpFbx$_PreRotation" rotation={[-Math.PI / 2, 0, 0]}>
              <group name="ik_foot_root">
                <group
                  name="ik_foot_l"
                  position={[11.444, 3.687, 5.569]}
                  rotation={[0, -1.571, 0]}
                />
                <group
                  name="ik_foot_r"
                  position={[-11.444, 3.687, 5.569]}
                  rotation={[Math.PI, -1.571, 0]}
                />
              </group>
            </group>
            <group name="ik_hand_root_$AssimpFbx$_PreRotation" rotation={[-Math.PI / 2, 0, 0]}>
              <group name="ik_hand_root">
                <group
                  name="ik_hand_gun"
                  position={[-79.963, 3.417, 136.094]}
                  rotation={[Math.PI / 2, 0, 0]}>
                  <group name="ik_hand_l" position={[159.926, 0, 0]} rotation={[-Math.PI, 0, 0]} />
                  <group name="ik_hand_r" />
                </group>
              </group>
            </group>
          </group>
          */}
          {/* ORIGINAL -- NOT USING INSTANCES */}
          <skinnedMesh
            name="SK_Chr_Farmer_Male_01"
            geometry={nodes.SK_Chr_Farmer_Male_01.geometry}
            material={materials.lambert2}
            skeleton={nodes.SK_Chr_Farmer_Male_01.skeleton}
          />
          <group name="Root">
            <group name="Pelvis_$AssimpFbx$_Translation" position={[0, 87.628, 0]}>
              <group name="Pelvis_$AssimpFbx$_PreRotation" rotation={[-0.179, 0.022, 0.006]}>
                <group name="Pelvis_$AssimpFbx$_PostRotation" rotation={[0.255, 1.548, 1.345]}>
                  <primitive object={nodes.Pelvis} />
                </group>
              </group>
            </group>
            <group name="ik_foot_root_$AssimpFbx$_PreRotation" rotation={[-Math.PI / 2, 0, 0]}>
              <group name="ik_foot_root">
                <group
                  name="ik_foot_l"
                  position={[11.444, 3.687, 5.569]}
                  rotation={[0, -1.571, 0]}
                />
                <group
                  name="ik_foot_r"
                  position={[-11.444, 3.687, 5.569]}
                  rotation={[Math.PI, -1.571, 0]}
                />
              </group>
            </group>
            <group name="ik_hand_root_$AssimpFbx$_PreRotation" rotation={[-Math.PI / 2, 0, 0]}>
              <group name="ik_hand_root">
                <group
                  name="ik_hand_gun"
                  position={[-79.963, 3.417, 136.094]}
                  rotation={[Math.PI / 2, 0, 0]}>
                  <group name="ik_hand_l" position={[159.926, 0, 0]} rotation={[-Math.PI, 0, 0]} />
                  <group name="ik_hand_r" />
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}

useGLTF.preload(file)
