import * as THREE from 'three'
import { useLoader } from '@react-three/fiber'

export function ThreeDCube(props: any) {
  // ** HOOK useLoader
  const texture = useLoader(THREE.TextureLoader, '/favicon/favicon.png')
  // ** RETURN Three Object
  return (
    <mesh position={[-1, 0, 0]} {...props}>
      <boxGeometry />
      <meshBasicMaterial map={texture} />
    </mesh>
  )
}
