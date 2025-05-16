// 'use client'
// ==========================================================
// RESOURCES

// ** PHYSICS Imports
import { RigidBody } from '@react-three/rapier'

// ** REACT THREE DREI Imports
import { 
  // Circle, 
  // Detailed, 
  useTexture 
} from '@react-three/drei'

// ** THREE JS Imports
import { RepeatWrapping } from 'three'

// ** API : PROPERTIES : VARIABLES : CONSTANTS
import { ASSETS } from '#/lib/api/data/constants'

// ** EXPORT Component
export default function Floor(
  {
    color = 'darkgreen', 
    opacity = 1.0
  }: {
    color: string, 
    opacity: number
  }
) {

  // ** HOOKS

  // ** TEXTURES
  const grassTexture = useTexture(ASSETS.textures.grass + '?=grass')
  grassTexture.wrapS = RepeatWrapping
  grassTexture.wrapT = RepeatWrapping
  grassTexture.repeat.set(1000, 1000)


  return (
    <RigidBody 
      type='fixed' 
      position={[0, 0, 0]}
    >
      <mesh 
        receiveShadow
      >
        <boxGeometry 
          args={[2000, 0, 2000]} 
        />
        <meshPhongMaterial 
          map={grassTexture}
          color={color} 
          opacity={opacity} 
          transparent={false} 
        />
        {/* 
        <meshStandardMaterial 
          map={grassTexture}
          color={color} 
        /> 
        */}
      </mesh>
    </RigidBody>
  )
}
