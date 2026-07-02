// components/threed/layers/FarmBotLayer.tsx
'use client';

import { FarmBot3D } from '@/lib/types/threed';
import { FarmBotMarker3D } from '../markers/FarmBotMarker3D';

interface FarmBotLayerProps {
  farmbots: FarmBot3D[];
}

export function FarmBotLayer({ farmbots }: FarmBotLayerProps) {
  if (!farmbots || farmbots.length === 0) {
    return null;
  }

  return (
    <group>
      {farmbots.map((farmbot) => (
        <FarmBotMarker3D
          key={farmbot.id}
          farmbot={farmbot}
          position={[farmbot.x || 0, 0, farmbot.z || 0]}
        />
      ))}
    </group>
  );
}