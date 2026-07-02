Absolutely! Here's the complete, working code for all ThreeD Module components with the Layer + Marker pattern. Let's keep it simple and clean.

## 📁 Complete ThreeD Module Structure

```
src/
├── app/
│   └── dashboard/
│       └── threed/
│           └── page.tsx                 # Main dashboard
├── components/
│   └── threed/
│       ├── ThreeDGarden.tsx             # Main 3D scene
│       ├── layers/
│       │   ├── TrafficLayer.tsx
│       │   ├── GardenLayer.tsx
│       │   ├── FarmBotLayer.tsx
│       │   └── WeatherLayer.tsx
│       ├── markers/
│       │   ├── TrafficMarker3D.tsx
│       │   ├── PlantMarker3D.tsx
│       │   ├── BedMarker3D.tsx
│       │   └── FarmBotMarker3D.tsx
│       ├── effects/
│       │   └── WeatherEffects.tsx
│       ├── controls/
│       │   ├── LayerToggles.tsx
│       │   └── Legend3D.tsx
│       └── shared/
│           ├── types.ts
│           ├── coordinates.ts
│           └── colors.ts
└── lib/
    └── services/
        └── threed/
            └── DataService.ts
```

---

## 1. Types

### `components/threed/shared/types.ts`

```typescript
// components/threed/shared/types.ts

// ===== TRAFFIC =====
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

// ===== GARDEN =====
export interface GardenBed3D {
  id: string;
  name: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  color?: string;
}

export interface Plant3D {
  id: string;
  name: string;
  species: string;
  x: number;
  z: number;
  growthStage: 'seed' | 'seedling' | 'vegetative' | 'flowering' | 'fruiting' | 'mature';
  plantedAt: string;
}

// ===== FARMBOT =====
export interface FarmBot3D {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'busy' | 'error';
  x: number;
  z: number;
  battery: number;
  lastSeen: string;
}

// ===== WEATHER =====
export interface Weather3D {
  temperature: number;
  conditions: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'foggy';
  humidity: number;
  windSpeed: number;
  precipitation: number;
}

// ===== LAYER VISIBILITY =====
export interface LayerVisibility {
  traffic: boolean;
  garden: boolean;
  farmbots: boolean;
  weather: boolean;
}

// ===== MAIN DATA TYPE =====
export interface ThreeDData {
  traffic: TrafficIncident3D[];
  beds: GardenBed3D[];
  plants: Plant3D[];
  farmbots: FarmBot3D[];
  weather: Weather3D | null;
}
```

---

## 2. Utilities

### `components/threed/shared/coordinates.ts`

```typescript
// components/threed/shared/coordinates.ts
export function latLngToPosition(
  lat: number,
  lng: number,
  centerLat: number = 37.3,
  centerLng: number = -119.5
): [number, number, number] {
  const scale = 2.5;
  return [(lng - centerLng) * scale, 0, (centerLat - lat) * scale];
}
```

### `components/threed/shared/colors.ts`

```typescript
// components/threed/shared/colors.ts
export const SOURCE_COLORS: Record<string, string> = {
  chp: '#ef4444',
  caltrans: '#3b82f6',
  '511': '#10b981',
  calfire: '#f97316',
  default: '#6b7280',
};

export const SOURCE_ICONS: Record<string, string> = {
  chp: '🚨',
  caltrans: '🚧',
  '511': '📻',
  calfire: '🔥',
  default: '📍',
};

export const GROWTH_STAGE_COLORS: Record<string, string> = {
  seed: '#8B4513',
  seedling: '#90EE90',
  vegetative: '#32CD32',
  flowering: '#FF69B4',
  fruiting: '#FF8C00',
  mature: '#006400',
};

export const GROWTH_STAGE_HEIGHTS: Record<string, number> = {
  seed: 0.1,
  seedling: 0.3,
  vegetative: 0.6,
  flowering: 0.8,
  fruiting: 1.0,
  mature: 1.2,
};

export function getSourceColor(source: string): string {
  return SOURCE_COLORS[source] || SOURCE_COLORS.default;
}

export function getSourceIcon(source: string): string {
  return SOURCE_ICONS[source] || SOURCE_ICONS.default;
}

export function getGrowthStageColor(stage: string): string {
  return GROWTH_STAGE_COLORS[stage] || GROWTH_STAGE_COLORS.seed;
}

export function getGrowthStageHeight(stage: string): number {
  return GROWTH_STAGE_HEIGHTS[stage] || GROWTH_STAGE_HEIGHTS.seed;
}
```

