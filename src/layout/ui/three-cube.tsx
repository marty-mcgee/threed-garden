import * as THREE from 'three'
import { useLoader } from '@react-three/fiber'

export function ThreeCube(props: any) {    
  const texture = useLoader(THREE.TextureLoader, 'https://raw.githubusercontent.com/AaronClaes/my-site/main/public/three.png')

  return (
    <mesh position={[1, 0, 0]} {...props}>
      <boxGeometry />
      <meshBasicMaterial map={texture} />
    </mesh>
  )
}