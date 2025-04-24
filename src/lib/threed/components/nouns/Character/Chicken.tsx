// @ ts-nocheck /* OR @ ts-ignore OR @ ts-expect-error */
// 'use client'
// ==========================================================
// RESOURCES

// ** APOLLO Imports
import { useReactiveVar } from '@apollo/client'
import { preferencesDataVar } from '#/lib/api/graphql/apollo'

// ** REACT Imports
import {
  Suspense,
  useEffect,
  useRef,
  useState,
  // (instances of):
  useMemo,
  // useContext,
  // createContext,
} from 'react'

// ** THREE Imports
import * as THREE from 'three'

// ** GLTF to JSX
// import * as THREE from 'three'
// import React, { useRef } from 'react'
// import { useGLTF, useAnimations } from '@react-three/drei'
import { GLTF } from 'three-stdlib'

// ** TYPES Imports
import type { GLTF as GLTFType } from 'three/examples/jsm/loaders/GLTFLoader'

// ** REACT-THREE Imports
import { useFrame } from '@react-three/fiber'
import {
  useAnimations,
  useGLTF,
  useTexture,
  Trail,
  SpriteAnimator,
  // // (instances of):
  // Merged,
} from '@react-three/drei'

// ** LEVA Imports
import { useControls } from 'leva'

// ** PHYSICS Imports
import {
  BallCollider,
  RapierCollider,
  vec3,
} from '@react-three/rapier'

// ** ECCRTL CHARACTER ANIMATION
import { EcctrlAnimation } from '#/lib/ecctrl/src/EcctrlAnimation'
// ** ECCRTL ZUSTAND STATE
import { useGame } from '#/lib/ecctrl/src/stores/useGame'

// ** HELPER Imports
// import { Perf } from 'r3f-perf'
// import Spinner from '#/layout/ui/spinner'
import ccm from '#/lib/utils/console-colors'

// ** DEBUG: this module
const debug: boolean = false
const DEBUG: boolean = false

// ** FILES for CharacterModel: Settings/Locations
// const theCharacterModelFile = '/assets/objects/examples/CharacterModelFloating.glb'
// const file = 'https://threedpublic.s3.us-west-2.amazonaws.com/assets/threeds/fauna/Hen_HP.glb'
const file = 'https://threedpublic.s3.us-west-2.amazonaws.com/assets/threeds/fauna/Chicken-Red-Hen.glb'
const texture = 'https://threedpublic.s3.us-west-2.amazonaws.com/assets/threeds/fauna/textures/Hen&Chicken_A.png'


// ** TYPES for this GLTF
// **
// type GLTFResult = GLTF & {
//   nodes: {
//     Hen_HP: THREE.Mesh
//     skeleton: THREE.Skeleton
//   }
//   materials: {
//     lambert2: THREE.MeshStandardMaterial
//   }
// }
type GLTFResult = GLTFType & {
  nodes: {
    Hen_HP002: THREE.Mesh
  }
  materials: {
    Material: THREE.MeshStandardMaterial
  }
}
// **
type ActionName = 'Take 001'
// **
type GLTFActions = Record<ActionName, THREE.AnimationAction>

// **
// ** TESTING -- Instances Of <CharacterModel>
// const context = createContext()
// export function Instances({ children, ...props }) {
//   const { nodes } = useGLTF(file) as GLTFResult
//   const instances = useMemo(
//     () => ({
//       Chicken: nodes.Hen_HP,
//     }),
//     [nodes]
//   )
//   return (
//     <Merged meshes={instances} {...props}>
//       {(instances) => <context.Provider value={instances} children={children} />}
//     </Merged>
//   )
// }
// **

// export this type?
type CharacterModelProps = any