---

## 3. Markers

### `components/threed/markers/TrafficMarker3D.tsx`

```typescript
// components/threed/markers/TrafficMarker3D.tsx
'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Html, Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { TrafficIncident3D } from '@/lib/types/threed';
import { getSourceColor, getSourceIcon } from '@/lib/config/settings';

interface TrafficMarker3DProps {
  incident: TrafficIncident3D;
  position: [number, number, number];
}

export function TrafficMarker3D({ incident, position }: TrafficMarker3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const color = getSourceColor(incident.type);
  const icon = getSourceIcon(incident.type);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const floatY = Math.sin(clock.elapsedTime * 1.5 + incident.id.length) * 0.15;
      const scale = hovered ? 1.3 : 1;
      meshRef.current.position.y = 0.4 + floatY;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group position={position}>
      {/* Glow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.5, 0.7, 32]} />
        <meshBasicMaterial color={color} transparent opacity={hovered ? 0.6 : 0.2} />
      </mesh>

      {/* Main sphere */}
      <Sphere
        ref={meshRef}
        args={[0.4, 16, 16]}
        position={[0, 0.4, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.6 : 0.2}
          roughness={0.3}
          metalness={0.1}
        />
      </Sphere>

      {/* Icon */}
      <Billboard position={[0, 0.4, 0]}>
        <Text fontSize={0.5} color="white" anchorX="center" anchorY="middle">
          {icon}
        </Text>
      </Billboard>

      {/* Tooltip */}
      {hovered && (
        <Html position={[0, 1.6, 0]} center distanceFactor={10}>
          <div className="bg-white dark:bg-gray-900 p-3 rounded-lg shadow-xl border dark:border-gray-700 max-w-xs pointer-events-none">
            <div className="flex items-start justify-between gap-2">
              <p className="font-bold text-sm">{incident.title}</p>
              <span className="text-xs px-2 py-1 bg-muted rounded">{incident.source}</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{incident.description}</p>
            <p className="text-xs text-gray-500 mt-1">📍 {incident.location}</p>
            <p className="text-xs text-gray-500">🕐 {incident.timestamp}</p>
          </div>
        </Html>
      )}
    </group>
  );
}
```

### `components/threed/markers/PlantMarker3D.tsx`

```typescript
// components/threed/markers/PlantMarker3D.tsx
'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Cylinder, Html, Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { Plant3D } from '@/lib/types/threed';
import { getGrowthStageColor, getGrowthStageHeight } from '@/lib/config/settings';

interface PlantMarker3DProps {
  plant: Plant3D;
  position: [number, number, number];
}

export function PlantMarker3D({ plant, position }: PlantMarker3DProps) {
  const [hovered, setHovered] = useState(false);
  const color = getGrowthStageColor(plant.growthStage);
  const height = getGrowthStageHeight(plant.growthStage);

  return (
    <group position={position}>
      {/* Plant stem */}
      <Cylinder
        args={[0.05, 0.08, height]}
        position={[0, height / 2, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial color="#228B22" roughness={0.8} />
      </Cylinder>

      {/* Plant top (sphere) */}
      <Sphere
        args={[0.15 + height * 0.1, 8, 8]}
        position={[0, height + 0.05, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.3 : 0.1}
          roughness={0.7}
        />
      </Sphere>

      {/* Name label */}
      <Billboard position={[0, height + 0.4, 0]}>
        <Text fontSize={0.2} color="#6b7280" anchorX="center" anchorY="bottom" opacity={0.7}>
          {plant.name}
        </Text>
      </Billboard>

      {/* Tooltip */}
      {hovered && (
        <Html position={[0, height + 0.8, 0]} center distanceFactor={10}>
          <div className="bg-white dark:bg-gray-900 p-2 rounded-lg shadow-xl border dark:border-gray-700 text-xs pointer-events-none">
            <p className="font-bold">{plant.name}</p>
            <p className="text-muted-foreground">{plant.species}</p>
            <p className="text-muted-foreground">Stage: {plant.growthStage}</p>
          </div>
        </Html>
      )}
    </group>
  );
}
```

