// @/lib/schema/index
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
// ## ALL MODULES
// ============================================

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






// ============================================
// ## TRAFFIC MODULE
// ============================================

// ============================================
// ## Caltrans Districts Table
// ============================================
export const caltransDistricts = pgTable('caltrans_districts', {
  districtId: integer('district_id').primaryKey(),
  districtName: varchar('district_name', { length: 100 }),
  region: varchar('region', { length: 50 }),
  counties: text('counties').array(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  regionIdx: index('idx_districts_region').on(table.region),
}));

// ============================================
// ## Caltrans Lane Closures Table
// ============================================
export const laneClosures = pgTable('lane_closures', {
  closureId: serial('closure_id').primaryKey(),
  sourceId: varchar('source_id', { length: 100 }).unique(),
  district: integer('district'),
  route: varchar('route', { length: 20 }),
  direction: varchar('direction', { length: 10 }),
  closureType: varchar('closure_type', { length: 50 }),
  closureSubtype: varchar('closure_subtype', { length: 50 }),
  lanesAffected: text('lanes_affected'),
  lanesClosed: text('lanes_closed'),
  laneConfiguration: text('lane_configuration'),
  startDate: timestamp('start_date', { mode: 'string' }),
  endDate: timestamp('end_date', { mode: 'string' }),
  startTime: varchar('start_time', { length: 8 }),
  endTime: varchar('end_time', { length: 8 }),
  startTimestamp: timestamp('start_timestamp', { mode: 'date' }),
  endTimestamp: timestamp('end_timestamp', { mode: 'date' }),
  description: text('description'),
  locationDescription: text('location_description'),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  county: varchar('county', { length: 100 }),
  city: varchar('city', { length: 100 }),
  status: varchar('status', { length: 20 }).default('active'),
  firstSeen: timestamp('first_seen').defaultNow(),
  lastSeen: timestamp('last_seen').defaultNow(),
  lastModified: timestamp('last_modified').defaultNow(),
  timesSeen: integer('times_seen').default(1),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  sourceIdIdx: uniqueIndex('idx_closures_source_id').on(table.sourceId),
  districtIdx: index('idx_closures_district').on(table.district),
  routeIdx: index('idx_closures_route').on(table.route),
  statusIdx: index('idx_closures_status').on(table.status),
  lastSeenIdx: index('idx_closures_last_seen').on(table.lastSeen),
  datesIdx: index('idx_closures_dates').on(table.startDate, table.endDate),
}));

// ============================================
// ## CHP Collisions Table (Historical)
// ============================================
export const chpCollisions = pgTable('chp_collisions', {
  id: serial('id').primaryKey(),
  caseId: varchar('case_id', { length: 50 }).unique(),
  collisionDate: timestamp('collision_date', { mode: 'date' }),
  collisionYear: integer('collision_year'),
  severity: varchar('severity', { length: 50 }),
  county: varchar('county', { length: 100 }),
  city: varchar('city', { length: 100 }),
  location: text('location'),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  primaryFactor: text('primary_factor'),
  weather: varchar('weather', { length: 50 }),
  lighting: varchar('lighting', { length: 50 }),
  injuries: integer('injuries').default(0),
  fatalities: integer('fatalities').default(0),
  rawData: jsonb('raw_data'),
  fetchedAt: timestamp('fetched_at').defaultNow(),
  lastSeen: timestamp('last_seen').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  caseIdIdx: uniqueIndex('idx_chp_case_id').on(table.caseId),
  countyIdx: index('idx_chp_county').on(table.county),
  severityIdx: index('idx_chp_severity').on(table.severity),
  yearIdx: index('idx_chp_year').on(table.collisionYear),
  dateIdx: index('idx_chp_date').on(table.collisionDate),
}));

