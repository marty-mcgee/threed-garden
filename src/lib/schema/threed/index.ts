// @/lib/schema/threed/index
import { 
  pgTable, 
  text, 
  timestamp, 
  boolean,
  index,
  serial, 
  varchar, 
  integer, 
  decimal, 
  numeric,
  jsonb,
  uniqueIndex,
  foreignKey,
  pgSchema,
  pgEnum,
  time,
  AnyPgColumn,
  real,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { user } from '../auth';
import { projects } from '../projects';

// ============================================
// THREED MODULE - Main Table
// ============================================

/**
 * threed - Main table for ThreeD module
 * Stores the overall garden configuration and status
 */
export const threed = pgTable('threed', {
  id: serial('id').primaryKey(),

  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  
  // Basic info
  name: text('name').notNull(),
  description: text('description'),
  slug: text('slug').unique().notNull(),
  
  // Owner
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  
  // Garden configuration
  config: jsonb('config').default({}), // Layout, grid, units, etc.
  
  // Status
  isActive: boolean('is_active').default(true),
  isPublic: boolean('is_public').default(false),
  
  // Metadata
  version: text('version').default('1.0.0'),
  metadata: jsonb('metadata').default({}),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  slugIdx: uniqueIndex('idx_threed_slug').on(table.slug),
  userIdIdx: index('idx_threed_user_id').on(table.userId),
  activeIdx: index('idx_threed_active').on(table.isActive),
}));

// ============================================
// UPDATE RELATIONSHIPS
// ============================================

export const threedRelations = relations(threed, ({ one, many }) => ({
  user: one(user, {
    fields: [threed.userId],
    references: [user.id],
  }),
  // All other threed tables relate to this
  plants: many(threedPlants),
  beds: many(threedBeds),
  plantings: many(threedPlantings),
  farmbots: many(threedFarmbots),
  models: many(threedModels),
  characters: many(threedCharacters),
  tasks: many(threedTasks),
  weatherLogs: many(threedWeatherLogs),
  wateringSchedules: many(threedWateringSchedules),
  harvests: many(threedHarvests),
  layers: many(threedLayers),
  markers: many(threedMarkers),
}));











// ============================================
// ENUMS for type safety
// ============================================

export const plantTypeEnum = pgEnum('threed_plant_type', ['Vegetable', 'Fruit', 'Herb', 'Flower', 'Tree', 'Shrub', 'CoverCrop']);
export const plantStatusEnum = pgEnum('threed_plant_status', ['active', 'inactive', 'archived']);
export const plantingStatusEnum = pgEnum('threed_planting_status', ['planned', 'planted', 'growing', 'harvesting', 'harvested', 'failed']);
export const growthStageEnum = pgEnum('threed_growth_stage', ['seed', 'seedling', 'vegetative', 'flowering', 'fruiting', 'mature', 'dormant']);
export const taskPriorityEnum = pgEnum('threed_task_priority', ['low', 'medium', 'high', 'urgent']);
export const taskStatusEnum = pgEnum('threed_task_status', ['pending', 'in_progress', 'completed', 'cancelled']);
export const bedShapeEnum = pgEnum('threed_bed_shape', ['rectangle', 'square', 'circle', 'raised', 'container', 'custom']);
export const farmbotStatusEnum = pgEnum('threed_farmbot_status', ['online', 'offline', 'maintenance', 'error']);
export const modelTypeEnum = pgEnum('threed_model_type', [
  'procedural', 
  'gltf', 
  'glb', 
  'fbx',
  'usdz', 
  'obj', 
  'herb-generic',
  'vegetable-generic',
  'flower-generic',
  'fruit-generic',
  'tree-generic',
  'custom'
]);
export const wateringFrequencyEnum = pgEnum('threed_watering_frequency', [
  'daily', 
  'weekly', 
  'custom', 
  'moisture-based',
  'hourly',
  'bi-daily'
]);

// ============================================
// LAYERS + MARKERS ENUMS
// ============================================
export const layerTypeEnum = pgEnum('threed_layer_type', [
  'garden',
  'plants',
  'beds', 
  'farmbots',
  'models',
  'characters',
  'tasks',
  'weather',
  'traffic',
  'custom'
]);

export const layerVisibilityEnum = pgEnum('threed_layer_visibility', [
  'public',
  'private',
  'shared'
]);

export const markerTypeEnum = pgEnum('threed_marker_type', [
  'plant',
  'bed',
  'farmbot',
  'model',
  'character',
  'task',
  'weather_station',
  'traffic_incident',
  'custom'
]);

export const markerStatusEnum = pgEnum('threed_marker_status', [
  'active',
  'inactive',
  'archived',
  'pending'
]);

// ============================================
// ENUMS for Characters
// ============================================
export const characterTypeEnum = pgEnum('threed_character_type', [
  'animal', 'bird', 'insect', 'mythical', 'human', 'robot', 'decoration'
]);

export const characterStatusEnum = pgEnum('threed_character_status', [
  'active', 'idle', 'sleeping', 'moving', 'hidden'
]);

export const characterAnimationEnum = pgEnum('threed_character_animation', [
  'idle', 'walk', 'run', 'fly', 'dance', 'sway', 'float', 'spin', 'bounce'
]);

export const characterMovementTypeEnum = pgEnum('threed_character_movement_type', [
  'stationary', 'wander', 'patrol', 'circle', 'follow', 'teleport'
]);

export const characterWeatherSensitivityEnum = pgEnum('threed_character_weather_sensitivity', [
  'all', 'sunny_only', 'rainy_only', 'no_rain', 'no_snow'
]);

export const characterEmoteEnum = pgEnum('threed_character_emote', [
  'none', 'happy', 'sad', 'surprised', 'angry', 'wave', 'dance', 'sleep'
]);













