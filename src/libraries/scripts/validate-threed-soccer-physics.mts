import assert from 'node:assert/strict';
import { Group, Vector3, Quaternion, Euler } from 'three';
import { sceneLocalToWorld, sceneWorldToLocal, sceneOwnerPose, sceneYawDegrees, validSceneTransform } from '../services/threed/transforms/scene-transform-core';
import { createThreeDRapierPhysicsEventAdapter } from '../services/threed/physics/rapier-physics-event-adapter';
import { parseUpdateProjectModelInstance } from '../services/threed/models/project-model-instance-core';
import {
  createInitialSoccerPhysicsState,
  readSoccerGoalScoresFor,
  readSoccerGoalSensors,
  reduceSoccerPhysicsEvent,
} from '../services/threed/physics/soccer-physics-core';
import {
  readPhysicsSensorCuboids,
  validatePhysicsSensorCuboids,
} from '../services/threed/physics/sensor-cuboid-core';

const ball = { moduleType: 'models' as const, assetId: 7 };
const homeGoal = { moduleType: 'models' as const, assetId: 12 };
const awayGoal = { moduleType: 'models' as const, assetId: 13 };

assert.equal(readSoccerGoalScoresFor({ soccerGoalScoresFor: 'home' }), 'home');
assert.equal(readSoccerGoalScoresFor({ soccerGoalScoresFor: 'away' }), 'away');
assert.equal(readSoccerGoalScoresFor({ soccerGoalScoresFor: 'HOME' }), null);
assert.equal(readSoccerGoalScoresFor({ soccerGoalScoresFor: 'goal' }), null);
assert.equal(readSoccerGoalScoresFor(null), null);
console.log('  ✓ Goal roles require explicit supported Project Model metadata');

const sensors = readSoccerGoalSensors({ soccerGoalSensors: [{
  id: 'west_goal',
  name: 'West Goal',
  scoresFor: 'home',
  position: { x: -24, y: 1.25, z: 0 },
  width: 7.32,
  height: 2.44,
  depth: 0.35,
  rotationY: 90,
}] });
assert.equal(sensors.length, 1);
assert.equal(sensors[0].scoresFor, 'home');
assert(Object.isFrozen(sensors));
assert.equal(readSoccerGoalSensors({ soccerGoalSensors: [{ ...sensors[0], width: 0 }] }).length, 0);
assert.equal(readSoccerGoalSensors({ soccerGoalSensors: [sensors[0], sensors[0]] }).length, 0);
console.log('  ✓ Environment goal sensors require bounded unique geometry and scoring roles');
const generalizedSensors = readPhysicsSensorCuboids({ physicsSensorCuboids: [
  {
    id: 'general_trigger', name: 'General Trigger', behavior: 'trigger',
    position: { x: 2, y: 1, z: -3 }, width: 2, height: 2, depth: 0.35, rotationY: 45,
  },
  {
    id: 'home_goal', name: 'Home Goal', behavior: 'soccer-home-goal',
    position: { x: -24, y: 1.25, z: 0 }, width: 7.32, height: 2.44, depth: 0.35, rotationY: 90,
  },
] });
assert.equal(generalizedSensors.length, 2);
assert.equal(generalizedSensors[0].behavior, 'trigger');
assert.equal(generalizedSensors[1].behavior, 'counter');
assert.equal(generalizedSensors[1].groupId, 'imported-sensors');
assert.equal(readPhysicsSensorCuboids({ soccerGoalSensors: sensors })[0].behavior, 'counter');
console.log('  ✓ Provider-neutral Sensor Cuboids preserve legacy goals and isolate optional Soccer behavior');
const parsedUpdate = parseUpdateProjectModelInstance({ metadata: { soccerGoalSensors: sensors } });
assert.equal((parsedUpdate.metadata?.physicsSensorCuboids as readonly unknown[]).length, 1);
assert.throws(() => parseUpdateProjectModelInstance({
  metadata: { soccerGoalSensors: [{ ...sensors[0], depth: 0 }] },
}));
console.log('  ✓ Project Model updates reject malformed Goal Sensor metadata');

const adapter = createThreeDRapierPhysicsEventAdapter({ projectId: 5, source: ball });
const enterHome = adapter.observe({
  kind: 'sensor-enter',
  occurredAt: '2026-09-21T20:00:00.000Z',
  target: homeGoal,
  tags: ['soccer', 'goal', 'movable_ball', 'scores_home'],
});
const firstState = reduceSoccerPhysicsEvent(createInitialSoccerPhysicsState(), enterHome);
assert.equal(firstState.homeScore, 1);
assert.equal(firstState.awayScore, 0);
assert.equal(firstState.occupiedGoals.length, 1);
assert.equal(firstState.lastGoal?.scoringTeam, 'home');
assert(Object.isFrozen(firstState));
assert(Object.isFrozen(firstState.occupiedGoals));
assert(Object.isFrozen(firstState.lastGoal));

