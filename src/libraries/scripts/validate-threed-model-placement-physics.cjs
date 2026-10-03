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
let kickEffect;
function visit(node) {
  if (ts.isCallExpression(node) && node.expression.getText(source) === 'useBeforePhysicsStep') callback = node.arguments[0].getText(source);
  if (ts.isCallExpression(node) && node.expression.getText(source) === 'useEffect'
    && node.arguments[0]?.getText(source).includes('const acceptKick =')) kickEffect = node.arguments[0].getText(source);
  ts.forEachChild(node, visit);
}
visit(wrapper);
assert(callback, 'Actual before-step callback must exist');
assert(kickEffect, 'Actual ball event receiver must exist');
const compile = code => ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const collisionCore = { exports: {} };
vm.runInNewContext(compile(fs.readFileSync('src/libraries/services/threed/physics/action-collision-core.ts', 'utf8')), {
  exports: collisionCore.exports,
});
const core = { exports: {} };
vm.runInNewContext(compile(fs.readFileSync('src/libraries/services/threed/physics/soccer-kick-core.ts', 'utf8')), {
  exports: core.exports,
  require(name) {
    if (name === './action-collision-core') return collisionCore.exports;
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
  const listeners = new Map();
  const context = {
    THREE, Date, rapier: R, sceneEnabled: true, smoothPosition: false,
    rigidBodyRef: ref(body), pendingModelPlacementRef: ref(null), pendingSoccerKickRef: ref(null),
    pendingActionCollisionRef: ref([]), consumedSoccerKickIdsRef: ref(new Set()),
    pendingTransformRef: ref(null), liveInterpolationRef: ref(null),
    soccerKickTarget: { projectId: 15, markerId: kick.ballMarkerId },
    soccerKickActorPosition: () => ({ x: -1, y: 0.5, z: 0 }),
    planSoccerKickImpulse: core.exports.planSoccerKickImpulse,
    validSoccerKickRequest: core.exports.validSoccerKickRequest,
    validThreeDActionCollisionSample: collisionCore.exports.validThreeDActionCollisionSample,
    sweptPointHitsSphere: collisionCore.exports.sweptPointHitsSphere,
    THREED_SOCCER_KICK_APPLY_EVENT: core.exports.THREED_SOCCER_KICK_APPLY_EVENT,
    THREED_SOCCER_KICK_RESULT_EVENT: core.exports.THREED_SOCCER_KICK_RESULT_EVENT,
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
    window: {
      dispatchEvent(event) { events.push(event); listeners.get(event.type)?.(event); },
      addEventListener(type, listener) { listeners.set(type, listener); },
      removeEventListener(type, listener) { if (listeners.get(type) === listener) listeners.delete(type); },
    },
    ...overrides,
  };
  vm.createContext(context);
  vm.runInContext(compile(`var beforeStep = ${callback};`), context);
  vm.runInContext(compile(`var mountKick = ${kickEffect}; var cleanupKick = mountKick();`), context);
  return { context, events, step: () => context.beforeStep(),
    receive: request => listeners.get(core.exports.THREED_SOCCER_KICK_APPLY_EVENT)({ detail: request }),
    cleanup: () => context.cleanupKick(),
  };
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

    // The receiver and before-step callback must use the live, offset Rapier
    // sphere, not marker origin, a sensor volume, or merely the animation end.
    const contactBody = world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(0, 0.5, 5));
    const physicalSphere = world.createCollider(R.ColliderDesc.ball(0.25).setTranslation(1, 0, 0).setMass(1), contactBody);
    world.createCollider(R.ColliderDesc.ball(0.8).setTranslation(0, 0, 2).setSensor(true), contactBody);
    const contactRuntime = harness(contactBody, { soccerKickActorPosition: () => ({ x: -1, y: 0.5, z: 5 }) });
    const sample = { version: 1, requestId: 'contact-ball-1', projectId: 15,
      actorMarkerId: kick.characterMarkerId, targetMarkerId: kick.ballMarkerId,
      action: kick.action, clipName: kick.action, pointId: 'left-foot',
      sourceNode: 'mixamorigLeftFoot', from: { x: 0.2, y: 0.5, z: 5 },
      to: { x: 1.8, y: 0.5, z: 5 }, radius: 0.1 };
    const contactKick = { ...kick, requestId: sample.requestId, timing: 'contact', pointIds: ['left-foot'],
      actorPosition: { x: -1, y: 0.5, z: 5 }, collision: sample };
    const miss = { ...sample, from: { x: -0.2, y: 0.5, z: 7 }, to: { x: 0.2, y: 0.5, z: 7 } };
    contactRuntime.receive({ ...contactKick, ballMarkerId: 'another-ball' });
    contactRuntime.step();
    assert.equal(contactRuntime.events.length, 0, 'Another instance cannot queue a contact effect');
    contactRuntime.receive({ ...contactKick, collision: miss });
    contactRuntime.step();
    assert.deepEqual({ ...contactBody.linvel() }, { x: 0, y: 0, z: 0 }, 'A sensor-only overlap cannot kick the ball');
    assert.equal(contactRuntime.events.length, 0, 'A missed sample leaves the action open for a later real contact');
    assert(!contactRuntime.context.consumedSoccerKickIdsRef.current.has(sample.requestId));
    assert(!collisionCore.exports.sweptPointHitsSphere({ ...sample, to: sample.from }, physicalSphere.translation(), 0.25));
    assert(!collisionCore.exports.sweptPointHitsSphere({ ...sample, from: sample.to }, physicalSphere.translation(), 0.25));
    contactRuntime.receive(contactKick);
    contactRuntime.receive(contactKick);
    contactRuntime.step();
    assert.equal(contactRuntime.events.length, 1, 'Swept foot contact applies once despite duplicate samples in one physics step');
    assert.equal(contactRuntime.events[0].detail.applied, true);
    assert(contactBody.linvel().x > 0, 'A sweep crossing the offset physical sphere gives it a bounded impulse');
    assert(contactBody.linvel().x <= core.exports.SOCCER_KICK_MAX_SPEED);
    const kickedVelocity = { ...contactBody.linvel() };
    contactRuntime.receive(contactKick);
    contactRuntime.step();
    assert.equal(contactRuntime.events.length, 1, 'Further samples for a consumed request cannot kick again');
    assert.deepEqual({ ...contactBody.linvel() }, kickedVelocity);
    assert.deepEqual({ ...unrelated.linvel() }, { x: 0, y: 0, z: 0 });
    contactRuntime.cleanup();

    for (const [label, overrides] of [
      ['released control', { soccerKickActorPosition: () => null }],
      ['hidden layer', { sceneEnabled: false }],
      ['new placement', { pendingModelPlacementRef: ref({ position: { x: 0, y: 0.5, z: 5 } }) }],
      ['pending transform', { pendingTransformRef: ref({ position: [0, 0.5, 5] }) }],
    ]) {
      contactBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
      const guarded = harness(contactBody, { soccerKickActorPosition: () => ({ x: -1, y: 0.5, z: 5 }), ...overrides });
      guarded.receive(contactKick);
      guarded.step();
      assert.deepEqual({ ...contactBody.linvel() }, { x: 0, y: 0, z: 0 }, `${label} prevents a queued contact impulse`);
      assert(!guarded.events.some(event => event.detail.applied), `${label} cannot report success`);
      guarded.cleanup();
    }
    console.log('PASS: actual Scene callback/Rapier placement wins over queued kick, reports one rejection, preserves rest/unrelated bodies, and retains later kicks, existing guards and fixed placement');
    console.log('PASS: actual ball receiver and physics callback require a physical swept contact, preserve later hits after misses, deduplicate hits, and honor control/layer/placement cancellation');
  } finally { world.free(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
