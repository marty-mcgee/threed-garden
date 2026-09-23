// components/map/ThreeDScene.tsx
'use client';

import { placeHoverTitle } from '@/libraries/services/threed/markers/hover-title-placement';
import { SceneHoverTitleContext } from '@/components/threed/shared/SceneHoverTitleContext';
import { useOptionalSceneTransform } from '@/components/threed/transform/SceneTransformWorkspace';
import { SceneTransformGizmo } from '@/components/threed/transform/SceneTransformGizmo';
import { Button } from '@/components/ui/button';

import { EnvironmentRegionColliders } from '@/components/threed/shared/EnvironmentRegionColliders';
import { resolveBallPhysics } from '@/libraries/services/threed/models/ball-physics';


import {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
  memo,
  Suspense,
} from 'react';
import { createPortal } from 'react-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, Environment, Html, Plane, Grid, useTexture,
  GizmoHelper, GizmoViewcube, GizmoViewport,
  Text, Sphere, Cylinder, Cone, Ring,
} from '@react-three/drei';
import {
  CuboidCollider,
  BallCollider,
  TrimeshCollider,
  Physics,
  RigidBody,
  type RapierRigidBody,
  type RigidBodyProps,
  useBeforePhysicsStep,
} from '@react-three/rapier';
import * as THREE from 'three';
import {
  Settings,
  ChevronDown,
  ChevronUp,
  X,
  Target,
  Layers,
  RotateCw,
  Grid3X3,
  List,
  BrickWall,
  Move3D,
  Siren,
  Crosshair,
  Save,
  Eye,
  EyeOff,
  Trash2,
  Compass,
} from 'lucide-react';
import { GardenCharacter } from '@/components/threed/shared/GardenCharacter';
import { EcctrlCharacter } from '@/components/threed/shared/EcctrlCharacter';
import { ThreeDProjectLoadingPresentation } from '@/components/map/presentation/ThreeDProjectLoadingPresentation';
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
  type ModelGeometryAudit,
} from '@/components/threed/markers/ModelMarker3D';
import { WeatherEffects } from '@/components/threed/effects/WeatherEffects';
import type { ThreeDActionTarget } from '@/libraries/types/map';
import type { ThreeDModelLibraryItem } from '@/libraries/types/threed';
import {
  isMatchingThreeDModelLibraryDragPayload,
  THREED_MODEL_LIBRARY_DRAG_MIME,
} from '@/libraries/services/threed/markers/model-library-drag-core';
import { planThreeDTargetRelativeNavigation } from '@/libraries/services/threed/orchestration/interaction-core';
import { isMatchingThreeDActionTarget } from '@/libraries/services/threed/orchestration/action-target-core';
import { calculateThreeDModelInstanceScale } from '@/libraries/services/threed/markers/model-visual-fit-core';
import {
  isProjectModelEnvironment,
  isProjectModelMovableBall,
  isProjectModelStationaryCollisionReady,
  resolveProjectModelCollisionMode,
  resolveProjectModelEffectiveCollisionMode,
} from '@/libraries/services/threed/models/project-model-instance-core';
import type { ThreeDEnvironmentCollisionPreviewPlan } from '@/libraries/services/threed/models/environment-collision-preview-core';
import { createThreeDEnvironmentColliderActivationPlan } from '@/libraries/services/threed/models/environment-collider-activation-core';
import {
  DEFAULT_THREE_D_ENVIRONMENT_PRESET_KEY,
  resolveThreeDEnvironmentPreset,
  THREE_D_ENVIRONMENT_PRESETS,
} from '@/libraries/services/threed/environment-presets';
import {
  resolveRestoredThreeDActiveLayers,
  type ProjectThreeDViewState,
} from '@/libraries/services/threed/markers/project-view-state-core';
import {
  DEFAULT_PROJECT_GROUND_MAP_TRANSFORM,
  type ProjectGroundMapTransform,
} from '@/libraries/services/threed/ground-maps/project-ground-map-core';
import {
  ThreeDPhysicsEventBuffer,
  type ThreeDPhysicsEventV1,
} from '@/libraries/services/threed/physics/physics-event-core';
import { createThreeDRapierPhysicsEventAdapter, type ThreeDRapierPhysicsEventAdapter } from '@/libraries/services/threed/physics/rapier-physics-event-adapter';
import { SensorContactTracker } from '@/libraries/services/threed/physics/sensor-contact-core';
import { createSensorCounterState, reduceSensorCounterEvent, reconcileSensorCounters, resetSensorCounts, sensorMemberKey, type SensorMember } from '@/libraries/services/threed/physics/sensor-counter-core';
import { readModelVolumeSensor } from '@/libraries/services/threed/physics/sensor-legacy-compat';
import { readPhysicsSensorCuboids, type PhysicsSensorCuboid } from '@/libraries/services/threed/physics/sensor-cuboid-core';
import { useSensorGroups } from '@/components/threed/physics/SensorGroupsWorkspace';
import {
  alignFarmBotPhysicalPosition,
  readFarmBotLiveAlignmentConfiguration,
} from '@/libraries/services/threed/farmbot/coordinate-alignment-core';
import { useFarmBotLiveState } from './useFarmBotLiveState';
import { createThreeDRuntimeMarkerKey, normalizeThreeDRuntimeMarkerModuleType, type ThreeDRuntimeMarkerIdentity } from '@/libraries/services/threed/markers/runtime-marker-core';

interface ProjectGroundMapAsset {
  id: number; name: string; fileName: string; filePath: string;
  width: number; height: number; sourceProvider: string | null; attribution: string | null;
}

function GroundMapImagePlane({ asset, transform }: { asset: ProjectGroundMapAsset; transform: ProjectGroundMapTransform }) {
  const texture = useTexture(asset.filePath);
  const { gl } = useThree();
  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    texture.needsUpdate = true;
  }, [gl, texture]);
  return <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
    <planeGeometry args={[transform.width, transform.length]} />
    <meshStandardMaterial map={texture} transparent opacity={transform.opacity} roughness={0.95} metalness={0} />
  </mesh>;
}

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
  initialViewState?: ProjectThreeDViewState;
  onViewStateProviderChange?: (provider: (() => ProjectThreeDViewState) | null) => void;
  projectId?: number;
  /** Clockwise bearing of local Scene -Z from true north. */
  geographicHeadingDegrees?: number;
  /** ID of the ecctrl character currently being controlled by keyboard */
  controlledCharacterId?: number | null;
  /** Called when an ecctrl character's control state changes, with its current world position */
  onControlChange?: (markerId: string, pos: { x: number; y: number; z: number }, characterId?: number) => void;
  /** Sends explicit source identity and live physics position to the Runtime Marker mirror. */
  onRuntimeMarkerPositionChange?: (
    moduleType: string,
    assetId: number,
    pos: { x: number; y: number; z: number },
  ) => void;
  /** Resolves the registry-authoritative current position for marker reads. */
  resolveRuntimeMarkerPosition?: (
    moduleType: string,
    assetId: number,
  ) => { x: number; y: number; z: number } | null;
  /** Override camera view mode (selected by user in DetailsCard) */
  cameraMode?: CameraViewMode;
  /** Reports an explicit user-driven camera mode change to the Dashboard owner. */
  onCameraModeChange?: (mode: CameraViewMode) => void;
  /** v0.16.2-beta: increments to request a manual "zoom + center" on the selected marker */
  focusRequest?: number;
  /** Increments to focus an explicit Sensor coordinate without changing marker selection. */
  sensorFocusRequest?: number;
  sensorFocusPosition?: { x: number; y: number; z: number } | null;
  /** Persistent client-side target for ThreeD character actions. */
  actionTarget?: ThreeDActionTarget | null;
  /** Increments to request camera focus on the current action target. */
  actionTargetFocusRequest?: number;
  /** Library model selected for one click-to-place operation. */
  placementModel?: ThreeDModelLibraryItem | null;
  /** Called with the ground point selected during placement mode. */
  onModelPlacement?: (position: { x: number; y: number; z: number }) => void;
  /** Existing Project Model currently awaiting a new ground position. */
  movingModelName?: string | null;
  /** Called with the selected replacement position for an existing Project Model. */
  onModelReposition?: (position: { x: number; y: number; z: number }) => void;
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
  /** Physics Sensor Cuboid currently awaiting a Scene surface click. */
  placementPhysicsSensor?: { name: string; width: number; height: number; depth: number; rotationY: number } | null;
  /** Called with the selected Scene coordinate for the Sensor Cuboid base. */
  onPhysicsSensorPlacement?: (position: { x: number; y: number; z: number }) => void;
  /** Reports that the loader and Scene introduction have both completed. */
  onPresentationComplete?: () => void;
  /** Incremented by the Project toolbar when another mutually exclusive menu opens. */
  environmentControlsCloseRequest?: number;
  /** Reports user-driven Environment menu visibility to the Project toolbar owner. */
  onEnvironmentControlsOpenChange?: (open: boolean) => void;
  /** Opens the assigned Environment Model in its Project DetailsCard. */
  onOpenEnvironmentDetails?: () => void;
  hasProjectEnvironment?: boolean;
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

