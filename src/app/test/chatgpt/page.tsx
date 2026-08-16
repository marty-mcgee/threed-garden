
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
 * =========================================================
 * APP ACTION TYPES
 * =========================================================
 *
 * These are the logical animation names used by the App.
 *
 * They are intentionally independent of:
 *
 * - FBX filenames
 * - internal FBX clip names
 * - Mixamo clip names
 *
 * Example:
 *
 * Walking.fbx
 *   internal clip = "mixamo.com"
 *
 * becomes:
 *
 * walk
 */
export enum AnimationType {
  // -------------------------------------------------------
  // Core locomotion
  // -------------------------------------------------------

  Idle = 'idle',
  Walk = 'walk',
  Run = 'run',
  WalkBackwards = 'walkBackwards',

  TurnLeft = 'turnLeft',
  TurnRight = 'turnRight',

  // -------------------------------------------------------
  // General
  // -------------------------------------------------------

  Talk = 'talk',
  Point = 'point',
  PointGesture = 'pointGesture',
  Drive = 'drive',

  // -------------------------------------------------------
  // Holding
  // -------------------------------------------------------

  HoldingIdle = 'holdingIdle',
  HoldingWalk = 'holdingWalk',

  HoldingTurnLeft = 'holdingTurnLeft',
  HoldingTurnRight = 'holdingTurnRight',

  // -------------------------------------------------------
  // Box
  // -------------------------------------------------------

  BoxIdle = 'boxIdle',
  BoxTurn = 'boxTurn',
  BoxTurn2 = 'boxTurn2',
  BoxWalkArc = 'boxWalkArc',

  // -------------------------------------------------------
  // Farming
  // -------------------------------------------------------

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

  // -------------------------------------------------------
  // Wheelbarrow
  // -------------------------------------------------------

  WheelbarrowIdle = 'wheelbarrowIdle',

  WheelbarrowWalk = 'wheelbarrowWalk',
  WheelbarrowWalk2 = 'wheelbarrowWalk2',

  WheelbarrowWalkTurn = 'wheelbarrowWalkTurn',
  WheelbarrowWalkTurn2 = 'wheelbarrowWalkTurn2',

  WheelbarrowDump = 'wheelbarrowDump',
}

/**
 * =========================================================
 * SOURCE DEFINITION
 * =========================================================
 *
 * This deliberately models what we may eventually store
 * elsewhere in the App.
 *
 * For now, however, everything lives inside this test page.
 */
interface AnimationSourceDefinition {
  action: AnimationType

  /**
   * Human-readable source file name.
   */
  fileName: string

  /**
   * Actual browser-loadable asset path.
   */
  filePath: string

  /**
   * If we later discover multiple clips in a source file,
   * this can identify the desired source clip.
   *
   * For the current FBXs we simply use animations[0].
   */
  sourceClip?: string

  /**
   * Useful later for gameplay/state-machine logic.
   */
  loop: boolean

  /**
   * UI grouping only.
   */
  group:
    | 'Core'
    | 'General'
    | 'Holding'
    | 'Box'
    | 'Farming'
    | 'Wheelbarrow'
}

/**
 * =========================================================
 * MODEL
 * =========================================================
 */

const MODEL_FILE =
  '/assets/characters/SK_Chr_Farmer_Female_01.fbx'

/**
 * =========================================================
 * EXTERNAL ANIMATION LIBRARY
 * =========================================================
 *
 * Think of this as our current in-page equivalent of:
 *
 * threed_model_files
 *
 * +
 *
 * metadata.animationMap
 *
 * No database changes are needed for this experiment.
 */
