'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function PulseRing({
  position,
  color,
  size = 1,
}: {
  position: [number, number, number];
  color: string;
  size?: number;
}) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ringRef.current) return;
    const time = state.clock.elapsedTime;
    const scale = 1 + Math.sin(time * 3) * 0.25;
    ringRef.current.scale.set(scale, scale, scale);
    const material = ringRef.current.material as THREE.MeshBasicMaterial;
    material.opacity = 0.3 + Math.sin(time * 2) * 0.2;
  });

  return (
    <mesh ref={ringRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[size * 1.2, size * 1.6, 32]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.5}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
