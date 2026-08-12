// src/components/threed/shared/EcctrlCharacter.tsx — v0.16.2-beta
'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { Ecctrl, EcctrlAnimationStateController } from 'ecctrl';
import type { EcctrlHandle, EcctrlAnimationState, EcctrlAnimationStateContext } from 'ecctrl';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { FadingRing } from './FadingRing';

interface CharacterData {
  id: number; characterId: string; name: string; type: string; status: string;
  modelId: number | null;
  model?: { id: number; modelName: string; modelType: string; filePath: string; scale: string; rotationY: string; animations: string[] };
  defaultAnimation: string; animationSpeed: number; movementType: string; movementPattern?: string;
  movementRadius: number; movementSpeed: number;
  positionX: number; positionY: number; positionZ: number;
  rotation: number; scale: number; visible: boolean;
  interactable: boolean; interactionMessage: string; defaultEmote: string; soundEffect: string | null;
}

interface EcctrlCharacterProps {
  character: CharacterData;
  isControlled?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  onControlChange?: (pos: { x: number; y: number; z: number }) => void;
  /** Shared ref — the character writes its world position here each frame when controlled.
   *  The parent reads it for camera follow without triggering React re-renders. */
  cameraFollowRef?: React.MutableRefObject<THREE.Vector3 | null>;
  /** v0.16.2-beta: Persistent live-position map (keyed by marker id) so the parent can
   *  re-focus a moved character correctly even after it has been deselected. Written
   *  every frame while controlled — no React re-renders. */
  livePositionsRef?: React.MutableRefObject<Map<string, { x: number; y: number; z: number }>>;
  markerId?: string;
}

const modelCache = new Map<string, THREE.Group>();

// Maps each Ecctrl animation state to the preferred clip names to look for on the model.
// Clip matching is case-insensitive and falls back to the next candidate when a clip is missing.
const STATE_CLIPS: Record<EcctrlAnimationState, string[]> = {
  IDLE: ['idle', 'idle_loop', 'stand', 'standing'],
  WALK: ['walk', 'walking', 'walk_loop'],
  RUN: ['run', 'running', 'sprint', 'run_loop'],
  JUMP_START: ['jump_start', 'jumpstart', 'jump', 'jump_up'],
  JUMP_IDLE: ['jump_idle', 'jump', 'float'],
  JUMP_FALL: ['jump_fall', 'fall', 'falling'],
  JUMP_LAND: ['jump_land', 'land', 'landing'],
};

function createAnimationResolver(animations: string[]): (ctx: EcctrlAnimationStateContext) => EcctrlAnimationState {
  return (ctx) => {
    const { isOnGround, isFalling, isMoving, runActive, jumpActive } = ctx;
    if (jumpActive && !isOnGround && !isFalling) return 'JUMP_START';
    if (jumpActive && isFalling) return 'JUMP_FALL';
    if (!jumpActive && isOnGround && !isFalling && isMoving && runActive) return 'RUN';
    if (!jumpActive && isOnGround && !isFalling && isMoving && !runActive) return 'WALK';
    if (!jumpActive && isOnGround && !isFalling && !isMoving) return 'IDLE';
    if (!jumpActive && !isOnGround && isFalling) return 'JUMP_FALL';
    return 'IDLE';
  };
}

function useCharacterModel(character: CharacterData, isActive: boolean) {
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animations, setAnimations] = useState<string[]>([]);
  // AnimationMixer + resolved actions are kept in refs (no re-render needed).
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Map<string, THREE.AnimationAction>>(new Map());

  useEffect(() => {
    if (!isActive || !character.model?.filePath) return;
    const loadModel = async () => {
      setLoading(true); setError(null);
      try {
        const mp = character.model!.filePath, mt = character.model!.modelType?.toLowerCase() || 'glb', ck = `${mp}-${mt}`;
        let m: THREE.Group;
        if (modelCache.has(ck)) { m = modelCache.get(ck)!.clone(); }
        else { m = mt === 'fbx' ? await new FBXLoader().loadAsync(mp) as THREE.Group : (await new GLTFLoader().loadAsync(mp)).scene; modelCache.set(ck, m.clone()); }
        m.scale.setScalar(parseFloat(character.model!.scale || '1') * (character.scale || 1));
        m.rotation.y = (parseFloat(character.model!.rotationY || '0') + (character.rotation || 0)) * Math.PI / 180;
        m.traverse((c) => { if (c instanceof THREE.Mesh) { c.castShadow = true; c.receiveShadow = true; } });

        // Build the animation mixer + action lookup table
        actionsRef.current.clear();
        mixerRef.current = null;
        const clips = ((m as any).animations || []) as THREE.AnimationClip[];
        setAnimations(clips.map((a) => a.name));
        if (clips.length > 0) {
          const mixer = new THREE.AnimationMixer(m);
          clips.forEach((clip) => {
            actionsRef.current.set(clip.name.toLowerCase(), mixer.clipAction(clip));
          });
          mixerRef.current = mixer;
        }

        setModel(m);
      } catch (e) { setError(String(e)); }
      finally { setLoading(false); }
    };
    loadModel();

    return () => {
      mixerRef.current?.stopAllAction();
      mixerRef.current = null;
      actionsRef.current.clear();
    };
  }, [character, isActive]);

  return { model, loading, error, animations, mixerRef, actionsRef };
}

