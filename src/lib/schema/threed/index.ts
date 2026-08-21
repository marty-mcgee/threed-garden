// @/lib/schema/threed/index
import { 
  pgTable, text, timestamp, boolean, index, serial, varchar, 
  integer, decimal, numeric, jsonb, uniqueIndex, foreignKey,
  pgSchema, pgEnum, time, AnyPgColumn, real,
  check,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { user } from '../auth';
import { project } from '../project';

// ============================================
// THREED MODULE - Main Table
// ============================================

/**
 * threed - Main table for ThreeD module
 * Stores the overall garden configuration and status
 */
export const threed = pgTable('threed', {
  id: serial('id').primaryKey(),

  // Owner
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  projectId: integer('project_id').references(() => project.id, { onDelete: 'cascade' }),
  
  // Basic info
  name: text('name').notNull(),
  description: text('description'),
  slug: text('slug').unique().notNull(),
  
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
  projectIdIdx: index('idx_threed_project_id').on(table.projectId),
}));

// ============================================
// RELATIONSHIPS
// ============================================

export const threedRelations = relations(threed, ({ one, many }) => ({
  user: one(user, {
    fields: [threed.userId],
    references: [user.id],
  }),
  project: one(project, {
    fields: [threed.projectId],
    references: [project.id],
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
export const bedStatusEnum = pgEnum('threed_bed_status', ['active', 'pending', 'maintenance', 'dormant', 'retired']);
export const farmbotStatusEnum = pgEnum('threed_farmbot_status', ['online', 'offline', 'maintenance', 'error']);
export const modelStatusEnum = pgEnum('threed_model_status', ['active', 'pending', 'maintenance', 'dormant', 'retired']);
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
  'stationary', 'wander', 'patrol', 'circle', 'follow', 'teleport', 'ecctrl'
]);

export const characterWeatherSensitivityEnum = pgEnum('threed_character_weather_sensitivity', [
  'all', 'sunny_only', 'rainy_only', 'no_rain', 'no_snow'
]);

export const characterEmoteEnum = pgEnum('threed_character_emote', [
  'none', 'happy', 'sad', 'surprised', 'angry', 'wave', 'dance', 'sleep', 'tired'
]);





// ============================================
// 1. threed_plants - Master plant database
// ============================================
export const threedPlants = pgTable('threed_plants', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  
  // ✅ Required fields
  plantId: varchar('plant_id', { length: 50 }).unique().notNull(),
  commonName: varchar('common_name', { length: 255 }).notNull(),

  // ✅ Optional fields
  scientificName: varchar('scientific_name', { length: 255 }),
  variety: varchar('variety', { length: 100 }),
  family: varchar('family', { length: 100 }),
  type: plantTypeEnum('type').default('Vegetable'),

  // Status
  isActive: boolean('is_active').default(true),
  status: plantStatusEnum('status').default('active'),
  
  // Relationship to model (shared with characters)
  modelId: integer('model_id').references(() => threedModels.id, { onDelete: 'set null' }),
  
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

  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  plantIdIdx: uniqueIndex('idx_threed_plants_plant_id').on(table.plantId),
  commonNameIdx: index('idx_threed_plants_common_name').on(table.commonName),
  typeIdx: index('idx_threed_plants_type').on(table.type),
  activeIdx: index('idx_threed_plants_active').on(table.isActive),
  statusIdx: index('idx_threed_plants_status').on(table.status),
}));

// ============================================
// 1b. threed_models - GLTF model library
// ============================================
export const threedModels = pgTable('threed_models', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  
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
  
  // Status and Metadata
  isActive: boolean('is_active').default(true),
  status: modelStatusEnum('status').default('active'),
  isDefault: boolean('is_default').default(false),
  uploadedBy: varchar('uploaded_by', { length: 255 }),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
  
  // Additional metadata (author, license, etc.)
  metadata: jsonb('metadata').default({}),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  modelTypeIdx: index('idx_threed_models_type').on(table.modelType),
  activeIdx: index('idx_threed_models_active').on(table.isActive),
  statusIdx: index('idx_threed_models_status').on(table.status),
}));

// ============================================
// 1c. threed_model_files - Associated files for 3D models
// ============================================
export const threedModelFiles = pgTable('threed_model_files', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  modelId: integer('model_id').references(() => threedModels.id, { onDelete: 'cascade' }),
  
  // File information
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileType: varchar('file_type', { length: 50 }).notNull(), // 'model', 'texture', 'binary', 'other', 'animation'
  textureType: varchar('texture_type', { length: 50 }), // 'baseColor', 'normalMap', 'roughness', 'metallic', 'emissive', 'occlusion'
  filePath: varchar('file_path', { length: 500 }).notNull(),
  fileSize: integer('file_size'),
  
  // Metadata (for Animations)
  metadata: jsonb('metadata').default({}),
  
  // For GLTF binary
  isBinaryBuffer: boolean('is_binary_buffer').default(false),
  
  // Order in which files should be loaded
  loadOrder: integer('load_order').default(0),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  modelIdIdx: index('idx_threed_model_files_model_id').on(table.modelId),
  fileTypeIdx: index('idx_threed_model_files_type').on(table.fileType),
}));

// ============================================
// 2. threed_beds - Garden layout
// ============================================
export const threedBeds = pgTable('threed_beds', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  
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
  status: bedStatusEnum('status').default('active'),
  color: varchar('color', { length: 20 }).default('#8B5E3C'),
  
  // Metadata
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  bedIdIdx: uniqueIndex('idx_threed_beds_bed_id').on(table.bedId),
  activeIdx: index('idx_threed_beds_active').on(table.isActive),
  statusIdx: index('idx_threed_beds_status').on(table.status),
  nameIdx: index('idx_threed_beds_name').on(table.name),
}));

// ============================================
// 3. threed_plantings - Plants in beds
// ============================================
export const threedPlantings = pgTable('threed_plantings', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  
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
  
  // ✅ Dates - ALL manually set dates need { mode: 'string' }
  plantedDate: timestamp('planted_date', { mode: 'string' }),
  expectedGerminationDate: timestamp('expected_germination_date', { mode: 'string' }),
  expectedHarvestDate: timestamp('expected_harvest_date', { mode: 'string' }),
  actualHarvestDate: timestamp('actual_harvest_date', { mode: 'string' }),
  
  // Status tracking
  isActive: boolean('is_active').default(true),
  status: plantingStatusEnum('status').default('planted'),
  growthStage: growthStageEnum('growth_stage').default('seed'),
  health: varchar('health', { length: 20 }).default('good'),
  notes: text('notes'),
  
  // ✅ Metadata - Database-managed timestamps (NO mode: 'string')
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (table) => ({
  plantingIdIdx: uniqueIndex('idx_threed_plantings_planting_id').on(table.plantingId),
  plantIdx: index('idx_threed_plantings_plant').on(table.plantId),
  bedIdx: index('idx_threed_plantings_bed').on(table.bedId),
  activeIdx: index('idx_threed_plantings_active').on(table.isActive),
  statusIdx: index('idx_threed_plantings_status').on(table.status),
  customModelIdx: index('idx_threed_plantings_custom_model').on(table.customModelId),
}));