function isSavedCameraCompatibleWithScene(
  view: ProjectThreeDViewState,
  bounds: ReturnType<typeof calculateBounds>,
  maximumUsefulDistance: number,
): boolean {
  const camera = view.cameraPosition;
  const target = view.cameraTarget;
  const targetInsideCurrentScene = target.x >= bounds.minX
    && target.x <= bounds.maxX
    && target.z >= bounds.minZ
    && target.z <= bounds.maxZ;
  const distance = Math.hypot(
    camera.x - target.x,
    camera.y - target.y,
    camera.z - target.z,
  );
  return targetInsideCurrentScene
    && camera.y > -0.5
    && distance >= 1
    && distance <= maximumUsefulDistance;
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

function SceneFrameReadyNotifier({ onReady }: { onReady: () => void }) {
  const reportedRef = useRef(false);

  useFrame(() => {
    if (reportedRef.current) return;
    reportedRef.current = true;
    onReady();
  });

  return null;
}

// v0.16.1-beta: Camera Controller — supports multiple view modes for selected characters
// v0.16.2-beta: re-added 'orbit' mode
type CameraViewMode = 'follow' | 'topdown' | 'firstperson' | 'orbit' | 'stationary';
type ThreeDScenePresentationPhase = 'pre-production' | 'production' | 'post-production';
type ThreeDSceneIntro = 'fade';

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

function SceneHoverTitlePosition({ markerId, point, labelRef }: {
  markerId: string | undefined;
  point: [number, number, number] | undefined;
  labelRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { scene, camera, gl } = useThree();
  const anchor = useRef<{ object: THREE.Object3D; local: THREE.Vector3 } | null>(null);
  const obstacleCache = useRef<{ time: number; rectangles: Array<{ x: number; y: number; width: number; height: number }> }>({ time: -Infinity, rectangles: [] });
  useEffect(() => { anchor.current = null; obstacleCache.current.time = -Infinity; }, [markerId, point]);
  useFrame(({ clock }) => {
    const label = labelRef.current;
    if (!label || !markerId) return;
    const viewport = gl.domElement.getBoundingClientRect();
    if (!anchor.current) {
      const object = scene.getObjectByName(`threed-marker-${markerId}`);
      if (!object) return;
      object.updateWorldMatrix(true, true);
      const box = new THREE.Box3().setFromObject(object);
      if (box.isEmpty()) return;
      const center = box.getCenter(new THREE.Vector3());
      const top = new THREE.Vector3(center.x, box.max.y, center.z);
      const projectedTop = top.clone().project(camera);
      const projectedBottom = new THREE.Vector3(center.x, box.min.y, center.z).project(camera);
      // Large assets use the hovered surface rather than a distant geometry top.
      const world = point && Math.abs(projectedTop.y - projectedBottom.y) * viewport.height / 2 > 200
        ? new THREE.Vector3(...point) : top;
      anchor.current = { object, local: object.worldToLocal(world) };
    }
    const projected = anchor.current.object.localToWorld(anchor.current.local.clone()).project(camera);
    label.style.visibility = projected.z < -1 || projected.z > 1 ? 'hidden' : 'visible';
    if (clock.elapsedTime - obstacleCache.current.time > 0.15) {
      obstacleCache.current.time = clock.elapsedTime;
      obstacleCache.current.rectangles = Array.from(document.querySelectorAll<HTMLElement>('.threed-workspace-panel, [data-scene-hover-obstacle], [class*="z-40"]'))
        .filter(element => element !== label && element.getClientRects().length > 0)
        .map(element => { const r = element.getBoundingClientRect(); return { x: r.left - viewport.left, y: r.top - viewport.top, width: r.width, height: r.height }; });
    }
    const position = placeHoverTitle({ x: (projected.x + 1) * viewport.width / 2, y: (1 - projected.y) * viewport.height / 2 }, viewport, { width: label.offsetWidth, height: label.offsetHeight }, obstacleCache.current.rectangles);
    label.style.left = `${position.x}px`;
    label.style.top = `${position.y}px`;
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
  onLivePosition,
  smoothPosition = false,
  position,
  rotation,
  ...props
}: RigidBodyProps & {
  sceneEnabled: boolean;
  onLivePosition?: (position: { x: number; y: number; z: number }) => void;
  smoothPosition?: boolean;
}) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  useFrame(() => {
    if (!sceneEnabled || !onLivePosition || !rigidBodyRef.current) return;
    const current = rigidBodyRef.current.translation();
    if ([current.x, current.y, current.z].every(Number.isFinite)) onLivePosition({ x: current.x, y: current.y, z: current.z });
  });
  // Match Rapier's initial enabled state so initially hidden Layers synchronize.
  const previousSceneEnabledRef = useRef(true);
  const positionTuple = position as [number, number, number] | undefined;
  const rotationTuple = rotation as [number, number, number] | undefined;
  const positionKey = positionTuple?.join(':') ?? '';
  const rotationKey = rotationTuple?.join(':') ?? '';
  const appliedTransformKeyRef = useRef(`${positionKey}|${rotationKey}`);
  const pendingTransformRef = useRef<{
    position?: [number, number, number];
    rotation?: [number, number, number];
  } | null>(null);
  const liveInterpolationRef = useRef<{
    from: [number, number, number];
    to: [number, number, number];
    startedAt: number;
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
    if (!body) return;
    if (pending) {
      pendingTransformRef.current = null;
      // An explicit placement starts at rest, independent of prior simulation.
      if (body.isDynamic()) {
        body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      }
      if (pending.position) {
        if (smoothPosition) {
          const current = body.translation();
          liveInterpolationRef.current = {
            from: [current.x, current.y, current.z],
            to: pending.position,
            startedAt: Date.now(),
          };
        } else {
          body.setTranslation({
            x: pending.position[0],
            y: pending.position[1],
            z: pending.position[2],
          }, true);
        }
      }
      if (pending.rotation) {
        const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(
          pending.rotation[0],
          pending.rotation[1],
          pending.rotation[2],
        ));
        body.setRotation(quaternion, true);
      }
    }
    const interpolation = liveInterpolationRef.current;
    if (smoothPosition && interpolation) {
      const progress = Math.min((Date.now() - interpolation.startedAt) / 350, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = {
        x: THREE.MathUtils.lerp(interpolation.from[0], interpolation.to[0], eased),
        y: THREE.MathUtils.lerp(interpolation.from[1], interpolation.to[1], eased),
        z: THREE.MathUtils.lerp(interpolation.from[2], interpolation.to[2], eased),
      };
      body.setNextKinematicTranslation(next);
      if (progress >= 1) liveInterpolationRef.current = null;
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

function EnvironmentCollisionPreview({
  boxes,
}: {
  boxes: ThreeDEnvironmentCollisionPreviewPlan['boxes'];
}) {
  const geometry = useMemo(() => {
    const vertices: number[] = [];
    const edgePairs = [
      [0, 1], [1, 3], [3, 2], [2, 0],
      [4, 5], [5, 7], [7, 6], [6, 4],
      [0, 4], [1, 5], [2, 6], [3, 7],
    ];
    for (const box of boxes) {
      const [cx, cy, cz] = box.center;
      const [hx, hy, hz] = box.halfExtents;
      const corners: Array<[number, number, number]> = [
        [cx - hx, cy - hy, cz - hz],
        [cx + hx, cy - hy, cz - hz],
        [cx - hx, cy + hy, cz - hz],
        [cx + hx, cy + hy, cz - hz],
        [cx - hx, cy - hy, cz + hz],
        [cx + hx, cy - hy, cz + hz],
        [cx - hx, cy + hy, cz + hz],
        [cx + hx, cy + hy, cz + hz],
      ];
      for (const [start, end] of edgePairs) vertices.push(...corners[start], ...corners[end]);
    }
    return new THREE.BufferGeometry().setAttribute(
      'position',
      new THREE.Float32BufferAttribute(vertices, 3),
    );
  }, [boxes]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <lineSegments
      name="environment-collision-preview"
      geometry={geometry}
      frustumCulled={false}
      renderOrder={1000}
      raycast={() => null}
    >
      <lineBasicMaterial color="#22d3ee" depthTest={false} depthWrite={false} transparent opacity={0.9} />
    </lineSegments>
  );
}

function PhysicsSensorCuboidChildren({
  marker,
  projectId,
  enabled,
  physicsDebug,
  onPhysicsEvent,
}: {
  marker: any;
  projectId?: number;
  enabled: boolean;
  physicsDebug: boolean;
  onPhysicsEvent?: (event: Readonly<ThreeDPhysicsEventV1>) => void;
}) {
  const transform = useOptionalSceneTransform();
  const sensors = useMemo(() => readPhysicsSensorCuboids(marker.metadata), [marker.metadata]);
  const target = useMemo<ThreeDRuntimeMarkerIdentity | null>(() => {
    const assetId = Number(marker.data?.id);
    const moduleType = normalizeThreeDRuntimeMarkerModuleType(marker.type);
    return moduleType && Number.isSafeInteger(assetId) && assetId > 0
      ? { moduleType, assetId }
      : null;
  }, [marker.data?.id, marker.type]);
  const adaptersRef = useRef(new Map<string, ThreeDRapierPhysicsEventAdapter>());
  const contactsRef = useRef(new SensorContactTracker());
  useEffect(() => { if (!enabled) contactsRef.current.clear(); }, [enabled]);

  const emit = useCallback((kind: 'sensor-enter' | 'sensor-exit', payload: any, sensor: Pick<PhysicsSensorCuboid, 'id' | 'behavior' | 'detection'>) => {
    if (!enabled || !projectId || !target) return;
    if (payload?.other?.collider?.isSensor?.()) return;
    const physicsIdentity = payload?.other?.rigidBodyObject?.userData?.threeDPhysics;
    if (!physicsIdentity || (sensor.detection === 'movable-ball' && !physicsIdentity.isMovableBall)) return;
    const source = physicsIdentity.identity as ThreeDRuntimeMarkerIdentity | undefined;
    if (!source || source.moduleType !== 'models' || !Number.isSafeInteger(source.assetId) || source.assetId <= 0) return;
    const sourceKey = createThreeDRuntimeMarkerKey(source);
    if (!contactsRef.current.observe(kind, sensor.id, sourceKey, payload.other.collider?.handle ?? 0)) return;
    let adapter = adaptersRef.current.get(sourceKey);
    if (!adapter) {
      adapter = createThreeDRapierPhysicsEventAdapter({ projectId, source });
      adaptersRef.current.set(sourceKey, adapter);
    }

    onPhysicsEvent?.(adapter.observe({
      kind,
      occurredAt: new Date().toISOString(),
      target,
      sensor: { ownerMarkerId: Number(marker.data?.projectMarkerId ?? marker.data?.id), id: sensor.id },
      tags: ['physics_sensor'],

    }));
  }, [enabled, onPhysicsEvent, projectId, target, marker.data?.projectMarkerId, marker.data?.id]);

  return <>
    <group name={`threed-transform-owner:${projectId}:${marker.id}`} />
    {sensors.map((sensor) => <CuboidCollider
      key={`physics-sensor-${sensor.id}`}
      sensor
      args={[sensor.width / 2, sensor.height / 2, sensor.depth / 2]}
      position={[sensor.position.x, sensor.position.y, sensor.position.z]}
      rotation={[0, sensor.rotationY * Math.PI / 180, 0]}
      onIntersectionEnter={(payload) => emit('sensor-enter', payload, sensor)}
      onIntersectionExit={(payload) => emit('sensor-exit', payload, sensor)}
    />)}
    {physicsDebug && sensors.filter(sensor => transform?.session?.objectKey !== `${projectId}:${marker.id}:${sensor.id}`).map((sensor) => <mesh
      key={`physics-sensor-debug-${sensor.id}`}
      position={[sensor.position.x, sensor.position.y, sensor.position.z]}
      rotation={[0, sensor.rotationY * Math.PI / 180, 0]}
      raycast={() => null}
    >
      <boxGeometry args={[sensor.width, sensor.height, sensor.depth]} />
      <meshBasicMaterial
        color={sensor.behavior === 'counter' ? '#22d3ee' : '#fbbf24'}
        wireframe transparent opacity={0.9}
      />
    </mesh>)}
  </>;
}

function ProjectModelMarkerBody({
  marker,
  onLivePosition,
  position,
  rotation,
  scale,
  onClick,
  isSelected,
  isActionTarget,
  isLayerEnabled,
  physicsDebug,
  placementActive,
  onPlacementHover,
  onPlacementClick,
  onModelRuntimeSettled,
  characterSpawnPositions,
  projectId,
  onSensorPhysicsEvent,
}: {
  marker: any;
  onLivePosition?: (position: { x: number; y: number; z: number }) => void;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  onClick?: () => void;
  isSelected: boolean;
  isActionTarget: boolean;
  isLayerEnabled: boolean;
  physicsDebug: boolean;
  placementActive: boolean;
  onPlacementHover?: (position: { x: number; y: number; z: number }) => void;
  onPlacementClick?: (position: { x: number; y: number; z: number }) => void;
  onModelRuntimeSettled?: (markerId: string) => void;
  characterSpawnPositions: Array<{ x: number; y: number; z: number }>;
  projectId?: number;
  onSensorPhysicsEvent?: (event: Readonly<ThreeDPhysicsEventV1>) => void;
}) {
  const isEnvironment = isProjectModelEnvironment(marker.metadata);
  const isMovableBall = isProjectModelMovableBall(marker.metadata);
  const hasModelFile = typeof marker.data?.filePath === 'string' && marker.data.filePath.trim().length > 0;
  const requestedCollisionMode = resolveProjectModelCollisionMode(marker.metadata, isEnvironment);
  const wantsSurfaceCollider = requestedCollisionMode === 'triangle-surface' && !isMovableBall;
  const [collisionBounds, setCollisionBounds] = useState<ModelCollisionBounds | null>(null);
  const [regionsReady, setRegionsReady] = useState(false);
  const [geometryAudit, setGeometryAudit] = useState<ModelGeometryAudit | null>(null);
  const [collisionPreview, setCollisionPreview] = useState<ThreeDEnvironmentCollisionPreviewPlan | null>(null);
  const [modelVisualSettled, setModelVisualSettled] = useState(false);
  const [modelLoadFailed, setModelLoadFailed] = useState(false);
  const handleCollisionBoundsChange = useCallback((bounds: ModelCollisionBounds | null) => {
    setCollisionBounds(bounds);
  }, []);
  const handleModelVisualSettled = useCallback(() => setModelVisualSettled(true), []);
  const handleModelRuntimeError = useCallback((message: string | null) => {
    setModelLoadFailed(Boolean(message));
  }, []);

  useEffect(() => {
    if (physicsDebug) {
      console.debug('[ThreeD Model Physics]', {
        markerId: marker.id,
        modelId: marker.data?.modelId,
        scale,
        bounds: collisionBounds,
        ...(isEnvironment ? { geometryAudit: geometryAudit ? {
          ...geometryAudit, surfaceCollider: undefined, regionIndex: undefined,
          surfaceTriangleCount: (geometryAudit.surfaceCollider?.indices.length ?? 0) / 3,
        } : null } : {}),
        ...(isEnvironment && collisionPreview ? {
          collisionPreview: {
            sourceBoxCount: collisionPreview.sourceBoxCount,
            eligibleBoxCount: collisionPreview.eligibleBoxCount,
            previewBoxCount: collisionPreview.previewBoxCount,
            invalidBoxCount: collisionPreview.invalidBoxCount,
            tinyBoxCount: collisionPreview.tinyBoxCount,
            floorLikeBoxCount: collisionPreview.floorLikeBoxCount,
            mergedSourceBoxCount: collisionPreview.mergedSourceBoxCount,
            omittedBoxCount: collisionPreview.omittedBoxCount,
          },
        } : {}),
      });
    }
  }, [collisionBounds, collisionPreview, geometryAudit, isEnvironment, marker.data?.modelId, marker.id, physicsDebug, scale]);

  const ballPhysics = resolveBallPhysics(marker.metadata?.ballPhysics);
  const modelVolumeSensor = !isMovableBall && !isEnvironment
    ? readModelVolumeSensor(marker.metadata)
    : null;
  const markerIdentity = useMemo<ThreeDRuntimeMarkerIdentity | null>(() => {
    const assetId = Number(marker.data?.id);
    return Number.isSafeInteger(assetId) && assetId > 0
      ? { moduleType: 'models', assetId }
      : null;
  }, [marker.data?.id]);
  const volumeAdaptersRef = useRef(new Map<string, ThreeDRapierPhysicsEventAdapter>());
  const emitVolumeSensorEvent = useCallback((
    kind: 'sensor-enter' | 'sensor-exit',
    payload: any,

  ) => {
    if (!isLayerEnabled || !projectId || !markerIdentity) return;
    if (payload?.other?.collider?.isSensor?.()) return;
    const physicsIdentity = payload?.other?.rigidBodyObject?.userData?.threeDPhysics;
    if (!physicsIdentity?.isMovableBall) return;
    const source = physicsIdentity.identity as ThreeDRuntimeMarkerIdentity | undefined;
    if (!source || source.moduleType !== 'models' || !Number.isSafeInteger(source.assetId) || source.assetId <= 0) return;
    const sourceKey = createThreeDRuntimeMarkerKey(source);
    let adapter = volumeAdaptersRef.current.get(sourceKey);
    if (!adapter) {
      adapter = createThreeDRapierPhysicsEventAdapter({ projectId, source });
      volumeAdaptersRef.current.set(sourceKey, adapter);
    }
    onSensorPhysicsEvent?.(adapter.observe({
      kind,
      occurredAt: new Date().toISOString(),
      target: markerIdentity,
      sensor: { ownerMarkerId: Number(marker.data?.projectMarkerId ?? marker.data?.id), id: 'model-volume' },
      tags: ['physics_sensor'],
    }));
  }, [isLayerEnabled, markerIdentity, onSensorPhysicsEvent, projectId, marker.data?.projectMarkerId, marker.data?.id]);
  const surfaceCollider = wantsSurfaceCollider ? geometryAudit?.surfaceCollider : null;
  const regionIndex = isEnvironment && wantsSurfaceCollider ? geometryAudit?.regionIndex : undefined;
  useEffect(() => { setRegionsReady(false); }, [regionIndex, wantsSurfaceCollider]);
  const effectiveCollisionMode = resolveProjectModelEffectiveCollisionMode({
    requestedMode: requestedCollisionMode,
    isEnvironment,
    isMovableBall,
    surfaceReady: Boolean(surfaceCollider),
    regionsReady,
  });
  const stationaryCollisionReady = isProjectModelStationaryCollisionReady({
    requestedMode: requestedCollisionMode,
    isEnvironment,
    hasModelFile,
    loadFailed: modelLoadFailed,
    visualSettled: modelVisualSettled,
    hasBounds: collisionBounds !== null,
    hasGeometryAudit: geometryAudit !== null,
    hasSurface: surfaceCollider !== null,
    hasRegions: regionIndex !== undefined,
    hasCollisionPreview: collisionPreview !== null,
  });
  useEffect(() => {
    if (isMovableBall) {
      if (modelVisualSettled || modelLoadFailed) onModelRuntimeSettled?.(String(marker.id));
      return;
    }
    if (stationaryCollisionReady) onModelRuntimeSettled?.(String(marker.id));
  }, [isMovableBall, marker.id, modelLoadFailed, modelVisualSettled, onModelRuntimeSettled, stationaryCollisionReady]);
  useEffect(() => {
    if (!physicsDebug) return;
    console.debug('[ThreeD Model Collision]', {
      markerId: marker.id,
      requestedCollisionMode,
      effectiveCollisionMode,
      fallbackActive: effectiveCollisionMode === 'box-fallback',
      surfaceTriangleCount: (surfaceCollider?.indices.length ?? 0) / 3,
      fallbackReason: geometryAudit?.surfaceDiagnostic?.reason,
    });
  }, [effectiveCollisionMode, geometryAudit?.surfaceDiagnostic?.reason, marker.id, physicsDebug, requestedCollisionMode, surfaceCollider]);
  const colliderKey = collisionBounds
    ? [...collisionBounds.center, ...collisionBounds.halfExtents]
        .map((value) => value.toFixed(4))
        .join(':')
    : null;
  const environmentColliderPlan = useMemo(() => {
    if (!isEnvironment || !collisionPreview) return null;
    const inverseRotation = new THREE.Quaternion()
      .setFromEuler(new THREE.Euler(...rotation))
      .invert();
    const localCharacterPositions = characterSpawnPositions.map((spawn) => {
      const local = new THREE.Vector3(
        spawn.x - position[0],
        spawn.y - position[1],
        spawn.z - position[2],
      ).applyQuaternion(inverseRotation);
      return { x: local.x, y: local.y, z: local.z };
    });
    const exclusions = localCharacterPositions.map((local) => {
      return {
        min: [local.x - 1.25, local.y - 1, local.z - 1.25] as [number, number, number],
        max: [local.x + 1.25, local.y + 3, local.z + 1.25] as [number, number, number],
      };
    });
    return createThreeDEnvironmentColliderActivationPlan(
      collisionPreview,
      exclusions,
      localCharacterPositions,
    );
  }, [characterSpawnPositions, collisionPreview, isEnvironment, position, rotation]);

  useEffect(() => {
    if (!physicsDebug || !isEnvironment || !environmentColliderPlan) return;
    console.debug('[ThreeD Environment Colliders]', {
      markerId: marker.id,
      requestedCollisionMode,
      effectiveCollisionMode,
      surfaceDiagnostic: geometryAudit?.surfaceDiagnostic,
      surfaceTriangleCount: (surfaceCollider?.indices.length ?? 0) / 3,
      plannedBoxCount: environmentColliderPlan.plannedBoxCount,
      activeColliderCount: surfaceCollider ? 1 : environmentColliderPlan.activeColliderCount,
      deferredColliderCount: surfaceCollider ? 0 : environmentColliderPlan.deferredColliderCount,
      spawnOverlapDeferredCount: surfaceCollider ? 0 : environmentColliderPlan.spawnOverlapDeferredCount,
      oversizedDeferredCount: environmentColliderPlan.oversizedDeferredCount,
      capacityDeferredCount: environmentColliderPlan.capacityDeferredCount,
      priorityPointCount: environmentColliderPlan.priorityPointCount,
      prioritySelectedCount: environmentColliderPlan.prioritySelectedCount,
      coverageSelectedCount: environmentColliderPlan.coverageSelectedCount,
    });
  }, [effectiveCollisionMode, environmentColliderPlan, geometryAudit, isEnvironment, marker.id, physicsDebug, requestedCollisionMode, surfaceCollider, regionIndex, regionsReady]);

  useEffect(() => {
    if (!physicsDebug || !isEnvironment) return;
    console.debug('[ThreeD Environment Regions]', {
      markerId: marker.id,
      phase: geometryAudit?.regionPreparation?.phase ?? (surfaceCollider ? 'full-surface' : 'waiting-for-audit'),
      reason: geometryAudit?.regionPreparation?.reason,
      batches: geometryAudit?.regionPreparation?.batches,
      totalRegions: regionIndex?.regions.length ?? 0,
      referenceBytes: regionIndex?.referenceBytes ?? 0,
      fallbackActive: !surfaceCollider && !regionsReady,
    });
  }, [physicsDebug, isEnvironment, marker.id, geometryAudit, regionIndex, regionsReady, surfaceCollider]);

  return (
    <SceneMarkerRigidBody
      sceneEnabled={isLayerEnabled}
      type={isMovableBall && collisionBounds ? 'dynamic' : 'fixed'}
      onLivePosition={isMovableBall ? onLivePosition : undefined}
      ccd={isMovableBall}
      gravityScale={isMovableBall ? ballPhysics.gravityScale : 1}
      linearDamping={isMovableBall ? ballPhysics.damping : 0}
      angularDamping={isMovableBall ? ballPhysics.damping : 0}
      colliders={false}
      position={position}
      rotation={rotation}
      userData={markerIdentity ? { threeDPhysics: { identity: markerIdentity, isMovableBall } } : undefined}
    >
      {!isMovableBall && !modelVolumeSensor && collisionBounds && colliderKey && (
        (effectiveCollisionMode === 'box' || (!isEnvironment && effectiveCollisionMode === 'box-fallback')) &&
        <CuboidCollider
          key={colliderKey}
          args={collisionBounds.halfExtents}
          position={collisionBounds.center}
        />
      )}
      {isMovableBall && collisionBounds && (
        <BallCollider key={colliderKey} args={[Math.max(...collisionBounds.halfExtents)]}
          position={collisionBounds.center} mass={ballPhysics.mass} friction={ballPhysics.friction} restitution={ballPhysics.restitution} />
      )}
      {modelVolumeSensor && collisionBounds && (
        <CuboidCollider
          key={`model-volume-${colliderKey}`}
          sensor
          args={collisionBounds.halfExtents}
          position={collisionBounds.center}
          onIntersectionEnter={(payload) => emitVolumeSensorEvent('sensor-enter', payload)}
          onIntersectionExit={(payload) => emitVolumeSensorEvent('sensor-exit', payload)}
        />
      )}
      <PhysicsSensorCuboidChildren
        marker={marker}
        projectId={projectId}
        enabled={isLayerEnabled}
        physicsDebug={physicsDebug || isSelected}
        onPhysicsEvent={onSensorPhysicsEvent}
      />
      {regionIndex && <EnvironmentRegionColliders index={regionIndex} enabled={isLayerEnabled} physicsDebug={physicsDebug} markerId={String(marker.id)} position={position} rotation={rotation} onReady={setRegionsReady} />}
      {surfaceCollider && <TrimeshCollider args={[surfaceCollider.vertices, surfaceCollider.indices]} />}
      {isEnvironment && effectiveCollisionMode === 'box-fallback' && collisionPreview?.groundBoxes?.map((box, index) => (
        <CuboidCollider key={`environment-ground-${index}`} args={box.halfExtents} position={box.center} />
      ))}
      {isEnvironment && effectiveCollisionMode === 'box-fallback' && environmentColliderPlan?.boxes.map((box, index) => (
        <CuboidCollider
          key={`environment-collider-${index}`}
          args={box.halfExtents}
          position={box.center}
        />
      ))}
      <group
        visible={isLayerEnabled}
        onPointerMove={(event) => {
          if (!isLayerEnabled || !placementActive) return;
          event.stopPropagation();
          onPlacementHover?.({ x: event.point.x, y: event.point.y, z: event.point.z });
        }}
        onClick={(event) => {
          if (!isLayerEnabled || (isEnvironment && !placementActive)) return;
          event.stopPropagation();
          if (placementActive) {
            onPlacementClick?.({ x: event.point.x, y: event.point.y, z: event.point.z });
            return;
          }
          // An Environment/Base Map is the Scene's stationary interaction
          // surface. Direct geometry clicks must not replace the user's active
          // marker selection or open its DetailsCard; deliberate Project and
          // toolbar controls retain authority over Environment management.
          if (isEnvironment) return;
          onClick?.();
        }}
      >
        <ModelMarker3D
          model={marker.data}
          position={[0, 0, 0]}
          scale={scale}
          applyStoredScale={false}
          animationSpeed={marker.data?.animationSpeed || 1}
          onCollisionBoundsChange={handleCollisionBoundsChange}
          enableSurfaceCollider={wantsSurfaceCollider}
          onGeometryAuditChange={wantsSurfaceCollider ? setGeometryAudit : undefined}
          onEnvironmentCollisionPreviewChange={isEnvironment && wantsSurfaceCollider ? setCollisionPreview : undefined}
          onRuntimeSettled={handleModelVisualSettled}
          onRuntimeError={handleModelRuntimeError}
        />
        {isEnvironment && effectiveCollisionMode === 'box-fallback' && physicsDebug && environmentColliderPlan && (
          <EnvironmentCollisionPreview boxes={environmentColliderPlan.boxes} />
        )}
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
    characterPhysics: marker.metadata?.characterPhysics ?? null,
    markerId: String(marker?.id ?? ''),
    sourceId: Number(data.id),
    characterId: String(data.characterId ?? ''),
    name: String(data.name ?? marker?.name ?? ''),
    type: String(data.type ?? ''),
    status: String(data.status ?? 'active'),
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
  onRuntimeSettled,
}: any) {
  const signature = characterSceneSignature(marker);
  const characterDataRef = useRef(marker.data);
  const characterSignatureRef = useRef(signature);
  if (characterSignatureRef.current !== signature) {
    characterSignatureRef.current = signature;
    characterDataRef.current = marker.data;
  }
  const characterData = useMemo(() => ({...characterDataRef.current, status: characterDataRef.current?.status ?? 'active', visible: characterDataRef.current?.visible !== false}), [signature]);
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
        physicsSettings={marker.metadata?.characterPhysics}
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
        navigationTargetMarkerId={actionTarget?.markerId}
        movementTargetPosition={
          isControlled && actionTarget != null
            ? actionTarget.position
            : undefined
        }
        isActionTarget={isActionTarget}
        onRuntimeSettled={() => onRuntimeSettled?.(String(marker.id))}
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
        <GardenCharacter
          character={characterData}
          positionedByParent
          onRuntimeSettled={() => onRuntimeSettled?.(String(marker.id))}
        />
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
  && previous.onRuntimeSettled === next.onRuntimeSettled
));

// ✅ ThreeD Marker Component
const ThreeDMarkerComponent = memo(function ThreeDMarkerComponent({ marker, onClick, isSelected, isActionTarget, isLayerEnabled, placementActive, onPlacementHover, onPlacementClick, actionTarget, controlledCharacterId, onControlChange, cameraFollowRef, livePositionsRef, physicsDebug, onModelRuntimeSettled, onCharacterRuntimeSettled, characterSpawnPositions, projectId, onSensorPhysicsEvent }: any) {
  const [hovered, setHovered] = useState(false);
  const color = marker.color || getMarkerColor(marker.type);
  const size = isSelected ? 1.0 : 0.6;
  const selectMarker = useCallback(() => onClick?.(marker), [marker, onClick]);

  // ✅ v0.15.0/15.2: Render rich markers for types that have dedicated components
  const pos: [number, number, number] = [Number(marker.position.x) || 0, Number(marker.position.y) || 0, Number(marker.position.z) || 0];
  const isFarmBotMarker = marker.type === 'farmbot' || marker.type === 'farmbots';
  const farmbotId = isFarmBotMarker && Number.isSafeInteger(Number(marker.data?.id))
    ? Number(marker.data.id)
    : null;
  const farmbotLiveAlignment = useMemo(
    () => readFarmBotLiveAlignmentConfiguration(marker.metadata),
    [marker.metadata],
  );
  const { state: farmbotLiveState } = useFarmBotLiveState({
    projectId,
    farmbotId,
    enabled: isFarmBotMarker && farmbotLiveAlignment?.enabled === true,
  });
  const alignedFarmBotPosition = useMemo(() => {
    if (
      !farmbotLiveAlignment?.enabled
      || !farmbotLiveState
      || farmbotLiveState?.condition === 'unavailable'
      || !farmbotLiveState.position
    ) return null;
    try {
      return alignFarmBotPhysicalPosition({
        alignment: farmbotLiveAlignment.alignment,
        physicalPosition: farmbotLiveState.position,
      });
    } catch {
      return null;
    }
  }, [farmbotLiveAlignment, farmbotLiveState]);
  const lastConfirmedFarmBotPositionRef = useRef<Readonly<{ x: number; y: number; z: number }> | null>(null);
  useEffect(() => {
    lastConfirmedFarmBotPositionRef.current = null;
  }, [marker.id, projectId, farmbotLiveAlignment]);
  useEffect(() => {
    if (alignedFarmBotPosition) lastConfirmedFarmBotPositionRef.current = alignedFarmBotPosition;
  }, [alignedFarmBotPosition]);
  const presentedFarmBotPosition = alignedFarmBotPosition
    ?? lastConfirmedFarmBotPositionRef.current
    ?? { x: pos[0], y: pos[1], z: pos[2] };

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
        onRuntimeSettled={onCharacterRuntimeSettled}
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
        <PhysicsSensorCuboidChildren marker={marker} projectId={projectId} enabled={isLayerEnabled} physicsDebug={physicsDebug || isSelected} onPhysicsEvent={onSensorPhysicsEvent} />
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
        <PhysicsSensorCuboidChildren marker={marker} projectId={projectId} enabled={isLayerEnabled} physicsDebug={physicsDebug || isSelected} onPhysicsEvent={onSensorPhysicsEvent} />
        <group
          visible={isLayerEnabled}
          scale={[plantingModelScale, plantingModelScale, plantingModelScale]}
          onPointerMove={(event) => {
            if (!isLayerEnabled || !placementActive) return;
            event.stopPropagation();
            onPlacementHover?.({ x: event.point.x, y: event.point.y, z: event.point.z });
          }}
          onClick={(event) => {
            if (!isLayerEnabled) return;
            event.stopPropagation();
            if (placementActive) {
              onPlacementClick?.({ x: event.point.x, y: event.point.y, z: event.point.z });
              return;
            }
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
      onLivePosition={(position) => onControlChange?.(String(marker.id), 'models', Number(marker.data?.id), position)}
      position={pos}
      rotation={instanceRotation}
      scale={instanceScale}
      onClick={selectMarker}
      isSelected={isSelected}
      isActionTarget={isActionTarget}
      isLayerEnabled={isLayerEnabled}
      physicsDebug={physicsDebug}
      placementActive={placementActive}
      onPlacementHover={onPlacementHover}
      onPlacementClick={onPlacementClick}
      onModelRuntimeSettled={onModelRuntimeSettled}
      characterSpawnPositions={characterSpawnPositions}
      projectId={projectId}
      onSensorPhysicsEvent={onSensorPhysicsEvent}
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
        type={farmbotLiveAlignment?.enabled ? 'kinematicPosition' : 'fixed'}
        smoothPosition={farmbotLiveAlignment?.enabled === true}
        colliders={false}
        position={[presentedFarmBotPosition.x, presentedFarmBotPosition.y, presentedFarmBotPosition.z]}
        rotation={[0, farmBotRotation, 0]}
      >
        <CuboidCollider
          key={farmBotColliderKey}
          args={[farmBotWidth / 2, farmBotHeight / 2, farmBotLength / 2]}
          position={[0, farmBotHeight / 2, 0]}
        />
        <PhysicsSensorCuboidChildren marker={marker} projectId={projectId} enabled={isLayerEnabled} physicsDebug={physicsDebug || isSelected} onPhysicsEvent={onSensorPhysicsEvent} />
        <group
          visible={isLayerEnabled}
          scale={[farmBotWidth / 0.6, farmBotHeight / 0.58, farmBotLength / 0.4]}
          onPointerMove={(event) => {
            if (!isLayerEnabled || !placementActive) return;
            event.stopPropagation();
            onPlacementHover?.({ x: event.point.x, y: event.point.y, z: event.point.z });
          }}
          onClick={(event) => {
            if (!isLayerEnabled) return;
            event.stopPropagation();
            if (placementActive) {
              onPlacementClick?.({ x: event.point.x, y: event.point.y, z: event.point.z });
              return;
            }
            selectMarker();
          }}
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

  // A repeatable texture keeps the ground from visibly changing whenever the
  // persistent Scene remounts. Layer broad turf variation beneath fine blades
  // so the surface reads naturally at both overview and Character distances.
  let seed = 0x3d5a1e;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };

  ctx.fillStyle = '#426b32';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 220; i++) {
    const x = random() * 512;
    const y = random() * 512;
    const radius = 10 + random() * 42;
    const lightPatch = random() > 0.48;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, lightPatch ? 'rgba(126, 158, 77, 0.16)' : 'rgba(28, 65, 31, 0.18)');
    gradient.addColorStop(1, 'rgba(66, 107, 50, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  for (let i = 0; i < 4200; i++) {
    const x = random() * 512;
    const y = random() * 512;
    const height = 1 + random() * 3;
    ctx.strokeStyle = random() > 0.45
      ? `rgba(108, 145, 63, ${0.18 + random() * 0.22})`
      : `rgba(25, 72, 35, ${0.14 + random() * 0.2})`;
    ctx.lineWidth = 0.5 + random();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (random() - 0.5) * 1.5, y - height);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function HighResolutionEnvironmentBackground({ url }: { url: string }) {
  const scene = useThree((state) => state.scene);
  const texture = useTexture(url);

  useEffect(() => {
    const previousBackground = scene.background;
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    scene.background = texture;
    return () => {
      if (scene.background === texture) scene.background = previousBackground;
    };
  }, [scene, texture]);

  return null;
}

function ProceduralDaylightBackground() {
  const scene = useThree((state) => state.scene);
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const context = canvas.getContext('2d')!;
    const sky = context.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, '#397bb8');
    sky.addColorStop(0.42, '#78add4');
    sky.addColorStop(0.72, '#c7d9df');
    sky.addColorStop(1, '#ead8b9');
    context.fillStyle = sky;
    context.fillRect(0, 0, canvas.width, canvas.height);

    const sun = context.createRadialGradient(1510, 525, 4, 1510, 525, 150);
    sun.addColorStop(0, 'rgba(255, 245, 205, 0.95)');
    sun.addColorStop(0.16, 'rgba(255, 228, 166, 0.5)');
    sun.addColorStop(1, 'rgba(255, 218, 155, 0)');
    context.fillStyle = sun;
    context.fillRect(1360, 375, 300, 300);

    const cloudBands = [
      { x: 90, y: 340, width: 470, height: 54, opacity: 0.16 },
      { x: 640, y: 420, width: 390, height: 38, opacity: 0.12 },
      { x: 1170, y: 300, width: 520, height: 48, opacity: 0.14 },
      { x: 1700, y: 455, width: 300, height: 34, opacity: 0.1 },
    ];
    for (const cloud of cloudBands) {
      const cloudGradient = context.createRadialGradient(
        cloud.x + cloud.width / 2,
        cloud.y,
        0,
        cloud.x + cloud.width / 2,
        cloud.y,
        cloud.width / 2,
      );
      cloudGradient.addColorStop(0, `rgba(255, 255, 255, ${cloud.opacity})`);
      cloudGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      context.fillStyle = cloudGradient;
      context.beginPath();
      context.ellipse(
        cloud.x + cloud.width / 2,
        cloud.y,
        cloud.width / 2,
        cloud.height,
        0,
        0,
        Math.PI * 2,
      );
      context.fill();
    }

    const result = new THREE.CanvasTexture(canvas);
    result.mapping = THREE.EquirectangularReflectionMapping;
    result.colorSpace = THREE.SRGBColorSpace;
    return result;
  }, []);

  useEffect(() => {
    const previousBackground = scene.background;
    scene.background = texture;
    return () => {
      if (scene.background === texture) scene.background = previousBackground;
    };
  }, [scene, texture]);

  return null;
}

// Shadow light with proper target direction and massive frustum depth
function ShadowLight({ centerX, centerZ, azimuth, elevation }: { centerX: number; centerZ: number; azimuth: number; elevation: number }) {
  const lightRef = useRef<THREE.DirectionalLight>(null);

  useEffect(() => {
    const light = lightRef.current;
    if (!light) return;
    // Aim sunlight at the scene center from the selected direction.
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
  }, [centerX, centerZ, azimuth, elevation]);

  return (
    <directionalLight
      ref={lightRef}
      position={[centerX + 30 * Math.cos(elevation * Math.PI / 180) * Math.sin(azimuth * Math.PI / 180), 30 * Math.sin(elevation * Math.PI / 180), centerZ + 30 * Math.cos(elevation * Math.PI / 180) * Math.cos(azimuth * Math.PI / 180)]}
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
  showVisualGround = true,
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
      {showVisualGround && <Plane
        args={[size, size]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[centerX, -0.05, centerZ]}
        receiveShadow
      >
        <shadowMaterial transparent opacity={0.35} />
      </Plane>}
      {/* Visual ground plane with grass texture */}
      {showVisualGround && <Plane
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
      </Plane>}

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
          if (!placementActive && !onClick) return;
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

function SceneModelDropTarget({
  active,
  expectedModelId,
  size,
  centerX,
  centerZ,
  onDrop,
}: {
  active: boolean;
  expectedModelId: number | null;
  size: number;
  centerX: number;
  centerZ: number;
  onDrop?: (position: { x: number; y: number; z: number }) => void;
}) {
  const { camera, gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;
    if (!active || !onDrop) return;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();

    const setDropFeedback = (valid: boolean | null) => {
      canvas.style.outline = valid === null
        ? ''
        : `2px solid ${valid ? 'rgb(34 211 238)' : 'rgb(239 68 68)'}`;
      canvas.style.outlineOffset = valid === null ? '' : '-2px';
    };

    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
      const hasExpectedType = Array.from(event.dataTransfer?.types ?? [])
        .includes(THREED_MODEL_LIBRARY_DRAG_MIME);
      setDropFeedback(hasExpectedType);
      if (event.dataTransfer) event.dataTransfer.dropEffect = hasExpectedType ? 'copy' : 'none';
    };
    const handleDragLeave = (event: DragEvent) => {
      if (!canvas.contains(event.relatedTarget as Node | null)) setDropFeedback(null);
    };
    const handleDrop = (event: DragEvent) => {
      event.preventDefault();
      setDropFeedback(null);
      const serialized = event.dataTransfer?.getData(THREED_MODEL_LIBRARY_DRAG_MIME) ?? '';
      if (
        expectedModelId == null
        || !isMatchingThreeDModelLibraryDragPayload(serialized, expectedModelId)
      ) return;
      const bounds = canvas.getBoundingClientRect();
      pointer.set(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      if (!raycaster.ray.intersectPlane(groundPlane, intersection)) return;
      const halfSize = size / 2;
      if (
        intersection.x < centerX - halfSize
        || intersection.x > centerX + halfSize
        || intersection.z < centerZ - halfSize
        || intersection.z > centerZ + halfSize
      ) return;
      onDrop({ x: intersection.x, y: 0, z: intersection.z });
    };

    canvas.addEventListener('dragover', handleDragOver);
    canvas.addEventListener('dragleave', handleDragLeave);
    canvas.addEventListener('drop', handleDrop);
    return () => {
      setDropFeedback(null);
      canvas.removeEventListener('dragover', handleDragOver);
      canvas.removeEventListener('dragleave', handleDragLeave);
      canvas.removeEventListener('drop', handleDrop);
    };
  }, [active, camera, centerX, centerZ, expectedModelId, gl, onDrop, size]);

  return null;
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
  initialViewState,
  onViewStateProviderChange,
  projectId,
  geographicHeadingDegrees = 0,
  controlledCharacterId,
  onControlChange,
  onRuntimeMarkerPositionChange,
  resolveRuntimeMarkerPosition,
  cameraMode,
  onCameraModeChange,
  focusRequest = 0,
  sensorFocusRequest = 0,
  sensorFocusPosition = null,
  actionTarget,
  actionTargetFocusRequest = 0,
  placementModel,
  onModelPlacement,
  movingModelName,
  onModelReposition,
  placementCharacterName,
  onCharacterPlacement,
  placementFarmBotName,
  onFarmBotPlacement,
  placementBedName,
  onBedPlacement,
  placementPlantingName,
  onPlantingPlacement,
  placementPhysicsSensor,
  onPhysicsSensorPlacement,
  onPresentationComplete,
  environmentControlsCloseRequest = 0,
  onEnvironmentControlsOpenChange,
  onOpenEnvironmentDetails,
  hasProjectEnvironment = false,
}: ThreeDSceneProps) {
  const transform = useOptionalSceneTransform();
  const transforming = Boolean(transform?.session);
  const placementLabel = placementPhysicsSensor?.name
    || movingModelName
    || placementCharacterName
    || placementFarmBotName
    || placementPlantingName
    || placementBedName
    || placementModel?.modelName
    || null;
  // v0.16.0-delta: Shared ref for camera follow — character writes position here each frame
  const cameraFollowRef = useRef<THREE.Vector3 | null>(null);
  // Ecctrl retains this internal bridge for its complete runtime unit. Shared
  // position reads are resolved through the Runtime Marker registry instead.
  const livePositionsRef = useRef<Map<string, { x: number; y: number; z: number }>>(new Map());
  const controlsRef = useRef<any>(null);
  const restoredProjectViewKeyRef = useRef<string | null>(null);
  const compassNeedleRef = useRef<HTMLDivElement | null>(null);
  const [hasData, setHasData] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [showSensors, setShowSensors] = useState(false);
  useEffect(() => { setShowSensors(false); }, [projectId]);
  const hoverTitleRef = useRef<HTMLDivElement>(null);
  const [hoveredSceneMarkerIdentity, setHoveredSceneMarkerIdentity] = useState<{ projectId: typeof projectId; markerId: string; point: [number, number, number] } | null>(null);
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
  useEffect(() => {
    setShowControls(false);
  }, [environmentControlsCloseRequest]);
  const [environmentControlsHost, setEnvironmentControlsHost] = useState<HTMLElement | null>(null);
  const [showGizmoCube, setShowGizmoCube] = useState(true);
  const [controlsReady, setControlsReady] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<any>(null);
  const [placementPreviewPosition, setPlacementPreviewPosition] = useState<{
    x: number;
    y: number;
    z: number;
  } | null>(null);

  useEffect(() => {
    setEnvironmentControlsHost(document.getElementById('project-environment-controls-host'));
    return () => setEnvironmentControlsHost(null);
  }, [projectId]);

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
  const sensorGroups = useSensorGroups();
  const sensorMembers = useMemo<SensorMember[]>(() => sceneMarkers.flatMap(marker => {
    const ownerMarkerId = Number(marker.data?.projectMarkerId ?? marker.data?.id);
    if (!Number.isSafeInteger(ownerMarkerId) || ownerMarkerId <= 0) return [];
    const attached = readPhysicsSensorCuboids(marker.metadata).map(sensor => ({ ...sensor, ownerMarkerId }));
    const volume = normalizeSceneLayerType(marker.type) === 'models' && !isProjectModelMovableBall(marker.metadata)
      && marker.metadata?.placementRole !== 'environment' ? readModelVolumeSensor(marker.metadata) : null;
    return volume ? [...attached, { ...volume, ownerMarkerId }] : attached;
  }), [sceneMarkers]);
  const [sensorCounterState, setSensorCounterState] = useState(createSensorCounterState);
  const sensorEventBuffer = useRef(new ThreeDPhysicsEventBuffer({ capacity: 256, minimumIntervalMs: 0 }));

  useEffect(() => { sensorEventBuffer.current.clear(); setSensorCounterState(createSensorCounterState()); }, [projectId]);
  useEffect(() => {
    const activeOwners = new Set(sceneMarkers.filter(marker => activeLayers.has(normalizeSceneLayerType(marker.type))
      && (visibleMarkerIds?.has(String(marker.id)) ?? true)).map(marker => Number(marker.data?.projectMarkerId ?? marker.data?.id)));
    const activeSources = new Set(sceneMarkers.filter(marker => activeLayers.has(normalizeSceneLayerType(marker.type))
      && (visibleMarkerIds?.has(String(marker.id)) ?? true)).map(marker => `${normalizeSceneLayerType(marker.type)}:${marker.data?.id}`));
    setSensorCounterState(current => {
      const next = reconcileSensorCounters(current, sensorMembers);
      return { ...next, occupied: next.occupied.filter(key => activeOwners.has(Number(key.split(':')[0])) && activeSources.has(key.split('|')[1])) };
    });
  }, [sensorMembers, sceneMarkers, activeLayers, visibleMarkerIds]);
  const handleSensorPhysicsEvent = useCallback((event: Readonly<ThreeDPhysicsEventV1>) => {
    if (event.projectId !== Number(projectId)) return;
    const buffered = sensorEventBuffer.current.append(event);
    if (buffered.status !== 'accepted') return;
    setSensorCounterState(current => reduceSensorCounterEvent(current, buffered.event, Number(projectId), sensorMembers));
  }, [projectId, sensorMembers]);
  const resetSensorCounterState = useCallback(() => {
    setSensorCounterState(current => resetSensorCounts(current));
  }, []);
  const counterGroups = useMemo(() => {
    const groups = new Map<string, { name: string; members: SensorMember[] }>();
    for (const member of sensorMembers.filter(member => member.behavior === 'counter')) {
      const id = member.groupId ?? '';
      const group = groups.get(id) ?? { name: sensorGroups?.groups.find(group => group.id === id)?.name ?? (id ? 'Unresolved group' : 'Ungrouped sensors'), members: [] };
      group.members.push(member); groups.set(id, group);
    }
    return [...groups.entries()];
  }, [sensorMembers, sensorGroups?.groups]);
  const requiredModelMarkerIds = useMemo(() => sceneMarkers
    .filter((marker) => normalizeSceneLayerType(marker.type) === 'models'
      && !isProjectModelMovableBall(marker.metadata))
    .map((marker) => String(marker.id))
    .sort(), [sceneMarkers]);
  const requiredModelMarkerKey = requiredModelMarkerIds.join('|');
  const modelSettlementKey = `${projectId ?? 'none'}:${requiredModelMarkerKey}`;
  const [modelSettlement, setModelSettlement] = useState<{
    key: string;
    markerIds: Set<string>;
  }>(() => ({ key: modelSettlementKey, markerIds: new Set() }));
  const handleModelRuntimeSettled = useCallback((markerId: string) => {
    setModelSettlement((current) => {
      const currentMarkerIds = current.key === modelSettlementKey
        ? current.markerIds
        : new Set<string>();
      if (currentMarkerIds.has(markerId)) return current;
      const nextMarkerIds = new Set(currentMarkerIds);
      nextMarkerIds.add(markerId);
      return { key: modelSettlementKey, markerIds: nextMarkerIds };
    });
  }, [modelSettlementKey]);
  const settledModelMarkerIds = modelSettlement.key === modelSettlementKey
    ? modelSettlement.markerIds
    : new Set<string>();
  const allRequiredModelsSettled = requiredModelMarkerIds.every(
    (markerId) => settledModelMarkerIds.has(markerId),
  );
  const requiredCharacterMarkerIds = useMemo(() => sceneMarkers
    .filter((marker) => normalizeSceneLayerType(marker.type) === 'characters')
    .map((marker) => String(marker.id))
    .sort(), [sceneMarkers]);
  const requiredCharacterMarkerKey = requiredCharacterMarkerIds.join('|');
  const characterSettlementKey = `${projectId ?? 'none'}:${requiredCharacterMarkerKey}`;
  const [characterSettlement, setCharacterSettlement] = useState<{
    key: string;
    markerIds: Set<string>;
  }>(() => ({ key: characterSettlementKey, markerIds: new Set() }));
  const handleCharacterRuntimeSettled = useCallback((markerId: string) => {
    setCharacterSettlement((current) => {
      const currentMarkerIds = current.key === characterSettlementKey
        ? current.markerIds
        : new Set<string>();
      if (currentMarkerIds.has(markerId)) return current;
      const nextMarkerIds = new Set(currentMarkerIds);
      nextMarkerIds.add(markerId);
      return { key: characterSettlementKey, markerIds: nextMarkerIds };
    });
  }, [characterSettlementKey]);
  const settledCharacterMarkerIds = characterSettlement.key === characterSettlementKey
    ? characterSettlement.markerIds
    : new Set<string>();
  const allRequiredCharactersSettled = requiredCharacterMarkerIds.every(
    (markerId) => settledCharacterMarkerIds.has(markerId),
  );
  useEffect(() => {
    if (allRequiredCharactersSettled || !allRequiredModelsSettled) return;
    const timer = setTimeout(() => {
      console.warn('[ThreeD Character Preparation] Still pending', sceneMarkers
        .filter(marker => requiredCharacterMarkerIds.includes(String(marker.id))
          && !settledCharacterMarkerIds.has(String(marker.id)))
        .map(marker => ({ markerId: String(marker.id), characterId: marker.data?.id,
          status: marker.data?.status, visible: marker.data?.visible,
          isMovable: marker.data?.isMovable })));
    }, 15000);
    return () => clearTimeout(timer);
  }, [allRequiredCharactersSettled, allRequiredModelsSettled, characterSettlement, characterSettlementKey, sceneMarkers]);

  const characterEnvironmentReadyRef = useRef({
    projectId,
    ready: false,
  });
  if (characterEnvironmentReadyRef.current.projectId !== projectId) {
    characterEnvironmentReadyRef.current = { projectId, ready: false };
  }
  if (allRequiredModelsSettled) {
    characterEnvironmentReadyRef.current.ready = true;
  }
  // Character introduction is a one-way Project-load gate. Incrementally
  // adding a Model must not remove an already-mounted Character while that
  // new Model settles; a Project change resets the gate.
  const sceneEnvironmentReady = characterEnvironmentReadyRef.current.ready;
  // Presentation is a one-time Project-load boundary. Marker additions after
  // Production must not replay the opaque loader or hide the running Scene.
  const presentationKey = String(projectId ?? 'default');
  const [paintedPresentationKey, setPaintedPresentationKey] = useState<string | null>(null);
  const [productionSceneKey, setProductionSceneKey] = useState<string | null>(null);
  const [postProductionSceneKey, setPostProductionSceneKey] = useState<string | null>(null);
  const sceneFrameReady = paintedPresentationKey === presentationKey;
  const scenePresentationReady = sceneFrameReady
    && controlsReady
    && allRequiredModelsSettled
    && allRequiredCharactersSettled;
  const sceneProductionStarted = productionSceneKey === presentationKey;
  const scenePostProduction = postProductionSceneKey === presentationKey;
  const scenePresentationPhase: ThreeDScenePresentationPhase = !sceneProductionStarted
    ? 'pre-production'
    : scenePostProduction
      ? 'post-production'
      : 'production';
  const sceneIntro: ThreeDSceneIntro = 'fade';
  useEffect(() => {
    if (scenePostProduction) {
      onPresentationComplete?.();
    }
  }, [onPresentationComplete, scenePostProduction]);
  const settledModelCount = requiredModelMarkerIds.filter(
    (markerId) => settledModelMarkerIds.has(markerId),
  ).length;
  const modelProgress = requiredModelMarkerIds.length === 0
    ? 1
    : settledModelCount / requiredModelMarkerIds.length;
  const settledCharacterCount = requiredCharacterMarkerIds.filter(
    (markerId) => settledCharacterMarkerIds.has(markerId),
  ).length;
  const characterProgress = requiredCharacterMarkerIds.length === 0
    ? 1
    : settledCharacterCount / requiredCharacterMarkerIds.length;
  const sceneLoadingProgress = Math.round(
    (sceneFrameReady ? 45 : 35)
    + (controlsReady ? 15 : 0)
    + (modelProgress * 25)
    + (characterProgress * 15),
  );
  const sceneLoadingLabel = !sceneFrameReady
    ? 'Preparing ThreeD Scene…'
    : !allRequiredModelsSettled
      ? `Loading Project Models… ${settledModelCount}/${requiredModelMarkerIds.length}`
      : !allRequiredCharactersSettled
        ? `Preparing Project Characters… ${settledCharacterCount}/${requiredCharacterMarkerIds.length}`
        : !controlsReady
          ? 'Preparing Scene controls…'
          : 'Presenting Project…';

  useEffect(() => {
    if (!scenePresentationReady) return;
    const frame = window.requestAnimationFrame(() => {
      setProductionSceneKey(presentationKey);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [presentationKey, scenePresentationReady]);
  const characterSpawnPositions = useMemo(() => sceneMarkers
    .filter((marker) => normalizeSceneLayerType(marker.type) === 'characters')
    .map((marker) => ({
      x: Number(marker.position?.x) || 0,
      y: Number(marker.position?.y) || 0,
      z: Number(marker.position?.z) || 0,
    })), [sceneMarkers]);

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
  const [envPreset, setEnvPreset] = useState<string>(DEFAULT_THREE_D_ENVIRONMENT_PRESET_KEY);
  const [showIncidents, setShowIncidents] = useState(false);
  const [sunlight, setSunlight] = useState({ azimuth: 0, elevation: 45 });
  const [extraGround, setExtraGround] = useState({ enabled: false, size: 200, height: -0.1 });
  const [groundMap, setGroundMap] = useState<ProjectGroundMapTransform>(DEFAULT_PROJECT_GROUND_MAP_TRANSFORM);
  const [groundMapAsset, setGroundMapAsset] = useState<ProjectGroundMapAsset | null>(null);
  const [groundMapBusy, setGroundMapBusy] = useState(false);
  const [groundMapSourceProvider, setGroundMapSourceProvider] = useState('');
  const [groundMapAttribution, setGroundMapAttribution] = useState('');
  const groundMapInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    setSunlight(initialViewState?.sunlight ?? { azimuth: 0, elevation: 45 });
    setExtraGround(initialViewState?.ground ?? { enabled: false, size: 200, height: -0.1 });
    setGroundMap(initialViewState?.groundMap ?? DEFAULT_PROJECT_GROUND_MAP_TRANSFORM);
  }, [projectId, initialViewState?.sunlight, initialViewState?.ground, initialViewState?.groundMap]);
  useEffect(() => {
    const controller = new AbortController();
    setGroundMapAsset(null);
    if (!projectId) return () => controller.abort();
    void fetch(`/api/threed/ground-maps?projectId=${projectId}`, { signal: controller.signal })
      .then(async response => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Failed to load Ground Map');
        if (!controller.signal.aborted) {
          setGroundMapAsset(payload.data ?? null);
          setGroundMapSourceProvider(payload.data?.sourceProvider ?? '');
          setGroundMapAttribution(payload.data?.attribution ?? '');
        }
      }).catch(error => { if (error?.name !== 'AbortError') console.error('Failed to load Project Ground Map', { errorName: error instanceof Error ? error.name : 'UnknownError' }); });
    return () => controller.abort();
  }, [projectId]);
  const uploadGroundMap = useCallback(async (file: File) => {
    if (!projectId) return;
    setGroundMapBusy(true);
    try {
      const form = new FormData(); form.set('projectId', String(projectId)); form.set('file', file);
      if (groundMapSourceProvider.trim()) form.set('sourceProvider', groundMapSourceProvider.trim());
      if (groundMapAttribution.trim()) form.set('attribution', groundMapAttribution.trim());
      const response = await fetch('/api/threed/ground-maps', { method: 'POST', body: form });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Ground Map upload failed');
      const asset = payload.data as ProjectGroundMapAsset;
      setGroundMapAsset(asset);
      const ratio = asset.height / asset.width;
      setGroundMap(value => ({ ...value, visualMode: 'image', groundMapId: asset.id, width: 200, length: Math.max(1, 200 * ratio) }));
    } catch (error) { window.alert(error instanceof Error ? error.message : 'Ground Map upload failed'); }
    finally { setGroundMapBusy(false); }
  }, [groundMapAttribution, groundMapSourceProvider, projectId]);
  const deleteGroundMap = useCallback(async () => {
    if (!projectId || !groundMapAsset || !window.confirm('Remove this Ground Map image from the Project?')) return;
    setGroundMapBusy(true);
    try {
      const response = await fetch(`/api/threed/ground-maps?projectId=${projectId}`, { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Ground Map removal failed');
      setGroundMapAsset(null);
      setGroundMap(value => ({ ...value, visualMode: 'procedural', groundMapId: null }));
    } catch (error) { window.alert(error instanceof Error ? error.message : 'Ground Map removal failed'); }
    finally { setGroundMapBusy(false); }
  }, [groundMapAsset, projectId]);
  const environmentPreset = resolveThreeDEnvironmentPreset(envPreset);

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

  // Named views belong to this Project snapshot, rather than browser-wide storage.
  useEffect(() => {
    setViewPresets(initialViewState?.viewPresets ?? []);
  }, [projectId, initialViewState?.viewPresets]);

  // Environment selection is Project-scoped. A Project without saved view
  // state must not inherit another Project's browser-wide environment choice.
  useEffect(() => {
    setEnvPreset(
      initialViewState?.environment ?? DEFAULT_THREE_D_ENVIRONMENT_PRESET_KEY,
    );
  }, [initialViewState?.environment, projectId]);

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
  const hasVisibleEnvironmentModel = visibleMarkers.some((marker: any) =>
    normalizeSceneLayerType(marker.type) === 'models'
    && marker.isVisible !== false
    && marker.isActive !== false
    && isProjectModelEnvironment(marker.metadata));

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
  const groundCenterX = centerX;
  const groundCenterZ = centerZ;
  const groundSize = hasVisibleEnvironmentModel
    ? 500
    : Math.min(Math.max(maxDimension + 10, 30), 500);

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

  useEffect(() => {
    const session = transform?.session;
    if (session && !visibleMarkers.some(marker => session.ownerKey === `${projectId}:${marker.id}`)) {
      transform?.releaseOwner(session.ownerKey);
    }
  }, [visibleMarkers, projectId, transform?.session?.ownerKey, transform?.releaseOwner]);

  const hoveredSceneMarker = hoveredSceneMarkerIdentity && hoveredSceneMarkerIdentity.projectId === projectId
    ? visibleMarkers.find((marker) => String(marker.id) === hoveredSceneMarkerIdentity.markerId
      && !isProjectModelEnvironment(marker.metadata))
    : undefined;

  const allAvailableLayersVisible = availableLayers.length > 0
    && availableLayers.every((layer) => activeLayers.has(layer));

  const zoomToPosition = (x: number, z: number) => {
    if (controlsRef.current) {
      const zoomDistance = Math.max(maxDimension * 0.7, 8);
      controlsRef.current.target.set(x, 0, z);
      controlsRef.current.object.position.set(
        x + zoomDistance * 0.72,
        zoomDistance * 0.58,
        z + zoomDistance * 0.82,
      );
      controlsRef.current.update();
    }
  };

  const updateGeographicCompass = useCallback(() => {
    const controls = controlsRef.current;
    const needle = compassNeedleRef.current;
    if (!controls?.object || !controls?.target || !needle) return;
    const heading = THREE.MathUtils.degToRad(geographicHeadingDegrees);
    const localNorth = new THREE.Vector3(-Math.sin(heading), 0, -Math.cos(heading));
    const targetOnScreen = controls.target.clone().project(controls.object);
    const northOnScreen = controls.target.clone().add(localNorth).project(controls.object);
    const screenX = northOnScreen.x - targetOnScreen.x;
    const screenUp = northOnScreen.y - targetOnScreen.y;
    if (Math.hypot(screenX, screenUp) < 1e-8) return;
    needle.style.transform = `rotate(${Math.atan2(screenX, screenUp)}rad)`;
  }, [geographicHeadingDegrees]);

  useEffect(() => {
    if (!onViewStateProviderChange || !controlsReady) return;
    onViewStateProviderChange(() => {
      const controls = controlsRef.current;
      return {
        cameraPosition: {
          x: Number(controls?.object?.position?.x ?? 0),
          y: Number(controls?.object?.position?.y ?? 0),
          z: Number(controls?.object?.position?.z ?? 0),
        },
        cameraTarget: {
          x: Number(controls?.target?.x ?? 0),
          y: Number(controls?.target?.y ?? 0),
          z: Number(controls?.target?.z ?? 0),
        },
        activeLayers: Array.from(activeLayers),
        availableLayers,
        environment: envPreset,
        sunlight,
        ground: extraGround,
        groundMap,
        autoRotate: Boolean(autoRotate),
        showGrid,
        showLegend,
        showGizmo: showGizmoCube,
        showControls,
        physicsDebug,
        viewPresets,
      };
    });
    return () => onViewStateProviderChange(null);
  }, [sunlight, extraGround, groundMap, activeLayers, autoRotate, availableLayers, controlsReady, envPreset, onViewStateProviderChange, physicsDebug, showControls, showGizmoCube, showGrid, showLegend, viewPresets]);

  useEffect(() => {
    if (!controlsReady || !controlsRef.current || !initialViewState) return;
    const key = JSON.stringify(initialViewState);
    if (restoredProjectViewKeyRef.current === key) return;
    restoredProjectViewKeyRef.current = key;
    if (isSavedCameraCompatibleWithScene(
      initialViewState,
      bounds,
      Math.max(cameraDistance * 4, 50),
    )) {
      controlsRef.current.object.position.set(
        initialViewState.cameraPosition.x,
        initialViewState.cameraPosition.y,
        initialViewState.cameraPosition.z,
      );
      controlsRef.current.target.set(
        initialViewState.cameraTarget.x,
        initialViewState.cameraTarget.y,
        initialViewState.cameraTarget.z,
      );
      controlsRef.current.update();
    } else {
      zoomToPosition(centerX, centerZ);
    }
    setActiveLayers(new Set(resolveRestoredThreeDActiveLayers(
      initialViewState.activeLayers,
      initialViewState.availableLayers,
      availableLayers,
    )));
    setEnvPreset(initialViewState.environment);
    setShowGrid(initialViewState.showGrid);
    setShowLegend(initialViewState.showLegend);
    setShowGizmoCube(initialViewState.showGizmo);
    setShowControls(initialViewState.showControls ?? false);
    setPhysicsDebug(initialViewState.physicsDebug ?? false);
    if (Boolean(autoRotate) !== initialViewState.autoRotate) onAutoRotateToggle?.();
    updateGeographicCompass();
  }, [autoRotate, availableLayers, bounds, cameraDistance, centerX, centerZ, controlsReady, initialViewState, onAutoRotateToggle, updateGeographicCompass]);

  const showNorthUpView = useCallback(() => {
    const controls = controlsRef.current;
    if (!controls?.object || !controls?.target) return;
    if (autoRotate) onAutoRotateToggle?.();
    const heading = THREE.MathUtils.degToRad(geographicHeadingDegrees);
    const localNorth = new THREE.Vector3(-Math.sin(heading), 0, -Math.cos(heading));
    const target = controls.target.clone();
    const distance = Math.max(controls.object.position.distanceTo(target), 8);
    const horizontalOffset = Math.max(distance * 0.02, 0.1);
    const verticalOffset = Math.sqrt(Math.max(
      (distance * distance) - (horizontalOffset * horizontalOffset),
      1,
    ));
    controls.object.up.set(0, 1, 0);
    controls.object.position.copy(target)
      .addScaledVector(localNorth, -horizontalOffset)
      .add(new THREE.Vector3(0, verticalOffset, 0));
    controls.update();
    updateGeographicCompass();
  }, [autoRotate, geographicHeadingDegrees, onAutoRotateToggle, updateGeographicCompass]);

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

  useEffect(() => {
    if (transforming) { setFocusTarget(null); setIsAnimating(false); }
  }, [transforming]);

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
    onControlChange?.(markerId, pos, normalizeSceneLayerType(moduleType) === 'characters' ? assetId : undefined);
  }, [onControlChange, onRuntimeMarkerPositionChange]);

  const markerWithCurrentPosition = useCallback((marker: any) => {
    const assetId = Number(marker?.data?.id);
    const currentPosition = Number.isSafeInteger(assetId) && assetId > 0
      ? resolveRuntimeMarkerPosition?.(marker.type, assetId)
      : null;
    return currentPosition
      ? { ...marker, position: { ...currentPosition } }
      : marker;
  }, [resolveRuntimeMarkerPosition]);

  // Marker identity selection belongs to the Dashboard owner. The Scene only
  // forwards a registry-current presentation of that marker.
  const handleMarkerClick = useCallback((marker: any) => {
    const currentMarker = markerWithCurrentPosition(marker);

    if (onMarkerClick && !transforming) onMarkerClick(currentMarker);
  }, [markerWithCurrentPosition, onMarkerClick, transforming]);

  useEffect(() => {
    if (!selectedMarker) {
      if (!selectedIncident) setSelectedDetails(null);
      return;
    }
    const currentMarker = markerWithCurrentPosition(selectedMarker);

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
    
    setSelectedDetails({
      name: currentMarker.name || currentMarker.label || 'Unknown',
      type: currentMarker.type,
      position: currentMarker.position,
      metadata: metadata,
    });
  }, [markerWithCurrentPosition, selectedIncident, selectedMarker]);

  const handleIncidentClick = (incident: any) => {
    if (transforming) return;
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

  // Sensor focusing is an explicit editor action. It must not replace marker
  // selection or change the camera mode that the user has chosen.
  useEffect(() => {
    if (
      sensorFocusRequest > 0
      && sensorFocusPosition
      && [sensorFocusPosition.x, sensorFocusPosition.y, sensorFocusPosition.z].every(Number.isFinite)
    ) {
      focusOnMarker({ position: sensorFocusPosition });
    }
    // focusOnMarker is intentionally excluded because it is recreated per render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sensorFocusPosition, sensorFocusRequest]);

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
    if (viewPresets.length >= 50) {
      alert('A Project can keep up to 50 saved views.');
      return;
    }
    if (!newPresetName.trim() || newPresetName.trim().length > 120) {
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
    <SceneHoverTitleContext.Provider value={true}>
    <div
      className={`relative w-full ${placementLabel ? 'cursor-crosshair' : ''}`}
      style={{ height, minHeight: '300px' }}
      data-threed-presentation-phase={scenePresentationPhase}
      data-threed-scene-intro={sceneIntro}
    >
      {placementLabel && (
        <div className="pointer-events-none absolute left-3 top-3 z-10 rounded border border-cyan-300/40 bg-black/70 px-3 py-1.5 text-xs text-white shadow-lg backdrop-blur-sm">
          Click the ground to {movingModelName ? 'move' : 'place'} <span className="font-medium">{placementLabel}</span>
        </div>
      )}
      {groundMap.visualMode === 'image' && groundMapAsset && (groundMapAsset.attribution || groundMapAsset.sourceProvider) && (
        <div className="pointer-events-none absolute bottom-2 right-2 z-10 max-w-[50%] rounded bg-black/55 px-2 py-1 text-[9px] text-white/70 backdrop-blur-sm">
          {groundMapAsset.attribution || groundMapAsset.sourceProvider}
        </div>
      )}
      {sceneProductionStarted && showSensors && (
        <section data-scene-hover-obstacle aria-label="Physics Sensors" className="threed-workspace-panel threed-scene-panel-surface absolute right-3 top-3 z-30 flex max-h-[calc(100%-1.5rem)] w-72 max-w-[calc(100%-1.5rem)] flex-col overflow-hidden rounded-lg border border-white/15 text-xs text-white shadow-xl backdrop-blur-md">
          <header className="flex shrink-0 items-center justify-between gap-2 px-3 py-2">
            <h2 className="text-sm font-semibold">Physics Sensors</h2>
            <button type="button" onClick={() => setShowSensors(false)} aria-label="Close Physics Sensors" className="rounded p-1 text-white/70 hover:bg-white/10"><X className="h-4 w-4" /></button>
          </header>
          <div className="min-h-0 space-y-2 overflow-y-auto overscroll-contain px-3 pb-3 [scrollbar-width:thin]">
            <button type="button" disabled={!counterGroups.length} onClick={resetSensorCounterState} className="rounded border border-white/15 px-2 py-1 disabled:opacity-40">Reset Counts</button>
            {!counterGroups.length && <p className="text-white/65">No entry counters configured. Add a Physics Sensor Cuboid in an asset’s DetailsCard and choose Count Entries.</p>}
            {counterGroups.map(([id, group]) => <details key={id} open className="rounded border border-white/10 p-2">
              <summary className="cursor-pointer text-white/80">{group.name}</summary>
              <div className="mt-2 space-y-1">{group.members.map(member => <div key={sensorMemberKey(member)} className="flex items-start justify-between gap-3">
                <span className="min-w-0 break-words">{member.name}</span>
                <span className="shrink-0 tabular-nums">{sensorCounterState.counts[sensorMemberKey(member)] ?? 0}</span>
              </div>)}</div>
            </details>)}
            <p className="text-[10px] text-white/55">Session counts continue while this panel is hidden.</p>
          </div>
        </section>
      )}
      {/* Scene-owned controls are presented from the shared Project toolbar. */}
      {environmentControlsHost && createPortal(<div data-scene-hover-obstacle className="relative">
        <Button
          type="button"
          onClick={() => {
            const nextOpen = !showControls;
            setShowControls(nextOpen);
            onEnvironmentControlsOpenChange?.(nextOpen);
          }}
          variant={showControls ? 'secondary' : 'outline'}
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          aria-expanded={showControls}
          title="Environment Controls"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Environment</span>
          {showControls ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </Button>

        {showControls && (
          <div className="threed-workspace-panel threed-toolbar-dropdown-surface absolute right-0 top-full z-[3000] mt-1 max-h-[min(44rem,calc(100dvh-8rem))] w-56 space-y-0.5 overflow-y-auto rounded-lg border border-white/10 p-1.5 pb-2.5 shadow-xl backdrop-blur-sm [scrollbar-width:thin]">
            <div className="text-[10px] text-white/60 px-2 py-0.5">Environment</div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-full justify-start text-xs"
              disabled={!hasProjectEnvironment}
              title={hasProjectEnvironment ? 'Open the assigned Environment Model DetailsCard' : 'No Environment Model is assigned to this Project'}
              onClick={() => {
                setShowControls(false);
                onEnvironmentControlsOpenChange?.(false);
                onOpenEnvironmentDetails?.();
              }}
            >
              <Settings className="h-3.5 w-3.5" />
              Setup Environment Map
            </Button>
            <div className="my-1 border-t border-white/10" />
            <select
              value={envPreset}
              onChange={(e) => setEnvPreset(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white/80 focus:outline-none focus:border-white/30 appearance-none"
              style={{ scrollbarWidth: 'thin' }}
            >
              {THREE_D_ENVIRONMENT_PRESETS.map((preset) => (
                <option key={preset.key} value={preset.key} className="bg-gray-800 text-white">
                  {preset.label}
                </option>
              ))}
            </select>
            <details className="px-2 py-1 text-xs text-white/70">
              <summary className="cursor-pointer">Ground Map</summary>
              <div className="mt-2 space-y-1.5">
                <label className="block">Ground Visual
                  <select value={groundMap.visualMode} onChange={event => setGroundMap(value => ({ ...value, visualMode: event.target.value as ProjectGroundMapTransform['visualMode'] }))} className="mt-1 w-full rounded border border-white/10 bg-black/40 px-1 py-1">
                    <option value="procedural">Procedural</option>
                    <option value="image" disabled={!groundMapAsset}>Uploaded Image</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </label>
                <input ref={groundMapInputRef} className="hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void uploadGroundMap(file); }} />
                <input value={groundMapSourceProvider} maxLength={120} onChange={event => setGroundMapSourceProvider(event.target.value)} placeholder="Source (optional)" aria-label="Ground Map source" className="w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-[10px]" />
                <input value={groundMapAttribution} maxLength={1000} onChange={event => setGroundMapAttribution(event.target.value)} placeholder="Attribution (optional)" aria-label="Ground Map attribution" className="w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-[10px]" />
                <button type="button" disabled={groundMapBusy || !projectId} onClick={() => groundMapInputRef.current?.click()} className="w-full rounded border border-white/15 bg-white/5 px-2 py-1 text-left hover:bg-white/10 disabled:opacity-40">
                  {groundMapBusy ? 'Uploading…' : groundMapAsset ? 'Replace Ground Map Image' : 'Upload Ground Map Image'}
                </button>
                {groundMapAsset && <button type="button" disabled={groundMapBusy} onClick={() => void deleteGroundMap()} className="w-full rounded border border-red-300/20 px-2 py-1 text-left text-red-200/80 hover:bg-red-500/10 disabled:opacity-40">Remove Ground Map Image</button>}
                {groundMapAsset && <div className="text-[10px] text-white/50">{groundMapAsset.fileName} · {groundMapAsset.width} × {groundMapAsset.height}px</div>}
                {groundMap.visualMode === 'image' && groundMapAsset && <div className="grid grid-cols-2 gap-1">
                  {([
                    ['Width', 'width', 1, 20000, 1], ['Length', 'length', 1, 20000, 1],
                    ['Center X', 'centerX', -1000000, 1000000, 0.1], ['Center Z', 'centerZ', -1000000, 1000000, 0.1],
                    ['Height', 'height', -1000, 1000, 0.05], ['Rotation', 'rotationY', -360, 360, 1],
                  ] as const).map(([label, key, min, max, step]) => <label key={key} className="block text-[10px]">{label}
                    <input className="mt-0.5 w-full rounded bg-black/40 px-1 py-1" type="number" min={min} max={max} step={step} value={groundMap[key]} onChange={event => { const next = Number(event.target.value); if (Number.isFinite(next) && next >= min && next <= max) setGroundMap(value => ({ ...value, [key]: next })); }} />
                  </label>)}
                  <label className="col-span-2 block text-[10px]">Opacity: {Math.round(groundMap.opacity * 100)}%
                    <input className="w-full" type="range" min="0.05" max="1" step="0.05" value={groundMap.opacity} onChange={event => setGroundMap(value => ({ ...value, opacity: Number(event.target.value) }))} />
                  </label>
                  <button type="button" className="col-span-2 rounded border border-white/15 px-2 py-1 hover:bg-white/10" onClick={() => setGroundMap(value => ({ ...value, centerX, centerZ, rotationY: -geographicHeadingDegrees }))}>Align North-Up + Center</button>
                </div>}
                <p className="text-[10px]">Save Project to keep alignment settings.</p>
              </div>
            </details>
            <details className="px-2 py-1 text-xs text-white/70">
              <summary className="cursor-pointer">Sunlight + Ground</summary>
              <label className="block mt-2">Sun Direction: {sunlight.azimuth}°
                <input className="w-full" type="range" min="0" max="360" value={sunlight.azimuth} title="Adjust sun direction. An overhead sun lowers to 45° so direction is visible." onChange={e => setSunlight(v => ({...v, azimuth: Number(e.target.value), elevation: v.elevation === 90 ? 45 : v.elevation}))} />
              </label>
              <label className="block">Sun Elevation: {sunlight.elevation}°
                <input className="w-full" type="range" min="5" max="90" value={sunlight.elevation} onChange={e => setSunlight(v => ({...v, elevation: Number(e.target.value)}))} />
              </label>
              <label className="block"><input type="checkbox" checked={extraGround.enabled} onChange={e => setExtraGround(v => ({...v, enabled: e.target.checked}))} /> Apply Ground Plane</label>
              {extraGround.enabled && <div className="space-y-1 mt-1">
                <label className="flex items-center gap-2"><span className="w-10 shrink-0">Size</span><input aria-label="Ground size" className="min-w-0 flex-1 bg-black/40" type="number" min="10" max="2000" value={extraGround.size} onChange={e => { const n = Number(e.target.value); if (Number.isFinite(n) && n >= 10 && n <= 2000) setExtraGround(v => ({...v, size: n})); }} /></label>
                <label className="flex items-center gap-2"><span className="w-10 shrink-0">Height</span><input aria-label="Ground height" className="min-w-0 flex-1 bg-black/40" type="number" step="0.1" min="-1000" max="1000" value={extraGround.height} onChange={e => { const n = Number(e.target.value); if (Number.isFinite(n) && Math.abs(n) <= 1000) setExtraGround(v => ({...v, height: n})); }} /></label>
              </div>}
              <p className="mt-1 text-[10px]">Save Project to keep settings.</p>
            </details>
            <div className="border-t border-white/10 my-1" />
            <button onClick={onAutoRotateToggle} aria-pressed={autoRotate} className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs transition-colors ${autoRotate ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
              <RotateCw className={`h-3.5 w-3.5 ${autoRotate ? 'animate-spin [animation-duration:4s]' : ''}`} />
              {autoRotate ? 'Pause Rotation' : 'Auto-Rotate'}
            </button>
            <button onClick={() => setShowGrid(!showGrid)} aria-pressed={showGrid} className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs transition-colors ${showGrid ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
              <Grid3X3 className="h-3.5 w-3.5" />
              {showGrid ? 'Hide Grid' : 'Show Grid'}
            </button>
            {hasData && Object.keys(typeCounts).length > 0 && (
              <button onClick={() => setShowLegend(!showLegend)} aria-pressed={showLegend} className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs transition-colors ${showLegend ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
                <List className="h-3.5 w-3.5" />
                {showLegend ? 'Hide Legend' : 'Show Legend'}
              </button>
            )}
            <button onClick={() => { setShowSensors(value => !value); setShowControls(false); }} aria-pressed={showSensors} className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs transition-colors ${showSensors ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
              <Target className="h-3.5 w-3.5" />
              {showSensors ? 'Hide Sensors' : 'Show Sensors'}
            </button>
            <button
              onClick={() => setPhysicsDebug(!physicsDebug)}
              className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs transition-colors ${physicsDebug ? 'bg-amber-500/20 text-amber-100' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
              aria-pressed={physicsDebug}
            >
              <BrickWall className="h-3.5 w-3.5" />
              {physicsDebug ? 'Hide Physics Debug' : 'Show Physics Debug'}
            </button>
            <button onClick={() => setShowGizmoCube(!showGizmoCube)} aria-pressed={showGizmoCube} className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white">
              <Move3D className="h-3.5 w-3.5" />
              {showGizmoCube ? 'Hide Gizmo' : 'Show Gizmo'}
            </button>
            {incidents.length > 0 && (
              <button onClick={() => setShowIncidents(!showIncidents)} aria-pressed={showIncidents} className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs transition-colors ${showIncidents ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
                <Siren className="h-3.5 w-3.5" />
                {showIncidents ? 'Hide Incidents' : 'Show Incidents'}
              </button>
            )}
            <div className="border-t border-white/10 my-1" />
            <button
              onClick={showNorthUpView}
              className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Compass className="h-3.5 w-3.5" />
              North-Up View
            </button>
            <button
              onClick={() => {
                setSelectedDetails(null);
                if (controlsRef.current) zoomToPosition(centerX, centerZ);
              }}
              className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Crosshair className="h-3.5 w-3.5" />
              Center View
            </button>
            
            {/* ✅ Save View button */}
            <button
              onClick={() => setShowPresetDialog(true)}
              className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Save className="h-3.5 w-3.5" />
              Save Current View
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
                      <Trash2 className="h-3 w-3" />
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
                      {activeLayers.has(layer)
                        ? <Eye className="h-3 w-3" />
                        : <EyeOff className="h-3 w-3" />}
                    </span>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>, environmentControlsHost)}

      {/* ✅ Save View Dialog */}
      {showPresetDialog && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="threed-workspace-panel border border-white/10 rounded-lg p-4 max-w-sm w-full mx-4 shadow-2xl">
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

      {hoveredSceneMarker && (
        <div ref={hoverTitleRef} style={{ visibility: 'hidden' }} className="pointer-events-none absolute z-50 max-w-[calc(100%_-_2rem)] rounded-md border border-white/15 bg-slate-950/45 px-3 py-1.5 text-sm font-medium text-white shadow-sm [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">
          <span className="block truncate">{hoveredSceneMarker.name || hoveredSceneMarker.data?.name || hoveredSceneMarker.data?.modelName || 'Scene Asset'}</span>
        </div>
      )}

      {/* Legend */}
      {hasData && showLegend && Object.keys(typeCounts).length > 0 && (
        <div className="absolute bottom-3 left-3 z-50 bg-black/70 backdrop-blur-sm text-white p-2 rounded border border-white/10 min-w-[90px]">
          <div className="text-[10px] font-medium text-white/80 mb-1">Legend</div>
          {(Object.entries(typeCounts) as [string, number][]).map(([type, count]) => (
            <div key={type} className="flex items-center gap-1.5 text-[10px] text-white/70 py-0.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getMarkerColor(type) }} />
              <span className="capitalize">{type}: {count}</span>
            </div>
          ))}
        </div>
      )}

      <div
        className={`pointer-events-none absolute left-3 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white shadow-lg backdrop-blur-sm ${showLegend ? 'bottom-24' : 'bottom-3'}`}
        aria-label="True north compass"
        title={`True north · Project heading ${geographicHeadingDegrees.toFixed(1)}°`}
      >
        <div ref={compassNeedleRef} className="flex h-10 w-10 flex-col items-center justify-start transition-transform duration-75">
          <span className="text-[9px] font-bold leading-none text-red-300">N</span>
          <span className="text-lg leading-4 text-red-300">↑</span>
        </div>
        <span className="absolute bottom-0.5 text-[7px] text-white/45">TRUE</span>
      </div>

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
      <div
        className={`h-full w-full transition-opacity duration-700 ease-out ${sceneProductionStarted ? 'opacity-100' : 'opacity-0'}`}
        aria-hidden={!sceneProductionStarted}
        onTransitionEnd={(event) => {
          if (
            event.target === event.currentTarget
            && event.propertyName === 'opacity'
            && sceneProductionStarted
          ) {
            setPostProductionSceneKey(presentationKey);
          }
        }}
      >
      <Canvas
        onWheel={() => {
          if (cameraMode === 'follow') {
            onCameraModeChange?.('stationary');
          }
        }}
        onCreated={(state) => {
          stopCanvasFrameLoopRef.current = () => state.setFrameloop('never');
        }}
        camera={{
          position: [
            centerX + cameraDistance * 0.72,
            cameraDistance * 0.58,
            centerZ + cameraDistance * 0.82,
          ],
          fov: 45,
        }}
        gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
        shadows={{ type: THREE.PCFShadowMap }}
      >
        <SceneHoverTitlePosition markerId={hoveredSceneMarker ? String(hoveredSceneMarker.id) : undefined} point={hoveredSceneMarkerIdentity?.point} labelRef={hoverTitleRef} />
        <SceneFrameReadyNotifier
          key={presentationKey}
          onReady={() => setPaintedPresentationKey(presentationKey)}
        />
        <Environment
          preset={environmentPreset.lightingPreset as any}
          background={!environmentPreset.backgroundUrl && !environmentPreset.proceduralSky}
          blur={0}
        />
        {environmentPreset.proceduralSky && (
          <ProceduralDaylightBackground />
        )}
        {environmentPreset.backgroundUrl && (
          <HighResolutionEnvironmentBackground url={environmentPreset.backgroundUrl} />
        )}

        <ambientLight intensity={0.6} />
        <ShadowLight centerX={centerX} centerZ={centerZ} azimuth={sunlight.azimuth} elevation={sunlight.elevation} />
        <directionalLight position={[-5, 5, -5]} intensity={0.3} />
        <hemisphereLight args={['#87CEEB', '#2d5a27', 0.4]} />

        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping={false}
          minDistance={2}
          maxDistance={200}
          maxPolarAngle={Math.PI / 2}
          autoRotate={autoRotate && !transforming}
          autoRotateSpeed={0.8}
          target={[centerX, 0, centerZ]}
          onChange={updateGeographicCompass}
        />
        {transforming && <SceneTransformGizmo key={transform!.session!.objectKey} />}
        <ControlsReadyNotifier
          controlsRef={controlsRef}
          onReady={() => {
            setControlsReady(true);
            updateGeographicCompass();
          }}
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
              enabled={!transforming}
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
              <GizmoViewcube onClick={(event) => {
                event.stopPropagation();
                const controls = controlsRef.current;
                if (!controls) return null;
                const direction = event.object.position.lengthSq() > 0
                  ? event.object.position.clone().normalize()
                  : event.face?.normal.clone();
                if (!direction) return null;
                const distance = controls.object.position.distanceTo(controls.target);
                controls.object.position.copy(controls.target).addScaledVector(direction, distance);
                controls.object.up.set(0, 1, 0);
                controls.object.lookAt(controls.target);
                controls.update();
                return null;
              }} />
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
          onEscape={() => { if (transforming) { transform?.cancel(); return; } clearDetails(); setIsAnimating(false); setFocusTarget(null); }}
          onResetView={() => { if (!transforming) zoomToPosition(centerX, centerZ); }}
          onToggleGrid={() => setShowGrid(!showGrid)}
          onFocusSelected={() => { if (!transforming && selectedDetails?.position) focusOnMarker(selectedDetails); }}
          hasSelected={!!selectedDetails}
        />

        <SceneModelDropTarget
          active={Boolean(placementModel)}
          expectedModelId={placementModel?.id ?? null}
          size={groundSize}
          centerX={groundCenterX}
          centerZ={groundCenterZ}
          onDrop={onModelPlacement}
        />

        <Physics
          gravity={[0, -9.81, 0]}
          debug={false}
          paused={transforming}
        >
          {/* Focused diagnostic guides are rendered by each owner. Rendering
              Rapier's complete Environment mesh obscures Sensor placement. */}
          {groundMap.visualMode === 'image' && groundMapAsset && groundMap.groundMapId === groundMapAsset.id && <RigidBody
            type="fixed" colliders={false}
            position={[groundMap.centerX, groundMap.height, groundMap.centerZ]}
            rotation={[0, groundMap.rotationY * Math.PI / 180, 0]}
          >
            <CuboidCollider args={[groundMap.width / 2, 0.1, groundMap.length / 2]} position={[0, -0.1, 0]} />
            <group onPointerMove={event => { if (placementLabel) setPlacementPreviewPosition({ x: event.point.x, y: event.point.y, z: event.point.z }); }}
              onPointerLeave={() => setPlacementPreviewPosition(null)}
              onClick={event => {
                if (!placementLabel) return;
                event.stopPropagation();
                const place = placementPhysicsSensor ? onPhysicsSensorPlacement : movingModelName ? onModelReposition : placementCharacterName ? onCharacterPlacement : placementFarmBotName ? onFarmBotPlacement : placementPlantingName ? onPlantingPlacement : placementBedName ? onBedPlacement : onModelPlacement;
                place?.({ x: event.point.x, y: event.point.y, z: event.point.z });
              }}>
              <Suspense fallback={<mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[groundMap.width, groundMap.length]} /><meshStandardMaterial color="#334155" /></mesh>}>
                <GroundMapImagePlane asset={groundMapAsset} transform={groundMap} />
              </Suspense>
            </group>
          </RigidBody>}
          {groundMap.visualMode !== 'image' && extraGround.enabled && <RigidBody type="fixed" colliders={false} position={[centerX, extraGround.height, centerZ]}>
            <CuboidCollider args={[extraGround.size / 2, 0.1, extraGround.size / 2]} position={[0, -0.1, 0]} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow
              onPointerMove={event => { if (placementLabel) setPlacementPreviewPosition({x: event.point.x, y: event.point.y, z: event.point.z}); }}
              onPointerLeave={() => setPlacementPreviewPosition(null)}
              onClick={event => {
                if (!placementLabel) return;
                event.stopPropagation();
                const place = placementPhysicsSensor ? onPhysicsSensorPlacement : movingModelName ? onModelReposition : placementCharacterName ? onCharacterPlacement : placementFarmBotName ? onFarmBotPlacement : placementPlantingName ? onPlantingPlacement : placementBedName ? onBedPlacement : onModelPlacement;
                place?.({x: event.point.x, y: event.point.y, z: event.point.z});
              }}>
              <planeGeometry args={[extraGround.size, extraGround.size]} />
              <meshStandardMaterial color="#527b38" roughness={0.9} visible={groundMap.visualMode === 'procedural'} />
            </mesh>
          </RigidBody>}
          {/* v0.16.0-alpha: Interactive ground plane as fixed physics body */}
          {groundMap.visualMode !== 'image' && !extraGround.enabled && <RigidBody type="fixed" colliders="cuboid">
            <InteractiveGround
              size={groundSize}
              centerX={groundCenterX}
              centerZ={groundCenterZ}
              placementActive={Boolean(placementLabel)}
              onPlacementHover={setPlacementPreviewPosition}
              onPlacementLeave={() => setPlacementPreviewPosition(null)}
              onPlacementClick={placementPhysicsSensor
                ? onPhysicsSensorPlacement
                : movingModelName
                ? onModelReposition
                : placementCharacterName
                ? onCharacterPlacement
                : placementFarmBotName
                  ? onFarmBotPlacement
                : placementPlantingName
                  ? onPlantingPlacement
                  : placementBedName
                    ? onBedPlacement
                    : onModelPlacement}
              showVisualGround={groundMap.visualMode === 'procedural' && !hasVisibleEnvironmentModel}
            />
          </RigidBody>}

          {placementLabel && placementPreviewPosition && (
            <group position={[
              placementPreviewPosition.x,
              placementPreviewPosition.y + (placementPhysicsSensor?.height ?? 0.5) / 2,
              placementPreviewPosition.z,
            ]} rotation={[0, (placementPhysicsSensor?.rotationY ?? 0) * Math.PI / 180, 0]}>
              <mesh raycast={() => null}>
                <boxGeometry args={placementPhysicsSensor
                  ? [placementPhysicsSensor.width, placementPhysicsSensor.height, placementPhysicsSensor.depth]
                  : [0.5, 0.5, 0.5]} />
                <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.9} depthTest={false} />
              </mesh>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -(placementPhysicsSensor?.height ?? 0.5) / 2 + 0.01, 0]} raycast={() => null}>
                <ringGeometry args={[0.45, 0.6, 32]} />
                <meshBasicMaterial color="#22d3ee" transparent opacity={0.8} side={THREE.DoubleSide} />
              </mesh>
              {placementPhysicsSensor && <>
                <group position={[0, 0, placementPhysicsSensor.depth / 2 + 0.28]} raycast={() => null}>
                  <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <coneGeometry args={[0.14, 0.38, 8]} />
                    <meshBasicMaterial color="#fbbf24" transparent opacity={0.95} depthTest={false} />
                  </mesh>
                </group>
                <Html position={[0, placementPhysicsSensor.height / 2 + 0.32, 0]} center distanceFactor={12}>
                  <div className="pointer-events-none whitespace-nowrap rounded border border-amber-300/40 bg-slate-950/90 px-2 py-1 text-[10px] font-medium text-amber-100 shadow">
                    Y rotation {Math.round(placementPhysicsSensor.rotationY)}°
                  </div>
                </Html>
              </>}
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
          {focusTarget && !transforming && (
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

          {sceneMarkers.filter((marker) => {
            if (sceneEnvironmentReady) return true;
            const layerType = normalizeSceneLayerType(marker.type);
            if (layerType === 'characters') return false;
            return layerType !== 'models' || !isProjectModelMovableBall(marker.metadata);
          }).map((marker, idx) => {
            const markerMatchesPresentationFilter = visibleMarkerIds?.has(String(marker.id)) ?? true;
            return (
              <group
                key={`threed-marker-${marker.id ?? `${marker.type}-${idx}`}`}
                name={`threed-marker-${marker.id}`}
                onPointerOver={(event) => {
                  if (!markerMatchesPresentationFilter
                    || !activeLayers.has(normalizeSceneLayerType(marker.type))
                    || isProjectModelEnvironment(marker.metadata)) return;
                  setHoveredSceneMarkerIdentity(current => current && current.projectId === projectId && current.markerId === String(marker.id) ? current : { projectId, markerId: String(marker.id), point: [event.point.x, event.point.y, event.point.z] });
                }}
                onPointerOut={() => setHoveredSceneMarkerIdentity((current) =>
                  current?.markerId === String(marker.id) ? null : current)}
                visible={markerMatchesPresentationFilter && activeLayers.has(normalizeSceneLayerType(marker.type))}
              >
                <ThreeDMarkerComponent
                  marker={marker}
                  onClick={handleMarkerClick}
                  isSelected={selectedMarker?.id === marker.id && selectedMarker?.type === marker.type}
                  isLayerEnabled={activeLayers.has(normalizeSceneLayerType(marker.type))}
                  placementActive={Boolean(placementLabel)}
                  onPlacementHover={setPlacementPreviewPosition}
                  onPlacementClick={placementPhysicsSensor
                    ? onPhysicsSensorPlacement
                    : movingModelName
                    ? onModelReposition
                    : placementCharacterName
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
                  onModelRuntimeSettled={handleModelRuntimeSettled}
                  onCharacterRuntimeSettled={handleCharacterRuntimeSettled}
                  characterSpawnPositions={characterSpawnPositions}
                  projectId={projectId}
                  onSensorPhysicsEvent={handleSensorPhysicsEvent}
                />
              </group>
            );
          })}
        </Physics>

      </Canvas>
      </div>
      )}

      {!physicsFailed && !sceneProductionStarted && (
        <ThreeDProjectLoadingPresentation
          progress={sceneLoadingProgress}
          label={sceneLoadingLabel}
          className="absolute inset-0 z-50"
        />
      )}
    </div>
    </SceneHoverTitleContext.Provider>
  );
}
