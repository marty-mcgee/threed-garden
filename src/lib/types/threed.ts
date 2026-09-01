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

export enum BedShape {
  RECTANGLE = 'rectangle',
  SQUARE = 'square',
  CIRCLE = 'circle',
  RAISED = 'raised',
  CONTAINER = 'container',
  CUSTOM = 'custom',
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

export type ThreeDModelFileType =
  | 'model'
  | 'texture'
  | 'binary'
  | 'animation'
  | 'other'

export interface ThreeDModelFile {
  id: number
  modelId: number
  fileName: string
  relativePath: string
  fileType: ThreeDModelFileType
  textureType: string | null
  filePath: string
  fileSize: number | null
  isBinaryBuffer: boolean
  loadOrder: number
  metadata?: {
    action?: string
    sourceClip?: string
    looping?: boolean
  }
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
  modelFiles?: ThreeDModelFile[];
  textureCount: number;
  isActive: boolean;
  isDefault: boolean;
  isPublic: boolean;
  isLibraryItem: boolean;
  uploadedBy: string | null;
  uploadedAt: string | null;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

/** Client-safe model record returned by the shared ThreeD Model Library. */
export interface ThreeDModelLibraryItem {
  id: number;
  modelName: string;
  modelType: ModelType;
  filePath: string;
  fileSize: number | null;
  thumbnailUrl: string | null;
  usedByPlants: boolean | null;
  usedByCharacters: boolean | null;
  scale: string | number | null;
  rotationY: string | number | null;
  offsetX: string | number | null;
  offsetY: string | number | null;
  offsetZ: string | number | null;
  animations: unknown;
  defaultAnimation: string | null;
  metadata?: unknown;
  isPublic: boolean;
  isLibraryItem: boolean;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
    parentId: number | null;
  }>;
}

/** Owner-scoped Character record eligible for Garden/Ecctrl Project placement. */
export interface ThreeDCharacterLibraryItem {
  id: number;
  name: string;
  type: string | null;
  isMovable: boolean | null;
  movementType: string | null;
  scale: string | number | null;
  scaleMultiplier: string | number | null;
  model: ThreeDModel;
  libraryAccess: {
    eligible: true;
    runtime: 'garden' | 'ecctrl';
    issues: [];
  };
}

/** Project-owned placement of a reusable ThreeD Model Library asset. */
export interface ProjectThreeDModelInstance {
  id: number;
  userId: string;
  projectId: number;
  threedId: number;
  modelId: number;
  instanceName: string | null;
  positionX: string | number;
  positionY: string | number;
  positionZ: string | number;
  rotationX: string | number;
  rotationY: string | number;
  rotationZ: string | number;
  scaleMultiplier: string | number;
  isVisible: boolean;
  isActive: boolean;
  metadata: unknown;
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
  type: 'chpLive' | 'chpHistorical' | 'caltrans' | 'bay-area-511' | 'calfire';
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
  characters: boolean;
}

// ===== MAIN DATA TYPE =====
export interface ThreeDData {
  traffic: TrafficIncident3D[];
  beds: GardenBed3D[];
  plants: Plant3D[];
  farmbots: FarmBot3D[];
  weather: Weather3D | null;
  characters: CharacterData[];
}














// lib/types/threed.ts

// ============================================
// ENUMS (Add these)
// ============================================

// export enum ModelType {
//   PROCEDURAL = 'procedural',
//   GLTF = 'gltf',
//   GLB = 'glb',
//   FBX = 'fbx',
//   USDZ = 'usdz',
//   OBJ = 'obj',
//   HERB_GENERIC = 'herb-generic',
//   VEGETABLE_GENERIC = 'vegetable-generic',
//   FLOWER_GENERIC = 'flower-generic',
//   FRUIT_GENERIC = 'fruit-generic',
//   TREE_GENERIC = 'tree-generic',
//   CUSTOM = 'custom',
// }

export enum ModelStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

// ============================================
// INTERFACES (Add these)
// ============================================

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
  usedByPlants: boolean;
  usedByCharacters: boolean;
  metadata: any;
  createdAt: string;
  updatedAt: string;
  // ✅ Project asset associations (returned from API)
  projectAssets?: any[];
}

