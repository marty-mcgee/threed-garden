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

let completedValidationSteps = 0;
function validationStep(label: string): void {
  completedValidationSteps += 1;
  console.log(`  ✓ ${label}`);
}

console.log('\nThreeD Runtime Marker registry validation');
console.log('─'.repeat(42));

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
  models: [{ id: 1, modelName: 'Greenhouse', positionX: 9, positionZ: 10 }],
  layers: [],
  tasks: [],
  harvests: [],
  weatherLogs: [],
}, generatedAt);
assert.equal(builtMarkers.length, 5);
assert.deepEqual(
  builtMarkers.map((marker) => marker.id),
  ['plantings-1', 'beds-1', 'characters-1', 'farmbots-1', 'models-1'],
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
  () => parseProjectThreeDMarkerSnapshot([{
    ...validSavedSnapshot[0],
    data: { credentialToken: 'must-not-persist' },
  }]),
  (error) => error instanceof ProjectMarkerSnapshotError
    && error.code === 'unsafe_snapshot_data',
);
validationStep('Duplicate identities and credential-like snapshot fields fail closed');

assert.throws(
  () => parseProjectThreeDMarkerSnapshot(
    Array.from(
      { length: MAX_PROJECT_MARKER_SNAPSHOT_ROWS + 1 },
      (_, index) => ({ ...validSavedSnapshot[0], assetId: index + 1 }),
    ),
  ),
  (error) => error instanceof ProjectMarkerSnapshotError
    && error.code === 'too_many_markers',
);
validationStep('Project-save snapshot row limits are enforced before persistence');

const restoredProjectMarkers = buildThreeDRuntimeMarkers({
  plants: [],
  plantings: [],
  beds: [{ id: 4, name: 'Unsaved Bed', positionX: 1, positionY: 0, positionZ: 1 }],
  characters: [],
  farmbots: [],
  models: [{ id: 8, modelName: 'Newly Assigned Model', positionX: 2, positionY: 0, positionZ: 6 }],
  layers: [],
  tasks: [],
  harvests: [],
  weatherLogs: [],
  projectThreedMarkers: [
    {
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
      data: { id: 999, notes: 'saved data' },
      metadata: { source: 'old-value' },
      savedAt: '2026-08-22T20:00:00.000Z',
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
assert.equal(restoredProjectMarkers[0].data.positionX, 8.125);
assert.equal(restoredProjectMarkers[0].data.positionY, 0);
assert.equal(restoredProjectMarkers[0].data.positionZ, -3.5);
assert.equal(restoredProjectMarkers[0].isVisible, false);
assert.equal(restoredProjectMarkers[0].metadata.source, 'project-snapshot');
assert.equal(restoredProjectMarkers[0].metadata.positionSource, 'runtime');
assert.equal(restoredProjectMarkers[1].id, 'models-8');
assert.deepEqual(restoredProjectMarkers[1].position, { x: 2, y: 0, z: 6 });
validationStep('Saved state overrides matches without hiding new or restoring unavailable markers');

console.log('─'.repeat(42));
console.log(`PASS  ${completedValidationSteps} validation groups completed`);
