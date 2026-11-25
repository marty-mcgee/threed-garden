import { and, eq, sql } from 'drizzle-orm';
import type { Transaction } from '@/libraries/db/client';
import { project, projectAssets, projectThreedMarkers } from '@/libraries/schema/project';
import { threedBeds, threedFarmbots, threedPlantings, threedTasks, threedWateringSchedules } from '@/libraries/schema/threed';

export class BedHasProjectPlantings extends Error {}

type GardenMarker = Pick<typeof projectThreedMarkers.$inferSelect, 'id' | 'projectId' | 'sourceAssetId' | 'threedId'>;

export async function removeProjectGardenPlacement(tx: Transaction, owner: string, marker: GardenMarker, type: 'beds' | 'plantings') {
  const assetType = type === 'beds' ? 'threed_beds' : 'threed_plantings';
  const catalog = type === 'beds' ? threedBeds : threedPlantings;
  const sourceAssetId = marker.sourceAssetId;
  const [owned] = await tx.select({ id: project.id }).from(project)
    .where(and(eq(project.id, marker.projectId), eq(project.userId, owner))).limit(1).for('update');
  if (!owned) return null;
  // Serialize sibling removals and new assignments before deciding whether
  // this placement owns the last reference to its catalog record.
  const [source] = await tx.select({ id: catalog.id }).from(catalog)
    .where(and(eq(catalog.id, sourceAssetId), eq(catalog.userId, owner))).limit(1).for('update');
  const placementScope = and(
    eq(projectThreedMarkers.userId, owner),
    eq(projectThreedMarkers.projectId, marker.projectId),
    eq(projectThreedMarkers.markerType, type),
    eq(projectThreedMarkers.sourceAssetId, sourceAssetId),
    eq(projectThreedMarkers.threedId, marker.threedId),
  );
  const [removed] = await tx.delete(projectThreedMarkers).where(and(placementScope, eq(projectThreedMarkers.id, marker.id)))
    .returning({ id: projectThreedMarkers.id, metadata: projectThreedMarkers.metadata });
  if (!removed) return null;
  const result = { marker: { id: removed.id }, sourceAssetId, sourceDeleted: false };
  const [sameAssignment] = await tx.select({ id: projectThreedMarkers.id }).from(projectThreedMarkers)
    .where(placementScope).limit(1);
  if (sameAssignment) return type === 'beds' ? result : { id: sourceAssetId };
  await tx.delete(projectAssets).where(and(
    eq(projectAssets.userId, owner),
    eq(projectAssets.projectId, marker.projectId),
    eq(projectAssets.moduleId, marker.threedId),
    eq(projectAssets.moduleType, 'threed'),
    eq(projectAssets.assetType, assetType),
    eq(projectAssets.assetId, sourceAssetId),
  ));
  const [assigned] = await tx.select({ id: projectAssets.id }).from(projectAssets)
    .where(and(eq(projectAssets.assetType, assetType), eq(projectAssets.assetId, sourceAssetId))).limit(1);
  const [placed] = await tx.select({ id: projectThreedMarkers.id }).from(projectThreedMarkers)
    .where(and(eq(projectThreedMarkers.markerType, type), eq(projectThreedMarkers.sourceAssetId, sourceAssetId))).limit(1);
  const shared = Boolean(assigned || placed);

  if (type === 'plantings') {
    if (source && !shared) {
      // Immutable Watering History can reference an archived Planting.
      await tx.update(threedPlantings).set({ isActive: false, updatedAt: new Date() })
        .where(and(eq(threedPlantings.id, sourceAssetId), eq(threedPlantings.userId, owner)));
    }
    return { id: sourceAssetId };
  }

  const [localPlanting] = await tx.select({ id: threedPlantings.id }).from(projectAssets)
    .innerJoin(threedPlantings, eq(threedPlantings.id, projectAssets.assetId))
    .leftJoin(projectThreedMarkers, and(
      eq(projectThreedMarkers.projectId, projectAssets.projectId),
      eq(projectThreedMarkers.threedId, projectAssets.moduleId),
      eq(projectThreedMarkers.markerType, 'plantings'),
      eq(projectThreedMarkers.sourceAssetId, threedPlantings.id),
    ))
    .where(and(
      eq(projectAssets.projectId, marker.projectId),
      eq(projectAssets.userId, owner),
      eq(projectAssets.moduleId, marker.threedId),
      eq(projectAssets.moduleType, 'threed'),
      eq(projectAssets.assetType, 'threed_plantings'),
      eq(projectAssets.isActive, true),
      eq(threedPlantings.isActive, true),
      sql`case when ${projectThreedMarkers.data} ? 'bedId' then ${projectThreedMarkers.data}->>'bedId'
          else ${threedPlantings.bedId}::text end = ${String(sourceAssetId)}`,
    )).limit(1);
  const [catalogPlanting] = !shared && !localPlanting ? await tx.select({ id: threedPlantings.id }).from(threedPlantings)
    .where(and(eq(threedPlantings.bedId, sourceAssetId), eq(threedPlantings.isActive, true))).limit(1) : [];
  if (localPlanting || catalogPlanting) {
    throw new BedHasProjectPlantings('Move or delete the Plantings assigned to this Bed before deleting it');
  }
  if (!source || shared || (removed.metadata as { placementKind?: string } | null)?.placementKind !== 'dashboard-created') return result;
  // The Bed FKs cascade schedules and clear Task, FarmBot and Planting
  // links. Retain the catalog Bed if any such record still uses it.
  const [used] = await tx.select({ id: threedBeds.id }).from(threedBeds).where(and(
    eq(threedBeds.id, sourceAssetId),
    sql`(exists (select 1 from ${threedPlantings} where ${threedPlantings.bedId} = ${threedBeds.id})
      or exists (select 1 from ${threedWateringSchedules} where ${threedWateringSchedules.bedId} = ${threedBeds.id})
      or exists (select 1 from ${threedTasks} where ${threedTasks.bedId} = ${threedBeds.id})
      or exists (select 1 from ${threedFarmbots} where ${threedFarmbots.bedId} = ${threedBeds.id}))`,
  )).limit(1);
  if (used) return result;
  await tx.delete(threedBeds).where(and(eq(threedBeds.id, sourceAssetId), eq(threedBeds.userId, owner)));
  return { ...result, sourceDeleted: true };
}
