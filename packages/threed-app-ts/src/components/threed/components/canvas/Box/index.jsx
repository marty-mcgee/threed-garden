import { useRouter } from 'next/router'
import useStore from '~/components/threed/stores/store'

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'

const BoxComponent = (props) => {
  const { name, args, route } = props

  const router = useRouter()

  // This reference will give us direct access to the THREE.Mesh object
  const meshRef = useRef(null)

  // Set up state for the boxHovered and active state
  const [boxHovered, setBoxHovered] = useState(false)

  // Subscribe this component to the render-loop, rotate the mesh every frame
  useFrame((state, delta) => {
    meshRef.current ? (meshRef.current.rotation.y = meshRef.current.rotation.x += 0.01) : null
  })

  // Return the view, these are regular Threejs elements expressed in JSX
  return (
    <>
      <mesh
        ref={meshRef}
        onClick={() => router.push(route)}
        onPointerOver={() => setBoxHovered(true)}
        onPointerOut={() => setBoxHovered(false)}
        scale={boxHovered ? 1.1 : 1}
      >
        <boxGeometry args={[3, 3, 3]} />
        <meshPhysicalMaterial color={route === '/' ? 'darkgreen' : 'orange'} />
      </mesh>
      <directionalLight position={[5, 5, 5]} />
      <ambientLight />
    </>
  )
}

export default BoxComponent
