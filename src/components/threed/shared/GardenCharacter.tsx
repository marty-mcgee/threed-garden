// src/components/threed/shared/GardenCharacter.tsx
'use client';

import {
  useRef,
  useEffect,
  useState,
} from 'react';

import { useFrame } from '@react-three/fiber';

import {
  GLTFLoader,
} from 'three/examples/jsm/loaders/GLTFLoader.js';

import {
  FBXLoader,
} from 'three/examples/jsm/loaders/FBXLoader.js';

import {
  OBJLoader,
} from 'three/examples/jsm/loaders/OBJLoader.js';

import { Html } from '@react-three/drei';

import * as THREE from 'three';

import {
  buildAnimationMap,
  type AnimationMap,
} from '@/lib/utils/animation';

import {
  getExternalAnimationSourcesForModel,
  loadExternalCharacterAnimations,
} from '@/lib/utils/externalCharacterAnimations';

// ========================================================
// TYPES
// ========================================================

interface CharacterData {
  id: number;

  characterId: string;
  name: string;

  type: string;
  status: string;

  modelId: number | null;

  model?: {
    id: number;

    modelName: string;
    modelType: string;

    filePath: string;

    scale: string;
    rotationY: string;

    animations: string[];

    metadata?: {
      animationMap?: Record<string, string>;

      [key: string]: unknown;
    };
  };

  defaultAnimation: string;

  animationSpeed: number;

  movementType: string;

  movementRadius: number;
  movementSpeed: number;

  patrolWaypoints: {
    x: number;
    y: number;
    z: number;
  }[];

  followTarget: string;

  followDistance: number;

  teleportPositions: {
    x: number;
    y: number;
    z: number;

    waitSeconds?: number;
  }[];

  teleportInterval: number;

  interactable: boolean;

  interactionMessage: string;

  defaultEmote: string;

  soundEffect?: string | null;

  positionX: number;
  positionY: number;
  positionZ: number;

  rotation: number;
  scale: number;

  visible: boolean;

  /**
   * These are nullable in the broader App data model.
   *
   * null means:
   *
   * start → beginning of day
   * end   → end of day
   */
  activeStartHour: number | null;
  activeEndHour: number | null;
}

interface GardenCharacterProps {
  character: CharacterData;

  currentWeather?: string;
  currentHour?: number;

  /**
   * When true, a parent object such as a RigidBody
   * already provides the world position.
   */
  positionedByParent?: boolean;

  /** Reports that the complete visual runtime or its safe fallback is ready. */
  onRuntimeSettled?: () => void;
}

// ========================================================
// GLOBALS
// ========================================================

const modelCache =
  new Map<string, THREE.Group>();

const animationMixers =
  new Map<number, THREE.AnimationMixer>();

/**
 * Registry of active character world positions.
 *
 * Used by follow behavior.
 */
const activeCharacterPositions =
  new Map<number, THREE.Vector3>();

const CROSSFADE_DURATION =
  0.25;

// ========================================================
// ANIMATION STATE HELPERS
// ========================================================

function getAnimationForMovement(
  movementType: string,
  isMoving: boolean,
  available: string[],
): string | null {
  if (
    available.length === 0
  ) {
    return null;
  }

  const has = (
    name: string,
  ) =>
    available.some(
      (
        animation,
      ) =>
        animation.toLowerCase() ===
        name.toLowerCase(),
    );

  // ------------------------------------------------------
  // NOT MOVING
  // ------------------------------------------------------

  if (!isMoving) {
    if (has('idle')) {
      return 'idle';
    }

    if (
      movementType ===
        'stationary' &&
      has('sway')
    ) {
      return 'sway';
    }

    if (
      movementType ===
        'stationary' &&
      has('float')
    ) {
      return 'float';
    }
  }

  // ------------------------------------------------------
  // MOVING
  // ------------------------------------------------------

  switch (
    movementType
  ) {
    case 'wander':
    case 'patrol':
    case 'follow':
      if (has('walk')) {
        return 'walk';
      }

      if (has('fly')) {
        return 'fly';
      }

      if (has('run')) {
        return 'run';
      }

      break;

    case 'circle':
      if (has('fly')) {
        return 'fly';
      }

      if (has('walk')) {
        return 'walk';
      }

      break;

    case 'teleport':
      if (has('spin')) {
        return 'spin';
      }

      if (has('float')) {
        return 'float';
      }

      break;

    default:
      if (has('idle')) {
        return 'idle';
      }
  }

  return has('idle')
    ? 'idle'
    : available[0];
}