export interface ThreeDModelFormData {
  modelName: string;
  modelType: ModelType;
  filePath: string;
  fileSize: string;
  thumbnailUrl: string;
  scale: string;
  rotationY: string;
  offsetX: string;
  offsetY: string;
  offsetZ: string;
  hasLOD: boolean;
  animations: string;
  defaultAnimation: string;
  hasExternalFiles: boolean;
  textureCount: string;
  isActive: boolean;
  isDefault: boolean;
  usedByPlants: boolean;
  usedByCharacters: boolean;
  uploadedBy: string;
}

// ============================================
// OPTIONS (Add these)
// ============================================

export const MODEL_TYPE_OPTIONS: ThreeDSelectOption[] = [
  { value: ModelType.PROCEDURAL, label: 'Procedural' },
  { value: ModelType.GLTF, label: 'GLTF' },
  { value: ModelType.GLB, label: 'GLB' },
  { value: ModelType.FBX, label: 'FBX' },
  { value: ModelType.USDZ, label: 'USDZ' },
  { value: ModelType.OBJ, label: 'OBJ' },
  { value: ModelType.HERB_GENERIC, label: 'Herb (Generic)' },
  { value: ModelType.VEGETABLE_GENERIC, label: 'Vegetable (Generic)' },
  { value: ModelType.FLOWER_GENERIC, label: 'Flower (Generic)' },
  { value: ModelType.FRUIT_GENERIC, label: 'Fruit (Generic)' },
  { value: ModelType.TREE_GENERIC, label: 'Tree (Generic)' },
  { value: ModelType.CUSTOM, label: 'Custom' },
];

export const MODEL_STATUS_OPTIONS: ThreeDSelectOption[] = [
  { value: ModelStatus.ACTIVE, label: 'Active' },
  { value: ModelStatus.INACTIVE, label: 'Inactive' },
  { value: ModelStatus.ARCHIVED, label: 'Archived' },
];















// lib/types/threed.ts

// ============================================
// CHARACTER ENUMS
// ============================================

export enum CharacterType {
  ANIMAL = 'animal',
  BIRD = 'bird',
  INSECT = 'insect',
  MYTHICAL = 'mythical',
  HUMAN = 'human',
  ROBOT = 'robot',
  DECORATION = 'decoration',
}

export enum CharacterStatus {
  ACTIVE = 'active',
  IDLE = 'idle',
  SLEEPING = 'sleeping',
  MOVING = 'moving',
  HIDDEN = 'hidden',
}

export enum CharacterAnimation {
  IDLE = 'idle',
  WALK = 'walk',
  RUN = 'run',
  FLY = 'fly',
  DANCE = 'dance',
  SWAY = 'sway',
  FLOAT = 'float',
  SPIN = 'spin',
  BOUNCE = 'bounce',
}

export enum CharacterMovementType {
  STATIONARY = 'stationary',
  WANDER = 'wander',
  PATROL = 'patrol',
  CIRCLE = 'circle',
  FOLLOW = 'follow',
  TELEPORT = 'teleport',
  ECCTRL = 'ecctrl',
}

export enum CharacterWeatherSensitivity {
  ALL = 'all',
  SUNNY_ONLY = 'sunny_only',
  RAINY_ONLY = 'rainy_only',
  NO_RAIN = 'no_rain',
  NO_SNOW = 'no_snow',
}

export enum CharacterEmote {
  NONE = 'none',
  HAPPY = 'happy',
  SAD = 'sad',
  SURPRISED = 'surprised',
  ANGRY = 'angry',
  WAVE = 'wave',
  DANCE = 'dance',
  SLEEP = 'sleep',
}

// ============================================
// CHARACTER INTERFACES
// ============================================

export interface ThreeDCharacter {
  id: number;
  userId: string;
  characterId: string;
  name: string;
  description: string | null;
  type: CharacterType;
  status: CharacterStatus;
  modelId: number | null;
  
  // Model relationships (many-to-many)
  characterModels?: CharacterModelAssociation[];
  
  // Animation
  animations: CharacterAnimation[];
  defaultAnimation: CharacterAnimation | null;
  animationSpeed: number | null;
  
