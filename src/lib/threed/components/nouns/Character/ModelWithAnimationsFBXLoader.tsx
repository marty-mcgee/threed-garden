import { 
  FC, 
  useEffect, 
  useRef, 
  useState,
} from 'react'

import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'

import { 
  // useFBX,
  Html,
  Text,
} from '@react-three/drei'
import { 
  useFrame,
} from '@react-three/fiber'

// Define the type for animation actions
type AnimationActions = {
  idle: THREE.AnimationAction | null
  walk: THREE.AnimationAction | null
  run: THREE.AnimationAction | null
  // [key: string]: THREE.AnimationAction | null
}

const ModelWithMultipleAnimations: FC = () => {
  // Define the animation file names (or paths)
  const animationFiles = {
    idle: './characters/animations/Idle.fbx',
    walk: './characters/animations/Walking.fbx',
    run:  './characters/animations/Running.fbx',
    // all:  './characters/animations/Animations.fbx',
  }

  // Load the model file (fbx)
  const modelFile = './characters/models/SK_Chr_Farmer_Female_01.fbx'
  // const modelFile = './SK_Chr_Farmer_Male_01.fbx'

  // const model = useFBX('./SK_Chr_Farmer_Female_01.fbx')
  // const model = useFBX('./SK_Chr_Farmer_Male_01.fbx')
  // State to store active model (fbx) -- set using THREE.FBXLoader
  const [model, setModel] = useState<THREE.Group | null>(null)

  // State to store loaded animations
  const [animations, setAnimations] = useState<{
    idle: THREE.AnimationClip[] | null
    walk: THREE.AnimationClip[] | null
    run:  THREE.AnimationClip[] | null
  }>({
    idle: null,
    walk: null,
    run:  null,
  })

  // State to store animation actions
  const [actions, setActions] = useState<AnimationActions>({
    idle: null,
    walk: null,
    run:  null,
  })

  // State to track the current animation
  const [currentAnimation, setCurrentAnimation] = useState<keyof AnimationActions>('idle')

  // State to track loading + errors
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const mixer = useRef<THREE.AnimationMixer | null>(null)

  // Load the model and animations asynchronously
  useEffect(() => {
    const loader = new FBXLoader()

    // Load the model + animations
    loader.load(
      modelFile,
      (fbx) => {
        // Scale the model
        // fbx.scale.set(10.00, 10.00, 10.00)
        // fbx.scale.set(1.00, 1.00, 1.00)
        // fbx.scale.set(0.01, 0.01, 0.01)
        setModel(fbx)
        // setAnimations({
        //   walk: fbx.animations.filter((clip) => clip.name === 'walk'),
        //   run: fbx.animations.filter((clip) => clip.name === 'run'),
        //   idle: fbx.animations.filter((clip) => clip.name === 'idle'),
        // })
        // setLoading(false)
      },
      undefined,
      (error) => {
        console.error('Failed to load model:', error)
        setError('Failed to load model.')
        setLoading(false) // Stop loading on error
      }
    )

    // Load animations
    const loadAnimation = (path: string, key: keyof typeof animations) => {
      loader.load(
        path,
        (fbx) => {
          setAnimations((prev) => ({ ...prev, [key]: fbx.animations }))
        },
        undefined,
        (error) => {
          console.error(`Failed to load animation from ${path}:`, error)
          setError(`Failed to load animation: ${key}`)
          setLoading(false) // Stop loading on error
        }
      )
    }

    loadAnimation(animationFiles.idle, 'idle')
    loadAnimation(animationFiles.walk, 'walk')
    loadAnimation(animationFiles.run,  'run')
    setLoading(false)
  }, [])

  // Map animations to actions once they are loaded
  useEffect(() => {
    if ( model
      && animations.idle
      && animations.walk
      && animations.run
    ) {
      try {
        mixer.current = new THREE.AnimationMixer(model)

        const actionMap: AnimationActions = {
          idle: null,
          walk: null,
          run:  null,
        }

        // Map each animation to an action
        if (animations.walk.length > 0) {
          actionMap.walk = mixer.current.clipAction(animations.walk[0])
        } else {
          console.warn('No animations found in walk.fbx.')
        }
        if (animations.run.length > 0) {
          actionMap.run = mixer.current.clipAction(animations.run[0])
        } else {
          console.warn('No animations found in run.fbx.')
        }
        if (animations.idle.length > 0) {
          actionMap.idle = mixer.current.clipAction(animations.idle[0])
        } else {
          console.warn('No animations found in idle.fbx.')
        }

        // Store the actions in state
        setActions(actionMap)

        // Play the default animation (e.g., idle)
        if (actionMap.idle) {
          actionMap.idle.play()
        } else {
          setError('No idle animation found.')
        }
      } catch (error) {
        console.error('Error initializing animations:', error)
        setError('Failed to initialize animations.')
      }
    }
  }, [model, animations])

  // Update the mixer on every frame
  useFrame((state, delta) => {
    if (mixer.current) {
      mixer.current.update(delta)
    }
  })

  // Function to cycle through animations
  const cycleAnimation = () => {
    try {
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
      } else {
        console.warn(`Animation "${nextAnimation}" not found.`)
      }
    } catch (error) {
      console.error('Error cycling animations:', error)
      setError('Failed to cycle animations.')
    }
  }

  // Handle right-click event
  const handleRightClick = () => {
    cycleAnimation() // Cycle to the next animation
  }

  // Prevent the browser's context menu from appearing on right-click
  useEffect(() => {
    const preventContextMenu = (event: MouseEvent) => {
      if (event.button === 2) { // Right-click
        event.preventDefault()
      }
    }

    document.addEventListener('contextmenu', preventContextMenu)

    return () => {
      document.removeEventListener('contextmenu', preventContextMenu)
    }
  }, [])

  return (
    <>
      {/* EXAMPLE: Display error message if an error occurs */}
      {error && (
        <Html>
          <div style={{ color: 'red', position: 'absolute', top: '10px', left: '10px' }}>
            Error: {error}
          </div>
        </Html>
      )}

      {/* 3D Model */}
      {model && (
        <primitive
          object={model}
          onContextMenu={handleRightClick} // Use right-click to trigger the animation cycle
          onPointerOver={() => (document.body.style.cursor = 'pointer')} // Change cursor on hover
          onPointerOut={() => (document.body.style.cursor = 'auto')} // Reset cursor on hover out
        />
      )}
    </>
  )
}

export default ModelWithMultipleAnimations