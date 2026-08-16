// src/lib/types/character-actions.ts

export const CHARACTER_TASK_ACTIONS = [
  { action: 'watering', label: 'Water', icon: '💧' },
  { action: 'digAndPlantSeeds', label: 'Dig + Plant Seeds', icon: '🌱' },
  { action: 'plantAPlant', label: 'Plant', icon: '🪴' },
  { action: 'plantTree', label: 'Plant Tree', icon: '🌳' },
  { action: 'pullPlant', label: 'Pull Plant', icon: '🌿' },
  { action: 'pickFruit', label: 'Pick Fruit', icon: '🍎' },
  { action: 'cowMilking', label: 'Milk Cow', icon: '🥛' },
  { action: 'point', label: 'Point', icon: '👉' },
  { action: 'talk', label: 'Talk', icon: '💬' },
] as const;

export type CharacterTaskAction =
  (typeof CHARACTER_TASK_ACTIONS)[number]['action'];

export interface CharacterActionRequest {
  characterId: number;
  action: CharacterTaskAction;
}
