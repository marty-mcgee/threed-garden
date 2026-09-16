import assert from 'node:assert/strict';
// @ts-ignore Node strip-types requires the explicit source extension.
import { planThreeDEnvironmentCollisionPreview } from '../services/threed/models/environment-collision-preview-core.ts';

for (const thickness of [0, 0.05]) {
  const plan = planThreeDEnvironmentCollisionPreview([
    { sourcePath: 'Pitch', center: [10, 0.5, -5], halfExtents: [40, thickness, 25] },
    { sourcePath: 'Fence', center: [0, 2, 0], halfExtents: [0.2, 2, 15] },
  ]);
  assert.equal(plan.groundBoxes?.length, 1);
  const floor = plan.groundBoxes![0];
  assert.equal(floor.center[1] + floor.halfExtents[1], 0.5 + thickness);
  assert(floor.halfExtents[1] > 0);
  assert.deepEqual([floor.center[0], floor.center[2]], [10, -5]);
  assert.equal(plan.boxes.length, 1, 'Fence remains in the obstacle pipeline');
}
const invalid = planThreeDEnvironmentCollisionPreview([
  { sourcePath: 'Invalid', center: [0, NaN, 0], halfExtents: [40, 0, 25] },
  { sourcePath: 'Negative', center: [0, 0, 0], halfExtents: [40, -1, 25] },
]);
assert.equal(invalid.groundBoxes?.length, 0);
console.log('PASS: flat and thin environment ground preserve surface height; obstacles remain separate; invalid geometry rejected');
