// src/components/threed/shared/EcctrlCharacter.tsx
// External Farmer animation integration

'use client';

import {
  useRef,
  useState,
  useCallback,
  useEffect,
} from 'react';

import { useFrame } from '@react-three/fiber';
import { useBeforePhysicsStep } from '@react-three/rapier';

import * as THREE from 'three';

import { Html } from '@react-three/drei';

import {
  Ecctrl,
  EcctrlAnimationStateController,
} from 'ecctrl';

import type {
  EcctrlHandle,
  EcctrlAnimationState,
  EcctrlAnimationStateContext,
} from 'ecctrl';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

import { FadingRing } from './FadingRing';
import { PulseRing } from './PulseRing';

import {
  buildAnimationMap,
  type AnimationMap,
} from '@/lib/utils/animation';

import {
  getExternalAnimationSourcesForModel,
  loadExternalCharacterAnimations,
} from '@/lib/utils/externalCharacterAnimations';

import {
  planThreeDInteractionApproach,
  planThreeDTargetRelativeNavigation,
  THREED_INTERACTION_FACING_TOLERANCE,
} from '@/lib/services/threed/orchestration/interaction-core';

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

    /**
     * Existing model metadata.
     *
     * We only care about animationMap here, but keeping
     * an index signature allows other metadata fields.
     */
    metadata?: {
      animationMap?: Record<string, string>;
      [key: string]: unknown;
    };
  };

  defaultAnimation: string;
  animationSpeed: number;

  movementType: string;
  movementPattern?: string;

  movementRadius: number;
  movementSpeed: number;

  positionX: number;
  positionY: number;
  positionZ: number;

  rotation: number;
  scale: number;

  visible: boolean;

  interactable: boolean;
  interactionMessage: string;

  defaultEmote: string;

  soundEffect: string | null;
}

interface EcctrlCharacterProps {
  character: CharacterData;

  /**
   * Authoritative world position resolved by the ThreeD Runtime Marker layer.
   * Ecctrl must not independently derive its spawn position from Character data.
   */
  runtimePosition: [number, number, number];

  isControlled?: boolean;
  isSelected?: boolean;
  /** Layer authority without unmounting the Ecctrl instance. */
  layerEnabled?: boolean;

  onClick?: () => void;

  onControlChange?: (
    pos: {
      x: number;
      y: number;
      z: number;
    }
  ) => void;

  /**
   * Shared ref.
   *
   * The character writes its world position here each frame
   * while controlled.
   *
   * The parent can read it for camera following without
   * triggering React re-renders.
   */
  cameraFollowRef?: React.MutableRefObject<
    THREE.Vector3 | null
  >;

  /**
   * Persistent live-position map.
   */
  livePositionsRef?: React.MutableRefObject<
    Map<
      string,
      {
        x: number;
        y: number;
        z: number;
      }
    >
  >;

  markerId?: string;

  /**
   * Optional world-space target used to make controlled WASD independent of
   * camera perspective while approaching an interaction target.
   */
  movementTargetPosition?: {
    x: number;
    y: number;
    z: number;
  };

  isActionTarget?: boolean;

  /** Reports that the complete visual runtime or its safe fallback is ready. */
  onRuntimeSettled?: () => void;
}

// ========================================================
// ECCTRL BODY / GROUND CONSTANTS
// ========================================================

/**
 * The Ecctrl capsule body's origin is its CENTER.
 *
 * When resting on the ground, the center sits:
 *
 * capsuleHalfHeight
 * + capsuleRadius
 * + floatHeight
 *
 * above the ground.
 */
const CAPSULE_HALF_HEIGHT = 0.6;
const CAPSULE_RADIUS = 0.3;
const FLOAT_HEIGHT = 0.3;

const GROUND_OFFSET =
  CAPSULE_HALF_HEIGHT +
  CAPSULE_RADIUS +
  FLOAT_HEIGHT;

/**
 * Small extra initial lift so gravity can settle
 * the body naturally.
 */
const SPAWN_LIFT = 0.75;

// ========================================================
// ANIMATION CONSTANTS
// ========================================================

/**
 * Duration in seconds for animation crossfades.
 */
const CROSSFADE_DURATION = 0.25;

/**
 * Existing Ecctrl state clip candidates.
 *
 * We retain this definition for compatibility/documentation.
 *
 * Our external Farmer clips are normalized to:
 *
 * idle
 * walk
 * run
 *
 * so the central buildAnimationMap() resolver can resolve
 * them directly.
 */
const STATE_CLIPS:
  Record<EcctrlAnimationState, string[]> = {
    IDLE: [
      'idle',
      'idle_loop',
      'stand',
      'standing',
    ],

    WALK: [
      'walk',
      'walking',
      'walk_loop',
    ],

    RUN: [
      'run',
      'running',
      'sprint',
      'run_loop',
    ],

    JUMP_START: [
      'jump_start',
      'jumpstart',
      'jump',
      'jump_up',
    ],

    JUMP_IDLE: [
      'jump_idle',
      'jump',
      'float',
    ],

    JUMP_FALL: [
      'jump_fall',
      'fall',
      'falling',
    ],

    JUMP_LAND: [
      'jump_land',
      'land',
      'landing',
    ],
  };

// Avoid unused-variable errors in stricter TS configs while
// retaining the state-candidate documentation above.
void STATE_CLIPS;

// ========================================================
// ECCTRL ANIMATION STATE RESOLVER
// ========================================================

