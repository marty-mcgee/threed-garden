import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { useGame } from '#/lib/ecctrl/src/stores/useGame'
import { BallCollider, RapierCollider, vec3 } from '@react-three/rapier'

type AnimationActions = {
  idle: THREE.AnimationAction | null
  walk: THREE.AnimationAction | null
  run: THREE.AnimationAction | null
  jump: THREE.AnimationAction | null
  punch: THREE.AnimationAction | null
  wave: THREE.AnimationAction | null
}

export default function CharacterModel(props: any) {

  // const modelFile = './characters/models/CharacterModel.fbx'
  const modelFile = './characters/models/SK_Chr_Farmer_Female_01.fbx'
  const animationFileDir = 'objects/animations/'

  const group = useRef<THREE.Group>(null)

  const [model, setModel] = useState<THREE.Group | null>(null)

  const [animations, setAnimations] = useState<{
    idle: THREE.AnimationClip[] | null
    walk: THREE.AnimationClip[] | null
    run: THREE.AnimationClip[] | null
    jump: THREE.AnimationClip[] | null
    punch: THREE.AnimationClip[] | null
    wave: THREE.AnimationClip[] | null
  }>({
    idle: null,
    walk: null,
    run: null,
    jump: null,
    punch: null,
    wave: null,
  })

  const [actions, setActions] = useState<AnimationActions>({
    idle: null,
    walk: null,
    run: null,
    jump: null,
    punch: null,
    wave: null,
  })

  const mixer = useRef<THREE.AnimationMixer | null>(null)
  const curAnimation = useGame((state) => state.curAnimation)
  const resetAnimation = useGame((state) => state.reset)
  const initializeAnimationSet = useGame((state) => state.initializeAnimationSet)

  const animationSet = {
    idle: 'idle',
    walk: 'walk',
    run: 'run',
    jump: 'jump',
    action1: 'wave',
    action2: 'punch',
    action3: 'wave',
    action4: 'punch',
  }

  // Load the FBX model and animations
  useEffect(() => {
    const loader = new FBXLoader()

    // Load the main character model
    loader.load(
      modelFile,
      (fbx) => {
        fbx.scale.set(0.1, 0.1, 0.1) // Adjust scale as needed
        setModel(fbx)
      },
      undefined,
      (error) => {
        console.error('Failed to load model:', error)
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
        }
      )
    }

    loadAnimation('objects/animations/Idle.fbx', 'idle')
    loadAnimation('objects/animations/Walking.fbx', 'walk')
    loadAnimation('objects/animations/Running.fbx', 'run')
    loadAnimation('objects/animations/Moonwalk.fbx', 'jump')
    loadAnimation('objects/animations/Pointing Gesture.fbx', 'punch')
    loadAnimation('objects/animations/Talking.fbx', 'wave')
  }, [])

  // Initialize animation actions once model and animations are loaded
  useEffect(() => {
    if ( model 
      && animations.idle 
      && animations.walk 
      && animations.run 
      && animations.jump 
      && animations.punch 
      && animations.wave
    ) {
      mixer.current = new THREE.AnimationMixer(model)

      const actionMap: AnimationActions = {
        idle: mixer.current.clipAction(animations.idle[0]),
        walk: mixer.current.clipAction(animations.walk[0]),
        run: mixer.current.clipAction(animations.run[0]),
        jump: mixer.current.clipAction(animations.jump[0]),
        punch: mixer.current.clipAction(animations.punch[0]),
        wave: mixer.current.clipAction(animations.wave[0]),
      }

      setActions(actionMap)
      initializeAnimationSet(animationSet)

      // Play the default idle animation
      if (actionMap.idle) {
        actionMap.idle.play()
      }
    }
  }, [model, animations])

  // Update the animation mixer on every frame
  useFrame((state, delta) => {
    if (mixer.current) {
      mixer.current.update(delta)
    }
  })

  // Handle animation transitions
  useEffect(() => {
    if (actions[curAnimation as keyof AnimationActions]) {
      const action = actions[curAnimation as keyof AnimationActions]!

      if (
        curAnimation === animationSet.jump ||
        curAnimation === animationSet.action1 ||
        curAnimation === animationSet.action2
      ) {
        action.reset().fadeIn(0.2).setLoop(THREE.LoopOnce, 1).play()
        action.clampWhenFinished = true
      } else {
        action.reset().fadeIn(0.2).play()
      }

      // @ts-expect-error : [MM] _mixer not defined in type/interface
      action._mixer.addEventListener('finished', () => resetAnimation())

      return () => {
        action.fadeOut(0.2)
        // @ts-expect-error : [MM] _mixer not defined in type/interface
        action._mixer.removeEventListener('finished', () => resetAnimation())
        // @ts-expect-error : [MM] _mixer not defined in type/interface
        action._mixer._listeners = []
      }
    }
  }, [curAnimation])

  return (
    <group ref={group} {...props} dispose={null}>
      {model && (
        <primitive object={model} />
      )}
      <BallCollider args={[0.5]} position={[0, 0.45, 0]} />
      <BallCollider args={[0.1]} position={[0.5, 0, 0]} />
    </group>
  )
}