// ============================================
// KEYBOARD INPUT HOOK
// ============================================
function useWASD(active: boolean) {
  const keys = useRef({ w: false, s: false, a: false, d: false, shift: false, space: false, spaceFired: false });

  useEffect(() => {
    if (!active) {
      keys.current = { w: false, s: false, a: false, d: false, shift: false, space: false, spaceFired: false };
      return;
    }
    const down = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key.toLowerCase()) {
        case 'w': case 'arrowup': keys.current.w = true; e.preventDefault(); break;
        case 's': case 'arrowdown': keys.current.s = true; e.preventDefault(); break;
        case 'a': case 'arrowleft': keys.current.a = true; e.preventDefault(); break;
        case 'd': case 'arrowright': keys.current.d = true; e.preventDefault(); break;
        case 'shift': keys.current.shift = true; e.preventDefault(); break;
        case ' ':
          if (!keys.current.space) { keys.current.space = true; keys.current.spaceFired = false; }
          e.preventDefault(); break;
      }
    };
    const up = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w': case 'arrowup': keys.current.w = false; e.preventDefault(); break;
        case 's': case 'arrowdown': keys.current.s = false; e.preventDefault(); break;
        case 'a': case 'arrowleft': keys.current.a = false; e.preventDefault(); break;
        case 'd': case 'arrowright': keys.current.d = false; e.preventDefault(); break;
        case 'shift': keys.current.shift = false; e.preventDefault(); break;
        case ' ': keys.current.space = false; keys.current.spaceFired = false; e.preventDefault(); break;
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [active]);

  return keys;
}

