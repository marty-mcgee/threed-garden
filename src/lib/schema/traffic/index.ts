// lib/schema/traffic/index.ts
import { 
  pgTable, text, timestamp, boolean, jsonb, serial, 
  index, uniqueIndex, integer, decimal, varchar, 
  pgEnum 
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from '../auth';
import { projectAssets, projectTraffic } from '@/lib/schema/project';

// ============================================
// ENUMS
// ============================================

export const incidentStatusEnum = pgEnum('incident_status', [
  'active',
  'cleared',
  'pending',
  'unknown'
]);

export const incidentTypeEnum = pgEnum('incident_type', [
  'traffic_collision',
  'hazard',
  'road_closed',
  'fire',
  'emergency',
  'other'
]);

export const closureStatusEnum = pgEnum('closure_status', [
  'active',
  'cleared',
  'planned',
  'cancelled',
]);

export const closureTypeEnum = pgEnum('closure_type', [
  'full',
  'partial',
  'lane',
  'shoulder',
  'ramp'
]);

export const eventStatusEnum = pgEnum('event_status', [
  'active',
  'cleared',
  'planned',
  'cancelled',
]);

export const eventTypeEnum = pgEnum('event_type', [
  'accident',
  'congestion',
  'construction',
  'special_event',
  'weather'
]);

// ============================================
// 1. traffic - Main Traffic Module Table
// ============================================

export const traffic = pgTable('traffic', {
  id: serial('id').primaryKey(),

  // Owner
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  
  // Basic info
  name: text('name').notNull(),
  description: text('description'),
  slug: text('slug').unique().notNull(),
  
  // Module settings
  isActive: boolean('is_active').default(true),
  isPublic: boolean('is_public').default(false),
  
  // Configuration
  config: jsonb('config').default({}),
  
  // // Data source preferences
  // dataSources: jsonb('data_sources').default({
  //   chpCad: true,
  //   chpCases: true,
  //   caltrans: true,
  //   caltransCctv: true,
  //   bayArea511: true,
  //   calfire: true
  // }),
  
  // // Map settings
  // mapConfig: jsonb('map_config').default({
  //   center: { lat: 37.7749, lng: -122.4194 },
  //   zoom: 10,
  //   layers: [
  //     'chpCad', 
  //     'chpCases', 
  //     'caltrans', 
  //     'caltransCctv', 
  //     'bayArea511', 
  //     'calfire'
  //   ]
  // }),
  
  // Metadata
  version: text('version').default('1.0.0'),
  metadata: jsonb('metadata').default({}),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_traffic_user_id').on(table.userId),
  slugIdx: uniqueIndex('idx_traffic_slug').on(table.slug),
  activeIdx: index('idx_traffic_active').on(table.isActive),
}));

// ============================================
// 2. traffic_chp_cad_incidents - Live CHP Incidents
// ============================================

export const trafficChpCadIncidents = pgTable('traffic_chp_cad_incidents', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  
  // Incident identification
  incidentId: varchar('incident_id', { length: 50 }).unique().notNull(),
  sourceId: varchar('source_id', { length: 50 }).notNull(),
  
  // Incident details
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  type: incidentTypeEnum('type').default('other'),
  status: incidentStatusEnum('status').default('active'),
  
  // Location
  location: text('location'),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  county: varchar('county', { length: 100 }),
  zipCode: varchar('zip_code', { length: 10 }),
  
  // CHP-specific
  chpDivision: varchar('chp_division', { length: 50 }),
  chpOffice: varchar('chp_office', { length: 50 }),
  centerId: integer('center_id'),
  logNumber: varchar('log_number', { length: 20 }),
  
  // Timing
  reportedAt: timestamp('reported_at', { mode: 'string' }).notNull(),
  clearedAt: timestamp('cleared_at', { mode: 'string' }),
  lastUpdated: timestamp('last_updated', { mode: 'string' }).notNull(),
  
  // Details
  units: jsonb('units').default([]),
  rawData: jsonb('raw_data'),
  notes: text('notes'),
  
  // Metadata
  isActive: boolean('is_active').default(true),
  isPublic: boolean('is_public').default(true),
  severity: integer('severity').default(1),
  
  // ✅ Metadata - database-managed
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (table) => ({
  incidentIdIdx: uniqueIndex('idx_traffic_chp_incident_id').on(table.incidentId),
  sourceIdIdx: index('idx_traffic_chp_source_id').on(table.sourceId),
  statusIdx: index('idx_traffic_chp_status').on(table.status),
  typeIdx: index('idx_traffic_chp_type').on(table.type),
  reportedAtIdx: index('idx_traffic_chp_reported_at').on(table.reportedAt),
  locationIdx: index('idx_traffic_chp_location').on(table.latitude, table.longitude),
  activeIdx: index('idx_traffic_chp_active').on(table.isActive),
  centerIdx: index('idx_traffic_chp_center').on(table.centerId),
}));

