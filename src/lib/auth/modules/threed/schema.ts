// src/lib/modules/threed/schema.ts
import { 
  pgTable, text, timestamp, serial, varchar, integer, decimal, jsonb, boolean, 
  uniqueIndex, index, pgEnum 
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

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

// ============================================
// 1. threed_plants - Master plant database
// ============================================
export const threedPlants = pgTable('threed_plants', {
  id: serial('id').primaryKey(),
  plantId: varchar('plant_id', { length: 50 }).unique().notNull(),
  commonName: varchar('common_name', { length: 255 }).notNull(),
  scientificName: varchar('scientific_name', { length: 255 }),
  variety: varchar('variety', { length: 100 }),
  family: varchar('family', { length: 100 }),
  type: plantTypeEnum('type').default('Vegetable'),
  status: plantStatusEnum('status').default('active'),
  
  // Standardized 3D Model fields ONLY
  modelType: varchar('model_type', { length: 50 }).default('procedural'),
  modelPath: varchar('model_path', { length: 500 }),
  modelMetadata: jsonb('model_metadata').default({}),
  isCustomModel: boolean('is_custom_model').default(false),
  modelVersion: integer('model_version').default(1),
  
  // Growth parameters
  growthHabit: varchar('growth_habit', { length: 50 }),
  daysToMaturity: integer('days_to_maturity'),
  daysToGermination: integer('days_to_germination'),
  daysToHarvest: integer('days_to_harvest'),
  
  // Spacing requirements
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
  plantIdIdx: uniqueIndex('idx_threed_plants_plant_id').on(table.plantId),
  commonNameIdx: index('idx_threed_plants_common_name').on(table.commonName),
  typeIdx: index('idx_threed_plants_type').on(table.type),
  statusIdx: index('idx_threed_plants_status').on(table.status),
  modelTypeIdx: index('idx_threed_plants_model_type').on(table.modelType),
}));

// ============================================
// 2. threed_beds - Garden layout
// ============================================
export const threedBeds = pgTable('threed_beds', {
  id: serial('id').primaryKey(),
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
  
  // Metadata
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  bedIdIdx: uniqueIndex('idx_threed_beds_bed_id').on(table.bedId),
  activeIdx: index('idx_threed_beds_active').on(table.isActive),
  nameIdx: index('idx_threed_beds_name').on(table.name),
}));

// ============================================
// 3. threed_plantings - Plants in beds
// ============================================
export const threedPlantings = pgTable('threed_plantings', {
  id: serial('id').primaryKey(),
  plantingId: varchar('planting_id', { length: 50 }).unique().notNull(),
  plantId: integer('plant_id').references(() => threedPlants.id, { onDelete: 'set null' }),
  bedId: integer('bed_id').references(() => threedBeds.id, { onDelete: 'set null' }),
  
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
  plantingIdIdx: uniqueIndex('idx_threed_plantings_planting_id').on(table.plantingId),
  plantIdx: index('idx_threed_plantings_plant').on(table.plantId),
  bedIdx: index('idx_threed_plantings_bed').on(table.bedId),
  statusIdx: index('idx_threed_plantings_status').on(table.status),
}));

// ============================================
// 4. threed_harvests - Harvest logging
// ============================================
export const threedHarvests = pgTable('threed_harvests', {
  id: serial('id').primaryKey(),
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
  harvestIdIdx: uniqueIndex('idx_threed_harvests_harvest_id').on(table.harvestId),
  plantingIdx: index('idx_threed_harvests_planting').on(table.plantingId),
  harvestDateIdx: index('idx_threed_harvests_date').on(table.harvestDate),
}));

// ============================================
// 5. threed_tasks - Garden tasks/to-do
// ============================================
export const threedTasks = pgTable('threed_tasks', {
  id: serial('id').primaryKey(),
  taskId: varchar('task_id', { length: 50 }).unique().notNull(),
  plantingId: integer('planting_id').references(() => threedPlantings.id, { onDelete: 'set null' }),
  plantId: integer('plant_id').references(() => threedPlants.id, { onDelete: 'set null' }),
  bedId: integer('bed_id').references(() => threedBeds.id, { onDelete: 'set null' }),
  
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
  
  // Metadata
  assignedTo: varchar('assigned_to', { length: 100 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  taskIdIdx: uniqueIndex('idx_threed_tasks_task_id').on(table.taskId),
  plantingIdx: index('idx_threed_tasks_planting').on(table.plantingId),
  dueDateIdx: index('idx_threed_tasks_due_date').on(table.dueDate),
  statusIdx: index('idx_threed_tasks_status').on(table.status),
}));

// ============================================
// 6. threed_weather_logs - Environmental data
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
  
  // Source and metadata
  source: varchar('source', { length: 50 }).default('api'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  recordedAtIdx: index('idx_threed_weather_recorded_at').on(table.recordedAt),
}));

// ============================================
// 7. threed_farmbots - FarmBot devices
// ============================================
export const threedFarmbots = pgTable('threed_farmbots', {
  id: serial('id').primaryKey(),
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
  
  // Metadata
  isActive: boolean('is_active').default(true),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  deviceIdIdx: uniqueIndex('idx_threed_farmbots_device_id').on(table.deviceId),
  statusIdx: index('idx_threed_farmbots_status').on(table.status),
}));

// ============================================
// 8. threed_farmbot_logs - FarmBot activity log
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
// 9. threed_system_logs - Application logging
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
// RELATIONSHIPS
// ============================================
export const threedPlantsRelations = relations(threedPlants, ({ many }) => ({
  plantings: many(threedPlantings),
  harvests: many(threedHarvests),
  tasks: many(threedTasks),
}));

export const threedBedsRelations = relations(threedBeds, ({ many }) => ({
  plantings: many(threedPlantings),
  farmbots: many(threedFarmbots),
  tasks: many(threedTasks),
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
  harvests: many(threedHarvests),
  tasks: many(threedTasks),
}));

export const threedFarmbotsRelations = relations(threedFarmbots, ({ one, many }) => ({
  bed: one(threedBeds, {
    fields: [threedFarmbots.bedId],
    references: [threedBeds.id],
  }),
  logs: many(threedFarmbotLogs),
}));

// Export types for use in the application
export type ThreedPlant = typeof threedPlants.$inferSelect;
export type NewThreedPlant = typeof threedPlants.$inferInsert;
export type ThreedBed = typeof threedBeds.$inferSelect;
export type NewThreedBed = typeof threedBeds.$inferInsert;
export type ThreedPlanting = typeof threedPlantings.$inferSelect;
export type NewThreedPlanting = typeof threedPlantings.$inferInsert;
export type ThreedHarvest = typeof threedHarvests.$inferSelect;
export type NewThreedHarvest = typeof threedHarvests.$inferInsert;
export type ThreedTask = typeof threedTasks.$inferSelect;
export type NewThreedTask = typeof threedTasks.$inferInsert;
export type ThreedWeatherLog = typeof threedWeatherLogs.$inferSelect;
export type ThreedFarmbot = typeof threedFarmbots.$inferSelect;
export type ThreedFarmbotLog = typeof threedFarmbotLogs.$inferSelect;