// ============================================
// 1. threed_plants - Master plant database
// ============================================
export const threedPlants = pgTable('threed_plants', {
  id: serial('id').primaryKey(),
  threedId: integer('threed_id').references(() => threed.id, { onDelete: 'cascade' }),
  plantId: varchar('plant_id', { length: 50 }).unique().notNull(),
  commonName: varchar('common_name', { length: 255 }).notNull(),
  scientificName: varchar('scientific_name', { length: 255 }),
  variety: varchar('variety', { length: 100 }),
  family: varchar('family', { length: 100 }),
  type: plantTypeEnum('type').default('Vegetable'),
  status: plantStatusEnum('status').default('active'),
  
  // Relationship to model (shared with characters)
  modelId: integer('model_id').references(() => threedModels.id, { onDelete: 'set null' }),
  
  // Marker relationship (NEW)
  markerId: integer('marker_id').references(() => threedMarkers.id, { onDelete: 'set null' }),
  
  // Growth parameters
  growthHabit: varchar('growth_habit', { length: 50 }),
  daysToMaturity: integer('days_to_maturity'),
  daysToGermination: integer('days_to_germination'),
  daysToHarvest: integer('days_to_harvest'),
  
  // Spacing requirements (inches)
  spacingInches: integer('spacing_inches'),
  rowSpacingInches: integer('row_spacing_inches'),
  plantingDepthInches: decimal('planting_depth_inches', { precision: 3, scale: 1 }),
  
  // Environmental needs
  sunlight: varchar('sunlight', { length: 50 }).default('Full Sun'),
  waterNeeds: varchar('water_needs', { length: 20 }).default('Medium'),
  soilType: text('soil_type'),
  soilPH: decimal('soil_ph', { precision: 3, scale: 1 }),
  hardinessZone: varchar('hardiness_zone', { length: 10 }),
  frostTolerant: boolean('frost_tolerant').default(false),
  perennial: boolean('perennial').default(false),
  
  // Media and descriptions
  imageUrl: text('image_url'),
  thumbnailUrl: text('thumbnail_url'),
  description: text('description'),
  careInstructions: text('care_instructions'),
  harvestInstructions: text('harvest_instructions'),
  
  // Companion planting
  companionPlants: text('companion_plants'),
  avoidPlants: text('avoid_plants'),
  
  // Metadata
  source: varchar('source', { length: 100 }),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  threedIdx: index('idx_threed_plants_threed_id').on(table.threedId),
  plantIdIdx: uniqueIndex('idx_threed_plants_plant_id').on(table.plantId),
  commonNameIdx: index('idx_threed_plants_common_name').on(table.commonName),
  typeIdx: index('idx_threed_plants_type').on(table.type),
  statusIdx: index('idx_threed_plants_status').on(table.status),
  markerIdx: index('idx_threed_plants_marker').on(table.markerId),
}));

// ============================================
// 1b. threed_models - GLTF model library
// ============================================
export const threedModels = pgTable('threed_models', {
  id: serial('id').primaryKey(),
  threedId: integer('threed_id').references(() => threed.id, { onDelete: 'cascade' }),
  
  // Add these to track what uses this model
  usedByPlants: boolean('used_by_plants').default(false),
  usedByCharacters: boolean('used_by_characters').default(false),

  modelName: varchar('model_name', { length: 255 }).notNull(),
  modelType: modelTypeEnum('model_type').notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  fileSize: integer('file_size'), // in bytes
  thumbnailUrl: text('thumbnail_url'),
  
  // Model properties
  scale: decimal('scale', { precision: 5, scale: 2 }).default('1.0'),
  rotationY: decimal('rotation_y', { precision: 5, scale: 2 }).default('0.0'),
  offsetX: decimal('offset_x', { precision: 5, scale: 2 }).default('0.0'),
  offsetY: decimal('offset_y', { precision: 5, scale: 2 }).default('0.0'),
  offsetZ: decimal('offset_z', { precision: 5, scale: 2 }).default('0.0'),
  
  // LOD support for performance
  hasLOD: boolean('has_lod').default(false),
  lodLevels: jsonb('lod_levels').default({}), // { low: 'path/to/low.glb', medium: 'path/to/medium.glb' }
  
  // Animation support
  animations: jsonb('animations').default([]), // ['idle', 'sway', 'grow', 'flower']
  defaultAnimation: varchar('default_animation', { length: 50 }),

  hasExternalFiles: boolean('has_external_files').default(false),
  textureCount: integer('texture_count').default(0),
  mainModelFileId: integer('main_model_file_id'), // Reference to the main GLB/GLTF file in threedModelFiles
  
  // Model metadata
  isActive: boolean('is_active').default(true),
  isDefault: boolean('is_default').default(false),
  uploadedBy: varchar('uploaded_by', { length: 255 }),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
  
  // Marker relationship (NEW)
  markerId: integer('marker_id').references(() => threedMarkers.id, { onDelete: 'set null' }),
  
  // Additional metadata (author, license, etc.)
  metadata: jsonb('metadata').default({}),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  threedIdx: index('idx_threed_plants_threed_id').on(table.threedId),
  modelTypeIdx: index('idx_threed_models_type').on(table.modelType),
  activeIdx: index('idx_threed_models_active').on(table.isActive),
  markerIdx: index('idx_threed_models_marker').on(table.markerId),
}));

// ============================================
// 1c. threed_model_files - Associated files for 3D models
// ============================================
export const threedModelFiles = pgTable('threed_model_files', {
  id: serial('id').primaryKey(),
  modelId: integer('model_id').references(() => threedModels.id, { onDelete: 'cascade' }),
  
  // File information
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileType: varchar('file_type', { length: 50 }).notNull(), // 'model', 'texture', 'binary', 'other'
  textureType: varchar('texture_type', { length: 50 }), // 'baseColor', 'normalMap', 'roughness', 'metallic', 'emissive', 'occlusion'
  filePath: varchar('file_path', { length: 500 }).notNull(),
  fileSize: integer('file_size'),
  
  // For GLTF binary
  isBinaryBuffer: boolean('is_binary_buffer').default(false),
  
  // Order in which files should be loaded
  loadOrder: integer('load_order').default(0),
  
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  modelIdIdx: index('idx_threed_model_files_model_id').on(table.modelId),
  fileTypeIdx: index('idx_threed_model_files_type').on(table.fileType),
}));

