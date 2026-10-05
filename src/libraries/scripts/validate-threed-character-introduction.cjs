// Execute the actual readiness/body/frame callbacks and collider motion with installed Rapier.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const THREE = require('three');
const R = require(require.resolve('@dimforge/rapier3d-compat', { paths: [path.dirname(require.resolve('@react-three/rapier'))] }));
function load(file) {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    module, exports: module.exports, require: name => name.endsWith('character-controller-dimensions.ts') ? load('src/libraries/services/threed/characters/character-controller-dimensions.ts') : require(name),
  });
  return module.exports;
}
function inspect(file) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const nodes = [];
  function visit(node) { nodes.push(node); ts.forEachChild(node, visit); }
  visit(source);
  return { source, nodes };
}
const ecctrl = inspect('src/components/threed/shared/EcctrlCharacter.tsx');
const variable = name => ecctrl.nodes.find(n => ts.isVariableDeclaration(n) && n.name.getText(ecctrl.source) === name).initializer.getText(ecctrl.source);
const bodyEffect = ecctrl.nodes.find(n => ts.isVariableDeclaration(n) && n.name.getText(ecctrl.source) === 'syncCharacterPhysics').initializer.arguments[0].getText(ecctrl.source);
const movementFrame = ecctrl.nodes.find(n => ts.isCallExpression(n) && n.expression.getText(ecctrl.source) === 'useFrame' && n.arguments[0].getText(ecctrl.source).includes('const ec = ecctrlRef.current')).arguments[0].getText(ecctrl.source);
const controlEffect = ecctrl.nodes.find(n => ts.isCallExpression(n) && n.expression.getText(ecctrl.source) === 'useEffect' && n.arguments[0].getText(ecctrl.source).includes('physicsEnabled &&') && n.arguments[0].getText(ecctrl.source).includes('onControlChange({')).arguments[0].getText(ecctrl.source);
const evaluate = (expression, context) => vm.runInNewContext(ts.transpileModule('(' + expression + ');', { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, context);
function ready(overrides = {}) {
  const context = { modelLoadEnabled: true, characterVisualReady: false, character: { model: { filePath: 'rig.fbx' } }, error: null, ...overrides };
  context.characterRuntimeReady = evaluate(variable('characterRuntimeReady'), context);
  return evaluate(variable('physicsEnabled'), { ...context, layerEnabled: overrides.layerEnabled ?? true });
}
assert.equal(ready(), false, 'A pending rig cannot participate in physics');
assert.equal(ready({ characterVisualReady: true }), true);
assert.equal(ready({ error: new Error('missing rig') }), true, 'Explicit failure enables the existing cylinder fallback');
assert.equal(ready({ character: { model: null } }), true);
assert.equal(ready({ modelLoadEnabled: false, characterVisualReady: true }), false);
assert.equal(ready({ layerEnabled: false, characterVisualReady: true }), false);
const controlReports = [];
const controlContext = { isControlled: true, physicsEnabled: false, onControlChange: value => controlReports.push(value), ecctrlRef: { current: { currPos: { x: 0, y: 0, z: 0 }, body: { translation: () => ({ x: 7, y: 4, z: 8 }) } } } };
const reportControl = evaluate(controlEffect, controlContext);
reportControl(); assert.equal(controlReports.length, 0, 'Pending control cannot publish a cached origin');
controlContext.physicsEnabled = true; reportControl();
assert.equal(controlReports[0].x, 7); assert.equal(controlReports[0].y, 4); assert.equal(controlReports[0].z, 8);
controlContext.ecctrlRef.current.body.translation = () => ({ x: NaN, y: 4, z: 8 }); reportControl(); assert.equal(controlReports.length, 1);
const dims = load('src/libraries/services/threed/characters/character-controller-dimensions.ts');
const { characterSpawnsOverlap } = load('src/libraries/services/threed/markers/character-spawn-overlap.ts');
const origin = { x: 0, y: 0, z: 0 };
assert.equal(dims.CHARACTER_SPAWN_CLEARANCE, dims.CHARACTER_CAPSULE_RADIUS * 2);
assert.equal(characterSpawnsOverlap(origin, { ...origin, x: 0.55 }), true, 'Reject the previously accepted capsule overlap');
assert.equal(characterSpawnsOverlap(origin, { ...origin, x: 0.6 }), false, 'Touching is outside the strict overlap policy');
assert.equal(characterSpawnsOverlap({ ...origin, x: 0.8 }, { ...origin, x: 1.4 }), false, 'Touching remains exact at a nonzero origin, matching SQL numeric');
assert.equal(characterSpawnsOverlap(origin, { ...origin, x: 0.5994 }), true);
assert.equal(characterSpawnsOverlap(origin, { ...origin, x: 0.5996 }), false, 'Compare persisted millimetric precision');
assert.equal(characterSpawnsOverlap(origin, { ...origin, y: 3 }), false);
const route = fs.readFileSync('src/app/api/project/threed-markers/route.ts', 'utf8');
assert.match(route, /CHARACTER_SPAWN_CLEARANCE \*\* 2/, 'Server clearance shares the controller policy');

(async () => {
  const dashboard = inspect('src/app/dashboard/scene/page.tsx');
  const placement = dashboard.nodes.find(n => ts.isVariableDeclaration(n) && n.name.getText(dashboard.source) === 'handleCharacterPlacement').initializer.arguments[0].getText(dashboard.source);
  function placementHarness() {
    let resolve;
    const calls = [];
    const context = {
      selectedProjectId: '16', placementThreedId: 1, placementCharacter: { name: 'Farmer', libraryAccess: { runtime: 'ecctrl' } },
      placingCharacterRef: { current: false }, characterPlacementScopeRef: { current: { projectId: '16' } },
      projectSetupSessionProjectId: null,
      createProjectCharacterLibraryPlacementRequest: input => input,
      applyThreeDProjectClientTransaction: (current, update) => { calls.push(['transaction', update]); return current; },
      setData: callback => callback({}), setPlacementCharacter: value => calls.push(['draft', value]),
      setPlacingCharacter: value => calls.push(['busy', value]),
      setIsCharacterLibraryOpen() {}, setIsScenariosOpen() {}, setIsSetupMenuOpen() {}, setIsProjectSetupOpen() {},
      showToastRef: { current: (...args) => calls.push(['toast', ...args]) }, console: { error() {} },
      fetch: (...args) => { calls.push(['fetch', ...args]); return new Promise(r => { resolve = r; }); },
    };
    const place = evaluate(placement, context);
    const reply = (ok = true) => resolve({ ok, status: ok ? 200 : 409, json: async () => ok ? { success: true, data: { marker: { markerId: 'characters-1' }, character: { id: 1 } } } : { error: 'Occupied' } });
    return { context, calls, place, reply };
  }
  for (const change of ['same', 'other', 'return', 'unmount', 'failure']) {
    const h = placementHarness(); const pending = h.place({ x: 0, y: 0, z: 0 });
    await h.place({ x: 1, y: 0, z: 0 });
    assert.equal(h.calls.filter(c => c[0] === 'fetch').length, 1, 'Duplicate input sends one request');
    if (change === 'other') h.context.characterPlacementScopeRef.current = { projectId: '17' };
    if (change === 'return') h.context.characterPlacementScopeRef.current = { projectId: '16' };
    if (change === 'unmount') h.context.characterPlacementScopeRef.current = { projectId: null };
    h.reply(change !== 'failure'); await pending;
    assert.equal(h.calls.filter(c => c[0] === 'transaction').length, change === 'same' ? 1 : 0, 'Only the original current session receives placement');
    assert.equal(h.calls.filter(c => c[0] === 'draft').length, change === 'same' ? 1 : 0, 'Stale/failed responses retain current drafts');
    assert.equal(h.calls.filter(c => c[0] === 'toast').length, ['same', 'failure'].includes(change) ? 1 : 0, 'Old sessions cannot publish errors or success');
    assert.equal(h.context.placingCharacterRef.current, false, 'Busy guard releases after every response');
  }
  await R.init();
  const world = new R.World({ x: 0, y: -9.81, z: 0 });
  const create = () => {
    const body = world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(0, 4, 0));
    const collider = world.createCollider(R.ColliderDesc.capsule(dims.CHARACTER_CAPSULE_HALF_HEIGHT, dims.CHARACTER_CAPSULE_RADIUS), body);
    return { body, collider, setMovement(value) { this.movement = value; } };
  };
  const first = create();
  first.body.setLinvel({ x: 3, y: -1, z: 0 }, true);
  const context = { physicsEnabled: false, previousLayerEnabledRef: { current: true }, previousPhysicsBodyRef: { current: null }, ecctrlRef: { current: first } };
  const sync = evaluate(bodyEffect, context);
  sync(); assert.equal(first.body.isEnabled(), false); assert.equal(first.collider.isEnabled(), false);
  for (let i = 0; i < 30; i++) world.step();
  assert.equal(first.body.translation().y, 4, 'A pending Character cannot fall before first pose');
  assert.equal(first.body.linvel().x, 0, 'Pending input velocity is cleared');
  assert.equal(first.movement.jump, false, 'Pending controller input is cleared');
  evaluate(movementFrame, context)({}, 1 / 60); // Any unguarded movement/bookkeeping access throws in this minimal context.
  context.physicsEnabled = true; sync(); assert(first.body.isEnabled()); assert(first.collider.isEnabled());
  context.physicsEnabled = false; sync();
  const replacement = create(); context.ecctrlRef.current = replacement; sync();
  assert.equal(replacement.body.isEnabled(), false, 'A replacement body synchronizes even when enabled state is unchanged');
  context.physicsEnabled = true; sync(); assert(replacement.body.isEnabled());
  world.free();

  const proxyGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.8, 8);
  proxyGeometry.computeBoundingBox();
  const halfSize = proxyGeometry.boundingBox.getSize(new THREE.Vector3()).multiplyScalar(0.5);
  dims.GARDEN_CHARACTER_COLLIDER_HALF_EXTENTS.forEach((value, i) => assert.ok(Math.abs(value - halfSize.toArray()[i]) < 1e-6, 'Explicit Garden proxy retains cylinder bounds'));
  proxyGeometry.dispose();
  const hiddenWorld = new R.World({ x: 0, y: 0, z: 0 });
  const hiddenOwner = hiddenWorld.createRigidBody(R.RigidBodyDesc.fixed());
  const hiddenCollider = hiddenWorld.createCollider(R.ColliderDesc.cuboid(...dims.GARDEN_CHARACTER_COLLIDER_HALF_EXTENTS).setTranslation(0, dims.GARDEN_CHARACTER_COLLIDER_CENTER_Y, 0), hiddenOwner);
  hiddenOwner.setEnabled(false); hiddenWorld.step();
  const hiddenRay = new R.Ray({ x: 0, y: 4, z: 0 }, { x: 0, y: -1, z: 0 });
  assert.equal(hiddenWorld.castRay(hiddenRay, 5, true), null);
  hiddenOwner.setEnabled(true); hiddenWorld.step();
  assert.equal(hiddenWorld.castRay(hiddenRay, 5, true).collider.handle, hiddenCollider.handle, 'Initially hidden Garden retains one collider when revealed');
  hiddenWorld.free();

  const fixedWorld = new R.World({ x: 0, y: 0, z: 0 });
  const owner = fixedWorld.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(10, 0, 0));
  let collider = fixedWorld.createCollider(R.ColliderDesc.cuboid(0.25, 0.5, 0.25).setTranslation(1, 1, 0), owner);
  const originalHandle = owner.handle;
  const group = new THREE.Group();
  const { createGardenColliderMotionSync } = load('src/libraries/services/threed/characters/garden-collider-motion.ts');
  const follow = createGardenColliderMotionSync(); follow(owner, group);
  group.position.set(5, 0, 2); group.rotation.y = Math.PI / 2;
  follow(owner, group, true); fixedWorld.step(); assert.ok(Math.abs(collider.translation().x - 11) < 1e-5, 'Commit capture never writes physics');
  follow(owner, group); fixedWorld.step();
  const p = collider.translation();
  assert.ok(Math.abs(p.x - 15) < 1e-5 && Math.abs(p.y - 1) < 1e-5 && Math.abs(p.z - 1) < 1e-5, 'Collider offset rotates and translates with the Garden visual');
  assert.equal(owner.handle, originalHandle); assert.equal(owner.numColliders(), 1);
  const rayAt = (x, z) => fixedWorld.castRay(new R.Ray({ x, y: 5, z }, { x: 0, y: -1, z: 0 }), 10, true);
  assert.equal(rayAt(11, 0), null, 'No ghost collider remains at spawn');
  assert(rayAt(15, 1), 'Queries hit the moved collider');
  follow(owner, group); assert.deepEqual(collider.translation(), p, 'Repeated sync cannot accumulate motion');
  group.position.set(8, 2, 3); follow(owner, group); fixedWorld.step(); assert.ok(Math.abs(collider.translation().y - 3) < 1e-5, 'Teleport Y is preserved');
  fixedWorld.removeCollider(collider, true);
  collider = fixedWorld.createCollider(R.ColliderDesc.cuboid(0.5, 0.5, 0.5).setTranslation(8, 3, 2), owner);
  follow(owner, group); group.position.x += 1; follow(owner, group); fixedWorld.step();
  assert.ok(Math.abs(collider.translation().x - 19) < 1e-5, 'Replacement geometry gets a fresh motion binding');
  group.position.x = NaN; follow(owner, group); assert(Number.isFinite(collider.translation().x));
  fixedWorld.free();

  const garden = inspect('src/components/threed/shared/GardenCharacter.tsx');
  const frame = garden.nodes.find(n => ts.isCallExpression(n) && n.expression.getText(garden.source) === 'useFrame').arguments[0].getText(garden.source);
  evaluate(frame, { sceneEnabled: false })({}, 1 / 60); // Hidden Garden must return before animation/world movement.
  let updates = 0;
  evaluate(frame, { sceneEnabled: true, mixerRef: { current: { update: () => updates++ } }, isPreview: false, character: { model: { filePath: 'rig.fbx' } }, model: null, loadingModel: true, modelError: null })({}, 1 / 60);
  assert.equal(updates, 1, 'Pending visual returns before movement/position registration');
  const movingGroup = new THREE.Group();
  const movementContext = {
    THREE, sceneEnabled: true, mixerRef: { current: null }, isPreview: false,
    character: { id: 1, model: { filePath: 'rig.fbx' }, movementType: 'wander', movementSpeed: 2 },
    model: {}, loadingModel: false, modelError: null, groupRef: { current: movingGroup },
    activeCharacterPositions: new Map(), taskLockedRef: { current: false }, isCharacterActive: true,
    movementState: { current: { targetPosition: new THREE.Vector3(5, 0, 0), isMoving: true } },
  };
  const move = evaluate(frame, movementContext); move({}, 0.5);
  assert.equal(movingGroup.position.x, 1, 'Actual Garden wander retains saved movement speed');
  movementContext.taskLockedRef.current = true; move({}, 0.5); assert.equal(movingGroup.position.x, 1, 'Task lock pauses Garden motion');
  movementContext.taskLockedRef.current = false; movementContext.sceneEnabled = false; move({}, 0.5); assert.equal(movingGroup.position.x, 1, 'Hidden layer pauses motion');
  assert.match(garden.source.text, /mixer\?\.update\(0\);\s*if\s*\(\s*!cancelled/, 'Garden evaluates first pose before model publication');
  const scene = fs.readFileSync('src/components/map/ThreeDScene.tsx', 'utf8');
  assert.match(scene, /visualMotionRef=\{gardenGroupRef\}/);
  assert.match(scene, /runtimeGroupRef=\{gardenGroupRef\}/);
  assert.match(scene, /visualMotionRef=\{gardenGroupRef\} type="fixed" colliders=\{false\}/);
  assert.match(scene, /CuboidCollider args=\{GARDEN_CHARACTER_COLLIDER_HALF_EXTENTS\}/);
  assert.match(scene, /gardenSceneEnabled = isLayerEnabled && characterData.visible !== false/, 'Explicit proxy cannot participate for an invisible Garden Character');
  assert.match(scene, /scenePostProduction && resourcesPending/);
  assert.match(scene, /motion-reduce:transition-none/);
  console.log('PASS Character first-pose physics, replacement bodies, Garden collider motion, hidden movement and capsule spawn clearance.');
})().catch(error => { console.error(error); process.exitCode = 1; });
