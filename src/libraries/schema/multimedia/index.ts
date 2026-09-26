// @/libraries/schema/multimedia/index
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
  uuid,
  unique,
  check,
  type PgTableExtraConfigValue,
  AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { user } from '../auth';
import { projectMultimedia, project } from '../project';

// ============================================
// ### Multimedia Service
// ============================================

// ============================================
// MULTIMEDIA MAIN TABLE - Parent for all music data
// ============================================

export const multimedia = pgTable('multimedia', {
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
  userIdIdx: index('idx_multimedia_user_id').on(table.userId),
  slugIdx: uniqueIndex('idx_multimedia_slug').on(table.slug),
  activeIdx: index('idx_multimedia_active').on(table.isActive),
}));

// ============================================
// ENUMS
// ============================================

export const multimediaLinkTypeEnum = pgEnum('multimedia_link_type', ['external', 'social', 'buy', 'stream', 'video']);
export const multimediaLinkStatusEnum = pgEnum('multimedia_link_status', ['active', 'inactive', 'pending', 'expired']);
export const albumStatusEnum = pgEnum('album_status', ['draft', 'published', 'archived']);
export const trackStatusEnum = pgEnum('track_status', ['active', 'inactive', 'processing']);
export const multimediaPollingTypeEnum = pgEnum('multimedia_polling_type', ['metadata', 'stats', 'sync']);

// ============================================
// MODULE CHILD TABLES
// ============================================

export const multimediaAlbums = pgTable('multimedia_albums', {
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
  userIdIdx: index('multimedia_albums_user_id_idx').on(table.userId),
  statusIdx: index('multimedia_albums_status_idx').on(table.status),
  sortOrderIdx: index('multimedia_albums_sort_order_idx').on(table.sortOrder),
}));

export const multimediaMedia = pgTable('multimedia_media', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  albumId: integer('album_id').references(() => multimediaAlbums.id, { onDelete: 'cascade' }).notNull(),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: text('file_type').notNull(),
  fileSize: integer('file_size'),
  isPrimary: boolean('is_primary').default(true),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (table) => ({
  userIdIdx: index('multimedia_media_user_id_idx').on(table.userId),
  albumIdIdx: index('multimedia_media_album_id_idx').on(table.albumId),
  isPrimaryIdx: index('multimedia_media_is_primary_idx').on(table.isPrimary),
}));

export const multimediaTracks = pgTable('multimedia_tracks', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  albumId: integer('album_id').references(() => multimediaAlbums.id, { onDelete: 'cascade' }),
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
  albumIdIdx: index('multimedia_tracks_album_id_idx').on(table.albumId),
  statusIdx: index('multimedia_tracks_status_idx').on(table.status),
}));

// ✅ SIMPLIFIED: multimedia_links - no junction table needed
export const multimediaLinks = pgTable('multimedia_links', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  url: text('url').notNull(),
  type: multimediaLinkTypeEnum('type').default('external'),
  icon: text('icon'),
  description: text('description'),
  status: multimediaLinkStatusEnum('status').default('active'),
  displayOrder: integer('display_order').default(0),
  metadata: jsonb('metadata'),
  
  // ✅ Direct relationships (optional) - like multimedia_media
  albumId: integer('album_id').references(() => multimediaAlbums.id, { onDelete: 'cascade' }),
  trackId: integer('track_id').references(() => multimediaTracks.id, { onDelete: 'cascade' }),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (table) => ({
  userIdIdx: index('multimedia_links_user_id_idx').on(table.userId),
  typeIdx: index('multimedia_links_type_idx').on(table.type),
  albumIdIdx: index('multimedia_links_album_id_idx').on(table.albumId),
  trackIdIdx: index('multimedia_links_track_id_idx').on(table.trackId),
  statusIdx: index('multimedia_links_status_idx').on(table.status),
}));

// ❌ REMOVED: music_album_links table (no longer needed)

export const multimediaPollingLogs = pgTable('multimedia_polling_logs', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  pollType: multimediaPollingTypeEnum('poll_type').notNull(),
  status: text('status').notNull(),
  message: text('message'),
  metadata: jsonb('metadata'),
  startedAt: timestamp('started_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  error: text('error'),
}, (table) => ({
  pollTypeIdx: index('multimedia_polling_logs_type_idx').on(table.pollType),
  statusIdx: index('multimedia_polling_logs_status_idx').on(table.status),
  pollTypeStatusIdx: index('multimedia_polling_logs_type_status_idx').on(table.pollType, table.status),
}));

