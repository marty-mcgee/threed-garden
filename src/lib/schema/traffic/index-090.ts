// lib/schema/traffic/index.ts
import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  serial,
  index,
  uniqueIndex,
  integer,
  decimal,
  varchar,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from '../auth';
import { projectAssets } from '../project';

// ============================================
// ENUMS
// ============================================

export const incidentStatusEnum = pgEnum('incident_status', [
  'active',
  'cleared',
  'pending',
  'closed',
]);

export const closureStatusEnum = pgEnum('closure_status', [
  'active',
  'cleared',
  'planned',
  'cancelled',
]);

export const eventTypeEnum = pgEnum('event_type', [
  'accident',
  'hazard',
  'weather',
  'construction',
  'special_event',
  'other',
]);

// ============================================
// 1. traffic - Main Traffic Module Table
// ============================================

export const traffic = pgTable(
  'traffic',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),

    name: text('name').notNull(),
    description: text('description'),
    slug: text('slug').unique().notNull(),

    // Configuration
    config: jsonb('config').default({}),
    isActive: boolean('is_active').default(true),
    isPublic: boolean('is_public').default(false),

    // Module settings
    settings: jsonb('settings').default({}),
    refreshInterval: integer('refresh_interval').default(60), // seconds

    // Timestamps
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_traffic_user_id').on(table.userId),
    slugIdx: uniqueIndex('idx_traffic_slug').on(table.slug),
    activeIdx: index('idx_traffic_active').on(table.isActive),
  })
);

// ============================================
// 2. traffic_chp_cad_incidents - Live CHP Incidents
// ============================================

export const trafficChpCadIncidents = pgTable(
  'traffic_chp_cad_incidents',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),

    // CHP specific fields
    incidentId: varchar('incident_id', { length: 50 }).unique().notNull(),
    logNumber: varchar('log_number', { length: 50 }),
    cadNumber: varchar('cad_number', { length: 50 }),

    // Incident details
    type: text('type').notNull(),
    subtype: text('subtype'),
    status: incidentStatusEnum('status').default('active'),
    priority: varchar('priority', { length: 10 }),

    // Location
    location: text('location').notNull(),
    city: text('city'),
    county: text('county'),
    state: varchar('state', { length: 2 }).default('CA'),
    latitude: decimal('latitude', { precision: 10, scale: 7 }),
    longitude: decimal('longitude', { precision: 10, scale: 7 }),

    // CHP specific data
    chpUnit: text('chp_unit'),
    respondingUnits: jsonb('responding_units').default([]),
    logText: text('log_text'),
    rawData: jsonb('raw_data'),

    // Timestamps
    reportedAt: timestamp('reported_at', { mode: 'string' }).notNull(),
    clearedAt: timestamp('cleared_at', { mode: 'string' }),
    lastUpdated: timestamp('last_updated', { mode: 'string' }).notNull(),

    // Metadata
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    incidentIdIdx: uniqueIndex('idx_chp_cad_incident_id').on(table.incidentId),
    statusIdx: index('idx_chp_cad_status').on(table.status),
    locationIdx: index('idx_chp_cad_location').on(table.location),
    countyIdx: index('idx_chp_cad_county').on(table.county),
    reportedAtIdx: index('idx_chp_cad_reported_at').on(table.reportedAt),
    activeIdx: index('idx_chp_cad_active').on(table.isActive),
    compositeIdx: index('idx_chp_cad_composite').on(
      table.status,
      table.county,
      table.isActive
    ),
  })
);

// ============================================
// 3. traffic_chp_cases - Historical Collisions
// ============================================

export const trafficChpCases = pgTable(
  'traffic_chp_cases',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),

    // Case identifiers
    caseId: varchar('case_id', { length: 50 }).unique().notNull(),
    logNumber: varchar('log_number', { length: 50 }),
    collisionNumber: varchar('collision_number', { length: 50 }),

    // Incident details
    type: text('type').notNull(),
    severity: varchar('severity', { length: 20 }),
    status: incidentStatusEnum('status').default('closed'),

    // Location
    location: text('location').notNull(),
    city: text('city'),
    county: text('county'),
    state: varchar('state', { length: 2 }).default('CA'),
    latitude: decimal('latitude', { precision: 10, scale: 7 }),
    longitude: decimal('longitude', { precision: 10, scale: 7 }),

    // Collision data
    collisionType: text('collision_type'),
    weatherConditions: text('weather_conditions'),
    roadConditions: text('road_conditions'),
    lightingConditions: text('lighting_conditions'),

    // Statistics
    injuries: integer('injuries').default(0),
    fatalities: integer('fatalities').default(0),
    vehiclesInvolved: integer('vehicles_involved').default(0),
    partiesInvolved: integer('parties_involved').default(0),

    // Data source
    rawData: jsonb('raw_data'),
    source: varchar('source', { length: 50 }).default('ckan'),

    // Timestamps
    occurredAt: timestamp('occurred_at', { mode: 'string' }).notNull(),
    reportedAt: timestamp('reported_at', { mode: 'string' }),
    lastUpdated: timestamp('last_updated', { mode: 'string' }),

    // Metadata
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    caseIdIdx: uniqueIndex('idx_chp_cases_case_id').on(table.caseId),
    countyIdx: index('idx_chp_cases_county').on(table.county),
    occurredAtIdx: index('idx_chp_cases_occurred_at').on(table.occurredAt),
    severityIdx: index('idx_chp_cases_severity').on(table.severity),
    activeIdx: index('idx_chp_cases_active').on(table.isActive),
  })
);

