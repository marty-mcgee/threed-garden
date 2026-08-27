// components/map/ThreeDScene.tsx
'use client';

import {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
  memo,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, Environment, Html, Plane, Grid, 
  GizmoHelper, GizmoViewcube, GizmoViewport,
  Text, Sphere, Box, Cylinder, Cone, Ring 
} from '@react-three/drei';
import {
  CuboidCollider,
  Physics,
  RigidBody,
  type RapierRigidBody,
  type RigidBodyProps,
  useBeforePhysicsStep,
  useRapier,
} from '@react-three/rapier';
import * as THREE from 'three';
import { Settings, ChevronDown, ChevronUp, X, Target, Layers } from 'lucide-react';
import { GardenCharacter } from '@/components/threed/shared/GardenCharacter';
import { EcctrlCharacter } from '@/components/threed/shared/EcctrlCharacter';
import { FadingRing } from '@/components/threed/shared/FadingRing';
import { PulseRing } from '@/components/threed/shared/PulseRing';
import { BedMarker3D } from '@/components/threed/markers/BedMarker3D';
import {
  PlantMarker3D,
  calculatePlantMarkerVisualBounds,
} from '@/components/threed/markers/PlantMarker3D';
import { FarmBotMarker3D } from '@/components/threed/markers/FarmBotMarker3D';
import {
  ModelMarker3D,
  type ModelCollisionBounds,
} from '@/components/threed/markers/ModelMarker3D';
import { WeatherEffects } from '@/components/threed/effects/WeatherEffects';
import type { ThreeDActionTarget } from '@/lib/types/map';
import type { ThreeDModelLibraryItem } from '@/lib/types/threed';
import { planThreeDTargetRelativeNavigation } from '@/lib/services/threed/orchestration/interaction-core';
import { isMatchingThreeDActionTarget } from '@/lib/services/threed/orchestration/action-target-core';
import { calculateThreeDModelInstanceScale } from '@/lib/services/threed/markers/model-visual-fit-core';

interface ThreeDSceneProps {
  incidents: any[];
  markers: any[];
  /** Presentation visibility without removing stable marker runtimes. */
  visibleMarkerIds?: ReadonlySet<string>;
  onIncidentClick?: (incident: any) => void;
  onMarkerClick?: (marker: any) => void;
  onClearSelection?: () => void;
  selectedIncident?: any;
  selectedMarker?: any;
  height?: string;
  autoRotate?: boolean;
  onAutoRotateToggle?: () => void;
  projectId?: number;
  /** ID of the ecctrl character currently being controlled by keyboard */
  controlledCharacterId?: number | null;
  /** Called when an ecctrl character's control state changes, with its current world position */
  onControlChange?: (markerId: string, pos: { x: number; y: number; z: number }) => void;
  /** Sends explicit source identity and live physics position to the Runtime Marker mirror. */
  onRuntimeMarkerPositionChange?: (
    moduleType: string,
    assetId: number,
    pos: { x: number; y: number; z: number },
  ) => void;
  /** Override camera view mode (selected by user in DetailsCard) */
  cameraMode?: CameraViewMode;
  /** v0.16.2-beta: increments to request a manual "zoom + center" on the selected marker */
  focusRequest?: number;
  /** Persistent client-side target for ThreeD character actions. */
  actionTarget?: ThreeDActionTarget | null;
  /** Increments to request camera focus on the current action target. */
  actionTargetFocusRequest?: number;
  /** Library model selected for one click-to-place operation. */
  placementModel?: ThreeDModelLibraryItem | null;
  /** Called with the ground point selected during placement mode. */
  onModelPlacement?: (position: { x: number; y: number; z: number }) => void;
  /** Character Library item currently awaiting a ground placement click. */
  placementCharacterName?: string | null;
  /** Called with the ground point selected for a Character. */
  onCharacterPlacement?: (position: { x: number; y: number; z: number }) => void;
  /** Existing FarmBot currently awaiting a Project Scene placement click. */
  placementFarmBotName?: string | null;
  /** Called with the ground point selected for a FarmBot. */
  onFarmBotPlacement?: (position: { x: number; y: number; z: number }) => void;
  /** New Bed currently awaiting a ground placement click. */
  placementBedName?: string | null;
  /** Called with the ground point selected for a new Bed. */
  onBedPlacement?: (position: { x: number; y: number; z: number }) => void;
  /** New Planting currently awaiting a ground placement click. */
  placementPlantingName?: string | null;
  /** Called with the ground point selected for a new Planting. */
  onPlantingPlacement?: (position: { x: number; y: number; z: number }) => void;
}

function isRapierFrameError(reason: unknown): boolean {
  const message = reason instanceof Error
    ? reason.message
    : typeof reason === 'string'
      ? reason
      : '';
  return message.includes('unreachable executed')
    || message.includes('recursive use of an object detected which would lead to unsafe aliasing in rust')
    || message.includes('attempted to take ownership of Rust value while it was borrowed');
}

// ✅ View Preset Types
interface ViewPreset {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  layers: string[];
  createdAt: string;
}

// ✅ Marker colors by type
const getMarkerColor = (type: string): string => {
  const colors: Record<string, string> = {
    plantings: '#22c55e',
    beds: '#f59e0b',
    characters: '#8b5cf6',
    markers: '#ec4899',
    layers: '#06b6d4',
    farmbots: '#64748b',
  };
  return colors[type] || '#6b7280';
};

const normalizeSceneLayerType = (type: unknown): string => {
  const normalized = String(type ?? '').trim().toLowerCase();
  const aliases: Record<string, string> = {
    plant: 'plantings',
    plants: 'plantings',
    planting: 'plantings',
    bed: 'beds',
    character: 'characters',
    farmbot: 'farmbots',
    model: 'models',
    layer: 'layers',
    marker: 'markers',
  };
  return aliases[normalized] || normalized;
};

function calculateBounds(positions: { x: number; z: number }[]) {
  // ✅ Filter out NaN/Infinity positions before computing bounds
  const valid = positions.filter(p => isFinite(p.x) && isFinite(p.z));
  if (valid.length === 0) {
    return { minX: -20, maxX: 20, minZ: -20, maxZ: 20, width: 40, height: 40, centerX: 0, centerZ: 0 };
  }
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  valid.forEach(p => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.z < minZ) minZ = p.z;
    if (p.z > maxZ) maxZ = p.z;
  });
  const padding = 15;
  return {
    minX: minX - padding,
    maxX: maxX + padding,
    minZ: minZ - padding,
    maxZ: maxZ + padding,
    width: maxX - minX + padding * 2,
    height: maxZ - minZ + padding * 2,
    centerX: (minX + maxX) / 2,
    centerZ: (minZ + maxZ) / 2,
  };
}

// ✅ Detects when OrbitControls ref is ready
function ControlsReadyNotifier({ controlsRef, onReady }: { controlsRef: any; onReady: () => void }) {
  const called = useRef(false);
  useFrame(() => {
    if (controlsRef.current && !called.current) {
      called.current = true;
      onReady();
    }
  });
  return null;
}

// v0.16.1-beta: Camera Controller — supports multiple view modes for selected characters
// v0.16.2-beta: re-added 'orbit' mode
type CameraViewMode = 'follow' | 'topdown' | 'firstperson' | 'orbit' | 'stationary';

