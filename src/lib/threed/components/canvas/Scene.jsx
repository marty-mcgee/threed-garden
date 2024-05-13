
import { Preload } from '@react-three/drei'
import * as THREE from 'three'

export default function Scene({ ...props }) {
  // Everything defined in here will persist between route changes, only children are swapped
  return (
    <Canvas {...props}
      // @ts-expect-error
      onCreated={(state) => (state.gl.toneMapping = THREE.AgXToneMapping)}
    >
      {/* HEY HEY HEY */}
    </Canvas>
  )
}