// ============================================
// 4. threed_watering_schedules - Automated watering
// ============================================
export const threedWateringSchedules = pgTable('threed_watering_schedules', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  
  scheduleId: varchar('schedule_id', { length: 50 }).unique().notNull(),
  plantId: integer('plant_id').references(() => threedPlants.id, { onDelete: 'cascade' }),
  farmbotId: integer('farmbot_id').references(() => threedFarmbots.id, { onDelete: 'set null' }),
  bedId: integer('bed_id').references(() => threedBeds.id, { onDelete: 'cascade' }),
  plantingId: integer('planting_id').references(() => threedPlantings.id, { onDelete: 'cascade' }),
  
  // Schedule configuration
  frequency: wateringFrequencyEnum('frequency').notNull(),
  intervalDays: integer('interval_days'),
  daysOfWeek: integer('days_of_week').array(),
  timeOfDay: time('time_of_day'),
  
  // Watering parameters
  durationMs: integer('duration_ms').notNull(),
  volumeMl: integer('volume_ml'),
  moistureThreshold: integer('moisture_threshold'),
  
  // ✅ Dates - manually set, need { mode: 'string' }
  nextWatering: timestamp('next_watering', { mode: 'string' }).notNull(),
  lastWatering: timestamp('last_watering', { mode: 'string' }),
  
  isActive: boolean('is_active').default(true),
  
  // Weather awareness
  skipIfRain: boolean('skip_if_rain').default(true),
  maxTemperature: integer('max_temperature'),
  minTemperature: integer('min_temperature'),
  maxWindSpeed: integer('max_wind_speed'),
  
  // Recurrence
  repeatCount: integer('repeat_count'),
  timesExecuted: integer('times_executed').default(0),
  
  notes: text('notes'),
  createdBy: varchar('created_by', { length: 255 }),
  
  // ✅ Metadata - database-managed (NO mode: 'string')
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (table) => ({
  scheduleIdIdx: uniqueIndex('idx_threed_watering_schedule_id').on(table.scheduleId),
  plantIdx: index('idx_threed_watering_plant').on(table.plantId),
  farmbotIdx: index('idx_threed_watering_farmbot').on(table.farmbotId),
  nextWateringIdx: index('idx_threed_watering_next').on(table.nextWatering),
  activeIdx: index('idx_threed_watering_active').on(table.isActive),
  compositeNextActiveIdx: index('idx_threed_watering_next_active').on(table.nextWatering, table.isActive),
}));

// ============================================
// 4. threed_watering_schedules - Automated watering
// ============================================
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

// ============================================
// 5. threed_watering_history - Watering logs
// ============================================
export const threedWateringHistory = pgTable('threed_watering_history', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),

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
  
  // ✅ Date - manually set, needs { mode: 'string' }
  // Execution metadata
  // 'automated', 'manual', 'user'
  executedAt: timestamp('executed_at', { mode: 'string' }).defaultNow(),
  executedBy: varchar('executed_by', { length: 50 }).default('automated'),
  
  // ✅ Metadata - database-managed (NO mode: 'string')
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (table) => ({
  historyIdIdx: uniqueIndex('idx_threed_watering_history_id').on(table.historyId),
  scheduleIdx: index('idx_threed_watering_history_schedule').on(table.scheduleId),
  plantIdx: index('idx_threed_watering_history_plant').on(table.plantId),
  executedAtIdx: index('idx_threed_watering_history_executed_at').on(table.executedAt),
  statusIdx: index('idx_threed_watering_history_status').on(table.status),
}));

// ============================================
// 4. threed_watering_schedules - Automated watering
// ============================================
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

// ============================================
// 6. threed_harvests - Harvest logging
// ============================================
export const threedHarvests = pgTable('threed_harvests', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  
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

  // Status
  isActive: boolean('is_active').default(true),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  harvestIdIdx: uniqueIndex('idx_threed_harvests_harvest_id').on(table.harvestId),
  plantingIdx: index('idx_threed_harvests_planting').on(table.plantingId),
  harvestDateIdx: index('idx_threed_harvests_date').on(table.harvestDate),
}));

// ============================================
// 7. threed_tasks - Garden tasks/to-do
// ============================================
export const threedTasks = pgTable('threed_tasks', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  
  taskId: varchar('task_id', { length: 50 }).unique().notNull(),  
  // Task details
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }), // water, fertilize, prune, harvest, weed, pest_control, plant
  
  // Status and priority
  priority: taskPriorityEnum('priority').default('medium'),
  status: taskStatusEnum('status').default('pending'),
  isActive: boolean('is_active').default(true),
  
  // Scheduling
  dueDate: timestamp('due_date', { mode: 'string' }), // ✅ Use string mode
  completedAt: timestamp('completed_at', { mode: 'string' }), // ✅ Use string mode
  
  // ✅ Foreign keys (optional)
  plantingId: integer('planting_id').references(() => threedPlantings.id, { onDelete: 'set null' }),
  plantId: integer('plant_id').references(() => threedPlants.id, { onDelete: 'set null' }),
  bedId: integer('bed_id').references(() => threedBeds.id, { onDelete: 'set null' }),
  wateringScheduleId: integer('watering_schedule_id').references(() => threedWateringSchedules.id, { onDelete: 'set null' }),
  
  // Metadata
  assignedTo: varchar('assigned_to', { length: 100 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_threed_tasks_user_id').on(table.userId),
  taskIdIdx: uniqueIndex('idx_threed_tasks_task_id').on(table.taskId),
  dueDateIdx: index('idx_threed_tasks_due_date').on(table.dueDate),
  priorityIdx: index('idx_threed_tasks_priority').on(table.priority),
  activeIdx: index('idx_threed_tasks_active').on(table.isActive),
  statusIdx: index('idx_threed_tasks_status').on(table.status),
  plantingIdx: index('idx_threed_tasks_planting').on(table.plantingId),
  plantIdx: index('idx_threed_tasks_plant').on(table.plantId),
  bedIdx: index('idx_threed_tasks_bed').on(table.bedId),
  wateringScheduleIdx: index('idx_threed_tasks_watering').on(table.wateringScheduleId),
}));

