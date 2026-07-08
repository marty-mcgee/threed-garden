// components/threed/markers/PlantMarker3D.tsx
'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Cylinder, Html, Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { Plant3D } from '@/lib/types/threed';
import { getGrowthStageColor, getGrowthStageHeight } from '@/lib/config/constants';

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