// ============================================
// ## Bay Area 511 Traffic Events Table
// ============================================
export const bayAreaTrafficEvents = pgTable('bay_area_traffic_events', {
  id: serial('id').primaryKey(),
  sourceId: varchar('source_id', { length: 100 }).unique(),
  eventType: varchar('event_type', { length: 100 }),
  eventSubType: varchar('event_sub_type', { length: 100 }),
  severity: varchar('severity', { length: 50 }),
  status: varchar('status', { length: 20 }).default('active'),
  title: text('title'),
  description: text('description'),
  roadwayName: varchar('roadway_name', { length: 100 }),
  directionOfTravel: varchar('direction_of_travel', { length: 50 }),
  lanesAffected: text('lanes_affected'),
  isFullClosure: boolean('is_full_closure').default(false),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  startTime: timestamp('start_time'),
  endTime: timestamp('end_time'),
  lastUpdated: timestamp('last_updated'),
  rawData: jsonb('raw_data'),
  fetchedAt: timestamp('fetched_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  sourceIdIdx: uniqueIndex('idx_bay_area_source_id').on(table.sourceId),
  typeIdx: index('idx_bay_area_type').on(table.eventType),
  roadwayIdx: index('idx_bay_area_roadway').on(table.roadwayName),
  statusIdx: index('idx_bay_area_status').on(table.status),
}));

// ============================================
// ## API Request Logs Table (for monitoring)
// ============================================
export const apiRequestLogs = pgTable('api_request_logs', {
  logId: serial('log_id').primaryKey(),
  endpoint: text('endpoint'),
  district: integer('district'),
  responseTimeMs: integer('response_time_ms'),
  statusCode: integer('status_code'),
  success: boolean('success'),
  recordsFetched: integer('records_fetched').default(0),
  errorMessage: text('error_message'),
  responseSizeBytes: integer('response_size_bytes'),
  requestTimestamp: timestamp('request_timestamp').defaultNow(),
}, (table) => ({
  timestampIdx: index('idx_api_logs_timestamp').on(table.requestTimestamp),
  successIdx: index('idx_api_logs_success').on(table.success),
}));

// ============================================
// ## CHP CAD Incidents Tables
// ============================================

