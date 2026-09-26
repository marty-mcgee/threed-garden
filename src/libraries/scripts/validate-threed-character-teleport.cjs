// Real installed R3F Rapier world plus the actual landing policy and intent adapter. Offline.
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const ts = require('typescript'), THREE = require('three');
const rapier = require(require.resolve('@dimforge/rapier3d-compat', { paths: [path.dirname(require.resolve('@react-three/rapier'))] }));
let world, effects = [], physicsStep;
const colliderStates = new Map();
const scene = new THREE.Scene(), messages = [], listeners = new Map();
const window = {
  addEventListener(name, fn) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(fn); },
  removeEventListener(name, fn) { listeners.get(name)?.delete(fn); },
  dispatchEvent(event) { messages.push(event.detail); for (const fn of listeners.get(event.type) ?? []) fn(event); },
};
class CustomEvent { constructor(type, { detail }) { this.type = type; this.detail = detail; } }
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const exports = {}; cache.set(file, exports);
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, window, CustomEvent, require(name) {
    if (name === 'react') return { useRef: current => ({ current }), useEffect: fn => effects.push(fn) };
    if (name === '@react-three/fiber') return { useThree: () => ({ scene }) };
    if (name === '@react-three/rapier') return { useRapier: () => ({ world, rapier, colliderStates }), useBeforePhysicsStep: fn => { physicsStep = fn; } };
    if (name === 'three') return THREE;
    if (name.startsWith('@/')) return load(path.join('src', name.slice(2)) + '.ts');
    throw Error(`Unexpected dependency: ${name}`);
  } });
  return exports;
}
(async () => {
  await rapier.init();
  const { findCharacterLanding } = load('src/libraries/services/threed/orchestration/teleport-landing.ts');
  const bounds = new THREE.Box3(new THREE.Vector3(-1, 0, -1), new THREE.Vector3(1, 2, 1));
  let body, targetCollider;
  const setup = (ground = true) => {
    world?.free(); world = new rapier.World({ x: 0, y: 0, z: 0 });
    body = world.createRigidBody(rapier.RigidBodyDesc.dynamic().setTranslation(-8, 1.25, 0));
    world.createCollider(rapier.ColliderDesc.capsule(0.6, 0.3), body);
    targetCollider = world.createCollider(rapier.ColliderDesc.cuboid(1, 1, 1).setTranslation(0, 1, 0));
    if (ground) world.createCollider(rapier.ColliderDesc.cuboid(30, 0.1, 30).setTranslation(0, -0.1, 0));
  };
  const find = (visualBounds = bounds, targetColliders = [targetCollider], step = true) => { if (step) world.step(); return findCharacterLanding({ world, rapier, body, bounds: visualBounds, targetColliders, radius: 0.3, halfHeight: 0.6, floatHeight: 0.3 }); };
  setup(); let landing = find(); assert(landing); assert(Math.abs(landing.y - 1.25) < 1e-5);
  assert(landing.x < -1, 'Prefer the actor-facing side');
  assert(Math.abs(landing.x + 1.4) < 1e-5, 'Closest capsule clearance wins over the outer ring nearest the actor');
  const highlightedBounds = new THREE.Box3(new THREE.Vector3(-7, 0, -7), new THREE.Vector3(7, 2, 7));
  const highlighted = find(highlightedBounds);
  assert(Math.abs(highlighted.x - landing.x) < 1e-5 && Math.abs(highlighted.z - landing.z) < 1e-5, 'Oversized target rings must not move the landing away from its collider');
  assert.equal(find(bounds, []), null, 'Missing target colliders must not use decoration bounds');
  body.setTranslation(landing, true); assert(find(), 'Own capsule must not block landing');
  setup();
  targetCollider.setRotation({ x: 0, y: Math.sin(Math.PI / 8), z: 0, w: Math.cos(Math.PI / 8) });
  const rotated = find(highlightedBounds); assert(rotated);
  const surface = targetCollider.projectPoint({ ...rotated, y: 1 }, true).point;
  assert(Math.abs(Math.hypot(rotated.x - surface.x, rotated.z - surface.z) - 0.4) < 1e-5, 'Rotated target uses the collider surface, not its world-aligned visual box');
  // Match InteractiveGround: Drei Plane auto-generates a rotated, zero-depth cuboid.
  // Rapier can return its downward normal even when queried from above.
  setup(false);
  const groundBody = world.createRigidBody(rapier.RigidBodyDesc.fixed());
  const groundRotation = { x: -Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 };
  world.createCollider(rapier.ColliderDesc.cuboid(30, 30, 0).setTranslation(0, -0.03, 0).setRotation(groundRotation), groundBody);
  landing = find(); assert(landing, 'Scene zero-thickness ground must support teleport');
  assert(Math.abs(landing.y - 1.22) < 1e-5);
  setup(false);
  world.createCollider(rapier.ColliderDesc.cuboid(30, 30, 0).setRotation({ x: -Math.sin(Math.PI / 12), y: 0, z: 0, w: Math.cos(Math.PI / 12) }));
  assert.equal(find(), null, 'Steep zero-thickness planes must still be rejected');
  setup(false);
  world.createCollider(rapier.ColliderDesc.cuboid(30, 2, 30).setTranslation(0, 3, 0));
  assert.equal(find(), null, 'A ray starting inside a solid must not turn its underside into ground');
  setup(false); assert.equal(find(), null, 'Void must not accept landing');
  setup(); world.createCollider(rapier.ColliderDesc.cuboid(10, 1, 10).setTranslation(0, 1, 0));
  assert.equal(find(), null, 'Solid obstacle/roof must block all candidates');
  setup(); world.createCollider(rapier.ColliderDesc.cuboid(10, 0.1, 10).setTranslation(0, 1.8, 0));
  assert.equal(find(), null, 'Low overhead clearance must block the capsule');
  setup(); world.createCollider(rapier.ColliderDesc.cuboid(10, 1, 10).setTranslation(0, 1, 0).setSensor(true));
  assert(find(), 'Sensors must not obstruct');
  setup(false); world.createCollider(rapier.ColliderDesc.cuboid(30, 0.1, 30), world.createRigidBody(rapier.RigidBodyDesc.dynamic()));
  assert.equal(find(), null, 'Dynamic bodies must not serve as landing ground');
  setup(false); world.createCollider(rapier.ColliderDesc.cuboid(0.03, 0.1, 0.03).setTranslation(-1.8, -0.1, 0));
  assert.equal(find(), null, 'A tiny unsupported ledge must not accept a capsule');
  setup(false); world.createCollider(rapier.ColliderDesc.cuboid(30, 0.1, 30).setRotation({ x: 0, y: 0, z: Math.sin(Math.PI / 6), w: Math.cos(Math.PI / 6) }));
  assert.equal(find(), null, 'Steep surfaces must not accept landing');
  // Disabled fixed bodies can remain in Rapier query results after Layer toggles.
  setup();
  const hiddenRoof = world.createRigidBody(rapier.RigidBodyDesc.fixed());
  world.createCollider(rapier.ColliderDesc.cuboid(10, 0.1, 10).setTranslation(0, 1.8, 0), hiddenRoof);
  assert.equal(find(), null, 'Visible roof blocks clearance');
  hiddenRoof.setEnabled(false);
  assert(find(bounds, [targetCollider], false), 'Hidden roof must not block landing');
  hiddenRoof.setEnabled(true);
  assert.equal(find(), null, 'Shown roof blocks clearance again');
  setup(false);
  const hiddenGround = world.createRigidBody(rapier.RigidBodyDesc.fixed());
  world.createCollider(rapier.ColliderDesc.cuboid(30, 0.1, 30).setTranslation(0, -0.1, 0), hiddenGround);
  assert(find(), 'Visible ground supports landing');
  hiddenGround.setEnabled(false);
  assert.equal(find(bounds, [targetCollider], false), null, 'Hidden ground must not support landing');
  hiddenGround.setEnabled(true);
  assert(find(), 'Shown ground supports landing again');
  setup(); landing = find();
  const obstacle = world.createRigidBody(rapier.RigidBodyDesc.dynamic().setTranslation(landing.x, landing.y, landing.z));
  world.createCollider(rapier.ColliderDesc.capsule(0.6, 0.3), obstacle);
  const alternate = find(); assert(alternate); assert(Math.hypot(alternate.x - landing.x, alternate.z - landing.z) > 0.6, 'Other Characters occupy landing space');
  const alternateSurface = targetCollider.projectPoint({ ...alternate, y: 1 }, true).point;
  assert(Math.abs(Math.hypot(alternate.x - alternateSurface.x, alternate.z - alternateSurface.z) - 0.4) < 1e-5, 'Try another close side before a distant ring when occupied');

  setup(); world.step();
  const target = new THREE.Group(); target.name = 'threed-marker-target';
  target.add(new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2))); target.position.y = 1; scene.add(target);
  const highlight = new THREE.Mesh(new THREE.RingGeometry(5, 7, 32)); highlight.rotation.x = -Math.PI / 2; highlight.position.y = -0.975; target.add(highlight);
  const colliderObject = new THREE.Object3D(); target.add(colliderObject);
  colliderStates.set(targetCollider.handle, { collider: targetCollider, object: colliderObject });
  const unrelatedObject = new THREE.Object3D(); scene.add(unrelatedObject);
  const unrelatedCollider = world.createCollider(rapier.ColliderDesc.cuboid(0.3, 0.5, 0.3).setTranslation(-5, 0.5, 3));
  colliderStates.set(unrelatedCollider.handle, { collider: unrelatedCollider, object: unrelatedObject });
  world.step();
  const actor = new THREE.Group(); actor.name = 'threed-marker-actor'; scene.add(actor);
  const { useCharacterTeleport } = load('src/components/threed/shared/useCharacterTeleport.ts');
  const { NAVIGATION_REQUEST } = load('src/libraries/services/threed/orchestration/navigation-events.ts');
  const controller = { current: { body, setMovement: () => {} } }, taskLocked = { current: false };
  useCharacterTeleport({ markerId: 'actor', targetMarkerId: 'target', controlled: true, enabled: true, taskLocked, controller, radius: 0.3, halfHeight: 0.6, floatHeight: 0.3 });
  const cleanup = effects.pop()();
  const request = (command = 'teleport', actorMarkerId = 'actor', targetMarkerId = 'target') => window.dispatchEvent(new CustomEvent(NAVIGATION_REQUEST, { detail: { command, actorMarkerId, targetMarkerId, requestId: 'test' } }));
  const before = body.translation();
  request(); assert.deepEqual(body.translation(), before, 'Intent must not write immediately');
  taskLocked.current = true; physicsStep(); assert.deepEqual(body.translation(), before, 'Task start before commit cancels');
  taskLocked.current = false;
  request('teleport', 'other'); physicsStep(); assert.deepEqual(body.translation(), before);
  request('teleport', 'actor', 'stale-target'); physicsStep(); assert.deepEqual(body.translation(), before);
  target.remove(colliderObject); request(); physicsStep(); assert.equal(messages.at(-1).phase, 'teleport-blocked'); assert.deepEqual(body.translation(), before, 'Do not borrow colliders from other markers'); target.add(colliderObject);
  request(); target.visible = false; physicsStep(); assert.deepEqual(body.translation(), before); target.visible = true;
  request(); scene.remove(target); physicsStep(); assert.deepEqual(body.translation(), before); scene.add(target);
  request(); actor.visible = false; physicsStep(); assert.deepEqual(body.translation(), before); actor.visible = true;
  const blocker = world.createCollider(rapier.ColliderDesc.cuboid(5, 1, 5).setTranslation(0, 1, 0));
  world.step(); request(); physicsStep(); assert.equal(messages.at(-1).phase, 'teleport-blocked'); assert.deepEqual(body.translation(), before);
  world.removeCollider(blocker, true); world.step();
  request(); request('stop'); physicsStep(); assert.deepEqual(body.translation(), before, 'Stop clears queued teleport');
  request(); request('walk'); physicsStep(); assert.deepEqual(body.translation(), before, 'New walk replaces queued teleport');
  body.setRotation({ x: 0, y: Math.sin(0.4), z: 0, w: Math.cos(0.4) }, true);
  const rotation = body.rotation(); body.setLinvel({ x: 2, y: 0, z: 1 }, true);
  body.setAngvel({ x: 0, y: 2, z: 0 }, true);
  request(); physicsStep(); assert.equal(messages.at(-1).phase, 'teleported');
  assert(Math.abs(body.translation().x + 1.4) < 1e-5, 'Actual adapter ignores target rings and unrelated collider owners');
  assert.notDeepEqual(body.translation(), before); assert.deepEqual(body.rotation(), rotation);
  assert.deepEqual({ ...body.linvel() }, { x: 0, y: 0, z: 0 });
  assert.deepEqual({ ...body.angvel() }, { x: 0, y: 0, z: 0 });
  const count = messages.length; physicsStep(); assert.equal(messages.length, count, 'Commit only once');
  request(); cleanup(); const saved = body.translation(); physicsStep(); assert.deepEqual(body.translation(), saved, 'Unmount/control/target effect cleanup clears intent');
  for (const [controlled, enabled] of [[false, true], [true, false]]) {
    useCharacterTeleport({ markerId: 'actor', targetMarkerId: 'target', controlled, enabled, taskLocked, controller, radius: 0.3, halfHeight: 0.6, floatHeight: 0.3 });
    const dispose = effects.pop()(); request(); physicsStep();
    assert.equal(messages.at(-1).phase, 'teleport-cancelled'); assert.deepEqual(body.translation(), saved); dispose();
  }
  world.free();
  console.log('PASS Character teleport: ground, capsule occupancy, intent isolation, cancellation, physics-step commit, rotation and velocity.');
})().catch(error => { console.error(error); process.exitCode = 1; });
