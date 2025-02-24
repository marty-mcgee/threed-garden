import React, { useEffect, useRef, useState } from 'react'
import { useFBX } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Define the type for animation actions
type AnimationActions = {
  idle: THREE.AnimationAction | null
  walk: THREE.AnimationAction | null
  run: THREE.AnimationAction | null
  [key: string]: THREE.AnimationAction | null
}

const ModelWithMultipleAnimations: React.FC = () => {
  // Define the animation file names (or paths)
  const animationFiles = {
    idle: './characters/animations/Idle.fbx',
    walk: './characters/animations/Walking.fbx',
    run:  './characters/animations/Running.fbx',
    all:  './characters/animations/Animations.fbx',
  }

  // Load the model
  const model = useFBX('./characters/models/SK_Chr_Farmer_Female_01.fbx')
  // const model = useFBX('./characters/models/SK_Chr_Farmer_Male_01.fbx')

  // Load all animations dynamically with error handling
  const loadAnimation = (path: string) => {
    try {
      return useFBX(path);
    } catch (error) {
      console.error(`Failed to load animation from ${path}:`, error);
      return null;
    }
  };

  // Load all animations dynamically
  const idleAnimation = loadAnimation(animationFiles.idle)
  const walkAnimation = loadAnimation(animationFiles.walk)
  const runAnimation = loadAnimation(animationFiles.run)

  // State to store animation actions
  const [actions, setActions] = useState<AnimationActions>({
    idle: null,
    walk: null,
    run: null,
  })

  // State to track the current animation
  const [currentAnimation, setCurrentAnimation] = useState<keyof AnimationActions>('idle')

  // State to track loading errors
  const [error, setError] = useState<string | null>(null)

  // Create the AnimationMixer ref as 'mixer'
  const mixer = useRef<THREE.AnimationMixer | null>(null)

  // Map animations to actions once they are loaded
  useEffect(() => {
    if (model && walkAnimation && runAnimation && idleAnimation) {
      mixer.current = new THREE.AnimationMixer(model)

      const actionMap: AnimationActions = {
        walk: null,
        run: null,
        idle: null,
      }

      // Map each animation to an action
      if (walkAnimation.animations.length > 0) {
        actionMap.walk = mixer.current.clipAction(walkAnimation.animations[0])
      }
      if (runAnimation.animations.length > 0) {
        actionMap.run = mixer.current.clipAction(runAnimation.animations[0])
      }
      if (idleAnimation.animations.length > 0) {
        actionMap.idle = mixer.current.clipAction(idleAnimation.animations[0])
      }

      // Store the actions in state
      setActions(actionMap)

      // Play the default animation (e.g., idle)
      if (actionMap.idle) {
        actionMap.idle.play()
      }
    }
  }, [model, idleAnimation, walkAnimation, runAnimation]) // Add dependencies here

  // Update the mixer on every frame
  useFrame((state, delta) => {
    if (mixer.current) {
      mixer.current.update(delta)
    }
  })

  // Function to switch between animations
  const playAnimation = (animationName: keyof AnimationActions) => {
    const action = actions[animationName]
    if (action) {
      // Stop all other animations
      Object.values(actions).forEach((action) => {
        if (action) action.stop()
      })
      // Play the selected animation
      action.play()
    }
  }

  // Function to cycle through animations
  const cycleAnimation = () => {
    const animationOrder: (keyof AnimationActions)[] = ['idle', 'walk', 'run']
    const currentIndex = animationOrder.indexOf(currentAnimation)
    const nextAnimation = animationOrder[(currentIndex + 1) % animationOrder.length]

    // Stop the current animation
    if (actions[currentAnimation]) {
      actions[currentAnimation]!.stop()
    }

    // Play the next animation
    if (actions[nextAnimation]) {
      actions[nextAnimation]!.play()
      setCurrentAnimation(nextAnimation)
    }
  }

  // ** RETURN JSX
  return (
    <>
      <primitive
        object={model}
        onClick={cycleAnimation} // Make the model clickable
        onPointerOver={() => (document.body.style.cursor = 'pointer')} // Change cursor on hover
        onPointerOut={() => (document.body.style.cursor = 'auto')} // Reset cursor on hover out
      />
      {/* Example: Buttons to control animations */}
      {/* 
      <button onClick={() => playAnimation('walk')}>Walk</button>
      <button onClick={() => playAnimation('run')}>Run</button>
      <button onClick={() => playAnimation('idle')}>Idle</button>
      */}
    </>
  )
}

export default ModelWithMultipleAnimations