// src/components/threed/shared/EcctrlCharacter.tsx — v0.16.0-alpha "React Three Physics"
'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { Ecctrl, EcctrlAnimationStateController } from 'ecctrl';
import type { EcctrlHandle, EcctrlAnimationState, EcctrlAnimationStateContext } from 'ecctrl';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

// ============================================
// TYPES
// ============================================
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
}

// ============================================
// MODEL CACHE
// ============================================
const modelCache = new Map<string, THREE.Group>();

// ============================================
// ANIMATION RESOLVER — maps ecctrl physics state to animation clips
// ============================================
function createAnimationResolver(animations: string[]): (context: EcctrlAnimationStateContext) => EcctrlAnimationState {
  const has = (name: string) => animations.some((a) => a.toLowerCase() === name.toLowerCase());

  return (context: EcctrlAnimationStateContext): EcctrlAnimationState => {
    const { isOnGround, isFalling, isMoving, runActive, jumpActive } = context;

    // Jump states
    if (jumpActive && !isOnGround && !isFalling) return 'JUMP_START';
    if (jumpActive && isFalling) return 'JUMP_FALL';
    if (!jumpActive && isOnGround && !isFalling && isMoving && runActive) return 'RUN';
    if (!jumpActive && isOnGround && !isFalling && isMoving && !runActive) return 'WALK';
    if (!jumpActive && isOnGround && !isFalling && !isMoving) return 'IDLE';
    if (!jumpActive && !isOnGround && isFalling) return 'JUMP_FALL';

    return 'IDLE';
  };
}

// ============================================
// 3D MODEL LOADER HOOK
// ============================================
function useCharacterModel(character: CharacterData, isActive: boolean) {
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animations, setAnimations] = useState<string[]>([]);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  useEffect(() => {
    if (!isActive || !character.model?.filePath) return;

    const loadModel = async () => {
      setLoading(true);
      setError(null);

      try {
        const modelPath = character.model!.filePath;
        const modelType = character.model!.modelType?.toLowerCase() || 'glb';
        const cacheKey = `${modelPath}-${modelType}`;

        let loadedModel: THREE.Group;

        if (modelCache.has(cacheKey)) {
          loadedModel = modelCache.get(cacheKey)!.clone();
        } else {
          if (modelType === 'fbx') {
            const loader = new FBXLoader();
            loadedModel = await loader.loadAsync(modelPath) as THREE.Group;
          } else {
            const loader = new GLTFLoader();
            const gltf = await loader.loadAsync(modelPath);
            loadedModel = gltf.scene;
          }
          modelCache.set(cacheKey, loadedModel.clone());
        }

        // Apply scale and rotation
        const scaleVal = parseFloat(character.model!.scale || '1') * (character.scale || 1);
        const rotY = parseFloat(character.model!.rotationY || '0') + (character.rotation || 0);
        loadedModel.scale.setScalar(scaleVal);
        loadedModel.rotation.y = (rotY * Math.PI) / 180;

        // Enable shadows
        loadedModel.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Extract animation names
        const clips = (loadedModel as any).animations || [];
        const clipNames = clips.map((c: any) => c.name);
        setAnimations(clipNames);

        setModel(loadedModel);
      } catch (err) {
        console.error(`EcctrlCharacter: failed to load model:`, err);
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };

    loadModel();
  }, [character, isActive]);

  return { model, loading, error, animations };
}