const duplicateEntry = adapter.observe({
  kind: 'sensor-enter',
  occurredAt: '2026-09-21T20:00:01.000Z',
  target: homeGoal,
  tags: ['soccer', 'goal', 'movable_ball', 'scores_home'],
});
assert.strictEqual(reduceSoccerPhysicsEvent(firstState, duplicateEntry), firstState);
console.log('  ✓ One ball-to-goal occupancy produces exactly one score');

const exitHome = adapter.observe({
  kind: 'sensor-exit',
  occurredAt: '2026-09-21T20:00:02.000Z',
  target: homeGoal,
  tags: ['soccer', 'goal', 'movable_ball', 'scores_home'],
});
const exitedState = reduceSoccerPhysicsEvent(firstState, exitHome);
assert.equal(exitedState.occupiedGoals.length, 0);
const reenterHome = adapter.observe({
  kind: 'sensor-enter',
  occurredAt: '2026-09-21T20:00:03.000Z',
  target: homeGoal,
  tags: ['soccer', 'goal', 'movable_ball', 'scores_home'],
});
const reenteredState = reduceSoccerPhysicsEvent(exitedState, reenterHome);
assert.equal(reenteredState.homeScore, 2);
console.log('  ✓ Exit clears occupancy and permits one later re-entry score');

const ignoredContact = adapter.observe({
  kind: 'contact-start',
  occurredAt: '2026-09-21T20:00:04.000Z',
  target: awayGoal,
  tags: ['soccer', 'goal', 'movable_ball', 'scores_away'],
});
assert.strictEqual(reduceSoccerPhysicsEvent(reenteredState, ignoredContact), reenteredState);
const ignoredUntagged = adapter.observe({
  kind: 'sensor-enter',
  occurredAt: '2026-09-21T20:00:05.000Z',
  target: awayGoal,
  tags: ['diagnostic'],
});
assert.strictEqual(reduceSoccerPhysicsEvent(reenteredState, ignoredUntagged), reenteredState);
const ignoredNonBall = adapter.observe({
  kind: 'sensor-enter',
  occurredAt: '2026-09-21T20:00:05.500Z',
  target: awayGoal,
  tags: ['soccer', 'goal', 'scores_away'],
});
assert.strictEqual(reduceSoccerPhysicsEvent(reenteredState, ignoredNonBall), reenteredState);
console.log('  ✓ Contacts, untagged sensors, and non-ball identities cannot alter Soccer state');

const secondBallAdapter = createThreeDRapierPhysicsEventAdapter({
  projectId: 5,
  source: { moduleType: 'models', assetId: 8 },
});
const secondBallGoal = secondBallAdapter.observe({
  kind: 'sensor-enter',
  occurredAt: '2026-09-21T20:00:06.000Z',
  target: awayGoal,
  tags: ['soccer', 'goal', 'movable_ball', 'scores_away'],
});
const secondBallState = reduceSoccerPhysicsEvent(reenteredState, secondBallGoal);
assert.equal(secondBallState.homeScore, 2);
assert.equal(secondBallState.awayScore, 1);
assert.equal(secondBallState.occupiedGoals.length, 2);
console.log('  ✓ Stable ball and goal identities keep simultaneous occupancies separate');

const westSensor = adapter.observe({
  kind: 'sensor-enter',
  occurredAt: '2026-09-21T20:00:07.000Z',
  target: homeGoal,
  tags: ['soccer', 'goal', 'movable_ball', 'scores_home', 'sensor:west_goal'],
});
const eastSensor = adapter.observe({
  kind: 'sensor-enter',
  occurredAt: '2026-09-21T20:00:08.000Z',
  target: homeGoal,
  tags: ['soccer', 'goal', 'movable_ball', 'scores_away', 'sensor:east_goal'],
});
const twoSensorState = reduceSoccerPhysicsEvent(
  reduceSoccerPhysicsEvent(createInitialSoccerPhysicsState(), westSensor),
  eastSensor,
);
assert.equal(twoSensorState.homeScore, 1);
assert.equal(twoSensorState.awayScore, 1);
assert.equal(twoSensorState.occupiedGoals.length, 2);
console.log('  ✓ Sensors owned by one Environment Model retain independent occupancy');