function CameraController({
  controlsRef,
  cameraFollowRef,
  mode,
  enabled,
}: {
  controlsRef: any;
  cameraFollowRef: React.MutableRefObject<THREE.Vector3 | null>;
  mode: CameraViewMode;
  enabled: boolean;
}) {
  const followTarget = useRef(new THREE.Vector3());
  // Track previous position for velocity/direction calculation
  const prevPos = useRef<THREE.Vector3 | null>(null); // null = uninitialized
  const facingDir = useRef(new THREE.Vector3(0, 0, 1)); // default forward
  const orbitElapsed = useRef(0); // accumulated time for orbit mode
  // Store original constraints to restore on unmount/mode change
  const originalConstraints = useRef<{ maxPolarAngle?: number; minDistance?: number; maxDistance?: number; enableDamping?: boolean }>({});

  // Apply and restore orbit constraints for angle-locked modes (topdown, firstperson)
  useEffect(() => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;

    // Save originals on first run
    if (originalConstraints.current.enableDamping === undefined) {
      originalConstraints.current = {
        maxPolarAngle: controls.maxPolarAngle,
        minDistance: controls.minDistance,
        maxDistance: controls.maxDistance,
        enableDamping: controls.enableDamping,
      };
    }

    if (!enabled) return;

    const orig = originalConstraints.current;

    switch (mode) {
      case 'topdown':
        controls.maxPolarAngle = 0.1;
        break;
      case 'firstperson':
        // Kill damping so manual camera positioning works immediately
        controls.enableDamping = false;
        controls.minDistance = 1;
        controls.maxDistance = 4;
        if (orig.maxPolarAngle !== undefined) controls.maxPolarAngle = orig.maxPolarAngle;
        break;
      default:
        // Restore original constraints for other modes
        if (orig.enableDamping !== undefined) controls.enableDamping = orig.enableDamping;
        if (orig.maxPolarAngle !== undefined) controls.maxPolarAngle = orig.maxPolarAngle;
        if (orig.minDistance !== undefined) controls.minDistance = orig.minDistance;
        if (orig.maxDistance !== undefined) controls.maxDistance = orig.maxDistance;
    }

    return () => {
      if (controlsRef.current) {
        if (orig.enableDamping !== undefined) controlsRef.current.enableDamping = orig.enableDamping;
        if (orig.maxPolarAngle !== undefined) controlsRef.current.maxPolarAngle = orig.maxPolarAngle;
        if (orig.minDistance !== undefined) controlsRef.current.minDistance = orig.minDistance;
        if (orig.maxDistance !== undefined) controlsRef.current.maxDistance = orig.maxDistance;
      }
    };
  }, [mode, enabled]);

  useFrame((_, delta) => {
    if (!enabled || !controlsRef.current || !cameraFollowRef.current) return;

    const controls = controlsRef.current;
    const charPos = cameraFollowRef.current;

    // Initialize/update prevPos for velocity tracking
    if (!prevPos.current) {
      prevPos.current = charPos.clone();
    }
    const dx = charPos.x - prevPos.current.x;
    const dz = charPos.z - prevPos.current.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > 0.01) {
      // Smoothly blend facing direction toward movement direction
      const rawDir = new THREE.Vector3(dx / dist, 0, dz / dist);
      facingDir.current.lerp(rawDir, 0.15);
      facingDir.current.normalize();
    }
    prevPos.current.copy(charPos);

    switch (mode) {
      case 'follow':
        // Target + camera both track character at constant offset → character stays same size
        performLerp(followTarget.current, charPos, 0.08);
        controls.target.lerp(followTarget.current, 0.08);
        // Maintain camera at constant distance from character
        const camOffset = new THREE.Vector3().subVectors(controls.object.position, charPos);
        camOffset.y = Math.max(camOffset.y, 2); // keep at least 2 units above
        if (camOffset.length() > 1) camOffset.normalize().multiplyScalar(8); // constant 8-unit radius
        controls.object.position.lerp(charPos.clone().add(camOffset), 0.08);
        break;

      case 'topdown':
        // Target follows character, camera positioned directly overhead
        performLerp(followTarget.current, charPos, 0.08);
        controls.target.lerp(followTarget.current, 0.08);
        const overhead = new THREE.Vector3(charPos.x, charPos.y + 15, charPos.z);
        controls.object.position.lerp(overhead, 0.1);
        break;

      case 'orbit':
        // Slow orbit around the character at a fixed radius and height
        orbitElapsed.current += delta;
        performLerp(followTarget.current, charPos, 0.08);
        controls.target.lerp(followTarget.current, 0.08);
        const orbitAng = orbitElapsed.current * 0.3;
        const orbitPos = new THREE.Vector3(
          charPos.x + Math.cos(orbitAng) * 8,
          charPos.y + 5,
          charPos.z + Math.sin(orbitAng) * 8,
        );
        controls.object.position.lerp(orbitPos, 0.08);
        break;

      case 'firstperson':
        // Camera behind character based on smoothed facing direction
        const behindDist = 4.0;
        const camHeight = 1.2; // lower to ground — see beds, plants, and farmbots
        const lookAhead = new THREE.Vector3(
          charPos.x + facingDir.current.x * 3.0,
          charPos.y + 0.8, // look slightly above ground
          charPos.z + facingDir.current.z * 3.0,
        );
        controls.target.lerp(lookAhead, 0.12);
        const behindPos = new THREE.Vector3(
          charPos.x - facingDir.current.x * behindDist,
          charPos.y + camHeight,
          charPos.z - facingDir.current.z * behindDist,
        );
        controls.object.position.lerp(behindPos, 0.12);
        break;

      default:
        // stationary: no target tracking, no camera movement — free-roaming
        break;
    }
  });

  return null;
}

// Simple lerp helper
function performLerp(out: THREE.Vector3, target: THREE.Vector3, factor: number) {
  out.x += (target.x - out.x) * factor;
  out.y += (target.y - out.y) * factor;
  out.z += (target.z - out.z) * factor;
}

// ✅ v0.15.3: Keyboard shortcuts for canvas interaction
function SceneKeyboardControls({
  onEscape, onResetView, onToggleGrid, onFocusSelected,
  hasSelected,
}: {
  onEscape: () => void;
  onResetView: () => void;
  onToggleGrid: () => void;
  onFocusSelected: () => void;
  hasSelected: boolean;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key.toLowerCase()) {
        case 'escape': e.preventDefault(); onEscape(); break;
        case 'r': if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); onResetView(); } break;
        case 'g': if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); onToggleGrid(); } break;
        case 'f': if (!e.ctrlKey && !e.metaKey && hasSelected) { e.preventDefault(); onFocusSelected(); } break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onEscape, onResetView, onToggleGrid, onFocusSelected, hasSelected]);
  return null;
}

// ✅ Camera Focus Animation Component
function CameraFocusAnimation({ target, controlsRef, onComplete }: any) {
  const { camera } = useThree();
  const progress = useRef(0);
  const startPos = useRef(new THREE.Vector3());
  const startTarget = useRef(new THREE.Vector3());
  const endPos = useRef(new THREE.Vector3());
  
  useEffect(() => {
    if (!controlsRef.current) return;
    
    startPos.current.copy(camera.position);
    startTarget.current.copy(controlsRef.current.target);
    
    const requestedCameraPosition = target.cameraPosition;
    if (
      requestedCameraPosition
      && [requestedCameraPosition.x, requestedCameraPosition.y, requestedCameraPosition.z]
        .every((value) => Number.isFinite(Number(value)))
    ) {
      endPos.current.set(
        Number(requestedCameraPosition.x),
        Number(requestedCameraPosition.y),
        Number(requestedCameraPosition.z),
      );
    } else {
      endPos.current.set(
        target.x + 4,
        target.y + 3,
        target.z + 4
      );
    }
    
    progress.current = 0;
  }, [target, camera, controlsRef]);
  
  useFrame(() => {
    if (!controlsRef.current) return;
    
    progress.current += 0.025;
    if (progress.current >= 1) {
      progress.current = 1;
      if (onComplete) onComplete();
    }
    
    const ease = 1 - Math.pow(1 - progress.current, 3);
    
    camera.position.lerpVectors(startPos.current, endPos.current, ease);
    controlsRef.current.target.lerpVectors(
      startTarget.current, 
      new THREE.Vector3(target.x, target.y, target.z), 
      ease
    );
    controlsRef.current.update();
  });
  
  return null;
}

// ✅ Incident Marker
function IncidentMarker3D({ incident, onClick, isSelected }: any) {
  const [hovered, setHovered] = useState(false);
  const color = incident.severity === 'critical' ? '#ef4444' :
                incident.severity === 'high' ? '#f97316' :
                incident.severity === 'medium' ? '#eab308' : '#22c55e';
  const size = isSelected ? 1.2 : 0.8;

  return (
    <group
      position={[Number(incident.position.x) || 0, Number(incident.position.y) || 0, Number(incident.position.z) || 0]}
      onClick={(e) => { e.stopPropagation(); if (onClick) onClick(); }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <mesh castShadow>
        <sphereGeometry args={[size * (hovered ? 1.3 : 1), 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isSelected ? 0.5 : 0.2} roughness={0.3} metalness={0.1} />
      </mesh>
      {isSelected && (
        <mesh>
          <ringGeometry args={[size * 1.5, size * 2, 32]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}
      {hovered && (
        <Html position={[0, size * 2 + 0.5, 0]} distanceFactor={10}>
          <div className="bg-black/80 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap pointer-events-none">
            {incident.title}
          </div>
        </Html>
      )}
    </group>
  );
}

function SceneMarkerRigidBody({
  sceneEnabled,
  position,
  rotation,
  ...props
}: RigidBodyProps & { sceneEnabled: boolean }) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const previousSceneEnabledRef = useRef(sceneEnabled);
  const positionTuple = position as [number, number, number] | undefined;
  const rotationTuple = rotation as [number, number, number] | undefined;
  const positionKey = positionTuple?.join(':') ?? '';
  const rotationKey = rotationTuple?.join(':') ?? '';
  const appliedTransformKeyRef = useRef(`${positionKey}|${rotationKey}`);
  const pendingTransformRef = useRef<{
    position?: [number, number, number];
    rotation?: [number, number, number];
  } | null>(null);

  useEffect(() => {
    const transformKey = `${positionKey}|${rotationKey}`;
    if (appliedTransformKeyRef.current === transformKey) return;
    appliedTransformKeyRef.current = transformKey;
    pendingTransformRef.current = {
      position: positionTuple ? [...positionTuple] : undefined,
      rotation: rotationTuple ? [...rotationTuple] : undefined,
    };
  }, [positionKey, rotationKey]);

  useBeforePhysicsStep(() => {
    const pending = pendingTransformRef.current;
    const body = rigidBodyRef.current;
    if (!pending || !body) return;
    pendingTransformRef.current = null;
    if (pending.position) {
      body.setTranslation({
        x: pending.position[0],
        y: pending.position[1],
        z: pending.position[2],
      }, true);
    }
    if (pending.rotation) {
      const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(
        pending.rotation[0],
        pending.rotation[1],
        pending.rotation[2],
      ));
      body.setRotation(quaternion, true);
    }
  });

  useEffect(() => () => {
    // @react-three/rapier 2.2.0 does not clear forwarded RigidBody refs when
    // the body is removed. Never retain a wrapper around a freed WASM handle.
    rigidBodyRef.current = null;
  }, []);

  useEffect(() => {
    if (previousSceneEnabledRef.current === sceneEnabled) return;
    const body = rigidBodyRef.current;
    if (!body) return;
    previousSceneEnabledRef.current = sceneEnabled;
    body.setEnabled(sceneEnabled);
  }, [sceneEnabled]);

  return <RigidBody ref={rigidBodyRef} position={position} rotation={rotation} {...props} />;
}

function EnabledColliderDebug() {
  const { world } = useRapier();
  const geometryRef = useRef<THREE.BufferGeometry>(null);

  useFrame(() => {
    const geometry = geometryRef.current;
    if (!geometry) return;

    const { vertices, colors } = world.debugRender();
    const visibleVertices: number[] = [];
    const visibleColors: number[] = [];
    const isDisabledColor = (offset: number) => {
      const red = colors[offset];
      const green = colors[offset + 1];
      const blue = colors[offset + 2];
      return Math.abs(red - green) < 0.000001 && Math.abs(green - blue) < 0.000001;
    };

    // Rapier keeps disabled colliders in its debug buffer and renders their
    // line segments in grayscale. Filter those complete segments so layer
    // visibility affects only that layer's diagnostic outline.
    for (let vertexOffset = 0; vertexOffset < vertices.length; vertexOffset += 6) {
      const firstColorOffset = (vertexOffset / 3) * 4;
      const secondColorOffset = firstColorOffset + 4;
      if (isDisabledColor(firstColorOffset) && isDisabledColor(secondColorOffset)) continue;

      visibleVertices.push(...vertices.slice(vertexOffset, vertexOffset + 6));
      visibleColors.push(
        colors[firstColorOffset],
        colors[firstColorOffset + 1],
        colors[firstColorOffset + 2],
        colors[secondColorOffset],
        colors[secondColorOffset + 1],
        colors[secondColorOffset + 2],
      );
    }

    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(visibleVertices, 3),
    );
    geometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(visibleColors, 3),
    );
  });

  return (
    <lineSegments frustumCulled={false}>
      <lineBasicMaterial vertexColors toneMapped={false} />
      <bufferGeometry ref={geometryRef} />
    </lineSegments>
  );
}

