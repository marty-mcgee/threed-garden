// components/threed/markers/FarmBotMarker3D.tsx — v0.15.3 "Simplified Static Marker"
'use client';

import { useState } from 'react';
import { Box, Sphere, Cylinder, Html, Billboard, Text } from '@react-three/drei';

interface FarmBotData {
  id?: number;
  name: string;
  status?: string;
  batteryLevel?: number;
  battery?: number;
  firmwareVersion?: string;
  deviceId?: string;
  lastSeen?: string;
  description?: string;
  notes?: string;
}

interface FarmBotMarker3DProps {
  farmbot: FarmBotData;
  position: [number, number, number];
}

const STATUS_COLORS: Record<string, string> = {
  online: '#22c55e',
  offline: '#ef4444',
  busy: '#f59e0b',
  maintenance: '#3b82f6',
  error: '#ef4444',
};

export function FarmBotMarker3D({ farmbot, position }: FarmBotMarker3DProps) {
  const [hovered, setHovered] = useState(false);
  const status = farmbot.status?.toLowerCase() || 'offline';
  const statusColor = STATUS_COLORS[status] || '#6b7280';
  const batteryLevel = farmbot.batteryLevel ?? farmbot.battery ?? 50;
  const batteryColor = batteryLevel > 50 ? '#22c55e' : batteryLevel > 20 ? '#eab308' : '#ef4444';

  return (
    <group
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Main body */}
      <Box args={[0.6, 0.3, 0.4]} position={[0, 0.15, 0]} castShadow>
        <meshStandardMaterial color="#4B5563" roughness={0.3} metalness={0.6} />
      </Box>

      {/* Body accent stripe (status colored) */}
      <Box args={[0.55, 0.04, 0.35]} position={[0, 0.27, 0]}>
        <meshStandardMaterial color={statusColor} roughness={0.2} metalness={0.4} />
      </Box>

      {/* Head (status indicator) */}
      <Sphere args={[0.15, 12, 12]} position={[0, 0.4, 0.2]}>
        <meshStandardMaterial color={statusColor} roughness={0.2} metalness={0.3} />
      </Sphere>

      {/* Antenna */}
      <Cylinder args={[0.02, 0.02, 0.12]} position={[0, 0.52, 0.2]}>
        <meshStandardMaterial color="#9CA3AF" roughness={0.2} metalness={0.8} />
      </Cylinder>

      {/* Wheels */}
      <Cylinder args={[0.08, 0.08, 0.04]} rotation={[0, 0, Math.PI / 2]} position={[-0.3, 0.05, 0.25]}>
        <meshStandardMaterial color="#1f2937" roughness={0.8} />
      </Cylinder>
      <Cylinder args={[0.08, 0.08, 0.04]} rotation={[0, 0, Math.PI / 2]} position={[0.3, 0.05, 0.25]}>
        <meshStandardMaterial color="#1f2937" roughness={0.8} />
      </Cylinder>
      <Cylinder args={[0.08, 0.08, 0.04]} rotation={[0, 0, Math.PI / 2]} position={[-0.3, 0.05, -0.25]}>
        <meshStandardMaterial color="#1f2937" roughness={0.8} />
      </Cylinder>
      <Cylinder args={[0.08, 0.08, 0.04]} rotation={[0, 0, Math.PI / 2]} position={[0.3, 0.05, -0.25]}>
        <meshStandardMaterial color="#1f2937" roughness={0.8} />
      </Cylinder>

      {/* Name label */}
      <Billboard position={[0, 0.6, 0]}>
        {/* @ts-ignore */}
        <Text fontSize={0.18} color="#374151" anchorX="center" anchorY="bottom" opacity={0.7}>
          {farmbot.name}
        </Text>
      </Billboard>

      {/* Simple tooltip on hover */}
      {hovered && (
        <Html position={[0, 0.85, 0]} center distanceFactor={10}>
          <div className="bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap pointer-events-none">
            {farmbot.name} — {status} — {Math.round(batteryLevel)}%
          </div>
        </Html>
      )}
    </group>
  );
}
