import assert from 'node:assert/strict';
import {
  alignFarmBotPhysicalPosition,
  FarmBotCoordinateAlignmentError,
  normalizeFarmBotCoordinateAlignment,
  type FarmBotCoordinateAlignmentV1,
} from '../services/threed/farmbot/coordinate-alignment-core';

const alignment: FarmBotCoordinateAlignmentV1 = {
  version: 1,
  sceneOrigin: { x: 10, y: 2, z: -4 },
  millimetersPerSceneUnit: 100,
  yawDegrees: 90,
  axisSigns: { x: 1, y: -1, z: -1 },
  physicalBounds: {
    x: [0, 3000],
    y: [0, 1500],
    z: [-500, 1000],
  },
};

const normalized = normalizeFarmBotCoordinateAlignment(alignment);
assert(Object.isFrozen(normalized));
assert(Object.isFrozen(normalized.sceneOrigin));
assert(Object.isFrozen(normalized.axisSigns));
assert(Object.isFrozen(normalized.physicalBounds));
console.log('  ✓ Alignment configuration is explicit, bounded, and immutable');

const origin = alignFarmBotPhysicalPosition({
  alignment,
  physicalPosition: { x: 0, y: 0, z: 0 },
});
assert.deepEqual(origin, { x: 10, y: 2, z: -4 });

const lengthFixture = alignFarmBotPhysicalPosition({
  alignment,
  physicalPosition: { x: 1000, y: 0, z: 0 },
});
assert(Math.abs(lengthFixture.x - 10) < 1e-12);
assert(Math.abs(lengthFixture.y - 2) < 1e-12);
assert(Math.abs(lengthFixture.z - 6) < 1e-12);

const combinedFixture = alignFarmBotPhysicalPosition({
  alignment,
  physicalPosition: { x: 1000, y: 500, z: 200 },
});
assert(Math.abs(combinedFixture.x - 15) < 1e-12);
assert(Math.abs(combinedFixture.y - 0) < 1e-12);
assert(Math.abs(combinedFixture.z - 6) < 1e-12);
console.log('  ✓ Three physical fixtures map exactly through origin, scale, signs, and yaw');

assert.throws(
  () => alignFarmBotPhysicalPosition({ alignment, physicalPosition: { x: 3001, y: 0, z: 0 } }),
  (error) => error instanceof FarmBotCoordinateAlignmentError && error.code === 'outside_working_bounds',
);
assert.throws(
  () => alignFarmBotPhysicalPosition({ alignment, physicalPosition: { x: Number.NaN, y: 0, z: 0 } }),
  (error) => error instanceof FarmBotCoordinateAlignmentError && error.code === 'invalid_position',
);
assert.throws(
  () => normalizeFarmBotCoordinateAlignment({ ...alignment, millimetersPerSceneUnit: 0 }),
  (error) => error instanceof FarmBotCoordinateAlignmentError && error.code === 'invalid_alignment',
);
assert.throws(
  () => normalizeFarmBotCoordinateAlignment({ ...alignment, axisSigns: { x: 1, y: 0, z: 1 } as never }),
  (error) => error instanceof FarmBotCoordinateAlignmentError && error.code === 'invalid_alignment',
);
console.log('  ✓ Invalid calibration and out-of-bounds observations fail closed');

console.log('PASS: ThreeD FarmBot Coordinate Alignment — 3 validation groups completed');
