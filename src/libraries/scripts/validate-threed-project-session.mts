import assert from 'node:assert/strict';

import {
  buildThreeDProjectSession,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/map/threed-project-session-core.ts';

const result = buildThreeDProjectSession({
  success: true,
  total: 3,
  data: {
    characters: [{ id: 9, positionX: '1.5', positionY: '2', positionZ: '-3' }],
    chpCadIncidents: [{ id: 4, latitude: '39.5', longitude: '-123.7' }],
  },
  markerSnapshot: [{ id: 1068, positionX: '4', positionY: '5', positionZ: '6' }],
  projectContext: {
    projectName: 'Session Project',
    threedModules: [{ id: '7', name: 'Garden' }, { id: 0, name: 'Invalid' }],
    geographicOrigin: {
      latitude: '39.5',
      longitude: '-123.7',
      altitude: '10',
      headingDegrees: '45',
      metersPerSceneUnit: '0.3048',
    },
    viewState: null,
  },
}, '8');

assert.equal(result.success, true);
if (!result.success) throw new Error('Expected a successful Project session');
assert.equal(result.session.projectName, 'Session Project');
assert.equal(result.session.hasData, true);
assert.deepEqual(result.session.threedModules, [{ id: 7, name: 'Garden' }]);
assert.equal(result.session.data.threed.raw?.characters[0]?.positionX, 1.5);
assert.equal(result.session.data.threed.raw?.projectThreedMarkers?.[0]?.positionZ, 6);
assert.equal(result.session.data.traffic.raw?.chpCadIncidents[0]?.latitude, 39.5);
assert.equal(result.session.data.threed.total, 2);
assert.equal(result.session.data.traffic.total, 1);
assert.equal(result.session.geographicOrigin?.metersPerSceneUnit, 0.3048);
console.log('✓ Project session response preserves modules, coordinates, counts, and marker snapshots');

assert.deepEqual(buildThreeDProjectSession({ success: false, error: 'Unavailable' }, '8'), {
  success: false,
  error: 'Unavailable',
});
console.log('✓ Project session response preserves bounded API failures');

console.log('Validated 2 ThreeD Project session groups.');

// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
const { canReadSceneProject, canRenderAssignedModel } = await import('../services/project/scene-read-policy.ts');
for (const viewer of [undefined, 'other']) {
  assert.equal(canReadSceneProject({ userId: 'owner', isPublic: true }, viewer), true);
  assert.equal(canReadSceneProject({ userId: 'owner', isPublic: false }, viewer), false);
}
assert.equal(canReadSceneProject({ userId: 'owner', isPublic: false }, 'owner'), true);
assert.equal(canReadSceneProject({ userId: null, isPublic: true }), false);
const privateModel = { userId: 'owner', isPublic: false, isLibraryItem: false, isActive: true, status: 'active' };
assert.equal(canRenderAssignedModel(privateModel, 'owner', false), true);
assert.equal(canRenderAssignedModel(privateModel, 'another-owner', false), false);
assert.equal(canRenderAssignedModel({ ...privateModel, isActive: false }, 'owner', false), false);
assert.equal(canRenderAssignedModel({ ...privateModel, isActive: false }, 'owner', true), true);
assert.equal(canRenderAssignedModel({ ...privateModel, isPublic: true, isLibraryItem: true }, 'another-owner', false), true);
assert.equal(canRenderAssignedModel({ ...privateModel, status: 'inactive', isPublic: true, isLibraryItem: true }, 'another-owner', false), false);
const guestSession = buildThreeDProjectSession({ success: true, data: {}, projectContext: {} }, '8');
assert(guestSession.success); assert.equal(guestSession.session.canEdit, false);
const ownerSession = buildThreeDProjectSession({ success: true, data: {}, projectContext: { canEdit: true } }, '8');
assert(ownerSession.success); assert.equal(ownerSession.session.canEdit, true);
console.log('PASS: public/private Project reads, assigned Model publication, cross-owner denial, active policy and edit capability');