const ANIMATION_SOURCES: AnimationSourceDefinition[] = [
  // =======================================================
  // CORE
  // =======================================================

  {
    action: AnimationType.Idle,
    fileName: 'Idle.fbx',
    filePath: '/assets/animations/Idle.fbx',
    loop: true,
    group: 'Core',
  },

  {
    action: AnimationType.Walk,
    fileName: 'Walking.fbx',
    filePath: '/assets/animations/Walking.fbx',
    loop: true,
    group: 'Core',
  },

  {
    action: AnimationType.Run,
    fileName: 'Running.fbx',
    filePath: '/assets/animations/Running.fbx',
    loop: true,
    group: 'Core',
  },

  {
    action: AnimationType.WalkBackwards,
    fileName: 'Walking Backwards.fbx',
    filePath: '/assets/animations/Walking Backwards.fbx',
    loop: true,
    group: 'Core',
  },

  {
    action: AnimationType.TurnLeft,
    fileName: 'Left Turn.fbx',
    filePath: '/assets/animations/Left Turn.fbx',
    loop: false,
    group: 'Core',
  },

  {
    action: AnimationType.TurnRight,
    fileName: 'Right Turn.fbx',
    filePath: '/assets/animations/Right Turn.fbx',
    loop: false,
    group: 'Core',
  },

  // =======================================================
  // GENERAL
  // =======================================================

  {
    action: AnimationType.Talk,
    fileName: 'Talking.fbx',
    filePath: '/assets/animations/Talking.fbx',
    loop: true,
    group: 'General',
  },

  {
    action: AnimationType.Point,
    fileName: 'Pointing.fbx',
    filePath: '/assets/animations/Pointing.fbx',
    loop: false,
    group: 'General',
  },

  {
    action: AnimationType.PointGesture,
    fileName: 'Pointing Gesture.fbx',
    filePath: '/assets/animations/Pointing Gesture.fbx',
    loop: false,
    group: 'General',
  },

  {
    action: AnimationType.Drive,
    fileName: 'Driving.fbx',
    filePath: '/assets/animations/Driving.fbx',
    loop: true,
    group: 'General',
  },

  // =======================================================
  // HOLDING
  // =======================================================

  {
    action: AnimationType.HoldingIdle,
    fileName: 'holding idle.fbx',
    filePath:
      '/assets/animations/farming/holding idle.fbx',
    loop: true,
    group: 'Holding',
  },

  {
    action: AnimationType.HoldingWalk,
    fileName: 'holding walk.fbx',
    filePath:
      '/assets/animations/farming/holding walk.fbx',
    loop: true,
    group: 'Holding',
  },

  {
    action: AnimationType.HoldingTurnLeft,
    fileName: 'holding turn left.fbx',
    filePath:
      '/assets/animations/farming/holding turn left.fbx',
    loop: false,
    group: 'Holding',
  },

  {
    action: AnimationType.HoldingTurnRight,
    fileName: 'holding turn right.fbx',
    filePath:
      '/assets/animations/farming/holding turn right.fbx',
    loop: false,
    group: 'Holding',
  },

  // =======================================================
  // BOX
  // =======================================================

  {
    action: AnimationType.BoxIdle,
    fileName: 'box idle.fbx',
    filePath:
      '/assets/animations/farming/box idle.fbx',
    loop: true,
    group: 'Box',
  },

  {
    action: AnimationType.BoxTurn,
    fileName: 'box turn.fbx',
    filePath:
      '/assets/animations/farming/box turn.fbx',
    loop: false,
    group: 'Box',
  },

  {
    action: AnimationType.BoxTurn2,
    fileName: 'box turn (2).fbx',
    filePath:
      '/assets/animations/farming/box turn (2).fbx',
    loop: false,
    group: 'Box',
  },

  {
    action: AnimationType.BoxWalkArc,
    fileName: 'box walk arc.fbx',
    filePath:
      '/assets/animations/farming/box walk arc.fbx',
    loop: true,
    group: 'Box',
  },

  // =======================================================
  // FARMING
  // =======================================================

  {
    action: AnimationType.KneelingIdle,
    fileName: 'kneeling idle.fbx',
    filePath:
      '/assets/animations/farming/kneeling idle.fbx',
    loop: true,
    group: 'Farming',
  },

  {
    action: AnimationType.Watering,
    fileName: 'watering.fbx',
    filePath:
      '/assets/animations/farming/watering.fbx',
    loop: false,
    group: 'Farming',
  },

  {
    action: AnimationType.DigAndPlantSeeds,
    fileName: 'dig and plant seeds.fbx',
    filePath:
      '/assets/animations/farming/dig and plant seeds.fbx',
    loop: false,
    group: 'Farming',
  },

  {
    action: AnimationType.PlantAPlant,
    fileName: 'plant a plant.fbx',
    filePath:
      '/assets/animations/farming/plant a plant.fbx',
    loop: false,
    group: 'Farming',
  },

  {
    action: AnimationType.PlantTree,
    fileName: 'plant tree.fbx',
    filePath:
      '/assets/animations/farming/plant tree.fbx',
    loop: false,
    group: 'Farming',
  },

  {
    action: AnimationType.PullPlant,
    fileName: 'pull plant.fbx',
    filePath:
      '/assets/animations/farming/pull plant.fbx',
    loop: false,
    group: 'Farming',
  },

  {
    action: AnimationType.PullPlant2,
    fileName: 'pull plant (2).fbx',
    filePath:
      '/assets/animations/farming/pull plant (2).fbx',
    loop: false,
    group: 'Farming',
  },

  {
    action: AnimationType.PickFruit,
    fileName: 'pick fruit.fbx',
    filePath:
      '/assets/animations/farming/pick fruit.fbx',
    loop: false,
    group: 'Farming',
  },

  {
    action: AnimationType.PickFruit2,
    fileName: 'pick fruit (2).fbx',
    filePath:
      '/assets/animations/farming/pick fruit (2).fbx',
    loop: false,
    group: 'Farming',
  },

  {
    action: AnimationType.PickFruit3,
    fileName: 'pick fruit (3).fbx',
    filePath:
      '/assets/animations/farming/pick fruit (3).fbx',
    loop: false,
    group: 'Farming',
  },

  {
    action: AnimationType.CowMilking,
    fileName: 'cow milking.fbx',
    filePath:
      '/assets/animations/farming/cow milking.fbx',
    loop: false,
    group: 'Farming',
  },

  // =======================================================
  // WHEELBARROW
  // =======================================================

  {
    action: AnimationType.WheelbarrowIdle,
    fileName: 'wheelbarrow idle.fbx',
    filePath:
      '/assets/animations/farming/wheelbarrow idle.fbx',
    loop: true,
    group: 'Wheelbarrow',
  },

  {
    action: AnimationType.WheelbarrowWalk,
    fileName: 'wheelbarrow walk.fbx',
    filePath:
      '/assets/animations/farming/wheelbarrow walk.fbx',
    loop: true,
    group: 'Wheelbarrow',
  },

  {
    action: AnimationType.WheelbarrowWalk2,
    fileName: 'wheelbarrow walk (2).fbx',
    filePath:
      '/assets/animations/farming/wheelbarrow walk (2).fbx',
    loop: true,
    group: 'Wheelbarrow',
  },

  {
    action: AnimationType.WheelbarrowWalkTurn,
    fileName: 'wheelbarrow walk turn.fbx',
    filePath:
      '/assets/animations/farming/wheelbarrow walk turn.fbx',
    loop: false,
    group: 'Wheelbarrow',
  },

  {
    action: AnimationType.WheelbarrowWalkTurn2,
    fileName: 'wheelbarrow walk turn (2).fbx',
    filePath:
      '/assets/animations/farming/wheelbarrow walk turn (2).fbx',
    loop: false,
    group: 'Wheelbarrow',
  },

  {
    action: AnimationType.WheelbarrowDump,
    fileName: 'wheelbarrow dump.fbx',
    filePath:
      '/assets/animations/farming/wheelbarrow dump.fbx',
    loop: false,
    group: 'Wheelbarrow',
  },
]

