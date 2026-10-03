// Pure contact geometry plus real Three.js rig/mixer observations, entirely offline.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const THREE = require('three');
const modules = new Map();
function load(relative) {
  const file = path.resolve('src/libraries/services/threed/physics', relative);
  if (modules.has(file)) return modules.get(file);
  const exports = {};
  modules.set(file, exports);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, require(name) {
    if (name === 'three') return THREE;
    assert.equal(name, './action-collision-core');
    return load('action-collision-core.ts');
  } }, { filename: file });
  return exports;
}
const { validThreeDActionCollisionSample, sweptPointHitsSphere, defaultKickCollisionPoints } = load('action-collision-core.ts');
const { createActionCollisionSampler } = load('action-collision-points.ts');
const plain = value => JSON.parse(JSON.stringify(value));
const context = { requestId: 'offline-contact-1', projectId: 16,
  actorMarkerId: 'characters-1', targetMarkerId: 'models-2', action: 'custom_kick' };
const sample = { ...context, version: 1, clipName: 'custom_kick', pointId: 'left-foot',
  sourceNode: 'toes_l', from: { x: -1, y: 0, z: 0 }, to: { x: 1, y: 0, z: 0 }, radius: 0.1 };
const center = { x: 0, y: 0, z: 0 };
assert(validThreeDActionCollisionSample(sample));
assert(sweptPointHitsSphere(sample, center, 0.3), 'A fast foot crossing hits even when both endpoints miss');
assert(!sweptPointHitsSphere(sample, { x: 0, y: 0.5, z: 0 }, 0.3), 'A nearby swing without contact misses');
assert(sweptPointHitsSphere(sample, { x: 0, y: 0.4, z: 0 }, 0.3), 'Surface contact counts');
assert(!sweptPointHitsSphere(sample, { x: 2, y: 0, z: 0 }, 0.3), 'Sweep is bounded to the observed segment');
assert(sweptPointHitsSphere({ ...sample, from: center, to: center }, center, 0.3));
for (const invalid of [
  { ...sample, version: 2 }, { ...sample, requestId: 'bad' }, { ...sample, projectId: 0 },
  { ...sample, radius: 0 }, { ...sample, radius: 2 }, { ...sample, radius: NaN },
  { ...sample, actorMarkerId: '' }, { ...sample, targetMarkerId: '' },
  { ...sample, sourceNode: '' }, { ...sample, clipName: '' }, { ...sample, pointId: '' },
  { ...sample, from: { x: NaN, y: 0, z: 0 } },
  { ...sample, to: { x: 1.1, y: 0, z: 0 } },
]) {
  assert(!validThreeDActionCollisionSample(invalid));
  assert(!sweptPointHitsSphere(invalid, center, 0.3));
}
assert(!sweptPointHitsSphere(sample, center, 0));
assert(!sweptPointHitsSphere(sample, { x: Infinity, y: 0, z: 0 }, 0.3));
assert.deepEqual(plain(defaultKickCollisionPoints('Kick - Left Foot')), ['left-foot']);
assert.deepEqual(plain(defaultKickCollisionPoints('Kick Soccerball Right')), ['right-foot']);
assert.deepEqual(plain(defaultKickCollisionPoints('Kick Soccerball')), ['left-foot', 'right-foot']);
for (const name of ['Header Soccer', 'Penalty Kick Soccer', 'Pass Soccer', 'Water', 'Walk', 'Point']) {
  assert.equal(defaultKickCollisionPoints(name).length, 0, `${name} must not gain contact effects`);
}