  // Movement
  isMovable: boolean;
  movementType: CharacterMovementType | null;
  movementPattern: string | null;
  movementRadius: number | null;
  movementSpeed: number | null;
  patrolWaypoints: any[];
  followTarget: string | null;
  followDistance: number | null;
  teleportPositions: any[];
  teleportInterval: number | null;
  
  // Interaction
  interactable: boolean;
  interactionMessage: string | null;
  soundEffect: string | null;
  
  // Emotes
  defaultEmote: CharacterEmote | null;
  emoteOnInteract: CharacterEmote | null;
  
  // Time-based activation
  activeStartHour: number | null;
  activeEndHour: number | null;
  
  // Weather sensitivity
  weatherSensitivity: CharacterWeatherSensitivity | null;
  
  // Positioning
  bedId: number | null;
  positionX: number | null;
  positionY: number | null;
  positionZ: number | null;
  rotation: number | null;
  scale: number | null;
  scaleMultiplier: number | null;
  colorTint: string | null;
  
  // Visibility
  visible: boolean;
  visibleDistance: number | null;
  
  // Status
  isActive: boolean;
  metadata: any;
  createdAt: string;
  updatedAt: string;
  
  // Project asset associations
  projectAssets?: any[];
}

export interface CharacterModelAssociation {
  id: number;
  characterId: number;
  modelId: number;
  model?: ThreeDModel;
  config: any;
  isActive: boolean;
}

export interface ThreeDCharacterFormData {
  name: string;
  description: string;
  type: CharacterType;
  status: CharacterStatus;
  
  // Model selection (comma-separated model IDs)
  modelIds: string;
  
  animations: string;
  defaultAnimation: string;
  animationSpeed: string;
  
  isMovable: boolean;
  movementType: string;
  movementPattern: string;
  movementRadius: string;
  movementSpeed: string;
  patrolWaypoints: string;
  followTarget: string;
  followDistance: string;
  teleportPositions: string;
  teleportInterval: string;
  
  interactable: boolean;
  interactionMessage: string;
  soundEffect: string;
  defaultEmote: string;
  emoteOnInteract: string;
  
  activeStartHour: string;
  activeEndHour: string;
  weatherSensitivity: string;
  
  bedId: string;
  positionX: string;
  positionY: string;
  positionZ: string;
  rotation: string;
  scale: string;
  scaleMultiplier: string;
  colorTint: string;
  
  visible: boolean;
  visibleDistance: string;
  isActive: boolean;
}

// ============================================
// CHARACTER OPTIONS
// ============================================

export const CHARACTER_TYPE_OPTIONS: ThreeDSelectOption[] = [
  { value: CharacterType.ANIMAL, label: 'Animal' },
  { value: CharacterType.BIRD, label: 'Bird' },
  { value: CharacterType.INSECT, label: 'Insect' },
  { value: CharacterType.MYTHICAL, label: 'Mythical' },
  { value: CharacterType.HUMAN, label: 'Human' },
  { value: CharacterType.ROBOT, label: 'Robot' },
  { value: CharacterType.DECORATION, label: 'Decoration' },
];

export const CHARACTER_STATUS_OPTIONS: ThreeDSelectOption[] = [
  { value: CharacterStatus.ACTIVE, label: 'Active' },
  { value: CharacterStatus.IDLE, label: 'Idle' },
  { value: CharacterStatus.SLEEPING, label: 'Sleeping' },
  { value: CharacterStatus.MOVING, label: 'Moving' },
  { value: CharacterStatus.HIDDEN, label: 'Hidden' },
];

export const CHARACTER_ANIMATION_OPTIONS: ThreeDSelectOption[] = [
  { value: CharacterAnimation.IDLE, label: 'Idle' },
  { value: CharacterAnimation.WALK, label: 'Walk' },
  { value: CharacterAnimation.RUN, label: 'Run' },
  { value: CharacterAnimation.FLY, label: 'Fly' },
  { value: CharacterAnimation.DANCE, label: 'Dance' },
  { value: CharacterAnimation.SWAY, label: 'Sway' },
  { value: CharacterAnimation.FLOAT, label: 'Float' },
  { value: CharacterAnimation.SPIN, label: 'Spin' },
  { value: CharacterAnimation.BOUNCE, label: 'Bounce' },
];

