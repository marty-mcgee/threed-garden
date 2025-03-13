import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { useGame, type AnimationSet } from '#/lib/ecctrl/src/stores/useGame'
import { BallCollider, RapierCollider, vec3 } from '@react-three/rapier'

// ** AnimationActions should match AnimationSet?
type AnimationActions = {
  idle: THREE.AnimationAction | null
  walk: THREE.AnimationAction | null
  run: THREE.AnimationAction | null
  jump: THREE.AnimationAction | null
  jumpLand: THREE.AnimationAction | null
  jumpIdle: THREE.AnimationAction | null
  fall: THREE.AnimationAction | null
  action1: THREE.AnimationAction | null
  action2: THREE.AnimationAction | null
  action3: THREE.AnimationAction | null
  action4: THREE.AnimationAction | null
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
    jumpLand: THREE.AnimationClip[] | null
    jumpIdle: THREE.AnimationClip[] | null
    fall: THREE.AnimationClip[] | null
    action1: THREE.AnimationClip[] | null
    action2: THREE.AnimationClip[] | null
    action3: THREE.AnimationClip[] | null
    action4: THREE.AnimationClip[] | null
    punch: THREE.AnimationClip[] | null
    wave: THREE.AnimationClip[] | null
  }>({
    idle: null,
    walk: null,
    run: null,
    jump: null,
    jumpLand: null,
    jumpIdle: null,
    fall: null,
    action1: null,
    action2: null,
    action3: null,
    action4: null,
    punch: null,
    wave: null,
  })

  const [actions, setActions] = useState<AnimationActions>({
    idle: null,
    walk: null,
    run: null,
    jump: null,
    jumpLand: null,
    jumpIdle: null,
    fall: null,
    action1: null,
    action2: null,
    action3: null,
    action4: null,
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
    jumpIdle: 'jump',
    jumpLand: 'idle',
    fall: 'idle',
    action1: 'wave',
    action2: 'punch',
    action3: 'wave',
    action4: 'punch',
    punch: 'punch',
    wave: 'wave',
  } as AnimationSet

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

    loadAnimation(animationFileDir + 'Idle.fbx', 'idle')
    loadAnimation(animationFileDir + 'Walking.fbx', 'walk')
    loadAnimation(animationFileDir + 'Running.fbx', 'run')
    loadAnimation(animationFileDir + 'Walking.fbx', 'jump')
    loadAnimation(animationFileDir + 'Walking.fbx', 'jumpLand')
    loadAnimation(animationFileDir + 'Walking.fbx', 'jumpIdle')
    loadAnimation(animationFileDir + 'Walking.fbx', 'fall')
    loadAnimation(animationFileDir + 'Walking.fbx', 'action1')
    loadAnimation(animationFileDir + 'Walking.fbx', 'action2')
    loadAnimation(animationFileDir + 'Walking.fbx', 'action3')
    loadAnimation(animationFileDir + 'Walking.fbx', 'action4')
    loadAnimation(animationFileDir + 'Pointing Gesture.fbx', 'punch')
    loadAnimation(animationFileDir + 'Talking.fbx', 'wave')
  }, [])

  // Initialize animation actions once model and animations are loaded
  useEffect(() => {
    if ( model 
      && animations.idle 
      && animations.walk 
      && animations.run 
      && animations.jump 
      && animations.jumpIdle
      && animations.jumpLand
      && animations.fall
      && animations.action1 
      && animations.action2
      && animations.action3
      && animations.action4
      && animations.punch 
      && animations.wave
    ) {
      mixer.current = new THREE.AnimationMixer(model)

      const actionMap: AnimationActions = {
        idle: mixer.current.clipAction(animations.idle[0]),
        walk: mixer.current.clipAction(animations.walk[0]),
        run: mixer.current.clipAction(animations.run[0]),
        jump: mixer.current.clipAction(animations.jump[0]),
        jumpIdle: mixer.current.clipAction(animations.jump[0]),
        jumpLand: mixer.current.clipAction(animations.jump[0]),
        fall: mixer.current.clipAction(animations.jump[0]),
        action1: mixer.current.clipAction(animations.jump[0]),
        action2: mixer.current.clipAction(animations.jump[0]),
        action3: mixer.current.clipAction(animations.jump[0]),
        action4: mixer.current.clipAction(animations.jump[0]),
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

  // Log current animation
  useEffect(() => {
    console.debug('Current Animation:', curAnimation)
  }, [curAnimation])

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

      // Stop all other actions
      Object.values(actions).forEach((a) => {
        if (a && a !== action) {
          a.stop()
        }
      })

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