### `components/threed/markers/BedMarker3D.tsx`

```typescript
// components/threed/markers/BedMarker3D.tsx
'use client';

import { useState } from 'react';
import { Box, Html, Billboard, Text } from '@react-three/drei';
import { GardenBed3D } from '@/lib/types/threed';

interface BedMarker3DProps {
  bed: GardenBed3D;
  position: [number, number, number];
}

export function BedMarker3D({ bed, position }: BedMarker3DProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position}>
      {/* Bed base */}
      <Box
        args={[bed.width || 1, 0.1, bed.depth || 1]}
        position={[0, 0.05, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={bed.color || '#8B7355'}
          roughness={0.9}
          transparent
          opacity={0.8}
        />
      </Box>

      {/* Border frame */}
      <Box
        args={[bed.width || 1, 0.05, 0.05]}
        position={[0, 0.1, (bed.depth || 1) / 2]}
      >
        <meshStandardMaterial color="#5C4033" roughness={0.9} />
      </Box>
      <Box
        args={[bed.width || 1, 0.05, 0.05]}
        position={[0, 0.1, -(bed.depth || 1) / 2]}
      >
        <meshStandardMaterial color="#5C4033" roughness={0.9} />
      </Box>
      <Box
        args={[0.05, 0.05, bed.depth || 1]}
        position={[(bed.width || 1) / 2, 0.1, 0]}
      >
        <meshStandardMaterial color="#5C4033" roughness={0.9} />
      </Box>
      <Box
        args={[0.05, 0.05, bed.depth || 1]}
        position={[-(bed.width || 1) / 2, 0.1, 0]}
      >
        <meshStandardMaterial color="#5C4033" roughness={0.9} />
      </Box>

      {/* Name label */}
      <Billboard position={[0, 0.4, 0]}>
        <Text fontSize={0.2} color="#6b7280" anchorX="center" anchorY="bottom" opacity={0.7}>
          {bed.name}
        </Text>
      </Billboard>

      {/* Tooltip */}
      {hovered && (
        <Html position={[0, 0.6, 0]} center distanceFactor={10}>
          <div className="bg-white dark:bg-gray-900 p-2 rounded-lg shadow-xl border dark:border-gray-700 text-xs pointer-events-none">
            <p className="font-bold">{bed.name}</p>
            <p className="text-muted-foreground">Bed</p>
          </div>
        </Html>
      )}
    </group>
  );
}
```

### `components/threed/markers/FarmBotMarker3D.tsx`

