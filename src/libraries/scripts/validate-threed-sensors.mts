import assert from 'node:assert/strict';
import { readPhysicsSensorCuboids, validatePhysicsSensorCuboids } from '../services/threed/physics/sensor-cuboid-core';
import { createSensorCounterState, reduceSensorCounterEvent, reconcileSensorCounters, resetSensorCounts, sensorMemberKey, type SensorMember } from '../services/threed/physics/sensor-counter-core';
import { SensorContactTracker } from '../services/threed/physics/sensor-contact-core';
import { readSensorGroups } from '../services/threed/physics/sensor-group-core';
import { createThreeDRapierPhysicsEventAdapter } from '../services/threed/physics/rapier-physics-event-adapter';
import { ThreeDPhysicsEventBuffer, normalizeThreeDPhysicsEvent } from '../services/threed/physics/physics-event-core';
import { readModelVolumeSensor } from '../services/threed/physics/sensor-legacy-compat';
const geometry = { position: { x: 1, y: 2, z: 3 }, width: 4, height: 5, depth: 0.2, rotationY: 120 };
const sensors = readPhysicsSensorCuboids({ physicsSensorCuboids: [
  { ...geometry, id: 'sensor_' + 'a'.repeat(32), name: 'Entrance A', behavior: 'counter', detection: 'model', groupId: 'building' },
  { ...geometry, id: 'sensor_b', name: 'Entrance B', behavior: 'counter', detection: 'movable-ball', groupId: 'building' },
  { ...geometry, id: 'trigger', name: 'Observation', behavior: 'trigger', detection: 'model' },
] });
assert.equal(sensors.length, 3);
assert(!validatePhysicsSensorCuboids([{ ...sensors[0], behavior: 'unknown' }]).success);
assert(!validatePhysicsSensorCuboids([{ ...sensors[0], detection: 'unknown' }]).success);
assert(!validatePhysicsSensorCuboids([{ ...sensors[0], groupId: {} }]).success);
const members: SensorMember[] = sensors.map((sensor, index) => ({ ...sensor, ownerMarkerId: index === 1 ? 300 : 200 }));
const adapter = createThreeDRapierPhysicsEventAdapter({ projectId: 15, source: { moduleType: 'models', assetId: 10 } });
const event = (index: number, kind: 'sensor-enter' | 'sensor-exit' = 'sensor-enter') => adapter.observe({
  kind, occurredAt: '2026-09-23T12:00:00Z', sensor: { ownerMarkerId: members[index].ownerMarkerId, id: members[index].id },
  target: { moduleType: 'beds', assetId: 42 },
});
const entry = event(0);
assert.equal(entry.sensor?.id, sensors[0].id);
assert(Object.isFrozen(entry.sensor));
let state = reduceSensorCounterEvent(createSensorCounterState(), entry, 15, members);
assert.equal(state.counts[sensorMemberKey(members[0])], 1);
state = reduceSensorCounterEvent(state, event(0), 15, members);
assert.equal(state.counts[sensorMemberKey(members[0])], 1);
state = reduceSensorCounterEvent(state, event(1), 15, members);
assert.equal(state.counts[sensorMemberKey(members[1])], 1);
assert.equal(Object.keys(reduceSensorCounterEvent(state, event(2), 15, members).counts).length, 2);
assert.equal(reduceSensorCounterEvent(state, event(0), 16, members), state);
state = reduceSensorCounterEvent(state, event(0, 'sensor-exit'), 15, members);
state = reduceSensorCounterEvent(state, event(0), 15, members);
assert.equal(state.counts[sensorMemberKey(members[0])], 2);
const renamed = members.map(member => ({ ...member, name: 'New name', groupId: 'renamed-group' }));
assert.deepEqual(reconcileSensorCounters(state, renamed), state);
state = resetSensorCounts(state);
state = reduceSensorCounterEvent(state, event(0), 15, members);
assert.equal(state.counts[sensorMemberKey(members[0])], undefined);
const removed = reconcileSensorCounters(state, members.slice(1));
assert(!removed.occupied.some(key => key.startsWith(sensorMemberKey(members[0]) + '|')));
const buffer = new ThreeDPhysicsEventBuffer({ minimumIntervalMs: 0 });
assert.equal(buffer.append(entry).status, 'accepted');
assert.equal(buffer.append(entry).status, 'duplicate');
assert.equal(buffer.append(event(1)).status, 'accepted');
assert.throws(() => normalizeThreeDPhysicsEvent({ ...entry, sensor: { ownerMarkerId: -1, id: 'x' } }));
assert.throws(() => normalizeThreeDPhysicsEvent({ ...entry, sensor: { ownerMarkerId: 1, id: 'x'.repeat(65) } }));
const contacts = new SensorContactTracker();
assert(contacts.observe('sensor-enter', 'sensor', 'models:1', 5));
assert(!contacts.observe('sensor-enter', 'sensor', 'models:1', 5));
assert(!contacts.observe('sensor-enter', 'sensor', 'models:1', 6));
assert(!contacts.observe('sensor-exit', 'sensor', 'models:1', 5));
assert(contacts.observe('sensor-exit', 'sensor', 'models:1', 6));
assert(!contacts.observe('sensor-exit', 'sensor', 'models:1', 6));
assert(contacts.observe('sensor-enter', 'sensor', 'models:1', 5));
assert(contacts.observe('sensor-enter', 'sensor', 'models:2', 8));
contacts.clear();
assert(contacts.observe('sensor-enter', 'sensor', 'models:1', 5));
assert.deepEqual(readSensorGroups([{ id: 'group', name: ' My Group ' }]), [{ id: 'group', name: 'My Group' }]);
assert.throws(() => readSensorGroups([{ id: 'a', name: 'A' }, { id: 'a', name: 'B' }]));
assert.throws(() => readSensorGroups([{ id: 'a', name: '' }]));
const migrated = readPhysicsSensorCuboids({ soccerGoalSensors: [{ ...geometry, id: 'original', name: 'Home Goal', scoresFor: 'home' }] });
assert.equal(migrated[0].behavior, 'counter');
assert.equal(migrated[0].groupId, 'imported-sensors');
assert.deepEqual(migrated[0].position, geometry.position);
assert(!JSON.stringify(migrated).includes('scoresFor'));
assert.equal(readModelVolumeSensor({ soccerGoalScoresFor: 'away' })?.id, 'model-volume');
assert.equal(readModelVolumeSensor({ soccerGoalScoresFor: 'away', physicsVolumeSensor: false }), null);
console.log('PASS: neutral sensors, arbitrary cross-owner groups, identity-based counts, occupancy, reset, Project isolation, compound bodies, long IDs and legacy reading');