export default function CharacterModel(props: CharacterModelProps) {

  // ** GET THREED PREFERENCES FROM APOLLO CLIENT STORE:STATE
  const prefs = useReactiveVar(preferencesDataVar)
  // console.debug(`%c CHARACTER MODEL: APOLLO prefs`, ccm.orangeAlert, prefs)

  // ** TESTING instances of character model
  // const instances = useContext(context)

  const group = useRef<THREE.Group>(null)

  // @ts-expect-error: ignore a compile error, like this type mismatch
  // const { nodes, animations } = useGLTF(theCharacterModelFile) as GLTF & {
  //   nodes: any
  // }
  const { nodes, materials, animations } = useGLTF(file) as GLTF & {
    nodes: any
  }
  if (debug) console.debug(`%c nodes, materials, animations`, ccm.yellowAlert, nodes, materials, animations)

  // @ts-expect-error // TODO: match Type GLTFActions
  const { actions } = useAnimations<GLTFActions>(animations, group)
  if (debug) console.debug(`%c animations.actions, group`, ccm.yellowAlert, actions, materials, group)

  // gradientMapTexture for MeshToonMaterial
  const gradientMapTexture = useTexture(texture) // '/textures/3.jpg'
  gradientMapTexture.minFilter = THREE.NearestFilter
  gradientMapTexture.magFilter = THREE.NearestFilter
  gradientMapTexture.generateMipmaps = true

  /**
   * Prepare Hands+Body Refs+Memos for actions[action4]
   */
  const rightHandRef = useRef<THREE.Mesh>(null)
  const rightHandColliderRef = useRef<RapierCollider>(null)
  const leftHandRef = useRef<THREE.Mesh>(null)
  const leftHandColliderRef = useRef<RapierCollider>(null)
  const rightHandPos = useMemo(() => new THREE.Vector3(), [])
  const leftHandPos = useMemo(() => new THREE.Vector3(), [])
  const bodyPosition = useMemo(() => new THREE.Vector3(), [])
  const bodyRotation = useMemo(() => new THREE.Quaternion(), [])
  let rightHand: THREE.Object3D = null
  let leftHand: THREE.Object3D = null
  let mugModel: THREE.Object3D = null

  /**
   * Prepare punch effect sprite
   */
  const [punchEffectProps, setPunchEffectProp] = useState({
    visible: false,
    scale: [1, 1, 1],
    play: false,
    position: [-0.2, -0.2, 0.5],
    startFrame: 0,
  })

  /**
   * Character Preferences
   */
  // const [{
  //   characterMainColor,
  //   characterOutlineColor,
  //   characterTrailColor,
  // }, setCharacterPreferencesLeva] = useControls(
  //   'Character Preferences',
  //   () => ({
  //     doCharacterAnimation: {
  //       label: 'Animate Character?',
  //       value: prefs.doCharacterAnimation,
  //     },
  //     characterMainColor: {
  //       label: 'Main Color',
  //       value: prefs.characterMainColor,
  //     },
  //     characterOutlineColor: {
  //       label: 'Outline Color',
  //       value: prefs.characterOutlineColor,
  //     },
  //     characterTrailColor: {
  //       label: 'Trail Color',
  //       value: prefs.characterTrailColor,
  //     },
  //   }),
  //   {
  //     color: 'darkgreen',
  //     collapsed: false,
  //     order: 10,
  //   },
  // )

  /**
   * Prepare replacing materials
   */
  // const meshToonMaterial = useMemo(
  //   () =>
  //     new THREE.MeshToonMaterial({
  //       color: prefs.characterMainColor,
  //       gradientMap: gradientMapTexture,
  //       transparent: true,
  //     }),
  //   [prefs.characterMainColor]
  // )
  // const outlineMaterial = useMemo(
  //   () =>
  //     new THREE.MeshBasicMaterial({
  //       color: prefs.characterOutlineColor,
  //       transparent: true,
  //     }),
  //   [prefs.characterOutlineColor]
  // )
  // const trailMaterial = useMemo(
  //   () =>
  //     new THREE.MeshToonMaterial({
  //       color: prefs.characterTrailColor,
  //       gradientMap: gradientMapTexture,
  //       transparent: true,
  //     }),
  //   [prefs.characterTrailColor]
  // )

  // **
  // ** Character animations setup
  // **
  const curAnimation = useGame((state) => state.curAnimation)
  const resetAnimation = useGame((state) => state.reset)
  const initializeAnimationSet = useGame(
    (state) => state.initializeAnimationSet
  )

  // **
  // ** ANIMATIONS ****************************************
  // **
  const anims = [
    'Breathing Idle',
    'Crouch To Stand',
    'Crouching Idle',
    'Crouching',
    'Driving',
    'Entering Car',
    'Exiting Car',
    'Idle',
    'Left Turn',
    'Moonwalk',
    'Planting A Plant',
    'Pointing Gesture',
    'Pointing',
    'Push Up',
    'Right Turn',
    'Running',
    'Standing To Crouched',
    'Talking',
    'Turn',
    'Walking Backwards',
    'Walking',
  ]
  const animsFarming = [
    'farming/box idle',
    'farming/box idle',
    'farming/box turn (2)',
    'farming/box turn',
    'farming/box walk arc',
    'farming/cow milking',
    'farming/dig and plant seeds',
    'farming/holding idle',
    'farming/holding turn left',
    'farming/holding turn right',
    'farming/holding walk',
    'farming/kneeling idle',
    'farming/pick fruit (2)',
    'farming/pick fruit (3)',
    'farming/pick fruit',
    'farming/plant a plant',
    'farming/plant tree',
    'farming/pull plant (2)',
    'farming/pull plant',
    'farming/watering',
    'farming/wheelbarrow dump',
    'farming/wheelbarrow idle',
    'farming/wheelbarrow walk (2)',
    'farming/wheelbarrow walk turn (2)',
    'farming/wheelbarrow walk turn',
    'farming/wheelbarrow walk',
  ]
  anims.push(...animsFarming)
  // console.debug('anims', anims)

  // Rename your character animations here
  const animationSetNew = {
    idle:     'Breathing Idle',
    walk:     'Walking',
    run:      'Running',
    jump:     'Crouch To Stand',
    jumpIdle: 'Crouching',
    jumpLand: 'Standing To Crouched',
    fall:     'Idle',
    action1:  'Planting A Plant',
    action2:  'Talking',
    action3:  'Pointing Gesture',
    action4:  'Pointing',
  }
  // const animationSet = {
  //   idle: 'Idle',
  //   walk: 'Walk',
  //   run: 'Run',
  //   jump: 'Jump_Start',
  //   jumpIdle: 'Jump_Idle',
  //   jumpLand: 'Jump_Land',
  //   fall: 'Climbing', // This is for falling from high sky
  //   action1: 'Wave',
  //   action2: 'Dance',
  //   action3: 'Cheer',
  //   action4: 'Attack(1h)',
  // }
  const animationSet = animationSetNew
  // console.debug('animationSet', animationSet)

  useEffect(() => {
    // Initialize animation set
    initializeAnimationSet(animationSetNew)
  }, [])

  useEffect(() => {
    group.current.traverse((obj) => {
      // Prepare both hands bone object
      if (obj instanceof THREE.Bone) {
        if (obj.name === 'handSlotRight') rightHand = obj
        if (obj.name === 'handSlotLeft') leftHand = obj
      }
      // Prepare mug model for cheer action
      if (obj.name === 'mug') {
        mugModel = obj
        mugModel.visible = false
      }
    })
  })

  useFrame(() => {

    const word: string = `[MM] HEY HEY HEY @ ${new Date().toISOString()}`
    const wordX: string = group.current.getWorldPosition(bodyPosition).x.toString()
    const wordY: string = group.current.getWorldPosition(bodyPosition).y.toString()
    const wordZ: string = group.current.getWorldPosition(bodyPosition).z.toString()
    if (debug || DEBUG) {
      // console.debug(`%c Chicken: useFrame :(`, ccm.redAlert, word)
      if (debug) console.debug(`%c Chicken: useFrame :(`, ccm.darkredAlert, wordX, wordY, wordZ)
    }
    // [MM] END HEY HEY HEY

    if (curAnimation === animationSet.action4) {
      if (rightHand) {
        rightHand.getWorldPosition(rightHandPos)
        group.current.getWorldPosition(bodyPosition)
        group.current.getWorldQuaternion(bodyRotation)
      }
      if (leftHand) {
        leftHand.getWorldPosition(leftHandPos)
        group.current.getWorldPosition(bodyPosition)
        group.current.getWorldQuaternion(bodyRotation)
      }

      // Apply hands position to hand colliders
      if (rightHandColliderRef.current) {
        // check if parent group autobalance is on or off
        if (group.current.parent.quaternion.y === 0 && group.current.parent.quaternion.w === 1) {
          rightHandRef.current.position.copy(rightHandPos).sub(bodyPosition).applyQuaternion(bodyRotation.conjugate())
        } else {
          rightHandRef.current.position.copy(rightHandPos).sub(bodyPosition)
        }
        rightHandColliderRef.current.setTranslationWrtParent(
          rightHandRef.current.position
        )
      }

      // Apply hands position to hand colliders
      if (leftHandColliderRef.current) {
        // check if parent group autobalance is on or off
        if (group.current.parent.quaternion.y === 0 && group.current.parent.quaternion.w === 1) {
          leftHandRef.current.position.copy(leftHandPos).sub(bodyPosition).applyQuaternion(bodyRotation.conjugate())
        } else {
          leftHandRef.current.position.copy(leftHandPos).sub(bodyPosition)
        }
        leftHandColliderRef.current.setTranslationWrtParent(
          leftHandRef.current.position
        )
      }

    }
  })

  useEffect(() => {

    const word: string = `[MM] HEY HEY HEY @ ${new Date().toISOString()}`

    // Play animation
    // @ts-expect-error // TODO: ???
    const action = actions[curAnimation ? curAnimation : animationSet.jumpIdle]
    // const action = false

    // [MM] HEY HEY HEY
    if (action) {

      // For jump and jump land animation, only play once and clamp when finish
      if (
        curAnimation === animationSet.jump ||
        curAnimation === animationSet.jumpLand ||
        curAnimation === animationSet.action1 ||
        curAnimation === animationSet.action2 ||
        curAnimation === animationSet.action3 ||
        curAnimation === animationSet.action4
      ) {
        action
          .reset()
          .fadeIn(0.2)
          .setLoop(THREE.LoopOnce, undefined as number) // [MM] POTENTIAL BUG POINT
          .play()
        action.clampWhenFinished = true
        // Only show mug during cheer action
        if (curAnimation === animationSet.action3) {
          mugModel.visible = true
        } else {
          mugModel.visible = false
        }
      } else {
        action.reset().fadeIn(0.2).play()
        mugModel.visible = false
      }

      // When any action is clamped and animation finished resetting
      (action as any)._mixer.addEventListener('finished', () => resetAnimation())

    }
    else if (!action) {
      if (debug) console.debug(`%c Chicken: no action :|`, ccm.darkredAlert)
    }
    // [MM] END HEY HEY HEY


    return () => {
      try {
        // Fade out previous action
        action.fadeOut(0.2)

        // Clean up mixer listener, and empty the _listeners array
        (action as any)._mixer.removeEventListener('finished', () =>
          resetAnimation()
        )
        (action as any)._mixer._listeners = []
      } catch (ERROR) {

      }
      // Move hand collider back to initial position after action
      if (curAnimation === animationSet.action4) {
        if (rightHandColliderRef.current) {
          rightHandColliderRef.current.setTranslationWrtParent(vec3({ x: 0, y: 0, z: 0 }))
        }
        if (leftHandColliderRef.current) {
          leftHandColliderRef.current.setTranslationWrtParent(vec3({ x: 0, y: 0, z: 0 }))
        }
      }
    }
  }, [curAnimation])





  
  return (
    <Suspense fallback={<capsuleGeometry args={[0.4, 0.8]} />}>

      {/* Default capsule model */}
      {/* <mesh castShadow>
        <capsuleGeometry args={[0.3, 0.7]} />
        <meshStandardMaterial color='mediumpurple' />
      </mesh>
      <mesh castShadow position={[0, 0.2, 0.2]}>
        <boxGeometry args={[0.5, 0.2, 0.3]} />
        <meshStandardMaterial color='mediumpurple' />
      </mesh> */}

      {/* Head collider */}
      {/* <BallCollider args={[0.5]} position={[0, 0.45, 0]} /> */}

      {/* Right hand collider */}
      <mesh ref={rightHandRef} />
      <BallCollider
        args={[0.1]}
        ref={rightHandColliderRef}
        onCollisionEnter={(e) => {
          if (curAnimation === animationSet.action4) {
            // Play punch effect
            setPunchEffectProp((prev) => ({
              ...prev,
              visible: true,
              play: true,
            }))
          }
        }}
      />

      {/* Left hand collider */}
      <mesh ref={leftHandRef} />
      <BallCollider
        args={[0.1]}
        ref={leftHandColliderRef}
        onCollisionEnter={(e) => {
          if (curAnimation === animationSet.action4) {
            // Play punch effect
            setPunchEffectProp((prev) => ({
              ...prev,
              visible: true,
              play: true,
            }))
          }
        }}
      />

    {/* ANIMATED CHARACTER */}
    {/* <EcctrlAnimation
      characterURL={file} // Must have property
      animationSet={animationSet} // Must have property
    > */}
      {/* ANIMATED CHARACTER Model Group */}
      <group
        ref={group}
        {...props}
        dispose={null}
        // scale={2.0}
        // scale={0.024}
        // position={[0, 0, 0]}
        name='ThreeD_Animated_Character_Chicken'
      >

        {/* CUSTOM ANIMATION 'PUNCH EFFECT' */}
        {/* <SpriteAnimator
          visible={punchEffectProps.visible}
          scale={punchEffectProps.scale as any}
          position={punchEffectProps.position as any}
          startFrame={punchEffectProps.startFrame}
          loop={true}
          onLoopEnd={() => {
            setPunchEffectProp((prev) => ({
              ...prev,
              visible: false,
              play: false,
            }))
          }}
          play={punchEffectProps.play}
          numberOfFrames={7}
          alphaTest={0.01}
          textureImageURL={'/images/animations/punchEffect.png'}
        /> */}

        <group name='RootNode'>
          {/* <skinnedMesh
            name='Hen_HP'
            geometry={nodes.Hen_HP.geometry}
            // material={materials.lambert2}
            // material={nodes.Hen_HP.material}
            material={meshToonMaterial}
            // skeleton={nodes.Hen_HP}
            // skeleton={nodes.skeleton}
            skeleton={nodes.Hen_HP}
            receiveShadow
            castShadow
          /> */}
          {/* <mesh
            name="Hen_HP"
            castShadow
            receiveShadow
            geometry={nodes.Hen_HP.geometry}
            material={nodes.Hen_HP.material}
          /> */}
          <mesh
            name="Hen_HP002"
            castShadow
            receiveShadow
            geometry={nodes.Hen_HP002.geometry}
            material={materials.Material}
            rotation={[Math.PI / 2, 0, 0]}
          />

          { true && 
          <Trail
            width={1.5}
            // color={prefs.characterTrailColor}
            color={'violet'}
            length={3}
            decay={2}
            attenuation={(width) => width}
          >
            {/* <primitive object={nodes.Hen_HP} /> */}
            <primitive object={nodes.Hen_HP002} />
          </Trail>
          }

          {/* <group name='Root'>
            <group name='Pelvis_$AssimpFbx$_Translation' position={[0, 87.628, 0]}>
              <group name='Pelvis_$AssimpFbx$_PreRotation' rotation={[-0.179, 0.022, 0.006]}>
                <group name='Pelvis_$AssimpFbx$_PostRotation' rotation={[0.255, 1.548, 1.345]}>
                  <primitive object={nodes.Pelvis} />
                </group>
              </group>
            </group>
            <group name='ik_foot_root_$AssimpFbx$_PreRotation' rotation={[-Math.PI / 2, 0, 0]}>
              <group name='ik_foot_root'>
                <group
                  name='ik_foot_l'
                  position={[11.444, 3.687, 5.569]}
                  rotation={[0, -1.571, 0]}
                />
                <group
                  name='ik_foot_r'
                  position={[-11.444, 3.687, 5.569]}
                  rotation={[Math.PI, -1.571, 0]}
                />
              </group>
            </group>
            <group name='ik_hand_root_$AssimpFbx$_PreRotation' rotation={[-Math.PI / 2, 0, 0]}>
              <group name='ik_hand_root'>
                <group
                  name='ik_hand_gun'
                  position={[-79.963, 3.417, 136.094]}
                  rotation={[Math.PI / 2, 0, 0]}>
                  <group name='ik_hand_l' position={[159.926, 0, 0]} rotation={[-Math.PI, 0, 0]} />
                  <group name='ik_hand_r' />
                </group>
              </group>
            </group>
          </group> */}

        </group>

      {/* END CharacterModel group */}
      </group>

    {/* </EcctrlAnimation> */}
    </Suspense>
  )
}

useGLTF.preload(file)
