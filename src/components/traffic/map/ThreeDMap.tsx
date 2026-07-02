// components/traffic/map/ThreeDMap.tsx
'use client';

import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  Html, 
  Sphere, 
  Text, 
  Line,
  Plane,
  Box,
  Environment,
  Float,
  Billboard
} from '@react-three/drei';
import * as THREE from 'three';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

// ============================================
// TYPES
// ============================================

export interface TrafficIncident3D {
  id: string;
  source: string;
  type: string;
  location: string;
  description: string;
  latitude: number;
  longitude: number;
  timestamp?: string;
  severity?: string;
}

interface ThreeDMapProps {
  events: TrafficIncident3D[];
  onRefresh?: () => void;
  height?: string;
  center?: [number, number];
}

// ============================================
// CONSTANTS
// ============================================

import { SOURCE_COLORS } from '@/lib/config/settings';
// const SOURCE_COLORS: Record<string, string> = {
//   caltrans: '#3b82f6',
//   bayarea511: '#10b981',
//   'chp-live': '#ef4444',
//   'chp-historical': '#8b5cf6',
//   calfire: '#f97316',
//   default: '#6b7280',
// };
import { SOURCE_ICONS } from '@/lib/config/settings';
// const SOURCE_ICONS: Record<string, string> = {
//   caltrans: '🚧',
//   bayarea511: '📻',
//   'chp-live': '🚨',
//   'chp-historical': '📊',
//   calfire: '🔥',
//   default: '📍',
// };
import { SEVERITY_SCALE } from '@/lib/config/settings';
// const SEVERITY_SCALE: Record<string, number> = {
//   critical: 1.6,
//   Fatal: 1.6,
//   high: 1.3,
//   Injury: 1.3,
//   medium: 1.0,
//   low: 0.8,
//   default: 1.0,
// };

// ============================================
// HELPERS
// ============================================

function latLngToPosition(lat: number, lng: number, centerLat: number = 37.3, centerLng: number = -119.5): [number, number, number] {
  const scale = 2.5;
  return [(lng - centerLng) * scale, 0, (centerLat - lat) * scale];
}

function getSourceColor(source: string): string {
  return SOURCE_COLORS[source] || SOURCE_COLORS.default;
}

function getSourceIcon(source: string): string {
  return SOURCE_ICONS[source] || SOURCE_ICONS.default;
}

function getSeverityScale(severity?: string): number {
  if (!severity) return 1;
  return SEVERITY_SCALE[severity] || SEVERITY_SCALE.default;
}

// ============================================
// 3D MARKER COMPONENT
// ============================================

