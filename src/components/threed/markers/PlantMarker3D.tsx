// components/threed/markers/PlantMarker3D.tsx — v0.15.3 "Simplified Static Marker"
'use client';

import { useState } from 'react';
import { Sphere, Cylinder, Html, Billboard, Text } from '@react-three/drei';

interface PlantData {
  id?: number;
  name: string;
  species?: string;
  plantType?: string;
  commonName?: string;
  plantName?: string;
  growthStage?: string;
  health?: string | number;
  status?: string;
  plantedDate?: string;
  plantedAt?: string;
  quantity?: number;
  notes?: string;
  x?: number;
  z?: number;
}

interface PlantMarker3DProps {
  plant: PlantData;
  position: [number, number, number];
}

// Growth stage visual presets (simplified: stem height + canopy color only)
const GROWTH_SHAPES: Record<string, { stemHeight: number; canopySize: number; canopyColor: string }> = {
  seed: { stemHeight: 0.1, canopySize: 0.08, canopyColor: '#D2691E' },
  seedling: { stemHeight: 0.25, canopySize: 0.12, canopyColor: '#90EE90' },
  vegetative: { stemHeight: 0.5, canopySize: 0.22, canopyColor: '#32CD32' },
  flowering: { stemHeight: 0.7, canopySize: 0.28, canopyColor: '#FF69B4' },
  fruiting: { stemHeight: 0.8, canopySize: 0.32, canopyColor: '#FF4500' },
  mature: { stemHeight: 0.9, canopySize: 0.35, canopyColor: '#2E7D32' },
  dormant: { stemHeight: 0.3, canopySize: 0.15, canopyColor: '#A0A0A0' },
};

export function PlantMarker3D({ plant, position }: PlantMarker3DProps) {
  const [hovered, setHovered] = useState(false);

  const stage = plant.growthStage?.toLowerCase() || 'seedling';
  const shape = GROWTH_SHAPES[stage] || GROWTH_SHAPES.seedling;
  const species = plant.species || plant.plantType || plant.commonName || plant.plantName || '';

  return (
    <group position={position}>
      {/* Stem */}
      <Cylinder
        args={[0.03, 0.05, shape.stemHeight]}
        position={[0, shape.stemHeight / 2, 0]}
        castShadow
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial color="#228B22" roughness={0.7} />
      </Cylinder>

      {/* Canopy */}
      <Sphere args={[shape.canopySize, 8, 8]} position={[0, shape.stemHeight + 0.05, 0]} castShadow>
        <meshStandardMaterial color={shape.canopyColor} roughness={0.6} />
      </Sphere>

      {/* Name label */}
      <Billboard position={[0, shape.stemHeight + shape.canopySize + 0.25, 0]}>
        {/* @ts-ignore */}
        <Text fontSize={0.16} color="#374151" anchorX="center" anchorY="bottom" opacity={0.7}>
          {plant.name}
        </Text>
      </Billboard>

      {/* Simple tooltip on hover */}
      {hovered && (
        <Html position={[0, shape.stemHeight + shape.canopySize + 0.5, 0]} center distanceFactor={10}>
          <div className="bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap pointer-events-none">
            {plant.name}{species ? ` — ${species}` : ''} — {plant.growthStage || 'Unknown'}
          </div>
        </Html>
      )}
    </group>
  );
}