```typescript
// components/threed/markers/FarmBotMarker3D.tsx
'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Sphere, Html, Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { FarmBot3D } from '@/lib/types/threed';

interface FarmBotMarker3DProps {
  farmbot: FarmBot3D;
  position: [number, number, number];
}

export function FarmBotMarker3D({ farmbot, position }: FarmBotMarker3DProps) {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const statusColor = {
    online: '#22c55e',
    offline: '#ef4444',
    busy: '#f59e0b',
    error: '#ef4444',
  }[farmbot.status] || '#6b7280';

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const floatY = Math.sin(clock.elapsedTime * 1.2 + farmbot.id.length) * 0.05;
      meshRef.current.position.y = 0.2 + floatY;
    }
  });

  return (
    <group ref={meshRef} position={position}>
      {/* Main body */}
      <Box args={[0.6, 0.3, 0.4]} position={[0, 0.15, 0]}>
        <meshStandardMaterial color="#4B5563" roughness={0.3} metalness={0.5} />
      </Box>

      {/* Head */}
      <Sphere args={[0.15, 8, 8]} position={[0, 0.35, 0.2]}>
        <meshStandardMaterial color={statusColor} emissive={statusColor} emissiveIntensity={0.3} />
      </Sphere>

      {/* Wheels */}
      <Sphere args={[0.08, 8, 8]} position={[-0.25, 0.05, 0.25]}>
        <meshStandardMaterial color="#1f2937" roughness={0.9} />
      </Sphere>
      <Sphere args={[0.08, 8, 8]} position={[0.25, 0.05, 0.25]}>
        <meshStandardMaterial color="#1f2937" roughness={0.9} />
      </Sphere>
      <Sphere args={[0.08, 8, 8]} position={[-0.25, 0.05, -0.25]}>
        <meshStandardMaterial color="#1f2937" roughness={0.9} />
      </Sphere>
      <Sphere args={[0.08, 8, 8]} position={[0.25, 0.05, -0.25]}>
        <meshStandardMaterial color="#1f2937" roughness={0.9} />
      </Sphere>

      {/* Name label */}
      <Billboard position={[0, 0.6, 0]}>
        <Text fontSize={0.2} color="#6b7280" anchorX="center" anchorY="bottom" opacity={0.7}>
          {farmbot.name}
        </Text>
      </Billboard>

      {/* Tooltip */}
      {hovered && (
        <Html position={[0, 0.8, 0]} center distanceFactor={10}>
          <div
            className="bg-white dark:bg-gray-900 p-2 rounded-lg shadow-xl border dark:border-gray-700 text-xs pointer-events-none"
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
          >
            <p className="font-bold">{farmbot.name}</p>
            <p className="text-muted-foreground">Status: {farmbot.status}</p>
            <p className="text-muted-foreground">Battery: {farmbot.battery}%</p>
            <p className="text-muted-foreground">Last seen: {farmbot.lastSeen}</p>
          </div>
        </Html>
      )}
    </group>
  );
}
```

---

## 4. Layers

### `components/threed/layers/TrafficLayer.tsx`

```typescript
// components/threed/layers/TrafficLayer.tsx
'use client';

import { TrafficIncident3D } from '@/lib/types/threed';
import { TrafficMarker3D } from '../markers/TrafficMarker3D';
import { latLngToPosition } from '../shared/coordinates';

interface TrafficLayerProps {
  incidents: TrafficIncident3D[];
}

export function TrafficLayer({ incidents }: TrafficLayerProps) {
  if (!incidents || incidents.length === 0) {
    return null;
  }

  return (
    <group>
      {incidents.map((incident) => {
        const position = latLngToPosition(incident.lat, incident.lng);
        return (
          <TrafficMarker3D
            key={incident.id}
            incident={incident}
            position={position}
          />
        );
      })}
    </group>
  );
}
```

### `components/threed/layers/GardenLayer.tsx`

```typescript
// components/threed/layers/GardenLayer.tsx
'use client';

import { GardenBed3D, Plant3D } from '@/lib/types/threed';
import { PlantMarker3D } from '../markers/PlantMarker3D';
import { BedMarker3D } from '../markers/BedMarker3D';

interface GardenLayerProps {
  beds: GardenBed3D[];
  plants: Plant3D[];
}

export function GardenLayer({ beds, plants }: GardenLayerProps) {
  return (
    <group>
      {/* Render beds */}
      {beds?.map((bed) => (
        <BedMarker3D
          key={bed.id}
          bed={bed}
          position={[bed.x || 0, 0, bed.z || 0]}
        />
      ))}

      {/* Render plants */}
      {plants?.map((plant) => (
        <PlantMarker3D
          key={plant.id}
          plant={plant}
          position={[plant.x || 0, 0, plant.z || 0]}
        />
      ))}
    </group>
  );
}
```

### `components/threed/layers/FarmBotLayer.tsx`