export const CHARACTER_MOVEMENT_TYPE_OPTIONS: ThreeDSelectOption[] = [
  { value: CharacterMovementType.STATIONARY, label: 'Stationary' },
  { value: CharacterMovementType.WANDER, label: 'Wander' },
  { value: CharacterMovementType.PATROL, label: 'Patrol' },
  { value: CharacterMovementType.CIRCLE, label: 'Circle' },
  { value: CharacterMovementType.FOLLOW, label: 'Follow' },
  { value: CharacterMovementType.TELEPORT, label: 'Teleport' },
];

export const CHARACTER_EMOTE_OPTIONS: ThreeDSelectOption[] = [
  { value: CharacterEmote.NONE, label: 'None' },
  { value: CharacterEmote.HAPPY, label: 'Happy' },
  { value: CharacterEmote.SAD, label: 'Sad' },
  { value: CharacterEmote.SURPRISED, label: 'Surprised' },
  { value: CharacterEmote.ANGRY, label: 'Angry' },
  { value: CharacterEmote.WAVE, label: 'Wave' },
  { value: CharacterEmote.DANCE, label: 'Dance' },
  { value: CharacterEmote.SLEEP, label: 'Sleep' },
];

export const CHARACTER_WEATHER_SENSITIVITY_OPTIONS: ThreeDSelectOption[] = [
  { value: CharacterWeatherSensitivity.ALL, label: 'All Weather' },
  { value: CharacterWeatherSensitivity.SUNNY_ONLY, label: 'Sunny Only' },
  { value: CharacterWeatherSensitivity.RAINY_ONLY, label: 'Rainy Only' },
  { value: CharacterWeatherSensitivity.NO_RAIN, label: 'No Rain' },
  { value: CharacterWeatherSensitivity.NO_SNOW, label: 'No Snow' },
];
















// lib/types/threed.ts

// ============================================
// TASK ENUMS
// ============================================

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

export enum TaskType {
  WATER = 'water',
  FERTILIZE = 'fertilize',
  PRUNE = 'prune',
  HARVEST = 'harvest',
  WEED = 'weed',
  PEST_CONTROL = 'pest_control',
  PLANT = 'plant',
  TRANSPLANT = 'transplant',
  CLEAN = 'clean',
  MAINTENANCE = 'maintenance',
  OTHER = 'other',
}

// ============================================
// TASK INTERFACES
// ============================================

export interface ThreeDTask {
  id: number;
  userId: string;
  taskId: string;
  title: string;
  description: string | null;
  type: TaskType | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  completedAt: string | null;
  assignedTo: string | null;
  notes: string | null;
  
  // ✅ Related entities (optional associations)
  plantingId: number | null;
  plantId: number | null;
  bedId: number | null;
  wateringScheduleId: number | null;
  