// CHP CAD Communications Centers table
export const chpCadCenters = pgTable('chp_cad_centers', {
  id: serial('id').primaryKey(),
  centerCode: varchar('center_code', { length: 10 }).unique().notNull(),
  centerName: varchar('center_name', { length: 100 }).notNull(),
  county: varchar('county', { length: 100 }),
  region: varchar('region', { length: 50 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  centerCodeIdx: uniqueIndex('idx_chp_cad_centers_code').on(table.centerCode),
  countyIdx: index('idx_chp_cad_centers_county').on(table.county),
}));

// CHP CAD Incidents table with foreign key to centers
export const chpCadIncidents = pgTable('chp_cad_incidents', {
  id: serial('id').primaryKey(),
  sourceId: varchar('source_id', { length: 100 }).unique(),
  centerId: integer('center_id').references(() => chpCadCenters.id, { onDelete: 'set null' }),
  incidentType: varchar('incident_type', { length: 100 }),
  location: text('location'),
  city: varchar('city', { length: 100 }),
  county: varchar('county', { length: 100 }),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  logTime: timestamp('log_time'),
  details: text('details'),
  status: varchar('status', { length: 20 }).default('active'),
  fetchedAt: timestamp('fetched_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  sourceIdIdx: uniqueIndex('idx_chp_cad_source_id').on(table.sourceId),
  centerIdIdx: index('idx_chp_cad_center_id').on(table.centerId),
  countyIdx: index('idx_chp_cad_county').on(table.county),
  logTimeIdx: index('idx_chp_cad_log_time').on(table.logTime),
}));

// Define relationships
export const chpCadCentersRelations = relations(chpCadCenters, ({ many }) => ({
  incidents: many(chpCadIncidents),
}));

export const chpCadIncidentsRelations = relations(chpCadIncidents, ({ one }) => ({
  center: one(chpCadCenters, {
    fields: [chpCadIncidents.centerId],
    references: [chpCadCenters.id],
  }),
}));


// ============================================
// ## CCTV Cameras Table (Future)
// ============================================
export const cctvCameras = pgTable('cctv_cameras', {
  cameraId: serial('camera_id').primaryKey(),
  index: varchar('index', { length: 10 }),
  district: integer('district'),
  locationName: varchar('location_name', { length: 100 }),
  nearbyPlace: varchar('nearby_place', { length: 100 }),
  latitude: numeric('latitude', { precision: 10, scale: 7 }).$type<number>(),
  longitude: numeric('longitude', { precision: 10, scale: 7 }).$type<number>(),
  direction: varchar('direction', { length: 10 }),
  county: varchar('county', { length: 50 }),
  route: varchar('route', { length: 20 }),
  inService: boolean('in_service'),
  currentImageUrl: text('current_image_url'),
  lastUpdated: timestamp('last_updated'),
  rawData: jsonb('raw_data'),
  fetchedAt: timestamp('fetched_at').defaultNow(),
});


// ============================================
// ## CalTrans
// ============================================

// Snapshots table for analytics
export const laneClosuresSnapshots = pgTable('lane_closures_snapshots', {
  snapshotId: serial('snapshot_id').primaryKey(),
  snapshotTimestamp: timestamp('snapshot_timestamp').defaultNow(),
  district: integer('district'),
  totalClosures: integer('total_closures'),
  closuresByType: jsonb('closures_by_type'),
  closuresByRoute: jsonb('closures_by_route'),
  rawSummary: jsonb('raw_summary'),
}, (table) => ({
  timestampIdx: index('idx_snapshots_timestamp').on(table.snapshotTimestamp),
  districtIdx: index('idx_snapshots_district').on(table.district),
}));

// Define relationships
export const laneClosuresRelations = relations(laneClosures, ({ one }) => ({
  district: one(caltransDistricts, {
    fields: [laneClosures.district],
    references: [caltransDistricts.districtId],
  }),
}));

export const caltransDistrictsRelations = relations(caltransDistricts, ({ many }) => ({
  closures: many(laneClosures),
}));

// Types for use in the application
export type LaneClosure = typeof laneClosures.$inferSelect;
export type NewLaneClosure = typeof laneClosures.$inferInsert;
export type ApiRequestLog = typeof apiRequestLogs.$inferSelect;
export type NewApiRequestLog = typeof apiRequestLogs.$inferInsert;
export type CaltransDistrict = typeof caltransDistricts.$inferSelect;

// ============================================
// ## CalFire Incidents
// ============================================
export const calfireIncidents = pgTable('calfire_incidents', {
  id: serial('id').primaryKey(),
  uniqueId: varchar('unique_id', { length: 100 }).unique().notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  type: varchar('type', { length: 50 }).default('Wildfire'),
  status: varchar('status', { length: 20 }).default('active'),
  county: varchar('county', { length: 100 }),
  location: text('location'),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  acresBurned: decimal('acres_burned', { precision: 12, scale: 1 }),
  percentContained: decimal('percent_contained', { precision: 5, scale: 1 }),
  startedAt: timestamp('started_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
  extinguishedAt: timestamp('extinguished_at', { withTimezone: true }),
  adminUnit: varchar('admin_unit', { length: 200 }),
  url: text('url'),
  isActive: boolean('is_active').default(true),
  isCalFireIncident: boolean('is_calfire_incident').default(false),
  rawData: jsonb('raw_data'),
  fetchedAt: timestamp('fetched_at', { withTimezone: true }).defaultNow(),
  lastSeen: timestamp('last_seen', { withTimezone: true }).defaultNow(),
}, (table) => ({
  uniqueIdIdx: uniqueIndex('idx_calfire_unique_id').on(table.uniqueId),
  countyIdx: index('idx_calfire_county').on(table.county),
  statusIdx: index('idx_calfire_status').on(table.status),
  activeIdx: index('idx_calfire_active').on(table.isActive),
}));

// ============================================
// ## [MM] Schema Updated 2026-05-30
// ============================================















// ============================================
// ## THREED MODULE
// ============================================

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
// Update the modelTypeEnum to include more values
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
// 1. threed_plants - Master plant database (UPDATED with GLTF support)
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
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  plantIdIdx: uniqueIndex('idx_threed_plants_plant_id').on(table.plantId),
  commonNameIdx: index('idx_threed_plants_common_name').on(table.commonName),
  typeIdx: index('idx_threed_plants_type').on(table.type),
  statusIdx: index('idx_threed_plants_status').on(table.status),
  // modelTypeIdx: index('idx_threed_plants_model_type').on(table.modelType),
}));