// ============================================
// ECCTRL CHARACTER COMPONENT
// ============================================
export function EcctrlCharacter({ character }: EcctrlCharacterProps) {
  const ecctrlRef = useRef<EcctrlHandle>(null);
  const groupRef = useRef<THREE.Group>(null);

  const isVisible = character.status === 'active' && character.visible;
  const { model, loading, error, animations } = useCharacterModel(character, isVisible);

  // Interaction state
  const [hovered, setHovered] = useState(false);
  const [currentEmote, setCurrentEmote] = useState<string | null>(null);
  const [showMessage, setShowMessage] = useState<string | null>(null);
  const [currentAnimState, setCurrentAnimState] = useState<EcctrlAnimationState>('IDLE');

  // Movement ai state
  const aiTimerRef = useRef(0);
  const aiTargetRef = useRef(new THREE.Vector3(
    Number(character.positionX) || 0,
    Number(character.positionY) || 0,
    Number(character.positionZ) || 0,
  ));
  const aiVelocityRef = useRef(new THREE.Vector3());

  // Manual movement input for programmatic control
  const setMovement = useCallback((joystickX: number, joystickY: number, jump: boolean, run: boolean) => {
    if (ecctrlRef.current) {
      ecctrlRef.current.setMovement({ joystick: { x: joystickX, y: joystickY }, jump, run });
    }
  }, []);

  // AI wandering using ecctrl's movement API
  useFrame((_, delta) => {
    if (!ecctrlRef.current || !isVisible) return;

    const ecctrl = ecctrlRef.current;
    const pos = ecctrl.currPos;
    const target = aiTargetRef.current;

    // Periodic new target
    aiTimerRef.current += delta;
    if (aiTimerRef.current > 3) {
      aiTimerRef.current = 0;
      const angle = Math.random() * Math.PI * 2;
      const radius = (character.movementRadius || 5) * Math.random();
      target.set(
        (Number(character.positionX) || 0) + Math.cos(angle) * radius,
        (Number(character.positionY) || 0),
        (Number(character.positionZ) || 0) + Math.sin(angle) * radius,
      );
    }

    // Direction toward target
    const dir = new THREE.Vector3().subVectors(target, pos);
    dir.y = 0;
    const dist = dir.length();
    if (dist > 0.5) {
      dir.normalize();
      setMovement(0, dist > 0.5 ? 1.0 : 0.0, false, false);
    } else {
      setMovement(0, 0, false, false);
    }
  });

  // Animation state change handler
  const handleAnimationChange = useCallback(
    (_state: EcctrlAnimationState, _context: EcctrlAnimationStateContext) => {
      setCurrentAnimState(_state);
    },
    [],
  );

  // Interaction handler
  const handleClick = () => {
    if (!character.interactable) return;

    if (character.defaultEmote && character.defaultEmote !== 'none') {
      setCurrentEmote(character.defaultEmote);
      setTimeout(() => setCurrentEmote(null), 2000);
    }

    if (character.interactionMessage) {
      setShowMessage(character.interactionMessage);
      setTimeout(() => setShowMessage(null), 3000);
    }

    if (character.soundEffect) {
      try {
        const audio = new Audio(character.soundEffect);
        audio.volume = 0.4;
        audio.play().catch(() => {});
      } catch {}
    }
  };

  // Fallback — colored box for characters without models
  if (!character.model?.filePath || error || (!model && !loading)) {
    const colorMap: Record<string, string> = {
      animal: '#D2691E', bird: '#87CEEB', insect: '#32CD32',
      mythical: '#9370DB', human: '#FFB6C1', robot: '#A9A9A9', decoration: '#FFD700',
    };
    const boxColor = colorMap[character.type] || '#FF69B4';
    const opacity = isVisible ? 1 : 0.4;

    return (
      <Ecctrl
        position={[Number(character.positionX) || 0, Number(character.positionY) || 0.5, Number(character.positionZ) || 0]}
        floatHeight={0.1}
        maxWalkVel={character.movementSpeed || 1.5}
        enable
      >
        <mesh castShadow receiveShadow position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.3, 0.4, 0.8, 8]} />
          <meshStandardMaterial color={boxColor} transparent={!isVisible} opacity={opacity} />
        </mesh>
        <Html position={[0, 1.2, 0]} center>
          <div className="text-xs text-white/60 whitespace-nowrap pointer-events-none bg-black/40 px-1.5 py-0.5 rounded">
            {character.name}
          </div>
        </Html>
      </Ecctrl>
    );
  }

  return (
    <Ecctrl
      ref={ecctrlRef}
      position={[Number(character.positionX) || 0, Number(character.positionY) || 0.5, Number(character.positionZ) || 0]}
      floatHeight={0.3}
      maxWalkVel={character.movementSpeed || 2}
      maxRunVel={(character.movementSpeed || 2) * 1.5}
      enable
      capsuleHalfHeight={0.6}
      capsuleRadius={0.3}
    >
      {/* Animation state controller */}
      <EcctrlAnimationStateController
        ecctrl={ecctrlRef}
        enabled={isVisible}
        resolver={createAnimationResolver(animations)}
        onChange={handleAnimationChange}
      />

      {/* Character model */}
      <group ref={groupRef}>
        {model && <primitive object={model} />}
      </group>

      {/* Emote Bubble */}
      {currentEmote && (
        <Html position={[0, 1.8, 0]} center>
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
        <Html position={[0, 2.3, 0]} center>
          <div className="bg-black/80 text-white px-3 py-1.5 rounded-lg text-sm whitespace-nowrap shadow-lg">
            💬 {showMessage}
          </div>
        </Html>
      )}

      {/* Hover Tooltip */}
      {hovered && character.interactable && (
        <Html position={[0, 1.5, 0]} center>
          <div className="bg-black/60 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
            Click to interact with {character.name}
          </div>
        </Html>
      )}

      {/* Name Label */}
      <Html position={[0, -0.6, 0]} center>
        <div className="text-[10px] text-white/50 whitespace-nowrap pointer-events-none">
          {character.name}
        </div>
      </Html>
    </Ecctrl>
  );
}