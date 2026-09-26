'use client'

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from 'react'

import * as THREE from 'three'

import { Canvas } from '@react-three/fiber'

import {
  Environment,
  OrbitControls,
  useAnimations,
  useFBX,
} from '@react-three/drei'

/**
 * -------------------------------------------------------
 * Animation Types
 * -------------------------------------------------------
 *
 * These are APP identifiers.
 *
 * The FBX source filenames are allowed to be messy.
 * Our application names stay predictable.
 */
export enum AnimationType {
  // -----------------------------------------------------
  // Core locomotion
  // -----------------------------------------------------

  Idle = 'idle',
  Walk = 'walk',
  Run = 'run',
  WalkBackwards = 'walkBackwards',

  TurnLeft = 'turnLeft',
  TurnRight = 'turnRight',

  // -----------------------------------------------------
  // General character actions
  // -----------------------------------------------------

  Talk = 'talk',
  Point = 'point',
  PointGesture = 'pointGesture',
  Drive = 'drive',

  // -----------------------------------------------------
  // Holding
  // -----------------------------------------------------

  HoldingIdle = 'holdingIdle',
  HoldingWalk = 'holdingWalk',
  HoldingTurnLeft = 'holdingTurnLeft',
  HoldingTurnRight = 'holdingTurnRight',

  // -----------------------------------------------------
  // Box
  // -----------------------------------------------------

  BoxIdle = 'boxIdle',
  BoxTurn = 'boxTurn',
  BoxTurn2 = 'boxTurn2',
  BoxWalkArc = 'boxWalkArc',

  // -----------------------------------------------------
  // Farming
  // -----------------------------------------------------

  KneelingIdle = 'kneelingIdle',

  Watering = 'watering',

  DigAndPlantSeeds = 'digAndPlantSeeds',

  PlantAPlant = 'plantAPlant',
  PlantTree = 'plantTree',

  PullPlant = 'pullPlant',
  PullPlant2 = 'pullPlant2',

  PickFruit = 'pickFruit',
  PickFruit2 = 'pickFruit2',
  PickFruit3 = 'pickFruit3',

  CowMilking = 'cowMilking',

  // -----------------------------------------------------
  // Wheelbarrow
  // -----------------------------------------------------

  WheelbarrowIdle = 'wheelbarrowIdle',

  WheelbarrowWalk = 'wheelbarrowWalk',
  WheelbarrowWalk2 = 'wheelbarrowWalk2',

  WheelbarrowWalkTurn = 'wheelbarrowWalkTurn',
  WheelbarrowWalkTurn2 = 'wheelbarrowWalkTurn2',

  WheelbarrowDump = 'wheelbarrowDump',
}

/**
 * -------------------------------------------------------
 * Animation Groups
 * -------------------------------------------------------
 *
 * Only used to organize the test UI.
 */
const ANIMATION_GROUPS: {
  title: string
  animations: AnimationType[]
}[] = [
  {
    title: 'Core',
    animations: [
      AnimationType.Idle,
      AnimationType.Walk,
      AnimationType.Run,
      AnimationType.WalkBackwards,
      AnimationType.TurnLeft,
      AnimationType.TurnRight,
    ],
  },

  {
    title: 'General',
    animations: [
      AnimationType.Talk,
      AnimationType.Point,
      AnimationType.PointGesture,
      AnimationType.Drive,
    ],
  },

  {
    title: 'Holding',
    animations: [
      AnimationType.HoldingIdle,
      AnimationType.HoldingWalk,
      AnimationType.HoldingTurnLeft,
      AnimationType.HoldingTurnRight,
    ],
  },

  {
    title: 'Box',
    animations: [
      AnimationType.BoxIdle,
      AnimationType.BoxTurn,
      AnimationType.BoxTurn2,
      AnimationType.BoxWalkArc,
    ],
  },

  {
    title: 'Farming',
    animations: [
      AnimationType.KneelingIdle,

      AnimationType.Watering,

      AnimationType.DigAndPlantSeeds,

      AnimationType.PlantAPlant,
      AnimationType.PlantTree,

      AnimationType.PullPlant,
      AnimationType.PullPlant2,

      AnimationType.PickFruit,
      AnimationType.PickFruit2,
      AnimationType.PickFruit3,

      AnimationType.CowMilking,
    ],
  },

  {
    title: 'Wheelbarrow',
    animations: [
      AnimationType.WheelbarrowIdle,

      AnimationType.WheelbarrowWalk,
      AnimationType.WheelbarrowWalk2,

      AnimationType.WheelbarrowWalkTurn,
      AnimationType.WheelbarrowWalkTurn2,

      AnimationType.WheelbarrowDump,
    ],
  },
]

