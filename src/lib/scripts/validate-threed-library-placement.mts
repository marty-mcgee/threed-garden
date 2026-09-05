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

console.log('Validated 4 ThreeD Library placement and workspace groups.');
