// 'use client'
// ==========================================================
// RESOURCES

import { RigidBody } from "@react-three/rapier"
import { useGLTF } from "@react-three/drei"
import { useEffect } from "react"
import * as THREE from "three"

export default function RoughPlane() {
  // Load models
  const roughPlane = useGLTF("./assets/examples/roughPlane.glb")

  useEffect(() => {
    // Receive Shadows
    roughPlane.scene.traverse((child) => {
      if (
        child instanceof THREE.Mesh &&
        child.material instanceof THREE.MeshStandardMaterial
      ) {
        child.receiveShadow = true
      }
    })
  }, [])

  return (
    <RigidBody type="fixed" colliders="trimesh">
      <primitive object={roughPlane.scene} />
    </RigidBody>
  )
}
