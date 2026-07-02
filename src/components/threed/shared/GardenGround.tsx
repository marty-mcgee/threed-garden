// src/components/threed/GardenGround.tsx
'use client';

import { Plane } from '@react-three/drei';
import * as THREE from 'three';

export function GardenGround() {
  return (
    <>
      {/* Main ground plane */}
      <Plane
        args={[50, 50]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.1, 0]}
        receiveShadow
      >
        <meshStandardMaterial 
          color="#4A7A3A" 
          roughness={0.8} 
          metalness={0.1}
        />
      </Plane>
      
      {/* Grid helper (optional - for visual reference) */}
      <gridHelper 
        args={[50, 20, '#6B8E23', '#556B2F']} 
        position={[0, -0.05, 0]} 
      />
    </>
  );
}