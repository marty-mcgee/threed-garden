// src/components/threed/PlantModels.tsx
'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Cylinder, Html } from '@react-three/drei';
import * as THREE from 'three';

// Plant model configuration interface
interface PlantModelConfig {
  type: string;
  growthStages: {
    [key: string]: {
      height: number;
      foliageRadius: number;
      trunkHeight: number;
      trunkRadius: number;
      color: string;
      foliageColor: string;
      hasFruit: boolean;
      fruitColor?: string;
      fruitCount?: number;
    };
  };
}

// Pre-defined plant models
export const plantModels: Record<string, PlantModelConfig> = {
  'tomato': {
    type: 'Vegetable',
    growthStages: {
      'seed': { height: 0.1, foliageRadius: 0.1, trunkHeight: 0, trunkRadius: 0, color: '#8B4513', foliageColor: '#8B4513', hasFruit: false },
      'seedling': { height: 0.3, foliageRadius: 0.2, trunkHeight: 0.15, trunkRadius: 0.05, color: '#5C4033', foliageColor: '#228B22', hasFruit: false },
      'vegetative': { height: 0.7, foliageRadius: 0.4, trunkHeight: 0.4, trunkRadius: 0.08, color: '#5C4033', foliageColor: '#32CD32', hasFruit: false },
      'flowering': { height: 0.9, foliageRadius: 0.5, trunkHeight: 0.5, trunkRadius: 0.08, color: '#5C4033', foliageColor: '#228B22', hasFruit: false },
      'fruiting': { height: 1.0, foliageRadius: 0.55, trunkHeight: 0.55, trunkRadius: 0.1, color: '#5C4033', foliageColor: '#2E8B57', hasFruit: true, fruitColor: '#FF6347', fruitCount: 4 },
      'mature': { height: 1.2, foliageRadius: 0.6, trunkHeight: 0.6, trunkRadius: 0.1, color: '#8B4513', foliageColor: '#006400', hasFruit: true, fruitColor: '#FF4500', fruitCount: 6 },
    },
  },
  'basil': {
    type: 'Herb',
    growthStages: {
      'seed': { height: 0.05, foliageRadius: 0.05, trunkHeight: 0, trunkRadius: 0, color: '#8B4513', foliageColor: '#8B4513', hasFruit: false },
      'seedling': { height: 0.15, foliageRadius: 0.1, trunkHeight: 0.08, trunkRadius: 0.03, color: '#5C4033', foliageColor: '#228B22', hasFruit: false },
      'vegetative': { height: 0.4, foliageRadius: 0.25, trunkHeight: 0.2, trunkRadius: 0.05, color: '#5C4033', foliageColor: '#32CD32', hasFruit: false },
      'flowering': { height: 0.5, foliageRadius: 0.3, trunkHeight: 0.25, trunkRadius: 0.05, color: '#5C4033', foliageColor: '#228B22', hasFruit: false },
      'mature': { height: 0.6, foliageRadius: 0.35, trunkHeight: 0.3, trunkRadius: 0.06, color: '#8B4513', foliageColor: '#006400', hasFruit: true, fruitColor: '#FFD700', fruitCount: 2 },
    },
  },
  'lettuce': {
    type: 'Vegetable',
    growthStages: {
      'seed': { height: 0.05, foliageRadius: 0.08, trunkHeight: 0, trunkRadius: 0, color: '#8B4513', foliageColor: '#8B4513', hasFruit: false },
      'seedling': { height: 0.1, foliageRadius: 0.15, trunkHeight: 0.05, trunkRadius: 0.03, color: '#5C4033', foliageColor: '#228B22', hasFruit: false },
      'vegetative': { height: 0.25, foliageRadius: 0.35, trunkHeight: 0.1, trunkRadius: 0.05, color: '#5C4033', foliageColor: '#32CD32', hasFruit: false },
      'mature': { height: 0.3, foliageRadius: 0.45, trunkHeight: 0.12, trunkRadius: 0.05, color: '#8B4513', foliageColor: '#006400', hasFruit: false },
    },
  },
  'pepper': {
    type: 'Vegetable',
    growthStages: {
      'seed': { height: 0.08, foliageRadius: 0.08, trunkHeight: 0, trunkRadius: 0, color: '#8B4513', foliageColor: '#8B4513', hasFruit: false },
      'seedling': { height: 0.25, foliageRadius: 0.18, trunkHeight: 0.12, trunkRadius: 0.05, color: '#5C4033', foliageColor: '#228B22', hasFruit: false },
      'vegetative': { height: 0.6, foliageRadius: 0.35, trunkHeight: 0.3, trunkRadius: 0.08, color: '#5C4033', foliageColor: '#32CD32', hasFruit: false },
      'flowering': { height: 0.8, foliageRadius: 0.45, trunkHeight: 0.4, trunkRadius: 0.08, color: '#5C4033', foliageColor: '#228B22', hasFruit: false },
      'fruiting': { height: 0.9, foliageRadius: 0.5, trunkHeight: 0.45, trunkRadius: 0.1, color: '#5C4033', foliageColor: '#2E8B57', hasFruit: true, fruitColor: '#FF0000', fruitCount: 5 },
      'mature': { height: 1.0, foliageRadius: 0.55, trunkHeight: 0.5, trunkRadius: 0.1, color: '#8B4513', foliageColor: '#006400', hasFruit: true, fruitColor: '#DC143C', fruitCount: 8 },
    },
  },
  'carrot': {
    type: 'Vegetable',
    growthStages: {
      'seed': { height: 0.03, foliageRadius: 0.03, trunkHeight: 0, trunkRadius: 0, color: '#8B4513', foliageColor: '#8B4513', hasFruit: false },
      'seedling': { height: 0.1, foliageRadius: 0.08, trunkHeight: 0.05, trunkRadius: 0.03, color: '#5C4033', foliageColor: '#228B22', hasFruit: false },
      'vegetative': { height: 0.3, foliageRadius: 0.2, trunkHeight: 0.15, trunkRadius: 0.05, color: '#5C4033', foliageColor: '#32CD32', hasFruit: false },
      'mature': { height: 0.4, foliageRadius: 0.25, trunkHeight: 0.2, trunkRadius: 0.05, color: '#FF8C00', foliageColor: '#006400', hasFruit: false },
    },
  },
  'strawberry': {
    type: 'Fruit',
    growthStages: {
      'seed': { height: 0.05, foliageRadius: 0.05, trunkHeight: 0, trunkRadius: 0, color: '#8B4513', foliageColor: '#8B4513', hasFruit: false },
      'seedling': { height: 0.12, foliageRadius: 0.12, trunkHeight: 0.06, trunkRadius: 0.03, color: '#5C4033', foliageColor: '#228B22', hasFruit: false },
      'vegetative': { height: 0.2, foliageRadius: 0.3, trunkHeight: 0.1, trunkRadius: 0.05, color: '#5C4033', foliageColor: '#32CD32', hasFruit: false },
      'flowering': { height: 0.25, foliageRadius: 0.35, trunkHeight: 0.12, trunkRadius: 0.05, color: '#5C4033', foliageColor: '#228B22', hasFruit: false },
      'fruiting': { height: 0.25, foliageRadius: 0.4, trunkHeight: 0.12, trunkRadius: 0.05, color: '#5C4033', foliageColor: '#2E8B57', hasFruit: true, fruitColor: '#FF0000', fruitCount: 3 },
      'mature': { height: 0.3, foliageRadius: 0.45, trunkHeight: 0.15, trunkRadius: 0.06, color: '#8B4513', foliageColor: '#006400', hasFruit: true, fruitColor: '#DC143C', fruitCount: 5 },
    },
  },
  'zucchini': {
    type: 'Vegetable',
    growthStages: {
      'seed': { height: 0.08, foliageRadius: 0.1, trunkHeight: 0, trunkRadius: 0, color: '#8B4513', foliageColor: '#8B4513', hasFruit: false },
      'seedling': { height: 0.2, foliageRadius: 0.2, trunkHeight: 0.1, trunkRadius: 0.05, color: '#5C4033', foliageColor: '#228B22', hasFruit: false },
      'vegetative': { height: 0.5, foliageRadius: 0.5, trunkHeight: 0.25, trunkRadius: 0.08, color: '#5C4033', foliageColor: '#32CD32', hasFruit: false },
      'flowering': { height: 0.7, foliageRadius: 0.6, trunkHeight: 0.35, trunkRadius: 0.08, color: '#5C4033', foliageColor: '#FFD700', hasFruit: false },
      'fruiting': { height: 0.8, foliageRadius: 0.7, trunkHeight: 0.4, trunkRadius: 0.1, color: '#5C4033', foliageColor: '#2E8B57', hasFruit: true, fruitColor: '#228B22', fruitCount: 2 },
      'mature': { height: 0.9, foliageRadius: 0.8, trunkHeight: 0.45, trunkRadius: 0.12, color: '#8B4513', foliageColor: '#006400', hasFruit: true, fruitColor: '#006400', fruitCount: 3 },
    },
  },
  'default': {
    type: 'Vegetable',
    growthStages: {
      'seed': { height: 0.1, foliageRadius: 0.1, trunkHeight: 0, trunkRadius: 0, color: '#8B4513', foliageColor: '#8B4513', hasFruit: false },
      'seedling': { height: 0.3, foliageRadius: 0.2, trunkHeight: 0.15, trunkRadius: 0.05, color: '#5C4033', foliageColor: '#228B22', hasFruit: false },
      'vegetative': { height: 0.6, foliageRadius: 0.35, trunkHeight: 0.3, trunkRadius: 0.08, color: '#5C4033', foliageColor: '#32CD32', hasFruit: false },
      'flowering': { height: 0.8, foliageRadius: 0.4, trunkHeight: 0.4, trunkRadius: 0.08, color: '#5C4033', foliageColor: '#228B22', hasFruit: false },
      'fruiting': { height: 0.9, foliageRadius: 0.45, trunkHeight: 0.45, trunkRadius: 0.1, color: '#5C4033', foliageColor: '#2E8B57', hasFruit: true, fruitColor: '#FF6347', fruitCount: 3 },
      'mature': { height: 1.0, foliageRadius: 0.5, trunkHeight: 0.5, trunkRadius: 0.1, color: '#8B4513', foliageColor: '#006400', hasFruit: true, fruitColor: '#FF4500', fruitCount: 5 },
    },
  },
};

