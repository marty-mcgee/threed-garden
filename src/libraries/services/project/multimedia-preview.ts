import 'server-only';

import { and, asc, eq, sql } from 'drizzle-orm';
import { db } from '@/libraries/db/client';
import { projectAssets, projectMultimedia } from '@/libraries/schema/project';
import { multimedia, multimediaAlbums, multimediaTracks } from '@/libraries/schema/multimedia';
import { readableProject } from './read-access';
import { publicRecord } from '@/libraries/services/multimedia/access';
import { projectMultimediaPreviewSchema, type ProjectMultimediaPreviewQuery } from './multimedia-preview-contract';

export class ProjectMultimediaPreviewError extends Error {
  readonly status = 404;
}

/** Project asset membership is sufficient; no Model/marker relationship is consulted. */
export async function readProjectMultimediaPreview(query: ProjectMultimediaPreviewQuery, viewerId?: string) {
  const accessible = await readableProject(query.projectId, viewerId);
  if (!accessible?.userId) throw new ProjectMultimediaPreviewError('Project not found.');
  const owner = accessible.userId;
  const albums = await db.selectDistinct({
    id: multimediaAlbums.id,
    title: multimediaAlbums.title,
    artist: multimediaAlbums.artist,
    coverArt: multimediaAlbums.coverArt,
    userId: multimediaAlbums.userId,
  }).from(projectAssets)
    .innerJoin(projectMultimedia, and(
      eq(projectMultimedia.projectId, projectAssets.projectId),
      eq(projectMultimedia.multimediaId, projectAssets.moduleId),
      eq(projectMultimedia.userId, owner),
      eq(projectMultimedia.isActive, true),
    ))
    .innerJoin(multimedia, and(
      eq(multimedia.id, projectMultimedia.multimediaId),
      eq(multimedia.userId, owner),
      eq(multimedia.isActive, true),
    ))
    .innerJoin(multimediaAlbums, and(
      eq(multimediaAlbums.id, projectAssets.assetId),
      eq(multimediaAlbums.userId, owner),
    ))
    .where(and(
      eq(projectAssets.projectId, accessible.id),
      eq(projectAssets.userId, owner),
      eq(projectAssets.moduleType, 'multimedia'),
      eq(projectAssets.assetType, 'multimedia_albums'),
      eq(projectAssets.isActive, true),
      eq(multimediaAlbums.id, query.albumId),
      viewerId === owner ? undefined : and(eq(multimediaAlbums.isPublic, true), eq(multimediaAlbums.status, 'published')),
    )).limit(1);
  if (!albums.length) throw new ProjectMultimediaPreviewError('Album is not available in this Project.');
  let offset = query.offset;
  if (query.trackId) {
    const rank = await db.execute(sql`SELECT position FROM (
      SELECT id, row_number() OVER (ORDER BY track_number ASC NULLS LAST, id) - 1 AS position
      FROM multimedia_tracks WHERE album_id = ${query.albumId} AND user_id = ${owner} AND status = 'active'
    ) AS ranked WHERE id = ${query.trackId} LIMIT 1`);
    const position = Number(rank.rows[0]?.position);
    if (!Number.isSafeInteger(position) || position < 0 || position > 1_000_000) throw new ProjectMultimediaPreviewError('Track is not available in this Album.');
    offset = Math.floor(position / 50) * 50;
  }
  const tracks = await db.select({
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
  )).orderBy(asc(multimediaTracks.trackNumber), asc(multimediaTracks.id)).limit(51).offset(offset);
  return projectMultimediaPreviewSchema.parse({
    projectId: query.projectId,
    albumId: query.albumId,
    albums: albums.map(album => publicRecord('album', album)),
    tracks: tracks.slice(0, 50).map(track => publicRecord('track', track)).filter(track => {
      if (typeof track.fileUrl !== 'string' || !track.fileUrl) return false;
      try { return ['https:', 'http:'].includes(new URL(track.fileUrl, 'https://threed.invalid').protocol); } catch { return false; }
    }),
    offset,
    hasMore: tracks.length > 50,
  });
}
