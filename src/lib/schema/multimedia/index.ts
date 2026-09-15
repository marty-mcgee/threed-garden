import { sql } from 'drizzle-orm';
import {
  pgTable, serial, text, varchar, integer, jsonb, timestamp, uuid,
  index, unique, uniqueIndex, check, foreignKey,
  type PgTableExtraConfigValue,
} from 'drizzle-orm/pg-core';
import { user } from '../auth';
import { musicTracks } from '../music';

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
  trackId: integer('track_id').references(() => musicTracks.id, { onDelete: 'set null' }),
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
