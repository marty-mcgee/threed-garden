import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { readableProject } from '@/libraries/services/project/read-access';
import { and, asc, eq, ilike, or } from 'drizzle-orm';
import { projectAssets, projectMultimedia } from '@/libraries/schema/project';
import { multimedia, multimediaAlbums } from '@/libraries/schema/multimedia';

const headers = { 'Cache-Control': 'private, no-store' };

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const id = params.get('projectId') ?? '';
  const rawOffset = params.get('offset') ?? '0';
  const search = params.get('search')?.trim() ?? '';
  if (!/^[1-9]\d*$/.test(id) || !/^\d+$/.test(rawOffset) || Number(rawOffset) > 1_000_000 || search.length > 120 || !Number.isSafeInteger(Number(id))) {
    return Response.json({ error: 'Invalid Project query' }, { status: 400, headers });
  }
  try {
    const session = await auth();
    const accessible = await readableProject(Number(id), session?.user?.id);
    if (!accessible?.userId) return Response.json({ error: 'Project not found' }, { status: 404, headers });
    const owner = accessible.userId;
    const albums = await db.selectDistinct({
      id: multimediaAlbums.id,
      title: multimediaAlbums.title,
      artist: multimediaAlbums.artist,
      sortOrder: multimediaAlbums.sortOrder,
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
        session?.user?.id === owner ? undefined : and(eq(multimediaAlbums.isPublic, true), eq(multimediaAlbums.status, 'published')),
        search ? or(ilike(multimediaAlbums.title, `%${search}%`), ilike(multimediaAlbums.artist, `%${search}%`)) : undefined,
      ))
      .orderBy(asc(multimediaAlbums.sortOrder), asc(multimediaAlbums.id))
      .limit(51)
      .offset(Number(rawOffset));
    return Response.json({ albums: albums.slice(0, 50), hasMore: albums.length > 50 }, { headers });
  } catch {
    return Response.json({ error: 'Unable to load Project Multimedia' }, { status: 500, headers });
  }
}