function IncidentMarker({ 
  incident, 
  isSelected, 
  onClick,
  centerLat,
  centerLng
}: { 
  incident: TrafficIncident3D; 
  isSelected: boolean;
  onClick: () => void;
  centerLat: number;
  centerLng: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  const position = latLngToPosition(incident.latitude, incident.longitude, centerLat, centerLng);
  const color = getSourceColor(incident.source);
  const icon = getSourceIcon(incident.source);
  const scale = getSeverityScale(incident.severity);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const floatY = Math.sin(clock.elapsedTime * 1.5 + incident.id.length * 0.5) * 0.15;
      const hoverScale = hovered || isSelected ? 1.3 : 1;
      meshRef.current.position.y = 0.4 + floatY;
      meshRef.current.scale.set(scale * hoverScale, scale * hoverScale, scale * hoverScale);
    }
  });

  return (
    <group position={position}>
      {/* Glow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.5, 0.7, 32]} />
        <meshBasicMaterial color={color} transparent opacity={hovered || isSelected ? 0.6 : 0.2} />
      </mesh>

      {/* Main sphere */}
      <Sphere 
        ref={meshRef}
        args={[0.4, 16, 16]}
        position={[0, 0.4, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={onClick}
      >
        <meshStandardMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={hovered || isSelected ? 0.6 : 0.2}
          roughness={0.3}
          metalness={0.1}
        />
      </Sphere>

      {/* Icon on marker */}
      <Billboard position={[0, 0.4, 0]}>
        <Text fontSize={0.5} color="white" anchorX="center" anchorY="middle" position={[0, 0.4, 0]} fontWeight="bold">
          {icon}
        </Text>
      </Billboard>

      {/* Tooltip on hover */}
      {hovered && (
        <Html position={[0, 1.6, 0]} center distanceFactor={10}>
          <div className="bg-white dark:bg-gray-900 p-3 rounded-lg shadow-xl border dark:border-gray-700 max-w-xs pointer-events-none">
            <div className="flex items-start justify-between gap-2">
              <p className="font-bold text-sm">{incident.type}</p>
              <Badge variant="outline" className="text-xs shrink-0">
                {incident.source}
              </Badge>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
              {incident.description || incident.location}
            </p>
            <p className="text-xs text-gray-500 mt-1">📍 {incident.location?.substring(0, 40)}</p>
            {incident.timestamp && (
              <p className="text-xs text-gray-500">🕐 {new Date(incident.timestamp).toLocaleDateString()}</p>
            )}
          </div>
        </Html>
      )}

      {/* Selection indicator */}
      {isSelected && (
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
          <Box args={[1.0, 0.05, 1.0]} position={[0, -0.1, 0]}>
            <meshBasicMaterial color={color} transparent opacity={0.3} />
          </Box>
        </Float>
      )}
    </group>
  );
}

// ============================================
// LEGEND COMPONENT
// ============================================

function MapLegend() {
  const items = [
    { label: 'Caltrans', color: SOURCE_COLORS.caltrans, icon: SOURCE_ICONS.caltrans },
    { label: '511.org', color: SOURCE_COLORS.bayarea511, icon: SOURCE_ICONS.bayarea511 },
    { label: 'CHP Live', color: SOURCE_COLORS['chp-live'], icon: SOURCE_ICONS['chp-live'] },
    { label: 'CalFire', color: SOURCE_COLORS.calfire, icon: SOURCE_ICONS.calfire },
    { label: 'Historical', color: SOURCE_COLORS['chp-historical'], icon: SOURCE_ICONS['chp-historical'] },
  ];

  return (
    <Html position={[-3.5, 0, -3]} distanceFactor={10}>
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border dark:border-gray-700 min-w-[140px]">
        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Legend</h4>
        <div className="space-y-1.5">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-gray-600 dark:text-gray-400">{item.icon} {item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </Html>
  );
}

// ============================================
// CONTROLS COMPONENT
// ============================================

function MapControls({ onZoomIn, onZoomOut, onResetView }: { 
  onZoomIn: () => void; 
  onZoomOut: () => void; 
  onResetView: () => void;
}) {
  return (
    <Html position={[3.5, 1.5, 0]} distanceFactor={10}>
      <div className="flex flex-col gap-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm p-1 rounded-lg shadow-lg border dark:border-gray-700">
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onZoomIn}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onZoomOut}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onResetView}>
          <RotateCw className="w-4 h-4" />
        </Button>
      </div>
    </Html>
  );
}

// ============================================
// CALIFORNIA OUTLINE
// ============================================

function CaliforniaOutline() {
  const points: [number, number, number][] = [
    [-3.8, 0, -1.8], [-4.2, 0, 0], [-3.8, 0, 1.8],
    [-2.8, 0, 2.8], [-1.5, 0, 3.2], [1.5, 0, 3.2],
    [2.8, 0, 2.8], [3.8, 0, 1.8], [4.2, 0, 0],
    [3.8, 0, -1.8], [2.8, 0, -2.8], [1.5, 0, -3.2],
    [-1.5, 0, -3.2], [-2.8, 0, -2.8], [-3.8, 0, -1.8],
  ];
  return <Line points={points} color="#6b7280" lineWidth={1.5} />;
}

// ============================================
// CITY MARKERS
// ============================================

