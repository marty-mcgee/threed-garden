import assert from 'node:assert/strict';
import {
  THREED_RUNTIME_MARKER_MODULE_TYPES,
  ThreeDRuntimeMarkerRegistry,
  ThreeDRuntimeMarkerRegistryError,
  createThreeDRuntimeMarkerKey,
  normalizeThreeDRuntimeMarkerModuleType,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/markers/runtime-marker-core.ts';
import {
  buildThreeDRuntimeMarkerResult,
  buildThreeDRuntimeMarkers,
  createThreeDRuntimeMarkerRegistrations,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/markers/runtime-marker-builder.ts';
import {
  MAX_PROJECT_MARKER_SNAPSHOT_ROWS,
  ProjectMarkerSnapshotError,
  parseProjectThreeDMarkerSnapshot,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/markers/project-marker-snapshot-core.ts';
import {
  calculateThreeDModelGroundedY,
  calculateThreeDModelInstanceScale,
  calculateThreeDModelFitMultiplier,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/markers/model-visual-fit-core.ts';
import {
  parseCreateProjectModelInstance,
  parseUpdateProjectModelInstance,
  ProjectModelInstanceInputError,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/models/project-model-instance-core.ts';
import {
  parseCreateProjectBedPlacement,
  parseUpdateProjectBedPlacement,
  ProjectBedPlacementInputError,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/beds/project-bed-placement-core.ts';
import {
  parseCreateProjectFarmBotPlacement,
  parseUpdateProjectFarmBotPlacement,
  ProjectFarmBotPlacementInputError,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/farmbot/project-farmbot-placement-core.ts';
import {
  parseCreateProjectPlantingPlacement,
  calculateProjectPlantingVisualPositions,
  parseUpdateProjectPlantingPlacement,
  ProjectPlantingPlacementInputError,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/plantings/project-planting-placement-core.ts';
import {
  createProjectCharacterSpawnKey,
  parseCreateProjectCharacterPlacement,
  parseUpdateProjectCharacterPlacement,
  ProjectCharacterPlacementInputError,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/characters/project-character-placement-core.ts';
import {
  resolveThreeDCharacterLibraryAccess,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/characters/character-library-access-core.ts';
import {
  applyThreeDProjectClientTransaction,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/markers/project-marker-client-state-core.ts';
import {
  DEFAULT_THREED_METERS_PER_SCENE_UNIT,
  calibrateThreeDGeographicOrigin,
  geographicPositionToProjectLocalPosition,
  mapPositionToProjectPlanPosition,
  projectLocalPositionToGeographicPosition,
  projectPlanPositionToMapPosition,
  ThreeDMapCoordinateError,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/markers/map-coordinate-core.ts';

let completedValidationSteps = 0;
function validationStep(label: string): void {
  completedValidationSteps += 1;
  console.log(`  ✓ ${label}`);
}

console.log('\nThreeD Runtime Marker registry validation');
console.log('─'.repeat(42));

assert.deepEqual(parseCreateProjectCharacterPlacement({
  markerType: 'characters',
  projectId: 5,
  threedId: 2,
  characterId: 9,
  positionX: 4,
  positionY: 0,
  positionZ: -6,
  rotation: 90,
  scaleMultiplier: 1.25,
}), {
  markerType: 'characters',
  projectId: 5,
  threedId: 2,
  characterId: 9,
  positionX: 4,
  positionY: 0,
  positionZ: -6,
  rotation: 90,
  scaleMultiplier: 1.25,
});
assert.deepEqual(parseUpdateProjectCharacterPlacement({
  markerType: 'characters',
  positionX: 8,
  positionY: 0.5,
  positionZ: 3,
  rotation: -45,
  scaleMultiplier: 0.8,
}), {
  markerType: 'characters',
  positionX: 8,
  positionY: 0.5,
  positionZ: 3,
  rotation: -45,
  scaleMultiplier: 0.8,
});
assert.equal(
  createProjectCharacterSpawnKey({ x: 1, y: 2, z: 3 }),
  createProjectCharacterSpawnKey({ x: 1.0000001, y: 2, z: 3 }),
);
assert.throws(
  () => parseCreateProjectCharacterPlacement({
    markerType: 'characters',
    projectId: 5,
    threedId: 2,
    characterId: 9,
    positionX: Number.NaN,
    positionY: 0,
    positionZ: 0,
  }),
  ProjectCharacterPlacementInputError,
);
validationStep('Project Character placement inputs and spawn identity remain bounded');

const clientState = {
  traffic: {
    raw: null,
    total: 0,
    chpCadCount: 0,
    chpCasesCount: 0,
    chpCentersCount: 0,
    caltransClosuresCount: 0,
    caltransCctvCount: 0,
    caltransDistrictsCount: 0,
    bayArea511Count: 0,
    calfireIncidentsCount: 0,
  },
  threed: {
    raw: {
      plants: [],
      beds: [{ id: 8, name: 'Stable Bed' }],
      characters: [],
      layers: [],
      farmbots: [],
      models: [],
      plantings: [{ id: 12, name: 'Sunflower' }],
      tasks: [],
      harvests: [],
      weatherLogs: [],
      projectThreedMarkers: [{
        id: 91,
        markerType: 'plantings' as const,
        sourceAssetId: 12,
        markerId: 'plantings-12',
        name: 'Sunflower',
        positionX: '1.000',
        positionY: '0.000',
        positionZ: '2.000',
        positionSource: 'asset' as const,
        color: '#22c55e',
        icon: '🌱',
        label: 'Sunflower',
        isVisible: true,
        isActive: true,
        data: { modelScale: 1, preserved: true },
        metadata: { source: 'project-marker' },
      }],
    },
    total: 2,
    plantsCount: 0,
    bedsCount: 1,
    charactersCount: 0,
    markersCount: 1,
    layersCount: 0,
    farmbotsCount: 0,
    plantingsCount: 1,
    tasksCount: 0,
    harvestsCount: 0,
    weatherLogsCount: 0,
    layers: [],
  },
};
const stableBeds = clientState.threed.raw.beds;
const updatedClientState = applyThreeDProjectClientTransaction(clientState, {
  markers: {
    upsert: [{
      ...clientState.threed.raw.projectThreedMarkers[0],
      positionZ: '9.000',
      data: { modelScale: 1.5 },
    }],
  },
  sources: {
    plantings: {
      upsert: [{ id: 12, name: 'Sunflower Updated' }, { id: 13, name: 'Tomato' }],
    },
  },
});
assert.equal(updatedClientState.threed.raw?.beds, stableBeds);
assert.equal(updatedClientState.threed.raw?.projectThreedMarkers?.length, 1);
assert.equal(updatedClientState.threed.raw?.projectThreedMarkers?.[0].positionZ, '9.000');
assert.deepEqual(updatedClientState.threed.raw?.projectThreedMarkers?.[0].data, {
  modelScale: 1.5,
  preserved: true,
});
assert.equal(updatedClientState.threed.raw?.plantings.length, 2);
assert.equal(updatedClientState.threed.plantingsCount, 2);
const removedClientState = applyThreeDProjectClientTransaction(updatedClientState, {
  markers: { removeRecordIds: [91] },
  sources: { plantings: { removeIds: [12] } },
});
assert.equal(removedClientState.threed.raw?.projectThreedMarkers?.length, 0);
assert.deepEqual(removedClientState.threed.raw?.plantings.map((record) => record.id), [13]);
assert.equal(removedClientState.threed.markersCount, 0);
assert.equal(removedClientState.threed.plantingsCount, 1);
const replacedClientState = applyThreeDProjectClientTransaction(updatedClientState, {
  markers: {
    replace: [{
      ...updatedClientState.threed.raw!.projectThreedMarkers![0],
      id: 501,
    }],
  },
});
assert.equal(replacedClientState.threed.raw?.projectThreedMarkers?.length, 1);
assert.equal(replacedClientState.threed.raw?.projectThreedMarkers?.[0].id, 501);
validationStep('Project marker and Sub-Module client state update in one transaction');

const ecctrlLibraryAccess = resolveThreeDCharacterLibraryAccess({
  id: 9,
  isActive: true,
  status: 'active',
  visible: true,
  isMovable: true,
  modelId: 11,
}, {
  id: 11,
  isActive: true,
  status: 'active',
  usedByCharacters: true,
  filePath: '/characters/farmer.fbx',
});
assert.deepEqual(ecctrlLibraryAccess, {
  eligible: true,
  runtime: 'ecctrl',
  issues: [],
});

const gardenLibraryAccess = resolveThreeDCharacterLibraryAccess({
  id: 10,
  isActive: true,
  status: 'active',
  visible: true,
  isMovable: false,
  modelId: 12,
}, {
  id: 12,
  isActive: true,
  status: 'active',
  usedByCharacters: true,
  filePath: '/characters/visitor.glb',
});
assert.equal(gardenLibraryAccess.eligible, true);
assert.equal(gardenLibraryAccess.runtime, 'garden');

assert.deepEqual(resolveThreeDCharacterLibraryAccess({
  id: 11,
  isActive: true,
  status: 'active',
  visible: true,
  isMovable: true,
  modelId: 13,
}, {
  id: 13,
  isActive: true,
  status: 'active',
  usedByCharacters: false,
  filePath: '/models/bench.glb',
}), {
  eligible: false,
  runtime: 'ecctrl',
  issues: ['model_not_for_characters'],
});
validationStep('Character Library access selects Garden or Ecctrl without using Model runtime rules');

assert.equal(calculateThreeDModelFitMultiplier(
  { width: 4, height: 2, depth: 1 },
  { width: 2, height: 2, depth: 2 },
), 0.5);
assert.equal(calculateThreeDModelFitMultiplier(
  { width: 0.1, height: 0.2, depth: 0.1 },
  { width: 1, height: 1, depth: 1 },
), 2.5);
assert.equal(calculateThreeDModelFitMultiplier(
  { width: 0.5, height: 0.75, depth: 0.5 },
  { width: 1, height: 1, depth: 1 },
), 1);
assert.equal(calculateThreeDModelFitMultiplier(
  { width: 0, height: 1, depth: 1 },
  { width: 1, height: 1, depth: 1 },
), 1);
assert.equal(calculateThreeDModelInstanceScale('0.02', '1.0000'), 0.02);
assert.equal(calculateThreeDModelInstanceScale(0.02, 1.5), 0.03);
assert.equal(calculateThreeDModelInstanceScale('invalid', 1), 1);
assert.equal(calculateThreeDModelGroundedY(-2.5, 0), 2.5);
assert.equal(calculateThreeDModelGroundedY(0, 0.25), 0.25);
assert.equal(calculateThreeDModelGroundedY(-1, -0.5), 1);
assert.equal(calculateThreeDModelGroundedY(Number.POSITIVE_INFINITY, Number.NaN), 0);
validationStep('Model visual fitting, scale composition, and grounding remain bounded');

assert.deepEqual(parseCreateProjectBedPlacement({
  markerType: 'beds',
  projectId: 2,
  threedId: 3,
  name: ' North Bed ',
  shape: 'raised',
  widthFeet: 4,
  lengthFeet: 8,
  heightFeet: 1.5,
  color: '#8B5E3C',
  positionX: 12.5,
  positionY: 0,
  positionZ: -6.25,
  rotation: 1.57,
  scale: 1.25,
}), {
  markerType: 'beds',
  projectId: 2,
  threedId: 3,
  name: 'North Bed',
  shape: 'raised',
  widthFeet: 4,
  lengthFeet: 8,
  heightFeet: 1.5,
  color: '#8B5E3C',
  positionX: 12.5,
  positionY: 0,
  positionZ: -6.25,
  rotation: 1.57,
  scale: 1.25,
});
assert.throws(
  () => parseCreateProjectBedPlacement({
    markerType: 'beds', projectId: 2, threedId: 3, name: 'Bad Bed', widthFeet: 0,
  }),
  ProjectBedPlacementInputError,
);
assert.throws(
  () => parseCreateProjectBedPlacement({
    markerType: 'beds', projectId: 2, threedId: 3, name: 'Bad Bed', color: 'red',
  }),
  ProjectBedPlacementInputError,
);
validationStep('Project Bed placement inputs preserve bounded Sub-Module parameters');

assert.deepEqual(parseUpdateProjectBedPlacement({
  markerType: 'beds',
  widthFeet: 6,
  lengthFeet: 12,
  heightFeet: 2.5,
  color: '#336633',
  scale: 1.5,
  positionX: -4.5,
  positionY: 1,
  positionZ: 8.25,
  rotation: 90,
}), {
  markerType: 'beds',
  widthFeet: 6,
  lengthFeet: 12,
  heightFeet: 2.5,
  color: '#336633',
  scale: 1.5,
  positionX: -4.5,
  positionY: 1,
  positionZ: 8.25,
  rotation: 90,
});
assert.throws(
  () => parseUpdateProjectBedPlacement({
    markerType: 'beds',
    widthFeet: 0,
    lengthFeet: 12,
    heightFeet: 2.5,
    color: '#336633',
    scale: 1,
    positionX: 0,
    positionY: 0,
    positionZ: 0,
    rotation: 0,
  }),
  ProjectBedPlacementInputError,
);
validationStep('Project Bed instance sizing, color, and transform updates remain bounded');

assert.deepEqual(parseCreateProjectFarmBotPlacement({
  markerType: 'farmbots',
  projectId: 5,
  threedId: 2,
  farmbotId: 9,
  widthFeet: 3,
  lengthFeet: 8,
  heightFeet: 4,
  color: '#4B5563',
  scale: 1.25,
  positionX: -12,
  positionY: 0,
  positionZ: 7.5,
  rotation: 90,
}), {
  markerType: 'farmbots',
  projectId: 5,
  threedId: 2,
  farmbotId: 9,
  widthFeet: 3,
  lengthFeet: 8,
  heightFeet: 4,
  color: '#4B5563',
  scale: 1.25,
  positionX: -12,
  positionY: 0,
  positionZ: 7.5,
  rotation: 90,
});
assert.deepEqual(parseUpdateProjectFarmBotPlacement({
  markerType: 'farmbots',
  widthFeet: 4,
  lengthFeet: 10,
  heightFeet: 5,
  color: '#336633',
  scale: 0.75,
  positionX: 4,
  positionY: 1,
  positionZ: -8,
  rotation: -45,
}), {
  markerType: 'farmbots',
  widthFeet: 4,
  lengthFeet: 10,
  heightFeet: 5,
  color: '#336633',
  scale: 0.75,
  positionX: 4,
  positionY: 1,
  positionZ: -8,
  rotation: -45,
});
assert.throws(
  () => parseCreateProjectFarmBotPlacement({
    markerType: 'farmbots', projectId: 5, threedId: 2, farmbotId: 0,
  }),
  ProjectFarmBotPlacementInputError,
);
assert.throws(
  () => parseUpdateProjectFarmBotPlacement({
    markerType: 'farmbots', widthFeet: 0,
  }),
  ProjectFarmBotPlacementInputError,
);
validationStep('Project FarmBot placement and instance transforms remain bounded');

assert.deepEqual(parseCreateProjectPlantingPlacement({
  markerType: 'plantings',
  projectId: 5,
  threedId: 2,
  plantId: 9,
  bedId: 4,
  quantity: 3,
  spacingInches: 12,
  modelScale: 1.5,
  positionX: 2,
  positionY: 0,
  positionZ: -3,
}), {
  markerType: 'plantings',
  projectId: 5,
  threedId: 2,
  plantId: 9,
  bedId: 4,
  quantity: 3,
  spacingInches: 12,
  modelScale: 1.5,
  positionX: 2,
  positionY: 0,
  positionZ: -3,
});
assert.deepEqual(parseUpdateProjectPlantingPlacement({
  markerType: 'plantings',
  modelScale: 0.75,
  positionX: 1,
  positionY: 0.5,
  positionZ: 6,
}), {
  markerType: 'plantings',
  modelScale: 0.75,
  positionX: 1,
  positionY: 0.5,
  positionZ: 6,
});
assert.throws(
  () => parseCreateProjectPlantingPlacement({
    markerType: 'plantings', projectId: 5, threedId: 2, plantId: 0,
    positionX: 0, positionY: 0, positionZ: 0,
  }),
  ProjectPlantingPlacementInputError,
);
validationStep('Project Planting placement and instance updates remain bounded');

assert.deepEqual(calculateProjectPlantingVisualPositions(2, 12), [
  { x: -0.5, y: 0, z: 0 },
  { x: 0.5, y: 0, z: 0 },
]);
assert.deepEqual(calculateProjectPlantingVisualPositions(4, 24), [
  { x: -1, y: 0, z: -1 },
  { x: 1, y: 0, z: -1 },
  { x: -1, y: 0, z: 1 },
  { x: 1, y: 0, z: 1 },
]);
validationStep('Planting creation expands quantity and inch-based spacing into centered instance positions');

assert.deepEqual(parseCreateProjectModelInstance({
  projectId: 2,
  threedId: 3,
  modelId: 4,
  instanceName: ' Garden Bench ',
  positionX: 12.5,
  positionY: 0,
  positionZ: -6.25,
}), {
  projectId: 2,
  threedId: 3,
  modelId: 4,
  instanceName: 'Garden Bench',
  positionX: 12.5,
  positionY: 0,
  positionZ: -6.25,
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,
  scaleMultiplier: 1,
  isVisible: true,
  isActive: true,
  metadata: {},
});
assert.deepEqual(parseUpdateProjectModelInstance({
  rotationY: 1.57,
  scaleMultiplier: 0.75,
  isVisible: false,
}), {
  rotationY: 1.57,
  scaleMultiplier: 0.75,
  isVisible: false,
});
assert.throws(
  () => parseCreateProjectModelInstance({ projectId: 2, threedId: 3, modelId: 4, positionX: Infinity }),
  ProjectModelInstanceInputError,
);
assert.throws(
  () => parseUpdateProjectModelInstance({ scaleMultiplier: 0 }),
  ProjectModelInstanceInputError,
);
assert.throws(
  () => parseUpdateProjectModelInstance({ projectId: 99 }),
  ProjectModelInstanceInputError,
);
validationStep('Project Model marker inputs allow bounded transforms and reject unsafe updates');

assert.deepEqual(THREED_RUNTIME_MARKER_MODULE_TYPES, [
  'plantings',
  'beds',
  'characters',
  'farmbots',
  'models',
]);
assert.equal(normalizeThreeDRuntimeMarkerModuleType(' FarmBot '), 'farmbots');
assert.equal(normalizeThreeDRuntimeMarkerModuleType('characters'), 'characters');
assert.equal(normalizeThreeDRuntimeMarkerModuleType('traffic'), null);
validationStep('ThreeD owns supported Runtime Marker module normalization');

assert.equal(createThreeDRuntimeMarkerKey({
  moduleType: 'farmbots',
  assetId: 3,
}), 'farmbots:3');
validationStep('Canonical registry keys include module and asset identity');

const registry = new ThreeDRuntimeMarkerRegistry();
const initial = registry.replaceAssetMarkers([
  {
    moduleType: 'farmbot',
    assetId: 3,
    name: ' FarmBot Gamma ',
    assetPosition: { x: 4, y: 0, z: 8 },
  },
  {
    moduleType: 'characters',
    assetId: 3,
    name: 'Farmer',
    assetPosition: { x: 1, y: 0, z: 2 },
  },
]);
assert.equal(registry.size, 2);
assert.equal(initial[0].key, 'farmbots:3');
assert.equal(initial[0].markerId, 'farmbots-3');
assert.equal(initial[0].name, 'FarmBot Gamma');
assert.equal(initial[0].positionSource, 'asset');
assert.deepEqual(initial[0].currentPosition, { x: 4, y: 0, z: 8 });
assert.equal(initial[1].key, 'characters:3');
validationStep('Overlapping asset IDs remain distinct across Sub-Modules');

assert.equal(registry.updateLivePosition(
  'character',
  3,
  { x: 7, y: 0.5, z: 9 },
), true);
const live = registry.resolve('characters', 3);
assert.equal(live?.positionSource, 'runtime');
assert.deepEqual(live?.assetPosition, { x: 1, y: 0, z: 2 });
assert.deepEqual(live?.currentPosition, { x: 7, y: 0.5, z: 9 });
assert.equal(Object.isFrozen(live), true);
assert.equal(Object.isFrozen(live?.currentPosition), true);
validationStep('Live positions override asset positions without mutating snapshots');

registry.replaceAssetMarkers([
  {
    moduleType: 'farmbots',
    assetId: 3,
    name: 'FarmBot Gamma Updated',
    assetPosition: { x: 5, y: 0, z: 10 },
  },
  {
    moduleType: 'characters',
    assetId: 3,
    name: 'Farmer Updated',
    assetPosition: { x: 2, y: 0, z: 3 },
  },
]);
assert.equal(registry.resolve('farmbot', 3)?.name, 'FarmBot Gamma Updated');
assert.deepEqual(
  registry.resolve('characters', 3)?.currentPosition,
  { x: 7, y: 0.5, z: 9 },
);
validationStep('Asset refresh preserves a matching marker live-position override');

const cleared = registry.clearLivePosition('characters', 3);
assert.equal(cleared?.positionSource, 'asset');
assert.deepEqual(cleared?.currentPosition, { x: 2, y: 0, z: 3 });
assert.equal(registry.remove('farmbots', 3), true);
assert.equal(registry.resolve('farmbots', 3), null);
validationStep('Clearing live state falls back to assets and removal clears identity');

const beforeInvalidReplacement = registry.list();
assert.throws(
  () => registry.replaceAssetMarkers([
    {
      moduleType: 'characters',
      assetId: 3,
      name: 'Farmer',
      assetPosition: { x: 0, y: 0, z: 0 },
    },
    {
      moduleType: 'character',
      assetId: 3,
      name: 'Duplicate Farmer',
      assetPosition: { x: 1, y: 0, z: 1 },
    },
  ]),
  (error) => error instanceof ThreeDRuntimeMarkerRegistryError
    && error.code === 'duplicate_identity',
);
assert.deepEqual(registry.list(), beforeInvalidReplacement);
validationStep('Duplicate replacement fails atomically without changing the registry');

for (const [registration, expectedCode] of [
  [{ moduleType: 'traffic' }, 'invalid_module_type'],
  [{ assetId: 0 }, 'invalid_asset_id'],
  [{ name: ' ' }, 'invalid_name'],
  [{ assetPosition: { x: Number.NaN, y: 0, z: 0 } }, 'invalid_position'],
] as const) {
  const validRegistration = {
    moduleType: 'models',
    assetId: 8,
    name: 'Greenhouse',
    assetPosition: { x: 1, y: 0, z: 1 },
  };
  assert.throws(
    () => new ThreeDRuntimeMarkerRegistry().replaceAssetMarkers([
      { ...validRegistration, ...registration },
    ]),
    (error) => error instanceof ThreeDRuntimeMarkerRegistryError
      && error.code === expectedCode,
  );
}
assert.equal(registry.updateLivePosition('traffic', 3, { x: 0, y: 0, z: 0 }), false);
assert.equal(registry.updateLivePosition('models', 99, { x: 0, y: 0, z: 0 }), false);
validationStep('Invalid and unknown marker identities fail closed');

registry.clear();
assert.equal(registry.size, 0);
assert.deepEqual(registry.list(), []);
validationStep('Registry clearing removes all Project-scoped marker state');

const generatedAt = '2026-08-22T12:00:00.000Z';
const builtMarkers = buildThreeDRuntimeMarkers({
  plants: [{ id: 101, commonName: 'Tomato' }],
  plantings: [{
    id: 1,
    plantId: 101,
    positionX: '1.250',
    positionY: '0.000',
    positionZ: '2.500',
  }, {
    id: 1,
    plantId: 101,
    positionX: '99',
    positionY: '99',
    positionZ: '99',
  }],
  beds: [{ id: 1, name: 'North Bed', position: { x: 3, y: 0, z: 4 } }],
  characters: [{
    id: 1,
    name: 'Farmer',
    positionX: '5',
    positionY: 'invalid',
    positionZ: '6',
    isActive: false,
  }],
  farmbots: [{
    id: 1,
    name: 'FarmBot Gamma',
    lat: 7,
    height: 1,
    lng: 8,
    color: '#123456',
    isVisible: false,
  }],
  models: [{ id: 41, modelName: 'Greenhouse', filePath: '/greenhouse.glb' }],
  projectThreedMarkers: [{
    id: 1,
    markerType: 'models',
    sourceAssetId: 41,
    markerId: 'models-placement-1',
    name: 'Greenhouse',
    positionX: 9,
    positionY: 0,
    positionZ: 10,
    positionSource: 'asset',
    color: '#06b6d4',
    icon: '🧊',
    label: 'Greenhouse',
    isVisible: true,
    isActive: true,
    data: { modelName: 'Greenhouse', modelType: 'glb', filePath: '/greenhouse.glb' },
    metadata: {},
  }],
  layers: [],
  tasks: [],
  harvests: [],
  weatherLogs: [],
}, generatedAt);
assert.equal(builtMarkers.length, 5);
assert.deepEqual(
  builtMarkers.map((marker) => marker.id),
  ['plantings-1', 'beds-1', 'characters-1', 'farmbots-1', 'models-placement-1'],
);
assert.equal(builtMarkers[0].name, 'Tomato');
assert.deepEqual(builtMarkers[0].position, { x: 1.25, y: 0, z: 2.5 });
assert.equal(builtMarkers[0].color, '#22c55e');
assert.equal(builtMarkers[0].icon, '🌱');
assert.equal(builtMarkers[0].metadata.generatedAt, generatedAt);
assert.deepEqual(builtMarkers[2].position, { x: 5, y: 0, z: 6 });
assert.equal(builtMarkers[2].isActive, false);
assert.equal(builtMarkers[3].color, '#123456');
assert.equal(builtMarkers[3].isVisible, false);
assert.deepEqual(builtMarkers[4].position, { x: 9, y: 0, z: 10 });
validationStep('Project Sub-Modules build the established five Runtime Marker shapes');
validationStep('Duplicate Project asset rows resolve to one marker identity before Scene physics');

const integratedRegistry = new ThreeDRuntimeMarkerRegistry();
integratedRegistry.replaceAssetMarkers(
  createThreeDRuntimeMarkerRegistrations(builtMarkers),
);
assert.equal(integratedRegistry.size, 5);
assert.deepEqual(
  integratedRegistry.list().map((marker) => marker.key),
  ['plantings:1', 'beds:1', 'characters:1', 'farmbots:1', 'models:1'],
);
assert.deepEqual(
  integratedRegistry.resolve('farmbots', 1)?.currentPosition,
  { x: 7, y: 1, z: 8 },
);
validationStep('Complete unfiltered builder output maps into the registry mirror');

const positionFallbackMarkers = buildThreeDRuntimeMarkers({
  plants: [],
  plantings: [],
  beds: [
    { id: 2, name: 'Missing Position' },
    { id: 3, name: 'Invalid Position', positionX: 'bad', positionY: 'bad', positionZ: 'bad' },
    { id: 4, notes: 'Uses fallback name', positionX: 0, positionY: 0, positionZ: 0 },
  ],
  characters: [],
  farmbots: [],
  models: [],
  layers: [],
  tasks: [],
  harvests: [],
  weatherLogs: [],
}, generatedAt);
assert.equal(positionFallbackMarkers.length, 1);
assert.equal(positionFallbackMarkers[0].id, 'beds-4');
assert.equal(positionFallbackMarkers[0].name, 'beds #4');
assert.equal(positionFallbackMarkers[0].isActive, true);
assert.equal(positionFallbackMarkers[0].isVisible, true);
assert.equal(positionFallbackMarkers[0].data.description, 'Uses fallback name');
assert.deepEqual(buildThreeDRuntimeMarkers(null, generatedAt), []);
validationStep('Missing positions are skipped and established fallbacks remain intact');

const validSavedSnapshot = parseProjectThreeDMarkerSnapshot([{
  markerId: 'characters-9',
  moduleType: 'character',
  assetId: 9,
  name: ' Farmer ',
  position: { x: 2.1254, y: 0, z: -4 },
  positionSource: 'runtime',
  color: '#ffffff',
  icon: 'person',
  label: 'Farmer',
  isVisible: true,
  isActive: true,
  data: { status: 'active' },
  metadata: { source: 'sub-module' },
}]);
assert.equal(validSavedSnapshot[0].moduleType, 'characters');
assert.equal(validSavedSnapshot[0].markerId, 'characters-9');
assert.equal(validSavedSnapshot[0].name, 'Farmer');
assert.deepEqual(validSavedSnapshot[0].position, { x: 2.1254, y: 0, z: -4 });
assert.equal(validSavedSnapshot[0].positionSource, 'runtime');
validationStep('Explicit Project-save snapshots normalize marker identity and position');

assert.throws(
  () => parseProjectThreeDMarkerSnapshot([
    { ...validSavedSnapshot[0] },
    { ...validSavedSnapshot[0], moduleType: 'characters' },
  ]),
  (error) => error instanceof ProjectMarkerSnapshotError
    && error.code === 'duplicate_marker',
);
assert.throws(
  () => parseProjectThreeDMarkerSnapshot([
    { ...validSavedSnapshot[0] },
    { ...validSavedSnapshot[0], markerId: 'characters-9-copy' },
  ]),
  (error) => error instanceof ProjectMarkerSnapshotError
    && error.code === 'duplicate_marker',
);
const repeatedModelSourceSnapshot = parseProjectThreeDMarkerSnapshot([
  {
    ...validSavedSnapshot[0],
    markerId: 'models-placement-a',
    moduleType: 'models',
    assetId: 12,
  },
  {
    ...validSavedSnapshot[0],
    markerId: 'models-placement-b',
    moduleType: 'models',
    assetId: 12,
  },
]);
assert.equal(repeatedModelSourceSnapshot.length, 2);
assert.throws(
  () => parseProjectThreeDMarkerSnapshot([{
    ...validSavedSnapshot[0],
    data: { credentialToken: 'must-not-persist' },
  }]),
  (error) => error instanceof ProjectMarkerSnapshotError
    && error.code === 'unsafe_snapshot_data',
);
validationStep('Marker identities stay unique while Model sources may repeat');

assert.throws(
  () => parseProjectThreeDMarkerSnapshot(
    Array.from(
      { length: MAX_PROJECT_MARKER_SNAPSHOT_ROWS + 1 },
      (_, index) => ({
        ...validSavedSnapshot[0],
        markerId: `characters-${index + 1}`,
        assetId: index + 1,
      }),
    ),
  ),
  (error) => error instanceof ProjectMarkerSnapshotError
    && error.code === 'too_many_markers',
);
validationStep('Project-save snapshot row limits are enforced before persistence');

const restoredProjectMarkers = buildThreeDRuntimeMarkers({
  plants: [],
  plantings: [],
  beds: [{
    id: 4,
    name: 'Unsaved Bed',
    positionX: 1,
    positionY: 0,
    positionZ: 1,
    heightFeet: '2.50',
  }],
  characters: [],
  farmbots: [],
  models: [{ id: 80, modelName: 'Newly Placed Model', filePath: '/placed.glb' }],
  layers: [],
  tasks: [],
  harvests: [],
  weatherLogs: [],
  projectThreedMarkers: [
    {
      id: 7,
      markerType: 'beds',
      sourceAssetId: 4,
      markerId: 'beds-4',
      name: 'Saved Bed',
      positionX: '8.125',
      positionY: '0.000',
      positionZ: '-3.500',
      positionSource: 'runtime',
      color: '#abcdef',
      icon: 'saved-bed',
      label: 'Saved Bed Label',
      isVisible: false,
      isActive: true,
      data: { id: 999, notes: 'saved data', heightFeet: '1.00' },
      metadata: { source: 'old-value' },
      savedAt: '2026-08-22T20:00:00.000Z',
    },
    {
      id: 8,
      markerType: 'models',
      sourceAssetId: 80,
      markerId: 'models-placement-8',
      name: 'Newly Placed Model',
      positionX: 2,
      positionY: 0,
      positionZ: 6,
      positionSource: 'asset',
      color: '#06b6d4',
      icon: '🧊',
      label: 'Newly Placed Model',
      isVisible: true,
      isActive: true,
      data: { modelName: 'Newly Placed Model', filePath: '/placed.glb' },
      metadata: {},
    },
    {
      markerType: 'farmbots',
      sourceAssetId: 99,
      markerId: 'farmbots-99',
      name: 'Unavailable Saved FarmBot',
      positionX: 1,
      positionY: 0,
      positionZ: 1,
      positionSource: 'asset',
      color: '#ffffff',
      icon: 'robot',
      label: 'Unavailable Saved FarmBot',
      isVisible: true,
      isActive: true,
      data: {},
      metadata: {},
    },
  ],
}, generatedAt);
assert.equal(restoredProjectMarkers.length, 2);
assert.equal(restoredProjectMarkers[0].id, 'beds-4');
assert.equal(restoredProjectMarkers[0].name, 'Saved Bed');
assert.deepEqual(restoredProjectMarkers[0].position, { x: 8.125, y: 0, z: -3.5 });
assert.equal(restoredProjectMarkers[0].data.id, 4);
assert.equal(restoredProjectMarkers[0].data.heightFeet, '1.00');
assert.equal(restoredProjectMarkers[0].data.projectMarkerId, 7);
assert.equal(restoredProjectMarkers[0].data.positionX, 8.125);
assert.equal(restoredProjectMarkers[0].data.positionY, 0);
assert.equal(restoredProjectMarkers[0].data.positionZ, -3.5);
assert.equal(restoredProjectMarkers[0].isVisible, false);
assert.equal(restoredProjectMarkers[0].metadata.source, 'project-snapshot');
assert.equal(restoredProjectMarkers[0].metadata.positionSource, 'runtime');
assert.equal(restoredProjectMarkers[1].id, 'models-placement-8');
assert.deepEqual(restoredProjectMarkers[1].position, { x: 2, y: 0, z: 6 });
validationStep('Saved state overrides matches without hiding new or restoring unavailable markers');

const projectModelInstanceMarkers = buildThreeDRuntimeMarkers({
  plants: [],
  plantings: [],
  beds: [],
  characters: [],
  farmbots: [],
  models: [{ id: 7, modelName: 'Reusable Bench', positionX: 99, positionY: 0, positionZ: 99 }],
  layers: [],
  tasks: [],
  harvests: [],
  weatherLogs: [],
  projectThreedMarkers: [
    {
      id: 31,
      markerType: 'models',
      sourceAssetId: 7,
      markerId: 'models-placement-31',
      name: 'Bench One',
      positionX: '2.000',
      positionY: '0.000',
      positionZ: '4.000',
      positionSource: 'asset',
      color: '#06b6d4', icon: '🧊', label: 'Bench One',
      isVisible: true, isActive: true,
      data: { modelName: 'Reusable Bench', filePath: '/bench.glb', scaleMultiplier: 0.75, rotationYInstance: 1.57 },
      metadata: {},
    },
    {
      id: 32,
      markerType: 'models',
      sourceAssetId: 7,
      markerId: 'models-placement-32',
      name: 'Reusable Bench',
      positionX: 8, positionY: 0, positionZ: 4,
      positionSource: 'asset',
      color: '#06b6d4', icon: '🧊', label: 'Reusable Bench',
      isVisible: true, isActive: true,
      data: { modelName: 'Reusable Bench', filePath: '/bench.glb', scaleMultiplier: 1 },
      metadata: {},
    },
  ],
}, generatedAt);
const generalProjectModelMarkers = projectModelInstanceMarkers.filter(
  (marker) => marker.type === 'models',
);
assert.equal(generalProjectModelMarkers.length, 2);
assert.equal(generalProjectModelMarkers[0].id, 'models-placement-31');
assert.equal(generalProjectModelMarkers[0].data.modelId, 7);
assert.equal(generalProjectModelMarkers[0].data.scaleMultiplier, 0.75);
assert.equal(generalProjectModelMarkers[0].data.rotationYInstance, 1.57);
assert.deepEqual(generalProjectModelMarkers[1].position, { x: 8, y: 0, z: 4 });
validationStep('Project Model placements use marker identity and reusable model render data');

const rejectedMarkerResult = buildThreeDRuntimeMarkerResult({
  plants: [],
  plantings: [{
    id: 91,
    commonName: 'Unsafe Planting',
    positionX: Number.POSITIVE_INFINITY,
    positionY: 0,
    positionZ: 0,
  }],
  beds: [],
  characters: [],
  farmbots: [],
  models: [{ id: 7, modelName: 'Reusable Bench' }],
  layers: [],
  tasks: [],
  harvests: [],
  weatherLogs: [],
  projectThreedMarkers: [
    {
      id: 41,
      markerType: 'models',
      sourceAssetId: 7,
      markerId: 'models-placement-41',
      name: 'Safe Bench',
      positionX: 2, positionY: 0, positionZ: 4,
      positionSource: 'asset',
      color: '#06b6d4', icon: '🧊', label: 'Safe Bench',
      isVisible: true, isActive: true,
      data: { modelName: 'Reusable Bench', filePath: '/bench.glb', scaleMultiplier: 1 },
      metadata: {},
    },
    {
      id: 42,
      markerType: 'models',
      sourceAssetId: 7,
      markerId: 'models-placement-42',
      name: 'Unsafe Bench',
      positionX: 3, positionY: 0, positionZ: 4,
      positionSource: 'asset',
      color: '#06b6d4', icon: '🧊', label: 'Unsafe Bench',
      isVisible: true, isActive: true,
      data: { modelName: 'Reusable Bench', filePath: '/bench.glb', scaleMultiplier: 0 },
      metadata: {},
    },
    {
      id: 43,
      markerType: 'models',
      sourceAssetId: 7,
      markerId: 'models-placement-41',
      name: 'Duplicate Bench',
      positionX: 5, positionY: 0, positionZ: 4,
      positionSource: 'asset',
      color: '#06b6d4', icon: '🧊', label: 'Duplicate Bench',
      isVisible: true, isActive: true,
      data: { modelName: 'Reusable Bench', filePath: '/bench.glb', scaleMultiplier: 1 },
      metadata: {},
    },
  ],
}, generatedAt);
assert.deepEqual(rejectedMarkerResult.markers.map((marker) => marker.id), ['models-placement-41']);
assert.equal(rejectedMarkerResult.issues.length, 3);
assert.equal(rejectedMarkerResult.issues[0].source, 'threed_sub_module');
assert.match(rejectedMarkerResult.issues[0].reasons.join(' '), /Scene boundary/);
assert.equal(rejectedMarkerResult.issues[1].recordId, 42);
assert.match(rejectedMarkerResult.issues[1].reasons.join(' '), /scaleMultiplier must be greater than zero/);
assert.equal(rejectedMarkerResult.issues[2].recordId, 43);
assert.match(rejectedMarkerResult.issues[2].reasons.join(' '), /duplicate marker ID/);
validationStep('Unsafe marker rows are reported and excluded before Scene physics');

const overlappingEcctrlResult = buildThreeDRuntimeMarkerResult({
  plants: [],
  plantings: [],
  beds: [{ id: 1, name: 'Safe Bed', positionX: 4, positionY: 0, positionZ: 4 }],
  characters: [
    { id: 2, name: 'Farmer A', isMovable: true, positionX: 0, positionY: 0, positionZ: 0 },
    { id: 3, name: 'Farmer B', isMovable: true, positionX: 0, positionY: 0, positionZ: 0 },
    { id: 4, name: 'Farmer C', isMovable: true, positionX: 8, positionY: 0, positionZ: 8 },
    { id: 5, name: 'Garden Visitor', isMovable: false, positionX: 0, positionY: 0, positionZ: 0 },
  ],
  farmbots: [],
  models: [],
  layers: [],
  tasks: [],
  harvests: [],
  weatherLogs: [],
  projectThreedMarkers: [],
}, generatedAt);
assert.deepEqual(
  overlappingEcctrlResult.markers.map((marker) => marker.id),
  ['beds-1', 'characters-2', 'characters-4', 'characters-5'],
);
assert.deepEqual(
  overlappingEcctrlResult.issues.map((issue) => issue.markerId),
  ['characters-3'],
);
assert.match(
  overlappingEcctrlResult.issues[0].reasons.join(' '),
  /Ecctrl spawn owned by characters-2/,
);
validationStep('One movable Character owns each Rapier spawn and later overlaps are rejected');

const nearbyEcctrlResult = buildThreeDRuntimeMarkerResult({
  plants: [],
  plantings: [],
  beds: [],
  characters: [
    { id: 20, name: 'Farmer A', isMovable: true, positionX: 0, positionY: 1.172, positionZ: 0 },
    { id: 21, name: 'Farmer B', isMovable: true, positionX: 0, positionY: 0, positionZ: 0 },
    { id: 22, name: 'Farmer C', isMovable: true, positionX: 2, positionY: 0, positionZ: 0 },
  ],
  farmbots: [],
  models: [],
  layers: [],
  tasks: [],
  harvests: [],
  weatherLogs: [],
  projectThreedMarkers: [],
}, generatedAt);
assert.deepEqual(
  nearbyEcctrlResult.markers.map((marker) => marker.id),
  ['characters-20', 'characters-22'],
);
assert.equal(nearbyEcctrlResult.issues[0].markerId, 'characters-21');
assert.match(nearbyEcctrlResult.issues[0].reasons.join(' '), /overlaps the Ecctrl spawn/);
validationStep('Nearby movable Character capsules cannot share an Ecctrl spawn area');

const projectPlanPosition = { x: 12.5, y: 3, z: -8.25 };
const mapCenter = { lat: 39.514719, lng: -123.760382 };
const projectedMapPosition = projectPlanPositionToMapPosition(projectPlanPosition, mapCenter);
const restoredProjectPlanPosition = mapPositionToProjectPlanPosition(
  projectedMapPosition,
  mapCenter,
  projectPlanPosition.y,
);
assert.ok(Math.abs(restoredProjectPlanPosition.x - projectPlanPosition.x) < 1e-6);
assert.equal(restoredProjectPlanPosition.y, projectPlanPosition.y);
assert.ok(Math.abs(restoredProjectPlanPosition.z - projectPlanPosition.z) < 1e-6);
assert.throws(
  () => mapPositionToProjectPlanPosition({ lat: 95, lng: 0 }, mapCenter),
  ThreeDMapCoordinateError,
);
assert.throws(
  () => projectPlanPositionToMapPosition({ x: Number.NaN, y: 0, z: 0 }, mapCenter),
  ThreeDMapCoordinateError,
);
validationStep('2D map and ThreeD Project positions share one reversible projection');

assert.equal(DEFAULT_THREED_METERS_PER_SCENE_UNIT, 0.3048);
const oneHundredFeetAboveOrigin = projectLocalPositionToGeographicPosition(
  { x: 0, y: 100, z: 0 },
  {
    latitude: mapCenter.lat,
    longitude: mapCenter.lng,
    altitude: 0,
    headingDegrees: 0,
    metersPerSceneUnit: DEFAULT_THREED_METERS_PER_SCENE_UNIT,
  },
);
assert.ok(Math.abs(oneHundredFeetAboveOrigin.altitude - 30.48) < 1e-10);
validationStep('One local Scene unit equals one physical foot');

const expectedCalibrationOrigin = {
  latitude: 39.514719,
  longitude: -123.760382,
  altitude: 12,
  headingDegrees: 28,
  metersPerSceneUnit: 0.6096,
};
const calibrationLocalA = { x: -18, y: 0, z: 7 };
const calibrationLocalB = { x: 32, y: 0, z: -11 };
const calibration = calibrateThreeDGeographicOrigin({
  pointA: {
    local: calibrationLocalA,
    geographic: projectLocalPositionToGeographicPosition(
      calibrationLocalA,
      expectedCalibrationOrigin,
    ),
  },
  pointB: {
    local: calibrationLocalB,
    geographic: projectLocalPositionToGeographicPosition(
      calibrationLocalB,
      expectedCalibrationOrigin,
    ),
  },
  originAltitude: expectedCalibrationOrigin.altitude,
});
assert.ok(Math.abs(calibration.latitude - expectedCalibrationOrigin.latitude) < 1e-8);
assert.ok(Math.abs(calibration.longitude - expectedCalibrationOrigin.longitude) < 1e-8);
assert.ok(Math.abs(calibration.headingDegrees - expectedCalibrationOrigin.headingDegrees) < 1e-4);
assert.ok(Math.abs(calibration.metersPerSceneUnit - expectedCalibrationOrigin.metersPerSceneUnit) < 1e-5);
assert.throws(() => calibrateThreeDGeographicOrigin({
  pointA: { local: { x: 1, z: 1 }, geographic: { latitude: 1, longitude: 1 } },
  pointB: { local: { x: 1, z: 1 }, geographic: { latitude: 2, longitude: 2 } },
}), ThreeDMapCoordinateError);
validationStep('Two local/GPS references solve Project origin, heading, and scale');

const geographicOrigins = [
  {
    latitude: 0,
    longitude: 10,
    altitude: 25,
    headingDegrees: 0,
    metersPerSceneUnit: 1,
  },
  {
    latitude: 39.514719,
    longitude: -123.760382,
    altitude: 18.5,
    headingDegrees: 0,
    metersPerSceneUnit: 1,
  },
  {
    latitude: 64.1466,
    longitude: -21.9426,
    altitude: 73,
    headingDegrees: 37,
    metersPerSceneUnit: 0.5,
  },
];
for (const origin of geographicOrigins) {
  const local = { x: 28.125, y: 4.75, z: -13.625 };
  const geographic = projectLocalPositionToGeographicPosition(local, origin);
  const restored = geographicPositionToProjectLocalPosition(geographic, origin);
  assert.ok(Math.abs(restored.x - local.x) < 1e-6);
  assert.ok(Math.abs(restored.y - local.y) < 1e-8);
  assert.ok(Math.abs(restored.z - local.z) < 1e-6);
}
validationStep('WGS84 local positions round-trip across latitude, altitude, scale, and heading');

const northAlignedOrigin = geographicOrigins[1];
const tenMetresEast = projectLocalPositionToGeographicPosition(
  { x: 10, y: 0, z: 0 },
  northAlignedOrigin,
);
const tenMetresNorth = projectLocalPositionToGeographicPosition(
  { x: 0, y: 0, z: -10 },
  northAlignedOrigin,
);
assert.ok(Math.abs(tenMetresEast.latitude - northAlignedOrigin.latitude) < 1e-9);
assert.ok(Math.abs(tenMetresNorth.longitude - northAlignedOrigin.longitude) < 1e-9);
assert.ok(tenMetresEast.longitude > northAlignedOrigin.longitude);
assert.ok(tenMetresNorth.latitude > northAlignedOrigin.latitude);
assert.throws(
  () => projectLocalPositionToGeographicPosition(
    { x: 0, y: 0, z: 0 },
    { ...northAlignedOrigin, metersPerSceneUnit: 0 },
  ),
  ThreeDMapCoordinateError,
);
assert.throws(
  () => geographicPositionToProjectLocalPosition(
    { latitude: 0, longitude: 181, altitude: 0 },
    northAlignedOrigin,
  ),
  ThreeDMapCoordinateError,
);
validationStep('Geographic axes remain explicit and unsafe coordinate inputs fail closed');

console.log('─'.repeat(42));
console.log(`PASS  ${completedValidationSteps} validation groups completed`);