function createAnimationResolver():
  (
    ctx: EcctrlAnimationStateContext
  ) => EcctrlAnimationState {

  /**
   * Mirrors Ecctrl's canonical state flow:
   *
   * jump start
   * ↓
   * air
   * ↓
   * fall
   * ↓
   * land
   */
  return ({
    isOnGround,
    wasOnGround,
    isFalling,
    isMoving,
    runActive,
    jumpActive,
  }) => {
    if (
      jumpActive &&
      wasOnGround
    ) {
      return 'JUMP_START';
    }

    if (isOnGround) {
      if (!wasOnGround) {
        return 'JUMP_LAND';
      }

      if (isMoving) {
        return runActive
          ? 'RUN'
          : 'WALK';
      }

      return 'IDLE';
    }

    if (isFalling) {
      return 'JUMP_FALL';
    }

    return 'JUMP_IDLE';
  };
}

// ========================================================
// CHARACTER MODEL HOOK
// ========================================================

function useCharacterModel(
  character: CharacterData,
  isActive: boolean,
) {
  const [
    model,
    setModel,
  ] =
    useState<THREE.Group | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  const [
    animations,
    setAnimations,
  ] =
    useState<string[]>([]);

  /**
   * Mixer and actions remain refs because they do not
   * need to trigger React renders.
   */
  const mixerRef =
    useRef<THREE.AnimationMixer | null>(
      null
    );

  const actionsRef =
    useRef<
      Map<
        string,
        THREE.AnimationAction
      >
    >(
      new Map()
    );

  /**
   * Maps logical app actions:
   *
   * idle
   * walk
   * run
   *
   * to actual available clip names.
   */
  const animMapRef =
    useRef<AnimationMap | null>(
      null
    );

  useEffect(() => {
    if (
      !isActive ||
      !character.model?.filePath
    ) {
      return;
    }

    let cancelled = false;

    const loadModel =
      async () => {
        setLoading(true);
        setError(null);

        try {
          const modelPath =
            character.model!
              .filePath;

          const modelType =
            character.model!
              .modelType
              ?.toLowerCase() ||
            'glb';

          let loadedModel:
            THREE.Group;

          // ==================================================
          // LOAD THE SCENE-OWNED CHARACTER VISUAL
          // ==================================================

          // Animated Character objects are mutable runtime state. A visual
          // hierarchy must never outlive or be shared between Scene marker
          // owners, because its bones and mixer retain instance transforms.
          // Browser asset caching may reuse downloaded bytes, while this load
          // creates a new Three.js object hierarchy for this Ecctrl instance.
          if (
            modelType ===
            'fbx'
          ) {
            loadedModel =
              await new FBXLoader()
                .loadAsync(
                  modelPath
                ) as THREE.Group;
          } else if (
            modelType ===
            'obj'
          ) {
            loadedModel =
              await new OBJLoader()
                .loadAsync(
                  modelPath
                ) as unknown as THREE.Group;
          } else {
            /**
             * Preserve GLTF animations on the scene object.
             *
             * Your existing component later reads
             * loadedModel.animations, so copy the GLTF
             * animation array onto the scene.
             */
            const gltf =
              await new GLTFLoader()
                .loadAsync(
                  modelPath
                );

            loadedModel =
              gltf.scene;

            loadedModel.animations =
              gltf.animations;
          }

          if (cancelled) {
            return;
          }

          // ==================================================
          // MODEL TRANSFORMS
          // ==================================================

          loadedModel.scale.setScalar(
            parseFloat(
              character.model!
                .scale ||
                '1'
            ) *
            (
              character.scale ||
              1
            )
          );

          loadedModel.rotation.y =
            (
              parseFloat(
                character.model!
                  .rotationY ||
                  '0'
              ) +
              (
                character.rotation ||
                0
              )
            ) *
            Math.PI /
            180;

          /**
           * Enable shadows.
           */
          loadedModel.traverse(
            (
              child
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
            }
          );

          // ==================================================
          // BUILD ANIMATION LIBRARY
          // ==================================================

          /**
           * Begin with clips embedded directly in the model.
           *
           * Clone them so we can safely manipulate them.
           */
          const embeddedClips =
            (
              (
                loadedModel
                  .animations ||
                []
              ) as THREE.AnimationClip[]
            ).map(
              (
                clip
              ) =>
                clip.clone()
            );

          /**
           * Look for a verified external animation library
           * for this model.
           *
           * Right now:
           *
           * Farmer Female → external library
           * everything else → []
           */
          const externalSources =
            getExternalAnimationSourcesForModel(
              character.model!
                .modelName,

              character.model!
                .filePath
            );

          /**
           * Load and normalize the external FBX clips.
           *
           * Example:
           *
           * Walking.fbx
           * internal clip "mixamo.com"
           *
           * becomes:
           *
           * clip.name = "walk"
           */
          const externalLibrary =
            await loadExternalCharacterAnimations(
              externalSources
            );

          if (cancelled) {
            return;
          }

          // ==================================================
          // MERGE EMBEDDED + EXTERNAL CLIPS
          // ==================================================

          /**
           * Use a case-insensitive map so duplicate logical
           * animation names are resolved cleanly.
           *
           * External normalized clips are inserted second,
           * so they override embedded clips with the same name.
           */
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
              clip
            );
          }

          for (
            const clip
            of externalLibrary
              .clips
          ) {
            clipByName.set(
              clip.name.toLowerCase(),
              clip
            );
          }

          const clips =
            Array.from(
              clipByName.values()
            );

          // ==================================================
          // CREATE MIXER + ACTION LOOKUP
          // ==================================================

          actionsRef
            .current
            .clear();

          mixerRef.current =
            null;

          setAnimations(
            clips.map(
              (
                clip
              ) =>
                clip.name
            )
          );

          if (
            clips.length >
            0
          ) {
            const mixer =
              new THREE
                .AnimationMixer(
                  loadedModel
                );

            for (
              const clip
              of clips
            ) {
              const action =
                mixer.clipAction(
                  clip
                );

              actionsRef
                .current
                .set(
                  clip.name.toLowerCase(),
                  action
                );
            }

            mixerRef.current =
              mixer;
          }

          // ==================================================
          // BUILD APP ANIMATION MAP
          // ==================================================

          const overrides =
            character.model
              ?.metadata
              ?.animationMap;

          animMapRef.current =
            buildAnimationMap(
              clips.map(
                (
                  clip
                ) =>
                  clip.name
              ),
              overrides
            );

          // ==================================================
          // DEBUG INFO
          // ==================================================

          if (
            externalLibrary
              .clips.length >
            0
          ) {
            console.debug(
              `[EcctrlCharacter] External animation library loaded for "${character.model!.modelName}"`,
              {
                externalClips:
                  externalLibrary
                    .clips
                    .map(
                      (
                        clip
                      ) =>
                        clip.name
                    ),

                allClips:
                  clips.map(
                    (
                      clip
                    ) =>
                      clip.name
                  ),
              }
            );
          }

          // Publish the complete Character unit only after its mixer, actions,
          // and semantic animation map are ready. This prevents a base-pose
          // model from entering the already-running Rapier Scene first.
          setModel(loadedModel);

        } catch (
          loadError
        ) {
          if (
            !cancelled
          ) {
            console.error(
              '[EcctrlCharacter] Failed to load character:',
              loadError
            );

            setError(
              String(
                loadError
              )
            );
          }
        } finally {
          if (
            !cancelled
          ) {
            setLoading(
              false
            );
          }
        }
      };

    loadModel();

    return () => {
      cancelled =
        true;

      mixerRef
        .current
        ?.stopAllAction();

      mixerRef.current =
        null;

      actionsRef
        .current
        .clear();

      animMapRef.current =
        null;
    };
  }, [
    character,
    isActive,
  ]);

  return {
    model,
    loading,
    error,
    animations,

    mixerRef,
    actionsRef,
    animMapRef,
  };
}

