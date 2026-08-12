// src/components/threed/shared/GardenCharacter.tsx — v0.15.0 "Character Animations"
'use client';

import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

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
  };
  defaultAnimation: string;
  animationSpeed: number;
  movementType: string;
  movementRadius: number;
  movementSpeed: number;
  patrolWaypoints: { x: number; y: number; z: number }[];
  followTarget: string;
  followDistance: number;
  teleportPositions: { x: number; y: number; z: number; waitSeconds?: number }[];
  teleportInterval: number;
  interactable: boolean;
  interactionMessage: string;
  defaultEmote: string;
  soundEffect: string | null;
  positionX: number;
  positionY: number;
  positionZ: number;
  rotation: number;
  scale: number;
  visible: boolean;
  activeStartHour: number;
  activeEndHour: number;
}

interface GardenCharacterProps {
  character: CharacterData;
  currentWeather?: string;
  currentHour?: number;
  /** v0.16.2-beta: When true, a parent (e.g. a RigidBody already placed at the character's
   *  world position) provides the world transform — render/move relative to origin so the
   *  position isn't applied twice. */
  positionedByParent?: boolean;
}

// ============================================
// GLOBALS — model & mixer caches
// ============================================
const modelCache = new Map<string, THREE.Group>();
const animationMixers = new Map<number, THREE.AnimationMixer>();
/** Registry of world-space positions for all active characters (used by follow) */
const activeCharacterPositions = new Map<number, THREE.Vector3>();

// ============================================
// ANIMATION STATE MACHINE
// ============================================

/** Returns the preferred animation clip name for the current movement state. */
function getAnimationForMovement(
  movementType: string,
  isMoving: boolean,
  available: string[]
): string | null {
  if (available.length === 0) return null;

  const has = (name: string) => available.some(a => a.toLowerCase() === name.toLowerCase());

  if (!isMoving && movementType === 'stationary') {
    if (has('idle')) return 'idle';
    if (has('sway')) return 'sway';
    if (has('float')) return 'float';
    return available[0];
  }

  switch (movementType) {
    case 'wander':
    case 'patrol':
    case 'follow':
      if (has('walk')) return 'walk';
      if (has('fly')) return 'fly';
      if (has('run')) return 'run';
      break;
    case 'circle':
      if (has('fly')) return 'fly';
      if (has('walk')) return 'walk';
      break;
    case 'teleport':
      if (has('spin')) return 'spin';
      if (has('float')) return 'float';
      break;
    default:
      if (has('idle')) return 'idle';
  }

  return has('idle') ? 'idle' : available[0];
}

