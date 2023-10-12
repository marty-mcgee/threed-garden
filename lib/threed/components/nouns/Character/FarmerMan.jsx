import React, { useRef } from "react"
import { useGLTF, useAnimations } from "@react-three/drei"

const file = 'https://threedpublic.s3.us-west-2.amazonaws.com/assets/threeds/synty/polygon/farm/Characters/SK_Chr_Farmer_Male_01.glb'
const texture = 'https://threedpublic.s3.us-west-2.amazonaws.com/assets/threeds/synty/polygon/_Textures/PolygonFarm_Texture_01_A.png'

export default function Model(props) {

  const group = useRef()
  const { nodes, materials, animations } = useGLTF(file)
  const { actions } = useAnimations(animations, group)

  return (
    <group ref={group} {...props} dispose={null}>
      <group>
        <group name="RootNode">
          <skinnedMesh
            name="SK_Chr_Farmer_Male_01"
            geometry={nodes.SK_Chr_Farmer_Male_01.geometry}
            material={materials.lambert2}
            skeleton={nodes.SK_Chr_Farmer_Male_01.skeleton}
          />
          <group name="Root">
            <group
              name="Pelvis_$AssimpFbx$_Translation"
              position={[0, 87.628, 0]}
            >
              <group
                name="Pelvis_$AssimpFbx$_PreRotation"
                rotation={[-0.179, 0.022, 0.006]}
              >
                <group
                  name="Pelvis_$AssimpFbx$_PostRotation"
                  rotation={[0.255, 1.548, 1.345]}
                >
                  <primitive object={nodes.Pelvis} />
                </group>
              </group>
            </group>
            <group
              name="ik_foot_root_$AssimpFbx$_PreRotation"
              rotation={[-Math.PI / 2, 0, 0]}
            >
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
            <group
              name="ik_hand_root_$AssimpFbx$_PreRotation"
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <group name="ik_hand_root">
                <group
                  name="ik_hand_gun"
                  position={[-79.963, 3.417, 136.094]}
                  rotation={[Math.PI / 2, 0, 0]}
                >
                  <group
                    name="ik_hand_l"
                    position={[159.926, 0, 0]}
                    rotation={[-Math.PI, 0, 0]}
                  />
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