// ============================================
// 2. threed_beds - Garden layout
// ============================================
export const threedBeds = pgTable('threed_beds', {
  id: serial('id').primaryKey(),
  threedId: integer('threed_id').references(() => threed.id, { onDelete: 'cascade' }),
  bedId: varchar('bed_id', { length: 50 }).unique().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  shape: bedShapeEnum('shape').default('rectangle'),
  
  // Dimensions (feet)
  widthFeet: decimal('width_feet', { precision: 5, scale: 2 }),
  lengthFeet: decimal('length_feet', { precision: 5, scale: 2 }),
  squareFeet: decimal('square_feet', { precision: 8, scale: 2 }),
  heightFeet: decimal('height_feet', { precision: 5, scale: 2 }).default('1'),
  
  // Soil and environment
  soilType: varchar('soil_type', { length: 50 }),
  sunExposure: varchar('sun_exposure', { length: 50 }),
  
  // 3D positioning (for Three.js)
  positionX: decimal('position_x', { precision: 8, scale: 2 }).default('0'),
  positionY: decimal('position_y', { precision: 8, scale: 2 }).default('0'),
  positionZ: decimal('position_z', { precision: 8, scale: 2 }).default('0'),
  rotation: decimal('rotation', { precision: 8, scale: 2 }).default('0'),
  scale: decimal('scale', { precision: 5, scale: 2 }).default('1'),
  
  // Status
  isActive: boolean('is_active').default(true),
  color: varchar('color', { length: 20 }).default('#8B5E3C'),
  
  // Marker relationship (NEW)
  markerId: integer('marker_id').references(() => threedMarkers.id, { onDelete: 'set null' }),
  
  // Metadata
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  threedIdx: index('idx_threed_plants_threed_id').on(table.threedId),
  bedIdIdx: uniqueIndex('idx_threed_beds_bed_id').on(table.bedId),
  activeIdx: index('idx_threed_beds_active').on(table.isActive),
  nameIdx: index('idx_threed_beds_name').on(table.name),
  markerIdx: index('idx_threed_beds_marker').on(table.markerId),
}));

// ============================================
// 3. threed_plantings - Plants in beds
// ============================================
export const threedPlantings = pgTable('threed_plantings', {
  id: serial('id').primaryKey(),
  threedId: integer('threed_id').references(() => threed.id, { onDelete: 'cascade' }),
  plantingId: varchar('planting_id', { length: 50 }).unique().notNull(),
  plantId: integer('plant_id').references(() => threedPlants.id, { onDelete: 'set null' }),
  bedId: integer('bed_id').references(() => threedBeds.id, { onDelete: 'set null' }),
  
  // GLTF model override (use specific model for this planting)
  customModelId: integer('custom_model_id').references(() => threedModels.id, { onDelete: 'set null' }),
  modelScale: decimal('model_scale', { precision: 5, scale: 2 }).default('1.0'),
  modelOffset: jsonb('model_offset').default({ x: 0, y: 0, z: 0 }),
  
  // Planting details
  quantity: integer('quantity').default(1),
  spacingInches: integer('spacing_inches'),
  positionX: decimal('position_x', { precision: 8, scale: 2 }),
  positionY: decimal('position_y', { precision: 8, scale: 2 }),
  positionZ: decimal('position_z', { precision: 8, scale: 2 }),
  
  // Dates
  plantedDate: timestamp('planted_date'),
  expectedGerminationDate: timestamp('expected_germination_date'),
  expectedHarvestDate: timestamp('expected_harvest_date'),
  actualHarvestDate: timestamp('actual_harvest_date'),
  
  // Status tracking
  status: plantingStatusEnum('status').default('planted'),
  growthStage: growthStageEnum('growth_stage').default('seed'),
  health: varchar('health', { length: 20 }).default('good'),
  notes: text('notes'),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  threedIdx: index('idx_threed_plants_threed_id').on(table.threedId),
  plantingIdIdx: uniqueIndex('idx_threed_plantings_planting_id').on(table.plantingId),
  plantIdx: index('idx_threed_plantings_plant').on(table.plantId),
  bedIdx: index('idx_threed_plantings_bed').on(table.bedId),
  statusIdx: index('idx_threed_plantings_status').on(table.status),
  customModelIdx: index('idx_threed_plantings_custom_model').on(table.customModelId),
}));

// ============================================
// 4. threed_watering_schedules - Automated watering
// ============================================
export const threedWateringSchedules = pgTable('threed_watering_schedules', {
  id: serial('id').primaryKey(),
  scheduleId: varchar('schedule_id', { length: 50 }).unique().notNull(),
  plantId: integer('plant_id').references(() => threedPlants.id, { onDelete: 'cascade' }),
  farmbotId: integer('farmbot_id').references(() => threedFarmbots.id, { onDelete: 'set null' }),
  bedId: integer('bed_id').references(() => threedBeds.id, { onDelete: 'cascade' }),
  plantingId: integer('planting_id').references(() => threedPlantings.id, { onDelete: 'cascade' }),
  
  // Schedule configuration
  frequency: wateringFrequencyEnum('frequency').notNull(),
  intervalDays: integer('interval_days'), // For custom frequency
  daysOfWeek: integer('days_of_week').array(), // 0-6 for Sunday-Saturday
  timeOfDay: time('time_of_day'), // When to water (e.g., '08:00:00')
  
  // Watering parameters
  durationMs: integer('duration_ms').notNull(), // How long to water
  volumeMl: integer('volume_ml'), // Alternative to duration
  moistureThreshold: integer('moisture_threshold'), // If using moisture-based scheduling
  
  // Schedule state
  nextWatering: timestamp('next_watering').notNull(),
  lastWatering: timestamp('last_watering'),
  isActive: boolean('is_active').default(true),
  
  // Weather awareness
  skipIfRain: boolean('skip_if_rain').default(true),
  maxTemperature: integer('max_temperature'), // Skip if above this temp (F)
  minTemperature: integer('min_temperature'), // Skip if below this temp (F)
  maxWindSpeed: integer('max_wind_speed'), // Skip if windy (mph)
  
  // Recurrence
  repeatCount: integer('repeat_count'), // Number of times to repeat (-1 for infinite)
  timesExecuted: integer('times_executed').default(0),
  
  // Notes
  notes: text('notes'),
  
  // Metadata
  createdBy: varchar('created_by', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  scheduleIdIdx: uniqueIndex('idx_threed_watering_schedule_id').on(table.scheduleId),
  plantIdx: index('idx_threed_watering_plant').on(table.plantId),
  farmbotIdx: index('idx_threed_watering_farmbot').on(table.farmbotId),
  nextWateringIdx: index('idx_threed_watering_next').on(table.nextWatering),
  activeIdx: index('idx_threed_watering_active').on(table.isActive),
  compositeNextActiveIdx: index('idx_threed_watering_next_active').on(table.nextWatering, table.isActive),
}));

