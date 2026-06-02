// src/lib/types/threed.ts

export interface CharacterData {
  id: number;
  characterId: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  modelId: number | null;
  model?: {
    id: number;
    modelName: string;
    modelType: string;
    filePath: string;
    scale: string;
    rotationY: string;
    animations: string[];
  };
  defaultAnimation: string;
  animationSpeed: number;
  movementType: string;
  movementRadius: number;
  movementSpeed: number;
  patrolWaypoints: { x: number; y: number; z: number }[];
  followTarget: string;
  followDistance: number;
  teleportPositions: { x: number; y: number; z: number; waitSeconds?: number }[];
  teleportInterval: number;
  interactable: boolean;
  interactionMessage: string;
  soundEffect?: string;
  defaultEmote: string;
  emoteOnInteract?: string;
  activeStartHour: number;
  activeEndHour: number;
  weatherSensitivity?: string;
  bedId?: number | null;
  positionX: number;
  positionY: number;
  positionZ: number;
  rotation: number;
  scale: number;
  scaleMultiplier?: number;
  colorTint?: string;
  visible: boolean;
  visibleDistance?: number;
  isActive: boolean;
  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface Bed {
  id: number;
  name: string;
  shape: string;
  widthFeet: number;
  lengthFeet: number;
  positionX: number;
  positionY: number;
  positionZ: number;
  color: string;
}

export interface GardenPlantData {
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

export interface WeatherData {
  temperature: number;
  condition: string;
  rainfall: number;
}