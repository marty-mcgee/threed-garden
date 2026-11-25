import { and, eq, inArray } from 'drizzle-orm';
import { db, type Transaction } from '@/libraries/db/client';
import { project, projectAssets, projectThreed, projectThreedMarkers } from '@/libraries/schema/project';
import { threedBeds, threedPlantings } from '@/libraries/schema/threed';
import type { ThreeDRuntimeMarkerModuleType } from '@/libraries/types/map';
import { parseCharacterPhysicsSettings } from '@/libraries/services/threed/characters/character-physics';
import { projectModelSnapshotLock } from '@/libraries/services/threed/models/project-model-instance-core';
import { ProjectMarkerSnapshotError, type ProjectThreeDMarkerSnapshotInput } from '@/libraries/services/threed/markers/project-marker-snapshot-core';
import { projectLocalPositionToGeographicPosition, type ThreeDGeographicOrigin } from '@/libraries/services/threed/markers/map-coordinate-core';
import { bedPlantingGeometry, containBedPlantings, resolvePlantingBedId } from '@/libraries/services/threed/beds/bed-planting-bounds';
import { ProjectPlantingPlacementInputError } from '@/libraries/services/threed/plantings/project-planting-placement-core';

type OwnedProject = Pick<typeof project.$inferSelect, 'id' | 'originLatitude' | 'originLongitude' | 'originAltitude' | 'headingDegrees' | 'metersPerSceneUnit'>;
type SnapshotReader = Pick<Transaction, 'select'>;

export const PROJECT_ASSET_TYPE_BY_MARKER: Record<
  ThreeDRuntimeMarkerModuleType,
  typeof projectAssets.assetType.enumValues[number]
> = {
  plantings: 'threed_plantings',
  beds: 'threed_beds',
  characters: 'threed_characters',
  farmbots: 'threed_farmbots',
  models: 'threed_models',
};

function getProjectOrigin(
  ownedProject: OwnedProject,
): ThreeDGeographicOrigin | null {
  if (ownedProject.originLatitude === null || ownedProject.originLongitude === null) return null;
  return {
    latitude: Number(ownedProject.originLatitude),
    longitude: Number(ownedProject.originLongitude),
    altitude: Number(ownedProject.originAltitude),
    headingDegrees: Number(ownedProject.headingDegrees),
    metersPerSceneUnit: Number(ownedProject.metersPerSceneUnit),
  };
}

export function getMarkerGeographicValues(
  position: { x: number; y: number; z: number },
  ownedProject: OwnedProject | null,
): {
  latitude: string | null;
  longitude: string | null;
  altitude: string | null;
} {
  const origin = ownedProject ? getProjectOrigin(ownedProject) : null;
  if (!origin) return { latitude: null, longitude: null, altitude: null };
  const geographic = projectLocalPositionToGeographicPosition(position, origin);
  return {
    latitude: geographic.latitude.toFixed(7),
    longitude: geographic.longitude.toFixed(7),
    altitude: geographic.altitude.toFixed(3),
  };
}

export async function requireAssignedBed(
  userId: string,
  projectId: number,
  threedId: number,
  bedId: number,
  reader: SnapshotReader = db,
) {
  const [assigned] = await reader.select({ id: projectAssets.id })
    .from(projectAssets)
    .innerJoin(threedBeds, and(
      eq(threedBeds.id, projectAssets.assetId),
      eq(threedBeds.userId, userId),
      eq(threedBeds.isActive, true),
    ))
    .where(and(
      eq(projectAssets.userId, userId),
      eq(projectAssets.projectId, projectId),
      eq(projectAssets.moduleId, threedId),
      eq(projectAssets.moduleType, 'threed'),
      eq(projectAssets.assetType, 'threed_beds'),
      eq(projectAssets.assetId, bedId),
      eq(projectAssets.isActive, true),
    )).limit(1);
  return assigned ?? null;
}

export function resolveProjectPlantingBedId(data: Record<string, unknown>, sourceBedId: unknown) {
  try { return resolvePlantingBedId(data, sourceBedId); }
  catch { throw new ProjectPlantingPlacementInputError('Invalid assigned Bed'); }
}