/**
 * -------------------------------------------------------
 * Model
 * -------------------------------------------------------
 */

const MODEL_FILE =
  '/assets/characters/SK_Chr_Farmer_Female_01.fbx'

/**
 * -------------------------------------------------------
 * Animation Source Files
 * -------------------------------------------------------
 *
 * IMPORTANT:
 *
 * Your public folder should preserve the farming
 * subdirectory:
 *
 * public/assets/animations/farming/...
 */
const ANIMATION_FILES: Record<AnimationType, string> = {
  // -----------------------------------------------------
  // Core
  // -----------------------------------------------------

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

  // -----------------------------------------------------
  // General
  // -----------------------------------------------------

  [AnimationType.Talk]:
    '/assets/animations/Talking.fbx',

  [AnimationType.Point]:
    '/assets/animations/Pointing.fbx',

  [AnimationType.PointGesture]:
    '/assets/animations/Pointing Gesture.fbx',

  [AnimationType.Drive]:
    '/assets/animations/Driving.fbx',

  // -----------------------------------------------------
  // Holding
  // -----------------------------------------------------

  [AnimationType.HoldingIdle]:
    '/assets/animations/farming/holding idle.fbx',

  [AnimationType.HoldingWalk]:
    '/assets/animations/farming/holding walk.fbx',

  [AnimationType.HoldingTurnLeft]:
    '/assets/animations/farming/holding turn left.fbx',

  [AnimationType.HoldingTurnRight]:
    '/assets/animations/farming/holding turn right.fbx',

  // -----------------------------------------------------
  // Box
  // -----------------------------------------------------

  [AnimationType.BoxIdle]:
    '/assets/animations/farming/box idle.fbx',

  [AnimationType.BoxTurn]:
    '/assets/animations/farming/box turn.fbx',

  [AnimationType.BoxTurn2]:
    '/assets/animations/farming/box turn (2).fbx',

  [AnimationType.BoxWalkArc]:
    '/assets/animations/farming/box walk arc.fbx',

  // -----------------------------------------------------
  // Farming
  // -----------------------------------------------------

  [AnimationType.KneelingIdle]:
    '/assets/animations/farming/kneeling idle.fbx',

  [AnimationType.Watering]:
    '/assets/animations/farming/watering.fbx',

  [AnimationType.DigAndPlantSeeds]:
    '/assets/animations/farming/dig and plant seeds.fbx',

  [AnimationType.PlantAPlant]:
    '/assets/animations/farming/plant a plant.fbx',

  [AnimationType.PlantTree]:
    '/assets/animations/farming/plant tree.fbx',

  [AnimationType.PullPlant]:
    '/assets/animations/farming/pull plant.fbx',

  [AnimationType.PullPlant2]:
    '/assets/animations/farming/pull plant (2).fbx',

  [AnimationType.PickFruit]:
    '/assets/animations/farming/pick fruit.fbx',

  [AnimationType.PickFruit2]:
    '/assets/animations/farming/pick fruit (2).fbx',

  [AnimationType.PickFruit3]:
    '/assets/animations/farming/pick fruit (3).fbx',

  [AnimationType.CowMilking]:
    '/assets/animations/farming/cow milking.fbx',

  // -----------------------------------------------------
  // Wheelbarrow
  // -----------------------------------------------------

  [AnimationType.WheelbarrowIdle]:
    '/assets/animations/farming/wheelbarrow idle.fbx',

  [AnimationType.WheelbarrowWalk]:
    '/assets/animations/farming/wheelbarrow walk.fbx',

  [AnimationType.WheelbarrowWalk2]:
    '/assets/animations/farming/wheelbarrow walk (2).fbx',

  [AnimationType.WheelbarrowWalkTurn]:
    '/assets/animations/farming/wheelbarrow walk turn.fbx',

  [AnimationType.WheelbarrowWalkTurn2]:
    '/assets/animations/farming/wheelbarrow walk turn (2).fbx',

  [AnimationType.WheelbarrowDump]:
    '/assets/animations/farming/wheelbarrow dump.fbx',
}

/**
 * -------------------------------------------------------
 * Farmer
 * -------------------------------------------------------
 */