  // ✅ Project asset associations
  projectAssets?: any[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface ThreeDTaskFormData {
  title: string;
  description: string;
  type: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  assignedTo: string;
  notes: string;
  
  // Related entities
  plantingId: string;
  plantId: string;
  bedId: string;
  wateringScheduleId: string;
  
  // Module association
  isActive: boolean;
}

// ============================================
// TASK OPTIONS
// ============================================

export const TASK_TYPE_OPTIONS: ThreeDSelectOption[] = [
  { value: TaskType.WATER, label: 'Water' },
  { value: TaskType.FERTILIZE, label: 'Fertilize' },
  { value: TaskType.PRUNE, label: 'Prune' },
  { value: TaskType.HARVEST, label: 'Harvest' },
  { value: TaskType.WEED, label: 'Weed' },
  { value: TaskType.PEST_CONTROL, label: 'Pest Control' },
  { value: TaskType.PLANT, label: 'Plant' },
  { value: TaskType.TRANSPLANT, label: 'Transplant' },
  { value: TaskType.CLEAN, label: 'Clean' },
  { value: TaskType.MAINTENANCE, label: 'Maintenance' },
  { value: TaskType.OTHER, label: 'Other' },
];

export const TASK_PRIORITY_OPTIONS: ThreeDSelectOption[] = [
  { value: TaskPriority.LOW, label: 'Low' },
  { value: TaskPriority.MEDIUM, label: 'Medium' },
  { value: TaskPriority.HIGH, label: 'High' },
  { value: TaskPriority.URGENT, label: 'Urgent' },
];

export const TASK_STATUS_OPTIONS: ThreeDSelectOption[] = [
  { value: TaskStatus.PENDING, label: 'Pending' },
  { value: TaskStatus.IN_PROGRESS, label: 'In Progress' },
  { value: TaskStatus.COMPLETED, label: 'Completed' },
  { value: TaskStatus.CANCELLED, label: 'Cancelled' },
];


// lib/types/threed.ts

// ✅ Add these interfaces for the relationship options
export interface ThreeDSelectOption {
  value: string;
  label: string;
}

export interface ThreeDRelatedEntity {
  id: number;
  name: string;
  // Optional additional fields for display
  plantId?: string;
  commonName?: string;
  bedId?: string;
  description?: string;
}

// ✅ Update ThreeDTaskFormData to include the selected objects
export interface ThreeDTaskFormData {
  title: string;
  description: string;
  type: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  assignedTo: string;
  notes: string;
  
  // ✅ Related entities (store the selected objects)
  selectedPlant: ThreeDRelatedEntity | null;
  selectedBed: ThreeDRelatedEntity | null;
  selectedPlanting: ThreeDRelatedEntity | null;
  selectedWateringSchedule: ThreeDRelatedEntity | null;
  
  // ✅ For API submission (still need IDs)
  plantingId: string;
  plantId: string;
  bedId: string;
  wateringScheduleId: string;
  
  isActive: boolean;
}


// lib/types/threed.ts

// ============================================
// FARMBOT ENUMS (Add these)
// ============================================

export enum FarmbotStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance',
  ERROR = 'error',
}

// ============================================
// FARMBOT INTERFACES (Add these)
// ============================================

export interface ThreeDFarmbot {
  id: number;
  userId: string;
  assetCode: string;
  farmbotDeviceId: number | null;
  brokerDeviceId: string | null;
  name: string;
  status: FarmbotStatus;
  
  // Location in garden
  bedId: number | null;
  positionX: number | null;
  positionY: number | null;
  positionZ: number | null;
  
  // Configuration
  apiUrl: string | null;
  
  // Last known data
  lastSeen: string | null;
  batteryLevel: number | null;
  firmwareVersion: string | null;
  
  // Status
  isActive: boolean;
  notes: string | null;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // Project asset associations
  projectAssets?: any[];
}

export interface ThreeDFarmbotFormData {
  name: string;
  assetCode: string;
  status: FarmbotStatus;
  bedId: string;
  positionX: string;
  positionY: string;
  positionZ: string;
  apiUrl: string;
  firmwareVersion: string;
  notes: string;
  isActive: boolean;
}

// ============================================
// FARMBOT OPTIONS (Add these)
// ============================================

export const FARMBOT_STATUS_OPTIONS: ThreeDSelectOption[] = [
  { value: FarmbotStatus.ONLINE, label: 'Online' },
  { value: FarmbotStatus.OFFLINE, label: 'Offline' },
  { value: FarmbotStatus.MAINTENANCE, label: 'Maintenance' },
  { value: FarmbotStatus.ERROR, label: 'Error' },
];


// lib/types/threed.ts

// ============================================
// PLANTING ENUMS (Add if not already present)
// ============================================

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

// ============================================
// PLANTING INTERFACES
// ============================================

export interface ThreeDPlanting {
  id: number;
  userId: string;
  plantingId: string;
  plantId: number | null;
  bedId: number | null;
  
  // Model override
  customModelId: number | null;
  modelScale: number | null;
  modelOffset: any;
  
  // Planting details
  quantity: number | null;
  spacingInches: number | null;
  positionX: number | null;
  positionY: number | null;
  positionZ: number | null;
  