function ProjectModelMarkerBody({
  marker,
  position,
  rotation,
  scale,
  onClick,
  isSelected,
  isActionTarget,
  isLayerEnabled,
  physicsDebug,
}: {
  marker: any;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  onClick?: () => void;
  isSelected: boolean;
  isActionTarget: boolean;
  isLayerEnabled: boolean;
  physicsDebug: boolean;
}) {
  const [collisionBounds, setCollisionBounds] = useState<ModelCollisionBounds | null>(null);
  const handleCollisionBoundsChange = useCallback((bounds: ModelCollisionBounds | null) => {
    setCollisionBounds(bounds);
  }, []);

  useEffect(() => {
    if (physicsDebug) {
      console.debug('[ThreeD Model Physics]', {
        markerId: marker.id,
        modelId: marker.data?.modelId,
        scale,
        bounds: collisionBounds,
      });
    }
  }, [collisionBounds, marker.data?.modelId, marker.id, physicsDebug, scale]);

  const colliderKey = collisionBounds
    ? [...collisionBounds.center, ...collisionBounds.halfExtents]
        .map((value) => value.toFixed(4))
        .join(':')
    : null;

  return (
    <SceneMarkerRigidBody
      sceneEnabled={isLayerEnabled}
      type="fixed"
      colliders={false}
      position={position}
      rotation={rotation}
    >
      {collisionBounds && colliderKey && (
        <CuboidCollider
          key={colliderKey}
          args={collisionBounds.halfExtents}
          position={collisionBounds.center}
        />
      )}
      <group
        visible={isLayerEnabled}
        onClick={(event) => {
          if (!isLayerEnabled) return;
          event.stopPropagation();
          onClick?.();
        }}
      >
        <ModelMarker3D
          model={marker.data}
          position={[0, 0, 0]}
          name={marker.name}
          scale={scale}
          applyStoredScale={false}
          animationSpeed={marker.data?.animationSpeed || 1}
          onCollisionBoundsChange={handleCollisionBoundsChange}
        />
        {isSelected && <FadingRing position={[0, 0.02, 0]} innerRadius={0.9} outerRadius={1.2} />}
        {isActionTarget && <PulseRing position={[0, 0.025, 0]} color="#10b981" size={1.05} />}
      </group>
    </SceneMarkerRigidBody>
  );
}

function characterSceneSignature(marker: any): string {
  const data = marker?.data ?? {};
  const model = data.model ?? {};
  return JSON.stringify({
    markerId: String(marker?.id ?? ''),
    sourceId: Number(data.id),
    characterId: String(data.characterId ?? ''),
    name: String(data.name ?? marker?.name ?? ''),
    type: String(data.type ?? ''),
    status: String(data.status ?? ''),
    visible: data.visible !== false,
    isMovable: data.isMovable === true,
    movementType: String(data.movementType ?? ''),
    speed: Number(data.speed ?? 0),
    scale: Number(data.scale ?? 1),
    rotation: Number(data.rotation ?? 0),
    model: {
      id: Number(model.id),
      filePath: String(model.filePath ?? ''),
      modelType: String(model.modelType ?? ''),
      modelName: String(model.modelName ?? ''),
      scale: String(model.scale ?? '1'),
      rotationY: String(model.rotationY ?? '0'),
      animationMap: model.metadata?.animationMap ?? null,
    },
  });
}

const CharacterSceneInstance = memo(function CharacterSceneInstance({
  marker,
  isSelected,
  isActionTarget,
  isLayerEnabled,
  placementActive,
  controlledCharacterId,
  actionTarget,
  onClick,
  onControlChange,
  cameraFollowRef,
  livePositionsRef,
}: any) {
  const signature = characterSceneSignature(marker);
  const characterDataRef = useRef(marker.data);
  const characterSignatureRef = useRef(signature);
  if (characterSignatureRef.current !== signature) {
    characterSignatureRef.current = signature;
    characterDataRef.current = marker.data;
  }
  const characterData = characterDataRef.current;
  const position: [number, number, number] = [
    Number(marker.position?.x) || 0,
    Number(marker.position?.y) || 0,
    Number(marker.position?.z) || 0,
  ];
  const sourceCharacterId = Number(characterData?.id);
  const isControlled = controlledCharacterId != null
    && controlledCharacterId === sourceCharacterId;
  const selectCharacter = useCallback(() => onClick?.(marker), [marker, onClick]);
  const reportControlChange = useCallback(
    (nextPosition: { x: number; y: number; z: number }) => {
      onControlChange?.(
        marker.id,
        marker.type,
        sourceCharacterId,
        nextPosition,
      );
    },
    [marker.id, marker.type, onControlChange, sourceCharacterId],
  );

  if (characterData?.isMovable === true) {
    return (
      <EcctrlCharacter
        character={characterData}
        runtimePosition={position}
        isControlled={isControlled}
        isSelected={isSelected}
        layerEnabled={isLayerEnabled}
        onClick={selectCharacter}
        onControlChange={reportControlChange}
        cameraFollowRef={cameraFollowRef}
        livePositionsRef={livePositionsRef}
        markerId={marker.id}
        movementTargetPosition={
          isControlled && actionTarget != null
            ? actionTarget.position
            : undefined
        }
        isActionTarget={isActionTarget}
      />
    );
  }

  return (
    <SceneMarkerRigidBody sceneEnabled={isLayerEnabled} type="fixed" colliders="cuboid" position={position}>
      <group
        visible={isLayerEnabled}
        onClick={(event) => {
          if (!isLayerEnabled || placementActive) return;
          event.stopPropagation();
          selectCharacter();
        }}
      >
        <GardenCharacter character={characterData} positionedByParent />
        {isSelected && <FadingRing position={[0, 0.01, 0]} innerRadius={0.7} outerRadius={1.0} />}
        {isActionTarget && <PulseRing position={[0, 0.025, 0]} color="#10b981" size={0.85} />}
      </group>
    </SceneMarkerRigidBody>
  );
}, (previous: any, next: any) => (
  String(previous.marker.id) === String(next.marker.id)
  && characterSceneSignature(previous.marker) === characterSceneSignature(next.marker)
  && Number(previous.marker.position?.x) === Number(next.marker.position?.x)
  && Number(previous.marker.position?.y) === Number(next.marker.position?.y)
  && Number(previous.marker.position?.z) === Number(next.marker.position?.z)
  && previous.isSelected === next.isSelected
  && previous.isActionTarget === next.isActionTarget
  && previous.isLayerEnabled === next.isLayerEnabled
  && previous.placementActive === next.placementActive
  && previous.controlledCharacterId === next.controlledCharacterId
  && previous.actionTarget === next.actionTarget
  && previous.onClick === next.onClick
  && previous.onControlChange === next.onControlChange
  && previous.cameraFollowRef === next.cameraFollowRef
  && previous.livePositionsRef === next.livePositionsRef
));

