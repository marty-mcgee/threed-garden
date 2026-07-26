// src/lib/types/threed.ts

// ============================================
// ENUMS
// ============================================

export enum PlantType {
  VEGETABLE = 'Vegetable',
  FRUIT = 'Fruit',
  HERB = 'Herb',
  FLOWER = 'Flower',
  TREE = 'Tree',
  SHRUB = 'Shrub',
  COVER_CROP = 'CoverCrop',
}

export enum PlantStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

export enum GrowthHabit {
  UPRIGHT = 'Upright',
  TRAILING = 'Trailing',
  BUSH = 'Bush',
  VINING = 'Vining',
  CLUMPING = 'Clumping',
  SPREADING = 'Spreading',
}

export enum SunlightRequirement {
  FULL_SUN = 'Full Sun',
  PARTIAL_SUN = 'Partial Sun',
  PARTIAL_SHADE = 'Partial Shade',
  FULL_SHADE = 'Full Shade',
}

export enum WaterNeeds {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
}

export enum PlantingStatus {
  PLANNED = 'planned',
  PLANTED = 'planted',
  GROWING = 'growing',
  HARVESTING = 'harvesting',
  HARVESTED = 'harvested',
  FAILED = 'failed',
}

export enum GrowthStage {
  SEED = 'seed',
  SEEDLING = 'seedling',
  VEGETATIVE = 'vegetative',
  FLOWERING = 'flowering',
  FRUITING = 'fruiting',
  MATURE = 'mature',
  DORMANT = 'dormant',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum BedShape {
  RECTANGLE = 'rectangle',
  SQUARE = 'square',
  CIRCLE = 'circle',
  RAISED = 'raised',
  CONTAINER = 'container',
  CUSTOM = 'custom',
}

export enum FarmbotStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance',
  ERROR = 'error',
}

export enum ModelType {
  PROCEDURAL = 'procedural',
  GLTF = 'gltf',
  GLB = 'glb',
  FBX = 'fbx',
  USDZ = 'usdz',
  OBJ = 'obj',
  HERB_GENERIC = 'herb-generic',
  VEGETABLE_GENERIC = 'vegetable-generic',
  FLOWER_GENERIC = 'flower-generic',
  FRUIT_GENERIC = 'fruit-generic',
  TREE_GENERIC = 'tree-generic',
  CUSTOM = 'custom',
}

export enum CharacterType {
  ANIMAL = 'animal',
  BIRD = 'bird',
  INSECT = 'insect',
  MYTHICAL = 'mythical',
  HUMAN = 'human',
  ROBOT = 'robot',
  DECORATION = 'decoration',
}

// ============================================
// INTERFACES
// ============================================

export interface ThreeDPlant {
  id: number;
  userId: string;
  plantId: string;
  commonName: string;
  scientificName: string | null;
  variety: string | null;
  family: string | null;
  type: PlantType;
  status: PlantStatus;
  modelId: number | null;
  growthHabit: GrowthHabit | null;
  daysToMaturity: number | null;
  daysToGermination: number | null;
  daysToHarvest: number | null;
  spacingInches: number | null;
  rowSpacingInches: number | null;
  plantingDepthInches: number | null;
  sunlight: SunlightRequirement | null;
  waterNeeds: WaterNeeds | null;
  soilType: string | null;
  soilPH: number | null;
  hardinessZone: string | null;
  frostTolerant: boolean;
  perennial: boolean;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  description: string | null;
  careInstructions: string | null;
  harvestInstructions: string | null;
  companionPlants: string | null;
  avoidPlants: string | null;
  source: string | null;
  rawData: any;
  createdAt: string;
  updatedAt: string;
}

export interface ThreeDPlantFormData {
  commonName: string;
  scientificName: string;
  variety: string;
  family: string;
  type: PlantType;
  status: PlantStatus;
  growthHabit: string;
  daysToMaturity: string;
  daysToGermination: string;
  daysToHarvest: string;
  spacingInches: string;
  rowSpacingInches: string;
  plantingDepthInches: string;
  sunlight: SunlightRequirement;
  waterNeeds: WaterNeeds;
  soilType: string;
  soilPH: string;
  hardinessZone: string;
  frostTolerant: boolean;
  perennial: boolean;
  imageUrl: string;
  thumbnailUrl: string;
  description: string;
  careInstructions: string;
  harvestInstructions: string;
  companionPlants: string;
  avoidPlants: string;
}

