import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import type { Transaction } from '@/libraries/db/client';
import { project, projectThreedMarkers } from '@/libraries/schema/project';
import {
  projectTerrainPlacements, threedDesigns, threedGroundMaps,
  threedScenarios, threedSimulations, threedTerrains, threedTerrainRevisions,
} from '@/libraries/schema/threed';
import { threedGroups, threedGroupDesignMembers, threedGroupModelMembers } from '@/libraries/schema/threed/groups';
import type { ThreeDGroup } from '../threed/design/groups';
import { readProjectArchitecture, type ProjectArchitecture } from '../threed/design/project-architecture';
import { projectDesignCreateKey, saveProjectDesignProjection } from '../threed/design/project-design-projection';
import type { ProjectThreeDMarkerSnapshotInput } from '../threed/markers/project-marker-snapshot-core';
import { parseThreeDProjectViewState, type ThreeDProjectViewState } from '../threed/markers/project-view-state-core';
import { parseScenarioSetup } from '../threed/scenarios/scenario-input';
import { parseSimulationDefinition } from '../threed/simulations/simulation-input';
import type { TerrainPlacementDraft } from '../threed/terrains/terrain-core';
import { ProjectConfigurationConflict } from './configuration';
import { copyAssociatedAlbums, copyBatches, copyProjectAssignments, validateCopyCatalogAssets } from './duplicate-project-assignments';
import { copyProjectView, copySimulationDefinition } from './duplicate-project-identity';
import { prepareDuplicateMarkers, PROJECT_ASSET_TYPE_BY_MARKER } from './project-snapshot-markers';

export interface ProjectDuplicateDraft {
  markers: ProjectThreeDMarkerSnapshotInput[];
  architecture: ProjectArchitecture;
  viewState: ThreeDProjectViewState;
  groups?: ThreeDGroup[];
  terrain?: TerrainPlacementDraft | null;
}

type Project = typeof project.$inferSelect;
type Assignments = Awaited<ReturnType<typeof copyProjectAssignments>>;

async function copyMarkers(tx: Transaction, owner: string, source: Project, destination: number, assignments: Assignments, draft?: ProjectDuplicateDraft) {
  const stored = await tx.select().from(projectThreedMarkers)
    .where(and(eq(projectThreedMarkers.projectId, source.id), eq(projectThreedMarkers.userId, owner))).for('share');
  const sourceIds = new Map(stored.map(row => [row.markerId, row.id]));
  const rows = new Map<string, typeof projectThreedMarkers.$inferInsert>(stored.map(row => [row.markerId, row]));
  if (draft) {
    // The Scene includes only loaded Module assignments. Preserve saved placements
    // in inactive Modules while overlaying positions currently visible to the editor.
    for (const marker of await prepareDuplicateMarkers(tx, owner, source, draft.markers, stored)) {
      const saved = rows.get(marker.markerId);
      if (saved && (saved.markerType !== marker.markerType || saved.sourceAssetId !== marker.sourceAssetId)) {
        throw new ProjectConfigurationConflict('A Scene marker now refers to a different asset. Review the source Project before duplicating.');
      }
      rows.set(marker.markerId, marker);
    }
  }
  // Older Projects can have a saved placement without a Project Assets row.
  const checkedAssets = new Set(assignments.assets.map(asset => `${asset.assetType}:${asset.assetId}`));
  const markerSources = Array.from(rows.values(), marker => ({
    moduleType: 'threed' as const,
    assetType: PROJECT_ASSET_TYPE_BY_MARKER[marker.markerType],
    assetId: marker.sourceAssetId,
  }));
  await validateCopyCatalogAssets(tx, owner, markerSources.filter(asset => !checkedAssets.has(`${asset.assetType}:${asset.assetId}`)));

  const markerIds = new Map<number, number>();
  const models = new Set<string>();
  for (const batch of copyBatches(Array.from(rows.values()))) {
    const values = [];
    for (const { id, createdAt, updatedAt, savedAt, ...marker } of batch) {
      const threedId = await assignments.resolveModule(marker.threedId);
      const data = { ...(marker.data as Record<string, unknown>) };
      // The runtime rebuilds these fields using the destination's marker row.
      delete data.projectMarkerId;
      delete data.instanceId;
      if (marker.markerType === 'models') {
        delete data.id;
        models.add(marker.markerId);
      }
      if ('projectId' in data) data.projectId = destination;
      if ('threedId' in data) data.threedId = threedId;
      values.push({
        ...marker,
        projectId: destination,
        threedId,
        data,
      });
    }
    const inserted = await tx.insert(projectThreedMarkers).values(values)
      .returning({ id: projectThreedMarkers.id, markerId: projectThreedMarkers.markerId });
    for (const row of inserted) {
      const sourceId = sourceIds.get(row.markerId);
      if (sourceId !== undefined) markerIds.set(sourceId, row.id);
    }
  }
  return { markerIds, models, keys: new Set(rows.keys()) };
}

