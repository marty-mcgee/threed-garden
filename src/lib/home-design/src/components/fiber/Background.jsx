import { useMemo } from 'react'
import * as THREE from 'three'
import { useLoader, useThree } from 'react-three-fiber'

const Background = props => {
  const texture = useLoader(
    THREE.TextureLoader,
    '/garage/modern-background-gray.jpg'
  )

  const { gl } = useThree()
  const formatted = useMemo(() =>
    new THREE.WebGLCubeRenderTarget(
      texture.image.height
    ).fromEquirectangularTexture(gl, texture)
    , [gl, texture])

  return (
    <primitive
      attach='background'
      object={formatted}
    />
  )
}

export default Background
