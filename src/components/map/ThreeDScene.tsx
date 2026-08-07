// components/map/ThreeDScene.tsx
'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, Environment, Html, Plane, Grid, 
  GizmoHelper, GizmoViewcube, GizmoViewport,
  Text, Sphere, Box, Cylinder, Cone, Ring 
} from '@react-three/drei';
import * as THREE from 'three';
import { Settings, ChevronDown, ChevronUp, X, Target, Layers } from 'lucide-react';
import { GardenCharacter } from '@/components/threed/shared/GardenCharacter';
import { BedMarker3D } from '@/components/threed/markers/BedMarker3D';
import { PlantMarker3D } from '@/components/threed/markers/PlantMarker3D';
import { FarmBotMarker3D } from '@/components/threed/markers/FarmBotMarker3D';
import { WeatherEffects } from '@/components/threed/effects/WeatherEffects';

interface ThreeDSceneProps {
  incidents: any[];
  markers: any[];
  onIncidentClick?: (incident: any) => void;
  onMarkerClick?: (marker: any) => void;
  selectedIncident?: any;
  selectedMarker?: any;
  height?: string;
  autoRotate?: boolean;
  onAutoRotateToggle?: () => void;
  projectId?: number;
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
    
    endPos.current.set(
      target.x + 4,
      target.y + 3,
      target.z + 4
    );
    
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

// ✅ ThreeD Marker Component
function ThreeDMarkerComponent({ marker, onClick, isSelected }: any) {
  const [hovered, setHovered] = useState(false);
  const color = marker.color || getMarkerColor(marker.type);
  const size = isSelected ? 1.0 : 0.6;

  // ✅ v0.15.0/15.2: Render rich markers for types that have dedicated components
  const pos: [number, number, number] = [Number(marker.position.x) || 0, Number(marker.position.y) || 0, Number(marker.position.z) || 0];

  if (marker.type === 'character' || marker.type === 'characters') {
    return (
      <group
        onClick={(e) => { e.stopPropagation(); if (onClick) onClick(); }}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <GardenCharacter character={marker.data} />
      </group>
    );
  }

  if (marker.type === 'bed' || marker.type === 'beds') {
    return (
      <group
        onClick={(e) => { e.stopPropagation(); if (onClick) onClick(); }}
      >
        <BedMarker3D bed={{ ...(marker.data || {}), width: marker.data?.widthFeet ?? marker.data?.width ?? 4, depth: marker.data?.lengthFeet ?? marker.data?.length ?? marker.data?.depth ?? 8, name: marker.name, soilType: marker.data?.soilType, sunExposure: marker.data?.sunExposure, plantingsCount: marker.data?.plantingsCount ?? marker.data?._plantingsCount ?? 0 }} position={pos} />
      </group>
    );
  }

  if (marker.type === 'planting' || marker.type === 'plantings') {
    return (
      <group
        onClick={(e) => { e.stopPropagation(); if (onClick) onClick(); }}
      >
        <PlantMarker3D plant={{ ...(marker.data || {}), name: marker.name, species: marker.data?.plantType || marker.data?.commonName || marker.data?.plantName || '', z: marker.position.z, x: marker.position.x, plantedAt: marker.data?.plantedDate || marker.data?.plantedAt || '', growthStage: marker.data?.growthStage, health: marker.data?.health, quantity: marker.data?.quantity, status: marker.data?.status }} position={pos} />
      </group>
    );
  }

  if (marker.type === 'farmbot' || marker.type === 'farmbots') {
    const fbData = marker.data || {};
    const fbStatus = fbData.status?.toLowerCase() || 'offline';
    const fbStatusColor = ({ online: '#22c55e', offline: '#ef4444', busy: '#f59e0b', maintenance: '#3b82f6', error: '#ef4444' } as Record<string, string>)[fbStatus] || '#6b7280';

    return (
      <group
        position={pos}
        onClick={(e) => { e.stopPropagation(); if (onClick) onClick(); }}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <mesh position={[0, 0.15, 0]} castShadow>
          <boxGeometry args={[0.6, 0.3, 0.4]} />
          <meshStandardMaterial color="#4B5563" roughness={0.3} metalness={0.6} />
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
      </group>
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
      position={[Number(marker.position.x) || 0, Number(marker.position.y) || 0, Number(marker.position.z) || 0]}
      onClick={(e) => { e.stopPropagation(); if (onClick) onClick(); }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <mesh>
        {getShape()}
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isSelected ? 0.4 : 0.05} roughness={0.4} metalness={0.2} />
      </mesh>
    </group>
  );
}

// Animated pulse ring for selected/hovered markers
function PulseRing({ position, color, size = 1.0 }: { position: [number, number, number]; color: string; size?: number }) {
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ringRef.current) {
      const t = state.clock.elapsedTime;
      const scale = 1 + Math.sin(t * 3) * 0.25;
      ringRef.current.scale.set(scale, scale, scale);
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.3 + Math.sin(t * 2) * 0.2;
    }
  });
  return (
    <mesh ref={ringRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[size * 1.2, size * 1.6, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

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
function InteractiveGround({ size, centerX, centerZ, onClick }: any) {
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
        onClick={(e) => { e.stopPropagation(); if (onClick) onClick(); }}
      >
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </Plane>
    </group>
  );
}

export function ThreeDScene({
  incidents,
  markers,
  onIncidentClick,
  onMarkerClick,
  selectedIncident,
  selectedMarker,
  height = '100%',
  autoRotate = false,
  onAutoRotateToggle,
  projectId,
}: ThreeDSceneProps) {
  const controlsRef = useRef<any>(null);
  const [hasData, setHasData] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showGizmoCube, setShowGizmoCube] = useState(true);
  const [controlsReady, setControlsReady] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<any>(null);
  
  // ✅ Camera focus state
  const [focusTarget, setFocusTarget] = useState<any>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // ✅ Layer visibility state
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set(['beds', 'characters', 'farmbots', 'plantings', 'layers']));
  const [availableLayers, setAvailableLayers] = useState<string[]>(['beds', 'characters', 'farmbots', 'plantings', 'layers']);

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

  // ✅ Fetch layers from API
  useEffect(() => {
    const fetchLayers = async () => {
      try {
        if (!projectId) {
          setAvailableLayers(['beds', 'characters', 'farmbots', 'plantings', 'layers']);
          setActiveLayers(new Set(['beds', 'characters', 'farmbots', 'plantings', 'layers']));
          return;
        }
        
        const response = await fetch(`/api/threed/layers?projectId=${projectId}`);
        const data = await response.json();
        if (data.success && data.data.length > 0) {
          // ✅ Use known marker types for activeLayers (not DB layerType values which differ)
          // DB layers store their display category in layerType, but markers use
          // their sub-module names: plantings, beds, characters, farmbots
          const markerTypes = ['beds', 'characters', 'farmbots', 'plantings', 'layers'];
          const dbLayerTypes = data.data.map((layer: any) => layer.layerType || layer.name);
          setAvailableLayers(dbLayerTypes);
          // ✅ Always include the known marker-producing types so they render
          setActiveLayers(new Set(markerTypes));
        } else {
          setAvailableLayers(['beds', 'characters', 'farmbots', 'plantings', 'layers']);
          setActiveLayers(new Set(['beds', 'characters', 'farmbots', 'plantings', 'layers']));
        }
      } catch (error) {
        console.error('Failed to fetch layers:', error);
        setAvailableLayers(['beds', 'characters', 'farmbots', 'plantings', 'layers']);
        setActiveLayers(new Set(['beds', 'characters', 'farmbots', 'plantings', 'layers']));
      }
    };
    
    fetchLayers();
  }, [projectId]);

  // ✅ Filter markers by active layers (normalize singular/plural type names)
  const normalizeType = (type: string): string => {
    // Ensure marker types match activeLayers keys (both singular → plural)
    const singularMap: Record<string, string> = {
      'planting': 'plantings',
      'bed': 'beds',
      'character': 'characters',
      'farmbot': 'farmbots',
      'layer': 'layers',
      'marker': 'markers',
    };
    return singularMap[type] || type;
  };

  const visibleMarkers = markers.filter((marker) => {
    if (activeLayers.size === 0) return false;
    const normalizedType = normalizeType(marker.type);
    return activeLayers.has(marker.type) || activeLayers.has(normalizedType);
  });

  const visibleIncidents = showIncidents ? incidents : [];
  const allPositions = [
    ...visibleIncidents.map((i: any) => ({ x: Number(i.position.x) || 0, z: Number(i.position.z) || 0 })),
    ...visibleMarkers.map((m: any) => ({ x: Number(m.position.x) || 0, z: Number(m.position.z) || 0 }))
  ];
  const bounds = calculateBounds(allPositions);
  const centerX = isFinite(bounds.centerX) ? bounds.centerX : 0;
  const centerZ = isFinite(bounds.centerZ) ? bounds.centerZ : 0;
  const maxDimension = Math.min(Math.max(bounds.width, bounds.height), 500);
  const cameraDistance = Math.min(Math.max(maxDimension * 1.5, 20), 750);
  const groundSize = Math.min(Math.max(maxDimension + 10, 30), 500);

  const typeCounts = visibleMarkers.reduce((acc: any, m: any) => {
    acc[m.type] = (acc[m.type] || 0) + 1;
    return acc;
  }, {});

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
  const focusOnMarker = (marker: any) => {
    if (!marker || !controlsRef.current) return;
    setFocusTarget({
      x: Number(marker.position.x) || 0,
      y: Number(marker.position.y) || 0,
      z: Number(marker.position.z) || 0
    });
    setIsAnimating(true);
  };

  // ✅ Handle focus complete
  const handleFocusComplete = () => {
    setIsAnimating(false);
    setFocusTarget(null);
  };

  // ✅ Enhanced marker click handler
  const handleMarkerClick = (marker: any) => {
    const metadata: any = {
      ...marker.metadata,
      ...(marker.data || {}),
    };
    
    if (marker.type === 'plantings' && marker.data) {
      metadata.plantName = marker.data.plantName || marker.data.commonName || '';
    }
    
    if (marker.type === 'beds' && marker.data) {
      const width = marker.data.widthFeet || marker.data.width;
      const length = marker.data.lengthFeet || marker.data.length;
      if (width && length) {
        metadata.dimensions = `${width}ft × ${length}ft`;
      }
    }
    
    if (marker.type === 'farmbots' && marker.data) {
      metadata.deviceId = marker.data.deviceId || '';
      metadata.batteryLevel = marker.data.batteryLevel || 0;
      metadata.firmwareVersion = marker.data.firmwareVersion || '';
      metadata.lastSeen = marker.data.lastSeen || '';
    }
    
    if (marker.type === 'characters' && marker.data) {
      metadata.characterType = marker.data.type || '';
      metadata.emote = marker.data.defaultEmote || '';
      metadata.movementType = marker.data.movementType || '';
      metadata.interactable = marker.data.interactable || false;
    }
    
    setSelectedDetails({
      name: marker.name || marker.label || 'Unknown',
      type: marker.type,
      position: marker.position,
      metadata: metadata,
    });
    
    if (onMarkerClick) onMarkerClick(marker);
    focusOnMarker(marker);
  };

  const handleIncidentClick = (incident: any) => {
    setSelectedDetails({
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
    focusOnMarker(incident);
  };

  const clearDetails = () => {
    setSelectedDetails(null);
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
    <div className="relative w-full" style={{ height, minHeight: '300px' }}>
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
          <div className="bg-black/70 backdrop-blur-sm rounded border border-white/10 p-1 pb-2.5 min-h-[260px] overflow-y-auto w-[160px] space-y-0.5">
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
                  <span>Layers</span>
                  <button
                    onClick={() => {
                      if (activeLayers.size === availableLayers.length) {
                        setActiveLayers(new Set());
                      } else {
                        setActiveLayers(new Set(availableLayers));
                      }
                    }}
                    className="ml-auto text-[10px] text-white/40 hover:text-white/80 transition-colors"
                  >
                    {activeLayers.size === availableLayers.length ? 'Hide All' : 'Show All'}
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
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      activeLayers.has(layer) ? getMarkerColor(layer) || 'bg-gray-400' : 'bg-gray-600'
                    }`} />
                    <span className="capitalize">{layer}</span>
                    <span className="ml-auto text-[10px]">
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

      <Canvas
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

        <InteractiveGround size={groundSize} centerX={centerX} centerZ={centerZ} onClick={clearDetails} />

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

        {visibleMarkers.map((marker, idx) => (
          <ThreeDMarkerComponent
            key={`threed-marker-${marker.type}-${marker.id ?? idx}`}
            marker={marker}
            onClick={() => handleMarkerClick(marker)}
            isSelected={selectedMarker?.id === marker.id && selectedMarker?.type === marker.type}
          />
        ))}

        {!hasData && (
          <Html position={[0, 2, 0]} distanceFactor={10}>
            <div className="bg-black/60 backdrop-blur-sm text-white px-4 py-3 rounded-lg text-center max-w-xs border border-white/10">
              <p className="text-sm font-medium">No 3D Data Available</p>
              <p className="text-xs opacity-70 mt-1">Select a project with 3D assets or add markers to see them here</p>
            </div>
          </Html>
        )}
      </Canvas>
    </div>
  );
}