async function copyGroups(tx: Transaction, source: number, destination: number, architecture: ProjectArchitecture | undefined, modelIds: Set<string>, draftGroups?: ThreeDGroup[]) {
  const groups: Pick<ThreeDGroup, 'id' | 'name'>[] = draftGroups ?? await tx.select().from(threedGroups).where(eq(threedGroups.projectId, source));
  const designs = draftGroups
    ? draftGroups.flatMap(group => group.entityIds.map(entityId => ({ groupId: group.id, entityId })))
    : await tx.select().from(threedGroupDesignMembers).where(eq(threedGroupDesignMembers.projectId, source));
  const models = draftGroups
    ? draftGroups.flatMap(group => group.markerIds.map(markerId => ({ groupId: group.id, markerId })))
    : await tx.select().from(threedGroupModelMembers).where(eq(threedGroupModelMembers.projectId, source));
  const doc = architecture?.document;
  const entities = new Set(doc && [...doc.walls, ...doc.floors, ...doc.roofs, ...doc.openings, ...doc.roofOpenings, ...(doc.stairs ?? [])].map(entity => entity.id));
  if (designs.some(member => !entities.has(member.entityId)) || models.some(member => !modelIds.has(member.markerId))) {
    throw new ProjectConfigurationConflict('A ThreeD Group member is missing. Review the Project groups before duplicating.');
  }
  for (const batch of copyBatches(groups)) await tx.insert(threedGroups).values(batch.map(({ id, name }) => ({ projectId: destination, id, name })));
  for (const batch of copyBatches(designs)) await tx.insert(threedGroupDesignMembers).values(batch.map(({ groupId, entityId }) => ({ projectId: destination, groupId, entityId })));
  for (const batch of copyBatches(models)) await tx.insert(threedGroupModelMembers).values(batch.map(({ groupId, markerId }) => ({ projectId: destination, groupId, markerId })));
}

async function copyGroundMap(tx: Transaction, owner: string, source: number, destination: number) {
  const [original] = await tx.select().from(threedGroundMaps)
    .where(and(eq(threedGroundMaps.projectId, source), eq(threedGroundMaps.userId, owner))).for('share');
  const ids = new Map<number, number>();
  if (original) {
    const { id, createdAt, updatedAt, ...image } = original;
    const [copied] = await tx.insert(threedGroundMaps).values({ ...image, projectId: destination }).returning({ id: threedGroundMaps.id });
    ids.set(id, copied.id);
  }
  return ids;
}

async function copyTerrain(tx: Transaction, owner: string, source: number, destination: number, assignments: Assignments, draft?: TerrainPlacementDraft | null) {
  const [saved] = await tx.select().from(projectTerrainPlacements)
    .where(and(eq(projectTerrainPlacements.projectId, source), eq(projectTerrainPlacements.userId, owner)));
  function hasActiveAssignment(placement: TerrainPlacementDraft) {
    return assignments.threeDLinks.some(link => link.threedId === placement.threedId && link.isActive)
      && assignments.assets.some(asset => asset.moduleType === 'threed' && asset.moduleId === placement.threedId && asset.isActive
        && asset.assetType === 'threed_terrains' && asset.assetId === placement.terrainId);
  }
  // A dormant placement is absent from the Scene's active-assignments response.
  // Explicitly removing a visible placement still takes precedence over the old save.
  const placement = draft === undefined || (draft === null && saved && !hasActiveAssignment(saved)) ? saved : draft;
  if (!placement) return;
  if (draft && (draft.id !== (saved?.id ?? null) || !hasActiveAssignment(draft))) {
    throw new ProjectConfigurationConflict('The Terrain placement or assignment changed. Review the source Project before duplicating.');
  }
  const [terrain] = await tx.select({ id: threedTerrains.id }).from(threedTerrains)
    .innerJoin(threedTerrainRevisions, and(eq(threedTerrainRevisions.terrainId, threedTerrains.id), eq(threedTerrainRevisions.revision, placement.terrainRevision)))
    .where(and(eq(threedTerrains.id, placement.terrainId), eq(threedTerrains.userId, owner)));
  if (!terrain) throw new ProjectConfigurationConflict('The selected Terrain revision is unavailable to this Project owner.');
  await tx.insert(projectTerrainPlacements).values({
    userId: owner,
    projectId: destination,
    threedId: await assignments.resolveModule(placement.threedId),
    terrainId: placement.terrainId,
    terrainRevision: placement.terrainRevision,
    centerXM: placement.centerXM,
    centerZM: placement.centerZM,
    rotationYDeg: placement.rotationYDeg,
    scale: placement.scale,
  });
}