// ========================================================
// KEYBOARD INPUT HOOK
// ========================================================

function useWASD(
  active: boolean
) {
  const keys =
    useRef({
      w: false,
      s: false,
      a: false,
      d: false,

      shift: false,

      space: false,
      spaceFired: false,
    });

  useEffect(() => {
    if (!active) {
      keys.current = {
        w: false,
        s: false,
        a: false,
        d: false,

        shift: false,

        space: false,
        spaceFired: false,
      };

      return;
    }

    const down =
      (
        e: KeyboardEvent
      ) => {
        if (
          e.target instanceof
            HTMLInputElement ||
          e.target instanceof
            HTMLTextAreaElement
        ) {
          return;
        }

        switch (
          e.key.toLowerCase()
        ) {
          case 'w':
          case 'arrowup':
            keys.current.w =
              true;
            e.preventDefault();
            break;

          case 's':
          case 'arrowdown':
            keys.current.s =
              true;
            e.preventDefault();
            break;

          case 'a':
          case 'arrowleft':
            keys.current.a =
              true;
            e.preventDefault();
            break;

          case 'd':
          case 'arrowright':
            keys.current.d =
              true;
            e.preventDefault();
            break;

          case 'shift':
            keys.current.shift =
              true;
            e.preventDefault();
            break;

          case ' ':
            if (
              !keys.current
                .space
            ) {
              keys.current.space =
                true;

              keys.current
                .spaceFired =
                false;
            }

            e.preventDefault();
            break;
        }
      };

    const up =
      (
        e: KeyboardEvent
      ) => {
        switch (
          e.key.toLowerCase()
        ) {
          case 'w':
          case 'arrowup':
            keys.current.w =
              false;
            e.preventDefault();
            break;

          case 's':
          case 'arrowdown':
            keys.current.s =
              false;
            e.preventDefault();
            break;

          case 'a':
          case 'arrowleft':
            keys.current.a =
              false;
            e.preventDefault();
            break;

          case 'd':
          case 'arrowright':
            keys.current.d =
              false;
            e.preventDefault();
            break;

          case 'shift':
            keys.current.shift =
              false;
            e.preventDefault();
            break;

          case ' ':
            keys.current.space =
              false;

            keys.current
              .spaceFired =
              false;

            e.preventDefault();
            break;
        }
      };

    window.addEventListener(
      'keydown',
      down
    );

    window.addEventListener(
      'keyup',
      up
    );

    return () => {
      window.removeEventListener(
        'keydown',
        down
      );

      window.removeEventListener(
        'keyup',
        up
      );
    };
  }, [
    active,
  ]);

  return keys;
}

// ========================================================
// COMPONENT
// ========================================================

