// @/lib/schema/music/index
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
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { user } from '../auth';
import { projectMusic, project } from '../project';

// ============================================
// ### Music Service
// ============================================

// ============================================
// MUSIC MAIN TABLE - Parent for all music data
// ============================================

export const music = pgTable('music', {
  id: serial('id').primaryKey(),

  // Owner
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  
  // Basic info
  name: text('name').notNull(),
  description: text('description'),
  slug: text('slug').unique().notNull(),
  
  // Configuration
  config: jsonb('config').default({}), // Storage settings, default view, sorting
  
  // Status
  isActive: boolean('is_active').default(true),
  isPublic: boolean('is_public').default(false),
  
  // Module metadata
  version: text('version').default('1.0.0'),
  metadata: jsonb('metadata').default({}),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_music_user_id').on(table.userId),
  slugIdx: uniqueIndex('idx_music_slug').on(table.slug),
  activeIdx: index('idx_music_active').on(table.isActive),
}));

// ============================================
// ENUMS
// ============================================

export const musicLinkTypeEnum = pgEnum('music_link_type', ['external', 'social', 'buy', 'stream', 'video']);
export const musicLinkStatusEnum = pgEnum('music_link_status', ['active', 'inactive', 'pending', 'expired']);
export const albumStatusEnum = pgEnum('album_status', ['draft', 'published', 'archived']);
export const trackStatusEnum = pgEnum('track_status', ['active', 'inactive', 'processing']);
export const musicPollingTypeEnum = pgEnum('music_polling_type', ['metadata', 'stats', 'sync']);

// ============================================
// MODULE CHILD TABLES
// ============================================

export const musicAlbums = pgTable('music_albums', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  artist: text('artist').notNull(),
  coverArt: text('cover_art').notNull(),
  releaseYear: integer('release_year'),
  description: text('description'),
  sortOrder: integer('sort_order').default(0),
  status: albumStatusEnum('status').default('draft'),
  isPublic: boolean('is_public').default(false),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (table) => ({
  userIdIdx: index('music_albums_user_id_idx').on(table.userId),
  statusIdx: index('music_albums_status_idx').on(table.status),
  sortOrderIdx: index('music_albums_sort_order_idx').on(table.sortOrder),
}));

export const musicMedia = pgTable('music_media', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  albumId: integer('album_id').references(() => musicAlbums.id, { onDelete: 'cascade' }).notNull(),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: text('file_type').notNull(),
  fileSize: integer('file_size'),
  isPrimary: boolean('is_primary').default(true),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (table) => ({
  userIdIdx: index('music_media_user_id_idx').on(table.userId),
  albumIdIdx: index('music_media_album_id_idx').on(table.albumId),
  isPrimaryIdx: index('music_media_is_primary_idx').on(table.isPrimary),
}));

export const musicTracks = pgTable('music_tracks', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  albumId: integer('album_id').references(() => musicAlbums.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  duration: integer('duration'),
  trackNumber: integer('track_number'),
  fileUrl: text('file_url').notNull(),
  fileType: text('file_type').notNull(),
  fileSize: integer('file_size'),
  status: trackStatusEnum('status').default('active'),
  lyrics: text('lyrics'),
  metadata: jsonb('metadata'),
  playCount: integer('play_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (table) => ({
  albumIdIdx: index('music_tracks_album_id_idx').on(table.albumId),
  statusIdx: index('music_tracks_status_idx').on(table.status),
}));

// ✅ SIMPLIFIED: music_links - no junction table needed
export const musicLinks = pgTable('music_links', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  url: text('url').notNull(),
  type: musicLinkTypeEnum('type').default('external'),
  icon: text('icon'),
  description: text('description'),
  status: musicLinkStatusEnum('status').default('active'),
  displayOrder: integer('display_order').default(0),
  metadata: jsonb('metadata'),
  
  // ✅ Direct relationships (optional) - like music_media
  albumId: integer('album_id').references(() => musicAlbums.id, { onDelete: 'cascade' }),
  trackId: integer('track_id').references(() => musicTracks.id, { onDelete: 'cascade' }),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (table) => ({
  userIdIdx: index('music_links_user_id_idx').on(table.userId),
  typeIdx: index('music_links_type_idx').on(table.type),
  albumIdIdx: index('music_links_album_id_idx').on(table.albumId),
  trackIdIdx: index('music_links_track_id_idx').on(table.trackId),
  statusIdx: index('music_links_status_idx').on(table.status),
}));

// ❌ REMOVED: music_album_links table (no longer needed)

export const musicPollingLogs = pgTable('music_polling_logs', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  pollType: musicPollingTypeEnum('poll_type').notNull(),
  status: text('status').notNull(),
  message: text('message'),
  metadata: jsonb('metadata'),
  startedAt: timestamp('started_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  error: text('error'),
}, (table) => ({
  pollTypeIdx: index('music_polling_logs_type_idx').on(table.pollType),
  statusIdx: index('music_polling_logs_status_idx').on(table.status),
  pollTypeStatusIdx: index('music_polling_logs_type_status_idx').on(table.pollType, table.status),
}));

