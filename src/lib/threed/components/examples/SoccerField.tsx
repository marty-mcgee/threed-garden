// 'use client'
// ==========================================================
// RESOURCES

import { useGLTF } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'

// const theMapModelFile = './assets/examples/fantasy_game_inn.glb'
const theMapModelFile = './assets/examples/soccer_field.glb'

export default function SoccerField(props: any) {
  const { nodes, materials } = useGLTF(theMapModelFile)

  return (
    <RigidBody 
      type="fixed" 
      colliders="trimesh" 
      ccd
    >
      <group 
        {...props} 
        dispose={null}
      >
        <mesh 
          castShadow 
          receiveShadow 
          // @ts-expect-error
          geometry={nodes.SoccerField_Footballfield_0.geometry}
        >
          <meshStandardMaterial 
            // @ts-expect-error
            map={materials.Footballfield.map}
          />
        </mesh>
      </group>
    </RigidBody>
  )
}

useGLTF.preload(theMapModelFile)
