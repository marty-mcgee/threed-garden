import React, { useEffect, useRef, useState } from 'react'
import { useFBX } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const ModelWithAnimation = () => {
  const model = useFBX('./characters/models/SK_Chr_Farmer_Female_01.fbx')
  const idleAnimation = useFBX('./characters/animations/Idle.fbx')
  const walkAnimation = useFBX('./characters/animations/Walking.fbx')
  const runAnimation = useFBX('./characters/animations/Running.fbx')
  const mixer = useRef<any>(null)
  const [actions, setActions] = useState({})

  useEffect(() => {
    if (model && walkAnimation && runAnimation && idleAnimation) {
      // Create an AnimationMixer for the model
      mixer.current = new THREE.AnimationMixer(model)

      // Map each animation clip to an action
      const walkAction = mixer.current.clipAction(walkAnimation.animations[0])
      const runAction = mixer.current.clipAction(runAnimation.animations[0])
      const idleAction = mixer.current.clipAction(idleAnimation.animations[0])

      // Store the actions in state or a ref for later use
      setActions({
        walk: walkAction,
        run: runAction,
        idle: idleAction,
      })

      // Play the default animation (e.g., idle)
      idleAction.play()
    }
  }, [model, walkAnimation, runAnimation, idleAnimation])

  useFrame((state, delta) => {
    if (mixer.current) {
      mixer.current.update(delta)
    }
  })

  // Function to switch between animations
  const playAnimation = (animationName: any) => {
    // @ts-expect-error
    if (actions[animationName]) {
      // Stop all other animations
      // @ts-expect-error
      Object.values(actions).forEach((action) => action.stop())
      // Play the selected animation
      // @ts-expect-error
      actions[animationName].play()
    }
  }

  return (
    <>
      <primitive object={model} />
      {/* Example: Buttons to control animations */}
      {/* <button onClick={() => playAnimation('walk')}>Walk</button>
      <button onClick={() => playAnimation('run')}>Run</button>
      <button onClick={() => playAnimation('idle')}>Idle</button> */}
    </>
  )
}



export default ModelWithAnimation