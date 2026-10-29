import { NextRequest, NextResponse } from 'next/server';
import { and, asc, eq, inArray, or, sql } from 'drizzle-orm';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { projectAssets, projectThreed, projectThreedMarkers } from '@/libraries/schema/project';
import { threed, threedSimulations, threedAnimationActionSlots,
  threedCharacters, threedModels, threedCharacterAnimationAssignments, threedModelAnimationAssignments } from '@/libraries/schema/threed';
import { readableProject } from '@/libraries/services/project/read-access';
import { simulationId, SimulationInputError } from '@/libraries/services/threed/simulations/simulation-input';
import { captureSceneSimulation as captureSoccerSimulation, isMultimediaSimulation } from '@/libraries/services/threed/simulations/multimedia-simulation';
import { readSceneMultimedia, SceneMultimediaReadError } from '@/libraries/services/threed/multimedia/scene-multimedia-read';
import { readSensorGroups, SensorGroupInputError } from '@/libraries/services/threed/physics/sensor-group-core';
import { IMPORTED_SENSOR_GROUP } from '@/libraries/services/threed/physics/sensor-legacy-compat';
import { defaultKickCollisionPoints } from '@/libraries/services/threed/physics/action-collision-core';
import { isProjectModelMovableBall } from '@/libraries/services/threed/models/project-model-instance-core';

const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });

