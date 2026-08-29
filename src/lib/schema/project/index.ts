// lib/schema/projects/index.ts
import { pgTable, pgEnum, text, timestamp, boolean, jsonb, serial, index, uniqueIndex, integer, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
// PROJECT OWNER
import { user } from '../auth';
// MODULE RELATIONSHIPS
import { music } from '../music';
import { threed } from '../threed';
import { traffic } from '../traffic';

// ============================================
// ASSET TYPE ENUM
// ============================================

export const assetTypeEnum = pgEnum('asset_type', [
  // Music v0.8.0
  'music_albums',
  'music_tracks',
  'music_links',
  'music_media',
  
  // ThreeD v0.9.0
  'threed_plants',
  'threed_beds',
  'threed_plantings', // ✅ v0.12.0
  'threed_layers',
  'threed_markers',
  'threed_models',
  'threed_characters',
  'threed_tasks',
  'threed_harvests',
  'threed_weather_logs',
  'threed_farmbots',
  'threed_watering_schedules',
  
  // Traffic v0.10.0
  'traffic_chp_cad_incidents',
  'traffic_chp_centers',
  'traffic_chp_cases',
  'traffic_caltrans_lane_closures',
  'traffic_caltrans_districts',
  'traffic_caltrans_cctv_cameras',
  'traffic_bay_area_511_events',
  'traffic_calfire_incidents',
]);

export const projectThreeDMarkerTypeEnum = pgEnum('project_threed_marker_type', [
  'plantings',
  'beds',
  'characters',
  'farmbots',
  'models',
]);

export const projectThreeDMarkerPositionSourceEnum = pgEnum(
  'project_threed_marker_position_source',
  ['asset', 'runtime'],
);

// ============================================
// PROJECTS TABLE
// ============================================

export const project = pgTable('project', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  slug: text('slug').unique().notNull(),
  isActive: boolean('is_active').default(true),
  isPublic: boolean('is_public').default(false),
  // One WGS84 origin anchors every ThreeD module and Project marker rendered
  // together in this Project's persistent Scene.
  originLatitude: decimal('origin_latitude', { precision: 10, scale: 7 }),
  originLongitude: decimal('origin_longitude', { precision: 10, scale: 7 }),
  originAltitude: decimal('origin_altitude', { precision: 12, scale: 3 })
    .notNull()
    .default('0'),
  headingDegrees: decimal('heading_degrees', { precision: 8, scale: 3 })
    .notNull()
    .default('0'),
  metersPerSceneUnit: decimal('meters_per_scene_unit', { precision: 12, scale: 6 })
    .notNull()
    .default('0.304800'),
  // Exact surveyed pairs used to solve the current geographic transform.
  calibrationPointALocalX: decimal('calibration_point_a_local_x', { precision: 12, scale: 3 }),
  calibrationPointALocalZ: decimal('calibration_point_a_local_z', { precision: 12, scale: 3 }),
  calibrationPointALatitude: decimal('calibration_point_a_latitude', { precision: 10, scale: 7 }),
  calibrationPointALongitude: decimal('calibration_point_a_longitude', { precision: 10, scale: 7 }),
  calibrationPointBLocalX: decimal('calibration_point_b_local_x', { precision: 12, scale: 3 }),
  calibrationPointBLocalZ: decimal('calibration_point_b_local_z', { precision: 12, scale: 3 }),
  calibrationPointBLatitude: decimal('calibration_point_b_latitude', { precision: 10, scale: 7 }),
  calibrationPointBLongitude: decimal('calibration_point_b_longitude', { precision: 10, scale: 7 }),
  config: jsonb('config').default({}),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_projects_user_id').on(table.userId),
  slugIdx: uniqueIndex('idx_projects_slug').on(table.slug),
  activeIdx: index('idx_projects_active').on(table.isActive),
}));

// ============================================
// MODULE JUNCTION TABLES
// ============================================

export const projectThreed = pgTable('project_threed', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  projectId: integer('project_id').references(() => project.id, { onDelete: 'cascade' }),
  threedId: integer('threed_id').references(() => threed.id, { onDelete: 'cascade' }),
  config: jsonb('config').default({}),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  projectIdIdx: index('idx_project_threed_project_id').on(table.projectId),
  threedIdIdx: index('idx_project_threed_threed_id').on(table.threedId),
  uniqueProjectThreed: uniqueIndex('idx_project_threed_unique').on(table.projectId, table.threedId),
}));

export const projectTraffic = pgTable('project_traffic', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  projectId: integer('project_id').references(() => project.id, { onDelete: 'cascade' }),
  trafficId: integer('traffic_id').references(() => traffic.id, { onDelete: 'cascade' }),
  config: jsonb('config').default({}),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  projectIdIdx: index('idx_project_traffic_project_id').on(table.projectId),
  trafficIdIdx: index('idx_project_traffic_traffic_id').on(table.trafficId),
  uniqueProjectTraffic: uniqueIndex('idx_project_traffic_unique').on(table.projectId, table.trafficId),
}));

