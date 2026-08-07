// components/threed/markers/BedMarker3D.tsx — v0.15.3 "Simplified Static Marker"
'use client';

import { useState } from 'react';
import { Box, Html, Billboard, Text } from '@react-three/drei';

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

const SOIL_COLORS: Record<string, string> = {
  clay: '#8B4513', 'clay loam': '#7B3F1A', loam: '#5C4033',
  'sandy loam': '#D2B48C', sandy: '#F4D03F', 'silty loam': '#8B7355',
  silt: '#9B8E7A', compost: '#2F1B0E', 'potting mix': '#3E2723', 'raised bed': '#5D4037',
};

export function BedMarker3D({ bed, position }: BedMarker3DProps) {
  const [hovered, setHovered] = useState(false);

  const bedWidth = Number(bed.width || bed.widthFeet) || 4;
  const bedDepth = Number(bed.depth || bed.length || bed.lengthFeet) || 8;
  const soilColor = bed.soilType ? (SOIL_COLORS[bed.soilType.toLowerCase()] || '#8B7355') : (bed.color || '#8B7355');

  return (
    <group position={position}>
      {/* Main bed body */}
      <Box
        args={[bedWidth, 0.3, bedDepth]}
        position={[0, 0.15, 0]}
        castShadow
        receiveShadow
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial color={soilColor} roughness={0.85} metalness={0} />
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

      {/* Name label */}
      <Billboard position={[0, 0.5, 0]}>
        {/* @ts-ignore */}
        <Text fontSize={0.22} color="#374151" anchorX="center" anchorY="bottom" opacity={0.8}>
          {bed.name}
        </Text>
      </Billboard>

      {/* Simple tooltip on hover */}
      {hovered && (
        <Html position={[0, 0.7, 0]} center distanceFactor={10}>
          <div className="bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap pointer-events-none">
            {bed.name} — {bedWidth}ft × {bedDepth}ft{bed.soilType ? ` — ${bed.soilType}` : ''}
          </div>
        </Html>
      )}
    </group>
  );
}