function Farmer({
  animation,
}: {
  animation: AnimationType
}) {
  /**
   * Character.
   */
  const farmer = useFBX(MODEL_FILE)

  /**
   * -----------------------------------------------------
   * Core
   * -----------------------------------------------------
   */

  const idleFBX =
    useFBX(ANIMATION_FILES[AnimationType.Idle])

  const walkFBX =
    useFBX(ANIMATION_FILES[AnimationType.Walk])

  const runFBX =
    useFBX(ANIMATION_FILES[AnimationType.Run])

  const walkBackwardsFBX =
    useFBX(
      ANIMATION_FILES[
        AnimationType.WalkBackwards
      ]
    )

  const turnLeftFBX =
    useFBX(
      ANIMATION_FILES[
        AnimationType.TurnLeft
      ]
    )

  const turnRightFBX =
    useFBX(
      ANIMATION_FILES[
        AnimationType.TurnRight
      ]
    )

  /**
   * -----------------------------------------------------
   * General
   * -----------------------------------------------------
   */

  const talkFBX =
    useFBX(ANIMATION_FILES[AnimationType.Talk])

  const pointFBX =
    useFBX(ANIMATION_FILES[AnimationType.Point])

  const pointGestureFBX =
    useFBX(
      ANIMATION_FILES[
        AnimationType.PointGesture
      ]
    )

  const driveFBX =
    useFBX(ANIMATION_FILES[AnimationType.Drive])

  /**
   * -----------------------------------------------------
   * Holding
   * -----------------------------------------------------
   */

  const holdingIdleFBX =
    useFBX(
      ANIMATION_FILES[
        AnimationType.HoldingIdle
      ]
    )

  const holdingWalkFBX =
    useFBX(
      ANIMATION_FILES[
        AnimationType.HoldingWalk
      ]
    )

  const holdingTurnLeftFBX =
    useFBX(
      ANIMATION_FILES[
        AnimationType.HoldingTurnLeft
      ]
    )

  const holdingTurnRightFBX =
    useFBX(
      ANIMATION_FILES[
        AnimationType.HoldingTurnRight
      ]
    )

  /**
   * -----------------------------------------------------
   * Box
   * -----------------------------------------------------
   */

  const boxIdleFBX =
    useFBX(
      ANIMATION_FILES[
        AnimationType.BoxIdle
      ]
    )

  const boxTurnFBX =
    useFBX(
      ANIMATION_FILES[
        AnimationType.BoxTurn
      ]
    )

  const boxTurn2FBX =
    useFBX(
      ANIMATION_FILES[
        AnimationType.BoxTurn2
      ]
    )

  const boxWalkArcFBX =
    useFBX(
      ANIMATION_FILES[
        AnimationType.BoxWalkArc
      ]
    )

  /**
   * -----------------------------------------------------
   * Farming
   * -----------------------------------------------------
   */

  const kneelingIdleFBX =
    useFBX(
      ANIMATION_FILES[
        AnimationType.KneelingIdle
      ]
    )

  const wateringFBX =
    useFBX(
      ANIMATION_FILES[
        AnimationType.Watering
      ]
    )

  const digAndPlantSeedsFBX =
    useFBX(
      ANIMATION_FILES[
        AnimationType.DigAndPlantSeeds
      ]
    )

  const plantAPlantFBX =
    useFBX(
      ANIMATION_FILES[
        AnimationType.PlantAPlant
      ]
    )

  const plantTreeFBX =
    useFBX(
      ANIMATION_FILES[
        AnimationType.PlantTree
      ]
    )

  const pullPlantFBX =
    useFBX(
      ANIMATION_FILES[
        AnimationType.PullPlant
      ]
    )

  const pullPlant2FBX =
    useFBX(
      ANIMATION_FILES[
        AnimationType.PullPlant2
      ]
    )

  const pickFruitFBX =
    useFBX(
      ANIMATION_FILES[
        AnimationType.PickFruit
      ]
    )

  const pickFruit2FBX =
    useFBX(
      ANIMATION_FILES[
        AnimationType.PickFruit2
      ]
    )

  const pickFruit3FBX =
    useFBX(
      ANIMATION_FILES[
        AnimationType.PickFruit3
      ]
    )

  const cowMilkingFBX =
    useFBX(
      ANIMATION_FILES[
        AnimationType.CowMilking
      ]
    )

  /**
   * -----------------------------------------------------
   * Wheelbarrow
   * -----------------------------------------------------
   */

  const wheelbarrowIdleFBX =
    useFBX(
      ANIMATION_FILES[
        AnimationType.WheelbarrowIdle
      ]
    )

  const wheelbarrowWalkFBX =
    useFBX(
      ANIMATION_FILES[
        AnimationType.WheelbarrowWalk
      ]
    )

  const wheelbarrowWalk2FBX =
    useFBX(
      ANIMATION_FILES[
        AnimationType.WheelbarrowWalk2
      ]
    )

  const wheelbarrowWalkTurnFBX =
    useFBX(
      ANIMATION_FILES[
        AnimationType.WheelbarrowWalkTurn
      ]
    )

  const wheelbarrowWalkTurn2FBX =
    useFBX(
      ANIMATION_FILES[
        AnimationType.WheelbarrowWalkTurn2
      ]
    )

  const wheelbarrowDumpFBX =
    useFBX(
      ANIMATION_FILES[
        AnimationType.WheelbarrowDump
      ]
    )

  /**
   * -----------------------------------------------------
   * Build normalized AnimationClips
   * -----------------------------------------------------
   */

  const clips = useMemo(() => {
    const sources: Array<{
      type: AnimationType
      fbx: THREE.Group
    }> = [
      // Core
      {
        type: AnimationType.Idle,
        fbx: idleFBX,
      },
      {
        type: AnimationType.Walk,
        fbx: walkFBX,
      },
      {
        type: AnimationType.Run,
        fbx: runFBX,
      },
      {
        type: AnimationType.WalkBackwards,
        fbx: walkBackwardsFBX,
      },
      {
        type: AnimationType.TurnLeft,
        fbx: turnLeftFBX,
      },
      {
        type: AnimationType.TurnRight,
        fbx: turnRightFBX,
      },

      // General
      {
        type: AnimationType.Talk,
        fbx: talkFBX,
      },
      {
        type: AnimationType.Point,
        fbx: pointFBX,
      },
      {
        type: AnimationType.PointGesture,
        fbx: pointGestureFBX,
      },
      {
        type: AnimationType.Drive,
        fbx: driveFBX,
      },

      // Holding
      {
        type: AnimationType.HoldingIdle,
        fbx: holdingIdleFBX,
      },
      {
        type: AnimationType.HoldingWalk,
        fbx: holdingWalkFBX,
      },
      {
        type: AnimationType.HoldingTurnLeft,
        fbx: holdingTurnLeftFBX,
      },
      {
        type: AnimationType.HoldingTurnRight,
        fbx: holdingTurnRightFBX,
      },

      // Box
      {
        type: AnimationType.BoxIdle,
        fbx: boxIdleFBX,
      },
      {
        type: AnimationType.BoxTurn,
        fbx: boxTurnFBX,
      },
      {
        type: AnimationType.BoxTurn2,
        fbx: boxTurn2FBX,
      },
      {
        type: AnimationType.BoxWalkArc,
        fbx: boxWalkArcFBX,
      },

      // Farming
      {
        type: AnimationType.KneelingIdle,
        fbx: kneelingIdleFBX,
      },
      {
        type: AnimationType.Watering,
        fbx: wateringFBX,
      },
      {
        type: AnimationType.DigAndPlantSeeds,
        fbx: digAndPlantSeedsFBX,
      },
      {
        type: AnimationType.PlantAPlant,
        fbx: plantAPlantFBX,
      },
      {
        type: AnimationType.PlantTree,
        fbx: plantTreeFBX,
      },
      {
        type: AnimationType.PullPlant,
        fbx: pullPlantFBX,
      },
      {
        type: AnimationType.PullPlant2,
        fbx: pullPlant2FBX,
      },
      {
        type: AnimationType.PickFruit,
        fbx: pickFruitFBX,
      },
      {
        type: AnimationType.PickFruit2,
        fbx: pickFruit2FBX,
      },
      {
        type: AnimationType.PickFruit3,
        fbx: pickFruit3FBX,
      },
      {
        type: AnimationType.CowMilking,
        fbx: cowMilkingFBX,
      },

      // Wheelbarrow
      {
        type: AnimationType.WheelbarrowIdle,
        fbx: wheelbarrowIdleFBX,
      },
      {
        type: AnimationType.WheelbarrowWalk,
        fbx: wheelbarrowWalkFBX,
      },
      {
        type: AnimationType.WheelbarrowWalk2,
        fbx: wheelbarrowWalk2FBX,
      },
      {
        type: AnimationType.WheelbarrowWalkTurn,
        fbx: wheelbarrowWalkTurnFBX,
      },
      {
        type: AnimationType.WheelbarrowWalkTurn2,
        fbx: wheelbarrowWalkTurn2FBX,
      },
      {
        type: AnimationType.WheelbarrowDump,
        fbx: wheelbarrowDumpFBX,
      },
    ]

    return sources
      .map(({ type, fbx }) => {
        const sourceClip =
          fbx.animations[0]

        if (!sourceClip) {
          console.warn(
            `[Animation Test] No clip found for "${type}"`
          )

          return null
        }

        const clip =
          sourceClip.clone()

        /**
         * Normalize whatever name exists in the FBX
         * into our app-facing AnimationType.
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
  }, [
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

    holdingIdleFBX,
    holdingWalkFBX,
    holdingTurnLeftFBX,
    holdingTurnRightFBX,

    boxIdleFBX,
    boxTurnFBX,
    boxTurn2FBX,
    boxWalkArcFBX,

    kneelingIdleFBX,
    wateringFBX,
    digAndPlantSeedsFBX,
    plantAPlantFBX,
    plantTreeFBX,
    pullPlantFBX,
    pullPlant2FBX,
    pickFruitFBX,
    pickFruit2FBX,
    pickFruit3FBX,
    cowMilkingFBX,

    wheelbarrowIdleFBX,
    wheelbarrowWalkFBX,
    wheelbarrowWalk2FBX,
    wheelbarrowWalkTurnFBX,
    wheelbarrowWalkTurn2FBX,
    wheelbarrowDumpFBX,
  ])

  /**
   * Drei creates/manages the animation actions.
   */
  const {
    actions,
    names,
  } = useAnimations(
    clips,
    farmer
  )

  /**
   * -----------------------------------------------------
   * Diagnostics
   * -----------------------------------------------------
   */

  useEffect(() => {
    console.group(
      '🌾 Farmer Animation Library'
    )

    console.log(
      'Total clips:',
      clips.length
    )

    console.log(
      'Available action names:',
      names
    )

    console.table(
      clips.map((clip) => ({
        name:
          clip.name,

        duration:
          Number(
            clip.duration.toFixed(3)
          ),

        tracks:
          clip.tracks.length,
      }))
    )

    console.groupEnd()
  }, [
    clips,
    names,
  ])

  /**
   * -----------------------------------------------------
   * Play selected animation
   * -----------------------------------------------------
   */

  useEffect(() => {
    const action =
      actions[animation]

    if (!action) {
      console.warn(
        `[Animation Test] Action "${animation}" is unavailable.`
      )

      return
    }

    /**
     * Fade out everything else.
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
     * Play requested animation.
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

/**
 * -------------------------------------------------------
 * Test Page
 * -------------------------------------------------------
 */

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
        position: 'relative',

        width: '100vw',
        height: '100vh',

        overflow: 'hidden',

        background:
          '#202020',
      }}
    >
      {/* ------------------------------------------------
          Animation selector
      ------------------------------------------------ */}

      <div
        style={{
          position:
            'absolute',

          top: 20,
          left: 20,

          zIndex: 10,

          width: 520,
          maxHeight:
            'calc(100vh - 40px)',

          overflowY:
            'auto',

          padding: 16,

          background:
            'rgba(0, 0, 0, 0.76)',

          borderRadius: 10,

          color: 'white',

          fontFamily:
            'sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight:
              'bold',

            marginBottom:
              6,
          }}
        >
          Farmer Animation Library
        </div>

        <div
          style={{
            fontSize: 13,

            opacity: 0.7,

            marginBottom:
              16,
          }}
        >
          Current:{' '}
          <strong>
            {animation}
          </strong>
        </div>

        {ANIMATION_GROUPS.map(
          (group) => (
            <section
              key={
                group.title
              }
              style={{
                marginBottom:
                  18,
              }}
            >
              <div
                style={{
                  fontSize: 12,

                  fontWeight:
                    'bold',

                  textTransform:
                    'uppercase',

                  letterSpacing:
                    1,

                  opacity: 0.55,

                  marginBottom:
                    8,
                }}
              >
                {group.title}
              </div>

              <div
                style={{
                  display:
                    'flex',

                  flexWrap:
                    'wrap',

                  gap: 7,
                }}
              >
                {group.animations.map(
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
                            '7px 11px',

                          border:
                            active
                              ? '2px solid white'
                              : '1px solid #666',

                          borderRadius:
                            5,

                          background:
                            active
                              ? '#666'
                              : '#303030',

                          color:
                            'white',

                          cursor:
                            'pointer',

                          fontWeight:
                            active
                              ? 'bold'
                              : 'normal',

                          fontSize:
                            12,
                        }}
                      >
                        {name}
                      </button>
                    )
                  }
                )}
              </div>
            </section>
          )
        )}
      </div>

      {/* ------------------------------------------------
          R3F
      ------------------------------------------------ */}

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
            null
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
 * -------------------------------------------------------
 * Preloading
 * -------------------------------------------------------
 */

useFBX.preload(
  MODEL_FILE
)

Object.values(
  ANIMATION_FILES
).forEach(
  (file) => {
    useFBX.preload(
      file
    )
  }
)