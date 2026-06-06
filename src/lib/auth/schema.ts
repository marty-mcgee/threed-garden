// @/lib/auth/schema
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

// ============================================
// ## Better Auth: User Session + Account
// ============================================
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

// ============================================
// ### Music Service
// ============================================

// Music Enums
export const musicLinkTypeEnum = pgEnum('music_link_type', ['external', 'social', 'buy', 'stream', 'video']);
export const musicLinkStatusEnum = pgEnum('music_link_status', ['active', 'inactive', 'pending', 'expired']);
export const albumStatusEnum = pgEnum('album_status', ['draft', 'published', 'archived']);
export const trackStatusEnum = pgEnum('track_status', ['active', 'inactive', 'processing']);
export const musicPollingTypeEnum = pgEnum('music_polling_type', ['metadata', 'stats', 'sync']);

// Music Tables
export const musicAlbums = pgTable('music_albums', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  artist: text('artist').notNull(),
  coverArt: text('cover_art').notNull(), // Direct URL to the image file
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

// ============================================
// ## Schema Updated 2026-06-04
// ## Added music .. album pictures/media
// ============================================

// Add this new table after music_albums

export const musicMedia = pgTable('music_media', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }).notNull(), // Add this
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
  userIdIdx: index('music_media_user_id_idx').on(table.userId), // Add this
  albumIdIdx: index('music_media_album_id_idx').on(table.albumId),
  isPrimaryIdx: index('music_media_is_primary_idx').on(table.isPrimary),
}));

// Add relation to musicAlbums
export const musicAlbumsRelations = relations(musicAlbums, ({ many, one }) => ({
  tracks: many(musicTracks),
  musicAlbumLinks: many(musicAlbumLinks),
  media: many(musicMedia), // Add this line
  user: one(user, {
    fields: [musicAlbums.userId],
    references: [user.id],
  }),
}));

// Add relation from musicMedia to musicAlbums
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

// ============================================
// ## Schema Updated 2026-06-04
// ## Added music .. album pictures
// ============================================

export const musicTracks = pgTable('music_tracks', {
  id: serial('id').primaryKey(),
  albumId: integer('album_id').references(() => musicAlbums.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  duration: integer('duration'),
  trackNumber: integer('track_number'),
  publicUrl: text('public_url').notNull(), // Direct URL to the audio file
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

export const musicLinks = pgTable('music_links', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  url: text('url').notNull(), // Direct URL to the link file
  type: musicLinkTypeEnum('type').default('external'),
  icon: text('icon'),
  description: text('description'),
  status: musicLinkStatusEnum('status').default('active'),
  displayOrder: integer('display_order').default(0),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (table) => ({
  userIdIdx: index('music_links_user_id_idx').on(table.userId),
  typeIdx: index('music_links_type_idx').on(table.type),
}));

export const musicAlbumLinks = pgTable('music_album_links', {
  id: serial('id').primaryKey(),
  albumId: integer('album_id').references(() => musicAlbums.id, { onDelete: 'cascade' }),
  linkId: integer('link_id').references(() => musicLinks.id, { onDelete: 'cascade' }),
  linkType: text('link_type').notNull(), // 'album' or 'track'
  trackId: integer('track_id').references(() => musicTracks.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (table) => ({
  albumLinkIdx: index('album_links_album_link_idx').on(table.albumId, table.linkId),
  trackLinkIdx: index('album_links_track_link_idx').on(table.trackId, table.linkId),
}));

export const musicPollingLogs = pgTable('music_polling_logs', {
  id: serial('id').primaryKey(),
  pollType: musicPollingTypeEnum('poll_type').notNull(),
  status: text('status').notNull(), // 'success', 'error', 'in_progress'
  message: text('message'),
  metadata: jsonb('metadata'),
  startedAt: timestamp('started_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  error: text('error'),
}, (table) => ({
  // Change from index to regular index
  pollTypeIdx: index('music_polling_logs_type_idx').on(table.pollType),
  statusIdx: index('music_polling_logs_status_idx').on(table.status),
  // Optional: add a compound index for common queries
  pollTypeStatusIdx: index('music_polling_logs_type_status_idx').on(table.pollType, table.status),
}));

// Relations

export const musicTracksRelations = relations(musicTracks, ({ one, many }) => ({
  album: one(musicAlbums, {
    fields: [musicTracks.albumId],
    references: [musicAlbums.id],
  }),
  trackLinks: many(musicAlbumLinks),
}));

export const musicLinksRelations = relations(musicLinks, ({ many, one }) => ({
  musicAlbumLinks: many(musicAlbumLinks),
  user: one(user, {
    fields: [musicLinks.userId],
    references: [user.id],
  }),
}));

export const musicAlbumLinksRelations = relations(musicAlbumLinks, ({ one }) => ({
  album: one(musicAlbums, {
    fields: [musicAlbumLinks.albumId],
    references: [musicAlbums.id],
  }),
  link: one(musicLinks, {
    fields: [musicAlbumLinks.linkId],
    references: [musicLinks.id],
  }),
  track: one(musicTracks, {
    fields: [musicAlbumLinks.trackId],
    references: [musicTracks.id],
  }),
}));

export const musicPollingLogsRelations = relations(musicPollingLogs, ({}) => ({}));

// ============================================
// ## Schema Updated 2026-06-02
// ## Added music
// ============================================

// Add this to your schema file
export const musicPlaybackHistory = pgTable('music_playback_history', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  trackId: integer('track_id').references(() => musicTracks.id, { onDelete: 'cascade' }),
  albumId: integer('album_id').references(() => musicAlbums.id, { onDelete: 'cascade' }),
  playedAt: timestamp('played_at').defaultNow(),
  playDuration: integer('play_duration'), // seconds played
  completed: boolean('completed').default(false),
  source: text('source').default('music_player'), // 'music_player', 'queue', 'autoplay'
}, (table) => ({
  userIdIdx: index('music_playback_user_id_idx').on(table.userId),
  trackIdIdx: index('music_playback_track_id_idx').on(table.trackId),
  playedAtIdx: index('music_playback_played_at_idx').on(table.playedAt),
}));

// ============================================
// ## Schema Updated 2026-06-03
// ## Added music playback history
// ============================================
