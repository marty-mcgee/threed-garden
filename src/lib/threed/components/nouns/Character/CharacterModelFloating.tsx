// 'use client'
// ==========================================================
// RESOURCES

import {
  useAnimations,
  useGLTF,
  useTexture,
  Trail,
  SpriteAnimator,
} from '@react-three/drei'
import { useControls } from 'leva'
import { Suspense, useEffect, useRef, useMemo, useState } from 'react'
import * as THREE from 'three'
import { useGame, type AnimationSet } from '#/lib/ecctrl/src/stores/useGame'
import { BallCollider, RapierCollider, vec3 } from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader'

const theCharacterModelFile = '/assets/examples/CharacterModelFloating.glb'
const texture = '/textures/3.jpg'

export type CharacterModelProps = any

export default function CharacterModel(props: CharacterModelProps) {
  const group = useRef<THREE.Group>(null)
  // @ts-expect-error: ignore a compile error, like this type mismatch
  const { nodes, animations } = useGLTF(theCharacterModelFile) as GLTF & {
    nodes: any
  }
  const { actions } = useAnimations(animations, group)
  
  // gradientMapTexture for MeshToonMaterial
  const gradientMapTexture = useTexture(texture) // '/textures/3.jpg'
  gradientMapTexture.minFilter = THREE.NearestFilter
  gradientMapTexture.magFilter = THREE.NearestFilter
  gradientMapTexture.generateMipmaps = false

  /**
   * Prepare hands ref for attack action
   */
  const rightHandRef = useRef<THREE.Mesh>(null)
  const rightHandColliderRef = useRef<RapierCollider>(null)
  const leftHandRef = useRef<THREE.Mesh>(null)
  const leftHandColliderRef = useRef<RapierCollider>(null)
  const rightHandPos = useMemo(() => new THREE.Vector3(), [])
  const leftHandPos = useMemo(() => new THREE.Vector3(), [])
  const bodyPos = useMemo(() => new THREE.Vector3(), [])
  const bodyRot = useMemo(() => new THREE.Quaternion(), [])
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
  let characterPrefs = {
    mainColor: 'mediumslateblue',
    outlineColor: 'black',
    trailColor: 'violet',
  }
  // const [{
  //   mainColor,
  //   outlineColor,
  //   trailColor,
  // }, setCharacterPreferencesLeva] = useControls(
  //   'Character Preferences',
  //   () => ({
  //     // characterMainColor
  //     mainColor: {
  //       label: 'Main Color',
  //       value: 'mediumslateblue', // prefs.characterMainColor,
  //     },
  //     // characterOutlineColor
  //     outlineColor: {
  //       label: 'Outline Color',
  //       value: 'black', // prefs.characterOutlineColor,
  //     },
  //     // characterTrailColor
  //     trailColor: {
  //       label: 'Trail Color',
  //       value: 'violet', // prefs.characterTrailColor,
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
  const meshToonMaterial = useMemo(
    () =>
      new THREE.MeshToonMaterial({
        color: 'mediumslateblue', // mainColor,
        gradientMap: gradientMapTexture,
        transparent: true,
      }),
    [characterPrefs.mainColor]
  )
  const outlineMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 'black', // outlineColor,
        transparent: true,
      }),
    [characterPrefs.outlineColor]
  )
  const trailMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 'violet', // trailColor,
        transparent: true,
      }),
    [characterPrefs.trailColor]
  )

  /**
   * Character animations setup
   */
  const curAnimation = useGame((state) => state.curAnimation)
  const resetAnimation = useGame((state) => state.reset)
  const initializeAnimationSet = useGame(
    (state) => state.initializeAnimationSet
  )

  // Rename your character animations here
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
    if (curAnimation === animationSet.action4) {
      if (rightHand) {
        rightHand.getWorldPosition(rightHandPos)
        group.current.getWorldPosition(bodyPos)
        group.current.getWorldQuaternion(bodyRot)
      }

      // Apply hands position to hand colliders
      if (rightHandColliderRef.current) {
        // check if parent group autobalance is on or off
        if (group.current.parent.quaternion.y === 0 && group.current.parent.quaternion.w === 1) {
          rightHandRef.current.position.copy(rightHandPos).sub(bodyPos).applyQuaternion(bodyRot.conjugate())
        } else {
          rightHandRef.current.position.copy(rightHandPos).sub(bodyPos)
        }
        rightHandColliderRef.current.setTranslationWrtParent(
          rightHandRef.current.position
        )
      }
    }
  })

  useEffect(() => {
    // Play animation
    const action = actions[curAnimation ? curAnimation : animationSet.jumpIdle]

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
        .setLoop(THREE.LoopOnce, undefined as number)
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

    // When any action is clamp and finished reset animation
    (action as any)._mixer.addEventListener('finished', () => resetAnimation())

    return () => {
      try {
        // Fade out previous action
        // action.fadeOut(0.2)

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
      }
    }
  }, [curAnimation])

  return (
    <Suspense fallback={<capsuleGeometry args={[0.3, 0.7]} />}>

      {/* Default capsule model */}
      {/* <mesh castShadow>
        <capsuleGeometry args={[0.3, 0.7]} />
        <meshStandardMaterial color='mediumpurple' />
      </mesh>
      <mesh castShadow position={[0, 0.2, 0.2]}>
        <boxGeometry args={[0.5, 0.2, 0.3]} />
        <meshStandardMaterial color='mediumpurple' />
      </mesh> */}

      {/* Replace your model here */}

      {/* Head collider */}
      <BallCollider args={[0.5]} position={[0, 0.80, 0]} />

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
      <BallCollider args={[0.1]} ref={leftHandColliderRef} />


      {/* Character model */}
      <group
        ref={group}
        {...props}
        dispose={null}
        // scale={1.0}
        // scale={0.016}
        // position={[0, 10, 0]}
      >
        <group name='Scene' scale={0.8} position={[0, -0.48, 0]}>
          <group name='KayKit_Animated_Character'>
            <skinnedMesh
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
            />
            <Trail
              width={1.5}
              color={characterPrefs.trailColor}
              length={3}
              decay={2}
              attenuation={(width) => width}
            >
              <primitive object={nodes.Body} />
            </Trail>
          </group>
        </group>
        <SpriteAnimator
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
        />
      </group>
    </Suspense>
  )
}

useGLTF.preload(theCharacterModelFile)
