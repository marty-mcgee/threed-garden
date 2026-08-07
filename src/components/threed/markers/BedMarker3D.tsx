// components/threed/markers/BedMarker3D.tsx — v0.15.3 "Rich Data Visualization"
'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Html, Billboard, Text, Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface BedData {
  id: number;
  name: string;
  width?: number;
  widthFeet?: number;
  depth?: number;
  length?: number;
  lengthFeet?: number;
  soilType?: string;
  sunExposure?: string;
  color?: string;
  status?: string;
  plantingsCount?: number;
  description?: string;
  notes?: string;
}

interface BedMarker3DProps {
  bed: BedData;
  position: [number, number, number];
}

// Soil type colors
const SOIL_COLORS: Record<string, string> = {
  clay: '#8B4513',
  'clay loam': '#7B3F1A',
  loam: '#5C4033',
  'sandy loam': '#D2B48C',
  sandy: '#F4D03F',
  'silty loam': '#8B7355',
  silt: '#9B8E7A',
  compost: '#2F1B0E',
  'potting mix': '#3E2723',
  'raised bed': '#5D4037',
};

const SOIL_LABELS: Record<string, string> = {
  clay: '🟫 Clay',
  'clay loam': '🟫 Clay Loam',
  loam: '🟤 Loam',
  'sandy loam': '🟨 Sandy Loam',
  sandy: '🟡 Sandy',
  'silty loam': '🟠 Silty Loam',
  silt: '🟠 Silt',
  compost: '⬛ Compost',
  'potting mix': '⬛ Potting Mix',
  'raised bed': '🟤 Raised Bed',
};

const SUN_ICONS: Record<string, string> = {
  'full sun': '☀️',
  'full': '☀️',
  'partial sun': '⛅',
  'partial': '⛅',
  'partial shade': '🌤️',
  shade: '🌑',
  'full shade': '🌑',
};

export function BedMarker3D({ bed, position }: BedMarker3DProps) {
  const [hovered, setHovered] = useState(false);
  const ringRef = useRef<THREE.Mesh>(null);

  const bedWidth = bed.width || bed.widthFeet || 4;
  const bedDepth = bed.depth || bed.length || bed.lengthFeet || 8;
  const soilColor = bed.soilType ? (SOIL_COLORS[bed.soilType.toLowerCase()] || '#8B7355') : (bed.color || '#8B7355');
  const sunIcon = bed.sunExposure ? (SUN_ICONS[bed.sunExposure.toLowerCase()] || '') : '';
  const plantCount = bed.plantingsCount || 0;

  useFrame((state) => {
    if (ringRef.current && hovered) {
      const t = state.clock.elapsedTime;
      const scale = 1 + Math.sin(t * 2) * 0.1;
      ringRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group position={position}>
      {/* Main bed body — raised platform */}
      <Box
        args={[bedWidth, 0.3, bedDepth]}
        position={[0, 0.15, 0]}
        castShadow
        receiveShadow
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={soilColor}
          roughness={0.85}
          metalness={0}
        />
      </Box>

      {/* Soil surface layer (slightly lighter) */}
      <Box
        args={[bedWidth - 0.2, 0.02, bedDepth - 0.2]}
        position={[0, 0.31, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          color={new THREE.Color(soilColor).multiplyScalar(1.3)}
          roughness={0.95}
          metalness={0}
        />
      </Box>

      {/* Border frame — four walls */}
      <Box args={[bedWidth + 0.1, 0.15, 0.08]} position={[0, 0.35, bedDepth / 2 + 0.04]} castShadow>
        <meshStandardMaterial color="#5C4033" roughness={0.85} />
      </Box>
      <Box args={[bedWidth + 0.1, 0.15, 0.08]} position={[0, 0.35, -(bedDepth / 2 + 0.04)]} castShadow>
        <meshStandardMaterial color="#5C4033" roughness={0.85} />
      </Box>
      <Box args={[0.08, 0.15, bedDepth + 0.1]} position={[bedWidth / 2 + 0.04, 0.35, 0]} castShadow>
        <meshStandardMaterial color="#5C4033" roughness={0.85} />
      </Box>
      <Box args={[0.08, 0.15, bedDepth + 0.1]} position={[-(bedWidth / 2 + 0.04), 0.35, 0]} castShadow>
        <meshStandardMaterial color="#5C4033" roughness={0.85} />
      </Box>

      {/* Mini plant indicators (green dots showing occupancy) */}
      {plantCount > 0 && Array.from({ length: Math.min(plantCount, 9) }).map((_, i) => {
        const cols = 3;
        const row = Math.floor(i / cols);
        const col = i % cols;
        const spacingX = bedWidth / (cols + 1);
        const spacingZ = bedDepth / (Math.min(plantCount, 9) / cols + 1);
        return (
          <Sphere
            key={`plant-dot-${i}`}
            args={[0.08, 6, 6]}
            position={[
              -bedWidth / 2 + spacingX * (col + 1),
              0.34,
              -bedDepth / 2 + spacingZ * (row + 1)
            ]}
          >
            <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.3} />
          </Sphere>
        );
      })}

      {/* Hover glow ring */}
      {hovered && (
        <mesh ref={ringRef} position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[Math.max(bedWidth, bedDepth) * 0.6, Math.max(bedWidth, bedDepth) * 0.7, 32]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}

      {/* Name label */}
      <Billboard position={[0, 0.5, 0]}>
        {/* @ts-ignore */}
        <Text fontSize={0.25} color="#374151" anchorX="center" anchorY="bottom" opacity={0.8}>
          {bed.name}
        </Text>
      </Billboard>

      {/* Sun exposure badge */}
      {sunIcon && (
        <Html position={[bedWidth / 2 + 0.3, 0.35, -bedDepth / 2 - 0.3]} center distanceFactor={15}>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full w-6 h-6 flex items-center justify-center text-sm shadow-sm border border-gray-200 dark:border-gray-700 pointer-events-none">
            {sunIcon}
          </div>
        </Html>
      )}

      {/* Tooltip */}
      {hovered && (
        <Html position={[0, 0.9, 0]} center distanceFactor={10}>
          <div className="bg-white dark:bg-gray-900 p-2.5 rounded-lg shadow-xl border dark:border-gray-700 text-xs pointer-events-none whitespace-nowrap min-w-[140px]">
            <p className="font-bold text-sm mb-1">{bed.name}</p>
            <div className="space-y-0.5 text-muted-foreground">
              <p>📐 {bedWidth}ft × {bedDepth}ft</p>
              {bed.soilType && <p>{SOIL_LABELS[bed.soilType.toLowerCase()] || `🟫 ${bed.soilType}`}</p>}
              {bed.sunExposure && <p>{sunIcon} {bed.sunExposure}</p>}
              {plantCount > 0 && <p>🌱 {plantCount} planting{plantCount !== 1 ? 's' : ''}</p>}
              {bed.status && <p>📊 Status: {bed.status}</p>}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}