export function EcctrlCharacter({
  character,

  runtimePosition,

  isControlled =
    false,

  isSelected =
    false,

  layerEnabled =
    true,

  onClick,

  onControlChange,

  cameraFollowRef,

  livePositionsRef,

  markerId,

  movementTargetPosition,

  isActionTarget = false,

  onRuntimeSettled,
}: EcctrlCharacterProps) {
  const ecctrlRef =
    useRef<EcctrlHandle>(
      null
    );

  const previousLayerEnabledRef =
    useRef(layerEnabled);
  const runtimePositionKey = `${runtimePosition[0]}:${runtimePosition[1]}:${runtimePosition[2]}`;
  const appliedRuntimePositionKeyRef = useRef(runtimePositionKey);
  const pendingRuntimePositionRef = useRef<{
    x: number;
    y: number;
    z: number;
  } | null>(null);

  useEffect(() => {
    if (appliedRuntimePositionKeyRef.current === runtimePositionKey) return;
    appliedRuntimePositionKeyRef.current = runtimePositionKey;
    pendingRuntimePositionRef.current = {
      x: runtimePosition[0],
      y: runtimePosition[1] + GROUND_OFFSET + 0.05,
      z: runtimePosition[2],
    };
  }, [runtimePositionKey, runtimePosition]);

  useBeforePhysicsStep(() => {
    const pending = pendingRuntimePositionRef.current;
    const body = ecctrlRef.current?.body;
    if (!pending || !body) return;
    pendingRuntimePositionRef.current = null;
    body.setTranslation(pending, true);
    body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  });

  useEffect(() => () => {
    // Ecctrl exposes Rapier values through this handle. Clear it before a
    // removed body can be read by a later R3F frame.
    ecctrlRef.current = null;
  }, []);

  const targetForwardDirectionRef =
    useRef(new THREE.Vector3(0, 0, 1));

  /**
   * Spawn above the resting body position and let gravity
   * settle the capsule.
   */
  const startY =
    runtimePosition[1] +
    GROUND_OFFSET +
    SPAWN_LIFT;

  const {
    model,
    loading,
    error,

    mixerRef,
    actionsRef,
    animMapRef,
  } =
    useCharacterModel(
      character,

      character.status ===
        'active' &&
        character.visible
    );

  const runtimeSettlementReportedRef = useRef(false);
  const runtimeSettlementKey = `${character.id}:${character.model?.filePath ?? 'fallback'}`;

  useEffect(() => {
    runtimeSettlementReportedRef.current = false;
  }, [runtimeSettlementKey]);

  useEffect(() => {
    const hasSafeFallback = !character.model?.filePath || error != null;
    if ((!model && !hasSafeFallback) || runtimeSettlementReportedRef.current) return;
    runtimeSettlementReportedRef.current = true;
    onRuntimeSettled?.();
  }, [character.model?.filePath, error, model, onRuntimeSettled]);

  useEffect(() => {
    if (previousLayerEnabledRef.current === layerEnabled) return;
    const ecctrl = ecctrlRef.current;
    if (!ecctrl?.body || !ecctrl.collider) return;
    previousLayerEnabledRef.current = layerEnabled;

    if (layerEnabled) {
      ecctrl.collider.setEnabled(true);
      ecctrl.body.setEnabled(true);
    } else {
      ecctrl.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      ecctrl.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      ecctrl.collider.setEnabled(false);
      ecctrl.body.setEnabled(false);
    }
  }, [error, layerEnabled, loading, model]);

  const [
    hovered,
    setHovered,
  ] =
    useState(false);

  const [
    currentEmote,
    setCurrentEmote,
  ] =
    useState<
      string | null
    >(null);

  /**
   * Keep the setter available for future interaction logic.
   */
  void setCurrentEmote;

  const currentActionRef =
    useRef<
      THREE.AnimationAction | null
    >(null);

  const lastClipNameRef =
    useRef<
      string | null
    >(null);

  /**
   * Semantic task animations temporarily own the mixer.
   *
   * Ecctrl still owns the physics body, but normal locomotion
   * animation changes are ignored until the task completes.
   */
  const taskLockedRef =
    useRef(false);

  const activeTaskRef =
    useRef<string | null>(null);

  const lastLocomotionStateRef =
    useRef<EcctrlAnimationState>('IDLE');

  const finishedListenerRef =
    useRef<((event: any) => void) | null>(null);

  const taskCleanupTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const taskFacingYawRef =
    useRef<number | null>(null);

  const taskFacingQuaternionRef =
    useRef(new THREE.Quaternion());

  const taskOrientationTransitionRef =
    useRef<{
      from: THREE.Quaternion;
      to: THREE.Quaternion;
      elapsed: number;
      duration: number;
    } | null>(null);

  /**
   * Limit React position updates while keeping interaction-range UI
   * responsive during controlled movement.
   */
  const lastControlPositionReportAtRef =
    useRef(0);

  const reportControlledPosition =
    useCallback(
      (position: { x: number; y: number; z: number }) => {
        if (
          !onControlChange
          || !Number.isFinite(position.x)
          || !Number.isFinite(position.y)
          || !Number.isFinite(position.z)
        ) {
          return;
        }

        const now = Date.now();

        if (
          now - lastControlPositionReportAtRef.current < 100
        ) {
          return;
        }

        lastControlPositionReportAtRef.current = now;
        onControlChange({
          x: position.x,
          y: position.y,
          z: position.z,
        });
      },
      [onControlChange]
    );

  const keys =
    useWASD(
      isControlled
    );

  // ======================================================
  // PLAY ANIMATION
  // ======================================================

  const playAnimation =
    useCallback(
      (
        state:
          EcctrlAnimationState,
        force = false
      ) => {
        if (
          taskLockedRef.current &&
          !force
        ) {
          return;
        }

        const mixer =
          mixerRef.current;

        const actions =
          actionsRef.current;

        if (
          !mixer ||
          actions.size ===
            0
        ) {
          return;
        }

        let action:
          THREE.AnimationAction
          | undefined;

        /**
         * Resolve the logical Ecctrl state through the App's
         * existing animation map.
         *
         * Example:
         *
         * IDLE → idle
         * WALK → walk
         * RUN  → run
         */
        const mappedClipName =
          animMapRef
            .current
            ?.resolve(
              state.toLowerCase()
            ) ??
          null;

        if (
          mappedClipName
        ) {
          action =
            actions.get(
              mappedClipName.toLowerCase()
            );
        } else if (
          state ===
            'IDLE' &&
          actions.size >
            0
        ) {
          /**
           * Existing fallback:
           * use the first available action.
           */
          action =
            actions
              .values()
              .next()
              .value;
        }

        if (!action) {
          return;
        }

        const clipName =
          action
            .getClip()
            .name;

        /**
         * Avoid restarting the same animation.
         */
        if (
          lastClipNameRef
            .current ===
          clipName
        ) {
          return;
        }

        action
          .reset()
          .setEffectiveTimeScale(
            character
              .animationSpeed ||
              1
          )
          .play();

        /**
         * Crossfade from the previous animation.
         */
        if (
          currentActionRef
            .current
        ) {
          currentActionRef
            .current
            .crossFadeTo(
              action,
              CROSSFADE_DURATION,
              false
            );
        }

        currentActionRef.current =
          action;

        lastClipNameRef.current =
          clipName;
      },
      [
        character.animationSpeed,
        mixerRef,
        actionsRef,
        animMapRef,
      ]
    );

  // ======================================================
  // ECCTRL ANIMATION CHANGE
  // ======================================================

  const handleAnimChange =
    useCallback(
      (
        state:
          EcctrlAnimationState
      ) => {
        /**
         * Always remember Ecctrl's most recent locomotion state.
         * While a semantic task is active we intentionally do not
         * let that state replace the task animation.
         */
        lastLocomotionStateRef.current =
          state;

        if (taskLockedRef.current) {
          return;
        }

        playAnimation(
          state
        );
      },
      [
        playAnimation,
      ]
    );

  /**
   * Start with Idle when the model becomes available.
   */
  useEffect(() => {
    if (model) {
      playAnimation(
        'IDLE'
      );
    }
  }, [
    model,
    playAnimation,
  ]);

  // ======================================================
  // SEMANTIC TASK ACTIONS
  // ======================================================

  const playTaskAction =
    useCallback(
      (taskName: string, target?: unknown) => {
        const mixer =
          mixerRef.current;

        const actions =
          actionsRef.current;

        if (
          !mixer ||
          actions.size === 0 ||
          taskLockedRef.current
        ) {
          return false;
        }

        /**
         * External Farmer clips are normalized, so semantic task
         * names such as "watering" and "pickFruit" can be
         * matched directly and case-insensitively.
         */
        const taskAction =
          actions.get(
            taskName.toLowerCase()
          );

        if (!taskAction) {
          console.warn(
            `[EcctrlCharacter] Task animation "${taskName}" is not available for ${character.name}.`
          );

          return false;
        }

        taskFacingYawRef.current = null;
        taskOrientationTransitionRef.current = null;

        let farmBotOriginalQuaternion: THREE.Quaternion | null = null;
        let farmBotTurnDelta = 0;

        if (
          target &&
          typeof target === 'object' &&
          'position' in target &&
          target.position != null
        ) {
          if (
            !('position' in target) ||
            !target.position ||
            typeof target.position !== 'object' ||
            !('x' in target.position) ||
            !('y' in target.position) ||
            !('z' in target.position) ||
            !ecctrlRef.current
          ) {
            return false;
          }

          try {
            const approach = planThreeDInteractionApproach({
              characterPosition: {
                x: ecctrlRef.current.currPos.x,
                y: ecctrlRef.current.currPos.y,
                z: ecctrlRef.current.currPos.z,
              },
              targetPosition: {
                x: Number(target.position.x),
                y: Number(target.position.y),
                z: Number(target.position.z),
              },
            });

            if (!approach.arrived) {
              return false;
            }

            const currentQuaternion = ecctrlRef.current.currQuat.clone();
            const originalForward = new THREE.Vector3(0, 0, 1)
              .applyQuaternion(currentQuaternion);
            const originalYaw = Math.atan2(
              originalForward.x,
              originalForward.z
            );
            farmBotTurnDelta = Math.atan2(
              Math.sin(approach.facingYaw - originalYaw),
              Math.cos(approach.facingYaw - originalYaw)
            );

            if (
              Math.abs(farmBotTurnDelta) >
              THREED_INTERACTION_FACING_TOLERANCE
            ) {
              farmBotOriginalQuaternion = currentQuaternion;
              taskFacingYawRef.current = approach.facingYaw;
              taskFacingQuaternionRef.current.setFromAxisAngle(
                new THREE.Vector3(0, 1, 0),
                approach.facingYaw
              );
            }
          } catch {
            return false;
          }
        }

        if (taskCleanupTimerRef.current) {
          clearTimeout(
            taskCleanupTimerRef.current
          );

          taskCleanupTimerRef.current =
            null;
        }

        if (finishedListenerRef.current) {
          mixer.removeEventListener(
            'finished',
            finishedListenerRef.current as any
          );

          finishedListenerRef.current =
            null;
        }

        const originalQuaternion = farmBotOriginalQuaternion;
        const turnAmount = Math.abs(farmBotTurnDelta);
        const outboundTurnAction = actions.get(
          farmBotTurnDelta >= 0 ? 'turnright' : 'turnleft'
        );

        if (
          originalQuaternion &&
          outboundTurnAction
        ) {
          const targetQuaternion = taskFacingQuaternionRef.current.clone();
          const turnDuration = THREE.MathUtils.clamp(
            0.3 + turnAmount * 0.3,
            0.35,
            1.1
          );

          const crossFadeTo = (
            action: THREE.AnimationAction,
            effectiveTimeScale: number,
            playInReverse = false
          ) => {
            action.enabled = true;
            action.setLoop(THREE.LoopOnce, 1);
            action.clampWhenFinished = true;
            action.reset();
            action.setEffectiveTimeScale(effectiveTimeScale);
            if (playInReverse) {
              action.time = action.getClip().duration;
            }
            action.play();
            if (currentActionRef.current && currentActionRef.current !== action) {
              currentActionRef.current.crossFadeTo(
                action,
                Math.min(CROSSFADE_DURATION, turnDuration / 2),
                false
              );
            }
            currentActionRef.current = action;
            lastClipNameRef.current = action.getClip().name;
          };

          const listenFor = (
            action: THREE.AnimationAction,
            onFinished: () => void
          ) => {
            const listener = (event: any) => {
              if (event.action !== action) return;
              mixer.removeEventListener('finished', listener as any);
              if (finishedListenerRef.current === listener) {
                finishedListenerRef.current = null;
              }
              onFinished();
            };
            finishedListenerRef.current = listener;
            mixer.addEventListener('finished', listener as any);
          };

          const finishSequence = () => {
            activeTaskRef.current = null;
            taskFacingYawRef.current = null;
            taskOrientationTransitionRef.current = null;
            taskLockedRef.current = false;
            lastClipNameRef.current = null;
            playAnimation(lastLocomotionStateRef.current, true);
            window.dispatchEvent(
              new CustomEvent('garden-character-action-complete', {
                detail: {
                  characterId: character.id,
                  characterName: character.name,
                  action: taskName,
                  target: target ?? null,
                },
              })
            );
            taskCleanupTimerRef.current = setTimeout(() => {
              outboundTurnAction.stop();
              outboundTurnAction.enabled = false;
              taskAction.stop();
              taskAction.enabled = false;
              taskCleanupTimerRef.current = null;
            }, CROSSFADE_DURATION * 1000 + 40);
          };

          const startReturnTurn = () => {
            taskFacingQuaternionRef.current.copy(originalQuaternion);
            taskOrientationTransitionRef.current = {
              from: targetQuaternion.clone(),
              to: originalQuaternion.clone(),
              elapsed: 0,
              duration: turnDuration,
            };
            crossFadeTo(
              outboundTurnAction,
              -(outboundTurnAction.getClip().duration / turnDuration),
              true
            );
            listenFor(outboundTurnAction, finishSequence);
          };

          const startTask = () => {
            taskOrientationTransitionRef.current = null;
            taskFacingQuaternionRef.current.copy(targetQuaternion);
            crossFadeTo(taskAction, character.animationSpeed || 1);
            listenFor(taskAction, startReturnTurn);
          };

          taskLockedRef.current = true;
          activeTaskRef.current = taskName;
          taskFacingQuaternionRef.current.copy(originalQuaternion);
          taskOrientationTransitionRef.current = {
            from: originalQuaternion.clone(),
            to: targetQuaternion.clone(),
            elapsed: 0,
            duration: turnDuration,
          };
          crossFadeTo(
            outboundTurnAction,
            outboundTurnAction.getClip().duration / turnDuration
          );
          listenFor(outboundTurnAction, startTask);

          console.info(
            `[EcctrlCharacter] Turning toward FarmBot before task action "${taskName}" for ${character.name}.`
          );

          return true;
        }

        taskLockedRef.current =
          true;

        activeTaskRef.current =
          taskName;

        taskAction.enabled =
          true;

        taskAction.setLoop(
          THREE.LoopOnce,
          1
        );

        taskAction.clampWhenFinished =
          true;

        taskAction
          .reset()
          .setEffectiveTimeScale(
            character.animationSpeed ||
              1
          )
          .play();

        if (
          currentActionRef.current &&
          currentActionRef.current !==
            taskAction
        ) {
          currentActionRef.current
            .crossFadeTo(
              taskAction,
              CROSSFADE_DURATION,
              false
            );
        }

        currentActionRef.current =
          taskAction;

        lastClipNameRef.current =
          taskAction.getClip().name;

        const handleFinished =
          (event: any) => {
            if (
              event.action !==
              taskAction
            ) {
              return;
            }

            mixer.removeEventListener(
              'finished',
              handleFinished as any
            );

            if (
              finishedListenerRef.current ===
              handleFinished
            ) {
              finishedListenerRef.current =
                null;
            }

            activeTaskRef.current =
              null;

            taskFacingYawRef.current =
              null;

            /**
             * Unlock first, then start the current Ecctrl locomotion
             * animation underneath the task's final held pose. This
             * is the same ordering that prevents a one-frame FBX
             * bind/T-pose flash in GardenCharacter.
             */
            taskLockedRef.current =
              false;

            lastClipNameRef.current =
              null;

            playAnimation(
              lastLocomotionStateRef.current,
              true
            );

            // Report the completed semantic action back to the page-level world-action layer.
            window.dispatchEvent(
              new CustomEvent('garden-character-action-complete', {
                detail: {
                  characterId: character.id,
                  characterName: character.name,
                  action: taskName,
                  target: target ?? null,
                },
              })
            );

            /**
             * Do not stop the completed task until the locomotion
             * crossfade has had time to take over completely.
             */
            taskCleanupTimerRef.current =
              setTimeout(
                () => {
                  taskAction.stop();
                  taskAction.enabled =
                    false;

                  taskCleanupTimerRef.current =
                    null;
                },
                CROSSFADE_DURATION *
                  1000 +
                  40
              );
          };

        finishedListenerRef.current =
          handleFinished;

        mixer.addEventListener(
          'finished',
          handleFinished as any
        );

        console.info(
          `[EcctrlCharacter] Playing task action "${taskName}" for ${character.name}.`
        );

        return true;
      },
      [
        actionsRef,
        character.id,
        character.animationSpeed,
        character.name,
        mixerRef,
        playAnimation,
      ]
    );

  // ======================================================
  // DETAILS CARD ACTION EVENT
  // ======================================================

  useEffect(() => {
    const handleCharacterAction =
      (event: Event) => {
        const customEvent =
          event as CustomEvent<{
            characterId?: number;
            action?: string;
            target?: unknown;
          }>;

        if (
          Number(
            customEvent.detail
              ?.characterId
          ) !== character.id
        ) {
          return;
        }

        const action =
          customEvent.detail
            ?.action;

        if (!action) {
          return;
        }

        playTaskAction(
          action,
          customEvent.detail?.target
        );
      };

    window.addEventListener(
      'garden-character-action',
      handleCharacterAction
    );

    return () => {
      window.removeEventListener(
        'garden-character-action',
        handleCharacterAction
      );

      const mixer =
        mixerRef.current;

      if (
        mixer &&
        finishedListenerRef.current
      ) {
        mixer.removeEventListener(
          'finished',
          finishedListenerRef.current as any
        );
      }

      finishedListenerRef.current =
        null;

      if (taskCleanupTimerRef.current) {
        clearTimeout(
          taskCleanupTimerRef.current
        );

        taskCleanupTimerRef.current =
          null;
      }

      taskLockedRef.current =
        false;

      activeTaskRef.current =
        null;

      taskFacingYawRef.current =
        null;

      taskOrientationTransitionRef.current =
        null;
    };
  }, [
    character.id,
    mixerRef,
    playTaskAction,
  ]);

  // ======================================================
  // UPDATE MIXER
  // ======================================================

  useFrame(
    (
      _,
      delta
    ) => {
      if (
        mixerRef.current
      ) {
        mixerRef
          .current
          .update(
            delta
          );
      }
    }
  );

  // ======================================================
  // CONTROLLED MOVEMENT
  // ======================================================

  useFrame((_, delta) => {
    const ec = ecctrlRef.current;
    // Do not call Rapier's isValid() from every R3F frame. Depending on frame
    // ordering, that query can overlap the active physics step and trigger the
    // same WASM borrow error it is intended to prevent. The unmount cleanup
    // above clears stale handles; this callback only needs the null boundary.
    if (!ec?.body) {
      return;
    }

    if (isControlled && movementTargetPosition) {
      const position = ec.currPos;
      const navigation = planThreeDTargetRelativeNavigation({
        characterPosition: position,
        targetPosition: movementTargetPosition,
      });
      if (navigation.hasDirection) {
        ec.setForwardDir(targetForwardDirectionRef.current.set(
          navigation.forwardDirection.x,
          navigation.forwardDirection.y,
          navigation.forwardDirection.z,
        ));
      }
    }

    /**
     * Keep the physics body stationary while a semantic task
     * animation is playing. The camera/live-position bookkeeping
     * below still runs normally.
     */
    if (taskLockedRef.current) {
      ec.setMovement({
        joystick: {
          x: 0,
          y: 0,
        },
        run: false,
        jump: false,
      });

      if (taskFacingYawRef.current !== null) {
        const transition = taskOrientationTransitionRef.current;
        const facing = taskFacingQuaternionRef.current;

        if (transition) {
          transition.elapsed = Math.min(
            transition.elapsed + delta,
            transition.duration
          );
          const progress = transition.duration > 0
            ? transition.elapsed / transition.duration
            : 1;
          const easedProgress = progress * progress * (3 - 2 * progress);
          facing.slerpQuaternions(
            transition.from,
            transition.to,
            easedProgress
          );
          if (progress >= 1) {
            taskOrientationTransitionRef.current = null;
          }
        }

        ec.body.setRotation(
          {
            x: facing.x,
            y: facing.y,
            z: facing.z,
            w: facing.w,
          },
          true
        );
        ec.body.setAngvel(
          { x: 0, y: 0, z: 0 },
          true
        );
      }

      const position =
        ec.currPos;

      if (cameraFollowRef) {
        cameraFollowRef.current =
          new THREE.Vector3(
            position.x,
            position.y,
            position.z
          );
      }

      if (
        livePositionsRef &&
        markerId
      ) {
        livePositionsRef.current.set(
          markerId,
          {
            x: position.x,
            y: position.y,
            z: position.z,
          }
        );
      }

      reportControlledPosition(position);

      return;
    }

    if (!isControlled) {
      return;
    }

    const k =
      keys.current;

    const joystickX =
      (
        k.d
          ? 1
          : 0
      ) +
      (
        k.a
          ? -1
          : 0
      );

    const joystickY =
      (
        k.w
          ? 1
          : 0
      ) +
      (
        k.s
          ? -1
          : 0
      );

    const jump =
      k.space &&
      !k.spaceFired;

    if (jump) {
      k.spaceFired =
        true;
    }

    ec.setMovement({
      joystick: {
        x: joystickX,
        y: joystickY,
      },

      run:
        k.shift,

      jump,
    });

    /**
     * Camera follow.
     */
    const position =
      ec.currPos;

    // Ecctrl/Rapier can briefly expose an incomplete position while its body
    // is synchronizing. Never allow that transient frame to reach the camera,
    // live-position store, or Runtime Marker registry.
    if (
      !Number.isFinite(position.x)
      || !Number.isFinite(position.y)
      || !Number.isFinite(position.z)
    ) {
      return;
    }

    if (
      cameraFollowRef
    ) {
      cameraFollowRef.current =
        new THREE.Vector3(
          position.x,
          position.y,
          position.z
        );
    }

    /**
     * Persistent live-position registry.
     */
    if (
      livePositionsRef &&
      markerId
    ) {
      livePositionsRef
        .current
        .set(
          markerId,
          {
            x: position.x,
            y: position.y,
            z: position.z,
          }
        );
    }
    reportControlledPosition(position);
  });

  // ======================================================
  // CONTROL STATE POSITION SYNC
  // ======================================================

  useEffect(() => {
    if (
      isControlled &&
      onControlChange &&
      ecctrlRef.current
    ) {
      const position =
        ecctrlRef
          .current
          .currPos;

      onControlChange({
        x: position.x,
        y: position.y,
        z: position.z,
      });
    }
  }, [
    isControlled,
    onControlChange,
  ]);

  // ======================================================
  // CLICK
  // ======================================================

  const handleClick =
    useCallback(
      (
        event: any
      ) => {
        if (!layerEnabled) {
          return;
        }

        event.stopPropagation();

        if (
          isControlled &&
          onControlChange &&
          ecctrlRef.current
        ) {
          const position =
            ecctrlRef
              .current
              .currPos;

          onControlChange({
            x: position.x,
            y: position.y,
            z: position.z,
          });
        }

        if (
          onClick
        ) {
          onClick();
        }
      },
      [
        onClick,
        isControlled,
        onControlChange,
        layerEnabled,
      ]
    );

  const handleEnter =
    useCallback(
      () => {
        if (layerEnabled) {
          setHovered(true);
        }
      },
      [layerEnabled]
    );

  const handleLeave =
    useCallback(
      () =>
        setHovered(
          false
        ),
      []
    );

  // ======================================================
  // OVERLAYS
  // ======================================================

  const overlays = layerEnabled ? (
    <>
      {currentEmote && (
        <Html
          position={[
            0,
            2.0,
            0,
          ]}
          center
          transform
          occlude
          distanceFactor={
            1
          }
          zIndexRange={[
            10,
            20,
          ]}
        >
          <div
            style={{
              fontSize:
                22,

              pointerEvents:
                'none',

              userSelect:
                'none',
            }}
            className="
              bg-white
              dark:bg-gray-800
              rounded-full
              px-3
              py-2
              shadow-lg
            "
          >
            {
              currentEmote ===
              'happy'
                ? '😊'

                : currentEmote ===
                  'sad'
                ? '😢'

                : currentEmote ===
                  'surprised'
                ? '😲'

                : currentEmote ===
                  'angry'
                ? '😠'

                : currentEmote ===
                  'wave'
                ? '👋'

                : currentEmote ===
                  'dance'
                ? '💃'

                : currentEmote ===
                  'sleep'
                ? '😴'

                : ''
            }
          </div>
        </Html>
      )}

      {hovered &&
        !isControlled && (
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
              {
                character.name
              }
            </div>
          </Html>
        )}

      {(isControlled ||
        isSelected) && (
        <FadingRing
          position={[
            0,
            -GROUND_OFFSET + 0.025,
            0,
          ]}
          innerRadius={
            0.7
          }
          outerRadius={
            1.15
          }
          persistent={
            isControlled
          }
          alwaysVisible
        />
      )}
    </>
  ) : null;

  // ======================================================
  // POSITION
  // ======================================================

  const position:
    [
      number,
      number,
      number,
    ] = [
      runtimePosition[0],

      startY,

      runtimePosition[2],
    ];

  // ======================================================
  // FALLBACK CHARACTER
  // ======================================================

  if (
    !character.model
      ?.filePath ||
    error ||
    (
      !model &&
      !loading
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

    return (
      <Ecctrl
        ref={
          ecctrlRef
        }
        position={
          position
        }
        floatHeight={
          0.3
        }
        maxWalkVel={
          2
        }
        decDeltaTime={
          0.5
        }
        slideGripFactor={
          1
        }
        useCustomForward={
          isControlled && movementTargetPosition != null
        }
        enable={layerEnabled}
      >
        <mesh
          visible={layerEnabled}
          castShadow
          receiveShadow
          position={[
            0,
            0.45,
            0,
          ]}
          onClick={
            handleClick
          }
          onPointerEnter={
            handleEnter
          }
          onPointerLeave={
            handleLeave
          }
        >
          <cylinderGeometry
            args={[
              0.3,
              0.42,
              0.9,
              10,
            ]}
          />

          <meshStandardMaterial
            color={
              colorMap[
                character
                  .type
              ] ||
              '#FF69B4'
            }
          />
        </mesh>

        {overlays}
        {layerEnabled && isActionTarget && (
          <PulseRing
            position={[0, -GROUND_OFFSET + 0.025, 0]}
            color="#10b981"
            size={0.85}
          />
        )}
      </Ecctrl>
    );
  }

  // ======================================================
  // REAL CHARACTER
  // ======================================================

  return (
    <Ecctrl
      ref={
        ecctrlRef
      }
      position={
        position
      }
      floatHeight={
        FLOAT_HEIGHT
      }
      maxWalkVel={
        2
      }
      maxRunVel={
        3.5
      }
      decDeltaTime={
        0.5
      }
      slideGripFactor={
        1
      }
      useCustomForward={
        isControlled && movementTargetPosition != null
      }
      enable={layerEnabled}
      capsuleHalfHeight={
        CAPSULE_HALF_HEIGHT
      }
      capsuleRadius={
        CAPSULE_RADIUS
      }
    >
      {/* --------------------------------------------------
          ECCTRL ANIMATION STATE CONTROLLER
      -------------------------------------------------- */}

      <EcctrlAnimationStateController
        ecctrl={
          ecctrlRef
        }
        enabled={
          character.status ===
          'active'
        }
        resolver={
          createAnimationResolver()
        }
        onChange={
          handleAnimChange
        }
      />

      {/* --------------------------------------------------
          CLICK / HOVER HIT AREA
      -------------------------------------------------- */}

      <mesh
        onClick={
          handleClick
        }
        onPointerEnter={
          handleEnter
        }
        onPointerLeave={
          handleLeave
        }
      >
        <boxGeometry
          args={[
            CAPSULE_RADIUS *
              4,

            CAPSULE_HALF_HEIGHT *
              2.5,

            CAPSULE_RADIUS *
              4,
          ]}
        />

        <meshBasicMaterial
          visible={
            false
          }
        />
      </mesh>

      {/* --------------------------------------------------
          CHARACTER VISUAL
      -------------------------------------------------- */}

      {model && (
        <group
          visible={layerEnabled}
          position={[
            0,
            -GROUND_OFFSET,
            0,
          ]}
        >
          <primitive
            object={
              model
            }
          />
        </group>
      )}

      {layerEnabled && isActionTarget && (
        <PulseRing
          position={[0, -GROUND_OFFSET + 0.025, 0]}
          color="#10b981"
          size={0.85}
        />
      )}

      {overlays}
    </Ecctrl>
  );
}
