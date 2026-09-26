import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { multimediaAlbums, multimediaTracks, multimediaMedia, multimediaLinks } from '@/libraries/schema/multimedia';
import { and, eq, sql, count } from 'drizzle-orm';

const tables = { albums: multimediaAlbums, tracks: multimediaTracks, media: multimediaMedia, links: multimediaLinks };
const fields = {
  albums: ['id', 'title', 'artist', 'releaseYear', 'status', 'isPublic'],
  tracks: ['id', 'title', 'albumId', 'duration', 'fileType', 'status'],
  media: ['id', 'fileName', 'albumId', 'fileType', 'fileSize', 'isPrimary'],
  links: ['id', 'title', 'albumId', 'type', 'status'],
};
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const params = request.nextUrl.searchParams;
  const kind = params.get('kind') ?? '';
  if (!Object.hasOwn(tables, kind)) return NextResponse.json({ error: 'Invalid module.' }, { status: 400 });
  const key = kind as keyof typeof tables;
  const table = tables[key];
  const sort = params.get('sort') ?? 'id';
  const direction = params.get('direction') ?? 'desc';
  const limit = Number(params.get('limit') ?? 25), offset = Number(params.get('offset') ?? 0);
  const search = (params.get('search') ?? '').trim();
  if (!fields[key].includes(sort) || !['asc', 'desc'].includes(direction) || !Number.isInteger(limit) || limit < 1 || limit > 200 || !Number.isSafeInteger(offset) || offset < 0 || offset > 2147483647 || search.length > 255) return NextResponse.json({ error: 'Invalid list options.' }, { status: 400 });
  // All identifiers come from the module allowlist, never SQL supplied by the caller.
  const column = table[sort as keyof typeof table] as typeof table.id;
  const name = key === 'media' ? multimediaMedia.fileName : (table as typeof multimediaAlbums).title;
  const scope = and(eq(table.userId, session.user.id), search ? sql`${name} ILIKE ${`%${search.replace(/[\\%_]/g, '\\$&')}%`}` : undefined);
  try {
    const [data, totals] = await Promise.all([
      db.select().from(table).where(scope).orderBy(sql`${column} ${direction === 'asc' ? sql`ASC` : sql`DESC`} NULLS LAST`, table.id).limit(limit).offset(offset),
      db.select({ total: count() }).from(table).where(scope),
    ]);
    return NextResponse.json({ data, total: totals[0].total }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch { return NextResponse.json({ error: 'Could not load records. Please retry.' }, { status: 503 }); }
}
