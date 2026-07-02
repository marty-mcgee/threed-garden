// src/components/threed/GardenPlant.tsx
'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// Import procedural plant models as fallback
import { PlantModel } from './PlantModels';

// Types
interface GardenPlantData {
  id: number;
  plantId: number;
  plantName: string;
  plantType: string;
  quantity: number;
  positionX: number;
  positionY: number;
  positionZ: number;
  growthStage: string;
  bedId: number;
  modelId?: number | null;
  model?: {
    id: number;
    modelName: string;
    modelType: string;
    filePath: string;
    scale: string;
    rotationY: string;
    offsetX: string;
    offsetY: string;
    offsetZ: string;
    animations: any[];
  };
}

interface GardenPlantProps {
  plant: GardenPlantData;
  onClick?: () => void;
}

// Growth stage scale multipliers
const GROWTH_SCALES: Record<string, number> = {
  'seed': 0.1,
  'seedling': 0.3,
  'vegetative': 0.6,
  'flowering': 0.8,
  'fruiting': 1.0,
  'mature': 1.2,
  'dormant': 0.5
};

// Model cache for performance
const modelCache = new Map<string, THREE.Group>();

// Custom 3D Model Component
function CustomModel({ 
  modelPath, 
  modelType, 
  position, 
  scale = 1, 
  rotationY = 0,
  offsetY = 0,
  growthStage = 'vegetative',
  plantName,
  onClick 
}: { 
  modelPath: string; 
  modelType: string;
  position: [number, number, number];
  scale?: number;
  rotationY?: number;
  offsetY?: number;
  growthStage?: string;
  plantName?: string;
  onClick?: () => void;
}) {
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [error, setError] = useState<string | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const isLoadingRef = useRef(false);

  const growthScale = GROWTH_SCALES[growthStage] || 0.6;
  const finalScale = scale * growthScale;

  useEffect(() => {
    if (isLoadingRef.current || !modelPath) return;

    const loadModel = async () => {
      isLoadingRef.current = true;
      
      try {
        const cacheKey = `${modelPath}-${modelType}`;
        let loadedModel: THREE.Group;
        
        if (modelCache.has(cacheKey)) {
          loadedModel = modelCache.get(cacheKey)!.clone();
        } else {
          const loader = modelType.toLowerCase() === 'fbx' ? new FBXLoader() : new GLTFLoader();
          const result = await loader.loadAsync(modelPath);
          loadedModel = modelType.toLowerCase() === 'fbx' ? result as THREE.Group : (result as any).scene;
          modelCache.set(cacheKey, loadedModel.clone());
        }
        
        loadedModel.scale.setScalar(finalScale);
        loadedModel.rotation.y = (rotationY * Math.PI) / 180;
        loadedModel.position.y = offsetY;
        
        loadedModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        setModel(loadedModel);
      } catch (err) {
        console.error(`Error loading model ${modelPath}:`, err);
        setError(err.message);
      } finally {
        isLoadingRef.current = false;
      }
    };

    loadModel();
  }, [modelPath, modelType, finalScale, rotationY, offsetY]);

  // Gentle sway animation for mature plants
  useFrame(({ clock }) => {
    if (groupRef.current && (growthStage === 'fruiting' || growthStage === 'mature')) {
      const sway = Math.sin(clock.getElapsedTime() * 1.5) * 0.02;
      groupRef.current.rotation.z = sway;
    }
  });

  if (error || !model) {
    // Fallback to colored cube
    return (
      <group position={position}>
        <mesh castShadow receiveShadow onClick={onClick}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color="#888888" transparent opacity={0.5} />
        </mesh>
      </group>
    );
  }

  return (
    <group 
      ref={groupRef}
      position={position}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <primitive object={model} />
      {hovered && (
        <Html position={[0, 1.5, 0]} center>
          <div className="bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
            {plantName || 'Plant'} - {growthStage}
          </div>
        </Html>
      )}
    </group>
  );
}

// Main GardenPlant Component
export function GardenPlant({ plant, onClick }: GardenPlantProps) {
  const { positionX, positionY, positionZ, quantity, growthStage, plantName, model } = plant;
  
  // Position
  const posX = positionX ?? 0;
  const posY = positionY ?? 0;
  const posZ = positionZ ?? 0;
  
  // Spacing for multiple plants
  const spacing = 1.2;
  const offset = (quantity - 1) * spacing / 2;
  
  // Check if we have a custom model
  const hasCustomModel = model?.filePath && model?.modelType;
  
  // Get model transform properties
  const modelScale = model?.scale ? parseFloat(model.scale) : 1;
  const modelRotation = model?.rotationY ? parseFloat(model.rotationY) : 0;
  const modelOffsetY = model?.offsetY ? parseFloat(model.offsetY) : 0;
  
  // Single plant with custom model
  if (hasCustomModel && quantity === 1) {
    return (
      <CustomModel
        key={`${plant.id}-custom-model-1`}
        modelPath={model!.filePath}
        modelType={model!.modelType}
        position={[posX, posY + modelOffsetY, posZ]}
        scale={modelScale}
        rotationY={modelRotation}
        growthStage={growthStage}
        plantName={plantName}
        onClick={onClick}
      />
    );
  }
  
  // Multiple plants with custom models
  if (hasCustomModel && quantity > 1) {
    return (
      <group position={[posX, posY, posZ]}>
        {Array.from({ length: quantity }).map((_, i) => {
          const xOffset = (i * spacing) - offset;
          return (
            <CustomModel
              key={`${plant.id}-custom-model-${i}`}
              modelPath={model!.filePath}
              modelType={model!.modelType}
              position={[xOffset, modelOffsetY, 0]}
              scale={modelScale}
              rotationY={modelRotation}
              growthStage={growthStage}
              plantName={plantName}
              onClick={onClick}
            />
          );
        })}
      </group>
    );
  }
  
  // Single plant with procedural model
  if (quantity === 1) {
    return (
      <group key={`${plant.id}-procedural-single`} position={[posX, posY, posZ]}>
        <PlantModel
          plantName={plantName}
          growthStage={growthStage}
          onClick={onClick}
        />
      </group>
    );
  }
  
  // Multiple plants with procedural models
  return (
    <group position={[posX, posY, posZ]}>
      {Array.from({ length: quantity }).map((_, i) => {
        const xOffset = (i * spacing) - offset;
        return (
          <group key={`${plant.id}-procedural-${i}`} position={[xOffset, 0, 0]}>
            <PlantModel
              plantName={plantName}
              growthStage={growthStage}
              onClick={onClick}
            />
          </group>
        );
      })}
    </group>
  );
}

export default GardenPlant;