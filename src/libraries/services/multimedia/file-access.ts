import { and, eq } from 'drizzle-orm';
import { db } from '@/libraries/db/client';
import { multimediaAlbums as albums, multimediaTracks as tracks, multimediaMedia as media } from '@/libraries/schema/multimedia';
import { publicAlbumScope, publicTrackScope } from './authority';
import { ownsMediaKey } from './upload-policy';

// An exact published content reference grants a read of one object, never a prefix.
export async function isPublicMediaKey(key: string) {
  const fileUrl = `/api/multimedia/files?key=${encodeURIComponent(key)}`;
  const [album] = await db.select({ userId: albums.userId }).from(albums)
    .where(and(eq(albums.coverArt, fileUrl), publicAlbumScope())).limit(1);
  if (album?.userId && ownsMediaKey(album.userId, key)) return true;
  const [track] = await db.select({ userId: tracks.userId }).from(tracks)
    .where(and(eq(tracks.fileUrl, fileUrl), publicTrackScope())).limit(1);
  if (track?.userId && ownsMediaKey(track.userId, key)) return true;
  const [item] = await db.select({ userId: media.userId }).from(media).innerJoin(albums, eq(media.albumId, albums.id))
    .where(and(eq(media.fileUrl, fileUrl), eq(media.userId, albums.userId), publicAlbumScope())).limit(1);
  return Boolean(item?.userId && ownsMediaKey(item.userId, key));
}
