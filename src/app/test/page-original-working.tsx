'use client'

import { useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import {
  OrbitControls,
  useAnimations,
  useFBX,
} from '@react-three/drei'

export enum AnimationType {
  Idle = 'idle',
  Walk = 'walk',
  Run = 'run',
  Jump = 'jump',
  Turn = 'turn',
}

const TEST_ANIMATIONS = [
  AnimationType.Idle,
  AnimationType.Walk,
  AnimationType.Run,
] as const

function Farmer({
  animation,
}: {
  animation: AnimationType
}) {
  // Character model
  const farmer = useFBX(
    '/assets/characters/SK_Chr_Farmer_Female_01.fbx'
  )

  // Individual animation FBXs
  const idleFBX = useFBX('/assets/animations/Idle.fbx')
  const walkFBX = useFBX('/assets/animations/Walking.fbx')
  const runFBX = useFBX('/assets/animations/Running.fbx')

  /*
   * Clone the source clips and normalize their names to the
   * animation names used by our application.
   */
  const clips = useMemo(() => {
    const idle = idleFBX.animations[0]?.clone()
    const walk = walkFBX.animations[0]?.clone()
    const run = runFBX.animations[0]?.clone()

    if (idle) idle.name = AnimationType.Idle
    if (walk) walk.name = AnimationType.Walk
    if (run) run.name = AnimationType.Run

    return [idle, walk, run].filter(
      (clip): clip is THREE.AnimationClip => Boolean(clip)
    )
  }, [idleFBX, walkFBX, runFBX])

  /*
   * Drei creates and updates the AnimationMixer for us.
   */
  const { actions, names } = useAnimations(clips, farmer)

  /*
   * Diagnostic output.
   */
  useEffect(() => {
    console.log('==============================')
    console.log('R3F FARMER ANIMATION TEST')
    console.log('Available animations:', names)

    clips.forEach((clip) => {
      console.log({
        name: clip.name,
        duration: clip.duration,
        tracks: clip.tracks.length,
      })

      console.log(
        'Tracks:',
        clip.tracks.map((track) => track.name)
      )
    })

    console.log('--- Farmer Bones ---')

    farmer.traverse((object) => {
      if (object.type === 'Bone') {
        console.log(object.name)
      }
    })

    console.log('==============================')
  }, [farmer, clips, names])

  /*
   * Play the currently selected animation.
   */
  useEffect(() => {
    const action = actions[animation]

    if (!action) {
      console.warn(`Animation not available: ${animation}`)
      return
    }

    // Stop previous animations.
    Object.values(actions).forEach((otherAction) => {
      otherAction?.stop()
    })

    console.log(`Playing animation: ${animation}`)

    action.reset().fadeIn(0.2).play()

    return () => {
      action.fadeOut(0.2)
    }
  }, [animation, actions])

  return (
    <primitive
      object={farmer}
      scale={0.01}
    />
  )
}

export default function TestPage() {
  const [animation, setAnimation] =
    useState<AnimationType>(AnimationType.Idle)

  return (
    <main
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        background: '#202020',
      }}
    >
      {/* Simple animation selector */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 10,
          display: 'flex',
          gap: 8,
        }}
      >
        {TEST_ANIMATIONS.map((name) => (
          <button
            key={name}
            onClick={() => setAnimation(name)}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              fontWeight:
                animation === name ? 'bold' : 'normal',
            }}
          >
            {name}
          </button>
        ))}
      </div>

      <Canvas
        camera={{
          position: [3, 2, 5],
          fov: 45,
        }}
      >
        <ambientLight intensity={1.5} />

        <directionalLight
          position={[5, 10, 5]}
          intensity={2}
        />

        <Farmer animation={animation} />

        <gridHelper args={[10, 10]} />

        <OrbitControls
          target={[0, 1, 0]}
          makeDefault
        />
      </Canvas>
    </main>
  )
}