export interface ThreeDBed {
  id: number;
  userId: string;
  bedId: string;
  name: string;
  description: string | null;
  shape: BedShape;
  widthFeet: number | null;
  lengthFeet: number | null;
  squareFeet: number | null;
  heightFeet: number | null;
  soilType: string | null;
  sunExposure: string | null;
  positionX: number | null;
  positionY: number | null;
  positionZ: number | null;
  rotation: number | null;
  scale: number | null;
  isActive: boolean;
  color: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ThreeDModel {
  id: number;
  userId: string;
  modelName: string;
  modelType: ModelType;
  filePath: string;
  fileSize: number | null;
  thumbnailUrl: string | null;
  scale: number | null;
  rotationY: number | null;
  offsetX: number | null;
  offsetY: number | null;
  offsetZ: number | null;
  hasLOD: boolean;
  lodLevels: any;
  animations: any[];
  defaultAnimation: string | null;
  hasExternalFiles: boolean;
  textureCount: number;
  isActive: boolean;
  isDefault: boolean;
  uploadedBy: string | null;
  uploadedAt: string | null;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

export interface ThreeDCharacter {
  id: number;
  userId: string;
  characterId: string;
  name: string;
  description: string | null;
  type: CharacterType;
  status: string;
  modelId: number | null;
  animations: string[];
  defaultAnimation: string | null;
  animationSpeed: number | null;
  isMovable: boolean;
  movementType: string | null;
  movementPattern: string | null;
  movementRadius: number | null;
  movementSpeed: number | null;
  patrolWaypoints: any[];
  followTarget: string | null;
  followDistance: number | null;
  teleportPositions: any[];
  teleportInterval: number | null;
  interactable: boolean;
  interactionMessage: string | null;
  soundEffect: string | null;
  defaultEmote: string | null;
  emoteOnInteract: string | null;
  activeStartHour: number | null;
  activeEndHour: number | null;
  weatherSensitivity: string | null;
  bedId: number | null;
  positionX: number | null;
  positionY: number | null;
  positionZ: number | null;
  rotation: number | null;
  scale: number | null;
  scaleMultiplier: number | null;
  colorTint: string | null;
  visible: boolean;
  visibleDistance: number | null;
  isActive: boolean;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

export interface ThreeDSelectOption {
  value: string;
  label: string;
}

// ============================================
// OPTION LISTS (for dropdowns)
// ============================================

export const PLANT_TYPE_OPTIONS: ThreeDSelectOption[] = [
  { value: PlantType.VEGETABLE, label: 'Vegetable' },
  { value: PlantType.FRUIT, label: 'Fruit' },
  { value: PlantType.HERB, label: 'Herb' },
  { value: PlantType.FLOWER, label: 'Flower' },
  { value: PlantType.TREE, label: 'Tree' },
  { value: PlantType.SHRUB, label: 'Shrub' },
  { value: PlantType.COVER_CROP, label: 'Cover Crop' },
];

export const PLANT_STATUS_OPTIONS: ThreeDSelectOption[] = [
  { value: PlantStatus.ACTIVE, label: 'Active' },
  { value: PlantStatus.INACTIVE, label: 'Inactive' },
  { value: PlantStatus.ARCHIVED, label: 'Archived' },
];

export const SUNLIGHT_OPTIONS: ThreeDSelectOption[] = [
  { value: SunlightRequirement.FULL_SUN, label: 'Full Sun' },
  { value: SunlightRequirement.PARTIAL_SUN, label: 'Partial Sun' },
  { value: SunlightRequirement.PARTIAL_SHADE, label: 'Partial Shade' },
  { value: SunlightRequirement.FULL_SHADE, label: 'Full Shade' },
];

export const WATER_NEEDS_OPTIONS: ThreeDSelectOption[] = [
  { value: WaterNeeds.LOW, label: 'Low' },
  { value: WaterNeeds.MEDIUM, label: 'Medium' },
  { value: WaterNeeds.HIGH, label: 'High' },
];

export const GROWTH_HABIT_OPTIONS: ThreeDSelectOption[] = [
  { value: GrowthHabit.UPRIGHT, label: 'Upright' },
  { value: GrowthHabit.TRAILING, label: 'Trailing' },
  { value: GrowthHabit.BUSH, label: 'Bush' },
  { value: GrowthHabit.VINING, label: 'Vining' },
  { value: GrowthHabit.CLUMPING, label: 'Clumping' },
  { value: GrowthHabit.SPREADING, label: 'Spreading' },
];

export const BED_SHAPE_OPTIONS: ThreeDSelectOption[] = [
  { value: BedShape.RECTANGLE, label: 'Rectangle' },
  { value: BedShape.SQUARE, label: 'Square' },
  { value: BedShape.CIRCLE, label: 'Circle' },
  { value: BedShape.RAISED, label: 'Raised' },
  { value: BedShape.CONTAINER, label: 'Container' },
  { value: BedShape.CUSTOM, label: 'Custom' },
];

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ThreeDPlantsResponse {
  success: boolean;
  data: ThreeDPlant[];
  pagination?: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface ThreeDPlantResponse {
  success: boolean;
  data: ThreeDPlant;
}

export interface ThreeDPlantDeleteResponse {
  success: boolean;
  message: string;
}

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
  type: 'chpLive' | 'chpHistorical' | 'caltrans' | 'bayarea511' | 'calfire';
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