'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import {
  Environment,
  OrbitControls,
  useAnimations,
  useFBX,
} from '@react-three/drei'

export enum AnimationType {
  Idle = 'idle',
  Walk = 'walk',
  Run = 'run',
  WalkBackwards = 'walkBackwards',

  TurnLeft = 'turnLeft',
  TurnRight = 'turnRight',

  Talk = 'talk',
  Point = 'point',
  PointGesture = 'pointGesture',
  Drive = 'drive',
}

const TEST_ANIMATIONS: AnimationType[] = [
  AnimationType.Idle,
  AnimationType.Walk,
  AnimationType.Run,
  AnimationType.WalkBackwards,

  AnimationType.TurnLeft,
  AnimationType.TurnRight,

  AnimationType.Talk,
  AnimationType.Point,
  AnimationType.PointGesture,
  AnimationType.Drive,
]

const MODEL_FILE =
  '/assets/characters/SK_Chr_Farmer_Female_01.fbx'

const ANIMATION_FILES: Record<AnimationType, string> = {
  [AnimationType.Idle]:
    '/assets/animations/Idle.fbx',

  [AnimationType.Walk]:
    '/assets/animations/Walking.fbx',

  [AnimationType.Run]:
    '/assets/animations/Running.fbx',

  [AnimationType.WalkBackwards]:
    '/assets/animations/Walking Backwards.fbx',

  [AnimationType.TurnLeft]:
    '/assets/animations/Left Turn.fbx',

  [AnimationType.TurnRight]:
    '/assets/animations/Right Turn.fbx',

  [AnimationType.Talk]:
    '/assets/animations/Talking.fbx',

  [AnimationType.Point]:
    '/assets/animations/Pointing.fbx',

  [AnimationType.PointGesture]:
    '/assets/animations/Pointing Gesture.fbx',

  [AnimationType.Drive]:
    '/assets/animations/Driving.fbx',
}

type AnimationSource = {
  type: AnimationType
  source: THREE.Group
}

function Farmer({
  animation,
}: {
  animation: AnimationType
}) {
  const farmer = useFBX(MODEL_FILE)

  const idleFBX = useFBX(
    ANIMATION_FILES[AnimationType.Idle]
  )

  const walkFBX = useFBX(
    ANIMATION_FILES[AnimationType.Walk]
  )

  const runFBX = useFBX(
    ANIMATION_FILES[AnimationType.Run]
  )

  const walkBackwardsFBX = useFBX(
    ANIMATION_FILES[AnimationType.WalkBackwards]
  )

  const turnLeftFBX = useFBX(
    ANIMATION_FILES[AnimationType.TurnLeft]
  )

  const turnRightFBX = useFBX(
    ANIMATION_FILES[AnimationType.TurnRight]
  )

  const talkFBX = useFBX(
    ANIMATION_FILES[AnimationType.Talk]
  )

  const pointFBX = useFBX(
    ANIMATION_FILES[AnimationType.Point]
  )

  const pointGestureFBX = useFBX(
    ANIMATION_FILES[AnimationType.PointGesture]
  )

  const driveFBX = useFBX(
    ANIMATION_FILES[AnimationType.Drive]
  )

  const sources = useMemo<AnimationSource[]>(
    () => [
      {
        type: AnimationType.Idle,
        source: idleFBX,
      },
      {
        type: AnimationType.Walk,
        source: walkFBX,
      },
      {
        type: AnimationType.Run,
        source: runFBX,
      },
      {
        type: AnimationType.WalkBackwards,
        source: walkBackwardsFBX,
      },
      {
        type: AnimationType.TurnLeft,
        source: turnLeftFBX,
      },
      {
        type: AnimationType.TurnRight,
        source: turnRightFBX,
      },
      {
        type: AnimationType.Talk,
        source: talkFBX,
      },
      {
        type: AnimationType.Point,
        source: pointFBX,
      },
      {
        type: AnimationType.PointGesture,
        source: pointGestureFBX,
      },
      {
        type: AnimationType.Drive,
        source: driveFBX,
      },
    ],
    [
      idleFBX,
      walkFBX,
      runFBX,
      walkBackwardsFBX,
      turnLeftFBX,
      turnRightFBX,
      talkFBX,
      pointFBX,
      pointGestureFBX,
      driveFBX,
    ]
  )

  const clips = useMemo(() => {
    return sources
      .map(({ type, source }) => {
        const sourceClip =
          source.animations[0]

        if (!sourceClip) {
          console.warn(
            `[Animation Test] No clip found for "${type}"`
          )

          return null
        }

        const clip =
          sourceClip.clone()

        /**
         * Normalize the FBX clip name.
         *
         * Whatever the FBX internally calls the clip,
         * our application knows it as:
         *
         * idle
         * walk
         * run
         * turnLeft
         * etc.
         */
        clip.name = type

        return clip
      })
      .filter(
        (
          clip
        ): clip is THREE.AnimationClip =>
          clip !== null
      )
  }, [sources])

  const {
    actions,
    names,
  } = useAnimations(
    clips,
    farmer
  )

  /**
   * Diagnostic output.
   */
  useEffect(() => {
    console.group(
      '🌾 Farmer Animation Test'
    )

    console.log(
      'Model:',
      MODEL_FILE
    )

    console.log(
      'Available action names:',
      names
    )

    console.group(
      'Animation Clips'
    )

    clips.forEach((clip) => {
      console.log({
        name:
          clip.name,

        duration:
          clip.duration,

        trackCount:
          clip.tracks.length,
      })

      console.log(
        `${clip.name} tracks:`,
        clip.tracks.map(
          (track) =>
            track.name
        )
      )
    })

    console.groupEnd()

    console.group(
      'Farmer Bones'
    )

    farmer.traverse(
      (object) => {
        if (
          (
            object as THREE.Bone
          ).isBone
        ) {
          console.log(
            object.name
          )
        }
      }
    )

    console.groupEnd()
    console.groupEnd()
  }, [
    farmer,
    clips,
    names,
  ])

  /**
   * Play the selected action.
   */
  useEffect(() => {
    const action =
      actions[animation]

    console.log(
      `[Animation Test] Requested: ${animation}`
    )

    if (!action) {
      console.warn(
        `[Animation Test] Action "${animation}" not found.`
      )

      return
    }

    /**
     * Fade out every other action.
     */
    Object.entries(
      actions
    ).forEach(
      ([
        name,
        otherAction,
      ]) => {
        if (
          otherAction &&
          name !== animation
        ) {
          otherAction.fadeOut(
            0.2
          )
        }
      }
    )

    /**
     * Play selected action.
     */
    action
      .reset()
      .fadeIn(0.2)
      .play()

    console.log(
      `[Animation Test] Playing: ${animation}`
    )

    return () => {
      action.fadeOut(0.2)
    }
  }, [
    animation,
    actions,
  ])

  return (
    <primitive
      object={farmer}
      scale={0.01}
    />
  )
}

