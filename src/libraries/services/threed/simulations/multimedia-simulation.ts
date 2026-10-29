import { isMultimediaAction } from '../multimedia/scene-multimedia-contract';
import { parseSimulationDefinition, type SimulationDefinition } from './simulation-input';
import { captureSoccerSimulation, type SoccerSimulation } from './soccer-simulation-runner';
import type { SoccerSceneContext } from './soccer-simulation-scene';
import { getThreeDActionTargetCapabilities } from '../orchestration/action-target-core';

export function isMultimediaSimulation(definition: SimulationDefinition) {
  return definition.steps.some(step => isMultimediaAction(step.action));
}

export function captureMultimediaSimulation(value: SoccerSimulation, binding: {
  projectId: number;
  threedId?: number
}): SoccerSimulation {
  if (!Number.isSafeInteger(value.id) || value.id <= 0 || !Number.isSafeInteger(value.revision) || value.revision <= 0
    || !value.isActive || value.projectId !== binding.projectId || !Number.isSafeInteger(value.threedId) || value.threedId <= 0 || value.threedId !== binding.threedId) {
    throw Error('Choose an active Simulation in this Project module.');
  }
  const definition = parseSimulationDefinition(value.definition);
  const first = definition.steps[0];
  if (!first || !isMultimediaSimulation(definition) || definition.steps.some(step => !isMultimediaAction(step.action) && step.action !== 'runToTarget')) {
    throw Error('Multimedia Scene runs support Run to target and Multimedia commands.');
  }
  if (definition.steps.some(step => step.actorMarkerId !== first.actorMarkerId || step.targetMarkerId !== first.targetMarkerId)) throw Error('Use one Character and one target object throughout a Multimedia Simulation.');
  return {
    ...value,
    definition
  };
}

export function captureSceneSimulation(value: SoccerSimulation, binding: {
  projectId: number;
  threedId?: number
}) {
  return isMultimediaSimulation(value.definition) ? captureMultimediaSimulation(value, binding) : captureSoccerSimulation(value, binding);
}

export function multimediaSimulationParticipants(simulation: SoccerSimulation, scene: SoccerSceneContext) {
  const first = simulation.definition.steps[0];
  const visible = (id: string) => scene.markers.find(marker => marker.id === id && marker.isActive !== false && marker.isVisible !== false
    && marker.data?.visible !== false && marker.data?.status !== 'inactive' && scene.layers.has(marker.type) && (scene.visibleMarkerIds?.has(marker.id) ?? true));
  const actor = visible(first.actorMarkerId), target = visible(first.targetMarkerId);
  if (!actor || actor.type !== 'characters' || actor.data?.isMovable !== true || !target) throw Error('The saved Character and Multimedia target must be available in the Scene.');
  const capabilities = getThreeDActionTargetCapabilities(target.type);
  const characterId = Number(actor.data?.id), targetId = Number(target.data?.id);
  if (!capabilities || !Number.isSafeInteger(characterId) || characterId <= 0 || !Number.isSafeInteger(targetId) || targetId <= 0
    || scene.markers.filter(marker => marker.type === 'characters' && Number(marker.data?.id) === characterId).length !== 1) throw Error('The participants must identify exact saved Scene instances.');
  const position = scene.position(target.id);
  if (!position || !Object.values(position).every(Number.isFinite)) throw Error('Waiting for the target position.');
  return {
    characterId,
    target: {
      markerId: target.id,
      type: capabilities.markerType,
      id: targetId,
      name: target.name,
      position,
    },
  };
}

export function multimediaSimulationReadiness(simulation: SoccerSimulation, scene: SoccerSceneContext) {
  if (!scene.allowed || !scene.ready || scene.busy || scene.projectId !== simulation.projectId) return 'Wait for this Project Scene and finish placement or editing.';
  try {
    const participants = multimediaSimulationParticipants(simulation, scene);
    const first = simulation.definition.steps[0];
    if (scene.controlledCharacterId !== participants.characterId || !scene.settledCharacters.has(first.actorMarkerId)) return 'Take Control of the saved Character and wait for its body.';
    if (scene.target?.markerId !== first.targetMarkerId) return 'Select the saved Multimedia object as Action Target.';
    if (!scene.position(first.actorMarkerId)) return 'Waiting for the Character position.';
    if (simulation.definition.observations.some(source => !scene.groups.some(group => group.id === source.sensorGroupId)
      || source.sensors?.some(sensor => !scene.sensorMembers.some(member => member.ownerMarkerId === sensor.ownerMarkerId && member.id === sensor.id && member.groupId === source.sensorGroupId)))) return 'A saved observation group or Sensor is unavailable.';
    return null;
  } catch (error) { return error instanceof Error ? error.message : 'Multimedia participants are unavailable.'; }
}
