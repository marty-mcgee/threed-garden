import { ProjectConfigurationConflict } from './configuration';
import type { ThreeDProjectViewState } from '../threed/markers/project-view-state-core';
import type { SimulationDefinition } from '../threed/simulations/simulation-input';

export function copiedId(mapping: ReadonlyMap<number, number>, original: number | null, label: string): number {
  const id = original === null ? undefined : mapping.get(original);
  if (id === undefined) throw new ProjectConfigurationConflict(`The Project has a missing ${label} reference. Review it before duplicating.`);
  return id;
}

export function copySimulationDefinition(definition: SimulationDefinition, markerIds: ReadonlyMap<number, number>): SimulationDefinition {
  return {
    ...definition,
    observations: definition.observations.map(observation => ({
      ...observation,
      ...(observation.sensors && {
        sensors: observation.sensors.map(sensor => ({
          ...sensor,
          ownerMarkerId: copiedId(markerIds, sensor.ownerMarkerId, 'Simulation Sensor owner'),
        })),
      }),
    })),
  };
}

export function copyProjectView(
  original: ThreeDProjectViewState,
  source: number,
  destination: number,
  modules: ReadonlyMap<number, number>,
  scenarios: ReadonlyMap<number, number>,
  groundMaps: ReadonlyMap<number, number>,
): ThreeDProjectViewState {
  const view = structuredClone(original);
  const selected = view.scenario?.selected;
  const runtime = view.threeD?.scenarioRuntime;
  const active = runtime?.active;
  for (const binding of [selected, runtime, active, view.threeD?.sensorState]) {
    if (binding && binding.projectId !== source) {
      throw new ProjectConfigurationConflict('A saved workspace reference belongs to another Project. Review the Scene before duplicating.');
    }
  }
  if (selected) {
    selected.projectId = destination;
    selected.id = copiedId(scenarios, selected.id, 'selected Scenario');
    if (selected.threedId !== undefined) selected.threedId = copiedId(modules, selected.threedId, 'Scenario ThreeD Module');
  }
  if (runtime) runtime.projectId = destination;
  if (active) {
    active.projectId = destination;
    if (active.scenarioId !== undefined) active.scenarioId = copiedId(scenarios, active.scenarioId, 'open Scenario');
    if (active.threedId !== undefined) active.threedId = copiedId(modules, active.threedId, 'open Scenario ThreeD Module');
  }
  if (view.threeD) {
    delete view.threeD.sensorState;
    const groundMap = view.threeD.groundMap;
    if (groundMap && groundMap.groundMapId !== null) groundMap.groundMapId = copiedId(groundMaps, groundMap.groundMapId, 'Ground Map');
  }
  if (view.design) {
    const scopes = new Map(['design:', 'assets:', ''].map(scope => [
      `threed:details:v1:${scope}${source}:`,
      `threed:details:v1:${scope}${destination}:`,
    ]));
    view.design.sections = Object.fromEntries(Object.entries(view.design.sections).map(([key, open]) => {
      for (const [from, to] of scopes) {
        if (key.startsWith(from)) return [to + key.slice(from.length), open];
      }
      return [key, open];
    }));
  }
  return view;
}