// ============================================
// 1b. threed_models - GLTF model library (NEW)
// ============================================
export const threedModels = pgTable('threed_models', {
  id: serial('id').primaryKey(),
  
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

  // Update threedModels table to track if it has external files
  hasExternalFiles: boolean('has_external_files').default(false),
  textureCount: integer('texture_count').default(0),
  mainModelFileId: integer('main_model_file_id'), // Reference to the main GLB/GLTF file in threedModelFiles
  
  // Model metadata
  isActive: boolean('is_active').default(true),
  isDefault: boolean('is_default').default(false),
  uploadedBy: varchar('uploaded_by', { length: 255 }),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
  
  // Additional metadata (author, license, etc.)
  metadata: jsonb('metadata').default({}),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  // plantIdIdx: index('idx_threed_models_plant_id').on(table.plantId),
  modelTypeIdx: index('idx_threed_models_type').on(table.modelType),
  activeIdx: index('idx_threed_models_active').on(table.isActive),
}));

// ============================================
// 2. threed_beds - Garden layout (UPDATED with GLTF support)
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
// 3. threed_plantings - Plants in beds (UPDATED with GLTF support)
// ============================================
export const threedPlantings = pgTable('threed_plantings', {
  id: serial('id').primaryKey(),
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
  plantingIdIdx: uniqueIndex('idx_threed_plantings_planting_id').on(table.plantingId),
  plantIdx: index('idx_threed_plantings_plant').on(table.plantId),
  bedIdx: index('idx_threed_plantings_bed').on(table.bedId),
  statusIdx: index('idx_threed_plantings_status').on(table.status),
  customModelIdx: index('idx_threed_plantings_custom_model').on(table.customModelId),
}));

// ============================================
// 4. threed_watering_schedules - Automated watering (NEW)
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
// 5. threed_watering_history - Watering logs (NEW)
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
// 7. threed_tasks - Garden tasks/to-do (UPDATED with watering integration)
// ============================================
export const threedTasks = pgTable('threed_tasks', {
  id: serial('id').primaryKey(),
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
  wateringScheduleIdx: index('idx_threed_tasks_watering').on(table.wateringScheduleId),
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
  
  // Source and metadata
  source: varchar('source', { length: 50 }).default('api'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  recordedAtIdx: index('idx_threed_weather_recorded_at').on(table.recordedAt),
}));

// ============================================
// 9. threed_farmbots - FarmBot devices
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
// RELATIONSHIPS (UPDATED)
// ============================================
export const threedPlantsRelations = relations(threedPlants, ({ many }) => ({
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
}));

export const threedBedsRelations = relations(threedBeds, ({ many }) => ({
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
}));

// Export types for use in the application
export type ThreedPlant = typeof threedPlants.$inferSelect;
export type NewThreedPlant = typeof threedPlants.$inferInsert;
export type ThreedModel = typeof threedModels.$inferSelect;
export type NewThreedModel = typeof threedModels.$inferInsert;
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
export type ThreedFarmbot = typeof threedFarmbots.$inferSelect;
export type ThreedFarmbotLog = typeof threedFarmbotLogs.$inferSelect;