// ============================================
// 5. threed_watering_history - Watering logs
// ============================================
export const threedWateringHistory = pgTable('threed_watering_history', {
  id: serial('id').primaryKey(),
  historyId: varchar('history_id', { length: 50 }).unique().notNull(),
  scheduleId: integer('schedule_id').references(() => threedWateringSchedules.id, { onDelete: 'set null' }),
  plantId: integer('plant_id').references(() => threedPlants.id),
  farmbotId: integer('farmbot_id').references(() => threedFarmbots.id),
  plantingId: integer('planting_id').references(() => threedPlantings.id),
  
  // Execution details
  status: varchar('status', { length: 20 }).notNull(), // 'success', 'failed', 'skipped'
  durationMs: integer('duration_ms'),
  volumeMl: integer('volume_ml'),
  
  // Skip/failure reasons
  skipReason: text('skip_reason'), // If skipped (rain, temperature, etc.)
  errorMessage: text('error_message'), // If failed
  
  // Sensor data
  soilMoistureBefore: integer('soil_moisture_before'), // If available
  soilMoistureAfter: integer('soil_moisture_after'),
  temperatureAtTime: decimal('temperature_at_time', { precision: 5, scale: 1 }),
  
  // Weather at execution time
  weatherAtTime: jsonb('weather_at_time'), // Temperature, conditions, wind speed
  
  // Execution metadata
  executedAt: timestamp('executed_at').defaultNow(),
  executedBy: varchar('executed_by', { length: 50 }).default('automated'), // 'automated', 'manual', 'user'
  
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  historyIdIdx: uniqueIndex('idx_threed_watering_history_id').on(table.historyId),
  scheduleIdx: index('idx_threed_watering_history_schedule').on(table.scheduleId),
  plantIdx: index('idx_threed_watering_history_plant').on(table.plantId),
  executedAtIdx: index('idx_threed_watering_history_executed_at').on(table.executedAt),
  statusIdx: index('idx_threed_watering_history_status').on(table.status),
}));

// ============================================
// 6. threed_harvests - Harvest logging
// ============================================
export const threedHarvests = pgTable('threed_harvests', {
  id: serial('id').primaryKey(),
  threedId: integer('threed_id').references(() => threed.id, { onDelete: 'cascade' }),
  harvestId: varchar('harvest_id', { length: 50 }).unique().notNull(),
  plantingId: integer('planting_id').references(() => threedPlantings.id, { onDelete: 'set null' }),
  plantId: integer('plant_id').references(() => threedPlants.id, { onDelete: 'set null' }),
  
  // Harvest details
  quantity: decimal('quantity', { precision: 8, scale: 2 }),
  unit: varchar('unit', { length: 20 }).default('lbs'),
  weightLbs: decimal('weight_lbs', { precision: 8, scale: 2 }),
  
  // Date and notes
  harvestDate: timestamp('harvest_date').defaultNow(),
  notes: text('notes'),
  imageUrl: text('image_url'),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  threedIdx: index('idx_threed_plants_threed_id').on(table.threedId),
  harvestIdIdx: uniqueIndex('idx_threed_harvests_harvest_id').on(table.harvestId),
  plantingIdx: index('idx_threed_harvests_planting').on(table.plantingId),
  harvestDateIdx: index('idx_threed_harvests_date').on(table.harvestDate),
}));

// ============================================
// 7. threed_tasks - Garden tasks/to-do
// ============================================
export const threedTasks = pgTable('threed_tasks', {
  id: serial('id').primaryKey(),
  threedId: integer('threed_id').references(() => threed.id, { onDelete: 'cascade' }),
  taskId: varchar('task_id', { length: 50 }).unique().notNull(),
  plantingId: integer('planting_id').references(() => threedPlantings.id, { onDelete: 'set null' }),
  plantId: integer('plant_id').references(() => threedPlants.id, { onDelete: 'set null' }),
  bedId: integer('bed_id').references(() => threedBeds.id, { onDelete: 'set null' }),
  wateringScheduleId: integer('watering_schedule_id').references(() => threedWateringSchedules.id, { onDelete: 'set null' }),
  
  // Task details
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }), // water, fertilize, prune, harvest, weed, pest_control, plant
  
  // Status and priority
  priority: taskPriorityEnum('priority').default('medium'),
  status: taskStatusEnum('status').default('pending'),
  
  // Scheduling
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  
  // Marker relationship (NEW)
  markerId: integer('marker_id').references(() => threedMarkers.id, { onDelete: 'set null' }),
  
  // Metadata
  assignedTo: varchar('assigned_to', { length: 100 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  threedIdx: index('idx_threed_plants_threed_id').on(table.threedId),
  taskIdIdx: uniqueIndex('idx_threed_tasks_task_id').on(table.taskId),
  plantingIdx: index('idx_threed_tasks_planting').on(table.plantingId),
  dueDateIdx: index('idx_threed_tasks_due_date').on(table.dueDate),
  statusIdx: index('idx_threed_tasks_status').on(table.status),
  wateringScheduleIdx: index('idx_threed_tasks_watering').on(table.wateringScheduleId),
  markerIdx: index('idx_threed_tasks_marker').on(table.markerId),
}));