// Compare the persistence conversion with the same parent transform used by the Scene.
const localPoint = { x: 3, y: 2, z: -4 };
for (const rotation of [[0, Math.PI / 2, 0], [0.4, -1.2, 0.7], [0, 0, 0]] as [number, number, number][]) {
  const pose = { position: { x: 12, y: 7, z: -9 }, rotation };
  const owner = new Group();
  owner.position.set(12, 7, -9);
  owner.rotation.set(...rotation);
  owner.updateMatrixWorld(true);
  const actual = owner.localToWorld(new Vector3(3, 2, -4));
  const world = sceneLocalToWorld(localPoint, pose);
  const back = sceneWorldToLocal(world, pose);
  for (const axis of ['x', 'y', 'z'] as const) {
    assert(Math.abs(actual[axis] - world[axis]) < 1e-10);
    assert(Math.abs(back[axis] - localPoint[axis]) < 1e-10);
  }
}
const quarterTurn = sceneLocalToWorld({ x: 1, y: 0, z: 0 }, { position: { x: 0, y: 0, z: 0 }, rotation: [0, Math.PI / 2, 0] });
assert(Math.abs(quarterTurn.z + 1) < 1e-10);
assert.deepEqual(sceneOwnerPose({ type: 'plantings', data: { rotation: 90 } }).rotation, [0, 0, 0]);
assert.equal(sceneOwnerPose({ type: 'beds', data: { rotation: 90 } }).rotation[1], Math.PI / 2);
assert.deepEqual(sceneOwnerPose({ type: 'models', data: { scale: 500, rotationX: 0.1, rotationYInstance: 0.2, rotationZ: 0.3 } }).rotation, [0.1, 0.2, 0.3]);
console.log('  ✓ Sensor placement and zoom agree with rendered Three.js owner transforms, including tilted Models');
for (const degrees of [-179, -120, -90, 0, 90, 120, 179]) {
  const quaternion = new Quaternion().setFromEuler(new Euler(0, degrees * Math.PI / 180, 0));
  assert(Math.abs(sceneYawDegrees(quaternion) - degrees) < 1e-8);
}
assert(validSceneTransform({ width: 7.32, height: 2.44, depth: 0.35, position: localPoint, rotationY: 120 }));
assert(!validSceneTransform({ width: 7.32, height: 2.44, depth: 0.35, position: { ...localPoint, x: Infinity }, rotationY: 0 }));
assert(!validSceneTransform({ width: 7.32, height: 2.44, depth: 0.35, position: localPoint, rotationY: NaN }));
assert(!validSceneTransform({ width: 7.32, height: 2.44, depth: 0.35, position: { ...localPoint, z: 10001 }, rotationY: 0 }));
console.log('  ✓ Mouse rotation passes ±90 degrees continuously and invalid transform values are rejected');

for (const size of [0, -1, 0.049, 10001, Infinity, NaN]) {
  for (const axis of ['width', 'height', 'depth']) {
    assert(!validSceneTransform({ position: localPoint, rotationY: 0, width: 7.32, height: 2.44, depth: 0.35, [axis]: size }));
  }
}
assert(validSceneTransform({ position: localPoint, rotationY: 120, width: 0.05, height: 10000, depth: 1 }));

console.log('  ✓ Resizing rejects invalid dimensions and accepts both size boundaries');
// Reproduce whole-collection saves for Home followed by Away, through JSON transport.
const pair = [
  { ...generalizedSensors[1], id: 'home', name: 'Home Goal' },
  { ...generalizedSensors[1], id: 'away', name: 'Away Goal', behavior: 'soccer-away-goal' as const },
];
const saveHome = validatePhysicsSensorCuboids(JSON.parse(JSON.stringify(
  pair.map(sensor => sensor.id === 'home' ? { ...sensor, position: { x: -32, y: 2, z: 1 }, width: 8.123, rotationY: 120 } : sensor),
)));
assert(saveHome.success);
const saveAway = validatePhysicsSensorCuboids(JSON.parse(JSON.stringify(
  saveHome.sensors.map(sensor => sensor.id === 'away' ? { ...sensor, position: { x: 32, y: 2, z: 1 }, depth: 0.05, rotationY: -179 } : sensor),
)));
assert(saveAway.success);
assert.deepEqual(saveAway.sensors[0], saveHome.sensors[0]);
assert.equal(saveAway.sensors[1].rotationY, -179);
for (const [patch, expected] of [
  [{ width: 0.049 }, /Home Goal.*width/],
  [{ height: 0, width: 113.58472978656043, rotationY: 90.00000000000001 }, /Home Goal.*height/],
  [{ name: '' }, /Sensor 1.*name/],
  [{ position: { x: NaN, y: 0, z: 0 } }, /Home Goal.*x/],
] as const) {
  const rejected = validatePhysicsSensorCuboids(JSON.parse(JSON.stringify([{ ...pair[0], ...patch }, pair[1]])));
  assert(!rejected.success);
  assert.match(rejected.error, expected);
}
const duplicate = validatePhysicsSensorCuboids([pair[0], { ...pair[1], id: 'home' }]);
assert(!duplicate.success);
assert.match(duplicate.error, /Away Goal.*duplicate/);
assert(validatePhysicsSensorCuboids([]).success);
assert(!validatePhysicsSensorCuboids(null).success);
console.log('  ✓ Consecutive Home/Away saves preserve siblings; invalid siblings report the sensor and field');
console.log('PASS: ThreeD Soccer Physics — 13 validation groups completed');