export const musicPlaybackHistory = pgTable('music_playback_history', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  trackId: integer('track_id').references(() => musicTracks.id, { onDelete: 'cascade' }),
  albumId: integer('album_id').references(() => musicAlbums.id, { onDelete: 'cascade' }),
  playedAt: timestamp('played_at').defaultNow(),
  playDuration: integer('play_duration'),
  completed: boolean('completed').default(false),
  source: text('source').default('music_player'),
}, (table) => ({
  userIdIdx: index('music_playback_user_id_idx').on(table.userId),
  trackIdIdx: index('music_playback_track_id_idx').on(table.trackId),
  playedAtIdx: index('music_playback_played_at_idx').on(table.playedAt),
}));

// ============================================
// RELATIONSHIPS
// ============================================

export const musicRelations = relations(music, ({ one, many }) => ({
  user: one(user, {
    fields: [music.userId],
    references: [user.id],
  }),
  // ✅ Many-to-many with Projects via junction table (defined in project schema)
  projects: many(projectMusic),
  albums: many(musicAlbums),
  tracks: many(musicTracks),
  links: many(musicLinks),
  media: many(musicMedia),
  pollingLogs: many(musicPollingLogs),
  playbackHistory: many(musicPlaybackHistory),
}));

export const musicAlbumsRelations = relations(musicAlbums, ({ many, one }) => ({
  user: one(user, {
    fields: [musicAlbums.userId],
    references: [user.id],
  }),
  tracks: many(musicTracks),
  links: many(musicLinks, {
    relationName: 'albumLinks',
  }),
  media: many(musicMedia, {
    relationName: 'albumMedia',
  }),
}));

export const musicMediaRelations = relations(musicMedia, ({ one }) => ({
  user: one(user, {
    fields: [musicMedia.userId],
    references: [user.id],
  }),
  album: one(musicAlbums, {
    fields: [musicMedia.albumId],
    references: [musicAlbums.id],
  }),
}));

export const musicTracksRelations = relations(musicTracks, ({ one, many }) => ({
  album: one(musicAlbums, {
    fields: [musicTracks.albumId],
    references: [musicAlbums.id],
  }),
  user: one(user, {
    fields: [musicTracks.userId],
    references: [user.id],
  }),
  links: many(musicLinks, {
    relationName: 'trackLinks',
  }),
}));

// ✅ Simplified musicLinksRelations
export const musicLinksRelations = relations(musicLinks, ({ one, many }) => ({
  user: one(user, {
    fields: [musicLinks.userId],
    references: [user.id],
  }),
  album: one(musicAlbums, {
    fields: [musicLinks.albumId],
    references: [musicAlbums.id],
    relationName: 'albumLinks',
  }),
  track: one(musicTracks, {
    fields: [musicLinks.trackId],
    references: [musicTracks.id],
    relationName: 'trackLinks',
  }),
}));

// ❌ REMOVED: musicAlbumLinksRelations (no longer needed)

export const musicPollingLogsRelations = relations(musicPollingLogs, ({}) => ({}));

export const musicPlaybackHistoryRelations = relations(musicPlaybackHistory, ({ one }) => ({
  user: one(user, {
    fields: [musicPlaybackHistory.userId],
    references: [user.id],
  }),
  album: one(musicAlbums, {
    fields: [musicPlaybackHistory.albumId],
    references: [musicAlbums.id],
  }),
  track: one(musicTracks, {
    fields: [musicPlaybackHistory.trackId],
    references: [musicTracks.id],
  }),
}));

// ============================================
// TYPES
// ============================================

export type Music = typeof music.$inferSelect;
export type NewMusic = typeof music.$inferInsert;
export type MusicAlbum = typeof musicAlbums.$inferSelect;
export type NewMusicAlbum = typeof musicAlbums.$inferInsert;
export type MusicTrack = typeof musicTracks.$inferSelect;
export type NewMusicTrack = typeof musicTracks.$inferInsert;
export type MusicLink = typeof musicLinks.$inferSelect;
export type NewMusicLink = typeof musicLinks.$inferInsert;
export type MusicMedia = typeof musicMedia.$inferSelect;
export type NewMusicMedia = typeof musicMedia.$inferInsert;
export type MusicPollingLog = typeof musicPollingLogs.$inferSelect;
export type NewMusicPollingLog = typeof musicPollingLogs.$inferInsert;
export type MusicPlaybackHistory = typeof musicPlaybackHistory.$inferSelect;
export type NewMusicPlaybackHistory = typeof musicPlaybackHistory.$inferInsert;