// ============================================
// 8. threed_weather_logs - Environmental data
// ============================================
export const threedWeatherLogs = pgTable('threed_weather_logs', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),

  // ✅ Date - manually set, needs { mode: 'string' }
  recordedAt: timestamp('recorded_at', { mode: 'string' }).defaultNow(),
  
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
  
  // Source and metadata
  source: varchar('source', { length: 50 }).default('api'),
  rawData: jsonb('raw_data'),

  // ✅ Metadata - database-managed (NO mode: 'string')
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (table) => ({
  recordedAtIdx: index('idx_threed_weather_recorded_at').on(table.recordedAt),
}));

// ============================================
// 9. threed_farmbots - FarmBot devices
// ============================================
export const threedFarmbots = pgTable('threed_farmbots', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  
  // App-facing code used for search and display (for example, FARMBOT-003).
  assetCode: varchar('asset_code', { length: 100 }).unique().notNull(),

  // Authoritative identities populated only after FarmBot REST/token verification.
  farmbotDeviceId: integer('farmbot_device_id').unique(),
  brokerDeviceId: varchar('broker_device_id', { length: 100 }).unique(),
  name: varchar('name', { length: 100 }).notNull(),

  // Status
  isActive: boolean('is_active').default(true),
  status: farmbotStatusEnum('status').default('offline'),
  
  // Location in garden
  bedId: integer('bed_id').references(() => threedBeds.id, { onDelete: 'set null' }),
  positionX: decimal('position_x', { precision: 8, scale: 2 }),
  positionY: decimal('position_y', { precision: 8, scale: 2 }),
  positionZ: decimal('position_z', { precision: 8, scale: 2 }),
  
  // Configuration
  // apiToken is a quarantined legacy plaintext field. Do not read or write it.
  apiToken: varchar('api_token', { length: 255 }),
  apiUrl: varchar('api_url', { length: 255 }),

  // Encrypted credential envelope (AES-256-GCM)
  credentialCiphertext: text('credential_ciphertext'),
  credentialIv: varchar('credential_iv', { length: 32 }),
  credentialAuthTag: varchar('credential_auth_tag', { length: 32 }),
  credentialEnvelopeVersion: integer('credential_envelope_version'),
  credentialKeyVersion: integer('credential_key_version'),
  credentialUpdatedAt: timestamp('credential_updated_at'),
  
  // Last known data
  lastSeen: timestamp('last_seen'),
  batteryLevel: integer('battery_level'),
  firmwareVersion: varchar('firmware_version', { length: 50 }),
  
  // Metadata
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  assetCodeIdx: uniqueIndex('idx_threed_farmbots_asset_code').on(table.assetCode),
  farmbotDeviceIdIdx: uniqueIndex('idx_threed_farmbots_farmbot_device_id')
    .on(table.farmbotDeviceId),
  brokerDeviceIdIdx: uniqueIndex('idx_threed_farmbots_broker_device_id')
    .on(table.brokerDeviceId),
  activeIdx: index('idx_threed_farmbots_active').on(table.isActive),
  statusIdx: index('idx_threed_farmbots_status').on(table.status),
  credentialEnvelopeComplete: check(
    'threed_farmbots_credential_envelope_complete',
    sql`(
      (${table.credentialCiphertext} IS NULL
        AND ${table.credentialIv} IS NULL
        AND ${table.credentialAuthTag} IS NULL
        AND ${table.credentialEnvelopeVersion} IS NULL
        AND ${table.credentialKeyVersion} IS NULL
        AND ${table.credentialUpdatedAt} IS NULL)
      OR
      (${table.credentialCiphertext} IS NOT NULL
        AND ${table.credentialIv} IS NOT NULL
        AND ${table.credentialAuthTag} IS NOT NULL
        AND ${table.credentialEnvelopeVersion} = 1
        AND ${table.credentialKeyVersion} > 0
        AND ${table.credentialUpdatedAt} IS NOT NULL)
    )`
  ),
}));

// ============================================
// 10. threed_farmbot_peripheral_bindings - Semantic action bindings
// ============================================
export const threedFarmbotPeripheralBindings = pgTable('threed_farmbot_peripheral_bindings', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  farmbotId: integer('farmbot_id').notNull().references(() => threedFarmbots.id, {
    onDelete: 'cascade',
  }),

  // App-level action name. API allowlists determine which actions may be assigned.
  semanticAction: varchar('semantic_action', { length: 50 }).notNull(),

  // Authoritative FarmBot REST resource identity plus review snapshots.
  peripheralId: integer('peripheral_id').notNull(),
  peripheralLabel: varchar('peripheral_label', { length: 200 }).notNull(),
  peripheralPin: integer('peripheral_pin').notNull(),
  peripheralMode: integer('peripheral_mode').notNull(),

  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (table) => ({
  uniqueFarmbotAction: uniqueIndex('idx_threed_farmbot_peripheral_binding_action')
    .on(table.farmbotId, table.semanticAction),
  ownerIdx: index('idx_threed_farmbot_peripheral_bindings_owner').on(table.userId),
  farmbotIdx: index('idx_threed_farmbot_peripheral_bindings_farmbot').on(table.farmbotId),
  peripheralIdPositive: check(
    'threed_farmbot_peripheral_bindings_peripheral_id_positive',
    sql`${table.peripheralId} > 0`
  ),
  peripheralPinNonnegative: check(
    'threed_farmbot_peripheral_bindings_pin_nonnegative',
    sql`${table.peripheralPin} >= 0`
  ),
  peripheralModeValid: check(
    'threed_farmbot_peripheral_bindings_mode_valid',
    sql`${table.peripheralMode} IN (0, 1)`
  ),
}));

// ============================================
// 11. threed_farmbot_broker_metadata - Current broker connection snapshot
// ============================================
export const threedFarmbotBrokerMetadata = pgTable('threed_farmbot_broker_metadata', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  farmbotId: integer('farmbot_id').notNull().references(() => threedFarmbots.id, {
    onDelete: 'cascade',
  }),
  mqttHost: varchar('mqtt_host', { length: 253 }).notNull(),
  mqttWsUrl: varchar('mqtt_ws_url', { length: 500 }).notNull(),
  // Token-observed identity retained during parent-identity backfill and diagnostics.
  brokerDeviceId: varchar('broker_device_id', { length: 100 }).notNull(),
  vhost: varchar('vhost', { length: 255 }).notNull(),
  tokenIssuedAt: timestamp('token_issued_at').notNull(),
  tokenExpiresAt: timestamp('token_expires_at').notNull(),
  observedAt: timestamp('observed_at').defaultNow().notNull(),
  restVerifiedAt: timestamp('rest_verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (table) => ({
  uniqueFarmbot: uniqueIndex('idx_threed_farmbot_broker_metadata_farmbot')
    .on(table.farmbotId),
  ownerIdx: index('idx_threed_farmbot_broker_metadata_owner').on(table.userId),
  brokerDeviceIdx: index('idx_threed_farmbot_broker_metadata_device').on(table.brokerDeviceId),
  tokenDatesValid: check(
    'threed_farmbot_broker_metadata_token_dates_valid',
    sql`${table.tokenExpiresAt} > ${table.tokenIssuedAt}`
  ),
}));

