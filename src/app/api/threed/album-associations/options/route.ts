import { AlbumAssociationError } from '@/libraries/services/threed/multimedia/album-association-contract';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { and, asc, eq, ilike, or, sql } from 'drizzle-orm';
import { albumEntityKind } from '@/libraries/services/threed/multimedia/album-association-contract';
import { albumEntityTables } from '@/libraries/services/threed/multimedia/album-entity-registry';
import { multimedia, multimediaAlbums } from '@/libraries/schema/multimedia';
import { project, projectMultimedia } from '@/libraries/schema/project';

const headers = { 'Cache-Control': 'private, no-store' };

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401, headers });
  const userId = session.user.id;
  const params = new URL(request.url).searchParams;
  const scope = params.get('scope') ?? 'albums';
  const search = params.get('search')?.trim() ?? '';
  const rawOffset = params.get('offset') ?? '0';
  if (params.has('moduleType') && !albumEntityKind.safeParse(params.get('moduleType')).success) {
    return Response.json({ error: 'Invalid Sub-Module' }, { status: 400, headers });
  }
  if (!['albums', 'projects', 'entities'].includes(scope) || search.length > 120 || !/^\d+$/.test(rawOffset) || Number(rawOffset) > 1_000_000) {
    return Response.json({ error: 'Invalid options query' }, { status: 400, headers });
  }
  try {
    if (scope === 'entities') {
      const kind = albumEntityKind.safeParse(params.get('moduleType'));
      if (!kind.success) return Response.json({ error: 'Invalid Sub-Module' }, { status: 400, headers });
      const table = sql.identifier(albumEntityTables[kind.data]);
      // Return only a display label, never raw catalog metadata/configuration.
      const title = sql`COALESCE(to_jsonb(e)->>'name', to_jsonb(e)->>'model_name', to_jsonb(e)->>'common_name', to_jsonb(e)->>'title', to_jsonb(e)->>'file_name', ${kind.data} || ' #' || e.id::text)`;
      const result = await db.execute(sql`SELECT e.id, ${title} AS title FROM ${table} e
        WHERE ${sql`e.user_id = ${userId}`} AND ${title} ILIKE ${`%${search}%`}
        ORDER BY title, e.id LIMIT 51 OFFSET ${Number(rawOffset)}`);
      return Response.json({ items: result.rows.slice(0, 50), hasMore: result.rows.length > 50 }, { headers });
    }
    const items = scope === 'albums'
      ? await db.select({ id: multimediaAlbums.id, title: multimediaAlbums.title, status: multimediaAlbums.status })
        .from(multimediaAlbums).where(and(
          eq(multimediaAlbums.userId, userId),
          search ? or(ilike(multimediaAlbums.title, `%${search}%`), ilike(multimediaAlbums.artist, `%${search}%`)) : undefined,
        )).orderBy(asc(multimediaAlbums.title), asc(multimediaAlbums.id)).limit(51).offset(Number(rawOffset))
      : await db.select({ projectId: project.id, moduleId: multimedia.id, title: project.name, moduleName: multimedia.name })
        .from(projectMultimedia)
        .innerJoin(project, and(eq(project.id, projectMultimedia.projectId), eq(project.userId, userId), eq(project.isActive, true)))
        .innerJoin(multimedia, and(eq(multimedia.id, projectMultimedia.multimediaId), eq(multimedia.userId, userId), eq(multimedia.isActive, true)))
        .where(and(eq(projectMultimedia.userId, userId), eq(projectMultimedia.isActive, true), search ? ilike(project.name, `%${search}%`) : undefined))
        .orderBy(asc(project.name), asc(project.id), asc(multimedia.id)).limit(51).offset(Number(rawOffset));
    return Response.json({ items: items.slice(0, 50), hasMore: items.length > 50 }, { headers });
  } catch (error) {
    if (error instanceof AlbumAssociationError) return Response.json({ error: error.message }, { status: error.status, headers });
    return Response.json({ error: 'Unable to load choices' }, { status: 500, headers });
  }
}
