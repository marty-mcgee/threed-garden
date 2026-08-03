// components/threed/layers/CharacterLayer.tsx
'use client';

import { CharacterData } from '@/lib/types/threed';
import { GardenCharacter } from '@/components/threed/shared/GardenCharacter';

interface CharacterLayerProps {
  characters: CharacterData[];
  currentWeather?: string;
  currentHour?: number;
}

export function CharacterLayer({
  characters,
  currentWeather = 'sunny',
  currentHour = 12,
}: CharacterLayerProps) {
  if (!characters || characters.length === 0) return null;

  return (
    <group>
      {characters.map((character) => (
        <GardenCharacter
          key={`character-${character.id}`}
          character={character}
          currentWeather={currentWeather}
          currentHour={currentHour}
        />
      ))}
    </group>
  );
}