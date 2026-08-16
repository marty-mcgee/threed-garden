// src/lib/utils/externalCharacterAnimations.ts

import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'

/**
 * Logical animation names used by the application.
 *
 * These names intentionally match the normalized names
 * proven in app/test/page.tsx.
 */
export type ExternalCharacterAnimationAction =
  | 'idle'
  | 'walk'
  | 'run'
  | 'walkBackwards'
  | 'turnLeft'
  | 'turnRight'
  | 'talk'
  | 'point'
  | 'pointGesture'
  | 'drive'
  | 'holdingIdle'
  | 'holdingWalk'
  | 'holdingTurnLeft'
  | 'holdingTurnRight'
  | 'boxIdle'
  | 'boxTurn'
  | 'boxTurn2'
  | 'boxWalkArc'
  | 'kneelingIdle'
  | 'watering'
  | 'digAndPlantSeeds'
  | 'plantAPlant'
  | 'plantTree'
  | 'pullPlant'
  | 'pullPlant2'
  | 'pickFruit'
  | 'pickFruit2'
  | 'pickFruit3'
  | 'cowMilking'
  | 'wheelbarrowIdle'
  | 'wheelbarrowWalk'
  | 'wheelbarrowWalk2'
  | 'wheelbarrowWalkTurn'
  | 'wheelbarrowWalkTurn2'
  | 'wheelbarrowDump'

export interface ExternalCharacterAnimationSource {
  action: ExternalCharacterAnimationAction
  filePath: string
  loop: boolean
}

/**
 * Known-good animation library from app/test/page.tsx.
 *
 * IMPORTANT:
 * This is intentionally a temporary static source.
 *
 * Later this can come from:
 *
 * threed_model_files
 *
 * without changing the consumers of
 * loadExternalCharacterAnimations().
 */
export const FARMER_FEMALE_ANIMATION_SOURCES:
  readonly ExternalCharacterAnimationSource[] = [
  // Core
  {
    action: 'idle',
    filePath: '/assets/animations/Idle.fbx',
    loop: true,
  },
  {
    action: 'walk',
    filePath: '/assets/animations/Walking.fbx',
    loop: true,
  },
  {
    action: 'run',
    filePath: '/assets/animations/Running.fbx',
    loop: true,
  },
  {
    action: 'walkBackwards',
    filePath: '/assets/animations/Walking Backwards.fbx',
    loop: true,
  },
  {
    action: 'turnLeft',
    filePath: '/assets/animations/Left Turn.fbx',
    loop: false,
  },
  {
    action: 'turnRight',
    filePath: '/assets/animations/Right Turn.fbx',
    loop: false,
  },

  // General
  {
    action: 'talk',
    filePath: '/assets/animations/Talking.fbx',
    loop: true,
  },
  {
    action: 'point',
    filePath: '/assets/animations/Pointing.fbx',
    loop: false,
  },
  {
    action: 'pointGesture',
    filePath: '/assets/animations/Pointing Gesture.fbx',
    loop: false,
  },
  {
    action: 'drive',
    filePath: '/assets/animations/Driving.fbx',
    loop: true,
  },

  // Holding
  {
    action: 'holdingIdle',
    filePath: '/assets/animations/farming/holding idle.fbx',
    loop: true,
  },
  {
    action: 'holdingWalk',
    filePath: '/assets/animations/farming/holding walk.fbx',
    loop: true,
  },
  {
    action: 'holdingTurnLeft',
    filePath: '/assets/animations/farming/holding turn left.fbx',
    loop: false,
  },
  {
    action: 'holdingTurnRight',
    filePath: '/assets/animations/farming/holding turn right.fbx',
    loop: false,
  },

  // Box
  {
    action: 'boxIdle',
    filePath: '/assets/animations/farming/box idle.fbx',
    loop: true,
  },
  {
    action: 'boxTurn',
    filePath: '/assets/animations/farming/box turn.fbx',
    loop: false,
  },
  {
    action: 'boxTurn2',
    filePath: '/assets/animations/farming/box turn (2).fbx',
    loop: false,
  },
  {
    action: 'boxWalkArc',
    filePath: '/assets/animations/farming/box walk arc.fbx',
    loop: true,
  },

  // Farming
  {
    action: 'kneelingIdle',
    filePath: '/assets/animations/farming/kneeling idle.fbx',
    loop: true,
  },
  {
    action: 'watering',
    filePath: '/assets/animations/farming/watering.fbx',
    loop: false,
  },
  {
    action: 'digAndPlantSeeds',
    filePath: '/assets/animations/farming/dig and plant seeds.fbx',
    loop: false,
  },
  {
    action: 'plantAPlant',
    filePath: '/assets/animations/farming/plant a plant.fbx',
    loop: false,
  },
  {
    action: 'plantTree',
    filePath: '/assets/animations/farming/plant tree.fbx',
    loop: false,
  },
  {
    action: 'pullPlant',
    filePath: '/assets/animations/farming/pull plant.fbx',
    loop: false,
  },
  {
    action: 'pullPlant2',
    filePath: '/assets/animations/farming/pull plant (2).fbx',
    loop: false,
  },
  {
    action: 'pickFruit',
    filePath: '/assets/animations/farming/pick fruit.fbx',
    loop: false,
  },
  {
    action: 'pickFruit2',
    filePath: '/assets/animations/farming/pick fruit (2).fbx',
    loop: false,
  },
  {
    action: 'pickFruit3',
    filePath: '/assets/animations/farming/pick fruit (3).fbx',
    loop: false,
  },
  {
    action: 'cowMilking',
    filePath: '/assets/animations/farming/cow milking.fbx',
    loop: false,
  },

  // Wheelbarrow
  {
    action: 'wheelbarrowIdle',
    filePath: '/assets/animations/farming/wheelbarrow idle.fbx',
    loop: true,
  },
  {
    action: 'wheelbarrowWalk',
    filePath: '/assets/animations/farming/wheelbarrow walk.fbx',
    loop: true,
  },
  {
    action: 'wheelbarrowWalk2',
    filePath: '/assets/animations/farming/wheelbarrow walk (2).fbx',
    loop: true,
  },
  {
    action: 'wheelbarrowWalkTurn',
    filePath: '/assets/animations/farming/wheelbarrow walk turn.fbx',
    loop: false,
  },
  {
    action: 'wheelbarrowWalkTurn2',
    filePath: '/assets/animations/farming/wheelbarrow walk turn (2).fbx',
    loop: false,
  },
  {
    action: 'wheelbarrowDump',
    filePath: '/assets/animations/farming/wheelbarrow dump.fbx',
    loop: false,
  },
]

