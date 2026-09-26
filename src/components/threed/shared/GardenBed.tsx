// src/components/threed/GardenBed.tsx
'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Text, Html } from '@react-three/drei';
import * as THREE from 'three';

interface GardenBedProps {
  bed: {
    id: number;
    name: string;
    widthFeet: number;
    lengthFeet: number;
    positionX: number;
    positionZ: number;
    color: string;
  };
  onClick?: () => void;
}

export function GardenBed({ bed, onClick }: GardenBedProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  const width = bed.widthFeet || 4;
  const length = bed.lengthFeet || 8;
  
  useFrame(() => {
    if (meshRef.current && hovered) {
      meshRef.current.scale.setScalar(1.02);
    } else if (meshRef.current) {
      meshRef.current.scale.setScalar(1);
    }
  });
  
  return (
    <group 
      key={`bed-${bed.id}`}
      position={[bed.positionX || 0, 0, bed.positionZ || 0]}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Base */}
      <Box
        ref={meshRef}
        args={[width, 0.3, length]}
        position={[0, 0, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial 
          color={bed.color || '#8B5E3C'} 
          roughness={0.7}
          metalness={0.1}
          emissive={hovered ? '#3a3a3a' : '#000000'}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </Box>
      
      {/* Soil surface */}
      <Box
        args={[width - 0.2, 0.1, length - 0.2]}
        position={[0, 0.2, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial 
          color="#3d2b1f" 
          roughness={0.8}
          metalness={0.05}
        />
      </Box>
      
      {/* Bed name label */}
      <Text
        position={[0, 0.6, 0]}
        fontSize={0.5}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        {bed.name}
      </Text>
      
      {/* Hover info */}
      {hovered && (
        <Html distanceFactor={10}>
          <div className="bg-black/80 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
            {bed.name}
            <br />
            {width}' × {length}'
          </div>
        </Html>
      )}
    </group>
  );
}