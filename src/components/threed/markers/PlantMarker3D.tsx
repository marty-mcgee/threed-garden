// components/threed/markers/PlantMarker3D.tsx — v0.15.3 "Rich Growth Visualization"
'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Cylinder, Html, Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { getGrowthStageColor, getGrowthStageHeight } from '@/lib/config/constants';

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

// Growth stage visual presets
const GROWTH_SHAPES: Record<string, { stemHeight: number; canopySize: number; stemColor: string; canopyColor: string }> = {
  seed: { stemHeight: 0.08, canopySize: 0.06, stemColor: '#8B7355', canopyColor: '#D2691E' },
  seedling: { stemHeight: 0.2, canopySize: 0.1, stemColor: '#228B22', canopyColor: '#90EE90' },
  vegetative: { stemHeight: 0.5, canopySize: 0.2, stemColor: '#228B22', canopyColor: '#32CD32' },
  flowering: { stemHeight: 0.7, canopySize: 0.25, stemColor: '#228B22', canopyColor: '#FF69B4' },
  fruiting: { stemHeight: 0.8, canopySize: 0.3, stemColor: '#228B22', canopyColor: '#FF4500' },
  mature: { stemHeight: 0.9, canopySize: 0.35, stemColor: '#1B5E20', canopyColor: '#2E7D32' },
  dormant: { stemHeight: 0.3, canopySize: 0.15, stemColor: '#8B7355', canopyColor: '#A0A0A0' },
};

// Health color gradient
function getHealthColor(health?: string | number): string {
  if (health === undefined || health === null) return '#22c55e';
  const h = typeof health === 'string' ? parseFloat(health) : health;
  if (isNaN(h)) return '#22c55e';
  if (h >= 80) return '#22c55e'; // green
  if (h >= 50) return '#eab308'; // yellow
  if (h >= 25) return '#f97316'; // orange
  return '#ef4444'; // red
}

function getHealthLabel(health?: string | number): string {
  if (health === undefined || health === null) return 'Healthy';
  const h = typeof health === 'string' ? parseFloat(health) : health;
  if (isNaN(h)) return 'Healthy';
  if (h >= 80) return 'Excellent';
  if (h >= 50) return 'Good';
  if (h >= 25) return 'Fair';
  return 'Poor';
}

function daysSincePlanted(plantedDate?: string, plantedAt?: string): number | null {
  const dateStr = plantedDate || plantedAt;
  if (!dateStr) return null;
  const planted = new Date(dateStr);
  if (isNaN(planted.getTime())) return null;
  return Math.floor((Date.now() - planted.getTime()) / (1000 * 60 * 60 * 24));
}

export function PlantMarker3D({ plant, position }: PlantMarker3DProps) {
  const [hovered, setHovered] = useState(false);
  const healthRingRef = useRef<THREE.Mesh>(null);
  const canopyRef = useRef<THREE.Mesh>(null);

  const stage = plant.growthStage?.toLowerCase() || 'seedling';
  const shape = GROWTH_SHAPES[stage] || GROWTH_SHAPES.seedling;
  const healthColor = getHealthColor(plant.health);
  const healthLabel = getHealthLabel(plant.health);
  const daysAgo = daysSincePlanted(plant.plantedDate, plant.plantedAt);
  const species = plant.species || plant.plantType || plant.commonName || plant.plantName || 'Plant';

  // Sway animation for stem + canopy
  useFrame((state) => {
    if (canopyRef.current) {
      const sway = Math.sin(state.clock.elapsedTime * 1.5 + position[0] + position[2]) * 0.03;
      canopyRef.current.position.x = sway;
    }
    // Pulsing health ring
    if (healthRingRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.08;
      healthRingRef.current.scale.set(pulse, pulse, pulse);
    }
  });

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
        <meshStandardMaterial color={shape.stemColor} roughness={0.7} />
      </Cylinder>

      {/* Canopy (leaves/flower/fruit) */}
      <group ref={canopyRef} position={[0, shape.stemHeight + 0.05, 0]}>
        <Sphere args={[shape.canopySize, 10, 8]} castShadow>
          <meshStandardMaterial
            color={shape.canopyColor}
            emissive={shape.canopyColor}
            emissiveIntensity={0.15}
            roughness={0.6}
          />
        </Sphere>

        {/* Secondary foliage (smaller offset spheres for leafy look in vegetative+ stages) */}
        {['vegetative', 'flowering', 'fruiting', 'mature'].includes(stage) && (
          <>
            <Sphere args={[shape.canopySize * 0.7, 6, 6]} position={[shape.canopySize * 0.5, shape.canopySize * 0.3, 0]}>
              <meshStandardMaterial color={shape.canopyColor} roughness={0.6} />
            </Sphere>
            <Sphere args={[shape.canopySize * 0.6, 6, 6]} position={[-shape.canopySize * 0.4, shape.canopySize * 0.2, shape.canopySize * 0.3]}>
              <meshStandardMaterial color={shape.canopyColor} roughness={0.6} />
            </Sphere>
          </>
        )}

        {/* Flower buds for flowering stage */}
        {stage === 'flowering' && (
          <>
            <Sphere args={[0.06, 8, 8]} position={[0, shape.canopySize * 0.4, 0]}>
              <meshStandardMaterial color="#FF69B4" emissive="#FF69B4" emissiveIntensity={0.3} />
            </Sphere>
            <Sphere args={[0.05, 8, 8]} position={[shape.canopySize * 0.3, shape.canopySize * 0.6, 0]}>
              <meshStandardMaterial color="#FF1493" emissive="#FF1493" emissiveIntensity={0.25} />
            </Sphere>
          </>
        )}

        {/* Fruit for fruiting stage */}
        {stage === 'fruiting' && (
          <Sphere args={[0.08, 8, 8]} position={[0, shape.canopySize * 0.3, 0]}>
            <meshStandardMaterial color="#FF6347" emissive="#FF6347" emissiveIntensity={0.3} roughness={0.4} />
          </Sphere>
        )}
      </group>

      {/* Health ring indicator */}
      <mesh ref={healthRingRef} position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.25, 32]} />
        <meshBasicMaterial color={healthColor} transparent opacity={0.7} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* Name label */}
      <Billboard position={[0, shape.stemHeight + shape.canopySize + 0.3, 0]}>
        {/* @ts-ignore */}
        <Text fontSize={0.18} color="#374151" anchorX="center" anchorY="bottom" opacity={0.7}>
          {plant.name}
        </Text>
      </Billboard>

      {/* Tooltip */}
      {hovered && (
        <Html position={[0, shape.stemHeight + shape.canopySize + 0.7, 0]} center distanceFactor={10}>
          <div className="bg-white dark:bg-gray-900 p-2.5 rounded-lg shadow-xl border dark:border-gray-700 text-xs pointer-events-none whitespace-nowrap min-w-[150px]">
            <p className="font-bold text-sm mb-1">{plant.name}</p>
            <div className="space-y-0.5 text-muted-foreground">
              {species && <p>🌿 {species}</p>}
              <p>📈 Stage: {plant.growthStage || 'Unknown'}</p>
              <p style={{ color: healthColor }}>❤️ Health: {healthLabel}</p>
              {daysAgo !== null && <p>📅 Planted: {daysAgo} day{daysAgo !== 1 ? 's' : ''} ago</p>}
              {plant.quantity && plant.quantity > 1 && <p>🔢 Quantity: {plant.quantity}</p>}
              {plant.status && <p>📊 Status: {plant.status}</p>}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}