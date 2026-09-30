import { acceptsSensorEntry, sensorEntryNormal } from '../services/threed/physics/sensor-direction-core';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { parseProjectSensorSnapshot, restoreProjectSensorState } from '../services/threed/physics/sensor-snapshot-core';
import { parseThreeDProjectViewState } from '../services/threed/markers/project-view-state-core';
import assert from 'node:assert/strict';
import { readPhysicsSensorCuboids, validatePhysicsSensorCuboids } from '../services/threed/physics/sensor-cuboid-core';
import { createSensorCounterState, reduceSensorCounterEvent, reconcileSensorCounters, reconcileSensorOccupancyWithPhysics, resetSensorCounts, sensorMemberKey, type SensorMember, type SensorCounterState } from '../services/threed/physics/sensor-counter-core';
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
const goalMember: SensorMember = { id: 'home-goal', name: 'Home Goal', groupId: 'imported-sensors', behavior: 'counter', ownerMarkerId: 2949 };
const sharedModel = { moduleType: 'models' as const, assetId: 53 };
const goal = { moduleType: 'models' as const, assetId: 51 };
const ballA = createThreeDRapierPhysicsEventAdapter({ projectId: 15, source: sharedModel, sourceMarkerId: 2953 });
const ballB = createThreeDRapierPhysicsEventAdapter({ projectId: 15, source: sharedModel, sourceMarkerId: 2950 });
const goalEvent = (adapter: typeof ballA, kind: 'sensor-enter' | 'sensor-exit') => adapter.observe({
  kind, occurredAt: '2026-09-23T12:00:00Z', target: goal,
  sensor: { ownerMarkerId: goalMember.ownerMarkerId, id: goalMember.id },
});
let goalState = createSensorCounterState();
goalState = reduceSensorCounterEvent(goalState, goalEvent(ballA, 'sensor-enter'), 15, [goalMember]);
goalState = reduceSensorCounterEvent(goalState, goalEvent(ballB, 'sensor-enter'), 15, [goalMember]);
assert.equal(goalState.counts[sensorMemberKey(goalMember)], 2);
assert.equal(goalState.occupied.length, 2);
goalState = reduceSensorCounterEvent(goalState, goalEvent(ballA, 'sensor-exit'), 15, [goalMember]);
assert.equal(goalState.occupied.length, 1);
goalState = reduceSensorCounterEvent(goalState, goalEvent(ballB, 'sensor-enter'), 15, [goalMember]);
assert.equal(goalState.counts[sensorMemberKey(goalMember)], 2);
goalState = reduceSensorCounterEvent(goalState, goalEvent(ballA, 'sensor-enter'), 15, [goalMember]);
assert.equal(goalState.counts[sensorMemberKey(goalMember)], 3);
assert(contacts.observe('sensor-enter', 'home-goal', 'marker:2953', 7));
assert(contacts.observe('sensor-enter', 'home-goal', 'marker:2950', 8));
console.log('  ✓ Distinct Project balls sharing one Model count and exit independently');
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