// ============================================
// 12. threed_mqtt_runtime - Current allowlisted MQTT integration status
// ============================================
export const threedMqttRuntime = pgTable('threed_mqtt_runtime', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  integrationType: varchar('integration_type', { length: 50 }).notNull(),
  integrationId: integer('integration_id').notNull(),
  clientId: varchar('client_id', { length: 100 }).notNull(),
  sessionId: varchar('session_id', { length: 36 }).notNull(),
  connectionState: varchar('connection_state', { length: 20 }).notNull(),
  stateChangedAt: timestamp('state_changed_at').notNull(),
  lastMessageAt: timestamp('last_message_at'),
  lastStatusAt: timestamp('last_status_at'),
  positionX: decimal('position_x', { precision: 12, scale: 3 }),
  positionY: decimal('position_y', { precision: 12, scale: 3 }),
  positionZ: decimal('position_z', { precision: 12, scale: 3 }),
  credentialExpiresAt: timestamp('credential_expires_at').notNull(),
  isStale: boolean('is_stale').default(true).notNull(),
  reconnectAttempts: integer('reconnect_attempts').default(0).notNull(),
  invalidMessageCount: integer('invalid_message_count').default(0).notNull(),
  errorCode: varchar('error_code', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (table) => ({
  uniqueIntegration: uniqueIndex('idx_threed_mqtt_runtime_integration')
    .on(table.integrationType, table.integrationId),
  ownerIdx: index('idx_threed_mqtt_runtime_owner').on(table.userId),
  clientIdx: index('idx_threed_mqtt_runtime_client').on(table.clientId),
  integrationTypeValid: check(
    'threed_mqtt_runtime_integration_type_valid',
    sql`${table.integrationType} ~ '^[a-z][a-z0-9_]{1,49}$'`
  ),
  connectionStateValid: check(
    'threed_mqtt_runtime_connection_state_valid',
    sql`${table.connectionState} IN ('disconnected', 'connecting', 'connected', 'reconnecting', 'expired', 'error')`
  ),
  reconnectAttemptsNonnegative: check(
    'threed_mqtt_runtime_reconnect_attempts_nonnegative',
    sql`${table.reconnectAttempts} >= 0`
  ),
  invalidMessageCountNonnegative: check(
    'threed_mqtt_runtime_invalid_message_count_nonnegative',
    sql`${table.invalidMessageCount} >= 0`
  ),
}));

// ============================================
// 13. threed_mqtt_events - Normalized MQTT/lifecycle history
// ============================================
export const threedMqttEvents = pgTable('threed_mqtt_events', {
  id: serial('id').primaryKey(),
  eventId: varchar('event_id', { length: 36 }).notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  integrationType: varchar('integration_type', { length: 50 }).notNull(),
  integrationId: integer('integration_id').notNull(),
  clientId: varchar('client_id', { length: 100 }).notNull(),
  sessionId: varchar('session_id', { length: 36 }).notNull(),
  source: varchar('source', { length: 20 }).notNull(),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  connectionState: varchar('connection_state', { length: 20 }),
  outcome: varchar('outcome', { length: 20 }),
  rpcLabel: varchar('rpc_label', { length: 100 }),
  errorCode: varchar('error_code', { length: 100 }),
  positionX: decimal('position_x', { precision: 12, scale: 3 }),
  positionY: decimal('position_y', { precision: 12, scale: 3 }),
  positionZ: decimal('position_z', { precision: 12, scale: 3 }),
  summary: varchar('summary', { length: 500 }).notNull(),
  payloadBytes: integer('payload_bytes').notNull(),
  payloadSha256: varchar('payload_sha256', { length: 64 }).notNull(),
  occurredAt: timestamp('occurred_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  eventIdIdx: uniqueIndex('idx_threed_mqtt_events_event_id').on(table.eventId),
  ownerIdx: index('idx_threed_mqtt_events_owner').on(table.userId),
  integrationOccurredIdx: index('idx_threed_mqtt_events_integration_occurred')
    .on(table.integrationType, table.integrationId, table.occurredAt),
  sessionIdx: index('idx_threed_mqtt_events_session').on(table.sessionId),
  typeIdx: index('idx_threed_mqtt_events_type').on(table.eventType),
  integrationTypeValid: check(
    'threed_mqtt_events_integration_type_valid',
    sql`${table.integrationType} ~ '^[a-z][a-z0-9_]{1,49}$'`
  ),
  sourceValid: check(
    'threed_mqtt_events_source_valid',
    sql`${table.source} IN ('lifecycle', 'status', 'from_device')`
  ),
  eventTypeValid: check(
    'threed_mqtt_events_event_type_valid',
    sql`${table.eventType} IN ('connection_state', 'position', 'rpc_ok', 'rpc_error', 'invalid_message_summary')`
  ),
  connectionStateValid: check(
    'threed_mqtt_events_connection_state_valid',
    sql`${table.connectionState} IS NULL OR ${table.connectionState} IN ('disconnected', 'connecting', 'connected', 'reconnecting', 'expired', 'error')`
  ),
  payloadBytesValid: check(
    'threed_mqtt_events_payload_bytes_valid',
    sql`${table.payloadBytes} >= 0 AND ${table.payloadBytes} <= 262144`
  ),
  payloadSha256Valid: check(
    'threed_mqtt_events_payload_sha256_valid',
    sql`${table.payloadSha256} ~ '^[0-9a-f]{64}$'`
  ),
}));

// ============================================
// 14. threed_farmbot_commands - Semantic command audit/request state
// ============================================
export const threedFarmbotCommands = pgTable('threed_farmbot_commands', {
  id: serial('id').primaryKey(),
  commandId: varchar('command_id', { length: 36 }).notNull(),
  idempotencyKey: varchar('idempotency_key', { length: 36 }).notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  projectId: integer('project_id').notNull().references(() => project.id, {
    onDelete: 'cascade',
  }),
  farmbotId: integer('farmbot_id').notNull().references(() => threedFarmbots.id, {
    onDelete: 'cascade',
  }),
  policyVersion: integer('policy_version').notNull(),
  semanticCommand: varchar('semantic_command', { length: 50 }).notNull(),
  state: varchar('state', { length: 20 }).notNull().default('requested'),

  // Populated only after server-side binding validation and policy resolution.
  peripheralBindingId: integer('peripheral_binding_id').references(
    () => threedFarmbotPeripheralBindings.id,
    { onDelete: 'set null' }
  ),
  peripheralId: integer('peripheral_id'),
  peripheralPin: integer('peripheral_pin'),
  durationMs: integer('duration_ms'),

  // Broker correlation and redacted audit outcome. No raw command payload is stored.
  rpcLabel: varchar('rpc_label', { length: 100 }),
  rejectionCode: varchar('rejection_code', { length: 100 }),
  commandFingerprint: varchar('command_fingerprint', { length: 64 }),

  // Water-off recovery has its own broker correlation and audit lifecycle.
  // No raw recovery payload is stored.
  recoveryState: varchar('recovery_state', { length: 20 }),
  recoveryRpcLabel: varchar('recovery_rpc_label', { length: 100 }),
  recoveryErrorCode: varchar('recovery_error_code', { length: 100 }),
  recoveryRequiredAt: timestamp('recovery_required_at'),
  recoveryDispatchedAt: timestamp('recovery_dispatched_at'),
  recoveryResolvedAt: timestamp('recovery_resolved_at'),

  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  validatedAt: timestamp('validated_at'),
  acceptedAt: timestamp('accepted_at'),
  dispatchedAt: timestamp('dispatched_at'),
  acknowledgedAt: timestamp('acknowledged_at'),
  completedAt: timestamp('completed_at'),
  terminalAt: timestamp('terminal_at'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (table) => ({
  commandIdIdx: uniqueIndex('idx_threed_farmbot_commands_command_id').on(table.commandId),
  idempotencyIdx: uniqueIndex('idx_threed_farmbot_commands_idempotency')
    .on(table.userId, table.farmbotId, table.idempotencyKey),
  rpcLabelIdx: uniqueIndex('idx_threed_farmbot_commands_rpc_label').on(table.rpcLabel),
  recoveryRpcLabelIdx: uniqueIndex('idx_threed_farmbot_commands_recovery_rpc_label')
    .on(table.recoveryRpcLabel),
  ownerIdx: index('idx_threed_farmbot_commands_owner').on(table.userId),
  projectIdx: index('idx_threed_farmbot_commands_project').on(table.projectId),
  farmbotStateIdx: index('idx_threed_farmbot_commands_farmbot_state')
    .on(table.farmbotId, table.state),
  commandIdValid: check(
    'threed_farmbot_commands_command_id_valid',
    sql`${table.commandId} ~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'`
  ),
  idempotencyKeyValid: check(
    'threed_farmbot_commands_idempotency_key_valid',
    sql`${table.idempotencyKey} ~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'`
  ),
  policyVersionValid: check(
    'threed_farmbot_commands_policy_version_valid',
    sql`${table.policyVersion} = 1`
  ),
  semanticCommandValid: check(
    'threed_farmbot_commands_semantic_command_valid',
    sql`${table.semanticCommand} IN ('water')`
  ),
  stateValid: check(
    'threed_farmbot_commands_state_valid',
    sql`${table.state} IN ('requested', 'validated', 'accepted', 'dispatched', 'acknowledged', 'completed', 'rejected', 'timed_out', 'cancelled')`
  ),
  waterResolutionComplete: check(
    'threed_farmbot_commands_water_resolution_complete',
    sql`(
      (${table.peripheralId} IS NULL AND ${table.peripheralPin} IS NULL AND ${table.durationMs} IS NULL)
      OR
      (${table.peripheralId} > 0 AND ${table.peripheralPin} >= 0 AND ${table.durationMs} > 0)
    )`
  ),
  rpcLabelValid: check(
    'threed_farmbot_commands_rpc_label_valid',
    sql`${table.rpcLabel} IS NULL OR ${table.rpcLabel} ~ '^[A-Za-z0-9_-]+$'`
  ),
  rejectionCodeValid: check(
    'threed_farmbot_commands_rejection_code_valid',
    sql`${table.rejectionCode} IS NULL OR ${table.rejectionCode} ~ '^[a-z][a-z0-9_]*$'`
  ),
  commandFingerprintValid: check(
    'threed_farmbot_commands_fingerprint_valid',
    sql`${table.commandFingerprint} IS NULL OR ${table.commandFingerprint} ~ '^[0-9a-f]{64}$'`
  ),
  recoveryStateValid: check(
    'threed_farmbot_commands_recovery_state_valid',
    sql`${table.recoveryState} IS NULL OR ${table.recoveryState} IN ('required', 'dispatched', 'confirmed', 'failed')`
  ),
  recoveryRpcLabelValid: check(
    'threed_farmbot_commands_recovery_rpc_label_valid',
    sql`${table.recoveryRpcLabel} IS NULL OR ${table.recoveryRpcLabel} ~ '^[A-Za-z0-9_-]+$'`
  ),
  recoveryErrorCodeValid: check(
    'threed_farmbot_commands_recovery_error_code_valid',
    sql`${table.recoveryErrorCode} IS NULL OR ${table.recoveryErrorCode} ~ '^[a-z][a-z0-9_]*$'`
  ),
  recoveryLifecycleValid: check(
    'threed_farmbot_commands_recovery_lifecycle_valid',
    sql`(
      (${table.recoveryState} IS NULL
        AND ${table.recoveryRpcLabel} IS NULL
        AND ${table.recoveryErrorCode} IS NULL
        AND ${table.recoveryRequiredAt} IS NULL
        AND ${table.recoveryDispatchedAt} IS NULL
        AND ${table.recoveryResolvedAt} IS NULL)
      OR
      (${table.recoveryState} = 'required'
        AND ${table.recoveryRpcLabel} IS NOT NULL
        AND ${table.recoveryErrorCode} IS NULL
        AND ${table.recoveryRequiredAt} IS NOT NULL
        AND ${table.recoveryDispatchedAt} IS NULL
        AND ${table.recoveryResolvedAt} IS NULL)
      OR
      (${table.recoveryState} = 'dispatched'
        AND ${table.recoveryRpcLabel} IS NOT NULL
        AND ${table.recoveryErrorCode} IS NULL
        AND ${table.recoveryRequiredAt} IS NOT NULL
        AND ${table.recoveryDispatchedAt} IS NOT NULL
        AND ${table.recoveryResolvedAt} IS NULL)
      OR
      (${table.recoveryState} = 'confirmed'
        AND ${table.recoveryRpcLabel} IS NOT NULL
        AND ${table.recoveryErrorCode} IS NULL
        AND ${table.recoveryRequiredAt} IS NOT NULL
        AND ${table.recoveryDispatchedAt} IS NOT NULL
        AND ${table.recoveryResolvedAt} IS NOT NULL)
      OR
      (${table.recoveryState} = 'failed'
        AND ${table.recoveryRpcLabel} IS NOT NULL
        AND ${table.recoveryErrorCode} IS NOT NULL
        AND ${table.recoveryRequiredAt} IS NOT NULL
        AND ${table.recoveryDispatchedAt} IS NOT NULL
        AND ${table.recoveryResolvedAt} IS NOT NULL)
    )`
  ),
  recoveryTimestampOrderValid: check(
    'threed_farmbot_commands_recovery_timestamp_order_valid',
    sql`(
      (${table.recoveryDispatchedAt} IS NULL OR ${table.recoveryDispatchedAt} >= ${table.recoveryRequiredAt})
      AND
      (${table.recoveryResolvedAt} IS NULL OR ${table.recoveryResolvedAt} >= ${table.recoveryDispatchedAt})
    )`
  ),
  expiryValid: check(
    'threed_farmbot_commands_expiry_valid',
    sql`${table.expiresAt} > ${table.requestedAt}`
  ),
}));

// ============================================
// 15. threed_farmbot_emergency_actions - Independent Water-off safety audit
// ============================================
export const threedFarmbotEmergencyActions = pgTable('threed_farmbot_emergency_actions', {
  id: serial('id').primaryKey(),
  emergencyId: varchar('emergency_id', { length: 36 }).notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  farmbotId: integer('farmbot_id').notNull().references(() => threedFarmbots.id, {
    onDelete: 'cascade',
  }),
  policyVersion: integer('policy_version').notNull(),
  semanticAction: varchar('semantic_action', { length: 50 }).notNull(),
  state: varchar('state', { length: 20 }).notNull().default('requested'),
  peripheralBindingId: integer('peripheral_binding_id').references(
    () => threedFarmbotPeripheralBindings.id,
    { onDelete: 'set null' }
  ),
  peripheralId: integer('peripheral_id'),
  peripheralPin: integer('peripheral_pin'),
  peripheralMode: integer('peripheral_mode'),
  rpcLabel: varchar('rpc_label', { length: 100 }).notNull(),
  outcomeErrorCode: varchar('outcome_error_code', { length: 100 }),
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  validatedAt: timestamp('validated_at'),
  acceptedAt: timestamp('accepted_at'),
  dispatchedAt: timestamp('dispatched_at'),
  acknowledgedAt: timestamp('acknowledged_at'),
  terminalAt: timestamp('terminal_at'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (table) => ({
  emergencyIdIdx: uniqueIndex('idx_threed_farmbot_emergency_actions_emergency_id')
    .on(table.emergencyId),
  rpcLabelIdx: uniqueIndex('idx_threed_farmbot_emergency_actions_rpc_label').on(table.rpcLabel),
  ownerIdx: index('idx_threed_farmbot_emergency_actions_owner').on(table.userId),
  farmbotStateIdx: index('idx_threed_farmbot_emergency_actions_farmbot_state')
    .on(table.farmbotId, table.state),
  requestedAtIdx: index('idx_threed_farmbot_emergency_actions_requested_at')
    .on(table.requestedAt),
  emergencyIdValid: check(
    'threed_farmbot_emergency_actions_emergency_id_valid',
    sql`${table.emergencyId} ~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'`
  ),
  policyVersionValid: check(
    'threed_farmbot_emergency_actions_policy_version_valid',
    sql`${table.policyVersion} = 1`
  ),
  semanticActionValid: check(
    'threed_farmbot_emergency_actions_semantic_action_valid',
    sql`${table.semanticAction} = 'emergency_water_off'`
  ),
  stateValid: check(
    'threed_farmbot_emergency_actions_state_valid',
    sql`${table.state} IN ('requested', 'validated', 'accepted', 'dispatched', 'acknowledged', 'failed', 'rejected', 'expired')`
  ),
  resolutionComplete: check(
    'threed_farmbot_emergency_actions_resolution_complete',
    sql`(
      (${table.peripheralBindingId} IS NULL AND ${table.peripheralId} IS NULL
        AND ${table.peripheralPin} IS NULL AND ${table.peripheralMode} IS NULL)
      OR (${table.peripheralId} > 0
        AND ${table.peripheralPin} >= 0 AND ${table.peripheralMode} = 0)
    )`
  ),
  rpcLabelValid: check(
    'threed_farmbot_emergency_actions_rpc_label_valid',
    sql`${table.rpcLabel} ~ '^threed_emergency_off_[0-9a-f]{32}$'`
  ),
  outcomeErrorCodeValid: check(
    'threed_farmbot_emergency_actions_error_code_valid',
    sql`${table.outcomeErrorCode} IS NULL OR ${table.outcomeErrorCode} ~ '^[a-z][a-z0-9_]*$'`
  ),
  expiryValid: check(
    'threed_farmbot_emergency_actions_expiry_valid',
    sql`${table.expiresAt} = ${table.requestedAt} + interval '60 seconds'`
  ),
  timestampOrderValid: check(
    'threed_farmbot_emergency_actions_timestamp_order_valid',
    sql`(
      (${table.validatedAt} IS NULL OR ${table.validatedAt} >= ${table.requestedAt})
      AND (${table.acceptedAt} IS NULL OR ${table.acceptedAt} >= ${table.validatedAt})
      AND (${table.dispatchedAt} IS NULL OR ${table.dispatchedAt} >= ${table.acceptedAt})
      AND (${table.acknowledgedAt} IS NULL OR ${table.acknowledgedAt} >= ${table.dispatchedAt})
      AND (${table.terminalAt} IS NULL OR ${table.terminalAt} >= ${table.requestedAt})
      AND (${table.terminalAt} IS NULL OR ${table.validatedAt} IS NULL
        OR ${table.terminalAt} >= ${table.validatedAt})
      AND (${table.terminalAt} IS NULL OR ${table.acceptedAt} IS NULL
        OR ${table.terminalAt} >= ${table.acceptedAt})
      AND (${table.terminalAt} IS NULL OR ${table.dispatchedAt} IS NULL
        OR ${table.terminalAt} >= ${table.dispatchedAt})
      AND (${table.terminalAt} IS NULL OR ${table.acknowledgedAt} IS NULL
        OR ${table.terminalAt} >= ${table.acknowledgedAt})
    )`
  ),
  lifecycleValid: check(
    'threed_farmbot_emergency_actions_lifecycle_valid',
    sql`(
      (${table.state} = 'requested' AND ${table.validatedAt} IS NULL
        AND ${table.acceptedAt} IS NULL AND ${table.dispatchedAt} IS NULL
        AND ${table.acknowledgedAt} IS NULL AND ${table.terminalAt} IS NULL
        AND ${table.outcomeErrorCode} IS NULL)
      OR (${table.state} = 'validated' AND ${table.peripheralId} IS NOT NULL
        AND ${table.validatedAt} IS NOT NULL AND ${table.acceptedAt} IS NULL
        AND ${table.dispatchedAt} IS NULL AND ${table.acknowledgedAt} IS NULL
        AND ${table.terminalAt} IS NULL AND ${table.outcomeErrorCode} IS NULL)
      OR (${table.state} = 'accepted' AND ${table.peripheralId} IS NOT NULL
        AND ${table.validatedAt} IS NOT NULL AND ${table.acceptedAt} IS NOT NULL
        AND ${table.dispatchedAt} IS NULL AND ${table.acknowledgedAt} IS NULL
        AND ${table.terminalAt} IS NULL AND ${table.outcomeErrorCode} IS NULL)
      OR (${table.state} = 'dispatched' AND ${table.peripheralId} IS NOT NULL
        AND ${table.validatedAt} IS NOT NULL AND ${table.acceptedAt} IS NOT NULL
        AND ${table.dispatchedAt} IS NOT NULL AND ${table.acknowledgedAt} IS NULL
        AND ${table.terminalAt} IS NULL AND ${table.outcomeErrorCode} IS NULL)
      OR (${table.state} = 'acknowledged' AND ${table.peripheralId} IS NOT NULL
        AND ${table.validatedAt} IS NOT NULL AND ${table.acceptedAt} IS NOT NULL
        AND ${table.dispatchedAt} IS NOT NULL AND ${table.acknowledgedAt} IS NOT NULL
        AND ${table.terminalAt} IS NOT NULL AND ${table.outcomeErrorCode} IS NULL)
      OR (${table.state} = 'failed' AND ${table.peripheralId} IS NOT NULL
        AND ${table.validatedAt} IS NOT NULL AND ${table.acceptedAt} IS NOT NULL
        AND ${table.dispatchedAt} IS NOT NULL AND ${table.acknowledgedAt} IS NULL
        AND ${table.terminalAt} IS NOT NULL AND ${table.outcomeErrorCode} IS NOT NULL)
      OR (${table.state} = 'rejected' AND ${table.acceptedAt} IS NULL
        AND ${table.dispatchedAt} IS NULL AND ${table.acknowledgedAt} IS NULL
        AND ${table.terminalAt} IS NOT NULL AND ${table.outcomeErrorCode} IS NOT NULL)
      OR (${table.state} = 'expired' AND ${table.acceptedAt} IS NULL
        AND ${table.dispatchedAt} IS NULL AND ${table.acknowledgedAt} IS NULL
        AND ${table.terminalAt} IS NOT NULL AND ${table.outcomeErrorCode} IS NULL)
    )`
  ),
}));

// ============================================
// 16. threed_farmbot_logs - Legacy FarmBot activity log
// ============================================
export const threedFarmbotLogs = pgTable('threed_farmbot_logs', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  farmbotId: integer('farmbot_id').references(() => threedFarmbots.id, { onDelete: 'cascade' }),
  
  eventType: varchar('event_type', { length: 50 }),
  status: varchar('status', { length: 20 }),
  message: text('message'),
  sensorData: jsonb('sensor_data'),
  rawData: jsonb('raw_data'),
  
  // ✅ Date - manually set, needs { mode: 'string' }
  loggedAt: timestamp('logged_at', { mode: 'string' }).defaultNow(),
  
  // ✅ Metadata - database-managed (NO mode: 'string')
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull(),
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
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  
  level: varchar('level', { length: 20 }),
  source: varchar('source', { length: 100 }),
  message: text('message'),
  details: jsonb('details'),
  
  // ✅ Date - manually set, needs { mode: 'string' }
  loggedAt: timestamp('logged_at', { mode: 'string' }).defaultNow(),
  
  // ✅ Metadata - database-managed (NO mode: 'string')
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (table) => ({
  levelIdx: index('idx_threed_system_logs_level').on(table.level),
  loggedAtIdx: index('idx_threed_system_logs_logged_at').on(table.loggedAt),
}))

// ============================================
// 12. threed_characters - Characters and creatures
// ============================================
export const threedCharacters = pgTable('threed_characters', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  
  characterId: varchar('character_id', { length: 50 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: characterTypeEnum('type').default('animal'),

  // Status
  isActive: boolean('is_active').default(true),
  status: characterStatusEnum('status').default('active'),
  
  // Model relationship
  modelId: integer('model_id').references(() => threedModels.id, { onDelete: 'set null' }),
  
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
  metadata: jsonb('metadata').default({}),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  characterIdIdx: uniqueIndex('idx_threed_characters_character_id').on(table.characterId),
  nameIdx: index('idx_threed_characters_name').on(table.name),
  typeIdx: index('idx_threed_characters_type').on(table.type),
  activeIdx: index('idx_threed_characters_active').on(table.isActive),
  statusIdx: index('idx_threed_characters_status').on(table.status),
  movementTypeIdx: index('idx_threed_characters_movement_type').on(table.movementType),
  modelIdx: index('idx_threed_characters_model').on(table.modelId),
  visibleIdx: index('idx_threed_characters_visible').on(table.visible),
}));

// lib/schema/threed/index.ts

// ✅ Junction table: Character <-> Models (many-to-many)
export const threedCharacterModels = pgTable('threed_character_models', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  characterId: integer('character_id').references(() => threedCharacters.id, { onDelete: 'cascade' }),
  modelId: integer('model_id').references(() => threedModels.id, { onDelete: 'cascade' }),
  
  // Model-specific configuration for this character
  config: jsonb('config').default({}), // { animation: 'idle', scale: 1.0, position: {x:0, y:0, z:0} }
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  characterIdIdx: index('idx_threed_character_models_character_id').on(table.characterId),
  modelIdIdx: index('idx_threed_character_models_model_id').on(table.modelId),
  uniqueCharacterModel: uniqueIndex('idx_threed_character_models_unique').on(table.characterId, table.modelId),
}));

// ============================================
// ============================================




// ============================================
// ENUMS for Layers
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
  'harvests',
  'plantings',
  'custom'
]);

export const layerVisibilityEnum = pgEnum('threed_layer_visibility', [
  'public',
  'private',
  'shared'
]);

// ============================================
// Layers - Record-keeping for what to display
// ============================================

export const threedLayers = pgTable('threed_layers', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  
  // Basic info
  name: text('name').notNull(),
  description: text('description'),
  layerId: text('layer_id').unique().notNull(),
  
  // Layer configuration
  config: jsonb('config').default({
    // What types of data to show
    includeTypes: ['plant', 'bed', 'task'],
    // Optional filters
    filters: {
      status: 'active',
      priority: null,
      type: null,
    },
    // Visual settings
    color: '#ffffff',
    opacity: 1.0,
    visible: true,
  }),
  
  // Category and type
  category: text('category'),
  layerType: layerTypeEnum('layer_type').default('custom'),
  
  // Order and visibility
  orderIndex: integer('order_index').default(0),
  isVisible: boolean('is_visible').default(true),
  isActive: boolean('is_active').default(true),
  
  // Access control
  isPublic: boolean('is_public').default(false),
  visibility: layerVisibilityEnum('visibility').default('private'),
  
  // Metadata
  metadata: jsonb('metadata').default({}),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_threed_layers_user_id').on(table.userId),
  layerIdIdx: uniqueIndex('idx_threed_layers_layer_id').on(table.layerId),
  activeIdx: index('idx_threed_layers_active').on(table.isActive),
  visibleIdx: index('idx_threed_layers_visible').on(table.isVisible),
  typeIdx: index('idx_threed_layers_type').on(table.layerType),
}));

