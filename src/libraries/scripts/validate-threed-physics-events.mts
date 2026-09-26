import assert from 'node:assert/strict';
import {
  createThreeDPhysicsEventId,
  normalizeThreeDPhysicsEvent,
  ThreeDPhysicsEventBuffer,
  ThreeDPhysicsEventError,
} from '../services/threed/physics/physics-event-core';
import { createThreeDRapierPhysicsEventAdapter } from '../services/threed/physics/rapier-physics-event-adapter';

const ball = { moduleType: 'models' as const, assetId: 7 };
const goal = { moduleType: 'models' as const, assetId: 12 };
const occurredAt = '2026-09-21T20:00:00.000Z';

const eventId = createThreeDPhysicsEventId({
  projectId: 5,
  kind: 'sensor-enter',
  source: ball,
  target: goal,
  occurredAt,
  sequence: 1,
});
assert.equal(
  eventId,
  'physics:5:sensor-enter:models:7:models:12:1790020800000:1',
);

const event = normalizeThreeDPhysicsEvent({
  projectId: 5,
  sceneEventId: eventId,
  kind: 'sensor-enter',
  source: { moduleType: 'model', assetId: 7 },
  target: goal,
  occurredAt: '2026-09-21T13:00:00-07:00',
  point: { x: 1, y: 2, z: 3 },
  magnitude: 4.5,
  tags: ['soccer', 'goal_zone'],
});
assert.equal(event.version, 1);
assert.deepEqual(event.source, ball);
assert.equal(event.occurredAt, occurredAt);
assert(Object.isFrozen(event));
assert(Object.isFrozen(event.source));
assert(Object.isFrozen(event.point));
assert(Object.isFrozen(event.tags));
console.log('  ✓ Deterministic identity and immutable event normalization');

const invalidInputs: Array<[Partial<Parameters<typeof normalizeThreeDPhysicsEvent>[0]>, string]> = [
  [{ projectId: 0 }, 'invalid_project_id'],
  [{ sceneEventId: 'contains spaces' }, 'invalid_scene_event_id'],
  [{ kind: 'goal' }, 'invalid_kind'],
  [{ source: { moduleType: 'incidents', assetId: 1 } }, 'invalid_identity'],
  [{ occurredAt: 'not-a-time' }, 'invalid_occurred_at'],
  [{ magnitude: -1 }, 'invalid_magnitude'],
  [{ point: { x: Number.NaN, y: 0, z: 0 } }, 'invalid_point'],
  [{ tags: ['UPPERCASE'] }, 'invalid_tags'],
];
for (const [override, code] of invalidInputs) {
  assert.throws(
    () => normalizeThreeDPhysicsEvent({ ...event, ...override }),
    (error) => error instanceof ThreeDPhysicsEventError && error.code === code,
  );
}
console.log('  ✓ Invalid identities, values, coordinates, times, and tags fail closed');

const buffer = new ThreeDPhysicsEventBuffer({ capacity: 2, minimumIntervalMs: 20 });
assert.equal(buffer.append(event).status, 'accepted');
assert.equal(buffer.append(event).status, 'duplicate');
const rapidEvent = { ...event, sceneEventId: `${eventId}:2`, occurredAt: '2026-09-21T20:00:00.010Z' };
assert.equal(buffer.append(rapidEvent).status, 'rate-limited');
const laterEvent = { ...event, sceneEventId: `${eventId}:3`, occurredAt: '2026-09-21T20:00:00.020Z' };
assert.equal(buffer.append(laterEvent).status, 'accepted');
const exitEvent = { ...event, sceneEventId: `${eventId}:4`, kind: 'sensor-exit' as const };
assert.equal(buffer.append(exitEvent).status, 'accepted');
assert.deepEqual(buffer.list().map((item) => item.sceneEventId), [laterEvent.sceneEventId, exitEvent.sceneEventId]);
assert(Object.isFrozen(buffer.list()));
buffer.clear();
assert.equal(buffer.list().length, 0);
assert.throws(() => new ThreeDPhysicsEventBuffer({ capacity: 0 }), /invalid_buffer_options/);
console.log('  ✓ Duplicate, rate, capacity, snapshot, and reset bounds remain deterministic');

const adapterA = createThreeDRapierPhysicsEventAdapter({ projectId: 5, source: ball });
const adapterB = createThreeDRapierPhysicsEventAdapter({ projectId: 5, source: ball });
const observation = { kind: 'contact-start' as const, occurredAt, target: goal, magnitude: 2 };
const firstAdapterEvent = adapterA.observe(observation);
assert.deepEqual(firstAdapterEvent, adapterB.observe(observation));
assert.notEqual(adapterA.observe(observation).sceneEventId, firstAdapterEvent.sceneEventId);
console.log('  ✓ Rapier adapter converts observations without importing Rapier or React');

console.log('PASS: ThreeD Physics Event API — 4 validation groups completed');
