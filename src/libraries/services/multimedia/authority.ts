import { and, eq, isNotNull, sql } from 'drizzle-orm';
import { db, type Transaction } from '@/libraries/db/client';
import { multimediaAlbums as albums, multimediaTracks as tracks, multimediaMedia as media } from '@/libraries/schema/multimedia';
import { positiveId } from './access';

export const publicAlbumScope = () => and(isNotNull(albums.userId), eq(albums.isPublic, true), eq(albums.status, 'published'));
export const publicMediaScope = () => and(eq(media.isPublic, true), eq(media.isActive, true));
export const publicTrackScope = () => and(eq(tracks.status, 'active'), sql`EXISTS (
  SELECT 1 FROM ${albums} WHERE ${albums.id} = ${tracks.albumId}
  AND ${albums.userId} = ${tracks.userId} AND ${albums.isPublic} = true AND ${albums.status} = 'published'
)`);

export async function ownedParents(userId: string, albumValue: unknown, trackValue: unknown, tx?: Transaction) {
  const connection = tx ?? db;
  const albumId = albumValue === null || albumValue === undefined || albumValue === '' ? null : positiveId(albumValue);
  const trackId = trackValue === null || trackValue === undefined || trackValue === '' ? null : positiveId(trackValue);
  const supplied = (value: unknown) => value !== null && value !== undefined && value !== '';
  if ((supplied(albumValue) && !albumId) || (supplied(trackValue) && !trackId)) return null;
  if (albumId) {
    const query = connection.select({ id: albums.id }).from(albums).where(and(eq(albums.id, albumId), eq(albums.userId, userId))).limit(1);
    const [album] = await (tx ? query.for('share') : query);
    if (!album) return null;
  }
  if (trackId) {
    // Link writes hold this lock until commit; Track moves lock the same row
    // for update before checking dependent Links.
    const query = connection.select({ albumId: tracks.albumId }).from(tracks).where(and(eq(tracks.id, trackId), eq(tracks.userId, userId))).limit(1);
    const [track] = await (tx ? query.for('share') : query);
    if (!track || (albumId && track.albumId !== albumId)) return null;
    if (track.albumId) {
      const query = connection.select({ id: albums.id }).from(albums).where(and(eq(albums.id, track.albumId), eq(albums.userId, userId))).limit(1);
      const [parent] = await (tx ? query.for('share') : query);
      if (!parent) return null;
    }
  }
  return { albumId, trackId };
}
