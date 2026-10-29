import { pgTable, serial, integer, text, timestamp, uniqueIndex, index, check } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { multimediaAlbums } from '../multimedia';
import type { AlbumModuleType } from '@/libraries/services/threed/multimedia/album-entity-registry';

export const threedMultimediaAlbums = pgTable('threed_multimedia_albums', {
  id: serial('id').primaryKey(),
  moduleType: text('module_type').$type<AlbumModuleType>().notNull(),
  entityId: text('entity_id').notNull(),
  albumId: integer('album_id').notNull().references(() => multimediaAlbums.id, {
    onDelete: 'cascade',
  }),
  sortOrder: integer('sort_order').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, table => [
  uniqueIndex('threed_multimedia_albums_pair').on(table.moduleType, table.entityId, table.albumId),
  index('threed_multimedia_albums_album').on(table.albumId),
  check('threed_multimedia_albums_type', sql`${table.moduleType} IN ('model', 'character', 'plant', 'planting', 'bed', 'farmbot', 'scenario', 'simulation', 'design', 'layer', 'task', 'harvest', 'watering', 'model_file', 'model_category', 'texture', 'ground_map', 'animation', 'animation_file', 'animation_category', 'animation_slot', 'animation_preset', 'assembly')`),
  check('threed_multimedia_albums_entity', sql`CASE
    WHEN ${table.moduleType} = 'assembly' THEN ${table.entityId} ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    WHEN ${table.entityId} ~ '^[1-9][0-9]{0,9}$' THEN ${table.entityId}::bigint <= 2147483647
    ELSE false END`),
  check('threed_multimedia_albums_sort', sql`${table.sortOrder} BETWEEN -10000 AND 10000`),
]);

export const threedMultimediaAlbumsRelations = relations(threedMultimediaAlbums, ({ one }) => ({
  album: one(multimediaAlbums, {
    fields: [threedMultimediaAlbums.albumId],
    references: [multimediaAlbums.id],
  }),
}));
