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