// ✅ ThreeD Marker Component
const ThreeDMarkerComponent = memo(function ThreeDMarkerComponent({ marker, onClick, isSelected, isActionTarget, isLayerEnabled, placementActive, onPlacementHover, onPlacementClick, actionTarget, controlledCharacterId, onControlChange, cameraFollowRef, livePositionsRef, physicsDebug }: any) {
  const [hovered, setHovered] = useState(false);
  const color = marker.color || getMarkerColor(marker.type);
  const size = isSelected ? 1.0 : 0.6;
  const selectMarker = useCallback(() => onClick?.(marker), [marker, onClick]);

  // ✅ v0.15.0/15.2: Render rich markers for types that have dedicated components
  const pos: [number, number, number] = [Number(marker.position.x) || 0, Number(marker.position.y) || 0, Number(marker.position.z) || 0];

  if (marker.type === 'character' || marker.type === 'characters') {
    return (
      <CharacterSceneInstance
        marker={marker}
        isSelected={isSelected}
        isActionTarget={isActionTarget}
        isLayerEnabled={isLayerEnabled}
        placementActive={placementActive}
        controlledCharacterId={controlledCharacterId}
        actionTarget={actionTarget}
        onClick={onClick}
        onControlChange={onControlChange}
        cameraFollowRef={cameraFollowRef}
        livePositionsRef={livePositionsRef}
      />
    );
  }

  // v0.16.2-alpha: Beds — restore click, wrap in RigidBody
  if (marker.type === 'bed' || marker.type === 'beds') {
    const bedRotationDegrees = Number(marker.data?.rotation) || 0;
    const bedRotation = bedRotationDegrees * Math.PI / 180;
    const bedScale = Math.max(Number(marker.data?.scale) || 1, 0.01);
    const bedWidth = Math.max(Number(marker.data?.widthFeet ?? marker.data?.width) || 4, 0.1);
    const bedLength = Math.max(
      Number(marker.data?.lengthFeet ?? marker.data?.length ?? marker.data?.depth) || 8,
      0.1,
    );
    const bedHeight = Math.max(Number(marker.data?.heightFeet) || 0.3, 0.1);
    const bedColliderSize = {
      width: (bedWidth + 0.1) * bedScale,
      height: (bedHeight + 0.15) * bedScale,
      length: (bedLength + 0.1) * bedScale,
    };
    const bedColliderKey = [
      bedColliderSize.width,
      bedColliderSize.height,
      bedColliderSize.length,
    ].map((value) => value.toFixed(4)).join(':');
    return (
      <SceneMarkerRigidBody
        sceneEnabled={isLayerEnabled}
        type="fixed"
        colliders={false}
        position={pos}
        rotation={[0, bedRotation, 0]}
      >
        <CuboidCollider
          key={bedColliderKey}
          args={[
            bedColliderSize.width / 2,
            bedColliderSize.height / 2,
            bedColliderSize.length / 2,
          ]}
          position={[0, bedColliderSize.height / 2, 0]}
        />
        <group
          visible={isLayerEnabled}
          scale={[bedScale, bedScale, bedScale]}
          onPointerMove={(e) => {
            if (!isLayerEnabled || !placementActive) return;
            e.stopPropagation();
            onPlacementHover?.({ x: e.point.x, y: e.point.y, z: e.point.z });
          }}
          onClick={(e) => {
            if (!isLayerEnabled) return;
            e.stopPropagation();
            if (placementActive) {
              onPlacementClick?.({ x: e.point.x, y: e.point.y, z: e.point.z });
              return;
            }
            selectMarker();
          }}
        >
          <BedMarker3D bed={{ ...(marker.data || {}), width: bedWidth, depth: bedLength, heightFeet: bedHeight, name: marker.name, soilType: marker.data?.soilType, sunExposure: marker.data?.sunExposure, plantingsCount: marker.data?.plantingsCount ?? marker.data?._plantingsCount ?? 0 }} position={[0, 0, 0]} />
          {isSelected && <FadingRing position={[0, 0.02, 0]} innerRadius={3.2} outerRadius={4.0} segments={48} />}
          {isActionTarget && <PulseRing position={[0, 0.025, 0]} color="#10b981" size={3.5} />}
        </group>
      </SceneMarkerRigidBody>
    );
  }

  // v0.16.2-alpha: Plantings — restore click, wrap in RigidBody
  if (marker.type === 'planting' || marker.type === 'plantings') {
    const plantingModelScale = Math.max(Number(marker.data?.modelScale) || 1, 0.01);
    const plantingVisualBounds = calculatePlantMarkerVisualBounds(marker.data?.growthStage);
    const plantingColliderRadius = plantingVisualBounds.radius * plantingModelScale;
    const plantingColliderHeight = plantingVisualBounds.height * plantingModelScale;
    const plantingColliderKey = [plantingColliderRadius, plantingColliderHeight]
      .map((value) => value.toFixed(4))
      .join(':');
    return (
      <SceneMarkerRigidBody sceneEnabled={isLayerEnabled} type="fixed" colliders={false} position={pos}>
        <CuboidCollider
          key={plantingColliderKey}
          args={[
            plantingColliderRadius,
            plantingColliderHeight / 2,
            plantingColliderRadius,
          ]}
          position={[0, plantingColliderHeight / 2, 0]}
        />
        <group
          visible={isLayerEnabled}
          scale={[plantingModelScale, plantingModelScale, plantingModelScale]}
          onClick={(event) => {
            if (!isLayerEnabled || placementActive) return;
            event.stopPropagation();
            selectMarker();
          }}
        >
          <PlantMarker3D plant={{ ...(marker.data || {}), name: marker.name, species: marker.data?.plantType || marker.data?.commonName || marker.data?.plantName || '', z: marker.position.z, x: marker.position.x, plantedAt: marker.data?.plantedDate || marker.data?.plantedAt || '', growthStage: marker.data?.growthStage, health: marker.data?.health, quantity: 1, status: marker.data?.status }} position={[0, 0, 0]} />
          {isSelected && <FadingRing position={[0, 0.02, 0]} innerRadius={0.5} outerRadius={0.75} />}
          {isActionTarget && <PulseRing position={[0, 0.025, 0]} color="#10b981" size={0.72} />}
        </group>
      </SceneMarkerRigidBody>
    );
  }

  // Project Models own a fixed body with an explicit collider. Their external
  // geometry loads after mount, so automatic child-derived colliders are not reliable.
  if (marker.type === 'model' || marker.type === 'models') {
    const instanceRotation: [number, number, number] = [
      Number(marker.data?.rotationX ?? 0),
      Number(marker.data?.rotationYInstance ?? 0),
      Number(marker.data?.rotationZ ?? 0),
    ];
    const instanceScale = calculateThreeDModelInstanceScale(
      marker.data?.scale,
      marker.data?.scaleMultiplier,
    );
    return <ProjectModelMarkerBody
      marker={marker}
      position={pos}
      rotation={instanceRotation}
      scale={instanceScale}
      onClick={selectMarker}
      isSelected={isSelected}
      isActionTarget={isActionTarget}
      isLayerEnabled={isLayerEnabled}
      physicsDebug={physicsDebug}
    />;
  }

  // v0.16.2-alpha: Farmbots get fixed RigidBody cuboid collider
  if (marker.type === 'farmbot' || marker.type === 'farmbots') {
    const fbData = marker.data || {};
    const fbStatus = fbData.status?.toLowerCase() || 'offline';
    const fbStatusColor = ({ online: '#22c55e', offline: '#ef4444', busy: '#f59e0b', maintenance: '#3b82f6', error: '#ef4444' } as Record<string, string>)[fbStatus] || '#6b7280';
    const farmBotScale = Math.max(Number(fbData.scale) || 1, 0.01);
    const farmBotWidth = Math.max(Number(fbData.widthFeet) || 3, 0.1) * farmBotScale;
    const farmBotLength = Math.max(Number(fbData.lengthFeet) || 6, 0.1) * farmBotScale;
    const farmBotHeight = Math.max(Number(fbData.heightFeet) || 3, 0.1) * farmBotScale;
    const farmBotRotation = (Number(fbData.rotation) || 0) * Math.PI / 180;
    const farmBotColor = typeof fbData.color === 'string' ? fbData.color : '#4B5563';
    const farmBotColliderKey = [farmBotWidth, farmBotHeight, farmBotLength]
      .map((value) => value.toFixed(4))
      .join(':');

    return (
      <SceneMarkerRigidBody
        sceneEnabled={isLayerEnabled}
        type="fixed"
        colliders={false}
        position={pos}
        rotation={[0, farmBotRotation, 0]}
      >
        <CuboidCollider
          key={farmBotColliderKey}
          args={[farmBotWidth / 2, farmBotHeight / 2, farmBotLength / 2]}
          position={[0, farmBotHeight / 2, 0]}
        />
        <group
          visible={isLayerEnabled}
          scale={[farmBotWidth / 0.6, farmBotHeight / 0.58, farmBotLength / 0.4]}
          onClick={(e) => { if (!isLayerEnabled) return; e.stopPropagation(); selectMarker(); }}
          onPointerEnter={() => { if (isLayerEnabled) setHovered(true); }}
          onPointerLeave={() => setHovered(false)}
        >
          <mesh position={[0, 0.15, 0]} castShadow>
            <boxGeometry args={[0.6, 0.3, 0.4]} />
            <meshStandardMaterial color={farmBotColor} roughness={0.3} metalness={0.6} />
          </mesh>
          <mesh position={[0, 0.27, 0]} castShadow>
            <boxGeometry args={[0.55, 0.04, 0.35]} />
            <meshStandardMaterial color={fbStatusColor} roughness={0.2} metalness={0.4} />
          </mesh>
          <mesh position={[0, 0.4, 0.2]} castShadow>
            <sphereGeometry args={[0.15, 12, 12]} />
            <meshStandardMaterial color={fbStatusColor} roughness={0.2} metalness={0.3} />
          </mesh>
          <mesh position={[0, 0.52, 0.2]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.12]} />
            <meshStandardMaterial color="#9CA3AF" roughness={0.2} metalness={0.8} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.3, 0.05, 0.25]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 0.04]} />
            <meshStandardMaterial color="#1f2937" roughness={0.8} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} position={[0.3, 0.05, 0.25]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 0.04]} />
            <meshStandardMaterial color="#1f2937" roughness={0.8} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.3, 0.05, -0.25]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 0.04]} />
            <meshStandardMaterial color="#1f2937" roughness={0.8} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} position={[0.3, 0.05, -0.25]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 0.04]} />
            <meshStandardMaterial color="#1f2937" roughness={0.8} />
          </mesh>
          {hovered && (
            <Html position={[0, 0.85, 0]} center distanceFactor={8}>
              <div className="bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap pointer-events-none">
                {marker.name} — {fbStatus} — {Math.round(fbData.batteryLevel ?? fbData.battery ?? 50)}%
              </div>
            </Html>
          )}
          {isSelected && <FadingRing position={[0, 0.02, 0]} innerRadius={0.5} outerRadius={0.75} />}
          {isActionTarget && <PulseRing position={[0, 0.025, 0]} color="#10b981" size={0.72} />}
        </group>
      </SceneMarkerRigidBody>
    );
  }

  const getShape = () => {
    const s = size;
    switch (marker.type) {
      case 'layers':
        return <boxGeometry args={[s * 1.2, s * 0.2, s * 1.2]} />;
      default:
        return <boxGeometry args={[s, s, s]} />;
    }
  };

  return (
    <group
      visible={isLayerEnabled}
      position={[Number(marker.position.x) || 0, Number(marker.position.y) || 0, Number(marker.position.z) || 0]}
      onClick={(e) => { if (!isLayerEnabled) return; e.stopPropagation(); selectMarker(); }}
      onPointerEnter={() => { if (isLayerEnabled) setHovered(true); }}
      onPointerLeave={() => setHovered(false)}
    >
      <mesh>
        {getShape()}
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isSelected ? 0.4 : 0.05} roughness={0.4} metalness={0.2} />
      </mesh>
      {isSelected && <FadingRing position={[0, 0.02, 0]} innerRadius={size * 1.2} outerRadius={size * 1.5} />}
    </group>
  );
});

