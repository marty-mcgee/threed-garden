// components/map/ThreeDScene.tsx
'use client';

import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, Environment, Html, Plane, Grid, 
  Text, Sphere, Box, Cylinder, Cone, Ring 
} from '@react-three/drei';
import * as THREE from 'three';
import { Settings, ChevronDown, ChevronUp, X } from 'lucide-react';

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
}

// ✅ Marker geometry mapping
const MARKER_GEOMETRIES = {
  planting: { component: Sphere, args: [0.3, 16, 16] },
  bed: { component: Box, args: [0.5, 0.2, 0.5] },
  farmbot: { component: Cylinder, args: [0.2, 0.3, 0.4, 8] },
  character: { component: Cone, args: [0.3, 0.5, 8] },
  default: { component: Sphere, args: [0.25, 8, 8] },
};

// ✅ Marker colors by type
const MARKER_COLORS = {
  planting: '#4CAF50',
  bed: '#FF9800',
  farmbot: '#9C27B0',
  character: '#E91E63',
  default: '#9E9E9E',
};

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

// ✅ Incident Marker with hover popup
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

// ✅ ThreeD Marker with hover popup
function ThreeDMarkerComponent({ marker, onClick, isSelected }: any) {
  const [hovered, setHovered] = useState(false);
  const color = marker.color || getMarkerColor(marker.type);
  const size = isSelected ? 1.0 : 0.6;

  const getShape = () => {
    const s = size;
    switch (marker.type) {
      case 'plants':
      case 'planting': return <boxGeometry args={[s, s * 0.8, s]} />;
      case 'bed': return <boxGeometry args={[s * 1.5, s * 0.3, s * 1.5]} />;
      case 'character': return <sphereGeometry args={[s * 0.8, 16, 16]} />;
      case 'farmbot': return <boxGeometry args={[s * 0.8, s * 0.8, s * 0.8]} />;
      case 'marker': return <coneGeometry args={[s * 0.6, s * 1.2, 8]} />;
      case 'layer': return <boxGeometry args={[s * 1.2, s * 0.2, s * 1.2]} />;
      default: return <boxGeometry args={[s, s, s]} />;
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

// Interactive Ground - Right-click to jump
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
}: ThreeDSceneProps) {
  const controlsRef = useRef<any>(null);
  const [hasData, setHasData] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [showControls, setShowControls] = useState(false);
  
  // ✅ Internal selected details state
  const [selectedDetails, setSelectedDetails] = useState<any>(null);

  useEffect(() => {
    setHasData(incidents.length > 0 || markers.length > 0);
  }, [incidents, markers]);

  const allPositions = [
    ...incidents.map((i: any) => ({ x: i.position.x, z: i.position.z })),
    ...markers.map((m: any) => ({ x: m.position.x, z: m.position.z }))
  ];
  const bounds = calculateBounds(allPositions);
  const { centerX, centerZ } = bounds;
  const maxDimension = Math.max(bounds.width, bounds.height);
  const cameraDistance = Math.max(maxDimension * 1.5, 20);
  const groundSize = Math.max(maxDimension + 10, 30);

  const typeCounts = markers.reduce((acc: any, m: any) => {
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

  // ✅ Handle marker click - show details internally
  const handleMarkerClick = (marker: any) => {
    setSelectedDetails({
      name: marker.name,
      type: marker.type,
      position: marker.position,
      metadata: marker.metadata || {},
    });
    if (onMarkerClick) onMarkerClick(marker);
    zoomToPosition(marker.position.x, marker.position.z);
  };

  // ✅ Handle incident click - show details internally
  const handleIncidentClick = (incident: any) => {
    setSelectedDetails({
      name: incident.title,
      type: 'incident',
      position: incident.position,
      metadata: { severity: incident.severity, source: incident.source, location: incident.location },
    });
    if (onIncidentClick) onIncidentClick(incident);
    zoomToPosition(incident.position.x, incident.position.z);
  };

  const handleGroundRightClick = (x: number, z: number) => {
    setSelectedDetails(null);
    zoomToPosition(x, z);
  };

  const clearDetails = () => {
    setSelectedDetails(null);
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
          <div className="bg-black/70 backdrop-blur-sm rounded border border-white/10 p-1 pb-2.5 w-[140px] space-y-0.5">
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
          </div>
        )}
      </div>

      {/* ✅ SINGLE Details Box - Top-Left (managed internally) */}
      {selectedDetails && (
        <div className="absolute top-3 left-3 z-10 bg-black/70 backdrop-blur-sm text-white p-2 rounded border border-white/10 max-w-[200px]">
          <div className="flex items-start justify-between gap-2">
            <div className="text-xs font-medium text-white/90 truncate">{selectedDetails.name}</div>
            <button onClick={clearDetails} className="text-white/40 hover:text-white/80 transition-colors flex-shrink-0">
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="text-[10px] text-white/60 mt-0.5">Type: {selectedDetails.type}</div>
          {selectedDetails.position && (
            <div className="text-[10px] text-white/50 mt-0.5">
              📍 Position: ({selectedDetails.position.x.toFixed(2)}, {selectedDetails.position.z.toFixed(2)})
            </div>
          )}
          {Object.entries(selectedDetails.metadata || {})
            .filter(([key]) => key !== 'position' && key !== 'gps')
            .slice(0, 3)
            .map(([key, value]) => (
              <div key={key} className="text-[10px] text-white/50 truncate">
                {key}: {String(value)}
              </div>
            ))}
        </div>
      )}

      {/* Legend - Bottom-Left */}
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
        shadows
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

        {incidents.map((incident) => (
          <IncidentMarker3D
            key={`incident_${incident.source}_${incident.id}`}
            incident={incident}
            onClick={() => handleIncidentClick(incident)}
            isSelected={selectedIncident?.id === incident.id}
          />
        ))}

        {markers.map((marker) => (
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