const savedSensors = parseProjectSensorSnapshot(JSON.parse(JSON.stringify({ version: 1, projectId: 15, ...goalState })));
let restored = restoreProjectSensorState(savedSensors, 15);
const savedCount = restored.counts[sensorMemberKey(goalMember)];
restored = reduceSensorCounterEvent(restored, goalEvent(ballA, 'sensor-enter'), 15, [goalMember]);
assert.equal(restored.counts[sensorMemberKey(goalMember)], savedCount, 'Loading a ball already in the goal must not count it twice');
restored = reduceSensorCounterEvent(restored, goalEvent(ballA, 'sensor-exit'), 15, [goalMember]);
restored = reduceSensorCounterEvent(restored, goalEvent(ballA, 'sensor-enter'), 15, [goalMember]);
assert.equal(restored.counts[sensorMemberKey(goalMember)], savedCount + 1);
assert.deepEqual(restoreProjectSensorState(savedSensors, 16), createSensorCounterState());
assert.deepEqual(restoreProjectSensorState(undefined, 15), createSensorCounterState());
assert.deepEqual(reconcileSensorCounters(restored, []).counts, {});
assert.equal(reconcileSensorCounters(restored, [{ ...goalMember, name: 'Renamed goal' }]).counts[sensorMemberKey(goalMember)], savedCount + 1);
const resetSaved = parseProjectSensorSnapshot({ version: 1, projectId: 15, ...resetSensorCounts(restored) });
assert.deepEqual(restoreProjectSensorState(resetSaved, 15).counts, {});
assert.deepEqual(restoreProjectSensorState(resetSaved, 15).occupied, restored.occupied, 'Saving a reset retains occupancy deduplication');
for (const invalid of [
  { ...savedSensors, version: 2 }, { ...savedSensors, projectId: -1 },
  { ...savedSensors, counts: { [sensorMemberKey(goalMember)]: -1 } },
  { ...savedSensors, counts: { [sensorMemberKey(goalMember)]: 1.5 } },
  { ...savedSensors, counts: { wrong: 1 } },
  { ...savedSensors, occupied: ['invalid'] },
]) assert.throws(() => parseProjectSensorSnapshot(invalid));

