import assert from 'node:assert/strict';
import { copyProjectView, copySimulationDefinition } from '../services/project/duplicate-project-identity';
import { defaultDesignWorkspace, emptyProjectScenarioPanelState, type ThreeDProjectViewState } from '../services/threed/markers/project-view-state-core';
import { DEFAULT_PROJECT_GROUND_MAP_TRANSFORM } from '../services/threed/ground-maps/project-ground-map-core';
import type { SimulationDefinition } from '../services/threed/simulations/simulation-input';

const source: ThreeDProjectViewState = {
  version: 1,
  savedAt: '2026-11-25T12:00:00Z',
  viewMode: 'design',
  panelHeight: 50,
  cameraMode: 'stationary',
  design: {
    ...defaultDesignWorkspace(),
    sections: {
      'threed:details:v1:design:18:selected-properties': true,
      'threed:details:v1:assets:18:multimedia': false,
      'threed:details:v1:18:models:models-wall:asset:physics': true,
      'threed:details:v1:design:180:levels': false,
    },
  },
  scenario: {
    ...emptyProjectScenarioPanelState(),
    selected: {
      id: 7,
      projectId: 18,
      threedId: 14,
      name: 'Practice',
      threedName: 'Home',
      setup: null,
    },
  },
  threeD: {
    cameraPosition: { x: 0, y: 1, z: 2 },
    cameraTarget: { x: 0, y: 0, z: 0 },
    activeLayers: ['models'],
    environment: 'default-daylight',
    autoRotate: false,
    showGrid: true,
    showGizmo: false,
    groundMap: {
      ...DEFAULT_PROJECT_GROUND_MAP_TRANSFORM,
      groundMapId: 4,
    },
    sensorState: {
      version: 1,
      projectId: 18,
      counts: { '27:goal': 9 },
      occupied: ['27:goal|marker:27'],
    },
    scenarioRuntime: {
      projectId: 18,
      instructionVisible: true,
      sensorsVisible: true,
      active: {
        projectId: 18,
        name: 'Practice',
        kind: 'soccer',
        environmentName: 'Field',
        groupId: 'goals',
        groupName: 'Goals',
        scenarioId: 7,
        threedId: 14,
        environmentMarkerId: 'models-wall',
      },
    },
  },
};

const modules = new Map([[14, 15]]);
const scenarios = new Map([[7, 9]]);
const maps = new Map([[4, 5]]);
const original = structuredClone(source);
const copied = copyProjectView(source, 18, 110, modules, scenarios, maps);
assert.deepEqual(source, original);
assert.equal(copied.scenario?.selected?.projectId, 110);
assert.equal(copied.scenario.selected.threedId, 15);
assert.equal(copied.scenario.selected.id, 9);
assert.equal(copied.threeD?.scenarioRuntime?.projectId, 110);
assert.equal(copied.threeD.scenarioRuntime.active?.projectId, 110);
assert.equal(copied.threeD.scenarioRuntime.active.threedId, 15);
assert.equal(copied.threeD.scenarioRuntime.active.scenarioId, 9);
assert.equal(copied.threeD.scenarioRuntime.active.environmentMarkerId, 'models-wall');
assert.equal(copied.threeD.groundMap?.groundMapId, 5);
assert.equal(copied.threeD.sensorState, undefined);
assert.deepEqual(copied.design?.sections, {
  'threed:details:v1:design:110:selected-properties': true,
  'threed:details:v1:assets:110:multimedia': false,
  'threed:details:v1:110:models:models-wall:asset:physics': true,
  'threed:details:v1:design:180:levels': false,
});
assert.throws(() => copyProjectView(source, 19, 110, modules, scenarios, maps), /another Project/);
assert.throws(() => copyProjectView(source, 18, 110, modules, new Map(), maps), /selected Scenario/);
assert.throws(() => copyProjectView(source, 18, 110, modules, scenarios, new Map()), /Ground Map/);

const definition: SimulationDefinition = {
  version: 1,
  steps: [],
  observations: [{
    id: 'home',
    kind: 'sensor-group',
    sensorGroupId: 'goals',
    sensors: [{ ownerMarkerId: 27, id: 'goal' }],
  }],
};
const observation = copySimulationDefinition(definition, new Map([[27, 103]])).observations[0];
assert.deepEqual(observation.sensors, [{ ownerMarkerId: 103, id: 'goal' }]);
assert.equal(definition.observations[0].sensors?.[0].ownerMarkerId, 27);
assert.throws(() => copySimulationDefinition(definition, new Map()), /Simulation Sensor owner/);
console.log('PASS: Project copy preserves stable IDs and remaps Scenario, Module, Ground Map, Sensor and workspace references.');
