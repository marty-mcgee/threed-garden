import { randomUUID } from 'node:crypto';
import { and, eq, inArray, or } from 'drizzle-orm';
import type { Transaction } from '@/libraries/db/client';
import { ASSIGNABLE_ASSET_REGISTRY, type AssignableAssetDefinition } from '@/libraries/project-assets/asset-registry';
import { multimedia, multimediaAlbums, multimediaLyrics, multimediaLyricsProjects, multimediaMedia, multimediaMediaProjects } from '@/libraries/schema/multimedia';
import { projectAssets, projectMultimedia, projectThreed, projectTraffic } from '@/libraries/schema/project';
import { threed, threedLayers, threedModels, threedWeatherLogs } from '@/libraries/schema/threed';
import { threedMultimediaAlbums } from '@/libraries/schema/threed/album-associations';
import { traffic } from '@/libraries/schema/traffic';
import { ProjectConfigurationConflict } from './configuration';

// Keep inserts below PostgreSQL's parameter limit even for large saved Projects.
export function* copyBatches<T>(rows: T[]) {
  for (let start = 0; start < rows.length; start += 500) yield rows.slice(start, start + 500);
}

// These read-only historical assignments still have owner-scoped catalog records.
const historicalAssets: Partial<Record<string, AssignableAssetDefinition>> = {
  threed_layers: {
    moduleType: 'threed',
    policy: 'ownerOnly',
    table: threedLayers,
    idColumn: threedLayers.id,
    userIdColumn: threedLayers.userId,
  },
  threed_weather_logs: {
    moduleType: 'threed',
    policy: 'ownerOnly',
    table: threedWeatherLogs,
    idColumn: threedWeatherLogs.id,
    userIdColumn: threedWeatherLogs.userId,
  },
};

type AssetReference = Pick<typeof projectAssets.$inferSelect, 'assetId' | 'assetType' | 'moduleType'>;

export async function validateCopyCatalogAssets(tx: Transaction, owner: string, assets: AssetReference[]) {
  const sources = new Map<AssignableAssetDefinition, Set<number>>();
  for (const asset of assets) {
    const definition = ASSIGNABLE_ASSET_REGISTRY[asset.assetType] ?? historicalAssets[asset.assetType];
    if (!definition || definition.moduleType !== asset.moduleType) {
      throw new ProjectConfigurationConflict('Review the source Project Assets. An assignment has an unsupported type or Module.');
    }
    const ids = sources.get(definition) ?? new Set<number>();
    ids.add(asset.assetId);
    sources.set(definition, ids);
  }
  for (const [definition, ids] of sources) {
    let access = eq(definition.userIdColumn, owner);
    if (definition.policy === 'ownerOrActivePublic') {
      access = or(access, and(eq(definition.isPublicColumn, true), eq(definition.isActiveColumn, true)))!;
    } else if (definition.table === threedModels) {
      // Scene placement also admits another owner's currently published Library Model.
      access = or(access, and(
        eq(threedModels.isPublic, true),
        eq(threedModels.isLibraryItem, true),
        eq(threedModels.isActive, true),
        eq(threedModels.status, 'active'),
      ))!;
    }
    for (const batch of copyBatches(Array.from(ids))) {
      const allowed = await tx.select({ id: definition.idColumn }).from(definition.table)
        .where(and(inArray(definition.idColumn, batch), access)).for('share');
      if (allowed.length !== batch.length) {
        throw new ProjectConfigurationConflict('A source Project asset is unavailable for copying. Review its assignment or access before trying again.');
      }
    }
  }
}

export async function copyAssociatedAlbums(
  tx: Transaction,
  owner: string,
  kind: 'ground_map' | 'design' | 'simulation' | 'scenario' | 'model' | 'model_file' | 'character' | 'texture',
  ids: ReadonlyMap<number, number>,
) {
  for (const batch of copyBatches(Array.from(ids.keys(), String))) {
    const links = await tx.select({
      entityId: threedMultimediaAlbums.entityId,
      albumId: threedMultimediaAlbums.albumId,
      sortOrder: threedMultimediaAlbums.sortOrder,
    }).from(threedMultimediaAlbums)
      .innerJoin(multimediaAlbums, and(eq(multimediaAlbums.id, threedMultimediaAlbums.albumId), eq(multimediaAlbums.userId, owner)))
      .where(and(eq(threedMultimediaAlbums.moduleType, kind), inArray(threedMultimediaAlbums.entityId, batch)));
    for (const part of copyBatches(links)) await tx.insert(threedMultimediaAlbums).values(part.map(link => ({
      moduleType: kind,
      entityId: String(ids.get(Number(link.entityId))!),
      albumId: link.albumId,
      sortOrder: link.sortOrder,
    })));
  }
}