  // Dates
  plantedDate: string | null;
  expectedGerminationDate: string | null;
  expectedHarvestDate: string | null;
  actualHarvestDate: string | null;
  
  // Status
  status: PlantingStatus;
  growthStage: GrowthStage;
  health: string | null;
  notes: string | null;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // Related data (populated from joins)
  plant?: ThreeDPlant;
  bed?: ThreeDBed;
  customModel?: ThreeDModel;
  
  // Project asset associations
  projectAssets?: any[];
}

export interface ThreeDPlantingFormData {
  plantId: string;
  bedId: string;
  customModelId: string;
  modelScale: string;
  quantity: string;
  spacingInches: string;
  positionX: string;
  positionY: string;
  positionZ: string;
  plantedDate: string;
  expectedGerminationDate: string;
  expectedHarvestDate: string;
  actualHarvestDate: string;
  status: PlantingStatus;
  growthStage: GrowthStage;
  health: string;
  notes: string;
  isActive: boolean;
}

// ============================================
// PLANTING OPTIONS
// ============================================

export const PLANTING_STATUS_OPTIONS: ThreeDSelectOption[] = [
  { value: PlantingStatus.PLANNED, label: 'Planned' },
  { value: PlantingStatus.PLANTED, label: 'Planted' },
  { value: PlantingStatus.GROWING, label: 'Growing' },
  { value: PlantingStatus.HARVESTING, label: 'Harvesting' },
  { value: PlantingStatus.HARVESTED, label: 'Harvested' },
  { value: PlantingStatus.FAILED, label: 'Failed' },
];

export const GROWTH_STAGE_OPTIONS: ThreeDSelectOption[] = [
  { value: GrowthStage.SEED, label: 'Seed' },
  { value: GrowthStage.SEEDLING, label: 'Seedling' },
  { value: GrowthStage.VEGETATIVE, label: 'Vegetative' },
  { value: GrowthStage.FLOWERING, label: 'Flowering' },
  { value: GrowthStage.FRUITING, label: 'Fruiting' },
  { value: GrowthStage.MATURE, label: 'Mature' },
  { value: GrowthStage.DORMANT, label: 'Dormant' },
];

export const PLANTING_HEALTH_OPTIONS: ThreeDSelectOption[] = [
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
  { value: 'excellent', label: 'Excellent' },
];




// lib/types/threed.ts

// ============================================
// HARVEST ENUMS (Add these)
// ============================================

export enum HarvestUnit {
  LBS = 'lbs',
  KG = 'kg',
  OZ = 'oz',
  GRAMS = 'grams',
  PIECES = 'pieces',
  BUNCHES = 'bunches',
  POUNDS = 'pounds',
}

// ============================================
// HARVEST INTERFACES
// ============================================

export interface ThreeDHarvest {
  id: number;
  userId: string;
  harvestId: string;
  plantingId: number | null;
  plantId: number | null;
  
  // Harvest details
  quantity: number | null;
  unit: string | null;
  weightLbs: number | null;
  
  // Date and notes
  harvestDate: string | null;
  notes: string | null;
  imageUrl: string | null;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // Related data (populated from joins)
  plant?: ThreeDPlant;
  planting?: ThreeDPlanting;
  
  // Project asset associations
  projectAssets?: any[];
}

export interface ThreeDHarvestFormData {
  plantingId: string;
  plantId: string;
  quantity: string;
  unit: string;
  weightLbs: string;
  harvestDate: string;
  notes: string;
  imageUrl: string;
  isActive: boolean;
}

// ============================================
// HARVEST OPTIONS
// ============================================

export const HARVEST_UNIT_OPTIONS: ThreeDSelectOption[] = [
  { value: HarvestUnit.LBS, label: 'Pounds (lbs)' },
  { value: HarvestUnit.KG, label: 'Kilograms (kg)' },
  { value: HarvestUnit.OZ, label: 'Ounces (oz)' },
  { value: HarvestUnit.GRAMS, label: 'Grams' },
  { value: HarvestUnit.PIECES, label: 'Pieces' },
  { value: HarvestUnit.BUNCHES, label: 'Bunches' },
  { value: HarvestUnit.POUNDS, label: 'Pounds' },
];
