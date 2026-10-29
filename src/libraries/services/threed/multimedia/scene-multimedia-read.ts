import 'server-only';

import { and, asc, eq, or, sql } from 'drizzle-orm';
import { db } from '@/libraries/db/client';
import { projectAssets, projectMultimedia, projectThreed, projectThreedMarkers } from '@/libraries/schema/project';
import { multimedia, multimediaAlbums, multimediaTracks } from '@/libraries/schema/multimedia';
import { threed } from '@/libraries/schema/threed';
import { threedMultimediaAlbums } from '@/libraries/schema/threed/album-associations';
import { readableProject } from '@/libraries/services/project/read-access';
import { publicRecord } from '@/libraries/services/multimedia/access';
import { albumEntityTables } from './album-entity-registry';
import { sceneMultimediaResponseSchema, type SceneMultimediaQuery } from './scene-multimedia-contract';

const markerKinds = {
  models: 'model',
  characters: 'character',
  beds: 'bed',
  farmbots: 'farmbot',
  plantings: 'planting',
} as const;

export class SceneMultimediaReadError extends Error {
  constructor(public readonly status: 404 | 409, message: string) {
    super(message);
  }
}

/** Shared by UI and command revalidation; no write or playback occurs here. */
export async function readSceneMultimedia(query: SceneMultimediaQuery, viewerId?: string) {
  const accessible = await readableProject(query.projectId, viewerId);
  if (!accessible?.userId) throw new SceneMultimediaReadError(404, 'Project not found.');
  const owner = accessible.userId;
  async function placement(markerId: string) {
    const [marker] = await db.select({
      markerType: projectThreedMarkers.markerType,
      sourceAssetId: projectThreedMarkers.sourceAssetId,
      threedId: projectThreedMarkers.threedId,
      data: projectThreedMarkers.data,
    }).from(projectThreedMarkers)
      .innerJoin(projectThreed, and(
        eq(projectThreed.projectId, projectThreedMarkers.projectId),
        eq(projectThreed.threedId, projectThreedMarkers.threedId),
        eq(projectThreed.userId, owner),
        eq(projectThreed.isActive, true),
      ))
      .innerJoin(threed, and(eq(threed.id, projectThreed.threedId), eq(threed.userId, owner), eq(threed.isActive, true)))
      .innerJoin(projectAssets, and(
        eq(projectAssets.projectId, projectThreedMarkers.projectId),
        eq(projectAssets.moduleId, projectThreedMarkers.threedId),
        eq(projectAssets.userId, owner),
        eq(projectAssets.moduleType, 'threed'),
        eq(projectAssets.assetId, projectThreedMarkers.sourceAssetId),
        eq(projectAssets.isActive, true),
        or(...Object.keys(markerKinds).map(kind => and(
          eq(projectThreedMarkers.markerType, kind as keyof typeof markerKinds),
          eq(projectAssets.assetType, `threed_${kind}` as 'threed_models' | 'threed_characters' | 'threed_beds' | 'threed_farmbots' | 'threed_plantings'),
        ))),
      )).where(and(
        eq(projectThreedMarkers.projectId, query.projectId),
        eq(projectThreedMarkers.userId, owner),
        eq(projectThreedMarkers.markerId, markerId),
        eq(projectThreedMarkers.isActive, true),
        eq(projectThreedMarkers.isVisible, true),
      )).limit(1);
    const data = marker?.data as Record<string, unknown> | undefined;
    if (!marker || data?.visible === false || data?.status === 'inactive') throw new SceneMultimediaReadError(404, 'Save this object in the Project before using Multimedia, and check its active assignment.');
    const kind = markerKinds[marker.markerType];
    const entity = sql.identifier(albumEntityTables[kind]);
    const record = await db.execute(sql`SELECT id FROM ${entity} WHERE id = ${marker.sourceAssetId} AND user_id = ${owner} AND is_active = true`);
    if (!record.rows.length) throw new SceneMultimediaReadError(404, 'Source record not found.');
    return {
      ...marker,
      kind
    };
  }
  const marker = await placement(query.markerId);
  if (query.actorMarkerId) {
    const actor = await placement(query.actorMarkerId);
    if (actor.markerType !== 'characters' || actor.threedId !== marker.threedId || (actor.data as { isMovable?: boolean })?.isMovable !== true) {
      throw new SceneMultimediaReadError(409, 'Choose a saved movable Character in the same Project module.');
    }
  }
  const albums = await db.selectDistinct({
    id: multimediaAlbums.id,
    title: multimediaAlbums.title,
    artist: multimediaAlbums.artist,
    coverArt: multimediaAlbums.coverArt,
    userId: multimediaAlbums.userId,
    sortOrder: threedMultimediaAlbums.sortOrder,
  }).from(threedMultimediaAlbums)
    .innerJoin(multimediaAlbums, and(eq(multimediaAlbums.id, threedMultimediaAlbums.albumId), eq(multimediaAlbums.userId, owner)))
    .innerJoin(projectAssets, and(
      eq(projectAssets.projectId, query.projectId),
      eq(projectAssets.userId, owner),
      eq(projectAssets.moduleType, 'multimedia'),
      eq(projectAssets.assetType, 'multimedia_albums'),
      eq(projectAssets.assetId, multimediaAlbums.id),
      eq(projectAssets.isActive, true),
    ))
    .innerJoin(projectMultimedia, and(
      eq(projectMultimedia.projectId, query.projectId),
      eq(projectMultimedia.multimediaId, projectAssets.moduleId),
      eq(projectMultimedia.userId, owner),
      eq(projectMultimedia.isActive, true),
    ))
    .innerJoin(multimedia, and(eq(multimedia.id, projectMultimedia.multimediaId), eq(multimedia.userId, owner), eq(multimedia.isActive, true)))
    .where(and(
      eq(threedMultimediaAlbums.moduleType, marker.kind),
      eq(threedMultimediaAlbums.entityId, String(marker.sourceAssetId)),
      viewerId === owner ? undefined : and(eq(multimediaAlbums.isPublic, true), eq(multimediaAlbums.status, 'published')),
    )).orderBy(asc(threedMultimediaAlbums.sortOrder), asc(multimediaAlbums.id)).limit(101);
  if (albums.length > 100) throw new SceneMultimediaReadError(409, 'Too many Album assignments; review the saved relationships.');
  if (query.albumId && !albums.some(album => album.id === query.albumId)) throw new SceneMultimediaReadError(404, 'Album is not available for this object in this Project.');
  let offset = query.offset;
  if (query.trackId) {
    if (!query.albumId) throw new SceneMultimediaReadError(404, 'Choose an Album.');
    const rank = await db.execute(sql`SELECT position FROM (
      SELECT id, row_number() OVER (ORDER BY track_number ASC NULLS LAST, id) - 1 AS position
      FROM multimedia_tracks WHERE album_id = ${query.albumId} AND user_id = ${owner} AND status = 'active'
    ) AS ranked WHERE id = ${query.trackId} LIMIT 1`);
    const position = Number(rank.rows[0]?.position);
    if (!Number.isSafeInteger(position) || position < 0 || position > 1_000_000) throw new SceneMultimediaReadError(404, 'Track is not available in this Album.');
    offset = Math.floor(position / 50) * 50;
  }
  const tracks = query.albumId ? await db.select({
    id: multimediaTracks.id,
    albumId: multimediaTracks.albumId,
    title: multimediaTracks.title,
    fileUrl: multimediaTracks.fileUrl,
    fileType: multimediaTracks.fileType,
    duration: multimediaTracks.duration,
    trackNumber: multimediaTracks.trackNumber,
    userId: multimediaTracks.userId,
  }).from(multimediaTracks).where(and(
    eq(multimediaTracks.albumId, query.albumId),
    eq(multimediaTracks.userId, owner),
    eq(multimediaTracks.status, 'active'),
  )).orderBy(asc(multimediaTracks.trackNumber), asc(multimediaTracks.id)).limit(51).offset(offset) : [];
  const safeTracks = tracks.slice(0, 50).map(track => publicRecord('track', track)).filter(track => {
    if (typeof track.fileUrl !== 'string' || !track.fileUrl) return false;
    try { return ['https:', 'http:'].includes(new URL(track.fileUrl, 'https://threed.invalid').protocol); } catch { return false; }
  });
  return sceneMultimediaResponseSchema.parse({
    projectId: query.projectId,
    markerId: query.markerId,
    sourceType: marker.kind,
    sourceId: marker.sourceAssetId,
    albums: albums.map(album => publicRecord('album', album)),
    albumId: query.albumId,
    tracks: safeTracks,
    offset,
    hasMore: tracks.length > 50,
  });
}
