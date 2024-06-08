// @ts-nocheck /* OR @ ts-ignore OR @ ts-expect-error */
// 'use client'
// ==========================================================
// RESOURCES

// ** APOLLO Imports (NOT HERE?, preferably)
// import { useReactiveVar } from '@apollo/client'
// import { preferencesDataVar } from '#/lib/stores/apollo'

// ** REACT Imports
import {
  Suspense,
  useEffect,
  useRef,
  useMemo,
  useState,
  // (instances of):
  // // useMemo,
  // useContext,
  // createContext,
} from 'react'

// ** THREE Imports
import * as THREE from 'three'

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

// ** TYPES Imports
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader'

// ** ECCRTL ZUSTAND STATE
import { useGame } from '#/lib/ecctrl/src/hooks/useGame'

// ** GLTF to JSX
// import * as THREE from 'three'
// import React, { useRef } from 'react'
// import { useGLTF, useAnimations } from '@react-three/drei'
import { GLTF } from 'three-stdlib'

// ** HELPER Imports
// import { Perf } from 'r3f-perf'
// import Spinner from '#/layout/ui/components/spinner'
// ** HELPFUL UTIL: COLORFUL CONSOLE MESSAGES (ccm)
import ccm from '#/lib/utils/console-colors'


const debug: boolean = true
const debugAnimation: boolean = false

// ** FILES for CharacterModel: Settings/Locations
// const theCharacterModelFile = '/objects/glb/CharacterModelFloating.glb'
const file = 'https://threedpublic.s3.us-west-2.amazonaws.com/assets/threeds/synty/polygon/farm/Characters/SK_Chr_Farmer_Female_01.glb'
// const texture = 'https://threedpublic.s3.us-west-2.amazonaws.com/assets/threeds/synty/polygon/_Textures/PolygonFarm_Texture_01_A.png'
const texture = 'https://threedpublic.s3.us-west-2.amazonaws.com/assets/threeds/synty/polygon/_Textures/PolygonFarm_Texture_01_B.png'