// ============================================
// COMPONENT
// ============================================
export function EcctrlCharacter({ character, isControlled = false, isSelected = false, onClick, onControlChange, cameraFollowRef, livePositionsRef, markerId }: EcctrlCharacterProps) {
  const ecctrlRef = useRef<EcctrlHandle>(null);
  const startY = Math.max(Number(character.positionY) || 0, 1.5);
  const { model, loading, error, animations, mixerRef, actionsRef } = useCharacterModel(character, character.status === 'active' && character.visible);

  const [hovered, setHovered] = useState(false);
  const [currentEmote, setCurrentEmote] = useState<string | null>(null);

  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  const lastClipNameRef = useRef<string | null>(null);

  const keys = useWASD(isControlled);

  // Crossfade to the most appropriate model clip for a given animation state.
  const playAnimation = useCallback((state: EcctrlAnimationState) => {
    const mixer = mixerRef.current;
    const actions = actionsRef.current;
    if (!mixer || actions.size === 0) return;

    let action: THREE.AnimationAction | undefined;
    const preferred = STATE_CLIPS[state] || STATE_CLIPS.IDLE;
    for (const name of preferred) {
      const a = actions.get(name);
      if (a) { action = a; break; }
    }
    if (!action) {
      if (state === 'IDLE' && actions.size > 0) {
        action = actions.values().next().value;
      } else {
        return;
      }
    }
    if (!action) return;

    const clipName = action.getClip().name;
    if (lastClipNameRef.current === clipName) return;

    action.reset().setEffectiveTimeScale(character.animationSpeed || 1).play();
    if (currentActionRef.current) {
      currentActionRef.current.crossFadeTo(action, 0.2, false);
    }
    currentActionRef.current = action;
    lastClipNameRef.current = clipName;
  }, [character.animationSpeed, mixerRef, actionsRef]);

  const handleAnimChange = useCallback((s: EcctrlAnimationState) => {
    playAnimation(s);
  }, [playAnimation]);

  // Start with the default/idle animation when the model first becomes available.
  useEffect(() => {
    if (model) playAnimation('IDLE');
  }, [model, playAnimation]);

  // Advance the mixer every frame (even when not controlled).
  useFrame((_, delta) => {
    if (mixerRef.current) mixerRef.current.update(delta);
  });

  // Only send movement input when controlled.
  useFrame(() => {
    if (!ecctrlRef.current || !isControlled) return;
    const ec = ecctrlRef.current;
    const k = keys.current;
    const jx = (k.d ? 1 : 0) + (k.a ? -1 : 0);
    const jy = (k.w ? 1 : 0) + (k.s ? -1 : 0);
    const jump = k.space && !k.spaceFired;
    if (jump) k.spaceFired = true;
    ec.setMovement({ joystick: { x: jx, y: jy }, run: k.shift, jump });

    // Write position to camera follow ref (zero-cost, no React state)
    const p = ec.currPos;
    if (cameraFollowRef) {
      cameraFollowRef.current = new THREE.Vector3(p.x, p.y, p.z);
    }
    // v0.16.2-beta: Keep the live-position map up to date every frame while controlled
    // so re-selecting the character focuses where it actually is now.
    if (livePositionsRef && markerId) {
      livePositionsRef.current.set(markerId, { x: p.x, y: p.y, z: p.z });
    }
  });

  // Sync marker position when control state changes (Take Control or Release Control)
  useEffect(() => {
    if (onControlChange && ecctrlRef.current) {
      const p = ecctrlRef.current.currPos;
      onControlChange({ x: p.x, y: p.y, z: p.z });
    }
  }, [isControlled, onControlChange]);

  const handleClick = useCallback((e: any) => {
    e.stopPropagation();
    if (onControlChange && ecctrlRef.current) {
      const p = ecctrlRef.current.currPos;
      onControlChange({ x: p.x, y: p.y, z: p.z });
    }
    if (onClick) onClick();
  }, [onClick, onControlChange]);

  const handleEnter = useCallback(() => setHovered(true), []);
  const handleLeave = useCallback(() => setHovered(false), []);

  const overlays = (
    <>
      {currentEmote && (
        <Html position={[0, 2.0, 0]} center transform occlude distanceFactor={1} zIndexRange={[10, 20]}>
          <div style={{ fontSize: 22, pointerEvents: 'none', userSelect: 'none' }} className="bg-white dark:bg-gray-800 rounded-full px-3 py-2 shadow-lg">
            {currentEmote==='happy'?'😊':currentEmote==='sad'?'😢':currentEmote==='surprised'?'😲':currentEmote==='angry'?'😠':currentEmote==='wave'?'👋':currentEmote==='dance'?'💃':currentEmote==='sleep'?'😴':''}
          </div>
        </Html>
      )}
      {hovered && !isControlled && (
        <Html position={[0, 1.2, 0]} center distanceFactor={10}>
          <div className="bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap shadow-lg pointer-events-none">
            {character.name}
          </div>
        </Html>
      )}
      {(isControlled || isSelected) && (
        <FadingRing position={[0, -0.35, 0]} innerRadius={0.7} outerRadius={1.15} />
      )}
    </>
  );

  const pos: [number, number, number] = [Number(character.positionX) || 0, startY, Number(character.positionZ) || 0];

  if (!character.model?.filePath || error || (!model && !loading)) {
    const colorMap: Record<string, string> = { animal: '#D2691E', bird: '#87CEEB', insect: '#32CD32', mythical: '#9370DB', human: '#FFB6C1', robot: '#A9A9A9', decoration: '#FFD700' };
    return (
      <Ecctrl ref={ecctrlRef} position={pos} floatHeight={0.3} maxWalkVel={2} enable>
        <mesh castShadow receiveShadow position={[0, 0.45, 0]} onClick={handleClick} onPointerEnter={handleEnter} onPointerLeave={handleLeave}>
          <cylinderGeometry args={[0.3, 0.42, 0.9, 10]} />
          <meshStandardMaterial color={colorMap[character.type] || '#FF69B4'} />
        </mesh>
        {overlays}
      </Ecctrl>
    );
  }

  return (
    <Ecctrl ref={ecctrlRef} position={pos} floatHeight={0.3} maxWalkVel={2} maxRunVel={3.5} enable capsuleHalfHeight={0.6} capsuleRadius={0.3}>
      <EcctrlAnimationStateController ecctrl={ecctrlRef} enabled={character.status === 'active'} resolver={createAnimationResolver(animations)} onChange={handleAnimChange} />
      <mesh onClick={handleClick} onPointerEnter={handleEnter} onPointerLeave={handleLeave}>
        <boxGeometry args={[1.2, 1.5, 1.2]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      {model && <primitive object={model} />}
      {overlays}
    </Ecctrl>
  );
}