export const multimediaPlaybackHistory = pgTable('multimedia_playback_history', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  trackId: integer('track_id').references(() => multimediaTracks.id, { onDelete: 'cascade' }),
  albumId: integer('album_id').references(() => multimediaAlbums.id, { onDelete: 'cascade' }),
  playedAt: timestamp('played_at').defaultNow(),
  playDuration: integer('play_duration'),
  completed: boolean('completed').default(false),
  source: text('source').default('multimedia_player'),
}, (table) => ({
  userIdIdx: index('multimedia_playback_user_id_idx').on(table.userId),
  trackIdIdx: index('multimedia_playback_track_id_idx').on(table.trackId),
  playedAtIdx: index('multimedia_playback_played_at_idx').on(table.playedAt),
}));

// ============================================
// RELATIONSHIPS
// ============================================

export const multimediaRelations = relations(multimedia, ({ one, many }) => ({
  user: one(user, {
    fields: [multimedia.userId],
    references: [user.id],
  }),
  // ✅ Many-to-many with Projects via junction table (defined in project schema)
  projects: many(projectMultimedia),
  albums: many(multimediaAlbums),
  tracks: many(multimediaTracks),
  links: many(multimediaLinks),
  media: many(multimediaMedia),
  pollingLogs: many(multimediaPollingLogs),
  playbackHistory: many(multimediaPlaybackHistory),
}));

export const multimediaAlbumsRelations = relations(multimediaAlbums, ({ many, one }) => ({
  user: one(user, {
    fields: [multimediaAlbums.userId],
    references: [user.id],
  }),
  tracks: many(multimediaTracks),
  links: many(multimediaLinks, {
    relationName: 'albumLinks',
  }),
  media: many(multimediaMedia, {
    relationName: 'albumMedia',
  }),
}));

export const multimediaMediaRelations = relations(multimediaMedia, ({ one }) => ({
  user: one(user, {
    fields: [multimediaMedia.userId],
    references: [user.id],
  }),
  album: one(multimediaAlbums, {
    fields: [multimediaMedia.albumId],
    references: [multimediaAlbums.id],
  }),
}));

export const multimediaTracksRelations = relations(multimediaTracks, ({ one, many }) => ({
  album: one(multimediaAlbums, {
    fields: [multimediaTracks.albumId],
    references: [multimediaAlbums.id],
  }),
  user: one(user, {
    fields: [multimediaTracks.userId],
    references: [user.id],
  }),
  links: many(multimediaLinks, {
    relationName: 'trackLinks',
  }),
}));

// ✅ Simplified multimediaLinksRelations
export const multimediaLinksRelations = relations(multimediaLinks, ({ one, many }) => ({
  user: one(user, {
    fields: [multimediaLinks.userId],
    references: [user.id],
  }),
  album: one(multimediaAlbums, {
    fields: [multimediaLinks.albumId],
    references: [multimediaAlbums.id],
    relationName: 'albumLinks',
  }),
  track: one(multimediaTracks, {
    fields: [multimediaLinks.trackId],
    references: [multimediaTracks.id],
    relationName: 'trackLinks',
  }),
}));

// ❌ REMOVED: musicAlbumLinksRelations (no longer needed)

export const multimediaPollingLogsRelations = relations(multimediaPollingLogs, ({}) => ({}));

export const multimediaPlaybackHistoryRelations = relations(multimediaPlaybackHistory, ({ one }) => ({
  user: one(user, {
    fields: [multimediaPlaybackHistory.userId],
    references: [user.id],
  }),
  album: one(multimediaAlbums, {
    fields: [multimediaPlaybackHistory.albumId],
    references: [multimediaAlbums.id],
  }),
  track: one(multimediaTracks, {
    fields: [multimediaPlaybackHistory.trackId],
    references: [multimediaTracks.id],
  }),
}));

// ============================================
// TYPES
// ============================================

export type Multimedia = typeof multimedia.$inferSelect;
export type NewMultimedia = typeof multimedia.$inferInsert;
export type MultimediaAlbum = typeof multimediaAlbums.$inferSelect;
export type NewMultimediaAlbum = typeof multimediaAlbums.$inferInsert;
export type MultimediaTrack = typeof multimediaTracks.$inferSelect;
export type NewMultimediaTrack = typeof multimediaTracks.$inferInsert;
export type MultimediaLink = typeof multimediaLinks.$inferSelect;
export type NewMultimediaLink = typeof multimediaLinks.$inferInsert;
export type MultimediaMedia = typeof multimediaMedia.$inferSelect;
export type NewMultimediaMedia = typeof multimediaMedia.$inferInsert;
export type MultimediaPollingLog = typeof multimediaPollingLogs.$inferSelect;
export type NewMultimediaPollingLog = typeof multimediaPollingLogs.$inferInsert;
export type MultimediaPlaybackHistory = typeof multimediaPlaybackHistory.$inferSelect;
export type NewMultimediaPlaybackHistory = typeof multimediaPlaybackHistory.$inferInsert;

