import type { SoccerKickMapping, SoccerSceneContext } from './soccer-simulation-scene';
import { captureSoccerSimulation, type SoccerSimulation } from './soccer-simulation-runner';
import { isProjectModelMovableBall } from '../models/project-model-instance-core';

export type SimulationLaunch = { simulation: SoccerSimulation; kickMappings: SoccerKickMapping[] };
export type SimulationLaunchSummary = { id: number; name: string };

/** Never substitute another Character or ball for a saved participant. */
export function simulationLaunchParticipants(launch: SimulationLaunch, scene: SoccerSceneContext) {
  if (!scene.allowed || !scene.ready || scene.busy) throw new Error('Finish placement or editing and wait for the Scene before running.');
  const simulation = captureSoccerSimulation(launch.simulation, { projectId: scene.projectId!, threedId: launch.simulation.threedId });
  const first = simulation.definition.steps[0];
  const visible = (id: string, type: string) => scene.markers.find(marker => marker.id === id && marker.type === type
    && marker.isActive !== false && marker.isVisible !== false && scene.layers.has(type) && (scene.visibleMarkerIds?.has(id) ?? true));
  const actor = visible(first.actorMarkerId, 'characters'), ball = visible(first.targetMarkerId, 'models');
  if (!actor || actor.data?.isMovable !== true || actor.data?.visible === false || actor.data?.status === 'inactive'
    || !Number.isSafeInteger(Number(actor.data?.id)) || Number(actor.data?.id) <= 0 || !ball
    || !Number.isSafeInteger(Number(ball.data?.id)) || Number(ball.data?.id) <= 0 || !isProjectModelMovableBall(ball.metadata)) throw new Error('The saved Character and ball must be visible and available in this Scene.');
  if (scene.markers.filter(marker => marker.type === 'characters' && Number(marker.data?.id) === Number(actor.data.id)).length !== 1) throw new Error('The saved Character must identify one Project instance.');
  const position = scene.position(ball.id);
  if (!position || !Object.values(position).every(Number.isFinite)) throw new Error('Waiting for the saved ball’s live position.');
  return { characterId: Number(actor.data.id), target: { markerId: ball.id, type: 'models' as const, id: Number(ball.data.id), name: ball.name, position } };
}
