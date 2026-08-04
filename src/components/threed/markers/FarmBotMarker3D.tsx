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
        {/* @ts-ignore Text API mismatch with drei version */}
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