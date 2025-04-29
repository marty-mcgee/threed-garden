import { useGLTF } from '@react-three/drei'

export default function Cup(props) {
  // @ ts-expect-error
  // @ts-ignore
  const { nodes, materials } = useGLTF('assets/examples/coffee-transformed.glb')
  console.debug('nodes, materials', nodes, materials)

  return (
    <mesh
      receiveShadow
      castShadow
      geometry={nodes.coffee_cup_top_16oz.geometry}
      material={materials['13 - Default']}
      {...props}
      dispose={null}
    />
  )
}
