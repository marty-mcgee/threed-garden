import 'server-only';
import { sql } from 'drizzle-orm';
import { db } from '@/libraries/db/client';
import {
  albumEntityKind,
  parseAlbumEntityId,
  type AlbumEntityId,
  albumRevision,
  AlbumAssociationError,
  replaceAlbumAssignments,
  type AlbumAssignment,
  type AlbumEntityKind,
} from './album-association-contract';

import { albumEntityTables } from './album-entity-registry';

function identifiers(kind: AlbumEntityKind, entityId: AlbumEntityId, userId: string) {
  const table = albumEntityTables[albumEntityKind.parse(kind)];
  parseAlbumEntityId(kind, entityId);
  if (!userId) throw new AlbumAssociationError(404, 'Entity not found.');
  return {
    entity: sql.identifier(table),
    junction: sql.identifier('threed_multimedia_albums'),
  };
}

export async function readEntityAlbums(userId: string, kind: AlbumEntityKind, entityId: AlbumEntityId) {
  const { entity, junction } = identifiers(kind, entityId, userId);
  return db.transaction(async tx => {
    const ownership = sql`user_id = ${userId}`;
    const albumOwnership = sql`a.user_id = ${userId}`;
    const owned = await tx.execute(sql`SELECT id, COALESCE(to_jsonb(${entity})->>'name', to_jsonb(${entity})->>'model_name', to_jsonb(${entity})->>'common_name', to_jsonb(${entity})->>'title', to_jsonb(${entity})->>'file_name') AS name FROM ${entity} WHERE id = ${entityId} AND ${ownership} FOR SHARE`);
    if (!owned.rows.length) throw new AlbumAssociationError(404, 'Entity not found.');
    const result = await tx.execute(sql`SELECT album_id AS "albumId", sort_order AS "sortOrder"
      , (SELECT title FROM multimedia_albums a WHERE a.id = album_id AND ${albumOwnership}) AS title
      FROM ${junction} WHERE module_type = ${kind} AND entity_id = ${entityId} ORDER BY sort_order, album_id LIMIT 101`);
    if (result.rows.length > 100) throw new AlbumAssociationError(409, 'Too many assignments; no partial replacement is allowed.');
    const assignments = result.rows.map(row => ({
      albumId: Number(row.albumId),
      sortOrder: Number(row.sortOrder),
    }));
    // Return only authorized display names; writes still accept identifiers and Sort Order only.
    return {
      albumTitles: Object.fromEntries(result.rows.filter(row => typeof row.title === 'string').map(row => [String(row.albumId), row.title])),
      entityName: owned.rows[0].name ?? `${kind} #${entityId}`,
      assignments,
      revision: albumRevision(assignments),
    };
  });
}

export async function saveEntityAlbums(userId: string, kind: AlbumEntityKind, entityId: AlbumEntityId, input: unknown) {
  const { entity, junction } = identifiers(kind, entityId, userId);
  return db.transaction(tx => replaceAlbumAssignments({
    lockEntity: async () => {
      const ownership = sql`user_id = ${userId}`;
      const result = await tx.execute(sql`SELECT id FROM ${entity} WHERE id = ${entityId} AND ${ownership} FOR UPDATE`);
      return result.rows.length === 1;
    },
    read: async () => {
      const result = await tx.execute(sql`SELECT album_id AS "albumId", sort_order AS "sortOrder"
        FROM ${junction} WHERE module_type = ${kind} AND entity_id = ${entityId} ORDER BY album_id LIMIT 101`);
      if (result.rows.length > 100) throw new AlbumAssociationError(409, 'Too many assignments; no partial replacement is allowed.');
      return result.rows as AlbumAssignment[];
    },
    lockAlbums: async ids => {
      if (!ids.length) return [];
      const ownership = sql`user_id = ${userId}`;
      const result = await tx.execute(sql`SELECT id FROM multimedia_albums
        WHERE ${ownership} AND id IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})
        ORDER BY id FOR SHARE`);
      return result.rows.map(row => Number(row.id));
    },
    remove: async ids => {
      if (ids.length) await tx.execute(sql`DELETE FROM ${junction} WHERE module_type = ${kind} AND entity_id = ${entityId}
        AND album_id IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`);
    },
    put: async item => {
      await tx.execute(sql`INSERT INTO ${junction} (module_type, entity_id, album_id, sort_order)
        VALUES (${kind}, ${entityId}, ${item.albumId}, ${item.sortOrder})
        ON CONFLICT (module_type, entity_id, album_id) DO UPDATE
        SET sort_order = EXCLUDED.sort_order, updated_at = CURRENT_TIMESTAMP`);
    },
  }, input));
}