function rig(scale = 1) {
  const parent = new THREE.Group();
  parent.position.set(10, 2, 3);
  const model = new THREE.Group();
  model.scale.setScalar(scale);
  model.rotation.y = Math.PI / 2;
  parent.add(model);
  const foot = new THREE.Bone();
  foot.name = 'Foot_L';
  const toe = new THREE.Bone();
  toe.name = 'toes_l';
  toe.position.set(0, 0, 0.4);
  foot.add(toe);
  model.add(foot);
  const ik = new THREE.Bone();
  ik.name = 'ik_foot_l';
  model.add(ik);
  const clip = new THREE.AnimationClip('custom_kick', 1, [
    new THREE.VectorKeyframeTrack('Foot_L.position', [0, 1], [-1, 0, 0, 1, 0, 0]),
  ]);
  const mixer = new THREE.AnimationMixer(model);
  const action = mixer.clipAction(clip);
  action.setLoop(THREE.LoopOnce, 1).play();
  mixer.update(0);
  const sampler = createActionCollisionSampler({ model, pointIds: ['left-foot'], context, clip: action });
  assert(sampler);
  return { parent, model, foot, toe, mixer, action, sampler };
}
const r = rig(2);
assert.equal(r.sampler.sample().length, 0, 'First pose primes the sweep');
r.mixer.update(0.05);
const observations = r.sampler.sample(0.05);
assert.equal(observations.length, 1);
const observed = observations[0];
assert.equal(observed.sourceNode, 'toes_l', 'Use the rendered toe instead of IK or ankle pivot');
assert.equal(observed.clipName, 'custom_kick');
assert.equal(observed.requestId, context.requestId);
assert.equal(observed.actorMarkerId, context.actorMarkerId);
assert.equal(observed.targetMarkerId, context.targetMarkerId);
assert(Math.abs(observed.from.x - 10.8) < 1e-6);
assert(Math.abs(observed.from.y - 2) < 1e-6);
assert(Math.abs(observed.from.z - 5) < 1e-6);
assert(Math.abs(observed.to.z - 4.8) < 1e-6, 'World positions include ancestor translation, rotation and scale');
assert.equal(observed.radius, 0.3, 'Foot size tolerance has a bounded maximum');
assert.equal(r.sampler.sample(0.05).length, 0, 'Repeated observations without clip progression emit nothing');
r.parent.position.x += 10;
r.mixer.update(0.05);
assert.equal(r.sampler.sample(0.05).length, 0, 'Teleport displacement must never become a kick sweep');
r.mixer.update(0.05);
assert.equal(r.sampler.sample(0.05).length, 1, 'Ordinary animated movement can resume after a reset');
r.mixer.update(0.3);
assert.equal(r.sampler.sample(0.3).length, 0, 'A stalled frame must not synthesize a strike');
r.mixer.update(0.05);
assert.equal(r.sampler.sample(0.05).length, 0, 'First pose after a stall primes without a sweep');
r.action.paused = true;
assert.equal(r.sampler.sample(0.05).length, 0, 'Paused/completed clips cannot strike');
r.action.paused = false;
r.action.reset().play();
assert.equal(r.sampler.sample(0.05).length, 0, 'Restarted clip cannot bridge the old and new poses');
r.action.stop();
assert.equal(r.sampler.sample(0.05).length, 0);

const small = rig(0.5);
small.sampler.sample();
small.mixer.update(0.05);
assert(Math.abs(small.sampler.sample(0.05)[0].radius - 0.09) < 1e-6, 'Contact size follows rendered rig scale');
assert.equal(createActionCollisionSampler({ model: small.model, pointIds: ['right-foot'], context, clip: small.action }), null);
assert.equal(createActionCollisionSampler({ model: small.model, pointIds: [], context, clip: small.action }), null);
const still = small.mixer.clipAction(new THREE.AnimationClip('stationary', 1, [
  new THREE.VectorKeyframeTrack('Foot_L.position', [0, 1], [0, 0, 0, 0, 0, 0]),
]));
assert.equal(createActionCollisionSampler({ model: small.model, pointIds: ['left-foot'], context, clip: still }), null,
  'A stationary foot track cannot enable a contact action');
const unrelated = small.mixer.clipAction(new THREE.AnimationClip('unrelated', 1, [
  new THREE.VectorKeyframeTrack('ik_foot_l.position', [0, 1], [0, 0, 0, 1, 0, 0]),
]));
assert.equal(createActionCollisionSampler({ model: small.model, pointIds: ['left-foot'], context, clip: unrelated }), null,
  'A clip must animate the selected foot or its skeletal ancestry');
const duplicate = new THREE.Bone();
duplicate.name = 'mixamorig:LeftToeBase';
small.model.add(duplicate);
assert.equal(createActionCollisionSampler({ model: small.model, pointIds: ['left-foot'], context, clip: small.action }), null,
  'Ambiguous rig points fail closed');
const fakeRig = new THREE.Group();
const fakeFoot = new THREE.Mesh();
fakeFoot.name = 'Foot_L';
fakeRig.add(fakeFoot);
assert.equal(createActionCollisionSampler({ model: fakeRig, pointIds: ['left-foot'], context, clip: small.action }), null,
  'A coincidentally named unrigged mesh must not act as an animated foot');

(async () => {
  // Exercise the production FBX loader against an existing tracked rig. This is
  // rig naming/transform evidence; Project 16's assigned kick clip remains a browser check.
  const { FBXLoader } = await import('three/addons/loaders/FBXLoader.js');
  const bytes = fs.readFileSync('public/assets/animations/Idle.fbx');
  const model = new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  model.scale.setScalar(0.01);
  const mixer = new THREE.AnimationMixer(model);
  const action = mixer.clipAction(model.animations[0]);
  action.play();
  const sampler = createActionCollisionSampler({ model, pointIds: ['left-foot', 'right-foot'], context, clip: action });
  assert(sampler, 'Tracked Farmer rig supports both default contact points');
  mixer.update(0.05);
  assert.equal(sampler.sample(0.05).length, 0);
  mixer.update(0.05);
  const actual = sampler.sample(0.05);
  assert(actual.length > 0, 'Actual tracked FBX animation yields observed rig movement');
  assert(actual.every(value => ['toes_l', 'toes_r'].includes(value.sourceNode)));
  assert(actual.every(validThreeDActionCollisionSample));
  mixer.stopAllAction();
  console.log('ThreeD action collision checks passed: bounded sweeps, rig identity, transforms, timing, ambiguity and tracked FBX.');
})().catch(error => { console.error(error); process.exitCode = 1; });