/**
 * =========================================================
 * INDIVIDUAL FBX LOADER COMPONENT
 * =========================================================
 *
 * Hooks cannot be called dynamically in a normal loop.
 *
 * Because our list is static, we keep the actual useFBX()
 * calls inside one dedicated hook below.
 */
function useFarmerAnimationSources() {
  const idle =
    useFBX('/assets/animations/Idle.fbx')

  const walk =
    useFBX('/assets/animations/Walking.fbx')

  const run =
    useFBX('/assets/animations/Running.fbx')

  const walkBackwards =
    useFBX('/assets/animations/Walking Backwards.fbx')

  const turnLeft =
    useFBX('/assets/animations/Left Turn.fbx')

  const turnRight =
    useFBX('/assets/animations/Right Turn.fbx')

  const talk =
    useFBX('/assets/animations/Talking.fbx')

  const point =
    useFBX('/assets/animations/Pointing.fbx')

  const pointGesture =
    useFBX('/assets/animations/Pointing Gesture.fbx')

  const drive =
    useFBX('/assets/animations/Driving.fbx')

  const holdingIdle =
    useFBX('/assets/animations/farming/holding idle.fbx')

  const holdingWalk =
    useFBX('/assets/animations/farming/holding walk.fbx')

  const holdingTurnLeft =
    useFBX(
      '/assets/animations/farming/holding turn left.fbx'
    )

  const holdingTurnRight =
    useFBX(
      '/assets/animations/farming/holding turn right.fbx'
    )

  const boxIdle =
    useFBX('/assets/animations/farming/box idle.fbx')

  const boxTurn =
    useFBX('/assets/animations/farming/box turn.fbx')

  const boxTurn2 =
    useFBX(
      '/assets/animations/farming/box turn (2).fbx'
    )

  const boxWalkArc =
    useFBX(
      '/assets/animations/farming/box walk arc.fbx'
    )

  const kneelingIdle =
    useFBX(
      '/assets/animations/farming/kneeling idle.fbx'
    )

  const watering =
    useFBX('/assets/animations/farming/watering.fbx')

  const digAndPlantSeeds =
    useFBX(
      '/assets/animations/farming/dig and plant seeds.fbx'
    )

  const plantAPlant =
    useFBX(
      '/assets/animations/farming/plant a plant.fbx'
    )

  const plantTree =
    useFBX('/assets/animations/farming/plant tree.fbx')

  const pullPlant =
    useFBX('/assets/animations/farming/pull plant.fbx')

  const pullPlant2 =
    useFBX(
      '/assets/animations/farming/pull plant (2).fbx'
    )

  const pickFruit =
    useFBX('/assets/animations/farming/pick fruit.fbx')

  const pickFruit2 =
    useFBX(
      '/assets/animations/farming/pick fruit (2).fbx'
    )

  const pickFruit3 =
    useFBX(
      '/assets/animations/farming/pick fruit (3).fbx'
    )

  const cowMilking =
    useFBX(
      '/assets/animations/farming/cow milking.fbx'
    )

  const wheelbarrowIdle =
    useFBX(
      '/assets/animations/farming/wheelbarrow idle.fbx'
    )

  const wheelbarrowWalk =
    useFBX(
      '/assets/animations/farming/wheelbarrow walk.fbx'
    )

  const wheelbarrowWalk2 =
    useFBX(
      '/assets/animations/farming/wheelbarrow walk (2).fbx'
    )

  const wheelbarrowWalkTurn =
    useFBX(
      '/assets/animations/farming/wheelbarrow walk turn.fbx'
    )

  const wheelbarrowWalkTurn2 =
    useFBX(
      '/assets/animations/farming/wheelbarrow walk turn (2).fbx'
    )

  const wheelbarrowDump =
    useFBX(
      '/assets/animations/farming/wheelbarrow dump.fbx'
    )

  return {
    [AnimationType.Idle]:
      idle,

    [AnimationType.Walk]:
      walk,

    [AnimationType.Run]:
      run,

    [AnimationType.WalkBackwards]:
      walkBackwards,

    [AnimationType.TurnLeft]:
      turnLeft,

    [AnimationType.TurnRight]:
      turnRight,

    [AnimationType.Talk]:
      talk,

    [AnimationType.Point]:
      point,

    [AnimationType.PointGesture]:
      pointGesture,

    [AnimationType.Drive]:
      drive,

    [AnimationType.HoldingIdle]:
      holdingIdle,

    [AnimationType.HoldingWalk]:
      holdingWalk,

    [AnimationType.HoldingTurnLeft]:
      holdingTurnLeft,

    [AnimationType.HoldingTurnRight]:
      holdingTurnRight,

    [AnimationType.BoxIdle]:
      boxIdle,

    [AnimationType.BoxTurn]:
      boxTurn,

    [AnimationType.BoxTurn2]:
      boxTurn2,

    [AnimationType.BoxWalkArc]:
      boxWalkArc,

    [AnimationType.KneelingIdle]:
      kneelingIdle,

    [AnimationType.Watering]:
      watering,

    [AnimationType.DigAndPlantSeeds]:
      digAndPlantSeeds,

    [AnimationType.PlantAPlant]:
      plantAPlant,

    [AnimationType.PlantTree]:
      plantTree,

    [AnimationType.PullPlant]:
      pullPlant,

    [AnimationType.PullPlant2]:
      pullPlant2,

    [AnimationType.PickFruit]:
      pickFruit,

    [AnimationType.PickFruit2]:
      pickFruit2,

    [AnimationType.PickFruit3]:
      pickFruit3,

    [AnimationType.CowMilking]:
      cowMilking,

    [AnimationType.WheelbarrowIdle]:
      wheelbarrowIdle,

    [AnimationType.WheelbarrowWalk]:
      wheelbarrowWalk,

    [AnimationType.WheelbarrowWalk2]:
      wheelbarrowWalk2,

    [AnimationType.WheelbarrowWalkTurn]:
      wheelbarrowWalkTurn,

    [AnimationType.WheelbarrowWalkTurn2]:
      wheelbarrowWalkTurn2,

    [AnimationType.WheelbarrowDump]:
      wheelbarrowDump,
  }
}

