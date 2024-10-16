import * as THREE from 'three'
import { useLoader, useFrame } from 'react-three-fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'


const Model = props => {
  const model = useLoader(
    GLTFLoader,
    props.path
  )

  let mixer
  if (model.animations.length > 0) {
    mixer = new THREE.AnimationMixer(model.scene)
    model.animations.forEach(clip => {
      const action = mixer.clipAction(clip)
      action.play()
    })
  }

  useFrame((scene, delta) => {
    mixer?.update(delta)
  })

  model.scene.traverse(child => {
    if (child.isMesh) {
      child.castShadow = true
      child.receiveShadow = true
      child.material.side = THREE.FrontSide
    }
  })

  return (
    <primitive
      object={model.scene}
      scale={props.scale}
      position={props.position}
    />
  )
}

export default Model
