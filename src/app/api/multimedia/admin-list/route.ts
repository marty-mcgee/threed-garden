import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { multimediaAlbums, multimediaTracks, multimediaMedia, multimediaLinks, multimediaLyrics } from '@/libraries/schema/multimedia';
import { and, eq, sql, count } from 'drizzle-orm';
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
      return NextResponse.json({ data, total: totals[0]?.total ?? 0 }, { headers: { 'Cache-Control': 'private, no-store' } });
    }
    const [data, totals] = await Promise.all([
      db.select().from(table).where(scope).orderBy(sql`${column} ${direction === 'asc' ? sql`ASC` : sql`DESC`} NULLS LAST`, table.id).limit(limit).offset(offset),
      db.select({ total: count() }).from(table).where(scope),
    ]);
    return NextResponse.json({ data, total: totals[0].total }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch { return NextResponse.json({ error: 'Could not load records. Please retry.' }, { status: 503 }); }
}
