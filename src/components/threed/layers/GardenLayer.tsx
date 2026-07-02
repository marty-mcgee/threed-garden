// components/threed/layers/GardenLayer.tsx
'use client';

import { GardenBed3D, Plant3D } from '@/lib/types/threed';
import { PlantMarker3D } from '../markers/PlantMarker3D';
import { BedMarker3D } from '../markers/BedMarker3D';

interface GardenLayerProps {
  beds: GardenBed3D[];
  plants: Plant3D[];
}

export function GardenLayer({ beds, plants }: GardenLayerProps) {
  return (
    <group>
      {/* Render beds */}
      {beds?.map((bed) => (
        <BedMarker3D
          key={bed.id}
          bed={bed}
          position={[bed.x || 0, 0, bed.z || 0]}
        />
      ))}

      {/* Render plants */}
      {plants?.map((plant) => (
        <PlantMarker3D
          key={plant.id}
          plant={plant}
          position={[plant.x || 0, 0, plant.z || 0]}
        />
      ))}
    </group>
  );
}