/** The caller owns the transaction, source lock, destination Project row and receipt. */
export async function duplicateProjectGraph(tx: Transaction, owner: string, source: Project, destination: number, draft?: ProjectDuplicateDraft) {
  const assignments = await copyProjectAssignments(tx, owner, source.id, destination);
  const markers = await copyMarkers(tx, owner, source, destination, assignments, draft);
  const architecture = draft?.architecture ?? readProjectArchitecture(source.config);
  await copyGroups(tx, source.id, destination, architecture, markers.models, draft?.groups);
  await copyTerrain(tx, owner, source.id, destination, assignments, draft?.terrain);
  const groundMaps = await copyGroundMap(tx, owner, source.id, destination);
  const scenarioIds = new Map<number, number>();
  const scenarios = await tx.select().from(threedScenarios)
    .where(and(eq(threedScenarios.projectId, source.id), eq(threedScenarios.userId, owner)));
  for (const { id, createdAt, updatedAt, ...scenario } of scenarios) {
    let setup;
    try {
      setup = parseScenarioSetup(scenario.setup);
    } catch {
      throw new ProjectConfigurationConflict(`Review the saved setup for Scenario “${scenario.name}” before duplicating this Project.`);
    }
    if (setup?.environmentMarkerId && !markers.keys.has(setup.environmentMarkerId)) {
      throw new ProjectConfigurationConflict('A Scenario environment marker is missing. Review the Scenario before duplicating.');
    }
    const [saved] = await tx.insert(threedScenarios).values({
      ...scenario,
      projectId: destination,
      threedId: await assignments.resolveModule(scenario.threedId),
      setup,
    }).returning({ id: threedScenarios.id });
    scenarioIds.set(id, saved.id);
  }
  const simulations = await tx.select().from(threedSimulations)
    .where(and(eq(threedSimulations.projectId, source.id), eq(threedSimulations.userId, owner)));
  const simulationIds = new Map<number, number>();
  for (const { id, revision, createdAt, updatedAt, ...simulation } of simulations) {
    let definition;
    try {
      definition = parseSimulationDefinition(simulation.definition);
    } catch {
      throw new ProjectConfigurationConflict(`Review the saved Actions and observations for Simulation “${simulation.name}” before duplicating this Project.`);
    }
    if (definition.steps.some(step => !markers.keys.has(step.actorMarkerId) || !markers.keys.has(step.targetMarkerId))) {
      throw new ProjectConfigurationConflict('A Simulation marker is missing. Review the Simulation before duplicating.');
    }
    const [saved] = await tx.insert(threedSimulations).values({
      ...simulation,
      projectId: destination,
      threedId: await assignments.resolveModule(simulation.threedId),
      definition: copySimulationDefinition(definition, markers.markerIds),
    }).returning({ id: threedSimulations.id });
    simulationIds.set(id, saved.id);
  }
  const config = (source.config ?? {}) as Record<string, unknown>;
  let view = draft?.viewState;
  if (!view && config.threeDViewState != null) {
    try {
      view = parseThreeDProjectViewState(config.threeDViewState);
    } catch {
      throw new ProjectConfigurationConflict('The saved workspace could not be read. Review the source Project in the Scene before duplicating.');
    }
  }
  if (view || draft?.architecture) {
    const copy = view ? copyProjectView(view, source.id, destination, assignments.moduleIds, scenarioIds, groundMaps) : undefined;
    await tx.update(project).set({
      config: {
        ...config,
        ...(copy && { threeDViewState: copy }),
        ...(draft?.architecture && { threeDArchitecture: draft.architecture }),
        ...(draft?.viewState.design?.measurementUnits && { measurementUnits: draft.viewState.design.measurementUnits }),
      },
    }).where(and(eq(project.id, destination), eq(project.userId, owner)));
  }
  const designs = await tx.select().from(threedDesigns).where(and(
    eq(threedDesigns.projectId, source.id),
    eq(threedDesigns.userId, owner),
  ));
  const derivedKey = projectDesignCreateKey(owner, source.id);
  const designIds = new Map<number, number>();
  for (const design of designs) {
    if (architecture && design.createKey === derivedKey) continue;
    const [copied] = await tx.insert(threedDesigns).values({
      userId: owner,
      projectId: destination,
      createKey: randomUUID(),
      name: design.name,
      formatVersion: design.formatVersion,
      document: design.document,
    }).returning({ id: threedDesigns.id });
    designIds.set(design.id, copied.id);
  }
  if (architecture) {
    const projectionId = await saveProjectDesignProjection(tx, owner, destination);
    const previous = designs.find(row => row.createKey === derivedKey);
    if (!projectionId) throw new ProjectConfigurationConflict('The copied Project Design could not be confirmed.');
    if (previous) designIds.set(previous.id, projectionId);
  }
  await copyAssociatedAlbums(tx, owner, 'ground_map', groundMaps);
  await copyAssociatedAlbums(tx, owner, 'scenario', scenarioIds);
  await copyAssociatedAlbums(tx, owner, 'simulation', simulationIds);
  await copyAssociatedAlbums(tx, owner, 'design', designIds);
}