export interface LoadedExternalCharacterAnimations {
  clips: THREE.AnimationClip[]

  /**
   * Allows future interaction/action code to know
   * whether an action should repeat.
   */
  looping: Map<string, boolean>
}

/**
 * Cache the normalized AnimationClips themselves.
 *
 * Every consumer receives cloned clips so that mixers/actions
 * can safely manipulate them independently.
 */
const libraryCache =
  new Map<string, LoadedExternalCharacterAnimations>()

/**
 * For this first integration, only enable the external library
 * for the Farmer Female that we have actually verified.
 *
 * We deliberately do NOT assume every FBX model is compatible.
 */
export function getExternalAnimationSourcesForModel(
  modelName?: string,
  filePath?: string,
): readonly ExternalCharacterAnimationSource[] {
  const name = (modelName ?? '').toLowerCase()
  const path = (filePath ?? '').toLowerCase()

  const isFarmerFemale =
    name.includes('farmer_female') ||
    name.includes('farmer female') ||
    path.includes('sk_chr_farmer_female_01.fbx')

  if (!isFarmerFemale) {
    return []
  }

  return FARMER_FEMALE_ANIMATION_SOURCES
}

/**
 * Load a collection of standalone animation FBXs and normalize
 * their first clips to the App action names.
 *
 * Example:
 *
 * Walking.fbx / "mixamo.com"
 *
 * becomes:
 *
 * AnimationClip.name === "walk"
 */
export async function loadExternalCharacterAnimations(
  sources: readonly ExternalCharacterAnimationSource[],
): Promise<LoadedExternalCharacterAnimations> {
  if (sources.length === 0) {
    return {
      clips: [],
      looping: new Map(),
    }
  }

  const cacheKey = sources
    .map((source) => `${source.action}:${source.filePath}`)
    .join('|')

  const cached = libraryCache.get(cacheKey)

  if (cached) {
    return {
      clips: cached.clips.map((clip) => clip.clone()),
      looping: new Map(cached.looping),
    }
  }

  const loader = new FBXLoader()

  const results = await Promise.all(
    sources.map(async (source) => {
      try {
        const fbx = await loader.loadAsync(source.filePath)

        const sourceClip = fbx.animations?.[0]

        if (!sourceClip) {
          console.warn(
            `[External Animations] No clip found in ${source.filePath}`,
          )

          return null
        }

        const clip = sourceClip.clone()

        /**
         * Critical normalization step.
         */
        clip.name = source.action

        return {
          clip,
          action: source.action,
          loop: source.loop,
        }
      } catch (error) {
        console.error(
          `[External Animations] Failed loading ${source.filePath}`,
          error,
        )

        return null
      }
    }),
  )

  const valid = results.filter(
    (
      result,
    ): result is {
      clip: THREE.AnimationClip
      action: ExternalCharacterAnimationAction
      loop: boolean
    } => result !== null,
  )

  const loaded: LoadedExternalCharacterAnimations = {
    clips: valid.map((result) => result.clip),

    looping: new Map(
      valid.map((result) => [
        result.action,
        result.loop,
      ]),
    ),
  }

  libraryCache.set(cacheKey, {
    clips: loaded.clips.map((clip) => clip.clone()),
    looping: new Map(loaded.looping),
  })

  return loaded
}