/**
 * =========================================================
 * FARMER
 * =========================================================
 */

function Farmer({
  animation,
}: {
  animation: AnimationType
}) {
  const farmer =
    useFBX(MODEL_FILE)

  const sourceObjects =
    useFarmerAnimationSources()

  /**
   * Build normalized clips.
   *
   * This is the important boundary between source assets
   * and the App's animation API.
   */
  const clips =
    useMemo(() => {
      return ANIMATION_SOURCES
        .map((definition) => {
          const source =
            sourceObjects[
              definition.action
            ]

          const sourceClip =
            source.animations[0]

          if (!sourceClip) {
            console.warn(
              `[Animation Test] No animation found in ${definition.fileName}`
            )

            return null
          }

          const clip =
            sourceClip.clone()

          /**
           * Normalize source clip into our App action.
           */
          clip.name =
            definition.action

          return clip
        })
        .filter(
          (
            clip
          ): clip is THREE.AnimationClip =>
            clip !== null
        )
    }, [sourceObjects])

  const {
    actions,
    names,
  } =
    useAnimations(
      clips,
      farmer
    )

  /**
   * -------------------------------------------------------
   * DIAGNOSTICS
   * -------------------------------------------------------
   */

  useEffect(() => {
    console.group(
      'Farmer External Animation Library'
    )

    console.log(
      'Model:',
      MODEL_FILE
    )

    console.log(
      'Total source files:',
      ANIMATION_SOURCES.length
    )

    console.log(
      'Resolved clips:',
      names.length
    )

    console.table(
      ANIMATION_SOURCES.map(
        (source) => {
          const clip =
            clips.find(
              (item) =>
                item.name ===
                source.action
            )

          return {
            action:
              source.action,

            group:
              source.group,

            file:
              source.fileName,

            sourceClip:
              clip
                ? sourceObjects[
                    source.action
                  ].animations[0]
                    ?.name
                : 'missing',

            normalizedClip:
              clip?.name ??
              'missing',

            duration:
              clip
                ? Number(
                    clip.duration.toFixed(
                      3
                    )
                  )
                : null,

            tracks:
              clip?.tracks
                .length ?? 0,

            loop:
              source.loop,
          }
        }
      )
    )

    console.groupEnd()
  }, [
    clips,
    names,
    sourceObjects,
  ])

  /**
   * -------------------------------------------------------
   * PLAY SELECTED ACTION
   * -------------------------------------------------------
   */

  useEffect(() => {
    const action =
      actions[animation]

    if (!action) {
      console.warn(
        `[Animation Test] Missing action: ${animation}`
      )

      return
    }

    const definition =
      ANIMATION_SOURCES.find(
        (source) =>
          source.action ===
          animation
      )

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

    action.reset()

    if (
      definition?.loop === false
    ) {
      action.setLoop(
        THREE.LoopOnce,
        1
      )

      action.clampWhenFinished =
        true
    } else {
      action.setLoop(
        THREE.LoopRepeat,
        Infinity
      )

      action.clampWhenFinished =
        false
    }

    action
      .fadeIn(0.2)
      .play()

    console.log(
      `[Animation Test] Playing ${animation}`
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
 * =========================================================
 * PAGE
 * =========================================================
 */

export default function TestPage() {
  const [
    animation,
    setAnimation,
  ] =
    useState<AnimationType>(
      AnimationType.Idle
    )

  const groups =
    useMemo(() => {
      return Array.from(
        new Set(
          ANIMATION_SOURCES.map(
            (source) =>
              source.group
          )
        )
      )
    }, [])

  const currentSource =
    ANIMATION_SOURCES.find(
      (source) =>
        source.action ===
        animation
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
      {/* ===================================================
          LEFT PANEL
      =================================================== */}

      <div
        style={{
          position:
            'absolute',

          top: 16,
          left: 16,

          zIndex: 20,

          width: 530,

          maxHeight:
            'calc(100vh - 32px)',

          overflowY:
            'auto',

          padding: 16,

          borderRadius: 10,

          background:
            'rgba(0, 0, 0, 0.78)',

          color: '#fff',

          fontFamily:
            'sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 20,

            fontWeight:
              700,

            marginBottom:
              4,
          }}
        >
          Farmer Animation Test
        </div>

        <div
          style={{
            fontSize: 12,

            opacity: 0.6,

            marginBottom:
              14,
          }}
        >
          Character FBX +
          external animation
          FBX library
        </div>

        {/* ===============================================
            CURRENT ACTION
        =============================================== */}

        <div
          style={{
            padding: 10,

            marginBottom:
              16,

            border:
              '1px solid #555',

            borderRadius:
              6,

            background:
              '#242424',
          }}
        >
          <div
            style={{
              fontSize: 11,

              opacity: 0.55,

              textTransform:
                'uppercase',

              marginBottom:
                4,
            }}
          >
            Current App Action
          </div>

          <div
            style={{
              fontSize: 18,

              fontWeight:
                700,
            }}
          >
            {animation}
          </div>

          {currentSource && (
            <div
              style={{
                marginTop: 6,

                fontSize: 12,

                opacity: 0.75,

                lineHeight: 1.5,
              }}
            >
              Source:{' '}
              {
                currentSource.fileName
              }
              <br />

              Group:{' '}
              {
                currentSource.group
              }
              <br />

              Loop:{' '}
              {currentSource.loop
                ? 'yes'
                : 'no'}
            </div>
          )}
        </div>

        {/* ===============================================
            GROUPS
        =============================================== */}

        {groups.map(
          (group) => {
            const sources =
              ANIMATION_SOURCES.filter(
                (source) =>
                  source.group ===
                  group
              )

            return (
              <section
                key={
                  group
                }
                style={{
                  marginBottom:
                    18,
                }}
              >
                <div
                  style={{
                    fontSize:
                      11,

                    fontWeight:
                      700,

                    letterSpacing:
                      1,

                    opacity:
                      0.55,

                    textTransform:
                      'uppercase',

                    marginBottom:
                      8,
                  }}
                >
                  {group}
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
                  {sources.map(
                    (
                      source
                    ) => {
                      const active =
                        animation ===
                        source.action

                      return (
                        <button
                          key={
                            source.action
                          }
                          type="button"
                          title={
                            source.fileName
                          }
                          onClick={() =>
                            setAnimation(
                              source.action
                            )
                          }
                          style={{
                            padding:
                              '7px 10px',

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
                              '#fff',

                            cursor:
                              'pointer',

                            fontSize:
                              12,

                            fontWeight:
                              active
                                ? 700
                                : 400,
                          }}
                        >
                          {
                            source.action
                          }
                        </button>
                      )
                    }
                  )}
                </div>
              </section>
            )
          }
        )}

        <div
          style={{
            paddingTop: 10,

            borderTop:
              '1px solid #444',

            fontSize: 11,

            lineHeight: 1.5,

            opacity: 0.55,
          }}
        >
          Open browser
          DevTools to see the
          resolved animation
          source table.
        </div>
      </div>

      {/* ===================================================
          CANVAS
      =================================================== */}

      <Canvas
        camera={{
          position:
            [3, 2, 5],

          fov: 45,

          near: 0.1,

          far: 1000,
        }}
      >
        <Suspense fallback={null}>
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
 * =========================================================
 * PRELOAD
 * =========================================================
 */

useFBX.preload(
  MODEL_FILE
)

ANIMATION_SOURCES.forEach(
  (source) => {
    useFBX.preload(
      source.filePath
    )
  }
)