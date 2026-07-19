// lib/schema/projects/index.ts
import { pgTable, pgEnum, text, timestamp, boolean, jsonb, serial, index, uniqueIndex, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from '../auth';
import { threed } from '../threed';
import { traffic } from '../traffic';
import { music } from '../music';

// ============================================
// PROJECTS TABLE
// ============================================

export const project = pgTable('project', {
  id: serial('id').primaryKey(),
  
  // Owner
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  
  // Basic info
  name: text('name').notNull(),
  description: text('description'),
  slug: text('slug').unique().notNull(),
  
  // Status
  isActive: boolean('is_active').default(true),
  isPublic: boolean('is_public').default(false),
  
  // Configuration
  config: jsonb('config').default({}),
  metadata: jsonb('metadata').default({}),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_projects_user_id').on(table.userId),
  slugIdx: uniqueIndex('idx_projects_slug').on(table.slug),
  activeIdx: index('idx_projects_active').on(table.isActive),
}));

// ============================================
// PROJECT → THREED JUNCTION TABLE
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

// ============================================
// PROJECT → TRAFFIC JUNCTION TABLE
// ============================================

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

// ============================================
// PROJECT → MUSIC JUNCTION TABLE
// ============================================

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
// SINGLE ASSET JUNCTION TABLE (NEW)
// ============================================

export const assetTypeEnum = pgEnum('asset_type', [
  // 'music',
  'music_album',
  'music_track',
  'music_media',
  'music_link',
  'music_playback_history',
  'music_polling_log',
  // 'music_album_link',

  // 'threed',
  'threed_plant',
  'threed_bed',
  'threed_layer',
  'threed_marker',
  'threed_model',
  'threed_character',
  'threed_task',
  'threed_harvest',
  'threed_weather_log',
  'threed_farmbot',
  'threed_watering_schedule',
  // 'threed_watering_schedule_history',
  // 'threed_system_log',
  
  // 'traffic',
  'traffic_chp_cad_incident',
  'traffic_chp_case',
  'traffic_caltrans_lane_closure',
  'traffic_caltrans_cctv_camera',
  'traffic_bay_area_511_event',
  'traffic_calfire_incident',
]);

export const projectAssets = pgTable('project_assets', {
  id: serial('id').primaryKey(),
  
  // Ownership
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  
  // Relationships
  projectId: integer('project_id').references(() => project.id, { onDelete: 'cascade' }),
  
  // ✅ Polymorphic fields
  assetType: assetTypeEnum('asset_type').notNull(),
  assetId: integer('asset_id').notNull(),
  
  // Metadata
  config: jsonb('config').default({}),
  isActive: boolean('is_active').default(true),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  projectIdIdx: index('idx_project_assets_project_id').on(table.projectId),
  assetTypeIdx: index('idx_project_assets_asset_type').on(table.assetType),
  assetCompositeIdx: index('idx_project_assets_composite').on(table.projectId, table.assetType, table.assetId),
  uniqueProjectAsset: uniqueIndex('idx_project_assets_unique').on(table.projectId, table.assetType, table.assetId),
}));

// ============================================
// RELATIONSHIPS
// ============================================

export const projectRelations = relations(project, ({ one, many }) => ({
  user: one(user, {
    fields: [project.userId],
    references: [user.id],
  }),
  threedModules: many(projectThreed),
  trafficModules: many(projectTraffic),
  musicModules: many(projectMusic),
}));

export const projectThreedRelations = relations(projectThreed, ({ one }) => ({
  user: one(user, {
    fields: [projectThreed.userId],
    references: [user.id],
  }),
  project: one(project, {
    fields: [projectThreed.projectId],
    references: [project.id],
  }),
  threed: one(threed, {
    fields: [projectThreed.threedId],
    references: [threed.id],
  }),
}));

export const projectTrafficRelations = relations(projectTraffic, ({ one }) => ({
  user: one(user, {
    fields: [projectTraffic.userId],
    references: [user.id],
  }),
  project: one(project, {
    fields: [projectTraffic.projectId],
    references: [project.id],
  }),
  traffic: one(traffic, {
    fields: [projectTraffic.trafficId],
    references: [traffic.id],
  }),
}));

export const projectMusicRelations = relations(projectMusic, ({ one }) => ({
  user: one(user, {
    fields: [projectMusic.userId],
    references: [user.id],
  }),
  project: one(project, {
    fields: [projectMusic.projectId],
    references: [project.id],
  }),
  music: one(music, {
    fields: [projectMusic.musicId],
    references: [music.id],
  }),
}));

// ============================================
// TYPES
// ============================================

export type Project = typeof project.$inferSelect;
export type NewProject = typeof project.$inferInsert;
export type ProjectThreed = typeof projectThreed.$inferSelect;
export type NewProjectThreed = typeof projectThreed.$inferInsert;
export type ProjectTraffic = typeof projectTraffic.$inferSelect;
export type NewProjectTraffic = typeof projectTraffic.$inferInsert;
export type ProjectMusic = typeof projectMusic.$inferSelect;
export type NewProjectMusic = typeof projectMusic.$inferInsert;