export async function readAssignedBedGeometry(tx: Transaction, userId: string, projectId: number, threedId: number, bedId: number) {
  const [source] = await tx.select().from(threedBeds).where(and(
    eq(threedBeds.id, bedId),
    eq(threedBeds.userId, userId),
    eq(threedBeds.isActive, true),
  )).limit(1);
  if (!source) throw new ProjectPlantingPlacementInputError('Assigned Bed not found');
  const overrides = await tx.select().from(projectThreedMarkers).where(and(
    eq(projectThreedMarkers.userId, userId), eq(projectThreedMarkers.projectId, projectId),
    eq(projectThreedMarkers.threedId, threedId), eq(projectThreedMarkers.markerType, 'beds'),
    eq(projectThreedMarkers.sourceAssetId, bedId), eq(projectThreedMarkers.isActive, true),
  )).limit(2);
  if (overrides.length > 1) throw new ProjectPlantingPlacementInputError('Assigned Bed has ambiguous Project instances');
  const marker = overrides[0];
  return bedPlantingGeometry({
    x: Number(marker?.positionX ?? source.positionX),
    y: Number(marker?.positionY ?? source.positionY),
    z: Number(marker?.positionZ ?? source.positionZ),
  }, { ...source, ...(marker?.data as Record<string, unknown> ?? {}) });
}

export function constrainAssignedPlantings(bed: ReturnType<typeof bedPlantingGeometry>, points: { x: number; y: number; z: number }[]) {
  try { return containBedPlantings(bed, points); }
  catch (error) { throw new ProjectPlantingPlacementInputError(error instanceof Error ? error.message : 'Invalid Bed placement'); }
}

export async function buildProjectSnapshotMarkers(
  reader: SnapshotReader,
  userId: string,
  ownedProject: OwnedProject,
  markers: ProjectThreeDMarkerSnapshotInput[],
) {
  const projectId = ownedProject.id;
  for (const marker of markers) {
    const settings = marker.metadata.characterPhysics;
    // Legacy snapshots retain their original permissive read/default behavior.
    if (marker.moduleType === 'characters' && settings && typeof settings === 'object'
      && ('version' in settings || 'units' in settings || 'values' in settings)) {
      marker.metadata.characterPhysics = parseCharacterPhysicsSettings(settings, Number(ownedProject.metersPerSceneUnit));
    }
  }
  const assignmentRows = markers.length === 0
    ? []
    : await reader
        .select({
          moduleId: projectAssets.moduleId,
          assetType: projectAssets.assetType,
          assetId: projectAssets.assetId,
        })
        .from(projectAssets)
        .innerJoin(
          projectThreed,
          and(
            eq(projectThreed.projectId, projectAssets.projectId),
            eq(projectThreed.threedId, projectAssets.moduleId),
            eq(projectThreed.userId, projectAssets.userId),
            eq(projectThreed.isActive, true),
          ),
        )
        .where(and(
          eq(projectAssets.projectId, projectId),
          eq(projectAssets.userId, userId),
          eq(projectAssets.moduleType, 'threed'),
          eq(projectAssets.isActive, true),
          inArray(projectAssets.assetType, Object.values(PROJECT_ASSET_TYPE_BY_MARKER)),
        ));

  const moduleIdsByIdentity = new Map<string, Set<number>>();
  for (const assignment of assignmentRows) {
    const markerType = Object.entries(PROJECT_ASSET_TYPE_BY_MARKER)
      .find(([, assetType]) => assetType === assignment.assetType)?.[0];
    if (!markerType) continue;
    const identity = `${markerType}:${assignment.assetId}`;
    const moduleIds = moduleIdsByIdentity.get(identity) ?? new Set<number>();
    moduleIds.add(assignment.moduleId);
    moduleIdsByIdentity.set(identity, moduleIds);
  }

  return markers.map((marker, index) => {
    const moduleIds = moduleIdsByIdentity.get(`${marker.moduleType}:${marker.assetId}`);
    if (!moduleIds || moduleIds.size !== 1) {
      const error = new ProjectMarkerSnapshotError('invalid_snapshot');
      error.detail = `Marker ${index + 1}: ${moduleIds?.size ? 'multiple active ThreeD Module assignments' : 'no active ThreeD Module assignment'}. Review this Project’s asset assignments.`;
      throw error;
    }
    const [threedId] = moduleIds;
    const geographic = getMarkerGeographicValues(marker.position, ownedProject);
    return {
      userId,
      projectId,
      threedId,
      markerType: marker.moduleType,
      sourceAssetId: marker.assetId,
      markerId: marker.markerId,
      name: marker.name,
      positionX: marker.position.x.toFixed(3),
      positionY: marker.position.y.toFixed(3),
      positionZ: marker.position.z.toFixed(3),
      ...geographic,
      positionSource: marker.positionSource,
      color: marker.color,
      icon: marker.icon,
      label: marker.label,
      isVisible: marker.isVisible,
      isActive: marker.isActive,
      data: marker.data,
      metadata: marker.metadata,
      savedAt: new Date(),
      updatedAt: new Date(),
    };
  });
}