// ✅ Procedural grass texture generator (canvas-based, no external files needed)
function createGrassTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  
  // Base soil color
  ctx.fillStyle = '#3d5a1e';
  ctx.fillRect(0, 0, 512, 512);
  
  // Random grass blades
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const shade = 0.4 + Math.random() * 0.6;
    const r = Math.floor(30 * shade);
    const g = Math.floor(90 * shade);
    const b = Math.floor(20 * shade);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(x, y, 2 + Math.random() * 3, 2 + Math.random() * 4);
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Shadow light with proper target direction and massive frustum depth
function ShadowLight({ centerX, centerZ }: { centerX: number; centerZ: number }) {
  const lightRef = useRef<THREE.DirectionalLight>(null);

  useEffect(() => {
    const light = lightRef.current;
    if (!light) return;
    // Point the light straight down at the scene center
    light.target.position.set(centerX, 0, centerZ);
    light.target.updateMatrixWorld();
    // Set massive frustum
    light.shadow.camera.left = -300;
    light.shadow.camera.right = 300;
    light.shadow.camera.top = 300;
    light.shadow.camera.bottom = -300;
    light.shadow.camera.near = 1;
    light.shadow.camera.far = 5000;
    light.shadow.camera.updateProjectionMatrix();
    light.shadow.needsUpdate = true;
  }, [centerX, centerZ]);

  return (
    <directionalLight
      ref={lightRef}
      position={[centerX, 30, centerZ]}
      intensity={1.2}
      castShadow
      shadow-mapSize-width={4096}
      shadow-mapSize-height={4096}
    />
  );
}

// Interactive Ground with shadow catching + left-click deselect
function InteractiveGround({
  size,
  centerX,
  centerZ,
  onClick,
  placementActive,
  onPlacementHover,
  onPlacementLeave,
  onPlacementClick,
}: any) {
  const grassTexture = useMemo(() => {
    const tex = createGrassTexture();
    const repeat = Math.max(size / 4, 1);
    tex.repeat.set(repeat, repeat);
    return tex;
  }, [size]);

  return (
    <group>
      {/* Shadow catching plane (transparent, catches shadows) */}
      <Plane
        args={[size, size]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[centerX, -0.05, centerZ]}
        receiveShadow
      >
        <shadowMaterial transparent opacity={0.35} />
      </Plane>
      {/* Visual ground plane with grass texture */}
      <Plane
        args={[size, size]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[centerX, -0.1, centerZ]}
        receiveShadow
      >
        <meshStandardMaterial
          map={grassTexture}
          roughness={0.85}
          metalness={0}
          color="#ffffff"
        />
      </Plane>

      {/* ✅ v0.15.3: Invisible click target for left-click deselect */}
      <Plane
        args={[size, size]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[centerX, -0.03, centerZ]}
        onPointerMove={(e) => {
          if (!placementActive) return;
          onPlacementHover?.({ x: e.point.x, y: 0, z: e.point.z });
        }}
        onPointerLeave={() => onPlacementLeave?.()}
        onClick={(e) => {
          e.stopPropagation();
          if (placementActive) {
            onPlacementClick?.({ x: e.point.x, y: 0, z: e.point.z });
          } else if (onClick) {
            onClick();
          }
        }}
      >
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </Plane>
    </group>
  );
}

