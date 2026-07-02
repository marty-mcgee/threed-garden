// src/components/threed/GLTFPlant.tsx - New component
'use client';
import { useGLTF } from '@react-three/drei';
import { useEffect, useState } from 'react';

interface GLTFPlantProps {
  modelPath: string;
  position: [number, number, number];
  scale?: number;
  growthStage?: string;
}

export function GLTFPlant({ modelPath, position, scale = 1, growthStage }: GLTFPlantProps) {
  const { scene } = useGLTF(modelPath);
  const [clonedScene, setClonedScene] = useState<THREE.Group>();
  
  useEffect(() => {
    if (scene) {
      const clone = scene.clone();
      // Scale based on growth stage
      const stageScale = getGrowthStageScale(growthStage);
      clone.scale.setScalar(scale * stageScale);
      setClonedScene(clone);
    }
  }, [scene, scale, growthStage]);
  
  return clonedScene ? <primitive object={clonedScene} position={position} /> : null;
}

// Growth stage scale mapping
function getGrowthStageScale(stage?: string): number {
  const scales = { seed: 0.1, seedling: 0.3, vegetative: 0.6, flowering: 0.8, fruiting: 1.0, mature: 1.2 };
  return scales[stage as keyof typeof scales] || 1;
}

// Preload models
useGLTF.preload('/models/tomato.glb');
useGLTF.preload('/models/basil.glb');