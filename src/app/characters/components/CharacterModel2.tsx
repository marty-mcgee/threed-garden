/*
Customized from Auto-generation: https://github.com/pmndrs/gltfjsx
*/

import { useRef } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { CHARACTER_MODEL_URL } from "../Constants.ts";
import { GLTF } from 'three-stdlib'
import * as THREE from 'three'

type GLTFResult = GLTF & {
  nodes: {
    Demon_1: THREE.SkinnedMesh
    Demon_2: THREE.SkinnedMesh
    Demon_3: THREE.SkinnedMesh
    Demon_4: THREE.SkinnedMesh
    Trident: THREE.SkinnedMesh
    Root: THREE.Bone
  }
  materials: {
    Demon_Main: THREE.MeshStandardMaterial
    Black: THREE.MeshStandardMaterial
    Eye_White: THREE.MeshStandardMaterial
    Eye_Black: THREE.MeshStandardMaterial
  }
}

type ActionName =
  | 'CharacterArmature|Death'
  | 'CharacterArmature|Duck'
  | 'CharacterArmature|HitReact'
  | 'CharacterArmature|Idle'
  | 'CharacterArmature|Jump'
  | 'CharacterArmature|Jump_Idle'
  | 'CharacterArmature|Jump_Land'
  | 'CharacterArmature|No'
  | 'CharacterArmature|Punch'
  | 'CharacterArmature|Run'
  | 'CharacterArmature|Walk'
  | 'CharacterArmature|Wave'
  | 'CharacterArmature|Weapon'
  | 'CharacterArmature|Yes'
type GLTFActions = Record<ActionName, THREE.AnimationAction>

// @ts-expect-error
export default function CharacterModel(props: JSX.IntrinsicElements['group']) {
  const group = useRef<THREE.Group>(null)
  const { nodes, materials, animations } = useGLTF(CHARACTER_MODEL_URL) as GLTFResult
  for (const material in materials) {
    materials[material].metalness = -2;
    materials[material].roughness = 1;
  }
  // @ts-expect-error
  const { actions } = useAnimations<GLTFActions>(animations, group)
  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Root_Scene">
        <group name="RootNode">
          <group 
            name="CharacterArmature" 
            rotation={[-Math.PI / 2, 0, 0]} 
            scale={50}
            position={[0, -0.85, 0]}
          >
            <primitive object={nodes.Root} />
          </group>
          <group 
            name="Demon" 
            rotation={[-Math.PI / 2, 0, 0]} 
            scale={100}
          >
            <skinnedMesh
              name="Demon_1"
              geometry={nodes.Demon_1.geometry}
              material={materials.Demon_Main}
              skeleton={nodes.Demon_1.skeleton}
              receiveShadow
              castShadow
            />
            <skinnedMesh
              name="Demon_2"
              geometry={nodes.Demon_2.geometry}
              material={materials.Black}
              skeleton={nodes.Demon_2.skeleton}
              receiveShadow
              castShadow
            />
            <skinnedMesh
              name="Demon_3"
              geometry={nodes.Demon_3.geometry}
              material={materials.Eye_White}
              skeleton={nodes.Demon_3.skeleton}
              receiveShadow
              castShadow
            />
            <skinnedMesh
              name="Demon_4"
              geometry={nodes.Demon_4.geometry}
              material={materials.Eye_Black}
              skeleton={nodes.Demon_4.skeleton}
              receiveShadow
              castShadow
            />
          </group>
          <skinnedMesh
            name="Trident"
            geometry={nodes.Trident.geometry}
            material={materials.Black}
            skeleton={nodes.Trident.skeleton}
            position={[1.895, 1.734, -0.17]}
            scale={75.326}
            receiveShadow
            castShadow
          />
        </group>
      </group>
    </group>
  )
}

useGLTF.preload(CHARACTER_MODEL_URL);
