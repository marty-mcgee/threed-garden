import assert from 'node:assert/strict';
import {
  createFarmBotLiveState,
  FarmBotLiveStateError,
} from '../services/threed/farmbot/live-state-core';

const unavailable = createFarmBotLiveState({ projectId: 5, farmbotId: 9, runtime: null });
assert.deepEqual(unavailable, {
  version: 1,
  source: 'farmbot_mqtt',
  projectId: 5,
  farmbotId: 9,
  condition: 'unavailable',
  connectionState: null,
  position: null,
  observedAt: null,
  stateChangedAt: null,
});
assert(Object.isFrozen(unavailable));
console.log('  ✓ Missing runtime maps to an explicit unavailable state');

const baseRuntime = {
  connectionState: 'connected',
  stateChangedAt: new Date('2026-09-21T20:00:00.000Z'),
  lastMessageAt: '2026-09-21T20:00:01.000Z',
  positionX: '12.500',
  positionY: 3,
  positionZ: '-7.250',
  isStale: false,
};
const live = createFarmBotLiveState({ projectId: 5, farmbotId: 9, runtime: baseRuntime });
assert.equal(live.condition, 'live');
assert.deepEqual(live.position, { x: 12.5, y: 3, z: -7.25 });
assert.equal(live.observedAt, '2026-09-21T20:00:01.000Z');
assert(Object.isFrozen(live.position));
assert(!('workerSessionId' in live));
assert(!('brokerDeviceId' in live));
assert(!('tokenExpiresAt' in live));
console.log('  ✓ Live state is bounded, normalized, immutable, and excludes worker fields');

const stale = createFarmBotLiveState({
  projectId: 5,
  farmbotId: 9,
  runtime: { ...baseRuntime, isStale: true },
});
assert.equal(stale.condition, 'stale');
const disconnected = createFarmBotLiveState({
  projectId: 5,
  farmbotId: 9,
  runtime: { ...baseRuntime, connectionState: 'reconnecting' },
});
assert.equal(disconnected.condition, 'disconnected');
const connectedWithoutPosition = createFarmBotLiveState({
  projectId: 5,
  farmbotId: 9,
  runtime: {
    ...baseRuntime,
    positionX: null,
    positionY: null,
    positionZ: null,
  },
});
assert.equal(connectedWithoutPosition.condition, 'stale');
console.log('  ✓ Live, stale, disconnected, and unavailable conditions stay distinct');

const invalidCases: Array<[Record<string, unknown>, string]> = [
  [{ projectId: 0, farmbotId: 9, runtime: baseRuntime }, 'invalid_identity'],
  [{ projectId: 5, farmbotId: 9, runtime: { ...baseRuntime, connectionState: 'online' } }, 'invalid_connection_state'],
  [{ projectId: 5, farmbotId: 9, runtime: { ...baseRuntime, lastMessageAt: 'bad' } }, 'invalid_time'],
  [{ projectId: 5, farmbotId: 9, runtime: { ...baseRuntime, positionX: Infinity } }, 'invalid_position'],
  [{ projectId: 5, farmbotId: 9, runtime: { ...baseRuntime, positionZ: null } }, 'invalid_position'],
  [{ projectId: 5, farmbotId: 9, runtime: { ...baseRuntime, isStale: 'false' } }, 'invalid_stale_state'],
];
for (const [input, code] of invalidCases) {
  assert.throws(
    () => createFarmBotLiveState(input as Parameters<typeof createFarmBotLiveState>[0]),
    (error) => error instanceof FarmBotLiveStateError && error.code === code,
  );
}
console.log('  ✓ Invalid identity, connection, time, position, and freshness fail closed');

console.log('PASS: ThreeD FarmBot Live State — 4 validation groups completed');
