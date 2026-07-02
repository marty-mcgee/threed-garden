// src/components/threed/WeatherEffects.tsx
'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface WeatherEffectsProps {
  weather?: {
    temperature: number;
    condition: string;
    rainfall: number;
  };
}

export function WeatherEffects({ weather }: WeatherEffectsProps) {
  const rainRef = useRef<THREE.Group>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);
  
  // Simple rain effect based on rainfall data
  useFrame(() => {
    if (rainRef.current && weather?.rainfall && weather.rainfall > 0) {
      rainRef.current.rotation.y += 0.01;
    }
  });
  
  if (!weather) return null;
  
  return (
    <>
      {/* Sun effect for sunny weather */}
      {weather.condition === 'sunny' && weather.temperature > 75 && (
        <pointLight
          ref={pointLightRef}
          position={[5, 10, 5]}
          intensity={0.5}
          color="#FFD700"
          distance={20}
        />
      )}
      
      {/* Rain effect based on rainfall amount */}
      {weather.rainfall > 0 && (
        <group ref={rainRef}>
          {Array.from({ length: Math.min(50, Math.floor(weather.rainfall * 30)) }).map((_, i) => (
            <Sphere
              key={i}
              args={[0.05, 4, 4]}
              position={[
                (Math.random() - 0.5) * 30,
                Math.random() * 10,
                (Math.random() - 0.5) * 30,
              ]}
            >
              <meshStandardMaterial color="#4FC3F7" transparent opacity={0.6} />
            </Sphere>
          ))}
        </group>
      )}
    </>
  );
}