export async function copyProjectAssignments(tx: Transaction, owner: string, source: number, destination: number) {
  const moduleIds = new Map<number, number>();
  async function recordModule(module: typeof threed.$inferSelect) {
    let id = module.id;
    if (module.projectId !== null) {
      // Deleting the legacy owning Project cascades to this Module. Give the
      // destination its own record before copying anything that references it.
      const [created] = await tx.insert(threed).values({
        userId: owner,
        projectId: destination,
        name: module.name,
        description: module.description,
        slug: randomUUID(),
        config: module.config,
        isActive: module.isActive,
        isPublic: false,
        version: module.version,
        metadata: module.metadata,
      }).returning({ id: threed.id });
      id = created.id;
    }
    moduleIds.set(module.id, id);
    return id;
  }
  for (const module of await tx.select().from(threed).where(and(eq(threed.projectId, source), eq(threed.userId, owner)))) {
    await recordModule(module);
  }
  async function resolveModule(id: number | null) {
    if (!id) throw new ProjectConfigurationConflict('A Project assignment has no ThreeD Module.');
    const mapped = moduleIds.get(id);
    if (mapped !== undefined) return mapped;
    const [module] = await tx.select().from(threed).where(and(eq(threed.id, id), eq(threed.userId, owner)));
    if (!module) throw new ProjectConfigurationConflict('A ThreeD Module is unavailable to this Project owner.');
    return recordModule(module);
  }
  const scope = {
    projectId: destination,
    userId: owner,
  };
  const threeDLinks = await tx.select().from(projectThreed)
    .where(and(eq(projectThreed.projectId, source), eq(projectThreed.userId, owner)));
  for (const link of threeDLinks) {
    await tx.insert(projectThreed).values({
      ...scope,
      threedId: await resolveModule(link.threedId),
      config: link.config,
      isActive: link.isActive,
    });
  }
  const mediaLinks = await tx.select({
    multimediaId: multimedia.id,
    config: projectMultimedia.config,
    isActive: projectMultimedia.isActive,
  }).from(projectMultimedia).leftJoin(multimedia, and(eq(multimedia.id, projectMultimedia.multimediaId), eq(multimedia.userId, owner)))
    .where(and(eq(projectMultimedia.projectId, source), eq(projectMultimedia.userId, owner)));
  const trafficLinks = await tx.select({
    trafficId: traffic.id,
    config: projectTraffic.config,
    isActive: projectTraffic.isActive,
  }).from(projectTraffic).leftJoin(traffic, and(eq(traffic.id, projectTraffic.trafficId), eq(traffic.userId, owner)))
    .where(and(eq(projectTraffic.projectId, source), eq(projectTraffic.userId, owner)));
  if (mediaLinks.some(link => link.multimediaId === null) || trafficLinks.some(link => link.trafficId === null)) {
    throw new ProjectConfigurationConflict('A source Project Module is unavailable. Review its assignment before duplicating.');
  }
  for (const batch of copyBatches(mediaLinks)) await tx.insert(projectMultimedia).values(batch.map(link => ({ ...link, ...scope })));
  for (const batch of copyBatches(trafficLinks)) await tx.insert(projectTraffic).values(batch.map(link => ({ ...link, ...scope })));

  const attachedModules = new Map<string, Set<number | null>>([
    ['threed', new Set(threeDLinks.map(link => link.threedId))],
    ['traffic', new Set(trafficLinks.map(link => link.trafficId))],
    ['multimedia', new Set(mediaLinks.map(link => link.multimediaId))],
  ]);
  const sourceAssets = await tx.select().from(projectAssets)
    .where(and(eq(projectAssets.projectId, source), eq(projectAssets.userId, owner))).for('share');
  // Removing a Module unlinks its membership and leaves historical asset rows.
  // threed_markers has no catalog table; its active successor is copied separately.
  const assets = sourceAssets.filter(asset => {
    const modules = attachedModules.get(asset.moduleType);
    if (!modules) throw new ProjectConfigurationConflict('Review the source Project Assets. An assignment has an unsupported Module type.');
    return asset.assetType !== 'threed_markers' && modules.has(asset.moduleId);
  });
  await validateCopyCatalogAssets(tx, owner, assets);
  for (const batch of copyBatches(assets)) {
    const rows = [];
    for (const asset of batch) rows.push({
      ...scope,
      moduleId: asset.moduleType === 'threed' ? await resolveModule(asset.moduleId) : asset.moduleId,
      moduleType: asset.moduleType,
      assetType: asset.assetType,
      assetId: asset.assetId,
      isActive: asset.isActive,
      config: asset.config,
    });
    await tx.insert(projectAssets).values(rows);
  }
  const media = await tx.select({ mediaId: multimediaMediaProjects.mediaId }).from(multimediaMediaProjects)
    .innerJoin(multimediaMedia, and(eq(multimediaMedia.id, multimediaMediaProjects.mediaId), eq(multimediaMedia.userId, owner)))
    .where(eq(multimediaMediaProjects.projectId, source));
  for (const batch of copyBatches(media)) await tx.insert(multimediaMediaProjects).values(batch.map(link => ({ ...link, projectId: destination })));
  const lyrics = await tx.select({ lyricsId: multimediaLyricsProjects.lyricsId }).from(multimediaLyricsProjects)
    .innerJoin(multimediaLyrics, and(eq(multimediaLyrics.id, multimediaLyricsProjects.lyricsId), eq(multimediaLyrics.userId, owner)))
    .where(eq(multimediaLyricsProjects.projectId, source));
  for (const batch of copyBatches(lyrics)) await tx.insert(multimediaLyricsProjects).values(batch.map(link => ({ ...link, projectId: destination })));
  return {
    moduleIds,
    resolveModule,
    assets,
    threeDLinks,
  };
}
