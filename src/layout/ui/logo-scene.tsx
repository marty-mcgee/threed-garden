import { useState } from 'react'
import { ThreeDCube } from '#/layout/ui/threed-cube'
import { ThreeCube } from '#/layout/ui/three-cube'

export function LogoScene() {
  const [cubeVisible, setCubeVisible] = useState(false)
    
  const handleClick = () => setCubeVisible(p => !p)
    
  return (
    <>
      <ThreeDCube onClick={handleClick} />
      { cubeVisible && 
        <ThreeCube />
      }
    </>
  )
}