export const projectMusic = pgTable('project_music', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  projectId: integer('project_id').references(() => project.id, { onDelete: 'cascade' }),
  musicId: integer('music_id').references(() => music.id, { onDelete: 'cascade' }),
  config: jsonb('config').default({}),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  projectIdIdx: index('idx_project_music_project_id').on(table.projectId),
  musicIdIdx: index('idx_project_music_music_id').on(table.musicId),
  uniqueProjectMusic: uniqueIndex('idx_project_music_unique').on(table.projectId, table.musicId),
}));

// ============================================
// ✅ UPDATED: SINGLE ASSET JUNCTION TABLE with moduleId
// ============================================

export const projectAssets = pgTable('project_assets', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  projectId: integer('project_id').references(() => project.id, { onDelete: 'cascade' }),
  moduleId: integer('module_id').notNull(), // ✅ NEW: References the specific module
  moduleType: text('module_type').notNull(), // ✅ NEW: 'music', 'threed', 'traffic'
  assetType: assetTypeEnum('asset_type').notNull(),
  assetId: integer('asset_id').notNull(),
  config: jsonb('config').default({}),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  projectIdIdx: index('idx_project_assets_project_id').on(table.projectId),
  moduleIdIdx: index('idx_project_assets_module_id').on(table.moduleId),
  assetTypeIdx: index('idx_project_assets_asset_type').on(table.assetType),
  assetCompositeIdx: index('idx_project_assets_composite').on(table.projectId, table.moduleType, table.assetType, table.assetId),
  uniqueProjectAsset: uniqueIndex('idx_project_assets_unique').on(table.projectId, table.moduleId, table.assetType, table.assetId),
}));

// ============================================
// SAVED THREED PROJECT MARKER SNAPSHOT
// ============================================

/**
 * Current saved Runtime Marker state for a ThreeD Project.
 *
 * This table is written only by an explicit Project-save workflow. It is not
 * an animation-frame, physics, or MQTT event log. The source Sub-Module asset
 * remains addressable through markerType + sourceAssetId, while the saved
 * position and display payload reproduce the Project's current marker view.
 */
export const projectThreedMarkers = pgTable('project_threed_markers', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  projectId: integer('project_id')
    .notNull()
    .references(() => project.id, { onDelete: 'cascade' }),
  threedId: integer('threed_id')
    .notNull()
    .references(() => threed.id, { onDelete: 'cascade' }),

  markerType: projectThreeDMarkerTypeEnum('marker_type').notNull(),
  sourceAssetId: integer('source_asset_id').notNull(),
  markerId: text('marker_id').notNull(),
  name: text('name').notNull(),

  positionX: decimal('position_x', { precision: 12, scale: 3 }).notNull(),
  positionY: decimal('position_y', { precision: 12, scale: 3 }).notNull(),
  positionZ: decimal('position_z', { precision: 12, scale: 3 }).notNull(),
  // Geographic representation synchronized from the owning Project ThreeD
  // origin. These remain nullable until existing Project origins are configured
  // and their marker rows are backfilled.
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  altitude: decimal('altitude', { precision: 12, scale: 3 }),
  positionSource: projectThreeDMarkerPositionSourceEnum('position_source')
    .notNull()
    .default('asset'),

  color: text('color').notNull(),
  icon: text('icon').notNull(),
  label: text('label').notNull(),
  isVisible: boolean('is_visible').notNull().default(true),
  isActive: boolean('is_active').notNull().default(true),
  data: jsonb('data').notNull().default({}),
  metadata: jsonb('metadata').notNull().default({}),

  savedAt: timestamp('saved_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  projectIdIdx: index('idx_project_threed_markers_project_id')
    .on(table.projectId),
  threedIdIdx: index('idx_project_threed_markers_threed_id')
    .on(table.threedId),
  ownerProjectIdx: index('idx_project_threed_markers_owner_project')
    .on(table.userId, table.projectId),
  uniqueRuntimeMarker: uniqueIndex('idx_project_threed_markers_unique_runtime')
    .on(table.projectId, table.markerId),
}));

// ============================================
// RELATIONS
// ============================================

export const projectRelations = relations(project, ({ many }) => ({
  projectThreeds: many(projectThreed),
  projectTraffics: many(projectTraffic),
  projectMusics: many(projectMusic),
  projectAssets: many(projectAssets),
  projectThreedMarkers: many(projectThreedMarkers),
}));

export const projectAssetsRelations = relations(projectAssets, ({ one }) => ({
  project: one(project, {
    fields: [projectAssets.projectId],
    references: [project.id],
  }),
  user: one(user, {
    fields: [projectAssets.userId],
    references: [user.id],
  }),
}));

export const projectThreedMarkersRelations = relations(
  projectThreedMarkers,
  ({ one }) => ({
    project: one(project, {
      fields: [projectThreedMarkers.projectId],
      references: [project.id],
    }),
    threed: one(threed, {
      fields: [projectThreedMarkers.threedId],
      references: [threed.id],
    }),
    user: one(user, {
      fields: [projectThreedMarkers.userId],
      references: [user.id],
    }),
  }),
);
