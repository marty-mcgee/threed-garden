// components/map/ThreeDScene.tsx
'use client';

import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, Environment, Html, Plane, Grid, 
  Text, Sphere, Box, Cylinder, Cone, Ring 
} from '@react-three/drei';
import * as THREE from 'three';
import { Settings, ChevronDown, ChevronUp, X, Target, Layers } from 'lucide-react';

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
  if (positions.length === 0) {
    return { minX: -20, maxX: 20, minZ: -20, maxZ: 20, width: 40, height: 40, centerX: 0, centerZ: 0 };
  }
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  positions.forEach(p => {
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
      position={[incident.position.x, incident.position.y, incident.position.z]}
      onClick={(e) => { e.stopPropagation(); if (onClick) onClick(); }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <mesh>
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

  const getShape = () => {
    const s = size;
    switch (marker.type) {
      case 'beds':
        return <boxGeometry args={[s * 1.5, s * 0.3, s * 1.5]} />;
      case 'characters':
        return <sphereGeometry args={[s * 0.8, 16, 16]} />;
      case 'farmbots':
        return <boxGeometry args={[s * 0.8, s * 0.8, s * 0.8]} />;
      case 'plantings':
        return <boxGeometry args={[s, s * 0.8, s]} />;
      case 'layers':
        return <boxGeometry args={[s * 1.2, s * 0.2, s * 1.2]} />;
      default:
        return <boxGeometry args={[s, s, s]} />;
    }
  };

  return (
    <group
      position={[marker.position.x, marker.position.y, marker.position.z]}
      onClick={(e) => { e.stopPropagation(); if (onClick) onClick(); }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <mesh>
        {getShape()}
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isSelected ? 0.4 : 0.05} roughness={0.4} metalness={0.2} />
      </mesh>
      {isSelected && (
        <mesh>
          <ringGeometry args={[size * 1.5, size * 2, 32]} />
          <meshBasicMaterial color="#8b5cf6" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}
      {hovered && (
        <Html position={[0, size + 0.5, 0]} distanceFactor={10}>
          <div className="bg-black/80 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap pointer-events-none">
            {marker.name} ({marker.type})
          </div>
        </Html>
      )}
    </group>
  );
}

// Interactive Ground
function InteractiveGround({ size, centerX, centerZ, onRightClick }: any) {
  return (
    <Plane
      args={[size, size]}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[centerX, -0.1, centerZ]}
      receiveShadow
      onContextMenu={(e) => {
        e.stopPropagation();
        const point = e.point;
        if (point && onRightClick) {
          onRightClick(point.x, point.z);
        }
      }}
    >
      <meshStandardMaterial color="#2d5a27" roughness={0.9} metalness={0} />
    </Plane>
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

  useEffect(() => {
    setHasData(incidents.length > 0 || markers.length > 0);
  }, [incidents, markers]);

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
          const layerTypes = data.data.map((layer: any) => layer.layerType || layer.name);
          setAvailableLayers(layerTypes);
          setActiveLayers(new Set(layerTypes));
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

  // ✅ Filter markers by active layers
  const visibleMarkers = markers.filter((marker) => {
    if (activeLayers.size === 0) return false;
    return activeLayers.has(marker.type);
  });

  const allPositions = [
    ...incidents.map((i: any) => ({ x: i.position.x, z: i.position.z })),
    ...visibleMarkers.map((m: any) => ({ x: m.position.x, z: m.position.z }))
  ];
  const bounds = calculateBounds(allPositions);
  const { centerX, centerZ } = bounds;
  const maxDimension = Math.max(bounds.width, bounds.height);
  const cameraDistance = Math.max(maxDimension * 1.5, 20);
  const groundSize = Math.max(maxDimension + 10, 30);

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
      x: marker.position.x,
      y: marker.position.y || 0,
      z: marker.position.z
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

  const handleGroundRightClick = (x: number, z: number) => {
    setSelectedDetails(null);
    zoomToPosition(x, z);
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

      {/* Rich Details Box */}
      {selectedDetails && (
        <div className="absolute top-3 left-3 z-10 bg-black/80 backdrop-blur-sm text-white p-3 rounded-lg border border-white/10 max-w-[240px] shadow-xl">
          <div className="flex items-start justify-between gap-2">
            <div className="text-sm font-medium text-white truncate">{selectedDetails.name}</div>
            <button onClick={clearDetails} className="text-white/40 hover:text-white/80 transition-colors flex-shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/80 capitalize">
              {selectedDetails.type}
            </span>
            {selectedDetails.metadata?.status && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                selectedDetails.metadata.status === 'active' ? 'bg-green-500/20 text-green-400' :
                selectedDetails.metadata.status === 'inactive' ? 'bg-red-500/20 text-red-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                {selectedDetails.metadata.status}
              </span>
            )}
          </div>
          
          {selectedDetails.position && (
            <div className="text-[10px] text-white/40 mt-1.5 font-mono">
              📍 {selectedDetails.position.x.toFixed(2)}, {selectedDetails.position.z.toFixed(2)}
            </div>
          )}
          
          <div className="mt-2 space-y-1 text-[11px] text-white/70">
            {selectedDetails.type === 'plantings' && (
              <>
                {selectedDetails.metadata?.plantName && (
                  <div className="flex items-center gap-1.5">
                    <span>🌱</span>
                    <span>Plant: {selectedDetails.metadata.plantName}</span>
                  </div>
                )}
                {selectedDetails.metadata?.growthStage && (
                  <div className="flex items-center gap-1.5">
                    <span>📈</span>
                    <span>Growth: {selectedDetails.metadata.growthStage}</span>
                  </div>
                )}
                {selectedDetails.metadata?.health && (
                  <div className="flex items-center gap-1.5">
                    <span>❤️</span>
                    <span>Health: {selectedDetails.metadata.health}</span>
                  </div>
                )}
                {selectedDetails.metadata?.quantity && (
                  <div className="flex items-center gap-1.5">
                    <span>🔢</span>
                    <span>Quantity: {selectedDetails.metadata.quantity}</span>
                  </div>
                )}
                {selectedDetails.metadata?.plantedDate && (
                  <div className="flex items-center gap-1.5">
                    <span>📅</span>
                    <span>Planted: {new Date(selectedDetails.metadata.plantedDate).toLocaleDateString()}</span>
                  </div>
                )}
              </>
            )}
            
            {selectedDetails.type === 'beds' && (
              <>
                {selectedDetails.metadata?.dimensions && (
                  <div className="flex items-center gap-1.5">
                    <span>📐</span>
                    <span>Size: {selectedDetails.metadata.dimensions}</span>
                  </div>
                )}
                {selectedDetails.metadata?.soilType && (
                  <div className="flex items-center gap-1.5">
                    <span>🟫</span>
                    <span>Soil: {selectedDetails.metadata.soilType}</span>
                  </div>
                )}
                {selectedDetails.metadata?.sunExposure && (
                  <div className="flex items-center gap-1.5">
                    <span>☀️</span>
                    <span>Sun: {selectedDetails.metadata.sunExposure}</span>
                  </div>
                )}
                {selectedDetails.metadata?.color && (
                  <div className="flex items-center gap-1.5">
                    <span>🎨</span>
                    <span>Color: <span className="inline-block w-3 h-3 rounded-full align-middle" style={{ backgroundColor: selectedDetails.metadata.color }} /></span>
                  </div>
                )}
              </>
            )}
            
            {selectedDetails.type === 'farmbots' && (
              <>
                {selectedDetails.metadata?.status && (
                  <div className="flex items-center gap-1.5">
                    <span>⚡</span>
                    <span>Status: {selectedDetails.metadata.status}</span>
                  </div>
                )}
                {selectedDetails.metadata?.batteryLevel !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <span>🔋</span>
                    <span>Battery: {selectedDetails.metadata.batteryLevel}%</span>
                    <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          selectedDetails.metadata.batteryLevel > 50 ? 'bg-green-500' :
                          selectedDetails.metadata.batteryLevel > 20 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${selectedDetails.metadata.batteryLevel}%` }}
                      />
                    </div>
                  </div>
                )}
                {selectedDetails.metadata?.firmwareVersion && (
                  <div className="flex items-center gap-1.5">
                    <span>📦</span>
                    <span>Firmware: v{selectedDetails.metadata.firmwareVersion}</span>
                  </div>
                )}
                {selectedDetails.metadata?.lastSeen && (
                  <div className="flex items-center gap-1.5">
                    <span>🕐</span>
                    <span>Last seen: {new Date(selectedDetails.metadata.lastSeen).toLocaleString()}</span>
                  </div>
                )}
              </>
            )}
            
            {selectedDetails.type === 'characters' && (
              <>
                {selectedDetails.metadata?.characterType && (
                  <div className="flex items-center gap-1.5">
                    <span>🧚</span>
                    <span>Type: {selectedDetails.metadata.characterType}</span>
                  </div>
                )}
                {selectedDetails.metadata?.emote && (
                  <div className="flex items-center gap-1.5">
                    <span>😊</span>
                    <span>Emote: {selectedDetails.metadata.emote}</span>
                  </div>
                )}
                {selectedDetails.metadata?.movementType && (
                  <div className="flex items-center gap-1.5">
                    <span>🚶</span>
                    <span>Movement: {selectedDetails.metadata.movementType}</span>
                  </div>
                )}
                {selectedDetails.metadata?.interactable !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <span>🤝</span>
                    <span>Interactable: {selectedDetails.metadata.interactable ? 'Yes' : 'No'}</span>
                  </div>
                )}
              </>
            )}
            
            {selectedDetails.type === 'incident' && (
              <>
                {selectedDetails.metadata?.severity && (
                  <div className="flex items-center gap-1.5">
                    <span>⚠️</span>
                    <span>Severity: {selectedDetails.metadata.severity}</span>
                  </div>
                )}
                {selectedDetails.metadata?.source && (
                  <div className="flex items-center gap-1.5">
                    <span>📡</span>
                    <span>Source: {selectedDetails.metadata.source}</span>
                  </div>
                )}
                {selectedDetails.metadata?.location && (
                  <div className="flex items-center gap-1.5">
                    <span>📍</span>
                    <span>Location: {selectedDetails.metadata.location}</span>
                  </div>
                )}
              </>
            )}
            
            {!['plantings', 'beds', 'farmbots', 'characters', 'incident'].includes(selectedDetails.type) && (
              <div className="text-[10px] text-white/40">
                No additional details available for this type
              </div>
            )}
          </div>
          
          <button
            onClick={() => {
              if (selectedDetails.position) {
                focusOnMarker(selectedDetails);
              }
            }}
            className="mt-2.5 text-[10px] text-white/50 hover:text-white/90 transition-colors flex items-center gap-1 border-t border-white/5 pt-2 w-full"
          >
            <Target className="w-3 h-3" />
            Focus on this marker
          </button>
        </div>
      )}

      {/* Legend */}
      {hasData && showLegend && Object.keys(typeCounts).length > 0 && (
        <div className="absolute bottom-3 left-3 z-10 bg-black/70 backdrop-blur-sm text-white p-2 rounded border border-white/10 min-w-[90px]">
          <div className="text-[10px] font-medium text-white/80 mb-1">Legend</div>
          {Object.entries(typeCounts).map(([type, count]) => (
            <div key={type} className="flex items-center gap-1.5 text-[10px] text-white/70 py-0.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getMarkerColor(type) }} />
              <span className="capitalize">{type}: {count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tooltip */}
      <div className="absolute bottom-3 right-3 z-10 text-[10px] text-white/40 bg-black/40 px-2 py-1 rounded">
        Left-click: Select • Right-click: Zoom
      </div>

      <Canvas
        camera={{
          position: [centerX + cameraDistance * 0.7, cameraDistance * 0.5, centerZ + cameraDistance * 0.7],
          fov: 45,
        }}
        gl={{ antialias: true, alpha: false }}
        shadows={{ type: THREE.PCFShadowMap }}
      >
        <color attach="background" args={['#87CEEB']} />

        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 15, 5]} intensity={1.2} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
        <directionalLight position={[-5, 5, -5]} intensity={0.3} />

        <Environment preset="city" />

        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.08}
          minDistance={2}
          maxDistance={200}
          maxPolarAngle={Math.PI / 2}
          autoRotate={autoRotate}
          autoRotateSpeed={0.8}
          target={[centerX, 0, centerZ]}
        />

        <InteractiveGround size={groundSize} centerX={centerX} centerZ={centerZ} onRightClick={handleGroundRightClick} />

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
          <mesh position={[focusTarget.x, focusTarget.y + 0.5, focusTarget.z]}>
            <ringGeometry args={[0.8, 1.2, 32]} />
            <meshBasicMaterial color="#FFD700" transparent opacity={0.4} side={THREE.DoubleSide} />
          </mesh>
        )}

        {incidents.map((incident) => (
          <IncidentMarker3D
            key={`incident_${incident.source}_${incident.id}`}
            incident={incident}
            onClick={() => handleIncidentClick(incident)}
            isSelected={selectedIncident?.id === incident.id}
          />
        ))}

        {visibleMarkers.map((marker) => (
          <ThreeDMarkerComponent
            key={`marker_${marker.type}_${marker.id}`}
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