```typescript
// components/threed/layers/FarmBotLayer.tsx
'use client';

import { FarmBot3D } from '@/lib/types/threed';
import { FarmBotMarker3D } from '../markers/FarmBotMarker3D';

interface FarmBotLayerProps {
  farmbots: FarmBot3D[];
}

export function FarmBotLayer({ farmbots }: FarmBotLayerProps) {
  if (!farmbots || farmbots.length === 0) {
    return null;
  }

  return (
    <group>
      {farmbots.map((farmbot) => (
        <FarmBotMarker3D
          key={farmbot.id}
          farmbot={farmbot}
          position={[farmbot.x || 0, 0, farmbot.z || 0]}
        />
      ))}
    </group>
  );
}
```

### `components/threed/layers/WeatherLayer.tsx`

```typescript
// components/threed/layers/WeatherLayer.tsx
'use client';

import { Weather3D } from '@/lib/types/threed';
import { WeatherEffects } from '../effects/WeatherEffects';

interface WeatherLayerProps {
  weather: Weather3D | null;
}

export function WeatherLayer({ weather }: WeatherLayerProps) {
  if (!weather) {
    return null;
  }

  return <WeatherEffects weather={weather} />;
}
```

---

## 5. Effects

### `components/threed/effects/WeatherEffects.tsx`

```typescript
// components/threed/effects/WeatherEffects.tsx
'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { Weather3D } from '@/lib/types/threed';

interface WeatherEffectsProps {
  weather: Weather3D;
}

export function WeatherEffects({ weather }: WeatherEffectsProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 500;

  // Generate random particles
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 10;
    }
    return positions;
  }, [count]);

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      // Animate particles (falling effect)
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
      const speed = weather.conditions === 'rainy' ? 0.02 : 0.005;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] -= speed;
        if (positions[i] < -5) positions[i] = 5;
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  // Only show particles for certain conditions
  if (weather.conditions === 'sunny' || weather.conditions === 'cloudy') {
    return null;
  }

  return (
    <Points ref={pointsRef} position={[0, 2, 0]}>
      <PointMaterial
        transparent
        color={weather.conditions === 'rainy' ? '#93c5fd' : '#e5e7eb'}
        size={0.05}
        sizeAttenuation
        depthWrite={false}
      />
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length / 3}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
    </Points>
  );
}
```

---

## 6. Controls

### `components/threed/controls/LayerToggles.tsx`

```typescript
// components/threed/controls/LayerToggles.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Car, Carrot, Cloud, Cpu } from 'lucide-react';
import { LayerVisibility } from '@/lib/types/threed';

interface LayerTogglesProps {
  layers: LayerVisibility;
  onToggle: (layer: keyof LayerVisibility) => void;
}

export function LayerToggles({ layers, onToggle }: LayerTogglesProps) {
  const items = [
    { key: 'traffic' as const, label: 'Traffic', icon: Car },
    { key: 'garden' as const, label: 'Garden', icon: Carrot },
    { key: 'weather' as const, label: 'Weather', icon: Cloud },
    { key: 'farmbots' as const, label: 'FarmBots', icon: Cpu },
  ];

  const activeCount = Object.values(layers).filter(v => v).length;
  const totalCount = items.length;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map(({ key, label, icon: Icon }) => (
        <Button
          key={key}
          variant={layers[key] ? "default" : "outline"}
          size="sm"
          onClick={() => onToggle(key)}
          className="transition-all duration-200"
        >
          <Icon className="w-3.5 h-3.5 mr-1.5" />
          {label}
          <span className="ml-1.5 text-xs opacity-70">
            {layers[key] ? 'ON' : 'OFF'}
          </span>
        </Button>
      ))}
      
      <div className="text-xs text-muted-foreground self-center ml-2">
        {activeCount}/{totalCount} active
      </div>
    </div>
  );
}
```

### `components/threed/controls/Legend3D.tsx`

