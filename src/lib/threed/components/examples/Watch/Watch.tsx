import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, useGLTF } from '@react-three/drei'

export default function Watch(props: any) {
  const ref: any = useRef(null)
  // @ ts-expect-error
  // @ts-ignore
  const { nodes, materials } = useGLTF('assets/objects/examples/watch-v1.glb')
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    ref.current.rotation.x = -Math.PI / 1.75 + Math.cos(t / 4) / 8
    ref.current.rotation.y = Math.sin(t / 4) / 8
    ref.current.rotation.z = (1 + Math.sin(t / 1.5)) / 20
    ref.current.position.y = (1 + Math.sin(t / 1.5)) / 10
  })
  return (
    <group ref={ref} {...props} dispose={null}>
      {/* // @ ts-expect-error
          // @ts-ignore */}
      <mesh geometry={nodes.Object005_glass_0.geometry} material={materials.glass}>
        <Html scale={100} rotation={[Math.PI / 2, 0, 0]} position={[180, -350, 50]} transform occlude>
          <div className='annotation'>
            <span style={{ fontSize: '1.5em' }}>🥕</span> 6,550
          </div>
        </Html>
      </mesh>
      {/* // @ ts-expect-error
          // @ts-ignore */}
      <mesh castShadow receiveShadow geometry={nodes.Object006_watch_0.geometry} material={materials.watch} />
    </group>
  )
}