// Helper function to map plant names to model types
function getModelTypeFromPlantName(plantName: string): string {
  const lowerName = plantName.toLowerCase();
  
  const modelMap: Record<string, string> = {
    'tomato': 'tomato',
    'pepper': 'pepper',
    'lettuce': 'lettuce',
    'basil': 'basil',
    'strawberry': 'strawberry',
    'carrot': 'default',
    'zucchini': 'default',
    'corn': 'default',
    'sunflower': 'default',
    'rose': 'default',
  };
  
  for (const [key, value] of Object.entries(modelMap)) {
    if (lowerName.includes(key)) {
      return value;
    }
  }
  
  return 'default';
}

// Get plant model config by plant name (case-insensitive)
export function getPlantModel(plantName: string, customModelType?: string): PlantModelConfig {
  // Use custom model type if provided
  const modelKey = customModelType || getModelTypeFromPlantName(plantName);
  
  // Return the model config or default
  return plantModels[modelKey] || plantModels['default'];
}

// Plant Model Component
interface PlantModelProps {
  plantName: string;
  growthStage: string;
  customModelType?: string;  // Override default model type
  customColor?: string;       // Override default foliage color
  onClick?: () => void;
}

export function PlantModel({ 
  plantName, 
  growthStage, 
  customModelType, 
  customColor,
  onClick 
}: PlantModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  
  // Get the plant model configuration
  const config = getPlantModel(plantName, customModelType);
  const stageKey = growthStage?.toLowerCase() || 'vegetative';
  const stageConfig = config.growthStages[stageKey] || config.growthStages['vegetative'] || plantModels['default'].growthStages['vegetative'];
  
  const height = stageConfig.height;
  const foliageRadius = stageConfig.foliageRadius;
  const trunkHeight = stageConfig.trunkHeight;
  const trunkRadius = stageConfig.trunkRadius;
  const color = stageConfig.color;
  // Use custom color if provided, otherwise use stage default
  const foliageColor = customColor || stageConfig.foliageColor;
  const hasFruit = stageConfig.hasFruit;
  const fruitColor = stageConfig.fruitColor || '#FF6347';
  const fruitCount = stageConfig.fruitCount || 3;
  
  // Debug logging
  console.log(`🌿 Rendering PlantModel: ${plantName}, stage: ${growthStage}, model: ${customModelType || 'auto'}, color: ${foliageColor}`);
  
  // Gentle swaying animation
  useFrame((state) => {
    if (groupRef.current && growthStage !== 'seed' && growthStage !== 'seedling') {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.03;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.01;
    }
  });
  
  return (
    <group
      ref={groupRef}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Trunk/Stem */}
      {trunkHeight > 0 && (
        <Cylinder
          args={[trunkRadius, trunkRadius * 1.2, trunkHeight]}
          position={[0, -trunkHeight / 2, 0]}
          castShadow
        >
          <meshStandardMaterial color={color} roughness={0.6} />
        </Cylinder>
      )}
      
      {/* Main foliage */}
      <group position={[0, trunkHeight, 0]}>
        {/* Bottom foliage layer */}
        <Sphere args={[foliageRadius * 0.8, 16, 16]} position={[0, height * 0.2, 0]}>
          <meshStandardMaterial color={foliageColor} roughness={0.4} />
        </Sphere>
        
        {/* Middle foliage layer */}
        <Sphere args={[foliageRadius * 0.6, 16, 16]} position={[0, height * 0.5, 0]}>
          <meshStandardMaterial color={foliageColor} roughness={0.4} />
        </Sphere>
        
        {/* Top foliage layer */}
        <Sphere args={[foliageRadius * 0.4, 16, 16]} position={[0, height * 0.8, 0]}>
          <meshStandardMaterial color={foliageColor} roughness={0.4} />
        </Sphere>
        
        {/* Fruits */}
        {hasFruit && (
          <group>
            {[...Array(fruitCount)].map((_, i) => {
              const angle = (i / fruitCount) * Math.PI * 2;
              const radius = foliageRadius * 0.7;
              const x = Math.cos(angle) * radius;
              const z = Math.sin(angle) * radius;
              const yOffset = height * 0.4 + (i * 0.05);
              
              return (
                <Sphere
                  key={i}
                  args={[0.12, 16, 16]}
                  position={[x, yOffset, z]}
                >
                  <meshStandardMaterial 
                    color={fruitColor} 
                    emissive={fruitColor}
                    emissiveIntensity={0.2}
                    roughness={0.3}
                    metalness={0.1}
                  />
                </Sphere>
              );
            })}
          </group>
        )}
      </group>
      
      {/* Hover info */}
      {hovered && (
        <Html distanceFactor={10}>
          <div className="bg-black/80 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50">
            🌱 {plantName}
            <br />
            Stage: {growthStage}
          </div>
        </Html>
      )}
    </group>
  );
}