// ============================================
// 3. traffic_chp_cases - Historical Collisions
// ============================================

export const trafficChpCases = pgTable('traffic_chp_cases', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  
  // Case identification
  caseId: varchar('case_id', { length: 50 }).unique().notNull(),
  sourceId: varchar('source_id', { length: 50 }).notNull(),
  
  // Case details
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  type: incidentTypeEnum('type').default('traffic_collision'),
  severity: integer('severity').default(1),
  
  // Location
  location: text('location'),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  county: varchar('county', { length: 100 }),
  zipCode: varchar('zip_code', { length: 10 }),
  
  // Collision details
  collisionType: varchar('collision_type', { length: 50 }),
  weatherCondition: varchar('weather_condition', { length: 50 }),
  roadCondition: varchar('road_condition', { length: 50 }),
  lightCondition: varchar('light_condition', { length: 50 }),
  
  // Vehicles involved
  vehiclesInvolved: integer('vehicles_involved').default(1),
  injuries: integer('injuries').default(0),
  fatalities: integer('fatalities').default(0),
  
  // Timing
  occurredAt: timestamp('occurred_at', { mode: 'string' }).notNull(),
  reportedAt: timestamp('reported_at', { mode: 'string' }),
  
  // Metadata
  rawData: jsonb('raw_data'),
  notes: text('notes'),
  isActive: boolean('is_active').default(true),
  isPublic: boolean('is_public').default(true),
  
  // ✅ Metadata - database-managed
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (table) => ({
  caseIdIdx: uniqueIndex('idx_traffic_chp_case_id').on(table.caseId),
  occurredAtIdx: index('idx_traffic_chp_case_occurred_at').on(table.occurredAt),
  severityIdx: index('idx_traffic_chp_case_severity').on(table.severity),
  locationIdx: index('idx_traffic_chp_case_location').on(table.latitude, table.longitude),
  activeIdx: index('idx_traffic_chp_case_active').on(table.isActive),
}));

// ============================================
// 4. traffic_caltrans_lane_closures - Caltrans Closures
// ============================================

export const trafficCaltransLaneClosures = pgTable('traffic_caltrans_lane_closures', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  
  // Closure identification
  closureId: varchar('closure_id', { length: 50 }).unique().notNull(),
  sourceId: varchar('source_id', { length: 50 }).notNull(),
  
  // Closure details
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  closureType: closureTypeEnum('closure_type').default('lane'),
  
  // Location
  route: varchar('route', { length: 50 }),
  direction: varchar('direction', { length: 20 }),
  county: varchar('county', { length: 100 }),
  city: varchar('city', { length: 100 }),
  milepost: decimal('milepost', { precision: 8, scale: 2 }),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  
  // Timing
  startDate: timestamp('start_date', { mode: 'string' }).notNull(),
  endDate: timestamp('end_date', { mode: 'string' }),
  expectedEndDate: timestamp('expected_end_date', { mode: 'string' }),
  lastUpdated: timestamp('last_updated', { mode: 'string' }).notNull(),
  
  // Caltrans-specific
  districtId: integer('district_id'),
  caltransId: varchar('caltrans_id', { length: 50 }),
  
  // Details
  reason: text('reason'),
  detour: text('detour'),
  rawData: jsonb('raw_data'),
  notes: text('notes'),
  
  // Metadata
  isActive: boolean('is_active').default(true),
  isPublic: boolean('is_public').default(true),
  
  // ✅ Metadata - database-managed
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (table) => ({
  closureIdIdx: uniqueIndex('idx_traffic_caltrans_closure_id').on(table.closureId),
  routeIdx: index('idx_traffic_caltrans_route').on(table.route),
  countyIdx: index('idx_traffic_caltrans_county').on(table.county),
  startDateIdx: index('idx_traffic_caltrans_start_date').on(table.startDate),
  districtIdx: index('idx_traffic_caltrans_district').on(table.districtId),
  activeIdx: index('idx_traffic_caltrans_active').on(table.isActive),
}));

// ============================================
// 5. traffic_bay_area_511_events - 511 Events
// ============================================

