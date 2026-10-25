import { and, asc, eq, exists, inArray, or, sql } from 'drizzle-orm';
import type { db as database } from '@/libraries/db/client';
import {
  multimediaAlbums as albums,
  multimediaTracks as tracks,
  multimediaLyrics as lyrics,
  multimediaLyricsAlbums as albumAssignments,
  multimediaLyricsTracks as trackAssignments,
} from '@/libraries/schema/multimedia';
import { publicAlbumScope, publicTrackScope } from './authority';

export class PublicLyricsAlbumNotFound extends Error {}

export function publicLyricsService(db: typeof database) {
  async function forAlbum(albumId: number, offset: number) {
    const [album] = await db.select({ id: albums.id }).from(albums)
      .where(and(eq(albums.id, albumId), publicAlbumScope())).limit(1);
    if (!album) throw new PublicLyricsAlbumNotFound();

    const assignedToAlbum = exists(db.select({ one: sql`1` }).from(albumAssignments)
      .where(and(eq(albumAssignments.lyricsId, lyrics.id), eq(albumAssignments.albumId, albums.id))));
    const assignedToTrack = exists(db.select({ one: sql`1` }).from(trackAssignments)
      .innerJoin(tracks, eq(tracks.id, trackAssignments.trackId))
      .where(and(eq(trackAssignments.lyricsId, lyrics.id), eq(tracks.albumId, albums.id), eq(tracks.userId, albums.userId), publicTrackScope())));

    // EXISTS preserves one Lyrics row even when several Tracks and the Album all reference it.
    // Recheck Album visibility here rather than relying on the earlier not-found check.
    const rows = await db.select({
      id: lyrics.id, title: lyrics.title, content: lyrics.content,
      assignedToAlbum: sql<boolean>`${assignedToAlbum}`.mapWith(Boolean).as('assigned_to_album'),
    }).from(lyrics).innerJoin(albums, eq(albums.id, albumId))
      .where(and(publicAlbumScope(), eq(lyrics.userId, albums.userId), eq(lyrics.isActive, true), or(assignedToAlbum, assignedToTrack)))
      .orderBy(asc(lyrics.sortOrder), asc(lyrics.id)).limit(11).offset(offset);
    const page = rows.slice(0, 10);
    if (!page.length) return { data: [], hasMore: false };

    // Only public, active Track labels from this Album are eligible for the returned page.
    const trackLabels = await db.select({ lyricsId: lyrics.id, id: tracks.id, title: tracks.title })
      .from(trackAssignments)
      .innerJoin(lyrics, eq(lyrics.id, trackAssignments.lyricsId))
      .innerJoin(tracks, eq(tracks.id, trackAssignments.trackId))
      .innerJoin(albums, eq(albums.id, tracks.albumId))
      .where(and(eq(albums.id, albumId), publicAlbumScope(), eq(lyrics.userId, albums.userId), eq(lyrics.isActive, true),
        eq(tracks.userId, albums.userId), publicTrackScope(), inArray(lyrics.id, page.map(record => record.id))))
      .orderBy(asc(lyrics.id), sql`${tracks.trackNumber} ASC NULLS LAST`, asc(tracks.id));
    const labelsByLyrics = new Map<number, { id: number; title: string }[]>();
    for (const label of trackLabels) {
      const labels = labelsByLyrics.get(label.lyricsId) ?? [];
      labels.push({ id: label.id, title: label.title });
      labelsByLyrics.set(label.lyricsId, labels);
    }
    return {
      data: page.map(record => ({ ...record, tracks: labelsByLyrics.get(record.id) ?? [] })),
      hasMore: rows.length > 10,
    };
  }
  return { forAlbum };
}
