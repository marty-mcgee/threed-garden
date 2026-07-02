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

// ===== TRAFFIC =====
export interface TrafficIncident3D {
  id: string;
  type: 'chp' | 'caltrans' | '511' | 'calfire';
  title: string;
  description: string;
  location: string;
  lat: number;
  lng: number;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  source: string;
}

// ===== GARDEN =====
export interface GardenBed3D {
  id: string;
  name: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  color?: string;
}

export interface Plant3D {
  id: string;
  name: string;
  species: string;
  x: number;
  z: number;
  growthStage: 'seed' | 'seedling' | 'vegetative' | 'flowering' | 'fruiting' | 'mature';
  plantedAt: string;
}

// ===== FARMBOT =====
export interface FarmBot3D {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'busy' | 'error';
  x: number;
  z: number;
  battery: number;
  lastSeen: string;
}

// ===== WEATHER =====
export interface Weather3D {
  temperature: number;
  conditions: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'foggy';
  humidity: number;
  windSpeed: number;
  precipitation: number;
}

// ===== LAYER VISIBILITY =====
export interface LayerVisibility {
  traffic: boolean;
  garden: boolean;
  farmbots: boolean;
  weather: boolean;
}

// ===== MAIN DATA TYPE =====
export interface ThreeDData {
  traffic: TrafficIncident3D[];
  beds: GardenBed3D[];
  plants: Plant3D[];
  farmbots: FarmBot3D[];
  weather: Weather3D | null;
}