function Loading() {
  return null
}

export default function TestPage() {
  const [
    animation,
    setAnimation,
  ] =
    useState<AnimationType>(
      AnimationType.Idle
    )

  return (
    <main
      style={{
        width: '100vw',
        height: '100vh',
        position:
          'relative',
        overflow:
          'hidden',
        background:
          '#202020',
      }}
    >
      <div
        style={{
          position:
            'absolute',

          top: 20,
          left: 20,

          zIndex: 10,

          width: 460,

          display:
            'flex',

          flexDirection:
            'column',

          gap: 10,

          padding: 16,

          background:
            'rgba(0, 0, 0, 0.72)',

          borderRadius: 8,

          color:
            'white',

          fontFamily:
            'sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight:
              'bold',
          }}
        >
          Farmer Animation Test
        </div>

        <div
          style={{
            fontSize: 13,
            opacity: 0.75,
          }}
        >
          Current:{' '}
          <strong>
            {animation}
          </strong>
        </div>

        <div
          style={{
            display:
              'flex',

            gap: 8,

            flexWrap:
              'wrap',
          }}
        >
          {TEST_ANIMATIONS.map(
            (name) => {
              const active =
                animation ===
                name

              return (
                <button
                  key={
                    name
                  }
                  type="button"
                  onClick={() =>
                    setAnimation(
                      name
                    )
                  }
                  style={{
                    padding:
                      '8px 14px',

                    border:
                      active
                        ? '2px solid white'
                        : '1px solid #777',

                    borderRadius: 5,

                    background:
                      active
                        ? '#555'
                        : '#333',

                    color:
                      'white',

                    cursor:
                      'pointer',

                    fontWeight:
                      active
                        ? 'bold'
                        : 'normal',
                  }}
                >
                  {name}
                </button>
              )
            }
          )}
        </div>

        <div
          style={{
            marginTop: 4,
            fontSize: 12,
            lineHeight: 1.5,
            opacity: 0.6,
          }}
        >
          Core:
          idle, walk,
          run,
          walkBackwards,
          turnLeft,
          turnRight
          <br />
          Actions:
          talk, point,
          pointGesture,
          drive
        </div>
      </div>

      <Canvas
        camera={{
          position:
            [3, 2, 5],

          fov: 45,

          near: 0.1,

          far: 1000,
        }}
      >
        <Suspense
          fallback={
            <Loading />
          }
        >
          <ambientLight
            intensity={
              1.5
            }
          />

          <directionalLight
            position={[
              5,
              10,
              5,
            ]}
            intensity={
              2
            }
          />

          <Farmer
            animation={
              animation
            }
          />

          <gridHelper
            args={[
              10,
              10,
            ]}
          />

          <OrbitControls
            makeDefault
            target={[
              0,
              1,
              0,
            ]}
          />

          <Environment
            preset="city"
          />
        </Suspense>
      </Canvas>
    </main>
  )
}

/**
 * Preload the model.
 */
useFBX.preload(
  MODEL_FILE
)

/**
 * Preload every animation FBX.
 */
Object.values(
  ANIMATION_FILES
).forEach(
  (file) => {
    useFBX.preload(
      file
    )
  }
)