// ============================================
// MULTIMEDIA SPEECH
// ============================================

export const multimediaSpeech = pgTable('multimedia_speech', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id),
  title: varchar('title', { length: 255 }).notNull(),
  text: text('text').notNull().default(''),
  voiceId: varchar('voice_id', { length: 128 }),
  provider: text('provider').notNull().default('fish-audio'),
  model: text('model').notNull().default('s2.1-pro-free'),
  settings: jsonb('settings').$type<Record<string, unknown>>().notNull().default({}),
  revision: integer('revision').notNull().default(1),
  acceptedVersionNumber: integer('accepted_version_number'),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table): PgTableExtraConfigValue[] => [
  index('multimedia_speech_owner_updated_idx').on(table.userId, table.updatedAt, table.id),
  check('multimedia_speech_revision_positive', sql`${table.revision} > 0`),
  check('multimedia_speech_accepted_positive', sql`${table.acceptedVersionNumber} IS NULL OR ${table.acceptedVersionNumber} > 0`),
  foreignKey({
    name: 'multimedia_speech_accepted_version_fk',
    columns: [table.id, table.acceptedVersionNumber],
    foreignColumns: [multimediaSpeechVersions.speechId, multimediaSpeechVersions.versionNumber],
  }).onDelete('restrict'),
]);

export const multimediaSpeechVersions = pgTable('multimedia_speech_versions', {
  id: serial('id').primaryKey(),
  speechId: integer('speech_id').notNull().references(() => multimediaSpeech.id, { onDelete: 'restrict' }),
  versionNumber: integer('version_number').notNull(),
  requestId: uuid('request_id').notNull(),
  draftRevision: integer('draft_revision').notNull(),
  // Input snapshot: future API updates must never overwrite this generation's inputs.
  text: text('text').notNull(),
  voiceId: varchar('voice_id', { length: 128 }).notNull(),
  provider: text('provider').notNull(),
  model: text('model').notNull(),
  settings: jsonb('settings').$type<Record<string, unknown>>().notNull().default({}),
  status: text('status').$type<'pending' | 'generating' | 'ready' | 'failed' | 'interrupted'>().notNull().default('pending'),
  storageKey: text('storage_key'),
  fileName: varchar('file_name', { length: 255 }),
  mimeType: varchar('mime_type', { length: 128 }),
  fileSize: integer('file_size'),
  trackId: integer('track_id').references(() => multimediaTracks.id, { onDelete: 'set null' }),
  errorCode: varchar('error_code', { length: 128 }),
  providerStatus: integer('provider_status'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (table): PgTableExtraConfigValue[] => [
  unique('multimedia_speech_version_number_unique').on(table.speechId, table.versionNumber),
  unique('multimedia_speech_version_request_unique').on(table.speechId, table.requestId),
  uniqueIndex('multimedia_speech_one_inflight_idx').on(table.speechId)
    .where(sql`${table.status} IN ('pending', 'generating')`),
  index('multimedia_speech_version_track_idx').on(table.trackId),
  index('multimedia_speech_version_storage_idx').on(table.storageKey),
  check('multimedia_speech_version_positive', sql`${table.versionNumber} > 0 AND ${table.draftRevision} > 0`),
  check('multimedia_speech_version_status_valid', sql`${table.status} IN ('pending', 'generating', 'ready', 'failed', 'interrupted')`),
  check('multimedia_speech_version_size_positive', sql`${table.fileSize} IS NULL OR ${table.fileSize} > 0`),
  check('multimedia_speech_version_ready_output', sql`${table.status} <> 'ready' OR (
    ${table.storageKey} IS NOT NULL AND length(${table.storageKey}) > 0
    AND ${table.fileName} IS NOT NULL AND length(${table.fileName}) > 0
    AND ${table.mimeType} IS NOT NULL AND length(${table.mimeType}) > 0
    AND ${table.fileSize} IS NOT NULL AND ${table.fileSize} > 0
    AND ${table.completedAt} IS NOT NULL
  )`),
]);