// ============================================
// ## Schema Updated 2026-05-30
// ## Added GLTF model support and automated watering schedules
// ============================================

// ============================================
// 1c. threed_model_files - Associated files for 3D models (NEW)
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
// ## Schema Updated 2026-05-30
// ## Added model files, so models can have multiple files
// ============================================

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

// src/lib/auth/schema.ts - Add new enums and fields to threedCharacters only

// New enums for characters
export const characterMovementTypeEnum = pgEnum('threed_character_movement_type', [
  'stationary', 'wander', 'patrol', 'circle', 'follow', 'teleport'
]);

export const characterWeatherSensitivityEnum = pgEnum('threed_character_weather_sensitivity', [
  'all', 'sunny_only', 'rainy_only', 'no_rain', 'no_snow'
]);

export const characterEmoteEnum = pgEnum('threed_character_emote', [
  'none', 'happy', 'sad', 'surprised', 'angry', 'wave', 'dance', 'sleep'
]);

// Update threedCharacters table with new fields
export const threedCharacters = pgTable('threed_characters', {
  id: serial('id').primaryKey(),
  characterId: varchar('character_id', { length: 50 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: characterTypeEnum('type').default('animal'),
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
  movementPattern: varchar('movement_pattern', { length: 50 }), // Legacy, keep for compatibility
  movementRadius: decimal('movement_radius', { precision: 5, scale: 2 }),
  movementSpeed: decimal('movement_speed', { precision: 4, scale: 2 }).default('0.5'),
  
  // New: Patrol waypoints (store as JSON array of {x, y, z})
  patrolWaypoints: jsonb('patrol_waypoints').default([]),
  
  // New: Follow target (could be plantId, characterId, or 'camera')
  followTarget: varchar('follow_target', { length: 50 }),
  followDistance: decimal('follow_distance', { precision: 4, scale: 2 }).default('2.0'),
  
  // New: Teleport positions
  teleportPositions: jsonb('teleport_positions').default([]),
  teleportInterval: integer('teleport_interval'), // seconds between teleports
  
  // Enhanced Interaction
  interactable: boolean('interactable').default(true),
  interactionMessage: text('interaction_message'),
  soundEffect: varchar('sound_effect', { length: 255 }),
  
  // New: Emote system
  defaultEmote: characterEmoteEnum('default_emote').default('none'),
  emoteOnInteract: characterEmoteEnum('emote_on_interact').default('happy'),
  
  // New: Time-based activation
  activeStartHour: integer('active_start_hour'), // 0-23
  activeEndHour: integer('active_end_hour'),
  
  // New: Weather sensitivity
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
  
  // New: Visibility
  visible: boolean('visible').default(true),
  visibleDistance: decimal('visible_distance', { precision: 5, scale: 2 }).default('30.0'),
  
  // Metadata
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  characterIdIdx: uniqueIndex('idx_threed_characters_character_id').on(table.characterId),
  nameIdx: index('idx_threed_characters_name').on(table.name),
  typeIdx: index('idx_threed_characters_type').on(table.type),
  statusIdx: index('idx_threed_characters_status').on(table.status),
  movementTypeIdx: index('idx_threed_characters_movement_type').on(table.movementType),
  modelIdx: index('idx_threed_characters_model').on(table.modelId),
  bedIdx: index('idx_threed_characters_bed').on(table.bedId),
  visibleIdx: index('idx_threed_characters_visible').on(table.visible),
}));

// Add character-specific file to threedModelFiles if needed
// (no changes needed - model files work the same)

// Update relationships
export const threedCharactersRelations = relations(threedCharacters, ({ one }) => ({
  model: one(threedModels, {
    fields: [threedCharacters.modelId],
    references: [threedModels.id],
  }),
  bed: one(threedBeds, {
    fields: [threedCharacters.bedId],
    references: [threedBeds.id],
  }),
}));

// ============================================
// ## Schema Updated 2026-05-31
// ## Added characters
// ============================================