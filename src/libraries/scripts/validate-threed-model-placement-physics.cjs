// Execute the actual Scene before-step callback with installed Rapier; no React,
// database, storage or network adapters are loaded.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const THREE = require('three');
const R = require(require.resolve('@dimforge/rapier3d-compat', {
  paths: [path.dirname(require.resolve('@react-three/rapier'))],
}));
const sceneFile = 'src/components/map/ThreeDScene.tsx';
const source = ts.createSourceFile(sceneFile, fs.readFileSync(sceneFile, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const wrapper = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'SceneMarkerRigidBody');
assert(wrapper, 'Scene body wrapper must exist');
let callback;
function visit(node) {
  if (ts.isCallExpression(node) && node.expression.getText(source) === 'useBeforePhysicsStep') callback = node.arguments[0].getText(source);
  ts.forEachChild(node, visit);
}
visit(wrapper);
assert(callback, 'Actual before-step callback must exist');
const compile = code => ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const core = { exports: {} };
vm.runInNewContext(compile(fs.readFileSync('src/libraries/services/threed/physics/soccer-kick-core.ts', 'utf8')), {
  exports: core.exports,
  require(name) {
    assert.equal(name, '../models/project-model-instance-core');
    // Participant eligibility is covered by threed-soccer-kick; this fixture
    // invokes only the actual numeric impulse planner, which has no imports.
    return {};
  },
});
const ref = current => ({ current });
const kick = { version: 1, requestId: 'placement-kick-1', projectId: 15, ballMarkerId: 'models-placement-1', characterId: 9, characterMarkerId: 'characters-9', action: 'leftFootSoccer' };
const destination = { x: 1, y: 0.5, z: 0 };
function harness(body, overrides = {}) {
  const events = [];
  const context = {
    THREE, Date, sceneEnabled: true, smoothPosition: false,
    rigidBodyRef: ref(body), pendingModelPlacementRef: ref(null), pendingSoccerKickRef: ref(null),
    pendingTransformRef: ref(null), liveInterpolationRef: ref(null),
    soccerKickTarget: { projectId: 15, markerId: kick.ballMarkerId },
    soccerKickActorPosition: () => ({ x: -1, y: 0.5, z: 0 }),
    planSoccerKickImpulse: core.exports.planSoccerKickImpulse,
    THREED_SOCCER_KICK_RESULT_EVENT: core.exports.THREED_SOCCER_KICK_RESULT_EVENT,
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
    window: { dispatchEvent: event => events.push(event) },
    ...overrides,
  };
  vm.createContext(context);
  vm.runInContext(compile(`var beforeStep = ${callback};`), context);
  return { context, events, step: () => context.beforeStep() };
}
(async () => {
  await R.init();
  const world = new R.World({ x: 0, y: 0, z: 0 });
  try {
    const body = world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(0, 0.5, 0));
    world.createCollider(R.ColliderDesc.ball(0.5).setMass(1), body);
    const unrelated = world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(10, 0.5, 0));
    world.createCollider(R.ColliderDesc.ball(0.5).setMass(1), unrelated);
    const runtime = harness(body);
    body.setLinvel({ x: 3, y: 2, z: 1 }, true);
    body.setAngvel({ x: 1, y: 2, z: 3 }, true);
    runtime.context.pendingModelPlacementRef.current = { projectId: 15, markerId: kick.ballMarkerId, position: destination };
    runtime.context.pendingSoccerKickRef.current = kick;
    runtime.step();
    assert.deepEqual({ ...body.translation() }, destination, 'Explicit placement must win');
    assert.deepEqual({ ...body.linvel() }, { x: 0, y: 0, z: 0 }, 'A same-step queued kick must not undo placement at rest');
    assert.deepEqual({ ...body.angvel() }, { x: 0, y: 0, z: 0 });
    assert.equal(runtime.events.length, 1);
    assert.equal(runtime.events[0].detail.applied, false);
    assert.equal(runtime.context.pendingSoccerKickRef.current, null);
    assert.equal(runtime.context.pendingModelPlacementRef.current, null);
    runtime.step();
    assert.equal(runtime.events.length, 1, 'Superseded kick must be consumed once');
    world.step();
    assert.deepEqual({ ...body.translation() }, destination);
    assert.deepEqual({ ...unrelated.translation() }, { x: 10, y: 0.5, z: 0 }, 'Unrelated body remains unchanged');
    runtime.context.pendingSoccerKickRef.current = { ...kick, requestId: 'later-kick-2' };
    runtime.step();
    assert.equal(runtime.events.at(-1).detail.applied, true, 'A subsequent ordinary kick still applies');
    assert(body.linvel().x > 0);
    for (const overrides of [
      { sceneEnabled: false },
      { soccerKickTarget: { projectId: 8, markerId: kick.ballMarkerId } },
      { soccerKickTarget: { projectId: 15, markerId: 'other-ball' } },
      { pendingTransformRef: ref({ position: [2, 0.5, 0] }) },
    ]) {
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      const guarded = harness(body, overrides);
      guarded.context.pendingSoccerKickRef.current = kick;
      guarded.step();
      assert.equal(guarded.events[0].detail.applied, false, 'Existing eligibility/transform guard remains effective');
      assert.deepEqual({ ...body.linvel() }, { x: 0, y: 0, z: 0 });
    }
    body.setEnabled(false);
    const disabled = harness(body);
    disabled.context.pendingSoccerKickRef.current = kick;
    disabled.step();
    assert.equal(disabled.events[0].detail.applied, false);
    const fixed = world.createRigidBody(R.RigidBodyDesc.fixed());
    const stationary = harness(fixed);
    stationary.context.pendingModelPlacementRef.current = { position: destination };
    stationary.step();
    assert.deepEqual({ ...fixed.translation() }, destination, 'Fixed Model placement is preserved');
    assert.equal(stationary.events.length, 0);
    console.log('PASS: actual Scene callback/Rapier placement wins over queued kick, reports one rejection, preserves rest/unrelated bodies, and retains later kicks, existing guards and fixed placement');
  } finally { world.free(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