// ============================================
// 4. traffic_caltrans_lane_closures - Caltrans Closures
// ============================================

export const trafficCaltransLaneClosures = pgTable(
  'traffic_caltrans_lane_closures',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),

    // Closure identifiers
    closureId: varchar('closure_id', { length: 50 }).unique().notNull(),
    district: varchar('district', { length: 10 }),
    route: varchar('route', { length: 20 }),

    // Closure details
    type: text('type').notNull(),
    status: closureStatusEnum('status').default('active'),
    description: text('description'),
    location: text('location').notNull(),
    county: text('county'),

    // Coordinates
    latitude: decimal('latitude', { precision: 10, scale: 7 }),
    longitude: decimal('longitude', { precision: 10, scale: 7 }),
    startLatitude: decimal('start_latitude', { precision: 10, scale: 7 }),
    startLongitude: decimal('start_longitude', { precision: 10, scale: 7 }),
    endLatitude: decimal('end_latitude', { precision: 10, scale: 7 }),
    endLongitude: decimal('end_longitude', { precision: 10, scale: 7 }),

    // Timing
    startDate: timestamp('start_date', { mode: 'string' }).notNull(),
    endDate: timestamp('end_date', { mode: 'string' }),
    expectedEndDate: timestamp('expected_end_date', { mode: 'string' }),

    // Closure details
    lanesClosed: jsonb('lanes_closed').default([]),
    impact: text('impact'),
    detour: text('detour'),

    // Data source
    rawData: jsonb('raw_data'),
    source: varchar('source', { length: 50 }).default('cwwp2'),

    // Metadata
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    closureIdIdx: uniqueIndex('idx_caltrans_closure_id').on(table.closureId),
    districtIdx: index('idx_caltrans_closure_district').on(table.district),
    routeIdx: index('idx_caltrans_closure_route').on(table.route),
    countyIdx: index('idx_caltrans_closure_county').on(table.county),
    statusIdx: index('idx_caltrans_closure_status').on(table.status),
    startDateIdx: index('idx_caltrans_closure_start_date').on(table.startDate),
    activeIdx: index('idx_caltrans_closure_active').on(table.isActive),
    compositeIdx: index('idx_caltrans_closure_composite').on(
      table.status,
      table.district,
      table.isActive
    ),
  })
);

// ============================================
// 5. traffic_bay_area_511_events - 511 Events
// ============================================

export const trafficBayArea511Events = pgTable(
  'traffic_bay_area_511_events',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),

    // Event identifiers
    eventId: varchar('event_id', { length: 50 }).unique().notNull(),
    eventType: eventTypeEnum('event_type').notNull(),

    // Event details
    title: text('title').notNull(),
    description: text('description'),
    severity: varchar('severity', { length: 20 }),
    status: incidentStatusEnum('status').default('active'),

    // Location
    location: text('location').notNull(),
    city: text('city'),
    county: text('county'),
    latitude: decimal('latitude', { precision: 10, scale: 7 }),
    longitude: decimal('longitude', { precision: 10, scale: 7 }),

    // Road/Highway info
    route: text('route'),
    direction: text('direction'),
    milepost: decimal('milepost', { precision: 8, scale: 2 }),
    area: text('area'),

    // Event data
    affectedRoads: jsonb('affected_roads').default([]),
    impact: text('impact'),
    advice: text('advice'),

    // Data source
    rawData: jsonb('raw_data'),
    source: varchar('source', { length: 50 }).default('511'),

    // Timestamps
    occurredAt: timestamp('occurred_at', { mode: 'string' }).notNull(),
    clearedAt: timestamp('cleared_at', { mode: 'string' }),
    lastUpdated: timestamp('last_updated', { mode: 'string' }),

    // Metadata
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    eventIdIdx: uniqueIndex('idx_511_event_id').on(table.eventId),
    eventTypeIdx: index('idx_511_event_type').on(table.eventType),
    countyIdx: index('idx_511_county').on(table.county),
    statusIdx: index('idx_511_status').on(table.status),
    occurredAtIdx: index('idx_511_occurred_at').on(table.occurredAt),
    activeIdx: index('idx_511_active').on(table.isActive),
  })
);

