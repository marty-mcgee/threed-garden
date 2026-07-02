// components/threed/markers/TrafficMarker3D.tsx
'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Html, Billboard } from '@react-three/drei';
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
        <mesh>
          <Text fontSize={0.5} color="white" anchorX="center" anchorY="middle">
            {icon}
          </Text>
        </mesh>
      </Billboard>

      {/* Tooltip */}
      {hovered && (
        <Html position={[0, 1.6, 0]} center distanceFactor={10}>
          <div className="bg-white dark:bg-gray-900 p-3 rounded-lg shadow-xl border dark:border-gray-700 max-w-xs">
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