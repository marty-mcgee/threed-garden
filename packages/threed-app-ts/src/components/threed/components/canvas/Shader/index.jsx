import { useRouter } from 'next/router'
import useStore from '~/components/threed/stores/store'

import { useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'

import vertex from 'raw-loader!glslify-loader!./glsl/shader.vert'
import fragment from 'raw-loader!glslify-loader!./glsl/shader.frag'

const ColorShiftMaterial = shaderMaterial(
  {
    time: 0,
    color: new THREE.Color(0.07, 0.4, 0.0),
  },
  vertex,
  fragment
)

// This is the 🔑 that HMR will renew if this file is edited
// It works for THREE.ShaderMaterial as well as for drei/shaderMaterial
ColorShiftMaterial.key = THREE.MathUtils.generateUUID()

extend({ ColorShiftMaterial })

const Shader = (props) => {
  const { name, args, route } = props

  const router = useRouter()

  // This reference will give us direct access to the THREE.Mesh object
  const meshRef = useRef(null)

  // Set up state for the shaderHovered and active state
  const [shaderHovered, setShaderHovered] = useState(false)

  // Subscribe this component to the render-loop, rotate the mesh every frame
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = meshRef.current.rotation.y -= 0.01
    }
    if (meshRef.current.material) {
      meshRef.current.material.uniforms.time.value += Math.sin(delta / 2) * Math.cos(delta / 2)
    }
  })

  // Return the view, these are regular Threejs elements expressed in JSX
  return (
    <>
      <mesh
        ref={meshRef}
        onClick={() => router.push(route)}
        onPointerOver={(e) => setShaderHovered(true)}
        onPointerOut={(e) => setShaderHovered(false)}
        scale={shaderHovered ? 1.1 : 1}
      >
        <boxGeometry args={[3, 3, 3]} />
        <colorShiftMaterial
          key={ColorShiftMaterial.key}
          time={3}
        />
      </mesh>
      <directionalLight position={[5, 5, 5]} />
      <ambientLight />
    </>
  )
}

export default Shader