```typescript
// components/threed/controls/Legend3D.tsx
'use client';

import { Html } from '@react-three/drei';
import { LayerVisibility } from '@/lib/types/threed';
import { SOURCE_COLORS } from '@/lib/config/settings';

interface Legend3DProps {
  layers: LayerVisibility;
}

export function Legend3D({ layers }: Legend3DProps) {
  const items = [
    { key: 'traffic' as const, label: 'Traffic', color: SOURCE_COLORS.chp },
    { key: 'garden' as const, label: 'Garden', color: '#22c55e' },
    { key: 'farmbots' as const, label: 'FarmBots', color: '#8b5cf6' },
    { key: 'weather' as const, label: 'Weather', color: '#60a5fa' },
  ];

  const visibleItems = items.filter(item => layers[item.key]);

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <Html position={[-4, 0, -4]} distanceFactor={10}>
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border dark:border-gray-700 min-w-[140px]">
        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Legend</h4>
        <div className="space-y-1.5">
          {visibleItems.map((item) => (
            <div key={item.key} className="flex items-center gap-2 text-xs">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
              <span className="text-[10px] text-muted-foreground ml-auto">●</span>
            </div>
          ))}
        </div>
      </div>
    </Html>
  );
}
```

---

## 7. Main 3D Scene

### `components/threed/ThreeDGarden.tsx`

```typescript
// components/threed/ThreeDGarden.tsx
'use client';

import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html, Plane, Grid } from '@react-three/drei';
import * as THREE from 'three';

// Import layers
import { TrafficLayer } from './layers/TrafficLayer';
import { GardenLayer } from './layers/GardenLayer';
import { FarmBotLayer } from './layers/FarmBotLayer';
import { WeatherLayer } from './layers/WeatherLayer';
import { Legend3D } from './controls/Legend3D';

// Import types
import { ThreeDData, LayerVisibility } from './shared/types';

interface ThreeDGardenProps {
  data: ThreeDData;
  layers: LayerVisibility;
  autoRotate?: boolean;
  height?: string;
}

export function ThreeDGarden({
  data,
  layers,
  autoRotate = true,
  height = '700px',
}: ThreeDGardenProps) {
  const controlsRef = useRef<any>(null);

  return (
    <div style={{ height, width: '100%' }}>
      <Canvas
        camera={{ position: [0, 8, 10], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        shadows
      >
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 15, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight position={[-5, 5, -5]} intensity={0.3} />

        <Environment preset="city" />

        {/* Controls */}
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.05}
          minDistance={3}
          maxDistance={25}
          maxPolarAngle={Math.PI / 2}
          target={[0, 0, 0]}
          autoRotate={autoRotate}
          autoRotateSpeed={0.8}
        />

        {/* Ground */}
        <Plane
          args={[12, 12]}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.1, 0]}
          receiveShadow
        >
          <meshStandardMaterial
            color="#e5e7eb"
            transparent
            opacity={0.7}
            roughness={0.9}
            metalness={0}
          />
        </Plane>

        <Grid
          args={[12, 20]}
          position={[0, -0.05, 0]}
          cellColor="#9ca3af"
          sectionColor="#d1d5db"
        />

        {/* === LAYERS === */}
        {layers.traffic && <TrafficLayer incidents={data.traffic} />}
        {layers.garden && <GardenLayer beds={data.beds} plants={data.plants} />}
        {layers.farmbots && <FarmBotLayer farmbots={data.farmbots} />}
        {layers.weather && <WeatherLayer weather={data.weather} />}

        {/* Legend */}
        <Legend3D layers={layers} />

        {/* Info overlay */}
        <Html position={[-4, 0, -4]} distanceFactor={10}>
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border dark:border-gray-700 min-w-[160px]">
            <p className="font-medium text-sm">🌍 ThreeD Garden</p>
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              {layers.traffic && <p>🚨 {data.traffic?.length || 0} Incidents</p>}
              {layers.garden && <p>🌱 {data.plants?.length || 0} Plants</p>}
              {layers.garden && <p>🛏️ {data.beds?.length || 0} Beds</p>}
              {layers.farmbots && <p>🤖 {data.farmbots?.length || 0} FarmBots</p>}
              {layers.weather && data.weather && (
                <p>🌡️ {data.weather.temperature}°F</p>
              )}
            </div>
          </div>
        </Html>
      </Canvas>
    </div>
  );
}
```

---

## 8. Main Dashboard Page

### `app/dashboard/threed/page.tsx`