// Capture the actual Scene save provider, including counts changed after registration.
const sceneSource = ts.createSourceFile('ThreeDScene.tsx', fs.readFileSync('src/components/map/ThreeDScene.tsx', 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let providerNode: ts.ArrowFunction | undefined;
let reconcileNode: ts.ArrowFunction | undefined;
const findSensorAdapters = (node: ts.Node) => {
  if (ts.isCallExpression(node) && node.expression.getText(sceneSource) === 'onViewStateProviderChange'
    && node.arguments[0] && ts.isArrowFunction(node.arguments[0])) providerNode = node.arguments[0];
  if (ts.isCallExpression(node) && node.expression.getText(sceneSource) === 'useEffect'
    && node.arguments[0] && ts.isArrowFunction(node.arguments[0])
    && node.arguments[0].getText(sceneSource).includes('const activeOwners')) reconcileNode = node.arguments[0];
  ts.forEachChild(node, findSensorAdapters);
};
findSensorAdapters(sceneSource);
const provider = providerNode as ts.ArrowFunction | undefined;
const reconcileEffect = reconcileNode as ts.ArrowFunction | undefined;
assert(provider && reconcileEffect);
const sensorRef = { current: goalState };
const capture = vm.runInNewContext(ts.transpileModule(`const capture = ${provider.getText(sceneSource)}; capture;`,
  { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, {
  controlsRef: { current: null }, activeLayers: new Set(['models']), availableLayers: ['models'], envPreset: 'default-daylight',
  sunlight: undefined, extraGround: undefined, groundMap: undefined, autoRotate: false,
  showGrid: false, showLegend: false, showGizmoCube: true, showControls: false, physicsDebug: false,
  projectId: 15, sensorCounterStateRef: sensorRef, activeScenario: null,
  scenarioInstructionVisible: false, showSensors: true, viewPresets: [],
});
const view = { version: 1, savedAt: '2026-09-29T12:00:00Z', viewMode: '3d', panelHeight: 50, cameraMode: 'stationary', threeD: capture() };
assert.deepEqual(parseThreeDProjectViewState(JSON.parse(JSON.stringify(view))).threeD?.sensorState, savedSensors);
sensorRef.current = resetSensorCounts(goalState);
assert.deepEqual(JSON.parse(JSON.stringify(capture().sensorState.counts)), {}, 'Save provider reads current counts instead of a stale closure');
let reconciled = restoreProjectSensorState(savedSensors, 15);
const effect = vm.runInNewContext(ts.transpileModule(`const effect = ${reconcileEffect.getText(sceneSource)}; effect;`,
  { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, {
  sceneMarkers: [2949, 2953, 2950].map(id => ({ id: `models-${id}`, type: 'models', data: { id, projectMarkerId: id } })),
  activeLayers: new Set(['models']), visibleMarkerIds: undefined, normalizeSceneLayerType: (type: string) => type,
  sensorMembers: [goalMember], reconcileSensorCounters,
  setSensorCounterState: (update: (current: typeof reconciled) => typeof reconciled) => { reconciled = update(reconciled); },
});
effect();
assert.deepEqual(reconciled.occupied, savedSensors.occupied, 'Scene reconciliation must retain Project-instance occupancy on restore');
console.log('PASS: Project sensor snapshot round-trip, live save provider, reset, no duplicate goal on reload, re-entry, membership, instance occupancy and Project isolation.');

// Direction survives the same validator used by Sensor PATCH and metadata reload.
assert.equal(sensors[0].direction, 'bidirectional');
for (const field of ['direction', 'entrySide']) {
  assert.equal(validatePhysicsSensorCuboids([{ ...sensors[0], [field]: 'invalid' }]).success, false);
}
const oneWay = { ...sensors[0], direction: 'unidirectional' as const, directionSpace: 'local' as const, entrySide: 'positive-z' as const };
assert.equal(readPhysicsSensorCuboids({ physicsSensorCuboids: JSON.parse(JSON.stringify([oneWay])) })[0].direction, 'unidirectional');
const pose = { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 } };
const front = { position: { x: 0, y: 0, z: 1 }, velocity: { x: 0, y: 0, z: -2 } };
const back = { position: { x: 0, y: 0, z: -1 }, velocity: { x: 0, y: 0, z: 2 } };
assert(acceptsSensorEntry(oneWay, pose, front));
assert(!acceptsSensorEntry(oneWay, pose, back));
assert(!acceptsSensorEntry(oneWay, pose, { ...front, velocity: { x: 0, y: 0, z: 0 } }));
assert(!acceptsSensorEntry(oneWay, pose, { ...front, velocity: { x: 2, y: 0, z: 0 } }));
assert(acceptsSensorEntry({ ...oneWay, entrySide: 'negative-z' }, pose, back));
assert(acceptsSensorEntry({ direction: 'bidirectional' }, pose, back));
assert(acceptsSensorEntry({}, pose, front));
assert(acceptsSensorEntry(oneWay, { ...pose, rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 } },
  { position: { x: 1, y: 0, z: 0 }, velocity: { x: -2, y: 0, z: 0 } }));
// Execute the actual Scene callback: reverse entries are tracked for exit cleanup but never emitted.
let emitNode: ts.ArrowFunction | undefined;
const findEmit = (node: ts.Node) => {
  if (ts.isCallExpression(node) && node.expression.getText(sceneSource) === 'useCallback'
    && node.arguments[0] && ts.isArrowFunction(node.arguments[0])
    && node.arguments[0].getText(sceneSource).includes('contactsRef.current.observe')) emitNode = node.arguments[0];
  ts.forEachChild(node, findEmit);
};
findEmit(sceneSource);
assert(emitNode);
let directionState = createSensorCounterState();
const directionMember = { ...oneWay, ownerMarkerId: 2949 };
const emitDirection = vm.runInNewContext(ts.transpileModule(`const emit = ${emitNode.getText(sceneSource)}; emit;`,
  { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, {
  enabled: true, projectId: 15, target: goal, marker: { data: { projectMarkerId: 2949 } },
  contactsRef: { current: new SensorContactTracker() }, adaptersRef: { current: new Map() },
  acceptsSensorEntry, createThreeDRapierPhysicsEventAdapter,
  onPhysicsEvent: (event: Parameters<typeof reduceSensorCounterEvent>[1]) => {
    directionState = reduceSensorCounterEvent(directionState, event, 15, [directionMember]);
  },
});
const payload = (motion: typeof front) => ({
  target: { collider: { translation: () => pose.position, rotation: () => pose.rotation } },
  other: { collider: { handle: 7, isSensor: () => false, translation: () => motion.position },
    rigidBody: { linvel: () => motion.velocity },
    rigidBodyObject: { userData: { threeDPhysics: { identity: sharedModel, projectMarkerId: 2953, isMovableBall: true } } } },
});
emitDirection('sensor-enter', payload(back), oneWay);
assert.equal(directionState.counts[sensorMemberKey(directionMember)], undefined);
emitDirection('sensor-exit', payload(back), oneWay);
for (let count = 1; count <= 2; count++) {
  emitDirection('sensor-enter', payload(front), oneWay);
  emitDirection('sensor-enter', payload(front), oneWay);
  assert.equal(directionState.counts[sensorMemberKey(directionMember)], count);
  emitDirection('sensor-exit', payload(back), oneWay);
}
console.log('PASS: Sensor direction validation, persistence, reversed and rotated entry, stationary rejection, actual Scene filtering and repeated goals.');

for (const entrySide of ['positive-x', 'negative-x'] as const) {
  const sensor = { ...oneWay, entrySide };
  const saved = readPhysicsSensorCuboids({ physicsSensorCuboids: JSON.parse(JSON.stringify([sensor])) });
  assert.equal(saved[0].entrySide, entrySide);
  const normal = sensorEntryNormal(entrySide);
  const sign = entrySide === 'positive-x' ? 1 : -1;
  assert.deepEqual(normal, { x: sign, y: 0, z: 0 });
  for (const angle of [0, Math.PI / 4, Math.PI / 2]) {
    const rotation = { x: 0, y: Math.sin(angle / 2), z: 0, w: Math.cos(angle / 2) };
    const position = { x: sign * Math.cos(angle), y: 0, z: -sign * Math.sin(angle) };
    const velocity = { x: -position.x * 2, y: 0, z: -position.z * 2 };
    assert(acceptsSensorEntry(sensor, { ...pose, rotation }, { position, velocity }), `${entrySide} accepts rotated inward travel`);
    assert(!acceptsSensorEntry(sensor, { ...pose, rotation }, { position, velocity: position }), 'Outward travel rejected');
    assert(!acceptsSensorEntry(sensor, { ...pose, rotation }, { position: velocity, velocity: position }), 'Opposite entry rejected');
  }
  const before = directionState.counts[sensorMemberKey(directionMember)] ?? 0;
  const motion = { position: { x: sign, y: 0, z: 0 }, velocity: { x: -sign * 2, y: 0, z: 0 } };
  emitDirection('sensor-enter', payload(motion), sensor);
  assert.equal(directionState.counts[sensorMemberKey(directionMember)], before + 1);
  emitDirection('sensor-exit', payload(motion), sensor);
}
console.log('PASS: Both local X directions persist and filter actual Scene entries; 45° and 90° world rotations preserve the chosen entry side.');

const sceneDirection = { ...oneWay, entrySide: 'positive-x' as const, directionSpace: 'world' as const };
for (const angle of [0, Math.PI / 4, Math.PI / 2, Math.PI]) {
  const rotatedPose = { ...pose, rotation: { x: 0, y: Math.sin(angle / 2), z: 0, w: Math.cos(angle / 2) } };
  for (const x of [1, 0, -0.1]) {
    assert(acceptsSensorEntry(sceneDirection, rotatedPose, { position: { x, y: 0, z: 0 }, velocity: { x: -2, y: 0, z: 0 } }));
    assert(!acceptsSensorEntry(sceneDirection, rotatedPose, { position: { x, y: 0, z: 0 }, velocity: { x: 2, y: 0, z: 0 } }));
  }
}
assert.equal(readPhysicsSensorCuboids({ physicsSensorCuboids: [{ ...oneWay, directionSpace: undefined }] })[0].directionSpace, 'world');
assert.equal(validatePhysicsSensorCuboids([{ ...oneWay, directionSpace: 'invalid' }]).success, false);
console.log('PASS: Scene X decreases regardless of sensor rotation or post-step centre position.');
// Execute camera initialization across changed marker bounds and a Project switch.
const cameraStart = sceneSource.text.indexOf('  if (!initialCameraRef.current ||');
const cameraEnd = sceneSource.text.indexOf('  const initialCamera =', cameraStart);
assert(cameraStart > 0 && cameraEnd > cameraStart);
const cameraContext = vm.createContext({ initialCameraRef: { current: null as any }, projectId: 15, centerX: 10, centerZ: 20, cameraDistance: 30 });
const initCamera = new vm.Script(ts.transpileModule(sceneSource.text.slice(cameraStart, cameraEnd), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText);
initCamera.runInContext(cameraContext);
const originalCamera = cameraContext.initialCameraRef.current;
cameraContext.centerX = -500; cameraContext.centerZ = 300; cameraContext.cameraDistance = 100;
initCamera.runInContext(cameraContext);
assert.equal(cameraContext.initialCameraRef.current, originalCamera, 'Moving a marker must preserve camera prop identity');
cameraContext.projectId = 16;
initCamera.runInContext(cameraContext);
assert.notEqual(cameraContext.initialCameraRef.current, originalCamera, 'New Project receives its own initial view');
assert(sceneSource.text.includes('position: initialCamera.position'));
assert(sceneSource.text.includes('target={initialCamera.target}'));
console.log('PASS: Scene camera position/target remain stable across marker moves and initialize for a new Project.');

// Installed Rapier proves saved "inside" only while the ball actually overlaps.
const require = createRequire(import.meta.url);
const rapier = require(require.resolve('@dimforge/rapier3d-compat', { paths: [path.dirname(require.resolve('@react-three/rapier'))] }));
await rapier.init();
const world = new rapier.World({ x: 0, y: 0, z: 0 });
const owner = world.createRigidBody(rapier.RigidBodyDesc.fixed());
const sensorCollider = world.createCollider(rapier.ColliderDesc.cuboid(0.1, 2, 2).setSensor(true), owner);
const ballBody = world.createRigidBody(rapier.RigidBodyDesc.dynamic().setTranslation(0, 0, 0));
const ballCollider = world.createCollider(rapier.ColliderDesc.ball(0.25), ballBody);
world.step();
const occupiedKey = `${sensorMemberKey(goalMember)}|marker:2953`;
let physicsState: SensorCounterState = { counts: { [sensorMemberKey(goalMember)]: 1 }, occupied: [occupiedKey] };
const verifyOverlap = () => reconcileSensorOccupancyWithPhysics(physicsState,
  (sensorKey, sourceKey) => sensorKey === sensorMemberKey(goalMember) && sourceKey === 'marker:2953'
    ? world.intersectionPair(sensorCollider, ballCollider) : undefined);
assert(world.intersectionPair(sensorCollider, ballCollider));
assert.equal(verifyOverlap(), physicsState, 'A ball restored inside must not add or lose a goal');
assert.equal(reconcileSensorOccupancyWithPhysics(physicsState, () => undefined), physicsState,
  'Loading owners must not clear saved occupancy');
ballBody.setTranslation({ x: 3, y: 0, z: 0 }, true);
world.step();
assert.equal(world.intersectionPair(sensorCollider, ballCollider), false);
physicsState = verifyOverlap();
assert.deepEqual(physicsState.occupied, [], 'Separated ball clears stale saved occupancy');
assert.equal(physicsState.counts[sensorMemberKey(goalMember)], 1, 'Separation does not erase saved goals');
physicsState = reduceSensorCounterEvent(physicsState, goalEvent(ballA, 'sensor-enter'), 15, [goalMember]);
assert.equal(physicsState.counts[sensorMemberKey(goalMember)], 2, 'A later entry scores again');
assert(sceneSource.text.includes('name={`threed-sensor:'));
assert(sceneSource.text.includes('<SensorOccupancySync stateRef={sensorCounterStateRef}'));
console.log('PASS: installed Rapier reconciles saved occupancy, preserves inside/no-load state, and permits repeat goals after separation.');