// ============================================
// COMPONENT
// ============================================
export function GardenCharacter({
  character,
  currentWeather = 'sunny',
  currentHour = 12,
  positionedByParent = false,
}: GardenCharacterProps) {
  // v0.16.2-beta: When positioned by a parent (e.g. RigidBody at the character's world
  // position), operate in local space so the world position isn't doubled.
  const homeX = positionedByParent ? 0 : (Number(character.positionX) || 0);
  const homeY = positionedByParent ? 0 : (Number(character.positionY) || 0);
  const homeZ = positionedByParent ? 0 : (Number(character.positionZ) || 0);
  const groupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);
  const [loadingModel, setLoadingModel] = useState(false);

  const [hovered, setHovered] = useState(false);
  const [currentEmote, setCurrentEmote] = useState<string | null>(null);
  const [showMessage, setShowMessage] = useState<string | null>(null);

  // Movement state
  const movementState = useRef({
    targetPosition: new THREE.Vector3(homeX, homeY, homeZ),
    patrolIndex: 0,
    teleportTimer: 0,
    isMoving: false,
    lastAnimation: null as string | null,
  });

  // Visibility checks
  const isTimeActive = currentHour >= character.activeStartHour && currentHour <= character.activeEndHour;
  const isWeatherActive = character.status === 'active' && character.visible && isTimeActive;

  // ============================================
  // MODEL LOADING
  // ============================================
  useEffect(() => {
    if (!isWeatherActive) return;
    if (!character.model?.filePath) {
      return;
    }

    const loadModel = async () => {
      setLoadingModel(true);
      setModelError(null);

      try {
        const modelPath = character.model!.filePath;
        const modelType = character.model!.modelType?.toLowerCase() || 'glb';

        let loadedModel: THREE.Group;
        const cacheKey = `${character.model!.filePath}-${character.model!.modelType}`;

        if (modelCache.has(cacheKey)) {
          loadedModel = modelCache.get(cacheKey)!.clone();
        } else {
          if (modelType === 'fbx') {
            const loader = new FBXLoader();
            loadedModel = await loader.loadAsync(modelPath) as THREE.Group;
          } else if (modelType === 'obj') {
            const loader = new OBJLoader();
            loadedModel = await loader.loadAsync(modelPath) as unknown as THREE.Group;
          } else {
            const loader = new GLTFLoader();
            const gltf = await loader.loadAsync(modelPath);
            loadedModel = gltf.scene;
          }
          modelCache.set(cacheKey, loadedModel.clone());
        }

        // Apply transforms
        const scale = parseFloat(character.model!.scale) * character.scale;
        const rotationY = parseFloat(character.model!.rotationY) + character.rotation;
        loadedModel.scale.setScalar(scale);
        loadedModel.rotation.y = (rotationY * Math.PI) / 180;

        // Enable shadows on all meshes in the loaded model
        loadedModel.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Setup animation mixer
        const animations = (loadedModel as any).animations || [];
        if (animations.length > 0) {
          const mixer = new THREE.AnimationMixer(loadedModel);
          mixerRef.current = mixer;
          animationMixers.set(character.id, mixer);

          // Play default animation
          const clipName = getAnimationForMovement(character.movementType, false, animations.map((a: any) => a.name));
          if (clipName) {
            const clip = animations.find((a: any) => a.name === clipName);
            if (clip) {
              const action = mixer.clipAction(clip);
              action.timeScale = character.animationSpeed;
              action.play();
              currentActionRef.current = action;
              movementState.current.lastAnimation = clipName;
            }
          }
        }

        setModel(loadedModel);
      } catch (error) {
        console.error(`Error loading character model:`, error);
        setModelError(String(error));
      } finally {
        setLoadingModel(false);
      }
    };

    loadModel();

    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        animationMixers.delete(character.id);
      }
      activeCharacterPositions.delete(character.id);
    };
  }, [character, isWeatherActive]);

  // ============================================
  // ANIMATION CROSSFADE HELPER
  // ============================================
  const switchAnimation = (clipName: string, timeScale: number) => {
    if (!mixerRef.current) return;
    if (movementState.current.lastAnimation === clipName) return;

    const animations = (model as any)?.animations || [];
    const clip = animations.find((a: any) => a.name === clipName);
    if (!clip) return;

    const newAction = mixerRef.current.clipAction(clip);
    newAction.timeScale = timeScale;
    newAction.reset().play();

    if (currentActionRef.current) {
      currentActionRef.current.crossFadeTo(newAction, 0.3, false);
    }

    currentActionRef.current = newAction;
    movementState.current.lastAnimation = clipName;
  };

  // ============================================
  // FRAME UPDATES — animation mixer + movement
  // ============================================
  useFrame((_, delta) => {
    // Update mixer
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }

    // Update world position registry (account for any parent transform, e.g. RigidBody)
    if (groupRef.current) {
      activeCharacterPositions.set(character.id, groupRef.current.getWorldPosition(new THREE.Vector3()));
    }

    // Skip movement logic for stationary or inactive
    if (!groupRef.current || !isWeatherActive || character.movementType === 'stationary') {
      if (mixerRef.current && movementState.current.isMoving) {
        movementState.current.isMoving = false;
        const animations = (model as any)?.animations?.map((a: any) => a.name) || [];
        const clipName = getAnimationForMovement(character.movementType, false, animations);
        if (clipName) switchAnimation(clipName, character.animationSpeed);
      }
      return;
    }

    const position = groupRef.current.position;
    const speed = character.movementSpeed * delta;
    let targetReached = false;

    switch (character.movementType) {
      case 'wander':
        if (position.distanceTo(movementState.current.targetPosition) < 0.1) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * character.movementRadius;
          movementState.current.targetPosition = new THREE.Vector3(
            homeX + Math.cos(angle) * radius,
            homeY,
            homeZ + Math.sin(angle) * radius
          );
        }
        break;

      case 'patrol':
        if (character.patrolWaypoints && character.patrolWaypoints.length > 0) {
          const waypoints = character.patrolWaypoints;
          const target = waypoints[movementState.current.patrolIndex];
          const targetPos = new THREE.Vector3(target.x, target.y, target.z);

          if (position.distanceTo(targetPos) < 0.2) {
            movementState.current.patrolIndex = (movementState.current.patrolIndex + 1) % waypoints.length;
          } else {
            movementState.current.targetPosition = targetPos;
          }
        }
        break;

      case 'circle':
        {
          const time = Date.now() * 0.001 * character.movementSpeed;
          const radius = character.movementRadius;
          movementState.current.targetPosition = new THREE.Vector3(
            homeX + Math.cos(time) * radius,
            homeY,
            homeZ + Math.sin(time) * radius
          );
        }
        break;

      case 'follow': {
        // ✅ v0.15.0: Follow another entity
        let targetPos: THREE.Vector3 | null = null;

        if (character.followTarget === 'camera') {
          // Camera is handled externally — fallback to origin
          targetPos = null;
        } else {
          // Try to find a character by characterId
          const match = activeCharacterPositions.get(Number(character.followTarget));
          if (match) targetPos = match.clone();
          // If not a number, try to match by name (characterId)
          if (!targetPos) {
            for (const [id, pos] of activeCharacterPositions) {
              if (String(id) === character.followTarget) {
                targetPos = pos.clone();
                break;
              }
            }
          }
        }

        if (targetPos) {
          const toTarget = targetPos.clone().sub(position);
          if (toTarget.length() > character.followDistance) {
            movementState.current.targetPosition = targetPos.clone().add(
              toTarget.normalize().multiplyScalar(-character.followDistance * 0.8)
            );
          }
        }
        break;
      }

      case 'teleport':
        if (character.teleportPositions && character.teleportPositions.length > 0) {
          movementState.current.teleportTimer += delta;
          if (movementState.current.teleportTimer >= character.teleportInterval) {
            movementState.current.teleportTimer = 0;
            const randomIndex = Math.floor(Math.random() * character.teleportPositions.length);
            const pos = character.teleportPositions[randomIndex];
            groupRef.current.position.set(pos.x, pos.y, pos.z);
            targetReached = true; // skip smooth movement
          }
        }
        if (targetReached) return;
        break;
    }

    // Smooth movement toward target
    const direction = movementState.current.targetPosition.clone().sub(position);
    const dist = direction.length();
    if (dist > 0.05) {
      direction.normalize();
      position.x += direction.x * speed;
      position.z += direction.z * speed;

      // Face movement direction
      if (direction.x !== 0 || direction.z !== 0) {
        const angle = Math.atan2(direction.x, direction.z);
        groupRef.current.rotation.y = angle;
      }
    }

    // ✅ v0.15.0: Animation state machine — switch based on movement
    const isMoving = dist > 0.05;
    if (movementState.current.isMoving !== isMoving) {
      movementState.current.isMoving = isMoving;
      const animations = (model as any)?.animations?.map((a: any) => a.name) || [];
      const clipName = getAnimationForMovement(
        character.movementType,
        isMoving,
        animations
      );
      if (clipName) switchAnimation(clipName, isMoving ? character.animationSpeed * character.movementSpeed : character.animationSpeed);
    }
  });

  // ============================================
  // INTERACTION
  // ============================================
  const handleClick = () => {
    if (!character.interactable) return;

    // ✅ v0.15.0: Play interaction animation from model clips
    const animations = (model as any)?.animations?.map((a: any) => a.name) || [];
    const interactNames = ['dance', 'bounce', 'spin', 'wave', 'happy'];
    const interactClip = interactNames.find((n) => animations.includes(n));
    if (interactClip && mixerRef.current) {
      switchAnimation(interactClip, character.animationSpeed * 1.5);
      // Revert to movement-appropriate animation after 2s
      setTimeout(() => {
        const clipName = getAnimationForMovement(
          character.movementType,
          movementState.current.isMoving,
          animations
        );
        if (clipName) switchAnimation(clipName, character.animationSpeed);
      }, 2000);
    }

    // Show emote
    if (character.defaultEmote && character.defaultEmote !== 'none') {
      setCurrentEmote(character.defaultEmote);
      setTimeout(() => setCurrentEmote(null), 2000);
    }

    // Show message
    if (character.interactionMessage) {
      setShowMessage(character.interactionMessage);
      setTimeout(() => setShowMessage(null), 3000);
    }

    // ✅ Play sound effect (after user gesture)
    if (character.soundEffect) {
      try {
        const audio = new Audio(character.soundEffect);
        audio.volume = 0.4;
        audio.play().catch(() => {/* user gesture may be needed */});
      } catch { /* ignore */ }
    }
  };

  // ============================================
  // RENDER
  // ============================================
  // ✅ v0.15.9: Always render character markers — visibility is a layer toggle concern
  // Characters in the 3D scene should always show even if "inactive" so the user can
  // see them and toggle visibility. The weather/time checks are soft — hide but don't skip.
  const isVisible = character.status === 'active' && character.visible && isTimeActive;

  // Fallback — colored box (always show, even when inactive)
  if (!character.model?.filePath || modelError || (!model && !loadingModel)) {
    const colorMap: Record<string, string> = {
      animal: '#D2691E', bird: '#87CEEB', insect: '#32CD32',
      mythical: '#9370DB', human: '#FFB6C1', robot: '#A9A9A9', decoration: '#FFD700'
    };
    const boxColor = colorMap[character.type] || '#FF69B4';
    const opacity = isVisible ? 1 : 0.4;

    return (
      <group position={[homeX, homeY, homeZ]}>
        <mesh castShadow receiveShadow position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.3, 0.4, 0.8, 8]} />
          <meshStandardMaterial color={boxColor} transparent={!isVisible} opacity={opacity} />
        </mesh>
      </group>
    );
  }

  return (
    <group
      ref={groupRef}
      position={[homeX, homeY, homeZ]}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {model && <primitive object={model} />}

      {/* Emote Bubble */}
      {currentEmote && (
        <Html position={[0, 1.5, 0]} center>
          <div className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg animate-bounce">
            {currentEmote === 'happy' && <span className="text-2xl">😊</span>}
            {currentEmote === 'sad' && <span className="text-2xl">😢</span>}
            {currentEmote === 'surprised' && <span className="text-2xl">😲</span>}
            {currentEmote === 'angry' && <span className="text-2xl">😠</span>}
            {currentEmote === 'wave' && <span className="text-2xl">👋</span>}
            {currentEmote === 'dance' && <span className="text-2xl">💃</span>}
            {currentEmote === 'sleep' && <span className="text-2xl">😴</span>}
          </div>
        </Html>
      )}

      {/* Speech/Interaction Bubble */}
      {showMessage && (
        <Html position={[0, 2, 0]} center>
          <div className="bg-black/80 text-white px-3 py-1.5 rounded-lg text-sm whitespace-nowrap shadow-lg animate-fade-in">
            💬 {showMessage}
          </div>
        </Html>
      )}

      {/* Hover Tooltip — match other 3D marker title style */}
      {hovered && (
        <Html position={[0, 1.2, 0]} center distanceFactor={10}>
          <div className="bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap shadow-lg pointer-events-none">
            {character.name}
          </div>
        </Html>
      )}
    </group>
  );
}