import { and, asc, eq } from 'drizzle-orm';
import type { db, Transaction } from '@/libraries/db/client';
import { project, projectThreed, projectThreedMarkers } from '@/libraries/schema/project';
import { threed } from '@/libraries/schema/threed';
import { SimulationInputError, type SimulationDefinition } from '@/libraries/services/threed/simulations/simulation-input';
import { THREED_PLANTING_TARGET_ACTIONS } from '@/libraries/services/threed/orchestration/action-target-core';
import { readSensorGroups } from '@/libraries/services/threed/physics/sensor-group-core';
import { IMPORTED_SENSOR_GROUP, readModelVolumeSensor } from '@/libraries/services/threed/physics/sensor-legacy-compat';
import { readPhysicsSensorCuboids } from '@/libraries/services/threed/physics/sensor-cuboid-core';
import { isProjectModelMovableBall } from '@/libraries/services/threed/models/project-model-instance-core';
import { simulationMarkerPreview } from '@/libraries/services/threed/simulations/simulation-preview-contract';
import { isMultimediaAction } from '@/libraries/services/threed/multimedia/scene-multimedia-contract';
import { readSceneMultimedia } from '@/libraries/services/threed/multimedia/scene-multimedia-read';

type Client = Pick<typeof db, 'select'>;
export async function simulationReferenceChoices(client: Client, userId: string, projectId: number, threedId: number) {
  const [assigned] = await client.select({ metadata: project.metadata }).from(projectThreed)
    .innerJoin(project, eq(project.id, projectThreed.projectId)).innerJoin(threed, eq(threed.id, projectThreed.threedId))
    .where(and(eq(projectThreed.userId, userId), eq(projectThreed.projectId, projectId), eq(projectThreed.threedId, threedId), eq(project.userId, userId), eq(threed.userId, userId))).limit(1);
  if (!assigned) return null;
  const markerRows = await client.select({ id: projectThreedMarkers.id, markerId: projectThreedMarkers.markerId, markerType: projectThreedMarkers.markerType, name: projectThreedMarkers.name,
    sourceAssetId: projectThreedMarkers.sourceAssetId, positionX: projectThreedMarkers.positionX, positionY: projectThreedMarkers.positionY, positionZ: projectThreedMarkers.positionZ,
    isVisible: projectThreedMarkers.isVisible, data: projectThreedMarkers.data, metadata: projectThreedMarkers.metadata }).from(projectThreedMarkers)
    .where(and(eq(projectThreedMarkers.userId, userId), eq(projectThreedMarkers.projectId, projectId), eq(projectThreedMarkers.threedId, threedId), eq(projectThreedMarkers.isActive, true))).orderBy(asc(projectThreedMarkers.name));
  const metadata = (assigned.metadata ?? {}) as Record<string, unknown>;
  const groups = readSensorGroups(metadata.physicsSensorGroups ?? []);
  if (!groups.some(group => group.id === IMPORTED_SENSOR_GROUP.id)) groups.unshift(IMPORTED_SENSOR_GROUP);
  const markers = markerRows.map(row => ({ markerId: row.markerId, markerType: row.markerType, name: row.name,
    movableCharacter: row.markerType === 'characters' && (row.data as Record<string, unknown> | null)?.isMovable === true,
    movableBall: row.markerType === 'models' && isProjectModelMovableBall(row.metadata), preview: simulationMarkerPreview(row) }));
  const sensors = markerRows.flatMap(row => {
    if (!Number.isSafeInteger(row.id) || row.id <= 0) return [];
    const metadata = row.metadata as Record<string, unknown> | null;
    const volume = row.markerType === 'models' && !isProjectModelMovableBall(metadata) && metadata?.placementRole !== 'environment' ? readModelVolumeSensor(metadata) : null;
    return [...readPhysicsSensorCuboids(metadata), ...(volume ? [volume] : [])].map(sensor => ({ ownerMarkerId: row.id, id: sensor.id,
      name: sensor.name, ownerName: row.name, groupId: sensor.groupId, behavior: sensor.behavior }));
  });
  return { markers, groups, sensors };
}
export async function validateSimulationReferences(tx: Transaction, options: NonNullable<Awaited<ReturnType<typeof simulationReferenceChoices>>>, definition: SimulationDefinition, projectId: number, userId: string) {
  const multimedia = definition.steps.some(step => isMultimediaAction(step.action));
  for (const step of definition.steps) {
    if (!options.markers.some(row => row.markerId === step.actorMarkerId && row.markerType === 'characters')) throw new SimulationInputError('Choose an active Character marker from this Project module.');
    const target = options.markers.find(row => row.markerId === step.targetMarkerId);
    if (!target || (THREED_PLANTING_TARGET_ACTIONS.includes(step.action as typeof THREED_PLANTING_TARGET_ACTIONS[number]) && target.markerType !== 'plantings')) throw new SimulationInputError('Choose a compatible active target from this Project module.');
    if (isMultimediaAction(step.action) || (multimedia && step.action === 'runToTarget')) {
      if (!options.markers.some(row => row.markerId === step.actorMarkerId && row.movableCharacter)) throw new SimulationInputError('Multimedia Actions require a saved movable Character.');
    } else if (step.action === 'runToTarget' || step.action === 'kickBall') {
      if (!options.markers.some(row => row.markerId === step.actorMarkerId && row.movableCharacter) || !target.movableBall) throw new SimulationInputError('Soccer Actions require a movable Character and movable ball from this Project module.');
    }
  }
  if (definition.observations.some(source => !options.groups.some(group => group.id === source.sensorGroupId))) throw new SimulationInputError('Choose a Sensor Group from this Project.');
  for (const source of definition.observations) {
    if (source.sensors?.some(sensor => !options.sensors.some(choice => choice.ownerMarkerId === sensor.ownerMarkerId && choice.id === sensor.id && choice.groupId === source.sensorGroupId))) throw new SimulationInputError('Choose Sensors assigned to the selected Project group.');
  }
  const media = new Map(definition.steps.filter(step => step.multimedia).map(step => [`${step.actorMarkerId}:${step.targetMarkerId}:${step.multimedia!.albumId}:${step.multimedia!.trackId ?? ''}`, step]));
  for (const step of media.values()) {
    try {
      const data = await readSceneMultimedia({ projectId, markerId: step.targetMarkerId, actorMarkerId: step.actorMarkerId, albumId: step.multimedia!.albumId, trackId: step.multimedia!.trackId ?? null, offset: 0 }, userId, tx);
      if (step.multimedia!.trackId && !data.tracks.some(track => track.id === step.multimedia!.trackId)) throw Error('Track unavailable.');
    } catch { throw new SimulationInputError('The selected Album or Track is not available for this target in the Project.'); }
  }
}
