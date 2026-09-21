import assert from 'node:assert/strict';
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
import { createCharacterNavigation, stepCharacterNavigation } from '../services/threed/orchestration/navigation-core.ts';
const initial = createCharacterNavigation('request', 'project-model-12', 0);
const frame = { now: 0, characterPosition: { x: 0, y: 1, z: 0 }, targetPosition: { x: 10, y: 1, z: 0 }, controlled: true, available: true, manualInput: false, taskActive: false, stoppingDistance: 1.5, maxVerticalGap: 1.5 };
let result = stepCharacterNavigation(initial, frame);
assert.equal(result.state.phase, 'walking');
assert.deepEqual(result.direction, { x: 1, y: 0, z: 0 });
assert.equal(initial.bestDistance, Infinity, 'Planner must not mutate input');
assert.equal(stepCharacterNavigation(result.state, { ...frame, now: 4000 }).state.reason, 'no-progress');
assert.equal(stepCharacterNavigation(result.state, { ...frame, now: 4000, characterPosition: { x: 1, y: 1, z: 0 } }).state.phase, 'walking');
assert.equal(stepCharacterNavigation(initial, { ...frame, now: 120000 }).state.reason, 'timeout');
for (const [field, value, reason] of [['controlled', false, 'control-released'], ['available', false, 'unavailable'], ['manualInput', true, 'manual-input'], ['taskActive', true, 'task-started']] as const) {
  const stopped = stepCharacterNavigation(initial, { ...frame, [field]: value });
  assert.equal(stopped.state.reason, reason);
  assert.deepEqual(stopped.direction, { x: 0, y: 0, z: 0 });
  assert.equal(stepCharacterNavigation(stopped.state, frame).state.phase, 'cancelled', 'Terminal requests cannot restart');
}
result = stepCharacterNavigation(initial, { ...frame, characterPosition: { x: 9, y: 1, z: 0 } });
assert.equal(result.state.phase, 'arrived');
assert.deepEqual(result.direction, { x: 0, y: 0, z: 0 });
assert.equal(stepCharacterNavigation(initial, { ...frame, targetPosition: { x: 0, y: 20, z: 0 } }).state.phase, 'walking', 'Same XZ on another floor is not arrival');
assert.equal(stepCharacterNavigation(initial, { ...frame, targetPosition: { x: NaN, y: 0, z: 0 } }).state.reason, 'invalid-position');
assert.equal(stepCharacterNavigation(initial, { ...frame, stoppingDistance: 0 }).state.reason, 'invalid-position');
assert.equal(stepCharacterNavigation(initial, { ...frame, now: -1 }).state.reason, 'invalid-position');
assert.deepEqual(stepCharacterNavigation(initial, { ...frame, targetPosition: { x: 0, y: 1, z: 10 } }).direction, { x: 0, y: 0, z: 1 }, 'Resolve current target position each frame');
assert.equal(stepCharacterNavigation(initial, { ...frame, targetPosition: { x: 0, y: 5, z: 0 }, stoppingDistance: 10 }).state.phase, 'walking', 'Large target radius must not loosen vertical arrival tolerance');
console.log('PASS: Character navigation steering, arrival, interruption, stalled progress, timeout and invalid positions (pure/offline).');
