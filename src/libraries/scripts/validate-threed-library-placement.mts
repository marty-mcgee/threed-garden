import assert from 'node:assert/strict';

import {
  createProjectCharacterLibraryPlacementRequest,
  createProjectFarmBotLibraryPlacementRequest,
  createProjectModelLibraryPlacementRequest,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/markers/library-placement-client-core.ts';
import {
  transitionThreeDLibraryWorkspace,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/markers/library-workspace-core.ts';
import {
  createThreeDModelLibraryReadiness,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/models/model-library-readiness-core.ts';

const position = { x: 12.5, y: 3, z: -8.25 };

assert.deepEqual(
  createProjectModelLibraryPlacementRequest({
    projectId: '7',
    threedId: 4,
    model: { id: 15, modelName: 'Environment Model' },
    position,
    scaleMultiplier: 0.02,
    placementRole: 'environment',
  }),
  {
    projectId: 7,
    threedId: 4,
    modelId: 15,
    instanceName: 'Environment Model',
    positionX: 12.5,
    positionY: 3,
    positionZ: -8.25,
    scaleMultiplier: 0.02,
    placementRole: 'environment',
  },
);
console.log('✓ Model Library placement request preserves the established envelope');

assert.deepEqual(
  createProjectCharacterLibraryPlacementRequest({
    projectId: '7',
    threedId: 4,
    character: { id: 9, scaleMultiplier: '1.25' },
    position,
  }),
  {
    markerType: 'characters',
    projectId: 7,
    threedId: 4,
    characterId: 9,
    positionX: 12.5,
    positionY: 3,
    positionZ: -8.25,
    rotation: 0,
    scaleMultiplier: 1.25,
  },
);
console.log('✓ Character Library placement request preserves the established envelope');

assert.deepEqual(
  createProjectFarmBotLibraryPlacementRequest({
    projectId: '7',
    threedId: 4,
    farmBot: { id: 11 },
    draft: {
      widthFeet: '3',
      lengthFeet: '6',
      heightFeet: '3.5',
      color: '#4B5563',
      rotation: '45',
      scale: '0.75',
    },
    position,
  }),
  {
    markerType: 'farmbots',
    projectId: 7,
    threedId: 4,
    farmbotId: 11,
    widthFeet: 3,
    lengthFeet: 6,
    heightFeet: 3.5,
    scale: 0.75,
    color: '#4B5563',
    positionX: 12.5,
    positionY: 3,
    positionZ: -8.25,
    rotation: 45,
  },
);
console.log('✓ FarmBot Library placement request preserves the established envelope');

assert.equal(transitionThreeDLibraryWorkspace(null, 'models', true), 'models');
assert.equal(transitionThreeDLibraryWorkspace('models', 'characters', true), 'characters');
assert.equal(transitionThreeDLibraryWorkspace('characters', 'models', false), 'characters');
assert.equal(transitionThreeDLibraryWorkspace('characters', 'characters', false), null);
console.log('✓ Library workspace permits exactly one active Library');

const configuredFbxReadiness = createThreeDModelLibraryReadiness({
  modelType: 'fbx',
  filePath: 'https://assets.example.test/barn.fbx',
  mainModelFileId: 10,
  files: [
    { id: 10, fileType: 'model', filePath: 'https://assets.example.test/barn.fbx' },
    { id: 11, fileType: 'texture', filePath: 'https://assets.example.test/barn.png' },
  ],
  materialAssignments: [{ targetKey: 'mesh:0', channel: 'baseColor' }],
});
assert.deepEqual(configuredFbxReadiness, {
  status: 'ready',
  primaryFileAvailable: true,
  textureAssignmentCount: 1,
  textureFileCount: 1,
  supportingFileCount: 1,
  dependencyStatus: 'available',
  issues: [],
});

const untexturedFbxReadiness = createThreeDModelLibraryReadiness({
  modelType: 'fbx',
  filePath: 'https://assets.example.test/barn.fbx',
  mainModelFileId: 10,
  files: [{ id: 10, fileType: 'model', filePath: 'https://assets.example.test/barn.fbx' }],
  materialAssignments: [],
});
assert.equal(untexturedFbxReadiness.status, 'needs_configuration');
assert.deepEqual(untexturedFbxReadiness.issues, ['missing_texture_source']);

const missingPrimaryReadiness = createThreeDModelLibraryReadiness({
  modelType: 'glb',
  filePath: '',
  mainModelFileId: null,
  files: [],
  materialAssignments: [],
});
assert.equal(missingPrimaryReadiness.status, 'unavailable');
assert.deepEqual(missingPrimaryReadiness.issues, ['missing_primary_file']);
console.log('✓ Model Library readiness distinguishes configured, incomplete, and unavailable assets');

console.log('Validated 5 ThreeD Library placement, workspace, and readiness groups.');

assert.equal(createThreeDModelLibraryReadiness({
  modelType: 'fbx', filePath: 'https://assets.example.test/legacy.fbx', mainModelFileId: null,
  files: [{ id: 99, fileType: 'model', filePath: 'https://assets.example.test/unassigned.fbx' }],
  materialAssignments: [],
}).primaryFileAvailable, false, 'Neither legacy URL nor unassigned Model Files may satisfy primary readiness');

// @ts-expect-error Native Node TypeScript imports use explicit extensions.
const { currentModelAssets, refreshModelMarkerData, currentPlantingModelId } = await import('../services/threed/models/model-snapshot-assets.ts');
const staleSnapshot = { filePath: 'https://example.test/deleted.fbx', files: [{ filePath: 'https://example.test/deleted.png' }], scale: 2 };
const refreshed = { ...staleSnapshot, ...currentModelAssets({ filePath: '', fileSize: null, files: [] }) };
assert.equal(refreshed.filePath, '');
assert.deepEqual(refreshed.files, []);
assert.equal(refreshed.scale, 2);
assert.equal(currentModelAssets(undefined).filePath, '');

// @ts-expect-error Native Node TypeScript imports use explicit extensions.
const { MODEL_FALLBACK_SHAPES, readModelFallbackShape, setModelFallbackShape } = await import('../services/threed/models/model-fallback-core.ts');
for (const shape of MODEL_FALLBACK_SHAPES) {
  const metadata = JSON.parse(setModelFallbackShape(JSON.stringify({ runtimeAdapter: 'existing', animationMap: { idle: 'Idle' } }), shape));
  assert.equal(readModelFallbackShape(metadata), shape);
  assert.deepEqual(metadata.animationMap, { idle: 'Idle' });
  assert.equal(metadata.runtimeAdapter, 'existing');
  const restored = Object.assign({ fallbackShape: 'old' }, currentModelAssets({ metadata }));
  assert.equal(restored.fallbackShape, shape);
}
assert.equal(readModelFallbackShape({ fallbackShape: 'invalid' }), 'sphere');
assert.equal(readModelFallbackShape(null), 'sphere');
assert.throws(() => setModelFallbackShape('{broken', 'sphere'));
assert.throws(() => setModelFallbackShape('[]', 'sphere'));
assert.equal(currentModelAssets(undefined).fallbackShape, 'sphere');
console.log('PASS: generic Model fallback choices preserve metadata, reject malformed JSON, and override stale Project preferences');

// @ts-expect-error Native Node TypeScript imports use explicit extensions.
const { hasModelLoadFailure, reportModelLoadFailure, subscribeModelLoadFailures } = await import('../services/threed/models/model-load-failures.ts');
let failureNotifications = 0;
const unsubscribeFailures = subscribeModelLoadFailures(() => failureNotifications++);
const clearFirstFailure = reportModelLoadFailure(11, 'failed.fbx');
const clearSecondFailure = reportModelLoadFailure(11, 'failed.fbx');
assert.equal(hasModelLoadFailure(11, 'failed.fbx'), true);
assert.equal(hasModelLoadFailure(12, 'failed.fbx'), false);
assert.equal(hasModelLoadFailure(11, 'replacement.fbx'), false);
clearFirstFailure();
assert.equal(hasModelLoadFailure(11, 'failed.fbx'), true);
clearSecondFailure();
clearSecondFailure();
assert.equal(hasModelLoadFailure(11, 'failed.fbx'), false);
assert.equal(failureNotifications, 4);
unsubscribeFailures();
console.log('PASS: DetailsCard load-failure reports isolate Models/URLs and clear on recovery or unmount');

const currentPrimary = { filePath: 'https://example.test/current.fbx', fileSize: 100, mainModelFileId: 22, files: [{ id: 22, filePath: 'https://example.test/current.fbx' }] };
let moved = refreshModelMarkerData({ ...staleSnapshot, rotationYInstance: 45, scaleMultiplier: 3 }, 11, currentPrimary);
for (let save = 0; save < 2; save++) {
  moved = refreshModelMarkerData(moved, 11, currentPrimary);
  assert.equal(moved.filePath, currentPrimary.filePath);
  assert.deepEqual(moved.files, currentPrimary.files);
  assert.equal(moved.rotationYInstance, 45);
  assert.equal(moved.scaleMultiplier, 3);
}
const removedPrimary = refreshModelMarkerData(moved, 11, undefined);
assert.equal(removedPrimary.filePath, '');
assert.equal(removedPrimary.fileSize, null);
assert.equal(removedPrimary.mainModelFileId, null);
assert.deepEqual(removedPrimary.files, []);
assert.equal(currentPlantingModelId({ customModelId: 11, plantModelId: 12 }), 11);
assert.equal(currentPlantingModelId({ customModelId: null, plantModelId: 12 }), 12);
assert.equal(currentPlantingModelId({ customModelId: null, plantModelId: null }), null);
assert.equal(currentPlantingModelId(undefined), null);
console.log('PASS: repeated Model saves refresh current assets, clear removed files, preserve transforms, and select current Planting assignments');