/**
 * Resolve an App action through the existing AnimationMap.
 */
function findClip(
  animMap: AnimationMap | null,
  animations: THREE.AnimationClip[],
  name: string,
): THREE.AnimationClip | undefined {
  // External FBX clips are normalized to logical names such as
  // "idle", "walk", and "watering". Prefer those direct names.
  const directMatch = animations.find(
    (animation) =>
      animation.name.toLowerCase() === name.toLowerCase(),
  );

  if (directMatch) {
    return directMatch;
  }

  // Fall back to the existing animation map for legacy / embedded clips.
  const matched = animMap?.resolve(name) ?? null;

  if (!matched) {
    return undefined;
  }

  return animations.find(
    (animation) =>
      animation.name.toLowerCase() === matched.toLowerCase(),
  );
}

// ========================================================
// COMPONENT
// ========================================================

export function GardenCharacter({
  character,

  currentWeather = 'sunny',

  currentHour = 12,

  positionedByParent = false,

  onRuntimeSettled,
}: GardenCharacterProps) {
  /**
   * currentWeather remains part of the component API,
   * but this component is not currently applying weather
   * filtering to model loading.
   */
  void currentWeather;

  // ======================================================
  // HOME POSITION
  // ======================================================

  const homeX =
    positionedByParent
      ? 0
      : Number(
          character.positionX,
        ) || 0;

  const homeY =
    positionedByParent
      ? 0
      : Number(
          character.positionY,
        ) || 0;

  const homeZ =
    positionedByParent
      ? 0
      : Number(
          character.positionZ,
        ) || 0;

  // ======================================================
  // REFS
  // ======================================================

  const groupRef =
    useRef<THREE.Group>(
      null,
    );

  const mixerRef =
    useRef<THREE.AnimationMixer | null>(
      null,
    );

  const currentActionRef =
    useRef<THREE.AnimationAction | null>(
      null,
    );

  const animMapRef =
    useRef<AnimationMap | null>(
      null,
    );

  /**
   * Canonical animation collection for this instance.
   *
   * It contains:
   *
   * embedded model clips
   * +
   * verified external Farmer clips
   */
  const animationsRef =
    useRef<
      THREE.AnimationClip[]
    >([]);

  /**
   * Temporary semantic-action lock. While watering is playing,
   * the normal Garden movement loop is paused but the mixer still updates.
   */
  const taskLockedRef =
    useRef(false);

  const taskFinishedRef =
    useRef<((event: any) => void) | null>(null);

  /**
   * Deferred cleanup for a completed one-shot action.
   * We wait until the crossfade back to locomotion has finished before
   * stopping the task action, otherwise the skeleton can briefly fall back
   * to the FBX bind/T-pose between animations.
   */
  const taskCleanupTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  // ======================================================
  // MODEL STATE
  // ======================================================

  const [
    model,
    setModel,
  ] =
    useState<THREE.Group | null>(
      null,
    );

  const [
    modelError,
    setModelError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    loadingModel,
    setLoadingModel,
  ] =
    useState(false);

  const runtimeSettlementReportedRef = useRef(false);
  const runtimeSettlementKey = `${character.id}:${character.model?.filePath ?? 'fallback'}`;

  useEffect(() => {
    runtimeSettlementReportedRef.current = false;
  }, [runtimeSettlementKey]);

  useEffect(() => {
    const hasSafeFallback = !character.model?.filePath || modelError != null;
    if ((!model && !hasSafeFallback) || runtimeSettlementReportedRef.current) return;
    runtimeSettlementReportedRef.current = true;
    onRuntimeSettled?.();
  }, [character.model?.filePath, model, modelError, onRuntimeSettled]);

  // ======================================================
  // UI STATE
  // ======================================================

  const [
    hovered,
    setHovered,
  ] =
    useState(false);

  const [
    currentEmote,
    setCurrentEmote,
  ] =
    useState<string | null>(
      null,
    );

  const [
    showMessage,
    setShowMessage,
  ] =
    useState<string | null>(
      null,
    );

  // ======================================================
  // MOVEMENT STATE
  // ======================================================

  const movementState =
    useRef({
      targetPosition:
        new THREE.Vector3(
          homeX,
          homeY,
          homeZ,
        ),

      patrolIndex: 0,

      teleportTimer: 0,

      isMoving: false,

      lastAnimation:
        null as string | null,
    });

  // ======================================================
  // ACTIVITY STATE
  // ======================================================

  /**
   * Null active hours mean unrestricted.
   */
  const activeStartHour =
    character.activeStartHour ??
    0;

  const activeEndHour =
    character.activeEndHour ??
    23;

  const isTimeActive =
    currentHour >=
      activeStartHour &&
    currentHour <=
      activeEndHour;

  /**
   * IMPORTANT:
   *
   * This controls NPC behavior.
   *
   * It does NOT control whether the model asset loads.
   */
  const isCharacterActive =
    character.status !== 'hidden' &&
    character.status !== 'sleeping' &&
    character.visible &&
    isTimeActive;

  // ======================================================
  // MODEL + ANIMATION LOADING
  // ======================================================

  useEffect(() => {
    /**
     * Critical change:
     *
     * Do NOT gate model loading by character activity,
     * weather, time, visibility, or movement state.
     */
    if (
      !character.model
        ?.filePath
    ) {
      return;
    }

    let cancelled =
      false;

    const loadModel =
      async () => {
        setLoadingModel(
          true,
        );

        setModelError(
          null,
        );

        try {
          const modelPath =
            character.model!
              .filePath;

          const modelType =
            character.model!
              .modelType
              ?.toLowerCase() ||
            'glb';

          const cacheKey =
            `${modelPath}-${modelType}`;

          let loadedModel:
            THREE.Group;

          // ================================================
          // PRIMARY MODEL
          // ================================================

          if (
            modelCache.has(
              cacheKey,
            )
          ) {
            loadedModel =
              modelCache
                .get(
                  cacheKey,
                )!
                .clone();
          } else {
            switch (
              modelType
            ) {
              case 'fbx': {
                loadedModel =
                  await new FBXLoader()
                    .loadAsync(
                      modelPath,
                    ) as THREE.Group;

                break;
              }

              case 'obj': {
                loadedModel =
                  await new OBJLoader()
                    .loadAsync(
                      modelPath,
                    ) as unknown as THREE.Group;

                break;
              }

              default: {
                const gltf =
                  await new GLTFLoader()
                    .loadAsync(
                      modelPath,
                    );

                loadedModel =
                  gltf.scene;

                /**
                 * Preserve GLTF animations on the generic
                 * THREE.Group.
                 */
                loadedModel.animations =
                  gltf.animations;

                break;
              }
            }

            modelCache.set(
              cacheKey,
              loadedModel.clone(),
            );
          }

          if (
            cancelled
          ) {
            return;
          }

          // ================================================
          // TRANSFORM
          // ================================================

          const modelScale =
            parseFloat(
              character.model!
                .scale ||
                '1',
            ) *
            (
              character.scale ||
              1
            );

          loadedModel
            .scale
            .setScalar(
              modelScale,
            );

          const rotationY =
            parseFloat(
              character.model!
                .rotationY ||
                '0',
            ) +
            (
              character.rotation ||
              0
            );

          loadedModel.rotation.y =
            rotationY *
            Math.PI /
            180;

          // ================================================
          // GROUND MODEL
          // ================================================

          loadedModel.updateMatrixWorld(
            true,
          );

          const modelBox =
            new THREE.Box3()
              .setFromObject(
                loadedModel,
              );

          if (
            Number.isFinite(
              modelBox.min.y,
            )
          ) {
            loadedModel.position.y -=
              modelBox.min.y;
          }

          // ================================================
          // SHADOWS
          // ================================================

          loadedModel.traverse(
            (
              child,
            ) => {
              if (
                child instanceof
                THREE.Mesh
              ) {
                child.castShadow =
                  true;

                child.receiveShadow =
                  true;
              }
            },
          );

          // ================================================
          // EMBEDDED ANIMATIONS
          // ================================================

          const embeddedClips =
            (
              loadedModel
                .animations ||
              []
            ).map(
              (
                clip,
              ) =>
                clip.clone(),
            );

          // ================================================
          // EXTERNAL ANIMATIONS
          // ================================================

          const externalSources =
            getExternalAnimationSourcesForModel(
              character.model!
                .modelName,

              character.model!
                .filePath,
            );

          const externalLibrary =
            await loadExternalCharacterAnimations(
              externalSources,
            );

          if (
            cancelled
          ) {
            return;
          }

          // ================================================
          // MERGE ANIMATIONS
          // ================================================

          const clipByName =
            new Map<
              string,
              THREE.AnimationClip
            >();

          for (
            const clip
            of embeddedClips
          ) {
            clipByName.set(
              clip.name.toLowerCase(),
              clip,
            );
          }

          /**
           * External normalized clips are added second.
           *
           * Therefore:
           *
           * idle
           * walk
           * run
           *
           * from the verified library take priority over
           * embedded clips with matching normalized names.
           */
          for (
            const clip
            of externalLibrary
              .clips
          ) {
            clipByName.set(
              clip.name.toLowerCase(),
              clip,
            );
          }

          const animations =
            Array.from(
              clipByName.values(),
            );

          animationsRef.current =
            animations;

          /**
           * Maintain compatibility with any existing code
           * that still reads model.animations.
           */
          loadedModel.animations =
            animations;

          // ================================================
          // ANIMATION MIXER
          // ================================================

          mixerRef
            .current
            ?.stopAllAction();

          animationMixers.delete(
            character.id,
          );

          const mixer =
            animations.length >
            0
              ? new THREE.AnimationMixer(
                  loadedModel,
                )
              : null;

          mixerRef.current =
            mixer;

          if (mixer) {
            animationMixers.set(
              character.id,
              mixer,
            );
          }

          // ================================================
          // ANIMATION MAP
          // ================================================

          const overrides =
            character.model
              ?.metadata
              ?.animationMap;

          animMapRef.current =
            buildAnimationMap(
              animations.map(
                (
                  animation,
                ) =>
                  animation.name,
              ),
              overrides,
            );

          // ================================================
          // INITIAL ACTION
          // ================================================

          currentActionRef.current =
            null;

          movementState.current
            .lastAnimation =
            null;

          movementState.current
            .isMoving =
            false;

          if (
            mixer &&
            animations.length >
              0
          ) {
            const available =
              animations.map(
                (
                  animation,
                ) =>
                  animation.name,
              );

            const clipName =
              getAnimationForMovement(
                character
                  .movementType,
                false,
                available,
              );

            if (
              clipName
            ) {
              const clip =
                findClip(
                  animMapRef.current,
                  animations,
                  clipName,
                );

              if (
                clip
              ) {
                const action =
                  mixer.clipAction(
                    clip,
                  );

                action.timeScale =
                  character
                    .animationSpeed ||
                  1;

                action
                  .reset()
                  .play();

                currentActionRef.current =
                  action;

                movementState.current
                  .lastAnimation =
                  clipName;
              }
            }
          }

          // ================================================
          // DEBUG
          // ================================================

          console.info(
            `[GardenCharacter] Loaded model "${character.model!.modelName}"`,
            {
              modelPath,

              modelType,

              embeddedAnimations:
                embeddedClips.map(
                  (
                    clip,
                  ) =>
                    clip.name,
                ),

              externalAnimations:
                externalLibrary
                  .clips
                  .map(
                    (
                      clip,
                    ) =>
                      clip.name,
                  ),

              availableAnimations:
                animations.map(
                  (
                    clip,
                  ) =>
                    clip.name,
                ),
            },
          );

          // ================================================
          // COMPLETE
          // ================================================

          if (
            !cancelled
          ) {
            setModel(
              loadedModel,
            );
          }
        } catch (
          error
        ) {
          if (
            !cancelled
          ) {
            console.error(
              '[GardenCharacter] Error loading character:',
              error,
            );

            setModelError(
              error instanceof
                Error
                ? error.message
                : String(
                    error,
                  ),
            );
          }
        } finally {
          if (
            !cancelled
          ) {
            setLoadingModel(
              false,
            );
          }
        }
      };

    loadModel();

    return () => {
      cancelled =
        true;

      if (
        mixerRef.current &&
        taskFinishedRef.current
      ) {
        mixerRef.current.removeEventListener(
          'finished',
          taskFinishedRef.current,
        );
        taskFinishedRef.current = null;
      }

      if (taskCleanupTimeoutRef.current) {
        clearTimeout(taskCleanupTimeoutRef.current);
        taskCleanupTimeoutRef.current = null;
      }

      taskLockedRef.current = false;

      mixerRef
        .current
        ?.stopAllAction();

      mixerRef.current =
        null;

      currentActionRef.current =
        null;

      animationsRef.current =
        [];

      animMapRef.current =
        null;

      animationMixers.delete(
        character.id,
      );

      activeCharacterPositions.delete(
        character.id,
      );
    };
  }, [
    character,
  ]);

  // ======================================================
  // ANIMATION SWITCHING
  // ======================================================

  const switchAnimation =
    (
      clipName: string,
      timeScale: number,
    ) => {
      const mixer =
        mixerRef.current;

      if (
        !mixer
      ) {
        return;
      }

      if (
        movementState.current
          .lastAnimation ===
        clipName
      ) {
        return;
      }

      const animations =
        animationsRef.current;

      const clip =
        findClip(
          animMapRef.current,
          animations,
          clipName,
        );

      if (
        !clip
      ) {
        console.warn(
          `[GardenCharacter] Animation "${clipName}" could not be resolved.`,
        );

        return;
      }

      const newAction =
        mixer.clipAction(
          clip,
        );

      newAction.timeScale =
        timeScale;

      newAction
        .reset()
        .play();

      if (
        currentActionRef.current
      ) {
        currentActionRef.current
          .crossFadeTo(
            newAction,
            CROSSFADE_DURATION,
            false,
          );
      }

      currentActionRef.current =
        newAction;

      movementState.current
        .lastAnimation =
        clipName;
    };

  // ======================================================
  // SEMANTIC TASK ACTION — DETAILS CARD EVENT
  // ======================================================

  /**
   * Plays a normalized external task clip once, temporarily pausing
   * Garden locomotion. When the real AnimationMixer finished event
   * fires, the task action is fully stopped and normal locomotion is
   * restored.
   */
  const playTaskAction = (taskName: string, target?: unknown) => {
    const mixer = mixerRef.current;

    if (!mixer || taskLockedRef.current) {
      return;
    }

    const clip = findClip(
      animMapRef.current,
      animationsRef.current,
      taskName,
    );

    if (!clip) {
      console.warn(
        `[GardenCharacter] No normalized "${taskName}" clip is available for ${character.name}.`,
      );
      return;
    }

    const taskAction = mixer.clipAction(clip);

    taskLockedRef.current = true;

    // Remove any stale completion listener before starting another task.
    if (taskFinishedRef.current) {
      mixer.removeEventListener(
        'finished',
        taskFinishedRef.current,
      );
      taskFinishedRef.current = null;
    }

    taskAction.enabled = true;
    taskAction.setEffectiveWeight(1);
    taskAction.setEffectiveTimeScale(character.animationSpeed || 1);
    taskAction.setLoop(THREE.LoopOnce, 1);
    taskAction.clampWhenFinished = true;
    taskAction.reset().play();

    if (
      currentActionRef.current &&
      currentActionRef.current !== taskAction
    ) {
      currentActionRef.current.crossFadeTo(
        taskAction,
        CROSSFADE_DURATION,
        false,
      );
    }

    currentActionRef.current = taskAction;
    movementState.current.lastAnimation = taskName;

    const handleFinished = (event: any) => {
      if (event.action !== taskAction) {
        return;
      }

      mixer.removeEventListener('finished', handleFinished);
      taskFinishedRef.current = null;

      /**
       * IMPORTANT: do NOT stop the completed task action yet.
       *
       * It is clamped on its final pose right now. Keeping that pose active
       * for the short crossfade back to locomotion prevents the skeleton from
       * flashing through the FBX bind/T-pose between actions.
       */
      taskLockedRef.current = false;

      const available = animationsRef.current.map(
        (animation) => animation.name,
      );

      const clipName = getAnimationForMovement(
        character.movementType,
        movementState.current.isMoving,
        available,
      );

      // Force locomotion to restart, but leave currentActionRef pointing at
      // taskAction so switchAnimation() crossfades FROM the task pose.
      movementState.current.lastAnimation = null;

      if (clipName) {
        const timeScale = movementState.current.isMoving
          ? (character.animationSpeed || 1) *
            (character.movementSpeed || 1)
          : character.animationSpeed || 1;

        switchAnimation(clipName, timeScale);
      }

      // Report the completed semantic action back to the page-level world-action layer.
      window.dispatchEvent(
        new CustomEvent('garden-character-action-complete', {
          detail: {
            characterId: character.id,
            characterName: character.name,
            action: taskName,
            target: target ?? null,
          },
        }),
      );

      // Only after the crossfade has had time to complete do we fully stop
      // and disable the old one-shot action.
      if (taskCleanupTimeoutRef.current) {
        clearTimeout(taskCleanupTimeoutRef.current);
      }

      taskCleanupTimeoutRef.current = setTimeout(() => {
        taskAction.stop();
        taskAction.enabled = false;
        taskAction.clampWhenFinished = false;
        taskCleanupTimeoutRef.current = null;
      }, Math.ceil(CROSSFADE_DURATION * 1000) + 50);
    };

    taskFinishedRef.current = handleFinished;
    mixer.addEventListener('finished', handleFinished);
  };

  /**
   * Minimal bridge from the page-level DetailsCard to this GardenCharacter.
   * The event is targeted by characterId, so multiple Garden characters can
   * coexist without responding to one another's action buttons.
   */
  useEffect(() => {
    const handleGardenAction = (event: Event) => {
      const customEvent = event as CustomEvent<{
        characterId?: number;
        action?: string;
        target?: unknown;
      }>;

      if (customEvent.detail?.characterId !== character.id) {
        return;
      }

      const action = customEvent.detail?.action;
      if (!action) {
        return;
      }

      playTaskAction(action, customEvent.detail?.target);
    };

    window.addEventListener(
      'garden-character-action',
      handleGardenAction,
    );

    return () => {
      window.removeEventListener(
        'garden-character-action',
        handleGardenAction,
      );
    };
  }, [character.id]);

  // ======================================================
  // FRAME LOOP
  // ======================================================

  useFrame(
    (
      _,
      delta,
    ) => {
      // ================================================
      // ANIMATION MIXER
      // ================================================

      mixerRef.current?.update(
        delta,
      );

      // ================================================
      // POSITION REGISTRY
      // ================================================

      if (
        groupRef.current
      ) {
        activeCharacterPositions.set(
          character.id,

          groupRef.current
            .getWorldPosition(
              new THREE.Vector3(),
            ),
        );
      }

      // Keep the mixer advancing above, but pause physical Garden movement
      // while a one-shot task such as watering is playing.
      if (taskLockedRef.current) {
        return;
      }

      // console.log('[GardenCharacter movement]', {
      //   name: character.name,
      //   status: character.status,
      //   visible: character.visible,
      //   isTimeActive,
      //   isCharacterActive,
      //   movementType: character.movementType,
      //   movementRadius: character.movementRadius,
      //   movementSpeed: character.movementSpeed,
      // });

      // ================================================
      // INACTIVE / STATIONARY
      // ================================================

      if (
        !groupRef.current ||
        !isCharacterActive ||
        character.movementType ===
          'stationary'
      ) {
        /**
         * If the character was moving and then became
         * stationary/inactive, return to idle.
         */
        if (
          movementState.current
            .isMoving
        ) {
          movementState.current
            .isMoving =
            false;

          const available =
            animationsRef.current
              .map(
                (
                  animation,
                ) =>
                  animation.name,
              );

          const clipName =
            getAnimationForMovement(
              character
                .movementType,
              false,
              available,
            );

          if (
            clipName
          ) {
            switchAnimation(
              clipName,

              character
                .animationSpeed ||
                1,
            );
          }
        }

        return;
      }

      const group =
        groupRef.current;

      const position =
        group.position;

      const speed =
        (
          character
            .movementSpeed ||
          0
        ) *
        delta;

      let targetReached =
        false;

      // ================================================
      // MOVEMENT TYPE
      // ================================================

      switch (
        character.movementType
      ) {
        // ------------------------------------------------
        // WANDER
        // ------------------------------------------------

        case 'wander': {
          if (
            position.distanceTo(
              movementState.current
                .targetPosition,
            ) <
            0.1
          ) {
            const angle =
              Math.random() *
              Math.PI *
              2;

            const radius =
              Math.random() *
              (
                character
                  .movementRadius ||
                0
              );

            movementState.current
              .targetPosition =
              new THREE.Vector3(
                homeX +
                  Math.cos(
                    angle,
                  ) *
                    radius,

                homeY,

                homeZ +
                  Math.sin(
                    angle,
                  ) *
                    radius,
              );
          }

          break;
        }

        // ------------------------------------------------
        // PATROL
        // ------------------------------------------------

        case 'patrol': {
          if (
            character
              .patrolWaypoints &&
            character
              .patrolWaypoints
              .length >
              0
          ) {
            const waypoints =
              character
                .patrolWaypoints;

            const target =
              waypoints[
                movementState.current
                  .patrolIndex
              ];

            const targetPosition =
              new THREE.Vector3(
                target.x,
                target.y,
                target.z,
              );

            if (
              position.distanceTo(
                targetPosition,
              ) <
              0.2
            ) {
              movementState.current
                .patrolIndex =
                (
                  movementState.current
                    .patrolIndex +
                  1
                ) %
                waypoints.length;
            } else {
              movementState.current
                .targetPosition =
                targetPosition;
            }
          }

          break;
        }

        // ------------------------------------------------
        // CIRCLE
        // ------------------------------------------------

        case 'circle': {
          const time =
            Date.now() *
            0.001 *
            (
              character
                .movementSpeed ||
              1
            );

          const radius =
            character
              .movementRadius ||
            0;

          movementState.current
            .targetPosition =
            new THREE.Vector3(
              homeX +
                Math.cos(
                  time,
                ) *
                  radius,

              homeY,

              homeZ +
                Math.sin(
                  time,
                ) *
                  radius,
            );

          break;
        }

        // ------------------------------------------------
        // FOLLOW
        // ------------------------------------------------

        case 'follow': {
          let targetPosition:
            THREE.Vector3 | null =
            null;

          if (
            character
              .followTarget ===
            'camera'
          ) {
            /**
             * Camera target is handled elsewhere.
             */
            targetPosition =
              null;
          } else {
            const numericId =
              Number(
                character
                  .followTarget,
              );

            if (
              Number.isFinite(
                numericId,
              )
            ) {
              const target =
                activeCharacterPositions
                  .get(
                    numericId,
                  );

              if (
                target
              ) {
                targetPosition =
                  target.clone();
              }
            }

            /**
             * Preserve original string-ID fallback.
             */
            if (
              !targetPosition
            ) {
              for (
                const [
                  id,
                  target,
                ]
                of activeCharacterPositions
              ) {
                if (
                  String(
                    id,
                  ) ===
                  character
                    .followTarget
                ) {
                  targetPosition =
                    target.clone();

                  break;
                }
              }
            }
          }

          if (
            targetPosition
          ) {
            const toTarget =
              targetPosition
                .clone()
                .sub(
                  position,
                );

            if (
              toTarget.length() >
              (
                character
                  .followDistance ||
                0
              )
            ) {
              movementState.current
                .targetPosition =
                targetPosition
                  .clone()
                  .add(
                    toTarget
                      .normalize()
                      .multiplyScalar(
                        -(
                          character
                            .followDistance ||
                          0
                        ) *
                          0.8,
                      ),
                  );
            }
          }

          break;
        }

        // ------------------------------------------------
        // TELEPORT
        // ------------------------------------------------

        case 'teleport': {
          if (
            character
              .teleportPositions &&
            character
              .teleportPositions
              .length >
              0
          ) {
            movementState.current
              .teleportTimer +=
              delta;

            if (
              movementState.current
                .teleportTimer >=
              (
                character
                  .teleportInterval ||
                1
              )
            ) {
              movementState.current
                .teleportTimer =
                0;

              const randomIndex =
                Math.floor(
                  Math.random() *
                    character
                      .teleportPositions
                      .length,
                );

              const target =
                character
                  .teleportPositions[
                    randomIndex
                  ];

              group.position.set(
                target.x,
                target.y,
                target.z,
              );

              targetReached =
                true;
            }
          }

          if (
            targetReached
          ) {
            return;
          }

          break;
        }
      }

      // ================================================
      // MOVE TOWARD TARGET
      // ================================================

      const direction =
        movementState.current
          .targetPosition
          .clone()
          .sub(
            position,
          );

      const distance =
        direction.length();

      if (
        distance >
        0.05
      ) {
        direction.normalize();

        position.x +=
          direction.x *
          speed;

        position.z +=
          direction.z *
          speed;

        // ==============================================
        // FACE MOVEMENT DIRECTION
        // ==============================================

        if (
          direction.x !==
            0 ||
          direction.z !==
            0
        ) {
          group.rotation.y =
            Math.atan2(
              direction.x,
              direction.z,
            );
        }
      }

      // ================================================
      // MOVEMENT ANIMATION STATE
      // ================================================

      const isMoving =
        distance >
        0.05;

      if (
        movementState.current
          .isMoving !==
        isMoving
      ) {
        movementState.current
          .isMoving =
          isMoving;

        const available =
          animationsRef.current
            .map(
              (
                animation,
              ) =>
                animation.name,
            );

        const clipName =
          getAnimationForMovement(
            character
              .movementType,
            isMoving,
            available,
          );

        if (
          clipName
        ) {
          const timeScale =
            isMoving
              ? (
                  character
                    .animationSpeed ||
                  1
                ) *
                (
                  character
                    .movementSpeed ||
                  1
                )

              : character
                  .animationSpeed ||
                1;

          switchAnimation(
            clipName,
            timeScale,
          );
        }
      }
    },
  );

  // ======================================================
  // DISPLAY VISIBILITY
  // ======================================================

  const isVisible =
    character.status ===
      'active' &&
    character.visible &&
    isTimeActive;

  // ======================================================
  // FALLBACK CHARACTER
  // ======================================================

  if (
    !character.model
      ?.filePath ||
    modelError ||
    (
      !model &&
      !loadingModel
    )
  ) {
    const colorMap:
      Record<
        string,
        string
      > = {
        animal:
          '#D2691E',

        bird:
          '#87CEEB',

        insect:
          '#32CD32',

        mythical:
          '#9370DB',

        human:
          '#FFB6C1',

        robot:
          '#A9A9A9',

        decoration:
          '#FFD700',
      };

    const boxColor =
      colorMap[
        character.type
      ] ||
      '#FF69B4';

    const opacity =
      isVisible
        ? 1
        : 0.4;

    return (
      <group
        position={[
          homeX,
          homeY,
          homeZ,
        ]}
      >
        <mesh
          castShadow
          receiveShadow
          position={[
            0,
            0.4,
            0,
          ]}
        >
          <cylinderGeometry
            args={[
              0.3,
              0.4,
              0.8,
              8,
            ]}
          />

          <meshStandardMaterial
            color={
              boxColor
            }
            transparent={
              !isVisible
            }
            opacity={
              opacity
            }
          />
        </mesh>
      </group>
    );
  }

  // ======================================================
  // REAL CHARACTER
  // ======================================================

  return (
    <group
      ref={
        groupRef
      }

      position={[
        homeX,
        homeY,
        homeZ,
      ]}

      visible={
        character.visible
      }


      onPointerOver={() =>
        setHovered(
          true,
        )
      }

      onPointerOut={() =>
        setHovered(
          false,
        )
      }
    >
      {model && (
        <primitive
          object={
            model
          }
        />
      )}

      {/* =================================================
          EMOTE
      ================================================= */}

      {currentEmote && (
        <Html
          position={[
            0,
            1.5,
            0,
          ]}
          center
        >
          <div
            className="
              bg-white
              dark:bg-gray-800
              rounded-full
              p-2
              shadow-lg
              animate-bounce
            "
          >
            {currentEmote ===
              'happy' && (
              <span className="text-2xl">
                😊
              </span>
            )}

            {currentEmote ===
              'sad' && (
              <span className="text-2xl">
                😢
              </span>
            )}

            {currentEmote ===
              'surprised' && (
              <span className="text-2xl">
                😲
              </span>
            )}

            {currentEmote ===
              'angry' && (
              <span className="text-2xl">
                😠
              </span>
            )}

            {currentEmote ===
              'wave' && (
              <span className="text-2xl">
                👋
              </span>
            )}

            {currentEmote ===
              'dance' && (
              <span className="text-2xl">
                💃
              </span>
            )}

            {currentEmote ===
              'sleep' && (
              <span className="text-2xl">
                😴
              </span>
            )}
          </div>
        </Html>
      )}

      {/* =================================================
          MESSAGE
      ================================================= */}

      {showMessage && (
        <Html
          position={[
            0,
            2,
            0,
          ]}
          center
        >
          <div
            className="
              bg-black/80
              text-white
              px-3
              py-1.5
              rounded-lg
              text-sm
              whitespace-nowrap
              shadow-lg
              animate-fade-in
            "
          >
            💬{' '}
            {showMessage}
          </div>
        </Html>
      )}

      {/* =================================================
          HOVER TOOLTIP
      ================================================= */}

      {hovered && (
        <Html
          position={[
            0,
            1.2,
            0,
          ]}
          center
          distanceFactor={
            10
          }
        >
          <div
            className="
              bg-black/80
              text-white
              px-2
              py-1
              rounded
              text-xs
              whitespace-nowrap
              shadow-lg
              pointer-events-none
            "
          >
            {character.name}
          </div>
        </Html>
      )}
    </group>
  );
}
