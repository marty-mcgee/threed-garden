import { useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import { GLTF } from 'three-stdlib'
import * as THREE from 'three'

type GLTFResult = GLTF & {
  nodes: {
    Object_0: THREE.SkinnedMesh
    Root: THREE.Bone
  }
  materials: {
    Demon_Main: THREE.MeshStandardMaterial
    Black: THREE.MeshStandardMaterial
    Eye_White: THREE.MeshStandardMaterial
    Eye_Black: THREE.MeshStandardMaterial
  }
}

export default function Bird(
  { speed, factor, url, ...props }:
  { speed: any, factor: any, url: any }
) {
  const { nodes, animations } = useGLTF(url) as GLTFResult
  const { ref, mixer } = useAnimations(animations)

  useEffect(
    () => void mixer.clipAction(animations[0], ref.current).play(),
    [mixer, animations, ref]
  )

  useFrame((state, delta) => {
    ref.current.rotation.y +=
      Math.sin((delta * factor) / 2) * Math.cos((delta * factor) / 2) * 1.5
    mixer.update(delta * speed)
  })

  return (
    <group ref={ref}>
      <scene name="Scene" {...props}>
        <mesh
          name="Object_0"
          morphTargetDictionary={nodes.Object_0.morphTargetDictionary}
          morphTargetInfluences={nodes.Object_0.morphTargetInfluences}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <bufferGeometry attach="geometry" {...nodes.Object_0.geometry} />
          <meshStandardMaterial
            attach="material"
            {...nodes.Object_0.material}
            name="Material_0_COLOR_0"
          />
        </mesh>
      </scene>
    </group>
  )
}
