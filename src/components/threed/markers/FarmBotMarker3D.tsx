// components/threed/markers/FarmBotMarker3D.tsx — v0.15.3 "Status & Battery Visualization"
'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Sphere, Cylinder, Html, Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';

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

const STATUS_LABELS: Record<string, string> = {
  online: '🟢 Online',
  offline: '🔴 Offline',
  busy: '🟡 Busy',
  maintenance: '🔵 Maintenance',
  error: '⛔ Error',
};

function timeAgo(dateStr?: string): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

export function FarmBotMarker3D({ farmbot, position }: FarmBotMarker3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const statusRingRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const status = farmbot.status?.toLowerCase() || 'offline';
  const statusColor = STATUS_COLORS[status] || '#6b7280';
  const statusLabel = STATUS_LABELS[status] || farmbot.status || 'Unknown';
  const batteryLevel = farmbot.batteryLevel ?? farmbot.battery ?? 50;
  const batteryColor = batteryLevel > 50 ? '#22c55e' : batteryLevel > 20 ? '#eab308' : '#ef4444';
  const lastSeen = timeAgo(farmbot.lastSeen);

  // Floating + status animations
  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime;
      const floatY = Math.sin(t * 1.2 + position[0] + position[2]) * 0.05;
      groupRef.current.position.y = 0.2 + floatY;
    }

    // Pulsing status ring for active states
    if (statusRingRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2.5) * 0.15;
      statusRingRef.current.scale.set(pulse, pulse, pulse);
      const mat = statusRingRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = status === 'online' ? 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.15 :
                    status === 'busy' ? 0.2 + Math.sin(state.clock.elapsedTime * 3) * 0.2 :
                    status === 'error' ? 0.4 + Math.sin(state.clock.elapsedTime * 6) * 0.3 : 0.15;
      mat.color.set(statusColor);
    }

    // Error flash on head
    if (headRef.current && status === 'error') {
      const mat = headRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.2 + Math.abs(Math.sin(state.clock.elapsedTime * 6)) * 0.5;
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Status ground ring */}
      <mesh ref={statusRingRef} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.35, 0.45, 32]} />
        <meshBasicMaterial color={statusColor} transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* Main body */}
      <Box args={[0.6, 0.3, 0.4]} position={[0, 0.15, 0]} castShadow>
        <meshStandardMaterial color="#4B5563" roughness={0.3} metalness={0.6} />
      </Box>

      {/* Body accent stripe */}
      <Box args={[0.55, 0.04, 0.35]} position={[0, 0.27, 0]}>
        <meshStandardMaterial color={statusColor} roughness={0.2} metalness={0.4} emissive={statusColor} emissiveIntensity={0.2} />
      </Box>

      {/* Head (status indicator sphere) */}
      <Sphere ref={headRef} args={[0.15, 12, 12]} position={[0, 0.4, 0.2]} castShadow>
        <meshStandardMaterial
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={status === 'online' ? 0.4 : status === 'busy' ? 0.3 : 0.15}
          roughness={0.2}
          metalness={0.3}
        />
      </Sphere>

      {/* Antenna */}
      <Cylinder args={[0.02, 0.02, 0.12]} position={[0, 0.52, 0.2]}>
        <meshStandardMaterial color="#9CA3AF" roughness={0.2} metalness={0.8} />
      </Cylinder>
      <Sphere args={[0.04, 6, 6]} position={[0, 0.59, 0.2]}>
        <meshStandardMaterial color={status === 'online' ? '#22c55e' : '#6b7280'} emissive={status === 'online' ? '#22c55e' : '#6b7280'} emissiveIntensity={0.6} />
      </Sphere>

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

      {/* Battery bar (floating above) */}
      <group position={[0, 0.55, -0.3]}>
        {/* Bar background */}
        <Box args={[0.4, 0.06, 0.02]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#1f2937" roughness={0.5} />
        </Box>
        {/* Bar fill */}
        <Box
          args={[0.36 * (batteryLevel / 100), 0.04, 0.03]}
          position={[-(0.18 * (1 - batteryLevel / 100)), 0, 0]}
        >
          <meshStandardMaterial color={batteryColor} emissive={batteryColor} emissiveIntensity={0.4} roughness={0.3} />
        </Box>
        {/* Battery percentage text */}
        <Html position={[0, 0.07, 0]} center distanceFactor={15}>
          <div className="text-[8px] font-mono text-white bg-black/60 px-1 rounded pointer-events-none">
            {Math.round(batteryLevel)}%
          </div>
        </Html>
      </group>

      {/* Name label */}
      <Billboard position={[0, 0.75, 0]}>
        {/* @ts-ignore */}
        <Text fontSize={0.18} color="#374151" anchorX="center" anchorY="bottom" opacity={0.7}>
          {farmbot.name}
        </Text>
      </Billboard>

      {/* Tooltip */}
      {hovered && (
        <Html position={[0, 1.0, 0]} center distanceFactor={10}>
          <div className="bg-white dark:bg-gray-900 p-2.5 rounded-lg shadow-xl border dark:border-gray-700 text-xs pointer-events-none whitespace-nowrap min-w-[140px]">
            <p className="font-bold text-sm mb-1">{farmbot.name}</p>
            <div className="space-y-0.5 text-muted-foreground">
              <p style={{ color: statusColor }}>{statusLabel}</p>
              <p style={{ color: batteryColor }}>🔋 Battery: {Math.round(batteryLevel)}%</p>
              {farmbot.deviceId && <p>📱 ID: {farmbot.deviceId}</p>}
              {farmbot.firmwareVersion && <p>📦 v{farmbot.firmwareVersion}</p>}
              {lastSeen && <p>🕐 Last seen: {lastSeen}</p>}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}