// ============================================
// 8. threed_weather_logs - Environmental data
// ============================================
export const threedWeatherLogs = pgTable('threed_weather_logs', {
  id: serial('id').primaryKey(),
  recordedAt: timestamp('recorded_at').defaultNow(),
  
  // Weather data
  temperature: decimal('temperature', { precision: 5, scale: 1 }),
  humidity: decimal('humidity', { precision: 5, scale: 1 }),
  rainfallInches: decimal('rainfall_inches', { precision: 5, scale: 2 }),
  soilMoisture: decimal('soil_moisture', { precision: 5, scale: 1 }),
  sunlightHours: decimal('sunlight_hours', { precision: 4, scale: 1 }),
  windSpeed: decimal('wind_speed', { precision: 5, scale: 1 }),
  
  // Alerts
  frostWarning: boolean('frost_warning').default(false),
  heatWarning: boolean('heat_warning').default(false),
  droughtWarning: boolean('drought_warning').default(false),
  
  // Marker relationship (NEW)
  markerId: integer('marker_id').references(() => threedMarkers.id, { onDelete: 'set null' }),
  
  // Source and metadata
  source: varchar('source', { length: 50 }).default('api'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  recordedAtIdx: index('idx_threed_weather_recorded_at').on(table.recordedAt),
  markerIdx: index('idx_threed_weather_marker').on(table.markerId),
}));

// ============================================
// 9. threed_farmbots - FarmBot devices
// ============================================
export const threedFarmbots = pgTable('threed_farmbots', {
  id: serial('id').primaryKey(),
  threedId: integer('threed_id').references(() => threed.id, { onDelete: 'cascade' }),
  deviceId: varchar('device_id', { length: 100 }).unique().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  status: farmbotStatusEnum('status').default('offline'),
  
  // Location in garden
  bedId: integer('bed_id').references(() => threedBeds.id, { onDelete: 'set null' }),
  positionX: decimal('position_x', { precision: 8, scale: 2 }),
  positionY: decimal('position_y', { precision: 8, scale: 2 }),
  positionZ: decimal('position_z', { precision: 8, scale: 2 }),
  
  // Configuration
  apiToken: varchar('api_token', { length: 255 }),
  apiUrl: varchar('api_url', { length: 255 }),
  
  // Last known data
  lastSeen: timestamp('last_seen'),
  batteryLevel: integer('battery_level'),
  firmwareVersion: varchar('firmware_version', { length: 50 }),
  
  // Marker relationship (NEW)
  markerId: integer('marker_id').references(() => threedMarkers.id, { onDelete: 'set null' }),
  
  // Metadata
  isActive: boolean('is_active').default(true),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  threedIdx: index('idx_threed_plants_threed_id').on(table.threedId),
  deviceIdIdx: uniqueIndex('idx_threed_farmbots_device_id').on(table.deviceId),
  statusIdx: index('idx_threed_farmbots_status').on(table.status),
  markerIdx: index('idx_threed_farmbots_marker').on(table.markerId),
}));

// ============================================
// 10. threed_farmbot_logs - FarmBot activity log
// ============================================
export const threedFarmbotLogs = pgTable('threed_farmbot_logs', {
  id: serial('id').primaryKey(),
  farmbotId: integer('farmbot_id').references(() => threedFarmbots.id, { onDelete: 'cascade' }),
  eventType: varchar('event_type', { length: 50 }), // watering, planting, sensor, error, maintenance
  status: varchar('status', { length: 20 }), // success, failed, pending, in_progress
  message: text('message'),
  sensorData: jsonb('sensor_data'),
  rawData: jsonb('raw_data'),
  loggedAt: timestamp('logged_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  farmbotIdx: index('idx_threed_farmbot_logs_farmbot').on(table.farmbotId),
  eventTypeIdx: index('idx_threed_farmbot_logs_event_type').on(table.eventType),
  loggedAtIdx: index('idx_threed_farmbot_logs_logged_at').on(table.loggedAt),
}));

// ============================================
// 11. threed_system_logs - Application logging
// ============================================
export const threedSystemLogs = pgTable('threed_system_logs', {
  id: serial('id').primaryKey(),
  level: varchar('level', { length: 20 }), // info, warning, error, debug
  source: varchar('source', { length: 100 }),
  message: text('message'),
  details: jsonb('details'),
  loggedAt: timestamp('logged_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  levelIdx: index('idx_threed_system_logs_level').on(table.level),
  loggedAtIdx: index('idx_threed_system_logs_logged_at').on(table.loggedAt),
}));

