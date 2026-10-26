import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { multimediaAlbums, multimediaTracks, multimediaMedia, multimediaLinks, multimediaLyrics, multimediaLyricsAlbums, multimediaLyricsTracks, multimediaLyricsProjects } from '@/libraries/schema/multimedia';
import { project } from '@/libraries/schema/project';
import { and, asc, eq, inArray, sql, count } from 'drizzle-orm';
import { multimediaOrdering } from '@/libraries/services/multimedia/ordering';

const tables = { albums: multimediaAlbums, tracks: multimediaTracks, media: multimediaMedia, links: multimediaLinks, lyrics: multimediaLyrics };
const fields = {
  albums: ['id', 'title', 'artist', 'releaseYear', 'status', 'isPublic', 'sortOrder'],
  tracks: ['id', 'title', 'albumId', 'duration', 'fileType', 'status', 'trackNumber'],
  media: ['sortOrder', 'id', 'fileName', 'albumId', 'fileType', 'fileSize', 'isPrimary', 'isPublic', 'isActive'],
  links: ['id', 'title', 'albumId', 'type', 'status', 'displayOrder'],
  lyrics: ['id', 'title', 'sortOrder', 'isActive', 'updatedAt'],
};
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const params = request.nextUrl.searchParams;
  const kind = params.get('kind') ?? '';
  if (!Object.hasOwn(tables, kind)) return NextResponse.json({ error: 'Invalid module.' }, { status: 400 });
  const key = kind as keyof typeof tables;
  const table = tables[key];
  const defaults = multimediaOrdering(key);
  const sort = params.get('sort') ?? defaults.sort;
  const direction = params.get('direction') ?? (params.has('sort') ? 'desc' : defaults.direction);
  const limit = Number(params.get('limit') ?? 25), offset = Number(params.get('offset') ?? 0);
  const search = (params.get('search') ?? '').trim();
  const albumValue = params.get('albumId'), trackValue = params.get('trackId');
  const validId = (value: string) => /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value));
  if ((albumValue !== null && (!validId(albumValue) || key === 'albums' || key === 'lyrics')) ||
      (trackValue !== null && (!validId(trackValue) || key !== 'links'))) return NextResponse.json({ error: 'Invalid parent filter.' }, { status: 400 });
  if (!fields[key].includes(sort) || !['asc', 'desc'].includes(direction) || !Number.isInteger(limit) || limit < 1 || limit > 200 || !Number.isSafeInteger(offset) || offset < 0 || offset > 2147483647 || search.length > 255) return NextResponse.json({ error: 'Invalid list options.' }, { status: 400 });
  // All identifiers come from the module allowlist, never SQL supplied by the caller.
  const column = table[sort as keyof typeof table] as typeof table.id;
  const name = key === 'media' ? multimediaMedia.fileName : (table as typeof multimediaAlbums).title;
  const scope = and(eq(table.userId, session.user.id),
    albumValue ? eq((table as typeof multimediaTracks).albumId, Number(albumValue)) : undefined,
    trackValue ? eq(multimediaLinks.trackId, Number(trackValue)) : undefined,
    search ? sql`${name} ILIKE ${`%${search.replace(/[\\%_]/g, '\\$&')}%`}` : undefined);
  try {
    if (key === 'lyrics') {
      const table = multimediaLyrics;
      const [data, totals] = await Promise.all([
        db.select({ id: table.id, title: table.title, sortOrder: table.sortOrder, isActive: table.isActive, updatedAt: table.updatedAt }).from(table).where(scope)
          .orderBy(sql`${column} ${direction === 'asc' ? sql`ASC` : sql`DESC`} NULLS LAST`, table.id).limit(limit).offset(offset),
        db.select({ total: count() }).from(table).where(scope),
      ]);
      const total = totals[0]?.total ?? 0;
      if (!data.length) return NextResponse.json({ data, total }, { headers: { 'Cache-Control': 'private, no-store' } });
      const ids = data.map(row => row.id);
      // Enrich only this page, rechecking both owners for each saved association.
      const [albumRows, trackRows, projectRows] = await Promise.all([
        db.select({ lyricsId: table.id, id: multimediaAlbums.id, title: multimediaAlbums.title }).from(multimediaLyricsAlbums)
          .innerJoin(table, eq(table.id, multimediaLyricsAlbums.lyricsId)).innerJoin(multimediaAlbums, eq(multimediaAlbums.id, multimediaLyricsAlbums.albumId))
          .where(and(inArray(table.id, ids), eq(table.userId, session.user.id), eq(multimediaAlbums.userId, session.user.id)))
          .orderBy(asc(multimediaAlbums.title), asc(multimediaAlbums.id)),
        db.select({ lyricsId: table.id, id: multimediaTracks.id, title: multimediaTracks.title }).from(multimediaLyricsTracks)
          .innerJoin(table, eq(table.id, multimediaLyricsTracks.lyricsId)).innerJoin(multimediaTracks, eq(multimediaTracks.id, multimediaLyricsTracks.trackId))
          .where(and(inArray(table.id, ids), eq(table.userId, session.user.id), eq(multimediaTracks.userId, session.user.id)))
          .orderBy(asc(multimediaTracks.title), asc(multimediaTracks.id)),
        db.select({ lyricsId: table.id, id: project.id, title: project.name }).from(multimediaLyricsProjects)
          .innerJoin(table, eq(table.id, multimediaLyricsProjects.lyricsId)).innerJoin(project, eq(project.id, multimediaLyricsProjects.projectId))
          .where(and(inArray(table.id, ids), eq(table.userId, session.user.id), eq(project.userId, session.user.id)))
          .orderBy(asc(project.name), asc(project.id)),
      ]);
      const group = (rows: { lyricsId: number; id: number; title: string }[]) => {
        const assignments = new Map<number, { id: number; title: string }[]>();
        for (const { lyricsId, id, title } of rows) {
          const items = assignments.get(lyricsId) ?? [];
          items.push({ id, title }); assignments.set(lyricsId, items);
        }
        return assignments;
      };
      const albums = group(albumRows), tracks = group(trackRows), projects = group(projectRows);
      return NextResponse.json({ data: data.map(row => ({ ...row, albums: albums.get(row.id) ?? [], tracks: tracks.get(row.id) ?? [], projects: projects.get(row.id) ?? [] })), total }, { headers: { 'Cache-Control': 'private, no-store' } });
    }
    const [data, totals] = await Promise.all([
      db.select().from(table).where(scope).orderBy(sql`${column} ${direction === 'asc' ? sql`ASC` : sql`DESC`} NULLS LAST`, table.id).limit(limit).offset(offset),
      db.select({ total: count() }).from(table).where(scope),
    ]);
    return NextResponse.json({ data, total: totals[0].total }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch { return NextResponse.json({ error: 'Could not load records. Please retry.' }, { status: 503 }); }
}
