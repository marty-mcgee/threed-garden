// src/components/threed/GardenPlant.tsx
'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Cylinder, Html } from '@react-three/drei';
import * as THREE from 'three';

interface GardenPlantProps {
  planting: {
    id: number;
    plantName: string;
    plantType: string;
    quantity: number;
    positionX: number;
    positionZ: number;
    growthStage: string;
    daysToMaturity: number;
  };
  onClick?: () => void;
}

export function GardenPlant({ planting, onClick }: GardenPlantProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  
  const getPlantColor = () => {
    switch (planting.growthStage) {
      case 'seed': return '#8B4513';
      case 'seedling': return '#228B22';
      case 'vegetative': return '#32CD32';
      case 'flowering': return '#FF69B4';
      case 'fruiting': return '#FF4500';
      case 'mature': return '#006400';
      default: return '#2E8B57';
    }
  };
  
  const getPlantHeight = () => {
    const baseHeight = planting.daysToMaturity / 100;
    switch (planting.growthStage) {
      case 'seed': return 0.1;
      case 'seedling': return 0.3;
      case 'vegetative': return 0.6;
      case 'flowering': return 0.8;
      case 'fruiting': return 1.0;
      case 'mature': return 1.2;
      default: return 0.5;
    }
  };
  
  const height = getPlantHeight();
  const color = getPlantColor();
  const spacing = 1.5;
  const offset = (planting.quantity - 1) * spacing / 2;
  
  useFrame(() => {
    if (groupRef.current && hovered) {
      groupRef.current.scale.setScalar(1.1);
    } else if (groupRef.current) {
      groupRef.current.scale.setScalar(1);
    }
  });
  
  // Gentle swaying animation for plants
  useFrame((state) => {
    if (groupRef.current && planting.growthStage !== 'seed') {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });
  
  return (
    <group
      ref={groupRef}
      position={[planting.positionX, 0, planting.positionZ]}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {Array.from({ length: planting.quantity }).map((_, i) => {
        const x = (i * spacing) - offset;
        
        return (
          <group key={i} position={[x, height / 2, 0]}>
            {/* Stem */}
            <Cylinder
              args={[0.08, 0.12, height]}
              position={[0, -height / 2, 0]}
              castShadow
            >
              <meshStandardMaterial color="#8B4513" roughness={0.6} />
            </Cylinder>
            
            {/* Foliage - multiple spheres for fuller look */}
            <Sphere args={[height * 0.4, 16, 16]} position={[0, height * 0.1, 0]}>
              <meshStandardMaterial 
                color={color} 
                roughness={0.4} 
                emissive={color}
                emissiveIntensity={0.1}
              />
            </Sphere>
            <Sphere args={[height * 0.3, 16, 16]} position={[height * 0.2, height * 0.3, height * 0.2]}>
              <meshStandardMaterial color={color} roughness={0.4} />
            </Sphere>
            <Sphere args={[height * 0.3, 16, 16]} position={[-height * 0.2, height * 0.3, -height * 0.1]}>
              <meshStandardMaterial color={color} roughness={0.4} />
            </Sphere>
            
            {/* Fruit/Flower indicator */}
            {(planting.growthStage === 'flowering' || planting.growthStage === 'fruiting') && (
              <Sphere 
                args={[0.15, 16, 16]} 
                position={[0, height * 0.2, 0]}
              >
                <meshStandardMaterial 
                  color={planting.growthStage === 'fruiting' ? '#FF6347' : '#FFD700'} 
                  emissive={planting.growthStage === 'fruiting' ? '#FF4500' : '#FFA500'}
                  emissiveIntensity={0.3}
                />
              </Sphere>
            )}
          </group>
        );
      })}
      
      {/* Hover info */}
      {hovered && (
        <Html distanceFactor={10}>
          <div className="bg-black/80 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
            🌱 {planting.plantName}
            <br />
            Stage: {planting.growthStage}
            {planting.daysToMaturity && (
              <>
                <br />
                Maturity: {planting.daysToMaturity} days
              </>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}