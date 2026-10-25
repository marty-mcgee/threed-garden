import { and, asc, eq, inArray, sql, count } from 'drizzle-orm';
import type { db as database } from '@/libraries/db/client';
import { project } from '@/libraries/schema/project';
import { multimediaAlbums, multimediaTracks, multimediaLyrics as lyrics, multimediaLyricsProjects as projects, multimediaLyricsAlbums as albums, multimediaLyricsTracks as tracks } from '@/libraries/schema/multimedia';
import { LyricsInputError, type LyricsInput } from './lyrics-input';

export class LyricsNotFound extends Error {}
export function lyricsService(db: typeof database) {
  async function options(owner: string, kind: string, search: string, offset: number) {
    const table = kind === 'projects' ? project : kind === 'albums' ? multimediaAlbums : multimediaTracks;
    const name = kind === 'projects' ? project.name : kind === 'albums' ? multimediaAlbums.title : multimediaTracks.title;
    const scope = and(eq(table.userId, owner), search ? sql`${name} ILIKE ${`%${search.replace(/[\\%_]/g, '\\$&')}%`}` : undefined);
    const [data, totals] = await Promise.all([
      db.select({ id: table.id, title: name }).from(table).where(scope).orderBy(asc(name), asc(table.id)).limit(25).offset(offset),
      db.select({ total: count() }).from(table).where(scope),
    ]);
    return { data, total: totals[0]?.total ?? 0 };
  }
  async function get(owner: string, id: number) {
    const [record] = await db.select().from(lyrics).where(and(eq(lyrics.id, id), eq(lyrics.userId, owner))).limit(1);
    if (!record) throw new LyricsNotFound();
    const [projectRows, albumRows, trackRows] = await Promise.all([
      db.select({ id: project.id, title: project.name }).from(projects).innerJoin(project, eq(project.id, projects.projectId)).where(and(eq(projects.lyricsId, id), eq(project.userId, owner))).orderBy(asc(project.name), asc(project.id)),
      db.select({ id: multimediaAlbums.id, title: multimediaAlbums.title }).from(albums).innerJoin(multimediaAlbums, eq(multimediaAlbums.id, albums.albumId)).where(and(eq(albums.lyricsId, id), eq(multimediaAlbums.userId, owner))).orderBy(asc(multimediaAlbums.title), asc(multimediaAlbums.id)),
      db.select({ id: multimediaTracks.id, title: multimediaTracks.title }).from(tracks).innerJoin(multimediaTracks, eq(multimediaTracks.id, tracks.trackId)).where(and(eq(tracks.lyricsId, id), eq(multimediaTracks.userId, owner))).orderBy(asc(multimediaTracks.title), asc(multimediaTracks.id)),
    ]);
    return { ...record, projects: projectRows, albums: albumRows, tracks: trackRows };
  }
  async function forTrack(owner: string, trackId: number, offset: number) {
    const [track] = await db.select({ id: multimediaTracks.id }).from(multimediaTracks)
      .where(and(eq(multimediaTracks.id, trackId), eq(multimediaTracks.userId, owner))).limit(1);
    if (!track) throw new LyricsNotFound();
    const data = await db.select({ id: lyrics.id, title: lyrics.title, content: lyrics.content }).from(lyrics)
      .innerJoin(tracks, eq(tracks.lyricsId, lyrics.id))
      .innerJoin(multimediaTracks, eq(multimediaTracks.id, tracks.trackId))
      .where(and(eq(tracks.trackId, trackId), eq(multimediaTracks.userId, owner), eq(lyrics.userId, owner), eq(lyrics.isActive, true)))
      .orderBy(asc(lyrics.sortOrder), asc(lyrics.id)).limit(11).offset(offset);
    return { data: data.slice(0, 10), hasMore: data.length > 10 };
  }
  async function save(owner: string, input: LyricsInput, id?: number) {
    return db.transaction(async tx => {
      // Lock the owned Lyrics identity before replacing all its associations atomically.
      if (id) {
        const [existing] = await tx.select({ id: lyrics.id }).from(lyrics).where(and(eq(lyrics.id, id), eq(lyrics.userId, owner))).limit(1).for('update');
        if (!existing) throw new LyricsNotFound();
      }
      for (const [table, ids] of [[project, input.projectIds], [multimediaAlbums, input.albumIds], [multimediaTracks, input.trackIds]] as const) {
        if (!ids.length) continue;
        const parents = await tx.select({ id: table.id }).from(table).where(and(eq(table.userId, owner), inArray(table.id, ids))).orderBy(asc(table.id)).for('share');
        if (parents.length !== ids.length) throw new LyricsInputError('One or more selected assignments are unavailable or belong to another User.');
      }
      const { projectIds, albumIds, trackIds, ...values } = input;
      const [saved] = id
        ? await tx.update(lyrics).set({ ...values, updatedAt: new Date() }).where(and(eq(lyrics.id, id), eq(lyrics.userId, owner))).returning({ id: lyrics.id })
        : await tx.insert(lyrics).values({ ...values, userId: owner }).returning({ id: lyrics.id });
      if (!saved) throw new LyricsNotFound();
      if (id) {
        await tx.delete(projects).where(eq(projects.lyricsId, id));
        await tx.delete(albums).where(eq(albums.lyricsId, id));
        await tx.delete(tracks).where(eq(tracks.lyricsId, id));
      }
      if (projectIds.length) await tx.insert(projects).values(projectIds.map(projectId => ({ lyricsId: saved.id, projectId })));
      if (albumIds.length) await tx.insert(albums).values(albumIds.map(albumId => ({ lyricsId: saved.id, albumId })));
      if (trackIds.length) await tx.insert(tracks).values(trackIds.map(trackId => ({ lyricsId: saved.id, trackId })));
      return saved;
    });
  }
  async function remove(owner: string, id: number) {
    const [removed] = await db.delete(lyrics).where(and(eq(lyrics.id, id), eq(lyrics.userId, owner))).returning({ id: lyrics.id });
    if (!removed) throw new LyricsNotFound();
    return removed;
  }
  return { options, get, forTrack, save, remove };
}