// ============================================
// 6. traffic_calfire_incidents - CalFire Incidents
// ============================================

export const trafficCalfireIncidents = pgTable(
  'traffic_calfire_incidents',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),

    // Incident identifiers
    incidentId: varchar('incident_id', { length: 50 }).unique().notNull(),
    incidentName: text('incident_name').notNull(),
    incidentType: text('incident_type'),

    // Incident details
    status: incidentStatusEnum('status').default('active'),
    severity: varchar('severity', { length: 20 }),
    description: text('description'),

    // Location
    location: text('location').notNull(),
    county: text('county'),
    state: varchar('state', { length: 2 }).default('CA'),
    latitude: decimal('latitude', { precision: 10, scale: 7 }),
    longitude: decimal('longitude', { precision: 10, scale: 7 }),

    // Fire data
    fireSize: decimal('fire_size', { precision: 10, scale: 1 }),
    fireSizeUnit: varchar('fire_size_unit', { length: 10 }).default('acres'),
    containment: integer('containment'), // percentage
    cause: text('cause'),

    // Resources
    personnel: integer('personnel'),
    engines: integer('engines'),
    dozers: integer('dozers'),
    aircraft: integer('aircraft'),
    crews: integer('crews'),

    // Data source
    rawData: jsonb('raw_data'),
    source: varchar('source', { length: 50 }).default('calfire'),

    // Timestamps
    startedAt: timestamp('started_at', { mode: 'string' }).notNull(),
    containedAt: timestamp('contained_at', { mode: 'string' }),
    lastUpdated: timestamp('last_updated', { mode: 'string' }).notNull(),

    // Metadata
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    incidentIdIdx: uniqueIndex('idx_calfire_incident_id').on(table.incidentId),
    statusIdx: index('idx_calfire_status').on(table.status),
    countyIdx: index('idx_calfire_county').on(table.county),
    startedAtIdx: index('idx_calfire_started_at').on(table.startedAt),
    activeIdx: index('idx_calfire_active').on(table.isActive),
  })
);

// ============================================
// 7. traffic_caltrans_cctv_cameras - Caltrans Traffic Cameras
// ============================================

export const trafficCaltransCctvCameras = pgTable(
  'traffic_caltrans_cctv_cameras',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),

    // Camera identifiers
    cameraId: varchar('camera_id', { length: 50 }).unique().notNull(),
    name: text('name').notNull(),

    // Location
    location: text('location').notNull(),
    city: text('city'),
    county: text('county'),
    state: varchar('state', { length: 2 }).default('CA'),
    latitude: decimal('latitude', { precision: 10, scale: 7 }).notNull(),
    longitude: decimal('longitude', { precision: 10, scale: 7 }).notNull(),

    // Camera details
    cameraType: text('camera_type'),
    status: varchar('status', { length: 20 }).default('active'),
    direction: text('direction'),
    route: text('route'),
    milepost: decimal('milepost', { precision: 8, scale: 2 }),

    // URLs
    imageUrl: text('image_url'),
    streamUrl: text('stream_url'),
    thumbnailUrl: text('thumbnail_url'),

    // Metadata
    metadata: jsonb('metadata').default({}),
    rawData: jsonb('raw_data'),

    // Timestamps
    lastImageUpdate: timestamp('last_image_update', { mode: 'string' }),
    lastStatusUpdate: timestamp('last_status_update', { mode: 'string' }),

    // Metadata
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    cameraIdIdx: uniqueIndex('idx_cctv_camera_id').on(table.cameraId),
    countyIdx: index('idx_cctv_county').on(table.county),
    statusIdx: index('idx_cctv_status').on(table.status),
    activeIdx: index('idx_cctv_active').on(table.isActive),
  })
);

// ============================================
// 8. traffic_chp_cad_centers - CHP Centers
// ============================================

export const trafficChpCadCenters = pgTable(
  'traffic_chp_cad_centers',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),

    // Center identifiers
    centerId: varchar('center_id', { length: 50 }).unique().notNull(),
    name: text('name').notNull(),
    code: varchar('code', { length: 20 }),

    // Location
    city: text('city'),
    county: text('county'),
    state: varchar('state', { length: 2 }).default('CA'),
    latitude: decimal('latitude', { precision: 10, scale: 7 }),
    longitude: decimal('longitude', { precision: 10, scale: 7 }),

    // Contact info
    phone: text('phone'),
    address: text('address'),
    website: text('website'),

    // Configuration
    // settings: jsonb('settings').default({}),
    isActive: boolean('is_active').default(true),
    rawData: jsonb('raw_data'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    centerIdIdx: uniqueIndex('idx_chp_center_id').on(table.centerId),
    countyIdx: index('idx_chp_center_county').on(table.county),
    activeIdx: index('idx_chp_center_active').on(table.isActive),
  })
);