export const trafficBayArea511Events = pgTable('traffic_bay_area_511_events', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  
  // Event identification
  eventId: varchar('event_id', { length: 50 }).unique().notNull(),
  sourceId: varchar('source_id', { length: 50 }).notNull(),
  
  // Event details
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  eventType: eventTypeEnum('event_type').default('accident'),
  severity: integer('severity').default(1),
  
  // Location
  location: text('location'),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  county: varchar('county', { length: 100 }),
  
  // Timing
  reportedAt: timestamp('reported_at', { mode: 'string' }).notNull(),
  clearedAt: timestamp('cleared_at', { mode: 'string' }),
  lastUpdated: timestamp('last_updated', { mode: 'string' }).notNull(),
  
  // Details
  impact: text('impact'),
  rawData: jsonb('raw_data'),
  notes: text('notes'),
  
  // Metadata
  isActive: boolean('is_active').default(true),
  isPublic: boolean('is_public').default(true),
  
  // ✅ Metadata - database-managed
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (table) => ({
  eventIdIdx: uniqueIndex('idx_traffic_511_event_id').on(table.eventId),
  eventTypeIdx: index('idx_traffic_511_event_type').on(table.eventType),
  reportedAtIdx: index('idx_traffic_511_reported_at').on(table.reportedAt),
  locationIdx: index('idx_traffic_511_location').on(table.latitude, table.longitude),
  activeIdx: index('idx_traffic_511_active').on(table.isActive),
}));

// ============================================
// 6. traffic_calfire_incidents - CalFire Incidents
// ============================================

export const trafficCalfireIncidents = pgTable('traffic_calfire_incidents', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  
  // Incident identification
  incidentId: varchar('incident_id', { length: 50 }).unique().notNull(),
  sourceId: varchar('source_id', { length: 50 }).notNull(),
  
  // Incident details
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  incidentType: varchar('incident_type', { length: 50 }).default('wildfire'),
  status: incidentStatusEnum('status').default('active'),
  
  // Location
  location: text('location'),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  county: varchar('county', { length: 100 }),
  
  // Fire details
  acreage: integer('acreage'),
  containment: integer('containment'),
  cause: varchar('cause', { length: 100 }),
  fireType: varchar('fire_type', { length: 50 }),
  evacuations: jsonb('evacuations'),
  
  // Timing
  reportedAt: timestamp('reported_at', { mode: 'string' }).notNull(),
  containedAt: timestamp('contained_at', { mode: 'string' }),
  lastUpdated: timestamp('last_updated', { mode: 'string' }).notNull(),
  
  // Details
  rawData: jsonb('raw_data'),
  notes: text('notes'),
  
  // Metadata
  isActive: boolean('is_active').default(true),
  isPublic: boolean('is_public').default(true),
  severity: integer('severity').default(1),
  
  // ✅ Metadata - database-managed
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (table) => ({
  incidentIdIdx: uniqueIndex('idx_traffic_calfire_incident_id').on(table.incidentId),
  statusIdx: index('idx_traffic_calfire_status').on(table.status),
  countyIdx: index('idx_traffic_calfire_county').on(table.county),
  reportedAtIdx: index('idx_traffic_calfire_reported_at').on(table.reportedAt),
  locationIdx: index('idx_traffic_calfire_location').on(table.latitude, table.longitude),
  activeIdx: index('idx_traffic_calfire_active').on(table.isActive),
  severityIdx: index('idx_traffic_calfire_severity').on(table.severity),
}));

// ============================================
// 7. traffic_caltrans_cctv_cameras - Caltrans Traffic Cameras
// ============================================

export const trafficCaltransCctvCameras = pgTable('traffic_caltrans_cctv_cameras', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  
  // Camera identification
  cameraId: varchar('camera_id', { length: 50 }).unique().notNull(),
  sourceId: varchar('source_id', { length: 50 }).notNull(),
  
  // Camera details
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  
  // Location
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  county: varchar('county', { length: 100 }),
  
  // Camera specifics
  cameraType: varchar('camera_type', { length: 50 }),
  direction: varchar('direction', { length: 20 }),
  imageUrl: text('image_url'),
  streamingUrl: text('streaming_url'),
  status: varchar('status', { length: 20 }).default('active'),
  
  // Caltrans-specific
  districtId: integer('district_id'),
  caltransId: varchar('caltrans_id', { length: 50 }),
  
  // Metadata
  rawData: jsonb('raw_data'),
  notes: text('notes'),
  isActive: boolean('is_active').default(true),
  isPublic: boolean('is_public').default(true),
  
  // ✅ Metadata - database-managed
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (table) => ({
  cameraIdIdx: uniqueIndex('idx_traffic_cctv_camera_id').on(table.cameraId),
  locationIdx: index('idx_traffic_cctv_location').on(table.latitude, table.longitude),
  districtIdx: index('idx_traffic_cctv_district').on(table.districtId),
  activeIdx: index('idx_traffic_cctv_active').on(table.isActive),
  statusIdx: index('idx_traffic_cctv_status').on(table.status),
}));

// ============================================
// 8. traffic_chp_centers - CHP Centers
// ============================================

