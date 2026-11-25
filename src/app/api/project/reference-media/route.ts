import { and, asc, eq, ilike, isNotNull, or } from 'drizzle-orm';
import { auth } from '@/libraries/auth';
import { db, type Transaction } from '@/libraries/db/client';
import { multimedia, multimediaMedia as media, multimediaMediaProjects as links } from '@/libraries/schema/multimedia';
import { project, projectAssets, projectMultimedia } from '@/libraries/schema/project';
import { positiveId } from '@/libraries/services/multimedia/access';

const headers = { 'Cache-Control': 'private, no-store' };
const reply = (data: unknown, status = 200) => Response.json(data, { status, headers });

function moduleMedia(tx: Transaction, projectId: number, owner: string) {
  return tx.select({ mediaId: projectAssets.assetId })
    .from(projectAssets)
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
    .where(and(
      eq(projectAssets.projectId, projectId),
      eq(projectAssets.userId, owner),
      eq(projectAssets.moduleType, 'multimedia'),
      eq(projectAssets.assetType, 'multimedia_media'),
      eq(projectAssets.isActive, true),
    ))
    .groupBy(projectAssets.assetId)
    .as('module_media');
}

async function handle(request: Request) {
  const owner = (await auth())?.user?.id;
  if (!owner) return reply({ error: 'Sign in required.' }, 401);
  const params = new URL(request.url).searchParams;
  const projectId = positiveId(params.get('projectId'));
  if (!projectId) return reply({ error: 'Invalid Project.' }, 400);
  const search = params.get('search') ?? '';
  if (search.length > 120) return reply({ error: 'Search is too long.' }, 400);
  return db.transaction(async tx => {
    const [owned] = await tx.select({ id: project.id }).from(project)
      .where(and(eq(project.id, projectId), eq(project.userId, owner))).for('share');
    if (!owned) return reply({ error: 'Project not found.' }, 404);
    const moduleAssets = moduleMedia(tx, projectId, owner);
    const mediaId = positiveId(params.get('mediaId'));
    if (request.method === 'GET') {
      if (params.has('mediaId') && !mediaId) return reply({ error: 'Invalid Media.' }, 400);
      const offset = Number(params.get('offset') ?? 0);
      if (!Number.isSafeInteger(offset) || offset < 0 || offset > 1000000) return reply({ error: 'Invalid page.' }, 400);
      const rows = await tx.select({
        id: media.id,
        fileName: media.fileName,
        fileUrl: media.fileUrl,
        fileType: media.fileType,
        directId: links.projectId,
        moduleMediaId: moduleAssets.mediaId,
      }).from(media)
        .leftJoin(links, and(eq(links.mediaId, media.id), eq(links.projectId, projectId)))
        .leftJoin(moduleAssets, eq(moduleAssets.mediaId, media.id))
        .where(and(
          eq(media.userId, owner),
          mediaId ? eq(media.id, mediaId) : undefined,
          params.get('library') === '1' ? undefined : or(isNotNull(links.projectId), isNotNull(moduleAssets.mediaId)),
          search ? ilike(media.fileName, '%' + search + '%') : undefined,
        ))
        .orderBy(asc(media.fileName), asc(media.id)).limit(26).offset(offset);
      const items = rows.slice(0, 25).map(({ directId, moduleMediaId, ...item }) => ({
        ...item,
        assigned: directId !== null || moduleMediaId !== null ? projectId : null,
        direct: directId !== null,
        viaModule: moduleMediaId !== null,
      }));
      return reply({ items, hasMore: rows.length > 25 });
    }
    if (!mediaId) return reply({ error: 'Invalid Media.' }, 400);
    const [item] = await tx.select({ id: media.id }).from(media)
      .where(and(eq(media.id, mediaId), eq(media.userId, owner))).for('share');
    if (!item) return reply({ error: 'Media not found.' }, 404);
    const [moduleAsset] = await tx.select({ id: moduleAssets.mediaId }).from(moduleAssets)
      .where(eq(moduleAssets.mediaId, mediaId)).limit(1);
    if (request.method === 'PUT') {
      if (!moduleAsset) await tx.insert(links).values({ projectId, mediaId }).onConflictDoNothing();
    } else {
      const removed = await tx.delete(links).where(and(eq(links.projectId, projectId), eq(links.mediaId, mediaId)))
        .returning({ id: links.mediaId });
      if (moduleAsset && !removed.length) return reply({ error: 'Manage this Media assignment in Admin Project Assets.' }, 409);
    }
    return reply({ success: true });
  });
}
export { handle as GET, handle as PUT, handle as DELETE };
