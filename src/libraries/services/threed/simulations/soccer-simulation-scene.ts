import type { RuntimeMarker, ThreeDActionTarget } from '@/libraries/types/map';
import type { ScenarioStartRequest } from '../scenario-core';
import { isProjectModelMovableBall } from '../models/project-model-instance-core';
import { soccerKickInRange } from '../physics/soccer-kick-core';
import type { ThreeDActionCollisionPointId } from '../physics/action-collision-core';
import type { SensorMember } from '../physics/sensor-counter-core';
import type { SoccerSimulation } from './soccer-simulation-runner';

export type SoccerSceneContext = {
  projectId?: number; scenario: ScenarioStartRequest | null; allowed: boolean; ready: boolean; busy: boolean;
  controlledCharacterId?: number | null; target?: ThreeDActionTarget | null;
  markers: readonly RuntimeMarker[]; layers: ReadonlySet<string>; visibleMarkerIds?: ReadonlySet<string>;
  settledCharacters: ReadonlySet<string>; groups: readonly { id: string; name: string }[];
  sensorMembers: readonly SensorMember[];
  position: (markerId: string) => { x: number; y: number; z: number } | undefined;
  counts: () => Readonly<Record<string, number>>;
};
export type SoccerKickMapping = { action: string; points: readonly ThreeDActionCollisionPointId[] };

export function soccerSimulationReadiness(simulation: SoccerSimulation, scene: SoccerSceneContext, kick: SoccerKickMapping | null): string | null {
  if (!scene.allowed || !scene.ready || scene.busy) return 'Wait for the Scene to be ready and finish placement or editing.';
  const scenario = scene.scenario;
  if (scene.projectId !== simulation.projectId || !scenario || scenario.kind !== 'soccer'
    || scenario.projectId !== simulation.projectId || scenario.scenarioId !== simulation.scenarioId || scenario.threedId !== simulation.threedId) return 'Load and start this Simulation’s Soccer Scenario in its Project.';
  const active = (marker: RuntimeMarker) => marker.isActive !== false && marker.isVisible !== false
    && scene.layers.has(marker.type) && (scene.visibleMarkerIds?.has(marker.id) ?? true);
  if (!scene.markers.some(marker => marker.id === scenario.environmentMarkerId && marker.type === 'models' && active(marker))
    || !scene.groups.some(group => group.id === scenario.groupId)) return 'The Scenario field or Sensor Group is unavailable.';
  if (scene.sensorMembers.filter(member => member.behavior === 'counter' && member.groupId === scenario.groupId).length < 2) return 'The Soccer Scenario needs two assigned goal-entry counters.';
  const first = simulation.definition.steps[0];
  const actor = scene.markers.find(marker => marker.id === first.actorMarkerId && marker.type === 'characters');
  const ball = scene.markers.find(marker => marker.id === first.targetMarkerId && marker.type === 'models');
  if (!actor || !active(actor) || actor.data?.visible === false || actor.data?.status === 'inactive'
    || actor.data?.isMovable !== true || Number(actor.data?.id) !== scene.controlledCharacterId
    || !scene.settledCharacters.has(actor.id)) return 'Take Control of the saved Character and wait for its model and physics body.';
  if (scene.markers.filter(marker => marker.type === 'characters' && Number(marker.data?.id) === scene.controlledCharacterId && active(marker)).length !== 1) return 'The controlled Character must identify one Project instance.';
  if (!ball || !active(ball) || !isProjectModelMovableBall(ball.metadata) || scene.target?.type !== 'models'
    || scene.target.markerId !== ball.id || scene.target.id !== Number(ball.data?.id)) return 'Choose the saved movable ball with Use as Action Target.';
  if (![scene.position(actor.id), scene.position(ball.id)].every(position => position && Object.values(position).every(Number.isFinite))) return 'Waiting for live Character and ball positions.';
  if (actor.data?.model?.metadata?.activeSource === 'shape' && simulation.definition.steps.some(step => step.action === 'kickBall')) return 'Restore the Character’s rig Model before running a foot kick.';
  if (simulation.definition.steps.some(step => step.action === 'kickBall') && (!kick || !kick.points.length)) return 'Assign an active foot-kick Action and wait for its rig animation to load.';
  if (simulation.definition.observations.some(source => !scene.groups.some(group => group.id === source.sensorGroupId))) return 'A saved observation Sensor Group is unavailable.';
  return null;
}

export function soccerSimulationKickReady(simulation: SoccerSimulation, scene: SoccerSceneContext): boolean {
  const step = simulation.definition.steps[0], actor = scene.position(step.actorMarkerId), ball = scene.position(step.targetMarkerId);
  return !!actor && !!ball && soccerKickInRange(actor, ball);
}

export type SimulationSensorObservation = { groupId: string; name: string; baseline: number; final: number; delta: number;
  events: number; truncated: boolean; countersReset: boolean };
/** Run-window observations are not claims that the kick caused a goal. No counters are reset. */
export function simulationSensorSnapshot(simulation: SoccerSimulation, scene: SoccerSceneContext): SimulationSensorObservation[] {
  const counts = scene.counts();
  return simulation.definition.observations.map(source => {
    const total = scene.sensorMembers.filter(member => member.behavior === 'counter' && member.groupId === source.sensorGroupId)
      .reduce((sum, member) => sum + (counts[`${member.ownerMarkerId}:${member.id}`] ?? 0), 0);
    return { groupId: source.sensorGroupId, name: scene.groups.find(group => group.id === source.sensorGroupId)?.name ?? source.sensorGroupId,
      baseline: total, final: total, delta: 0, events: 0, truncated: false, countersReset: false };
  });
}