// ============================================
// 9. traffic_caltrans_districts - Caltrans Districts
// ============================================

export const trafficCaltransDistricts = pgTable(
  'traffic_caltrans_districts',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),

    // District identifiers
    districtId: varchar('district_id', { length: 20 }).unique().notNull(),
    name: text('name').notNull(),
    number: integer('number').unique(),

    // Region
    region: text('region'),
    counties: jsonb('counties').default([]),

    // Contact
    phone: text('phone'),
    email: text('email'),
    address: text('address'),
    website: text('website'),

    // Configuration
    // settings: jsonb('settings').default({}),
    isActive: boolean('is_active').default(true),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    districtIdIdx: uniqueIndex('idx_caltrans_district_id').on(table.districtId),
    numberIdx: uniqueIndex('idx_caltrans_district_number').on(table.number),
    activeIdx: index('idx_caltrans_district_active').on(table.isActive),
  })
);

// ============================================
// 10. traffic_api_request_logs - API Logs
// ============================================

export const trafficApiRequestLogs = pgTable(
  'traffic_api_request_logs',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),

    // Request details
    endpoint: text('endpoint').notNull(),
    // method: varchar('method', { length: 10 }).notNull(),
    statusCode: integer('status_code'),

    // Timing
    durationMs: integer('duration_ms'),

    // Data
    requestData: jsonb('request_data'),
    responseData: jsonb('response_data'),
    error: text('error'),

    // Metadata
    source: varchar('source', { length: 50 }),
    isSuccess: boolean('is_success').default(true),

    // Timestamps
    loggedAt: timestamp('logged_at', { mode: 'string' }).defaultNow(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    endpointIdx: index('idx_api_logs_endpoint').on(table.endpoint),
    loggedAtIdx: index('idx_api_logs_logged_at').on(table.loggedAt),
    isSuccessIdx: index('idx_api_logs_success').on(table.isSuccess),
  })
);

// ============================================
// RELATIONS
// ============================================

export const trafficRelations = relations(traffic, ({ many }) => ({
  projectAssets: many(projectAssets),
}));

export const trafficChpCadIncidentsRelations = relations(
  trafficChpCadIncidents,
  ({ one }) => ({
    user: one(user, {
      fields: [trafficChpCadIncidents.userId],
      references: [user.id],
    }),
  })
);

export const trafficChpCasesRelations = relations(trafficChpCases, ({ one }) => ({
  user: one(user, {
    fields: [trafficChpCases.userId],
    references: [user.id],
  }),
}));

export const trafficCaltransLaneClosuresRelations = relations(
  trafficCaltransLaneClosures,
  ({ one }) => ({
    user: one(user, {
      fields: [trafficCaltransLaneClosures.userId],
      references: [user.id],
    }),
  })
);

export const trafficBayArea511EventsRelations = relations(
  trafficBayArea511Events,
  ({ one }) => ({
    user: one(user, {
      fields: [trafficBayArea511Events.userId],
      references: [user.id],
    }),
  })
);

export const trafficCalfireIncidentsRelations = relations(
  trafficCalfireIncidents,
  ({ one }) => ({
    user: one(user, {
      fields: [trafficCalfireIncidents.userId],
      references: [user.id],
    }),
  })
);

export const trafficCaltransCctvCamerasRelations = relations(
  trafficCaltransCctvCameras,
  ({ one }) => ({
    user: one(user, {
      fields: [trafficCaltransCctvCameras.userId],
      references: [user.id],
    }),
  })
);

export const trafficChpCadCentersRelations = relations(
  trafficChpCadCenters,
  ({ one }) => ({
    user: one(user, {
      fields: [trafficChpCadCenters.userId],
      references: [user.id],
    }),
  })
);

export const trafficCaltransDistrictsRelations = relations(
  trafficCaltransDistricts,
  ({ one }) => ({
    user: one(user, {
      fields: [trafficCaltransDistricts.userId],
      references: [user.id],
    }),
  })
);

export const trafficApiRequestLogsRelations = relations(
  trafficApiRequestLogs,
  ({ one }) => ({
    user: one(user, {
      fields: [trafficApiRequestLogs.userId],
      references: [user.id],
    }),
  })
);