// ** TYPES for this GLTF
// **
type GLTFResult = GLTF & {
  nodes: {
    SK_Chr_Farmer_Female_01: THREE.SkinnedMesh
    Pelvis: THREE.Bone
    spine_01: THREE.Bone
    spine_02: THREE.Bone
    spine_03: THREE.Bone
    neck_01: THREE.Bone
    head: THREE.Bone
    clavicle_l: THREE.Bone
    UpperArm_L: THREE.Bone
    lowerarm_l: THREE.Bone
    Hand_L: THREE.Bone
    thumb_01_l: THREE.Bone
    thumb_02_l: THREE.Bone
    thumb_03_l: THREE.Bone
    indexFinger_01_l: THREE.Bone
    indexFinger_02_l: THREE.Bone
    indexFinger_03_l: THREE.Bone
    indexFinger_04_l: THREE.Bone
    finger_01_l: THREE.Bone
    finger_02_l: THREE.Bone
    finger_03_l: THREE.Bone
    finger_04_l: THREE.Bone
    clavicle_r: THREE.Bone
    UpperArm_R: THREE.Bone
    lowerarm_r: THREE.Bone
    Hand_R: THREE.Bone
    thumb_01_r: THREE.Bone
    thumb_02_r: THREE.Bone
    thumb_03_r: THREE.Bone
    indexFinger_01_r: THREE.Bone
    indexFinger_02_r: THREE.Bone
    indexFinger_03_r: THREE.Bone
    indexFinger_04_r: THREE.Bone
    finger_01_r: THREE.Bone
    finger_02_r: THREE.Bone
    finger_03_r: THREE.Bone
    finger_04_r: THREE.Bone
    Thigh_R: THREE.Bone
    calf_r: THREE.Bone
    Foot_R: THREE.Bone
    ball_r: THREE.Bone
    toes_r: THREE.Bone
    Thigh_L: THREE.Bone
    calf_l: THREE.Bone
    Foot_L: THREE.Bone
    ball_l: THREE.Bone
    toes_l: THREE.Bone
  }
  materials: {
    lambert2: THREE.MeshStandardMaterial
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
//       SKChrFarmer: nodes.SK_Chr_Farmer_Female_01,
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
type CharacterModelProps = JSX.IntrinsicElements['group']

// export default function Model(props: JSX.IntrinsicElements['group']) {
export default function CharacterModel(props: CharacterModelProps) {

  // ** GET THREED PREFERENCES FROM APOLLO CLIENT STORE:STATE
  // const prefs = useReactiveVar(preferencesDataVar)
  // console.debug(`%c EXPERIENCE: APOLLO prefs`, ccm.orangeAlert, prefs)
  const prefs = {
    doCharacterAnimation: false,
    characterMainColor: 'mediumslateblue',
    characterOutlineColor: 'black',
    characterTrailColor: 'violet',
  }
  // console.debug(`%c CHARACTER MODEL: prefs`, ccm.redAlert, prefs)

  // const instances = useContext(context)

  const group = useRef<THREE.Group>()

  // @ts-expect-error: ignore a compile error, like this type mismatch
  // const { nodes, animations } = useGLTF(theCharacterModelFile) as GLTF & {
  //   nodes: any
  // }
  const { nodes, materials, animations } = useGLTF(file) as GLTF & {
    nodes: any
  }
  // console.debug(`%c nodes`, ccm.yellowAlert, nodes)

  // const { actions } = useAnimations(animations, group)
  const { actions } = useAnimations<GLTFActions>(animations, group)

  // gradientMapTexture for MeshToonMaterial
  const gradientMapTexture = useTexture(texture) // '/textures/3.jpg'
  gradientMapTexture.minFilter = THREE.NearestFilter
  gradientMapTexture.magFilter = THREE.NearestFilter
  gradientMapTexture.generateMipmaps = false

  /**
   * Prepare Hands+Body Refs+Memos for actions[action4]
   */
  const rightHandRef = useRef<THREE.Mesh>()
  const rightHandColliderRef = useRef<RapierCollider>()
  const leftHandRef = useRef<THREE.Mesh>()
  const leftHandColliderRef = useRef<RapierCollider>()
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
  const [{
    characterMainColor,
    characterOutlineColor,
    characterTrailColor,
  }, setCharacterPreferencesLeva] = useControls(
    'Character Preferences',
    () => ({
      doCharacterAnimation: {
        label: 'Animate Character?',
        value: prefs.doCharacterAnimation,
      },
      characterMainColor: {
        label: 'Main Color',
        value: prefs.characterMainColor,
      },
      characterOutlineColor: {
        label: 'Outline Color',
        value: prefs.characterOutlineColor,
      },
      characterTrailColor: {
        label: 'Trail Color',
        value: prefs.characterTrailColor,
      },
    }),
    {
      color: 'darkgreen',
      collapsed: false,
      order: 10,
    },
  )

  /**
   * Prepare replacing materials
   */
  const outlineMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: characterOutlineColor,
        transparent: true,
      }),
    [characterOutlineColor]
  )
  const meshToonMaterial = useMemo(
    () =>
      new THREE.MeshToonMaterial({
        color: characterMainColor,
        gradientMap: gradientMapTexture,
        transparent: true,
      }),
    [characterMainColor]
  )

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
  const animationSet = {
    idle: 'Idle',
    walk: 'Walk',
    run: 'Run',
    jump: 'Jump_Start',
    jumpIdle: 'Jump_Idle',
    jumpLand: 'Jump_Land',
    fall: 'Climbing', // This is for falling from high sky
    action1: 'Wave',
    action2: 'Dance',
    action3: 'Cheer',
    action4: 'Attack(1h)',
  }
  // console.debug('animationSet', animationSet)

  useEffect(() => {
    // Initialize animation set
    initializeAnimationSet(animationSet)
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
    const wordX: string = group.current.getWorldPosition(bodyPosition).x
    const wordY: string = group.current.getWorldPosition(bodyPosition).y
    const wordZ: string = group.current.getWorldPosition(bodyPosition).z
    if (debugAnimation) {
      // console.debug(`%c FarmerWomanFloating: useFrame :(`, ccm.redAlert, word)
      if (debug) console.debug(`%c FarmerWomanFloating: useFrame :(`, ccm.darkredAlert, wordX, wordY, wordZ)
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
    const action = actions[curAnimation ? curAnimation : animationSet.jumpIdle]

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
      if (debug) console.debug(`%c FarmerWomanFloating: no action :|`, ccm.darkgrayAlert, word)
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
    // <Suspense fallback={<capsuleGeometry args={[0.4, 0.8]} />}>
    <Suspense fallback={null}>

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
      <BallCollider args={[0.5]} position={[0, 10.45, 0]} />

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

      {/* ANIMATED CHARACTER Model Group */}
      <group
        ref={group}
        {...props}
        // dispose={null}
        // scale={1.0}
        scale={0.016}
        position={[0, 10, 0]}
        name='ThreeD_Animated_Character'
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
          textureImageURL={'./punchEffect.png'}
        /> */}

        <group name='RootNode'>
          {/* <skinnedMesh
            name='outline'
            geometry={nodes.outline.geometry}
            material={outlineMaterial}
            skeleton={nodes.outline.skeleton}
          />
          <skinnedMesh
            name='PrototypePete'
            geometry={nodes.PrototypePete.geometry}
            material={meshToonMaterial}
            skeleton={nodes.PrototypePete.skeleton}
            receiveShadow
            castShadow
          /> */}
          <skinnedMesh
            name='SK_Chr_Farmer_Female_01'
            geometry={nodes.SK_Chr_Farmer_Female_01.geometry}
            material={materials.lambert2}
            skeleton={nodes.SK_Chr_Farmer_Female_01.skeleton}
            receiveShadow
            castShadow
          />
          {/* <skinnedMesh
            name='SK_Chr_Farmer_Female_01'
            geometry={nodes.SK_Chr_Farmer_Female_01.geometry}
            material={materials.lambert2}
            skeleton={nodes.SK_Chr_Farmer_Female_01.skeleton}
            receiveShadow
            castShadow
          /> */}

          <Trail
            width={1.5}
            color={characterTrailColor}
            length={3}
            decay={2}
            attenuation={(width) => width}
          >
            <primitive object={nodes.Root} />
          </Trail>

          <group name='Root'>
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
          </group>

        </group>

      {/* END CharacterModel group */}
      </group>
    </Suspense>
  )
}

useGLTF.preload(file)