// ============================================
// Layers Relations
// ============================================

export const threedLayersRelations = relations(threedLayers, ({ one, many }) => ({
  user: one(user, {
    fields: [threedLayers.userId],
    references: [user.id],
  })
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
  modelFiles: many(threedModelFiles),
}));

export const threedBedsRelations = relations(threedBeds, ({ one, many }) => ({
  plantings: many(threedPlantings),
  farmbots: many(threedFarmbots),
  tasks: many(threedTasks),
  wateringSchedules: many(threedWateringSchedules),
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

export const threedFarmbotsRelations = relations(threedFarmbots, ({ one, many }) => ({
  bed: one(threedBeds, {
    fields: [threedFarmbots.bedId],
    references: [threedBeds.id],
  }),
  logs: many(threedFarmbotLogs),
  wateringSchedules: many(threedWateringSchedules),
  wateringHistory: many(threedWateringHistory),
  peripheralBindings: many(threedFarmbotPeripheralBindings),
  commands: many(threedFarmbotCommands),
  emergencyActions: many(threedFarmbotEmergencyActions),
  brokerMetadata: one(threedFarmbotBrokerMetadata, {
    fields: [threedFarmbots.id],
    references: [threedFarmbotBrokerMetadata.farmbotId],
  }),
}));

export const threedFarmbotPeripheralBindingsRelations = relations(
  threedFarmbotPeripheralBindings,
  ({ one, many }) => ({
    farmbot: one(threedFarmbots, {
      fields: [threedFarmbotPeripheralBindings.farmbotId],
      references: [threedFarmbots.id],
    }),
    owner: one(user, {
      fields: [threedFarmbotPeripheralBindings.userId],
      references: [user.id],
    }),
    commands: many(threedFarmbotCommands),
    emergencyActions: many(threedFarmbotEmergencyActions),
  })
);

export const threedFarmbotBrokerMetadataRelations = relations(
  threedFarmbotBrokerMetadata,
  ({ one }) => ({
    farmbot: one(threedFarmbots, {
      fields: [threedFarmbotBrokerMetadata.farmbotId],
      references: [threedFarmbots.id],
    }),
    owner: one(user, {
      fields: [threedFarmbotBrokerMetadata.userId],
      references: [user.id],
    }),
  })
);

export const threedMqttRuntimeRelations = relations(
  threedMqttRuntime,
  ({ one }) => ({
    owner: one(user, {
      fields: [threedMqttRuntime.userId],
      references: [user.id],
    }),
  })
);

export const threedMqttEventsRelations = relations(
  threedMqttEvents,
  ({ one }) => ({
    owner: one(user, {
      fields: [threedMqttEvents.userId],
      references: [user.id],
    }),
  })
);

export const threedFarmbotCommandsRelations = relations(
  threedFarmbotCommands,
  ({ one }) => ({
    owner: one(user, {
      fields: [threedFarmbotCommands.userId],
      references: [user.id],
    }),
    project: one(project, {
      fields: [threedFarmbotCommands.projectId],
      references: [project.id],
    }),
    farmbot: one(threedFarmbots, {
      fields: [threedFarmbotCommands.farmbotId],
      references: [threedFarmbots.id],
    }),
    peripheralBinding: one(threedFarmbotPeripheralBindings, {
      fields: [threedFarmbotCommands.peripheralBindingId],
      references: [threedFarmbotPeripheralBindings.id],
    }),
  })
);

export const threedFarmbotEmergencyActionsRelations = relations(
  threedFarmbotEmergencyActions,
  ({ one }) => ({
    owner: one(user, {
      fields: [threedFarmbotEmergencyActions.userId],
      references: [user.id],
    }),
    farmbot: one(threedFarmbots, {
      fields: [threedFarmbotEmergencyActions.farmbotId],
      references: [threedFarmbots.id],
    }),
    peripheralBinding: one(threedFarmbotPeripheralBindings, {
      fields: [threedFarmbotEmergencyActions.peripheralBindingId],
      references: [threedFarmbotPeripheralBindings.id],
    }),
  })
);

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
}));

