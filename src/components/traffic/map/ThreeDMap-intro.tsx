// components/traffic/map/ThreeDMap.tsx
'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
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
import { RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Types
export interface TrafficIncident3D {
  id: string;
  type: 'chp' | 'caltrans' | '511' | 'calfire';
  title: string;
  description: string;
  location: string;
  lat: number;
  lng: number;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  source: string;
}

interface ThreeDMapProps {
  incidents: TrafficIncident3D[];
  onRefresh?: () => void;
  height?: string;
}

// Color mapping for incidents
const INCIDENT_COLORS = {
  chp: '#ef4444',
  caltrans: '#3b82f6',
  '511': '#10b981',
  calfire: '#f97316',
};

const INCIDENT_ICONS = {
  chp: '🚨',
  caltrans: '🚧',
  '511': '📻',
  calfire: '🔥',
};

// Convert lat/lng to 3D coordinates (simplified projection)
function latLngToPosition(lat: number, lng: number): [number, number, number] {
  // Simple cylindrical projection for California
  const x = (lng + 124) * 2.2; // Adjust for California
  const z = (37.8 - lat) * 2.2; // Adjust for California
  return [x, 0, z];
}

// 3D Marker Component
function IncidentMarker({ incident, isSelected, onClick }: { 
  incident: TrafficIncident3D; 
  isSelected: boolean;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const position = latLngToPosition(incident.lat, incident.lng);
  const color = INCIDENT_COLORS[incident.type];
  const severityScale = incident.severity === 'critical' ? 1.5 : 
                        incident.severity === 'high' ? 1.3 : 1;

  // Hover animation
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const time = clock.getElapsedTime();
      const floatY = Math.sin(time * 2 + incident.id.length) * 0.2;
      const scale = hovered || isSelected ? 1.4 : 1;
      meshRef.current.position.y = 0.5 + floatY;
      meshRef.current.scale.set(scale * severityScale, scale * severityScale, scale * severityScale);
    }
  });

  return (
    <group position={position}>
      {/* Glow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 0.8, 32]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={hovered || isSelected ? 0.8 : 0.3}
        />
      </mesh>
      
      {/* Main marker sphere */}
      <Sphere 
        ref={meshRef}
        args={[0.5, 16, 16]}
        position={[0, 0.5, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={onClick}
      >
        <meshStandardMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={hovered || isSelected ? 0.5 : 0.2}
          roughness={0.3}
          metalness={0.1}
        />
      </Sphere>

      {/* Icon on marker */}
      <Billboard position={[0, 0.5, 0]}>
        <Text
          fontSize={0.6}
          color="white"
          anchorX="center"
          anchorY="middle"
          position={[0, 0.5, 0]}
        >
          {INCIDENT_ICONS[incident.type]}
        </Text>
      </Billboard>

      {/* Tooltip on hover */}
      {hovered && (
        <Html position={[0, 1.8, 0]} center>
          <div className="bg-white dark:bg-gray-900 p-3 rounded-lg shadow-xl border dark:border-gray-700 max-w-xs pointer-events-none">
            <div className="flex items-start justify-between">
              <p className="font-bold text-sm">{incident.title}</p>
              <Badge variant="outline" className="text-xs ml-2">
                {incident.source}
              </Badge>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
              {incident.description}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              📍 {incident.location}
            </p>
            <p className="text-xs text-gray-500">
              🕐 {formatDistanceToNow(new Date(incident.timestamp), { addSuffix: true })}
            </p>
          </div>
        </Html>
      )}

      {/* Selection indicator */}
      {isSelected && (
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
          <Box args={[1.2, 0.05, 1.2]} position={[0, -0.2, 0]}>
            <meshBasicMaterial color={color} transparent opacity={0.3} />
          </Box>
        </Float>
      )}
    </group>
  );
}

// Legend Component
function MapLegend3D() {
  const legendItems = [
    { label: 'CHP Incidents', color: '#ef4444', icon: '🚨' },
    { label: 'Caltrans Closures', color: '#3b82f6', icon: '🚧' },
    { label: '511 Events', color: '#10b981', icon: '📻' },
    { label: 'CalFire Incidents', color: '#f97316', icon: '🔥' },
  ];

  return (
    <Html position={[-2.5, 0, -2.5]}>
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border dark:border-gray-700">
        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Legend</h4>
        <div className="space-y-1.5">
          {legendItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-xs">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-600 dark:text-gray-400">{item.icon} {item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </Html>
  );
}

// Main Map Component
export function ThreeDMap({ incidents, onRefresh, height = '600px' }: ThreeDMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const controlsRef = useRef<any>(null);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-rotate by default
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = true;
      controlsRef.current.autoRotateSpeed = 0.5;
    }
  }, []);

  return (
    <div className="relative">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-lg"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
        
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-3 py-1.5 rounded-md shadow-lg text-xs font-medium">
          {incidents.length} Incidents
        </div>
      </div>

      {/* 3D Canvas */}
      <div style={{ height, width: '100%' }} className="rounded-lg overflow-hidden border">
        <Canvas
          camera={{ position: [0, 8, 8], fov: 45 }}
          gl={{ antialias: true }}
          shadows
        >
          {/* Lighting */}
          <ambientLight intensity={0.6} />
          <directionalLight 
            position={[10, 10, 5]} 
            intensity={1} 
            castShadow 
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <directionalLight position={[-10, 5, -5]} intensity={0.5} />
          
          {/* Environment */}
          <Environment preset="city" />
          
          {/* Controls */}
          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.05}
            minDistance={3}
            maxDistance={20}
            maxPolarAngle={Math.PI / 2.2}
            target={[0, 0, 0]}
          />

          {/* Ground plane (simplified California outline) */}
          <Plane 
            args={[8, 8]} 
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[0, -0.1, 0]}
          >
            <meshStandardMaterial 
              color="#e5e7eb" 
              transparent 
              opacity={0.8}
              roughness={0.9}
              metalness={0}
            />
          </Plane>

          {/* Grid (like map tiles) */}
          <gridHelper args={[8, 20, '#9ca3af', '#d1d5db']} position={[0, 0, 0]} />

          {/* State outline (simplified) */}
          <Line
            points={[
              [-3.5, 0, -1.5],
              [-3.8, 0, 0],
              [-3.5, 0, 1.5],
              [-2.5, 0, 2.5],
              [2.5, 0, 2.5],
              [3.5, 0, 1.5],
              [3.8, 0, 0],
              [3.5, 0, -1.5],
              [2.5, 0, -2.5],
              [-2.5, 0, -2.5],
              [-3.5, 0, -1.5],
            ]}
            color="#6b7280"
            lineWidth={2}
          />

          {/* Incident markers */}
          {incidents.map((incident) => (
            <IncidentMarker
              key={incident.id}
              incident={incident}
              isSelected={selectedId === incident.id}
              onClick={() => setSelectedId(selectedId === incident.id ? null : incident.id)}
            />
          ))}

          {/* Legend */}
          <MapLegend3D />
        </Canvas>
      </div>
    </div>
  );
}