// ============================================
// 12. threed_characters - Characters and creatures
// ============================================
export const threedCharacters = pgTable('threed_characters', {
  id: serial('id').primaryKey(),
  threedId: integer('threed_id').references(() => threed.id, { onDelete: 'cascade' }),
  characterId: varchar('character_id', { length: 50 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: characterTypeEnum('type').default('animal'),
  status: characterStatusEnum('status').default('active'),
  
  // Model relationship
  modelId: integer('model_id').references(() => threedModels.id, { onDelete: 'set null' }),
  
  // Marker relationship (NEW)
  markerId: integer('marker_id').references(() => threedMarkers.id, { onDelete: 'set null' }),
  
  // Animation
  animations: characterAnimationEnum('animations').array().default([]),
  defaultAnimation: characterAnimationEnum('default_animation'),
  animationSpeed: decimal('animation_speed', { precision: 4, scale: 2 }).default('1.0'),
  
  // Enhanced Movement
  isMovable: boolean('is_movable').default(false),
  movementType: characterMovementTypeEnum('movement_type').default('stationary'),
  movementPattern: varchar('movement_pattern', { length: 50 }),
  movementRadius: decimal('movement_radius', { precision: 5, scale: 2 }),
  movementSpeed: decimal('movement_speed', { precision: 4, scale: 2 }).default('0.5'),
  
  // Patrol waypoints (store as JSON array of {x, y, z})
  patrolWaypoints: jsonb('patrol_waypoints').default([]),
  
  // Follow target (could be plantId, characterId, or 'camera')
  followTarget: varchar('follow_target', { length: 50 }),
  followDistance: decimal('follow_distance', { precision: 4, scale: 2 }).default('2.0'),
  
  // Teleport positions
  teleportPositions: jsonb('teleport_positions').default([]),
  teleportInterval: integer('teleport_interval'), // seconds between teleports
  
  // Enhanced Interaction
  interactable: boolean('interactable').default(true),
  interactionMessage: text('interaction_message'),
  soundEffect: varchar('sound_effect', { length: 255 }),
  
  // Emote system
  defaultEmote: characterEmoteEnum('default_emote').default('none'),
  emoteOnInteract: characterEmoteEnum('emote_on_interact').default('happy'),
  
  // Time-based activation
  activeStartHour: integer('active_start_hour'), // 0-23
  activeEndHour: integer('active_end_hour'),
  
  // Weather sensitivity
  weatherSensitivity: characterWeatherSensitivityEnum('weather_sensitivity').default('all'),
  
  // Position (absolute world coordinates)
  bedId: integer('bed_id').references(() => threedBeds.id, { onDelete: 'set null' }),
  positionX: decimal('position_x', { precision: 8, scale: 2 }).default('0'),
  positionY: decimal('position_y', { precision: 8, scale: 2 }).default('0'),
  positionZ: decimal('position_z', { precision: 8, scale: 2 }).default('0'),
  rotation: decimal('rotation', { precision: 8, scale: 2 }).default('0'),
  
  // Scale and appearance
  scale: decimal('scale', { precision: 5, scale: 2 }).default('1'),
  scaleMultiplier: decimal('scale_multiplier', { precision: 5, scale: 2 }).default('1'),
  colorTint: varchar('color_tint', { length: 20 }),
  
  // Visibility
  visible: boolean('visible').default(true),
  visibleDistance: decimal('visible_distance', { precision: 5, scale: 2 }).default('30.0'),
  
  // Metadata
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  threedIdx: index('idx_threed_plants_threed_id').on(table.threedId),
  characterIdIdx: uniqueIndex('idx_threed_characters_character_id').on(table.characterId),
  nameIdx: index('idx_threed_characters_name').on(table.name),
  typeIdx: index('idx_threed_characters_type').on(table.type),
  statusIdx: index('idx_threed_characters_status').on(table.status),
  movementTypeIdx: index('idx_threed_characters_movement_type').on(table.movementType),
  modelIdx: index('idx_threed_characters_model').on(table.modelId),
  bedIdx: index('idx_threed_characters_bed').on(table.bedId),
  visibleIdx: index('idx_threed_characters_visible').on(table.visible),
  markerIdx: index('idx_threed_characters_marker').on(table.markerId),
}));

// ============================================
// LAYERS TABLE - Groups of 3D objects
// ============================================
export const threedLayers = pgTable('threed_layers', {
  id: serial('id').primaryKey(),
  
  // Basic info
  name: text('name').notNull(),
  description: text('description'),
  type: layerTypeEnum('type').notNull().default('custom'),
  
  // Visibility & access
  isEnabled: boolean('is_enabled').default(true),
  visibility: layerVisibilityEnum('visibility').default('public'),
  userId: integer('user_id').references(() => user.id, { onDelete: 'cascade' }),
  
  // Display settings
  icon: text('icon'), // Lucide icon name
  color: text('color'), // Hex color code
  orderIndex: integer('order_index').default(0),
  
  // Metadata & configuration
  config: jsonb('config'), // Layer-specific configuration
  metadata: jsonb('metadata'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_threed_layers_user_id').on(table.userId),
  typeIdx: index('idx_threed_layers_type').on(table.type),
  enabledIdx: index('idx_threed_layers_enabled').on(table.isEnabled),
}));

// ============================================
// MARKERS TABLE - All 3D objects
// ============================================
export const threedMarkers = pgTable('threed_markers', {
  id: serial('id').primaryKey(),
  
  // Basic info
  name: text('name').notNull(),
  description: text('description'),
  type: markerTypeEnum('type').notNull(),
  status: markerStatusEnum('status').default('active'),
  
  // Relationships
  layerId: integer('layer_id').references(() => threedLayers.id, { 
    onDelete: 'cascade' 
  }),
  userId: integer('user_id').references(() => user.id, { onDelete: 'cascade' }),
  
  // ===== 3D POSITION =====
  positionX: real('position_x').default(0),
  positionY: real('position_y').default(0),
  positionZ: real('position_z').default(0),
  
  // ===== 3D ROTATION =====
  rotationX: real('rotation_x').default(0),
  rotationY: real('rotation_y').default(0),
  rotationZ: real('rotation_z').default(0),
  
  // ===== 3D SCALE =====
  scaleX: real('scale_x').default(1),
  scaleY: real('scale_y').default(1),
  scaleZ: real('scale_z').default(1),
  
  // ===== SOURCE REFERENCE =====
  // Links to the original data source
  sourceType: text('source_type'), // 'plant', 'bed', 'farmbot', 'model', 'character', 'task', 'weather_log'
  sourceId: integer('source_id'), // ID from the source table
  
  // ===== DISPLAY SETTINGS =====
  icon: text('icon'),
  color: text('color'),
  size: real('size').default(1),
  
  // ===== CUSTOM DATA =====
  customData: jsonb('custom_data'), // Flexible storage for type-specific data
  metadata: jsonb('metadata'),
  
  // ===== TIMESTAMPS =====
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  layerIdIdx: index('idx_threed_markers_layer_id').on(table.layerId),
  userIdIdx: index('idx_threed_markers_user_id').on(table.userId),
  typeIdx: index('idx_threed_markers_type').on(table.type),
  sourceIdx: index('idx_threed_markers_source').on(table.sourceType, table.sourceId),
  statusIdx: index('idx_threed_markers_status').on(table.status),
}));

// ============================================
// MARKER RELATIONSHIPS - Parent-Child connections
// ============================================
export const threedMarkerRelationships = pgTable(
  'threed_marker_relationships',
  {
    id: serial('id').primaryKey(),
    
    parentMarkerId: integer('parent_marker_id').references(
      () => threedMarkers.id,
      { onDelete: 'cascade' }
    ),
    childMarkerId: integer('child_marker_id').references(
      () => threedMarkers.id,
      { onDelete: 'cascade' }
    ),
    
    relationshipType: text('relationship_type'), // 'contains', 'attached_to', 'part_of', 'grows_in'
    
    // Metadata
    metadata: jsonb('metadata'),
    
    // Timestamps
    createdAt: timestamp('created_at').defaultNow(),
  }, (table) => ({
    parentIdx: index('idx_threed_marker_relationships_parent').on(table.parentMarkerId),
    childIdx: index('idx_threed_marker_relationships_child').on(table.childMarkerId),
  })
);

