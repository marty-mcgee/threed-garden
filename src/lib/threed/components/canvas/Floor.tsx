// 'use client'
// ==========================================================
// RESOURCES

// ** PHYSICS Imports
import { RigidBody } from '@react-three/rapier'

// ** REACT THREE DREI Imports
// useTexture
import { 
  // Circle, 
  // Detailed, 
  useTexture 
} from '@react-three/drei'

// ** THREE JS Imports
import { RepeatWrapping } from 'three'



// ==========================================================
// ** PROPERTIES : VARIABLES : CONSTANTS

// ** ** FARMBOT : ASSETS : CONSTANTS
import { 
  // SETTINGS?,
  // PREFERENCES?,
  // FILES?,
  // TEXTURES???,
  ASSETS,
}from '#/lib/threed/config/configMain'
// ==========================================================



// ** EXPORT Component
export default function Floor(
  {
    color = 'black', 
    opacity = 1.0
  }: {
    color: string, 
    opacity: number
  }
) {

  // ** HOOKS

  // ** TEXTURES
  const grassTexture = useTexture(ASSETS.textures.grass + "?=grass");
  grassTexture.wrapS = RepeatWrapping;
  grassTexture.wrapT = RepeatWrapping;
  grassTexture.repeat.set(24, 24);


  return (
    <RigidBody 
      type='fixed' 
      position={[0, 0, 0]}
    >
      <mesh 
        receiveShadow
      >
        <boxGeometry 
          args={[20480, -1, 20480]} 
        />
        <meshPhongMaterial 
          color={color} 
          opacity={opacity} 
          transparent={true} 
        />
        {/* 
        <meshStandardMaterial 
          color={color} 
        /> 
        */}
      </mesh>
    </RigidBody>
  )
}
