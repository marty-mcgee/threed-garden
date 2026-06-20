// src/components/threed/GardenPlant.tsx
'use client';

import { PlantModel } from './PlantModels';

interface GardenPlantProps {
  planting: {
    id: number;
    plantId: number;
    plantName: string;
    plantType: string;
    quantity: number;
    positionX: number;
    positionY: number;
    positionZ: number;
    growthStage: string;
    daysToMaturity: number;
    bedId: number;
    modelType?: string;      // Optional: override default 3D model
    customColor?: string;    // Optional: override foliage color
    fruitColor?: string;     // Optional: override fruit color
  };
  onClick?: () => void;
}

export function GardenPlant({ planting, onClick }: GardenPlantProps) {
  // Debug logging
  console.log(`🌱 Rendering GardenPlant:`, {
    id: planting.id,
    name: planting.plantName,
    quantity: planting.quantity,
    position: { x: planting.positionX, y: planting.positionY, z: planting.positionZ },
    bedId: planting.bedId,
    growthStage: planting.growthStage,
    modelType: planting.modelType,
    customColor: planting.customColor
  });
  
  // If no position is set, default to (0,0,0) which is the center of the bed
  const posX = planting.positionX ?? 0;
  const posY = planting.positionY ?? 0;
  const posZ = planting.positionZ ?? 0;
  
  // Spacing between individual plants in the same planting
  const spacing = 1.2; // feet between plants
  const offset = (planting.quantity - 1) * spacing / 2;
  
  return (
    <group position={[posX, posY, posZ]}>
      {Array.from({ length: planting.quantity }).map((_, i) => {
        const xOffset = (i * spacing) - offset;
        
        return (
          <PlantModel
            key={`${planting.id}-${i}`}
            plantName={planting.plantName}
            growthStage={planting.growthStage}
            customModelType={planting.modelType}
            customColor={planting.customColor}
            onClick={onClick}
          />
        );
      })}
    </group>
  );
}