function CityMarkers({ centerLat, centerLng }: { centerLat: number; centerLng: number }) {
  const cities = [
    { name: 'SF', lat: 37.7749, lng: -122.4194 },
    { name: 'LA', lat: 34.0522, lng: -118.2437 },
    { name: 'SD', lat: 32.7157, lng: -117.1611 },
    { name: 'SJ', lat: 37.3382, lng: -121.8863 },
    { name: 'Sac', lat: 38.5816, lng: -121.4944 },
  ];

  return (
    <>
      {cities.map((city) => {
        const pos = latLngToPosition(city.lat, city.lng, centerLat, centerLng);
        return (
          <Billboard key={city.name} position={[pos[0], 0.05, pos[2]]}>
            <Text fontSize={0.25} color="#6b7280" anchorX="center" anchorY="bottom" opacity={0.5}>
              • {city.name}
            </Text>
          </Billboard>
        );
      })}
    </>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ThreeDMap({ 
  events, 
  onRefresh, 
  height = '600px',
  center = [37.3, -119.5]
}: ThreeDMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const controlsRef = useRef<any>(null);
  const centerLat = center[0];
  const centerLng = center[1];

  const visibleEvents = events.filter(e => 
    e.latitude && e.longitude && !isNaN(e.latitude) && !isNaN(e.longitude)
  );

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try { await onRefresh(); } 
    finally { setIsRefreshing(false); }
  };

  const handleZoomIn = () => {
    if (controlsRef.current) {
      controlsRef.current.object.position.multiplyScalar(0.9);
      controlsRef.current.update();
    }
  };

  const handleZoomOut = () => {
    if (controlsRef.current) {
      controlsRef.current.object.position.multiplyScalar(1.1);
      controlsRef.current.update();
    }
  };

  const handleResetView = () => {
    if (controlsRef.current) {
      controlsRef.current.object.position.set(0, 6, 8);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  // Toggle auto-rotate with Space key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
        setAutoRotate(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm" className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-lg">
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-3 py-1.5 rounded-md shadow-lg text-xs font-medium">
          {visibleEvents.length} Visible
        </div>
        <Button onClick={() => setAutoRotate(!autoRotate)} variant="outline" size="sm" className={`bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-lg ${autoRotate ? 'border-blue-500' : ''}`}>
          <RotateCw className={`w-4 h-4 mr-2 ${autoRotate ? 'animate-spin-slow' : ''}`} />
          {autoRotate ? 'Auto' : 'Manual'}
        </Button>
      </div>

      {/* Map Canvas */}
      <div style={{ height, width: '100%' }} className="rounded-lg overflow-hidden border bg-gradient-to-b from-sky-50 to-sky-100 dark:from-slate-900 dark:to-slate-800">
        <Canvas camera={{ position: [0, 6, 8], fov: 45 }} gl={{ antialias: true, alpha: false }} shadows>
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 15, 5]} intensity={1.2} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
          <directionalLight position={[-5, 5, -5]} intensity={0.3} />
          
          <Environment preset="city" />
          
          {/* Controls */}
          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.05}
            minDistance={3}
            maxDistance={20}
            maxPolarAngle={Math.PI / 2.1}
            target={[0, 0, 0]}
            autoRotate={autoRotate}
            autoRotateSpeed={0.8}
          />

          {/* Ground */}
          <Plane args={[10, 10]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
            <meshStandardMaterial color="#e5e7eb" transparent opacity={0.7} roughness={0.9} metalness={0} />
          </Plane>

          <gridHelper args={[10, 20, '#9ca3af', '#d1d5db']} position={[0, -0.05, 0]} />
          
          <CaliforniaOutline />
          <CityMarkers centerLat={centerLat} centerLng={centerLng} />

          {/* Markers */}
          {visibleEvents.map((event) => (
            <IncidentMarker
              key={event.id}
              incident={event}
              isSelected={selectedId === event.id}
              onClick={() => setSelectedId(selectedId === event.id ? null : event.id)}
              centerLat={centerLat}
              centerLng={centerLng}
            />
          ))}

          <MapLegend />
          <MapControls onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onResetView={handleResetView} />
        </Canvas>
      </div>

      {/* Footer */}
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>
          {visibleEvents.length} events on map • 
          Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Space</kbd> to toggle auto-rotation
        </span>
        <span>Drag to rotate • Scroll to zoom</span>
      </div>
    </div>
  );
}