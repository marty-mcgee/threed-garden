// components/threed/effects/WeatherEffects.tsx
'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { Weather3D } from '@/lib/types/threed';

interface WeatherEffectsProps {
  weather: Weather3D;
}

export function WeatherEffects({ weather }: WeatherEffectsProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 500;

  // Generate random particles
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 10;
    }
    return positions;
  }, [count]);

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      // Animate particles (falling effect)
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
      const speed = weather.conditions === 'rainy' ? 0.02 : 0.005;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] -= speed;
        if (positions[i] < -5) positions[i] = 5;
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  // Only show particles for certain conditions
  if (weather.conditions === 'sunny' || weather.conditions === 'cloudy') {
    return null;
  }

  return (
    <Points ref={pointsRef} position={[0, 2, 0]}>
      <PointMaterial
        transparent
        color={weather.conditions === 'rainy' ? '#93c5fd' : '#e5e7eb'}
        size={0.05}
        sizeAttenuation
        depthWrite={false}
      />
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length / 3}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
    </Points>
  );
}