export const trafficChpCenters = pgTable('traffic_chp_centers', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  
  // Center identification
  centerId: varchar('center_id', { length: 50 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  
  // Location
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  county: varchar('county', { length: 50 }),
  region: varchar('region', { length: 50 }),
  state: varchar('state', { length: 2 }).default('CA'),
  zipCode: varchar('zip_code', { length: 10 }),
  
  // Center specifics
  type: varchar('type', { length: 50 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  
  // Metadata
  isActive: boolean('is_active').default(true),
  config: jsonb('config').default({}),
  
  // ✅ Metadata - database-managed
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (table) => ({
  centerIdIdx: uniqueIndex('idx_traffic_chp_center_id').on(table.centerId),
  countyIdx: index('idx_traffic_chp_center_county').on(table.county),
  regionIdx: index('idx_traffic_chp_center_region').on(table.region),
  activeIdx: index('idx_traffic_chp_center_active').on(table.isActive),
}));

// ============================================
// 9. traffic_caltrans_districts - Caltrans Districts
// ============================================

export const trafficCaltransDistricts = pgTable('traffic_caltrans_districts', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  
  // District identification
  districtId: varchar('district_id', { length: 50 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  districtNumber: integer('district_number').unique().notNull(),
  
  // Location
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  region: varchar('region', { length: 100 }),
  
  // Contact
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  website: text('website'),
  
  // Metadata
  isActive: boolean('is_active').default(true),
  config: jsonb('config').default({}),
  
  // ✅ Metadata - database-managed
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (table) => ({
  districtIdIdx: uniqueIndex('idx_traffic_caltrans_district_id').on(table.districtId),
  districtNumberIdx: uniqueIndex('idx_traffic_caltrans_district_num').on(table.districtNumber),
  locationIdx: index('idx_traffic_caltrans_district_location').on(table.latitude, table.longitude),
  activeIdx: index('idx_traffic_caltrans_district_active').on(table.isActive),
}));

// ============================================
// 10. traffic_api_request_logs - API Logs
// ============================================

export const trafficApiRequestLogs = pgTable('traffic_api_request_logs', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  
  // Request details
  source: varchar('source', { length: 50 }).notNull(),
  endpoint: text('endpoint'),
  method: varchar('method', { length: 10 }),
  
  // Response
  statusCode: integer('status_code'),
  success: boolean('success').default(false),
  responseTime: integer('response_time'),
  
  // Data
  requestData: jsonb('request_data'),
  responseData: jsonb('response_data'),
  errorMessage: text('error_message'),
  
  // ✅ Date - manually set, needs { mode: 'string' }
  requestedAt: timestamp('requested_at', { mode: 'string' }).defaultNow(),
  
  // ✅ Metadata - database-managed
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (table) => ({
  sourceIdx: index('idx_traffic_api_log_source').on(table.source),
  successIdx: index('idx_traffic_api_log_success').on(table.success),
  requestedAtIdx: index('idx_traffic_api_log_requested_at').on(table.requestedAt),
}));

// ============================================
// RELATIONSHIPS
// ============================================

export const trafficRelations = relations(traffic, ({ one, many }) => ({
  // ✅ User relationship (matches threed and music)
  user: one(user, {
    fields: [traffic.userId],
    references: [user.id],
  }),
  
  // ✅ Project junction (many-to-many via junction table)
  projectTraffics: many(projectTraffic),
  
  // ✅ Project Assets junction (via project_assets)
  projectAssets: many(projectAssets),
  
  // ✅ Child relations (free-standing, linked via project_assets)
  chpCadIncidents: many(trafficChpCadIncidents),
  chpCases: many(trafficChpCases),
  caltransLaneClosures: many(trafficCaltransLaneClosures),
  caltransCctvCameras: many(trafficCaltransCctvCameras),
  bayArea511Events: many(trafficBayArea511Events),
  calfireIncidents: many(trafficCalfireIncidents),
  chpCenters: many(trafficChpCenters),
  caltransDistricts: many(trafficCaltransDistricts),
  apiRequestLogs: many(trafficApiRequestLogs),
}));

// ✅ Relations for child tables
export const trafficChpCadIncidentsRelations = relations(trafficChpCadIncidents, ({ one }) => ({
  center: one(trafficChpCenters, {
    fields: [trafficChpCadIncidents.centerId],
    references: [trafficChpCenters.id],
  }),
}));

export const trafficCaltransLaneClosuresRelations = relations(trafficCaltransLaneClosures, ({ one }) => ({
  district: one(trafficCaltransDistricts, {
    fields: [trafficCaltransLaneClosures.districtId],
    references: [trafficCaltransDistricts.id],
  }),
}));

export const trafficCaltransCctvCamerasRelations = relations(trafficCaltransCctvCameras, ({ one }) => ({
  district: one(trafficCaltransDistricts, {
    fields: [trafficCaltransCctvCameras.districtId],
    references: [trafficCaltransDistricts.id],
  }),
}));