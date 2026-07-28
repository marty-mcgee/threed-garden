// lib/schema/projects/index.ts
import { pgTable, pgEnum, text, timestamp, boolean, jsonb, serial, index, uniqueIndex, integer } from 'drizzle-orm/pg-core';
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
// RELATIONS
// ============================================

export const projectRelations = relations(project, ({ many }) => ({
  projectThreeds: many(projectThreed),
  projectTraffics: many(projectTraffic),
  projectMusics: many(projectMusic),
  projectAssets: many(projectAssets),
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