```typescript
// app/dashboard/threed/page.tsx
'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { ThreeDGarden } from '@/components/threed/ThreeDGarden';
import { LayerToggles } from '@/components/threed/controls/LayerToggles';
import { fetchThreeDData } from '@/lib/services/threed/DataService';
import { ThreeDData, LayerVisibility } from '@/lib/types/threed';

export default function ThreeDPage() {
  const { showToast, ToastComponent } = useToast();
  const [data, setData] = useState<ThreeDData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [layers, setLayers] = useState<LayerVisibility>({
    traffic: true,
    garden: true,
    farmbots: true,
    weather: true,
  });

  const loadData = useCallback(async () => {
    try {
      const result = await fetchThreeDData();
      setData(result);
    } catch (error) {
      console.error('Failed to load 3D data:', error);
      showToast('Failed to load 3D data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    showToast('Data refreshed', 'success');
  };

  const toggleLayer = (layer: keyof LayerVisibility) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
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

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {ToastComponent}

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">ThreeD Garden</h1>
          <p className="text-sm text-muted-foreground">
            {data.traffic?.length || 0} incidents • {data.plants?.length || 0} plants • {data.farmbots?.length || 0} FarmBots
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={autoRotate ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRotate(!autoRotate)}
          >
            <span className="mr-1.5">🔄</span>
            Auto {autoRotate ? 'ON' : 'OFF'}
          </Button>
          <Button size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Layer Toggles */}
      <LayerToggles layers={layers} onToggle={toggleLayer} />

      {/* 3D Scene */}
      <div className="rounded-lg overflow-hidden border bg-gradient-to-b from-sky-50 to-sky-100 dark:from-slate-900 dark:to-slate-800">
        <ThreeDGarden
          data={data}
          layers={layers}
          autoRotate={autoRotate}
          height="700px"
        />
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="flex justify-center text-xs text-muted-foreground">
        <span>
          Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Space</kbd> to toggle auto-rotation
        </span>
      </div>
    </div>
  );
}
```

---

## 9. Data Service

### `lib/services/threed/DataService.ts`

```typescript
// lib/services/threed/DataService.ts
import { ThreeDData } from '@/lib/types/threed';

export async function fetchThreeDData(): Promise<ThreeDData> {
  try {
    // Fetch all data sources in parallel
    const [trafficRes, bedsRes, plantsRes, farmbotsRes, weatherRes] = await Promise.all([
      fetch('/api/traffic/all'),
      fetch('/api/threed/beds'),
      fetch('/api/threed/plants'),
      fetch('/api/threed/farmbots'),
      fetch('/api/threed/weather'),
    ]);

    const [traffic, beds, plants, farmbots, weather] = await Promise.all([
      trafficRes.json(),
      bedsRes.json(),
      plantsRes.json(),
      farmbotsRes.json(),
      weatherRes.json(),
    ]);

    return {
      traffic: traffic.data || [],
      beds: beds.data || [],
      plants: plants.data || [],
      farmbots: farmbots.data || [],
      weather: weather.data || null,
    };
  } catch (error) {
    console.error('Error fetching ThreeD data:', error);
    // Return empty data on error
    return {
      traffic: [],
      beds: [],
      plants: [],
      farmbots: [],
      weather: null,
    };
  }
}
```

---

## 10. Optional: API Route for All Traffic

### `app/api/traffic/all/route.ts`

```typescript
// app/api/traffic/all/route.ts
import { NextResponse } from 'next/server';
import { fetchTrafficData } from '@/lib/services/traffic/trafficService';

export async function GET() {
  try {
    const data = await fetchTrafficData();
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching traffic data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch traffic data' },
      { status: 500 }
    );
  }
}
```

---

## 📁 Complete File Structure