export function ThreeDScene({
  incidents,
  markers,
  visibleMarkerIds,
  onIncidentClick,
  onMarkerClick,
  onClearSelection,
  selectedIncident,
  selectedMarker,
  height = '100%',
  autoRotate = false,
  onAutoRotateToggle,
  controlledCharacterId,
  onControlChange,
  onRuntimeMarkerPositionChange,
  cameraMode,
  focusRequest = 0,
  actionTarget,
  actionTargetFocusRequest = 0,
  placementModel,
  onModelPlacement,
  placementCharacterName,
  onCharacterPlacement,
  placementFarmBotName,
  onFarmBotPlacement,
  placementBedName,
  onBedPlacement,
  placementPlantingName,
  onPlantingPlacement,
}: ThreeDSceneProps) {
  const placementLabel = placementCharacterName
    || placementFarmBotName
    || placementPlantingName
    || placementBedName
    || placementModel?.modelName
    || null;
  // v0.16.0-delta: Shared ref for camera follow — character writes position here each frame
  const cameraFollowRef = useRef<THREE.Vector3 | null>(null);
  // v0.16.2-beta: Persistent store of each ecctrl character's live physics position,
  // keyed by marker id — so re-selecting a moved character focuses its current spot.
  const livePositionsRef = useRef<Map<string, { x: number; y: number; z: number }>>(new Map());
  const selectedMarkerRef = useRef(selectedMarker);
  selectedMarkerRef.current = selectedMarker;
  const controlsRef = useRef<any>(null);
  const [hasData, setHasData] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  // Start with debug reads disabled even when an old bookmarked URL contains
  // `physicsDebug=1`. The user may enable diagnostics after the Rapier world
  // has mounted successfully through the Controls menu.
  const [physicsDebug, setPhysicsDebug] = useState(false);
  const [physicsFailed, setPhysicsFailed] = useState(false);
  const stopCanvasFrameLoopRef = useRef<(() => void) | null>(null);
  const physicsFailureHandledRef = useRef(false);
  const physicsUnmountTimerRef = useRef<number | null>(null);
  const stopPhysicsFrameLoop = useCallback(() => {
    if (physicsFailureHandledRef.current) return;
    physicsFailureHandledRef.current = true;
    // Stop R3F synchronously, but do not free Rapier values while the failed
    // physics step still holds its WASM borrow. The timer runs only after the
    // current JavaScript/Rapier call stack has fully unwound.
    stopCanvasFrameLoopRef.current?.();
    physicsUnmountTimerRef.current = window.setTimeout(() => {
      physicsUnmountTimerRef.current = null;
      setPhysicsFailed(true);
    }, 0);
  }, []);
  const [physicsIsolation] = useState(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('physicsIsolation');
  });
  const [characterIsolation] = useState(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('characterIsolation');
  });
  const [characterMarkerIsolation] = useState(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('characterMarkerId');
  });
  const [showControls, setShowControls] = useState(false);
  const [showGizmoCube, setShowGizmoCube] = useState(true);
  const [controlsReady, setControlsReady] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<any>(null);
  const [placementPreviewPosition, setPlacementPreviewPosition] = useState<{
    x: number;
    y: number;
    z: number;
  } | null>(null);

  useEffect(() => {
    if (!placementLabel) setPlacementPreviewPosition(null);
  }, [placementLabel]);

  useEffect(() => {
    const handleWindowError = (event: ErrorEvent) => {
      if (!isRapierFrameError(event.error ?? event.message)) return;
      event.preventDefault();
      stopPhysicsFrameLoop();
    };
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (!isRapierFrameError(event.reason)) return;
      event.preventDefault();
      stopPhysicsFrameLoop();
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      if (physicsUnmountTimerRef.current !== null) {
        window.clearTimeout(physicsUnmountTimerRef.current);
        physicsUnmountTimerRef.current = null;
      }
    };
  }, [stopPhysicsFrameLoop]);
  
  // ✅ Camera focus state
  const [focusTarget, setFocusTarget] = useState<any>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // ✅ Layer visibility state
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set(['beds', 'characters', 'farmbots', 'models', 'plantings', 'layers']));
  const sceneMarkers = useMemo(() => {
    if (physicsIsolation === 'all-markers') return [];
    const filterCharacterRuntime = (candidateMarkers: typeof markers) => candidateMarkers.filter(
      (marker) => {
        if (normalizeSceneLayerType(marker.type) !== 'characters') return true;
        if (characterIsolation === 'movable' && marker.data?.isMovable !== true) return false;
        if (characterIsolation === 'non-movable' && marker.data?.isMovable === true) return false;
        return characterMarkerIsolation === null || String(marker.id) === characterMarkerIsolation;
      },
    );
    if (physicsIsolation?.startsWith('only-')) {
      const isolatedLayers = new Set(
        physicsIsolation
          .slice('only-'.length)
          .split(',')
          .map((layer) => layer.trim())
          .filter(Boolean),
      );
      return filterCharacterRuntime(markers.filter((marker) => (
        isolatedLayers.has(normalizeSceneLayerType(marker.type))
      )));
    }
    return filterCharacterRuntime(markers);
  }, [characterIsolation, characterMarkerIsolation, markers, physicsIsolation]);

  useEffect(() => {
    if (physicsIsolation) {
      console.debug('[ThreeD Physics Isolation]', {
        mode: physicsIsolation,
        characterMode: characterIsolation,
        characterMarkerId: characterMarkerIsolation,
        sourceMarkerCount: markers.length,
        mountedMarkerCount: sceneMarkers.length,
        markers: sceneMarkers.map((marker) => ({
          markerId: String(marker.id),
          type: normalizeSceneLayerType(marker.type),
          position: {
            x: Number(marker.position?.x),
            y: Number(marker.position?.y),
            z: Number(marker.position?.z),
          },
          ...(normalizeSceneLayerType(marker.type) === 'beds' ? {
            dimensions: {
              widthFeet: Number(marker.data?.widthFeet ?? marker.data?.width ?? 4),
              lengthFeet: Number(
                marker.data?.lengthFeet ?? marker.data?.length ?? marker.data?.depth ?? 8,
              ),
              heightFeet: Number(marker.data?.heightFeet ?? 1),
              scale: Number(marker.data?.scale ?? 1),
              rotationDegrees: Number(marker.data?.rotation ?? 0),
            },
          } : {}),
          ...(normalizeSceneLayerType(marker.type) === 'characters' ? {
            character: {
              isMovable: marker.data?.isMovable === true,
              movementType: String(marker.data?.movementType ?? ''),
            },
          } : {}),
        })),
      });
    }
  }, [characterIsolation, characterMarkerIsolation, markers.length, physicsIsolation, sceneMarkers]);

  // ✅ View presets state
  const [viewPresets, setViewPresets] = useState<ViewPreset[]>([]);
  const [showPresetDialog, setShowPresetDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [envPreset, setEnvPreset] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('threed-env-preset') || 'night';
    }
    return 'night';
  });
  const [showIncidents, setShowIncidents] = useState(false);

  useEffect(() => {
    setHasData(incidents.length > 0 || markers.length > 0);
  }, [incidents, markers]);

  // Fallback: if ControlsReadyNotifier doesn't fire within 1s, check manually
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (controlsRef.current && !controlsReady) {
        setControlsReady(true);
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [controlsReady]);

  // ✅ Load presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('threed-view-presets');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setViewPresets(parsed);
      } catch (e) {
        console.error('Failed to load view presets:', e);
      }
    }
  }, []);

  // ✅ Save presets to localStorage
  useEffect(() => {
    localStorage.setItem('threed-view-presets', JSON.stringify(viewPresets));
  }, [viewPresets]);

  // ✅ Persist environment preset to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('threed-env-preset', envPreset);
    }
  }, [envPreset]);

  // Scene visibility controls operate on the marker types that are actually
  // present. Database ThreeD Layer records do not currently assign individual
  // Runtime Markers to a layer record, so they cannot accurately drive this UI.
  const availableLayers = useMemo(() => Array.from(new Set(
    markers
      .map((marker) => normalizeSceneLayerType(marker.type))
      .filter(Boolean),
  )).sort(), [markers]);

  const visibleMarkers = markers.filter((marker) => {
    if (activeLayers.size === 0) return false;
    return activeLayers.has(normalizeSceneLayerType(marker.type))
      && (visibleMarkerIds?.has(String(marker.id)) ?? true);
  });

  const visibleIncidents = showIncidents ? incidents : [];
  const allPositions = [
    ...visibleIncidents.map((i: any) => ({ x: Number(i.position.x) || 0, z: Number(i.position.z) || 0 })),
    ...markers.map((m: any) => ({ x: Number(m.position.x) || 0, z: Number(m.position.z) || 0 }))
  ];
  const bounds = calculateBounds(allPositions);
  const centerX = isFinite(bounds.centerX) ? bounds.centerX : 0;
  const centerZ = isFinite(bounds.centerZ) ? bounds.centerZ : 0;
  const maxDimension = Math.min(Math.max(bounds.width, bounds.height), 500);
  const cameraDistance = Math.min(Math.max(maxDimension * 1.5, 20), 750);
  const groundSize = Math.min(Math.max(maxDimension + 10, 30), 500);

  const availableTypeCounts = markers.reduce((acc: Record<string, number>, marker: any) => {
    const type = normalizeSceneLayerType(marker.type);
    if (type) acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const typeCounts = visibleMarkers.reduce((acc: Record<string, number>, marker: any) => {
    const type = normalizeSceneLayerType(marker.type);
    if (type) acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const allAvailableLayersVisible = availableLayers.length > 0
    && availableLayers.every((layer) => activeLayers.has(layer));

  const zoomToPosition = (x: number, z: number) => {
    if (controlsRef.current) {
      const zoomDistance = Math.max(maxDimension * 0.7, 8);
      controlsRef.current.target.set(x, 0, z);
      controlsRef.current.object.position.set(
        x + zoomDistance * 0.7,
        zoomDistance * 0.5,
        z + zoomDistance * 0.7
      );
      controlsRef.current.update();
    }
  };

  // ✅ Focus on marker
  const focusOnMarker = (
    marker: any,
    cameraPosition?: { x: number; y: number; z: number },
  ) => {
    if (!marker || !controlsRef.current) return;
    setFocusTarget({
      x: Number(marker.position.x) || 0,
      y: Number(marker.position.y) || 0,
      z: Number(marker.position.z) || 0,
      cameraPosition,
    });
    setIsAnimating(true);
  };

  // ✅ Handle focus complete
  const handleFocusComplete = () => {
    setIsAnimating(false);
    setFocusTarget(null);
  };

  // v0.16.2-beta: Record an ecctrl character's live physics position and forward it up
  // so the parent can keep the DetailsCard coordinates in sync on control changes.
  // useCallback keeps the identity stable so EcctrlCharacter's effect doesn't re-fire endlessly.
  const storeLivePosition = useCallback((
    markerId: string,
    moduleType: string,
    assetId: number,
    pos: { x: number; y: number; z: number },
  ) => {
    livePositionsRef.current.set(markerId, pos);
    onRuntimeMarkerPositionChange?.(moduleType, assetId, pos);
    onControlChange?.(markerId, pos);
  }, [onControlChange, onRuntimeMarkerPositionChange]);

  // ✅ Enhanced marker click handler
  const handleMarkerClick = useCallback((marker: any) => {
    // v0.16.2-beta: Prefer the tracked live position (if any) so camera focus and the
    // DetailsCard reflect where the ecctrl character actually is, not its DB origin.
    const livePos = livePositionsRef.current.get(marker.id);
    const currentMarker = livePos
      ? { ...marker, position: { x: livePos.x, y: livePos.y, z: livePos.z } }
      : marker;

    const metadata: any = {
      ...currentMarker.metadata,
      ...(currentMarker.data || {}),
    };
    
    if (currentMarker.type === 'plantings' && currentMarker.data) {
      metadata.plantName = currentMarker.data.plantName || currentMarker.data.commonName || '';
    }
    
    if (currentMarker.type === 'beds' && currentMarker.data) {
      const width = currentMarker.data.widthFeet || currentMarker.data.width;
      const length = currentMarker.data.lengthFeet || currentMarker.data.length;
      if (width && length) {
        metadata.dimensions = `${width}ft × ${length}ft`;
      }
    }
    
    if (currentMarker.type === 'farmbots' && currentMarker.data) {
      metadata.assetCode = currentMarker.data.assetCode || '';
      metadata.farmbotDeviceId = currentMarker.data.farmbotDeviceId || '';
      metadata.brokerDeviceId = currentMarker.data.brokerDeviceId || '';
      metadata.batteryLevel = currentMarker.data.batteryLevel || 0;
      metadata.firmwareVersion = currentMarker.data.firmwareVersion || '';
      metadata.lastSeen = currentMarker.data.lastSeen || '';
    }
    
    if (currentMarker.type === 'characters' && currentMarker.data) {
      metadata.characterType = currentMarker.data.type || '';
      metadata.emote = currentMarker.data.defaultEmote || '';
      metadata.movementType = currentMarker.data.movementType || '';
      metadata.interactable = currentMarker.data.interactable || false;
    }
    
    const isAlreadySelected = selectedMarkerRef.current?.id === currentMarker.id
      && selectedMarkerRef.current?.type === currentMarker.type;
    setSelectedDetails(isAlreadySelected ? null : {
      name: currentMarker.name || currentMarker.label || 'Unknown',
      type: currentMarker.type,
      position: currentMarker.position,
      metadata: metadata,
    });
    
    if (onMarkerClick) onMarkerClick(currentMarker);
  }, [onMarkerClick]);

  const handleIncidentClick = (incident: any) => {
    const isAlreadySelected = (selectedIncident as any)?.key === incident.key;
    setSelectedDetails(isAlreadySelected ? null : {
      name: incident.title,
      type: 'incident',
      position: incident.position,
      metadata: { 
        severity: incident.severity, 
        source: incident.source, 
        location: incident.location 
      },
    });
    if (onIncidentClick) onIncidentClick(incident);
  };

  // v0.16.2-beta: Manual zoom + center via DetailsCard button (no auto-zoom on select).
  useEffect(() => {
    if (focusRequest > 0 && selectedDetails?.position) {
      focusOnMarker(selectedDetails);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRequest]);

  // Focus the persistent action target without changing marker selection.
  useEffect(() => {
    const position = actionTarget?.position;
    if (
      actionTargetFocusRequest > 0 &&
      position &&
      [position.x, position.y, position.z].every((value) => Number.isFinite(Number(value)))
    ) {
      const characterPosition = cameraFollowRef.current;
      if (characterPosition) {
        const navigation = planThreeDTargetRelativeNavigation({
          characterPosition,
          targetPosition: position,
        });
        if (navigation.hasDirection) {
          const viewDistance = 6;
          focusOnMarker(
            { position },
            {
              x: characterPosition.x
                - navigation.forwardDirection.x * viewDistance,
              y: characterPosition.y + 3,
              z: characterPosition.z
                - navigation.forwardDirection.z * viewDistance,
            },
          );
          return;
        }
      }
      focusOnMarker({ position });
    }
    // The request counter is the imperative trigger; replacing a target alone must not focus it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionTargetFocusRequest]);

  const clearDetails = () => {
    setSelectedDetails(null);
    onClearSelection?.();
  };

  // ✅ Save current view as preset
  const saveCurrentView = () => {
    if (!controlsRef.current) return;
    if (!newPresetName.trim()) {
      alert('Please enter a name for this view');
      return;
    }
    
    const preset: ViewPreset = {
      id: `view-${Date.now()}`,
      name: newPresetName.trim(),
      position: {
        x: controlsRef.current.object.position.x,
        y: controlsRef.current.object.position.y,
        z: controlsRef.current.object.position.z,
      },
      target: {
        x: controlsRef.current.target.x,
        y: controlsRef.current.target.y,
        z: controlsRef.current.target.z,
      },
      layers: Array.from(activeLayers),
      createdAt: new Date().toISOString(),
    };
    
    setViewPresets([...viewPresets, preset]);
    setNewPresetName('');
    setShowPresetDialog(false);
  };

  // ✅ Load a view preset
  const loadViewPreset = (preset: ViewPreset) => {
    if (!controlsRef.current) return;
    
    const targetPos = new THREE.Vector3(preset.position.x, preset.position.y, preset.position.z);
    const targetTarget = new THREE.Vector3(preset.target.x, preset.target.y, preset.target.z);
    
    controlsRef.current.object.position.copy(targetPos);
    controlsRef.current.target.copy(targetTarget);
    controlsRef.current.update();
    
    setActiveLayers(new Set(preset.layers));
    setSelectedPresetId(preset.id);
    
    setTimeout(() => setSelectedPresetId(null), 2000);
  };

  // ✅ Delete a view preset
  const deleteViewPreset = (id: string) => {
    if (confirm('Delete this saved view?')) {
      setViewPresets(viewPresets.filter(p => p.id !== id));
    }
  };

  return (
    <div
      className={`relative w-full ${placementLabel ? 'cursor-crosshair' : ''}`}
      style={{ height, minHeight: '300px' }}
    >
      {placementLabel && (
        <div className="pointer-events-none absolute left-3 top-3 z-10 rounded border border-cyan-300/40 bg-black/70 px-3 py-1.5 text-xs text-white shadow-lg backdrop-blur-sm">
          Click the ground to place <span className="font-medium">{placementLabel}</span>
        </div>
      )}
      {/* Controls Panel */}
      <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1">
        <button
          onClick={() => setShowControls(!showControls)}
          className="bg-black/60 hover:bg-black/80 text-white px-2 py-1 rounded text-xs backdrop-blur-sm transition-colors flex items-center gap-1.5 border border-white/10"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Controls</span>
          {showControls ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showControls && (
          <div className="bg-black/70 backdrop-blur-sm rounded border border-white/10 p-1 pb-2.5 min-h-[260px] overflow-y-auto w-[176px] space-y-0.5">
            <button onClick={onAutoRotateToggle} className="w-full text-left text-white/90 hover:bg-white/10 px-2 py-0.5 rounded text-xs transition-colors">
              {autoRotate ? '⏸️ Pause Rotation' : '▶️ Auto-Rotate'}
            </button>
            <button onClick={() => setShowGrid(!showGrid)} className="w-full text-left text-white/90 hover:bg-white/10 px-2 py-0.5 rounded text-xs transition-colors">
              {showGrid ? '🔲 Hide Grid' : '🔳 Show Grid'}
            </button>
            {hasData && Object.keys(typeCounts).length > 0 && (
              <button onClick={() => setShowLegend(!showLegend)} className="w-full text-left text-white/90 hover:bg-white/10 px-2 py-0.5 rounded text-xs transition-colors">
                {showLegend ? '📋 Hide Legend' : '📋 Show Legend'}
              </button>
            )}
            <button
              onClick={() => setPhysicsDebug(!physicsDebug)}
              className="w-full text-left text-white/90 hover:bg-white/10 px-2 py-0.5 rounded text-xs transition-colors"
              aria-pressed={physicsDebug}
            >
              {physicsDebug ? '🧱 Hide Physics Debug' : '🧱 Show Physics Debug'}
            </button>
            <button onClick={() => setShowGizmoCube(!showGizmoCube)} className="w-full text-left text-white/90 hover:bg-white/10 px-2 py-0.5 rounded text-xs transition-colors">
              {showGizmoCube ? '🔢 Hide Gizmo' : '🔳 Show Gizmo'}
            </button>
            {incidents.length > 0 && (
              <button onClick={() => setShowIncidents(!showIncidents)} className="w-full text-left text-white/90 hover:bg-white/10 px-2 py-0.5 rounded text-xs transition-colors">
                {showIncidents ? '🚨 Hide Incidents' : '🚨 Show Incidents'}
              </button>
            )}
            <div className="border-t border-white/10 my-1" />
            <div className="text-[10px] text-white/60 px-2 py-0.5">Environment</div>
            <select
              value={envPreset}
              onChange={(e) => setEnvPreset(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white/80 focus:outline-none focus:border-white/30 appearance-none"
              style={{ scrollbarWidth: 'thin' }}
            >
              {['sunset','dawn','night','city','forest','park','warehouse','apartment','studio','lobby'].map(p => (
                <option key={p} value={p} className="bg-gray-800 text-white">{p}</option>
              ))}
            </select>
            <button
              onClick={() => {
                setSelectedDetails(null);
                if (controlsRef.current) zoomToPosition(centerX, centerZ);
              }}
              className="w-full text-left text-white/90 hover:bg-white/10 px-2 py-0.5 rounded text-xs transition-colors"
            >
              🎯 Center View
            </button>
            
            {/* ✅ Save View button */}
            <button
              onClick={() => setShowPresetDialog(true)}
              className="w-full text-left text-white/90 hover:bg-white/10 px-2 py-0.5 rounded text-xs transition-colors"
            >
              💾 Save Current View
            </button>
            
            {/* ✅ View presets list */}
            {viewPresets.length > 0 && (
              <>
                <div className="border-t border-white/10 my-1"></div>
                <div className="text-[10px] text-white/60 px-2 py-0.5">Saved Views</div>
                {viewPresets.map((preset) => (
                  <div key={preset.id} className="flex items-center gap-1 group">
                    <button
                      onClick={() => loadViewPreset(preset)}
                      className={`flex-1 text-left px-2 py-0.5 rounded text-xs transition-colors ${
                        selectedPresetId === preset.id
                          ? 'text-green-400 bg-green-500/20'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {preset.name}
                    </button>
                    <button
                      onClick={() => deleteViewPreset(preset.id)}
                      className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all text-xs px-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </>
            )}
            
            {/* Layer controls */}
            {availableLayers.length > 0 && (
              <>
                <div className="border-t border-white/10 my-1"></div>
                <div className="text-[10px] text-white/60 px-2 py-0.5 flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  <span>Scene Layers</span>
                  <button
                    onClick={() => {
                      if (allAvailableLayersVisible) {
                        setActiveLayers(new Set());
                      } else {
                        setActiveLayers(new Set(availableLayers));
                      }
                    }}
                    className="ml-auto text-[10px] text-white/40 hover:text-white/80 transition-colors"
                  >
                    {allAvailableLayersVisible ? 'Hide All' : 'Show All'}
                  </button>
                </div>
                {availableLayers.map((layer) => (
                  <button
                    key={layer}
                    onClick={() => {
                      const newSet = new Set(activeLayers);
                      if (newSet.has(layer)) {
                        newSet.delete(layer);
                      } else {
                        newSet.add(layer);
                      }
                      setActiveLayers(newSet);
                    }}
                    className={`w-full text-left px-2 py-0.5 rounded text-xs transition-colors flex items-center gap-1.5 ${
                      activeLayers.has(layer) 
                        ? 'text-white hover:bg-white/10' 
                        : 'text-white/40 hover:bg-white/5'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: activeLayers.has(layer) ? getMarkerColor(layer) : '#4b5563' }}
                    />
                    <span className="capitalize">{layer}</span>
                    <span className="ml-auto text-[10px] flex items-center gap-1">
                      <span className="text-white/40">{availableTypeCounts[layer] ?? 0}</span>
                      {activeLayers.has(layer) ? '👁️' : '👁️‍🗨️'}
                    </span>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* ✅ Save View Dialog */}
      {showPresetDialog && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-black/90 border border-white/10 rounded-lg p-4 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-white">Save Current View</h3>
              <button
                onClick={() => setShowPresetDialog(false)}
                className="text-white/40 hover:text-white/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-xs text-white/50 mb-3">
              Save the current camera position and active layers as a named view.
            </p>
            
            <input
              type="text"
              placeholder="Enter view name..."
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveCurrentView();
                if (e.key === 'Escape') setShowPresetDialog(false);
              }}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
              autoFocus
            />
            
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setShowPresetDialog(false)}
                className="flex-1 px-3 py-1.5 text-xs text-white/60 hover:text-white/80 border border-white/10 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveCurrentView}
                className="flex-1 px-3 py-1.5 text-xs bg-primary text-white rounded hover:bg-primary/80 transition-colors"
              >
                Save View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      {hasData && showLegend && Object.keys(typeCounts).length > 0 && (
        <div className="absolute bottom-3 left-3 z-10 bg-black/70 backdrop-blur-sm text-white p-2 rounded border border-white/10 min-w-[90px]">
          <div className="text-[10px] font-medium text-white/80 mb-1">Legend</div>
          {(Object.entries(typeCounts) as [string, number][]).map(([type, count]) => (
            <div key={type} className="flex items-center gap-1.5 text-[10px] text-white/70 py-0.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getMarkerColor(type) }} />
              <span className="capitalize">{type}: {count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tooltip */}
      {/* <div className="absolute bottom-3 right-3 z-10 text-[10px] text-white/40 bg-black/40 px-2 py-1 rounded">
        Left-click: Select • Right-click: Zoom
      </div> */}

      {physicsFailed ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/90 p-4">
          <div className="w-80 rounded border border-red-400/40 bg-black p-4 text-center text-white shadow-xl">
            <div className="text-sm font-semibold text-red-300">ThreeD physics stopped</div>
            <div className="mt-1 text-xs text-white/70">
              The Canvas was unmounted after a physics error. Restart the development server before testing again.
            </div>
          </div>
        </div>
      ) : (
      <Canvas
        onCreated={(state) => {
          stopCanvasFrameLoopRef.current = () => state.setFrameloop('never');
        }}
        camera={{
          position: [centerX + cameraDistance * 0.4, cameraDistance * 0.5, centerZ + cameraDistance * 0.4],
          fov: 45,
        }}
        gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
        shadows={{ type: THREE.PCFShadowMap }}
      >
        <Environment preset={envPreset as any} background blur={0.8} />

        <ambientLight intensity={0.6} />
        <ShadowLight centerX={centerX} centerZ={centerZ} />
        <directionalLight position={[-5, 5, -5]} intensity={0.3} />
        <hemisphereLight args={['#87CEEB', '#2d5a27', 0.4]} />

        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={2}
          maxDistance={200}
          maxPolarAngle={Math.PI / 2}
          autoRotate={autoRotate}
          autoRotateSpeed={0.8}
          target={[centerX, 0, centerZ]}
        />
        <ControlsReadyNotifier
          controlsRef={controlsRef}
          onReady={() => setControlsReady(true)}
        />

        {/* v0.16.2-alpha: Camera controller — follows controlled ecctrl character
            Uses user-selected cameraMode from DetailsCard, falls back to DB movementPattern */}
        {controlledCharacterId != null && (() => {
          const controlledMarker = visibleMarkers.find((m) => m.data?.id === controlledCharacterId);
          const pattern = controlledMarker?.data?.movementPattern;
          const validModes: CameraViewMode[] = ['follow', 'topdown', 'firstperson', 'orbit', 'stationary'];
          // Priority: user-selected cameraMode > DB movementPattern > default 'follow'
          const mode: CameraViewMode = (cameraMode && validModes.includes(cameraMode))
            ? cameraMode
            : validModes.includes(pattern as CameraViewMode)
              ? pattern as CameraViewMode
              : 'follow';
          return (
            <CameraController
              controlsRef={controlsRef}
              cameraFollowRef={cameraFollowRef}
              mode={mode}
              enabled={true}
            />
          );
        })()}

        {/* ORBIT CONTROLS GIZMO HELPER */}
        {controlsReady && showGizmoCube && (
          <GizmoHelper
            alignment='bottom-right'
            margin={[64, 64]}
          >
            <group scale={0.7}>
              <GizmoViewcube />
            </group>
            <group
              scale={1.4}
              position={[-24, -24, -24]}
            >
              <GizmoViewport
                labelColor='white'
                axisHeadScale={0.5}
                hideNegativeAxes
              />
            </group>
          </GizmoHelper>
        )}

        {/* ✅ v0.15.3: Keyboard shortcuts for camera navigation */}
        <SceneKeyboardControls
          onEscape={() => { clearDetails(); setIsAnimating(false); setFocusTarget(null); }}
          onResetView={() => zoomToPosition(centerX, centerZ)}
          onToggleGrid={() => setShowGrid(!showGrid)}
          onFocusSelected={() => { if (selectedDetails?.position) focusOnMarker(selectedDetails); }}
          hasSelected={!!selectedDetails}
        />

        <Physics gravity={[0, -9.81, 0]}>
          {physicsDebug && <EnabledColliderDebug />}
          {/* v0.16.0-alpha: Interactive ground plane as fixed physics body */}
          <RigidBody type="fixed" colliders="cuboid">
            <InteractiveGround
              size={groundSize}
              centerX={centerX}
              centerZ={centerZ}
              onClick={clearDetails}
              placementActive={Boolean(placementLabel)}
              onPlacementHover={setPlacementPreviewPosition}
              onPlacementLeave={() => setPlacementPreviewPosition(null)}
              onPlacementClick={placementCharacterName
                ? onCharacterPlacement
                : placementFarmBotName
                  ? onFarmBotPlacement
                : placementPlantingName
                  ? onPlantingPlacement
                  : placementBedName
                    ? onBedPlacement
                    : onModelPlacement}
            />
          </RigidBody>

          {placementLabel && placementPreviewPosition && (
            <group position={[
              placementPreviewPosition.x,
              placementPreviewPosition.y + 0.25,
              placementPreviewPosition.z,
            ]}>
              <mesh raycast={() => null}>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshStandardMaterial color="#22d3ee" transparent opacity={0.45} />
              </mesh>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.24, 0]} raycast={() => null}>
                <ringGeometry args={[0.45, 0.6, 32]} />
                <meshBasicMaterial color="#22d3ee" transparent opacity={0.8} side={THREE.DoubleSide} />
              </mesh>
            </group>
          )}

          {showGrid && (
            <Grid
              args={[groundSize, Math.floor(groundSize / 0.5)]}
              position={[centerX, -0.05, centerZ]}
              cellColor="#4a7c43"
              sectionColor="#3a6a34"
              fadeDistance={groundSize * 1.2}
              fadeStrength={0.8}
              cellSize={0.5}
              sectionSize={2.5}
            />
          )}

          {/* Camera focus animation */}
          {focusTarget && (
            <CameraFocusAnimation 
              target={focusTarget}
              controlsRef={controlsRef}
              onComplete={handleFocusComplete}
            />
          )}

          {/* Focus glow indicator */}
          {focusTarget && (
            <mesh position={[Number(focusTarget.x) || 0, (Number(focusTarget.y) || 0) + 0.5, Number(focusTarget.z) || 0]}>
              <ringGeometry args={[0.8, 1.2, 32]} />
              <meshBasicMaterial color="#FFD700" transparent opacity={0.4} side={THREE.DoubleSide} />
            </mesh>
          )}

          {visibleIncidents.map((incident, idx) => (
            <IncidentMarker3D
              key={`incident_${idx}_${(incident as any).key || incident.id || ''}`}
              incident={incident}
              onClick={() => handleIncidentClick(incident)}
              isSelected={(selectedIncident as any)?.key === (incident as any).key}
            />
          ))}

          {sceneMarkers.map((marker, idx) => (
            <ThreeDMarkerComponent
              key={`threed-marker-${marker.id ?? `${marker.type}-${idx}`}`}
              marker={marker}
              onClick={handleMarkerClick}
              isSelected={selectedMarker?.id === marker.id && selectedMarker?.type === marker.type}
              isLayerEnabled={
                activeLayers.has(normalizeSceneLayerType(marker.type))
                && (visibleMarkerIds?.has(String(marker.id)) ?? true)
              }
              placementActive={Boolean(placementLabel)}
              onPlacementHover={setPlacementPreviewPosition}
              onPlacementClick={placementCharacterName
                ? onCharacterPlacement
                : placementFarmBotName
                  ? onFarmBotPlacement
                : placementPlantingName
                  ? onPlantingPlacement
                  : placementBedName
                    ? onBedPlacement
                    : onModelPlacement}
              isActionTarget={
                actionTarget != null &&
                isMatchingThreeDActionTarget(actionTarget, {
                  markerType: String(marker.type ?? ''),
                  assetId: Number(marker.data?.id),
                })
              }
              actionTarget={actionTarget}
              controlledCharacterId={
                normalizeSceneLayerType(marker.type) === 'characters'
                && Number(marker.data?.id) === controlledCharacterId
                  ? controlledCharacterId
                  : null
              }
              onControlChange={storeLivePosition}
              cameraFollowRef={cameraFollowRef}
              livePositionsRef={livePositionsRef}
              physicsDebug={physicsDebug}
            />
          ))}
        </Physics>

        {!hasData && (
          <Html position={[0, 2, 0]} distanceFactor={10}>
            <div className="bg-black/60 backdrop-blur-sm text-white px-4 py-3 rounded-lg text-center max-w-xs border border-white/10">
              <p className="text-sm font-medium">No 3D Data Available</p>
              <p className="text-xs opacity-70 mt-1">Select a project with 3D assets or add markers to see them here</p>
            </div>
          </Html>
        )}
      </Canvas>
      )}
    </div>
  );
}