/** Publication permits local execution of assigned active Soccer definitions, never owner CRUD/results. */
export async function GET(request: NextRequest) {
  try {
    const params = new URL(request.url).searchParams;
    const projectId = simulationId(params.get('projectId'), 'Project ID');
    const session = await auth();
    const accessible = await readableProject(projectId, session?.user?.id);
    if (!accessible?.userId) return reply({ success: false, error: 'Project not found.' }, 404);
    const owner = accessible.userId, single = params.has('id');
    if (params.has('scenarioId')) throw new SimulationInputError('Scenario filters are not supported for Simulations.');
    const offset = params.get('offset') ?? '0';
    if (!/^\d+$/.test(offset) || Number(offset) > 1_000_000) throw new SimulationInputError('Invalid pagination.');
    const where = and(eq(threedSimulations.userId, owner), eq(threedSimulations.projectId, projectId), eq(threedSimulations.isActive, true),
      eq(projectThreed.userId, owner), eq(projectThreed.isActive, true), eq(threed.userId, owner), eq(threed.isActive, true),
      sql`jsonb_array_length(${threedSimulations.definition}->'steps') > 0 AND NOT EXISTS (
        SELECT 1 FROM jsonb_array_elements(${threedSimulations.definition}->'steps') AS step
        WHERE step->>'action' NOT IN ('runToTarget', 'kickBall', 'playMultimedia', 'pauseMultimedia', 'stopMultimedia', 'rewindMultimedia', 'nextTrack')
          OR step->>'actorMarkerId' <> ${threedSimulations.definition}->'steps'->0->>'actorMarkerId'
          OR step->>'targetMarkerId' <> ${threedSimulations.definition}->'steps'->0->>'targetMarkerId')
        AND NOT (
          EXISTS (SELECT 1 FROM jsonb_array_elements(${threedSimulations.definition}->'steps') AS step WHERE step->>'action' = 'kickBall')
          AND EXISTS (SELECT 1 FROM jsonb_array_elements(${threedSimulations.definition}->'steps') AS step WHERE step->>'action' IN ('playMultimedia', 'pauseMultimedia', 'stopMultimedia', 'rewindMultimedia', 'nextTrack'))
        )`,
      single ? eq(threedSimulations.id, simulationId(params.get('id'), 'Simulation ID')) : undefined);
    const query = (fields: Parameters<typeof db.select>[0]) => db.select(fields).from(threedSimulations)
      .innerJoin(projectThreed, and(eq(projectThreed.projectId, threedSimulations.projectId), eq(projectThreed.threedId, threedSimulations.threedId)))
      .innerJoin(threed, eq(threed.id, threedSimulations.threedId)).where(where);
    if (!single) {
      const rows = await query({ id: threedSimulations.id, name: threedSimulations.name })
        .orderBy(asc(threedSimulations.name), asc(threedSimulations.id)).limit(25).offset(Number(offset));
      const [count] = await query({ total: sql<number>`count(*)` });
      return reply({ success: true, data: rows, pagination: { total: Number(count?.total ?? 0), limit: 25, offset: Number(offset) } });
    }
    const [row] = await query({ id: threedSimulations.id, name: threedSimulations.name, revision: threedSimulations.revision,
      projectId: threedSimulations.projectId, threedId: threedSimulations.threedId,
      isActive: threedSimulations.isActive, definition: threedSimulations.definition }).limit(1);
    if (!row) return reply({ success: false, error: 'Simulation not found.' }, 404);
    const simulation = captureSoccerSimulation(row as unknown as Parameters<typeof captureSoccerSimulation>[0],
      { projectId, threedId: Number(row.threedId) });
    const markers = await db.select({ markerId: projectThreedMarkers.markerId, markerType: projectThreedMarkers.markerType,
      sourceAssetId: projectThreedMarkers.sourceAssetId, data: projectThreedMarkers.data, metadata: projectThreedMarkers.metadata, name: projectThreedMarkers.name }).from(projectThreedMarkers)
      .innerJoin(projectAssets, and(eq(projectAssets.assetId, projectThreedMarkers.sourceAssetId), eq(projectAssets.projectId, projectId),
        eq(projectAssets.moduleType, 'threed'), eq(projectAssets.moduleId, simulation.threedId), eq(projectAssets.userId, owner), eq(projectAssets.isActive, true),
        or(and(eq(projectThreedMarkers.markerType, 'characters'), eq(projectAssets.assetType, 'threed_characters')),
          and(eq(projectThreedMarkers.markerType, 'models'), eq(projectAssets.assetType, 'threed_models')),
          and(eq(projectThreedMarkers.markerType, 'beds'), eq(projectAssets.assetType, 'threed_beds')),
          and(eq(projectThreedMarkers.markerType, 'farmbots'), eq(projectAssets.assetType, 'threed_farmbots')),
          and(eq(projectThreedMarkers.markerType, 'plantings'), eq(projectAssets.assetType, 'threed_plantings')))))
      .where(and(eq(projectThreedMarkers.userId, owner), eq(projectThreedMarkers.projectId, projectId), eq(projectThreedMarkers.threedId, simulation.threedId), eq(projectThreedMarkers.isActive, true)));
    const first = simulation.definition.steps[0];
    if (isMultimediaSimulation(simulation.definition)) {
      if (!markers.some(marker => marker.markerId === first.actorMarkerId && marker.markerType === 'characters' && (marker.data as { isMovable?: boolean })?.isMovable === true)
        || !markers.some(marker => marker.markerId === first.targetMarkerId)) return reply({ success: false, error: 'Saved Multimedia participants are unavailable.' }, 409);
      const groups = [IMPORTED_SENSOR_GROUP, ...readSensorGroups((accessible.metadata as { physicsSensorGroups?: unknown } | null)?.physicsSensorGroups ?? [])];
      if (simulation.definition.observations.some(source => !groups.some(group => group.id === source.sensorGroupId))) return reply({ success: false, error: 'A saved observation group is unavailable.' }, 409);
      const choices = new Map(simulation.definition.steps.filter(step => step.multimedia).map(step => [`${step.multimedia!.albumId}:${step.multimedia!.trackId ?? ''}`, step.multimedia!]));
      for (const selection of choices.values()) {
        const available = await readSceneMultimedia({ projectId, markerId: first.targetMarkerId, actorMarkerId: first.actorMarkerId, albumId: selection.albumId, trackId: selection.trackId ?? null, offset: 0 }, session?.user?.id);
        if (selection.trackId && !available.tracks.some(track => track.id === selection.trackId)) return reply({ success: false, error: 'A Multimedia Track is unavailable.' }, 409);
      }
      return reply({ success: true, data: { simulation, kickMappings: [] } });
    }
    if (!markers.some(marker => marker.markerId === first.actorMarkerId && marker.markerType === 'characters' && (marker.data as { isMovable?: boolean })?.isMovable === true)
      || !markers.some(marker => marker.markerId === first.targetMarkerId && marker.markerType === 'models' && isProjectModelMovableBall(marker.metadata))) return reply({ success: false, error: 'Saved Simulation participants are unavailable.' }, 409);
    const groups = [IMPORTED_SENSOR_GROUP, ...readSensorGroups((accessible.metadata as { physicsSensorGroups?: unknown } | null)?.physicsSensorGroups ?? [])];
    if (simulation.definition.observations.some(source => !groups.some(group => group.id === source.sensorGroupId))) return reply({ success: false, error: 'A saved observation group is unavailable.' }, 409);
    const actor = markers.find(marker => marker.markerId === first.actorMarkerId)!;
    const own = await db.select({ actionKey: threedCharacterAnimationAssignments.actionKey }).from(threedCharacterAnimationAssignments)
      .where(and(eq(threedCharacterAnimationAssignments.userId, owner), eq(threedCharacterAnimationAssignments.characterId, actor.sourceAssetId!)));
    const inherited = await db.select({ actionKey: threedModelAnimationAssignments.actionKey }).from(threedCharacters)
      .innerJoin(threedModels, eq(threedModels.id, threedCharacters.modelId))
      .innerJoin(threedModelAnimationAssignments, and(eq(threedModelAnimationAssignments.modelId, threedModels.id), eq(threedModelAnimationAssignments.userId, threedModels.userId)))
      .where(and(eq(threedCharacters.userId, owner), eq(threedCharacters.id, actor.sourceAssetId!)));
    const keys = [...new Set([...own, ...inherited].map(row => row.actionKey))];
    const slots = keys.length ? await db.select({ actionKey: threedAnimationActionSlots.actionKey, name: threedAnimationActionSlots.name })
      .from(threedAnimationActionSlots).where(and(eq(threedAnimationActionSlots.userId, owner), eq(threedAnimationActionSlots.isActive, true), inArray(threedAnimationActionSlots.actionKey, keys))) : [];
    const kickMappings = slots.flatMap(slot => { const points = defaultKickCollisionPoints(slot.name); return points.length ? [{ action: slot.actionKey, points }] : []; });
    return reply({ success: true, data: { simulation, kickMappings } });
  } catch (cause) {
    if (cause instanceof SceneMultimediaReadError) return reply({ success: false, error: 'Project Multimedia for this Simulation is unavailable.' }, cause.status);
    const invalid = cause instanceof SimulationInputError || cause instanceof SensorGroupInputError;
    return reply({ success: false, error: invalid ? cause.message : 'Project Simulation unavailable.' }, invalid ? 400 : 500);
  }
}