type SnapshotRows = Awaited<ReturnType<typeof buildProjectSnapshotMarkers>>;

export async function resolveSnapshotPlacements(
  tx: Transaction,
  userId: string,
  ownedProject: OwnedProject,
  rows: SnapshotRows,
  currentModels: (typeof projectThreedMarkers.$inferSelect)[],
) {
  const projectId = ownedProject.id;
  const modelsById = new Map(currentModels.map(model => [model.markerId, model]));
  for (const row of rows) {
    if (row.markerType === 'models') row.metadata = projectModelSnapshotLock(modelsById.get(row.markerId), row);
  }
  const plantingRows = rows.filter(row => row.markerType === 'plantings');
  if (!plantingRows.length) return;
  const sources = await tx.select({ id: threedPlantings.id, bedId: threedPlantings.bedId }).from(threedPlantings)
    .where(and(eq(threedPlantings.userId, userId), inArray(threedPlantings.id, plantingRows.map(row => row.sourceAssetId))));
  const sourceBeds = new Map(sources.map(source => [source.id, source.bedId]));
  const plantingGroups = new Map<string, { bedId: number; threedId: number; plants: SnapshotRows }>();
  for (const row of plantingRows) {
    const bedId = resolveProjectPlantingBedId(row.data, sourceBeds.get(row.sourceAssetId));
    if (!bedId) continue;
    const key = `${row.threedId}:${bedId}`;
    const group = plantingGroups.get(key);
    if (group) group.plants.push(row);
    else plantingGroups.set(key, { bedId, threedId: row.threedId, plants: [row] });
  }
  for (const { plants, bedId, threedId } of plantingGroups.values()) {
    if (!await requireAssignedBed(userId, projectId, threedId, bedId, tx)) throw new ProjectPlantingPlacementInputError('Assigned Project Bed not found');
    const bedRows = rows.filter(row => row.markerType === 'beds' && row.sourceAssetId === bedId && row.threedId === threedId);
    if (bedRows.length > 1) throw new ProjectPlantingPlacementInputError('Assigned Bed has ambiguous Project instances');
    const bedRow = bedRows[0];
    const positionOf = (row: SnapshotRows[number]) => ({
      x: Number(row.positionX),
      y: Number(row.positionY),
      z: Number(row.positionZ),
    });
    const bed = bedRow ? bedPlantingGeometry(positionOf(bedRow), bedRow.data)
      : await readAssignedBedGeometry(tx, userId, projectId, threedId, bedId);
    const roots = plants.map(positionOf);
    // Retain overflow rejection while keeping unrelated roots stationary.
    constrainAssignedPlantings(bed, roots);
    plants.forEach((row, index) => {
      const [position] = constrainAssignedPlantings(bed, [roots[index]]);
      row.positionX = position.x.toFixed(3);
      row.positionY = position.y.toFixed(3);
      row.positionZ = position.z.toFixed(3);
      Object.assign(row, getMarkerGeographicValues(position, ownedProject));
      row.data = {
        ...row.data,
        positionX: position.x,
        positionY: position.y,
        positionZ: position.z,
        bedId,
      };
    });
  }
}

export async function prepareDuplicateMarkers(
  tx: Transaction,
  userId: string,
  ownedProject: OwnedProject,
  markers: ProjectThreeDMarkerSnapshotInput[],
  storedMarkers: (typeof projectThreedMarkers.$inferSelect)[],
) {
  const rows = await buildProjectSnapshotMarkers(tx, userId, ownedProject, markers);
  await resolveSnapshotPlacements(tx, userId, ownedProject, rows, storedMarkers.filter(row => row.markerType === 'models'));
  return rows;
}
