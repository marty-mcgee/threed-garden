// @/lib/schema/traffic/index
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
// import { user } from '../auth';

// ============================================
// ## TRAFFIC MODULE
// ============================================

// ============================================
// ## Caltrans Districts Table
// ============================================
export const caltransDistricts = pgTable('traffic_caltrans_districts', {
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
export const laneClosures = pgTable('traffic_lane_closures', {
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
export const chpCollisions = pgTable('traffic_chp_collisions', {
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
export const bayAreaTrafficEvents = pgTable('traffic_bay_area_traffic_events', {
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
export const apiRequestLogs = pgTable('traffic_api_request_logs', {
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
export const chpCadCenters = pgTable('traffic_chp_cad_centers', {
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
export const chpCadIncidents = pgTable('traffic_chp_cad_incidents', {
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
export const cctvCameras = pgTable('traffic_cctv_cameras', {
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
export const laneClosuresSnapshots = pgTable('traffic_lane_closures_snapshots', {
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
export const calfireIncidents = pgTable('traffic_calfire_incidents', {
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