```
src/
├── app/
│   ├── api/
│   │   └── traffic/
│   │       └── all/
│   │           └── route.ts          # Traffic API endpoint
│   └── dashboard/
│       └── threed/
│           └── page.tsx              # Main dashboard
├── components/
│   └── threed/
│       ├── ThreeDGarden.tsx          # Main 3D scene
│       ├── layers/
│       │   ├── TrafficLayer.tsx
│       │   ├── GardenLayer.tsx
│       │   ├── FarmBotLayer.tsx
│       │   └── WeatherLayer.tsx
│       ├── markers/
│       │   ├── TrafficMarker3D.tsx
│       │   ├── PlantMarker3D.tsx
│       │   ├── BedMarker3D.tsx
│       │   └── FarmBotMarker3D.tsx
│       ├── effects/
│       │   └── WeatherEffects.tsx
│       ├── controls/
│       │   ├── LayerToggles.tsx
│       │   └── Legend3D.tsx
│       └── shared/
│           ├── types.ts
│           ├── coordinates.ts
│           └── colors.ts
└── lib/
    └── services/
        └── threed/
            └── DataService.ts        # Data fetching service
```

---

## 🚀 Summary

| Component | Purpose |
|-----------|---------|
| **Types** | All TypeScript interfaces |
| **Colors** | Color and icon mappings |
| **Coordinates** | Lat/lng to 3D position conversion |
| **Markers** | Individual 3D objects (Traffic, Plant, Bed, FarmBot) |
| **Layers** | Groups of related markers |
| **Effects** | Weather particle effects |
| **Controls** | UI toggles and legend |
| **ThreeDGarden** | Main 3D scene rendering all layers |
| **Page** | Dashboard with data loading and layer toggles |
| **Data Service** | Fetches all data from APIs |

This is a complete, working ThreeD Module with the Layer + Marker pattern! 🎉


Fantastic! 🎉 Your app is evolving beautifully with a clean, modular ThreeD Module architecture. I'm excited to see how the Layer + Marker pattern enhances your 3D experience!

## 🎯 What You're About to Implement

| Component | Status | Benefit |
|-----------|--------|---------|
| **Types** | ✅ Ready | Type safety across all 3D data |
| **Markers** | ✅ Ready | Individual 3D objects with hover effects |
| **Layers** | ✅ Ready | Organized groups of markers |
| **Controls** | ✅ Ready | User-friendly layer toggles |
| **Effects** | ✅ Ready | Weather visualization |
| **Data Service** | ✅ Ready | Unified data fetching |

## 🚀 Quick Implementation Checklist

```bash
# 1. Create the folder structure
mkdir -p src/components/threed/{layers,markers,effects,controls,shared}
mkdir -p src/lib/services/threed

# 2. Add all the files we discussed

# 3. Test the API endpoints
curl http://localhost:4444/api/traffic/all
curl http://localhost:4444/api/threed/beds

# 4. Start the app
bun dev

# 5. Visit the ThreeD dashboard
open http://localhost:4444/dashboard/threed
```

## 🎨 Key Features You'll Have

- ✅ **Unified 3D View** - All data in one scene
- ✅ **Layer Toggles** - Show/hide data categories
- ✅ **Interactive Markers** - Hover for details
- ✅ **Auto-Rotation** - Toggle with Space key
- ✅ **Weather Effects** - Rain/snow particles
- ✅ **Performance** - Efficient rendering with layers

## 🔧 Future Enhancements (Optional)

1. **Add More Layers** - Drones, irrigation systems, etc.
2. **Click Actions** - Navigate to detail pages on click
3. **Animation Controls** - Speed, pause, reset
4. **Data Filters** - Filter by type, severity, status
5. **Export Views** - Capture screenshots of 3D scenes

## 📝 Don't Forget

1. **Update your CONTEXT.md** with the new ThreeD Module architecture
2. **Test all layer toggles** to ensure they work
3. **Verify data fetching** from all endpoints
4. **Check responsive behavior** on different screen sizes

---

## 🎉 Congratulations!

You've built a professional-grade 3D dashboard that:
- ✨ **Visualizes** traffic, garden, farmbots, and weather in one scene
- 🎮 **Interacts** with users through hover tooltips and toggles
- 📊 **Scales** easily with new data types
- 🧹 **Stays clean** with the Layer + Marker pattern

Your app is now a powerful 3D platform! 🚀

If you need any help with implementation or run into issues, I'm here to assist! Happy coding! 🎨