// ============================================
// LAYER PRESETS - Saved configurations
// ============================================
export const threedLayerPresets = pgTable('threed_layer_presets', {
  id: serial('id').primaryKey(),
  
  name: text('name').notNull(),
  description: text('description'),
  
  // Which layers are included
  layerIds: jsonb('layer_ids'), // Array of layer IDs
  
  // Preset configuration
  config: jsonb('config'),
  
  userId: integer('user_id').references(() => user.id, { onDelete: 'cascade' }),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_threed_layer_presets_user_id').on(table.userId),
}));

// ============================================
// RELATIONSHIPS - FULLY INTEGRATED
// ============================================

// ---- Existing Relationships (Updated) ----

export const threedPlantsRelations = relations(threedPlants, ({ one, many }) => ({
  plantings: many(threedPlantings),
  harvests: many(threedHarvests),
  tasks: many(threedTasks),
  models: many(threedModels),
  wateringSchedules: many(threedWateringSchedules),
  // NEW: Marker relationship
  marker: one(threedMarkers, {
    fields: [threedPlants.markerId],
    references: [threedMarkers.id],
  }),
}));

export const threedModelsRelations = relations(threedModels, ({ one, many }) => ({
  plant: one(threedPlants, {
    fields: [threedModels.id],
    references: [threedPlants.modelId],
  }),
  character: one(threedCharacters, {
    fields: [threedModels.id],
    references: [threedCharacters.modelId],
  }),
  // NEW: Marker relationship
  marker: one(threedMarkers, {
    fields: [threedModels.markerId],
    references: [threedMarkers.id],
  }),
  modelFiles: many(threedModelFiles),
}));

export const threedBedsRelations = relations(threedBeds, ({ one, many }) => ({
  plantings: many(threedPlantings),
  farmbots: many(threedFarmbots),
  tasks: many(threedTasks),
  wateringSchedules: many(threedWateringSchedules),
  // NEW: Marker relationship
  marker: one(threedMarkers, {
    fields: [threedBeds.markerId],
    references: [threedMarkers.id],
  }),
}));

export const threedPlantingsRelations = relations(threedPlantings, ({ one, many }) => ({
  plant: one(threedPlants, {
    fields: [threedPlantings.plantId],
    references: [threedPlants.id],
  }),
  bed: one(threedBeds, {
    fields: [threedPlantings.bedId],
    references: [threedBeds.id],
  }),
  customModel: one(threedModels, {
    fields: [threedPlantings.customModelId],
    references: [threedModels.id],
  }),
  harvests: many(threedHarvests),
  tasks: many(threedTasks),
  wateringSchedules: many(threedWateringSchedules),
}));

export const threedWateringSchedulesRelations = relations(threedWateringSchedules, ({ one, many }) => ({
  plant: one(threedPlants, {
    fields: [threedWateringSchedules.plantId],
    references: [threedPlants.id],
  }),
  farmbot: one(threedFarmbots, {
    fields: [threedWateringSchedules.farmbotId],
    references: [threedFarmbots.id],
  }),
  bed: one(threedBeds, {
    fields: [threedWateringSchedules.bedId],
    references: [threedBeds.id],
  }),
  planting: one(threedPlantings, {
    fields: [threedWateringSchedules.plantingId],
    references: [threedPlantings.id],
  }),
  history: many(threedWateringHistory),
  tasks: many(threedTasks),
}));

export const threedWateringHistoryRelations = relations(threedWateringHistory, ({ one }) => ({
  schedule: one(threedWateringSchedules, {
    fields: [threedWateringHistory.scheduleId],
    references: [threedWateringSchedules.id],
  }),
  plant: one(threedPlants, {
    fields: [threedWateringHistory.plantId],
    references: [threedPlants.id],
  }),
  farmbot: one(threedFarmbots, {
    fields: [threedWateringHistory.farmbotId],
    references: [threedFarmbots.id],
  }),
  planting: one(threedPlantings, {
    fields: [threedWateringHistory.plantingId],
    references: [threedPlantings.id],
  }),
}));

export const threedFarmbotsRelations = relations(threedFarmbots, ({ one, many }) => ({
  bed: one(threedBeds, {
    fields: [threedFarmbots.bedId],
    references: [threedBeds.id],
  }),
  logs: many(threedFarmbotLogs),
  wateringSchedules: many(threedWateringSchedules),
  wateringHistory: many(threedWateringHistory),
  // NEW: Marker relationship
  marker: one(threedMarkers, {
    fields: [threedFarmbots.markerId],
    references: [threedMarkers.id],
  }),
}));

export const threedTasksRelations = relations(threedTasks, ({ one, many }) => ({
  planting: one(threedPlantings, {
    fields: [threedTasks.plantingId],
    references: [threedPlantings.id],
  }),
  plant: one(threedPlants, {
    fields: [threedTasks.plantId],
    references: [threedPlants.id],
  }),
  bed: one(threedBeds, {
    fields: [threedTasks.bedId],
    references: [threedBeds.id],
  }),
  wateringSchedule: one(threedWateringSchedules, {
    fields: [threedTasks.wateringScheduleId],
    references: [threedWateringSchedules.id],
  }),
  // NEW: Marker relationship
  marker: one(threedMarkers, {
    fields: [threedTasks.markerId],
    references: [threedMarkers.id],
  }),
}));

export const threedWeatherLogsRelations = relations(threedWeatherLogs, ({ one }) => ({
  // NEW: Marker relationship
  marker: one(threedMarkers, {
    fields: [threedWeatherLogs.markerId],
    references: [threedMarkers.id],
  }),
}));

export const threedCharactersRelations = relations(threedCharacters, ({ one }) => ({
  model: one(threedModels, {
    fields: [threedCharacters.modelId],
    references: [threedModels.id],
  }),
  bed: one(threedBeds, {
    fields: [threedCharacters.bedId],
    references: [threedBeds.id],
  }),
  // NEW: Marker relationship
  marker: one(threedMarkers, {
    fields: [threedCharacters.markerId],
    references: [threedMarkers.id],
  }),
}));

export const threedModelFilesRelations = relations(threedModelFiles, ({ one }) => ({
  model: one(threedModels, {
    fields: [threedModelFiles.modelId],
    references: [threedModels.id],
  }),
}));

// ---- NEW: Layers + Markers Relationships ----

