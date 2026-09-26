import assert from 'node:assert/strict';

import {
  buildThreeDModelLibraryCollections,
  filterThreeDModelLibrary,
// @ts-expect-error Native Node TypeScript imports use explicit extensions.
} from '../services/threed/models/model-library-collections-core.ts';

const soccer = { id: 1, name: 'Soccer' , slug: 'soccer', parentId: null };
const farming = { id: 2, name: 'Farming', slug: 'farming', parentId: null };
const models = [
  { id: 1, modelName: 'Practice Pitch', categories: [soccer], libraryReadiness: { status: 'ready' as const } },
  { id: 2, modelName: 'Soccer Ball', categories: [soccer, farming], libraryReadiness: { status: 'ready' as const } },
  { id: 3, modelName: 'Farm House', categories: [farming], libraryReadiness: { status: 'needs_configuration' as const } },
  { id: 4, modelName: 'Unassigned Prop', categories: [], libraryReadiness: { status: 'unavailable' as const } },
];

assert.deepEqual(
  buildThreeDModelLibraryCollections(models).map(({ slug, modelCount }) => [slug, modelCount]),
  [['farming', 2], ['soccer', 2]],
);
assert.deepEqual(filterThreeDModelLibrary(models, 'all', '', 'all').map(model => model.id), [1, 2, 3, 4]);
assert.deepEqual(filterThreeDModelLibrary(models, 'soccer', '', 'ready').map(model => model.id), [1, 2]);
assert.deepEqual(filterThreeDModelLibrary(models, 'farming', 'ball', 'all').map(model => model.id), [2]);
assert.deepEqual(filterThreeDModelLibrary(models, 'all', 'prop', 'unavailable').map(model => model.id), [4]);
console.log('PASS: assigned collections are counted once per Model, multi-category Models remain discoverable, and search/readiness preserve unassigned All Models access.');