export const threedWeatherLogsRelations = relations(threedWeatherLogs, ({ one }) => ({
  
}));

export const threedCharactersRelations = relations(threedCharacters, ({ one }) => ({
  model: one(threedModels, {
    fields: [threedCharacters.modelId],
    references: [threedModels.id],
  }),
}));

export const threedModelFilesRelations = relations(threedModelFiles, ({ one }) => ({
  model: one(threedModels, {
    fields: [threedModelFiles.modelId],
    references: [threedModels.id],
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

export type ThreedFarmbotPeripheralBinding = typeof threedFarmbotPeripheralBindings.$inferSelect;
export type NewThreedFarmbotPeripheralBinding = typeof threedFarmbotPeripheralBindings.$inferInsert;

export type ThreedFarmbotBrokerMetadata = typeof threedFarmbotBrokerMetadata.$inferSelect;
export type NewThreedFarmbotBrokerMetadata = typeof threedFarmbotBrokerMetadata.$inferInsert;

export type ThreedMqttRuntime = typeof threedMqttRuntime.$inferSelect;
export type NewThreedMqttRuntime = typeof threedMqttRuntime.$inferInsert;

export type ThreedMqttEvent = typeof threedMqttEvents.$inferSelect;
export type NewThreedMqttEvent = typeof threedMqttEvents.$inferInsert;

export type ThreedFarmbotCommand = typeof threedFarmbotCommands.$inferSelect;
export type NewThreedFarmbotCommand = typeof threedFarmbotCommands.$inferInsert;

export type ThreedFarmbotEmergencyAction = typeof threedFarmbotEmergencyActions.$inferSelect;
export type NewThreedFarmbotEmergencyAction = typeof threedFarmbotEmergencyActions.$inferInsert;

export type ThreedFarmbotLog = typeof threedFarmbotLogs.$inferSelect;
export type NewThreedFarmbotLog = typeof threedFarmbotLogs.$inferInsert;

export type ThreedCharacter = typeof threedCharacters.$inferSelect;
export type NewThreedCharacter = typeof threedCharacters.$inferInsert;

export type ThreeDLayer = typeof threedLayers.$inferSelect;
export type NewThreeDLayer = typeof threedLayers.$inferInsert;


// =====================================
// ## [MM] v0.12.0
// =====================================