export const threedLayersRelations = relations(threedLayers, ({ one, many }) => ({
  user: one(user, {
    fields: [threedLayers.userId],
    references: [user.id],
  }),
  markers: many(threedMarkers),
}));

export const threedMarkersRelations = relations(threedMarkers, ({ one, many }) => ({
  // Layer relationship
  layer: one(threedLayers, {
    fields: [threedMarkers.layerId],
    references: [threedLayers.id],
  }),
  
  // User relationship
  user: one(user, {
    fields: [threedMarkers.userId],
    references: [user.id],
  }),
  
  
  
  
  
  // // ---- SOURCE RELATIONSHIPS (Polymorphic) ----
  // // Each marker can link to one source type
  // plant: one(threedPlants, {
  //   fields: [threedMarkers.sourceId, threedMarkers.sourceType],
  //   references: [threedPlants.id, sql`'plant'`],
  // }),
  // bed: one(threedBeds, {
  //   fields: [threedMarkers.sourceId, threedMarkers.sourceType],
  //   references: [threedBeds.id, sql`'bed'`],
  // }),
  // farmbot: one(threedFarmbots, {
  //   fields: [threedMarkers.sourceId, threedMarkers.sourceType],
  //   references: [threedFarmbots.id, sql`'farmbot'`],
  // }),
  // model: one(threedModels, {
  //   fields: [threedMarkers.sourceId, threedMarkers.sourceType],
  //   references: [threedModels.id, sql`'model'`],
  // }),
  // character: one(threedCharacters, {
  //   fields: [threedMarkers.sourceId, threedMarkers.sourceType],
  //   references: [threedCharacters.id, sql`'character'`],
  // }),
  // task: one(threedTasks, {
  //   fields: [threedMarkers.sourceId, threedMarkers.sourceType],
  //   references: [threedTasks.id, sql`'task'`],
  // }),
  // weatherLog: one(threedWeatherLogs, {
  //   fields: [threedMarkers.sourceId, threedMarkers.sourceType],
  //   references: [threedWeatherLogs.id, sql`'weather_log'`],
  // }),
  
  // // ---- RELATIONSHIPS ----
  // // Parent relationships (this marker as parent)
  // parentRelationships: many(threedMarkerRelationships, {
  //   relationName: 'parentRelationships',
  //   fields: [threedMarkers.id],
  //   references: [threedMarkerRelationships.parentMarkerId],
  // }),
  // // Child relationships (this marker as child)
  // childRelationships: many(threedMarkerRelationships, {
  //   relationName: 'childRelationships',
  //   fields: [threedMarkers.id],
  //   references: [threedMarkerRelationships.childMarkerId],
  // }),



  
}));

export const threedMarkerRelationshipsRelations = relations(threedMarkerRelationships, ({ one }) => ({
  // Parent marker
  parentMarker: one(threedMarkers, {
    fields: [threedMarkerRelationships.parentMarkerId],
    references: [threedMarkers.id],
    relationName: 'parentRelationships',
  }),
  // Child marker
  childMarker: one(threedMarkers, {
    fields: [threedMarkerRelationships.childMarkerId],
    references: [threedMarkers.id],
    relationName: 'childRelationships',
  }),
}));

export const threedLayerPresetsRelations = relations(threedLayerPresets, ({ one }) => ({
  user: one(user, {
    fields: [threedLayerPresets.userId],
    references: [user.id],
  }),
}));

// ============================================
// EXPORT TYPES
// ============================================

// Existing types
export type ThreedPlant = typeof threedPlants.$inferSelect;
export type NewThreedPlant = typeof threedPlants.$inferInsert;
export type ThreedModel = typeof threedModels.$inferSelect;
export type NewThreedModel = typeof threedModels.$inferInsert;
export type ThreedModelFile = typeof threedModelFiles.$inferSelect;
export type NewThreedModelFile = typeof threedModelFiles.$inferInsert;
export type ThreedBed = typeof threedBeds.$inferSelect;
export type NewThreedBed = typeof threedBeds.$inferInsert;
export type ThreedPlanting = typeof threedPlantings.$inferSelect;
export type NewThreedPlanting = typeof threedPlantings.$inferInsert;
export type ThreedWateringSchedule = typeof threedWateringSchedules.$inferSelect;
export type NewThreedWateringSchedule = typeof threedWateringSchedules.$inferInsert;
export type ThreedWateringHistory = typeof threedWateringHistory.$inferSelect;
export type NewThreedWateringHistory = typeof threedWateringHistory.$inferInsert;
export type ThreedHarvest = typeof threedHarvests.$inferSelect;
export type NewThreedHarvest = typeof threedHarvests.$inferInsert;
export type ThreedTask = typeof threedTasks.$inferSelect;
export type NewThreedTask = typeof threedTasks.$inferInsert;
export type ThreedWeatherLog = typeof threedWeatherLogs.$inferSelect;
export type NewThreedWeatherLog = typeof threedWeatherLogs.$inferInsert;
export type ThreedFarmbot = typeof threedFarmbots.$inferSelect;
export type NewThreedFarmbot = typeof threedFarmbots.$inferInsert;
export type ThreedFarmbotLog = typeof threedFarmbotLogs.$inferSelect;
export type NewThreedFarmbotLog = typeof threedFarmbotLogs.$inferInsert;
export type ThreedCharacter = typeof threedCharacters.$inferSelect;
export type NewThreedCharacter = typeof threedCharacters.$inferInsert;

// NEW: Layers + Markers types
export type ThreeDLayer = typeof threedLayers.$inferSelect;
export type NewThreeDLayer = typeof threedLayers.$inferInsert;
export type ThreeDMarker = typeof threedMarkers.$inferSelect;
export type NewThreeDMarker = typeof threedMarkers.$inferInsert;
export type ThreeDMarkerRelationship = typeof threedMarkerRelationships.$inferSelect;
export type NewThreeDMarkerRelationship = typeof threedMarkerRelationships.$inferInsert;
export type ThreeDLayerPreset = typeof threedLayerPresets.$inferSelect;
export type NewThreeDLayerPreset = typeof threedLayerPresets.$inferInsert;

// =====================================
// ## [MM]
// 