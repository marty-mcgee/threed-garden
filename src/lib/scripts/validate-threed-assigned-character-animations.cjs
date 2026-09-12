const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const THREE = require('three');
const { FBXLoader } = require('three/examples/jsm/loaders/FBXLoader.js');
function load(path, deps, extra = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
    { exports, console, AbortSignal, ...extra, require: name => { assert.ok(name in deps, name); return deps[name]; } });
  return exports;
}
const animation = load('src/lib/utils/animation.ts', {});
const contracts = load('src/lib/services/threed/animations/contracts.ts', { '@/lib/utils/animation': animation });
const bytes = fs.readFileSync('public/assets/animations/Idle.fbx');
const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
const root = new FBXLoader().parse(buffer, '');
let own, model, sourceFetches, legacy, urls;
const source = { id: 46, isActive: true, format: 'fbx', filePath: 'https://example.invalid/shared.fbx', clipIndex: 0 };
const runtime = load('src/lib/utils/assignedCharacterAnimations.ts', {
  three: THREE, 'three/examples/jsm/loaders/FBXLoader.js': { FBXLoader },
  'three/examples/jsm/loaders/GLTFLoader.js': { GLTFLoader: class { register() {} async parseAsync() { return { scene: new THREE.Group(), animations: [new THREE.AnimationClip('internal', 1, [new THREE.NumberKeyframeTrack('.position[x]', [0, 1], [0, 1])])] }; } } },
  '@/lib/services/threed/animations/contracts': contracts,
  './externalCharacterAnimations': {
    getExternalAnimationSourcesForModel: () => [{ action: 'idle' }, { action: 'walk' }, { action: 'watering' }],
    loadExternalCharacterAnimations: async sources => { legacy = sources.map(s => s.action); return { clips: sources.map(s => new THREE.AnimationClip(s.action, 1, [])) }; },
  },
}, { fetch: async url => {
  urls.push(url);
  if (!url.startsWith('/api/')) { sourceFetches++; return { ok: true, arrayBuffer: async () => buffer }; }
  return { ok: true, json: async () => ({ success: true, data: url.includes('target=character') ? own : model }) };
} });
const assignment = (actionKey, animationId = 46, mode = 'assigned') => ({ actionKey, animationId, mode });
const reset = () => { own = { modelId: 5, assignments: [], inherited: [], animations: [source] }; model = { assignments: [], animations: [source] }; sourceFetches = 0; urls = []; };
const run = () => runtime.loadAssignedCharacterAnimations(11, 5, 'Character', '/primary.fbx', root);
(async () => {
  reset(); let result = await run(); assert.deepEqual(legacy, ['idle', 'walk', 'watering']); assert.equal(sourceFetches, 0);
  reset(); own.inherited = [assignment('idle')]; own.assignments = [assignment('walk'), assignment('watering', null, 'disabled')];
  result = await run(); assert.equal(sourceFetches, 1, 'One shared source fetch for multiple actions');
  assert.equal(result.clips.find(c => c.name === 'idle').tracks.length, root.animations[0].tracks.length);
  assert.deepEqual(legacy, []); assert.ok(result.blocked.has('watering'));
  const map = runtime.assignedAnimationMap(animation.buildAnimationMap(['idle', 'walk'], { idle: 'walk' }), result.blocked, result.assigned);
  assert.equal(map.resolve('IDLE'), 'idle', 'Library assignments override legacy metadata'); assert.equal(map.resolve('watering'), null);
  reset(); own.inherited = [assignment('idle')]; own.assignments = [assignment('idle', null, 'disabled')]; result = await run(); assert.equal(sourceFetches, 0); assert.ok(result.blocked.has('idle'));
  reset(); own.modelId = 9; own.inherited = [assignment('run')]; model.assignments = [assignment('idle')]; result = await run();
  assert.ok(urls.some(url => url.includes('target=model&targetId=5'))); assert.ok(result.assigned.has('idle')); assert.ok(!result.assigned.has('run'));
  reset(); own.assignments = [assignment('idle')]; own.animations = [{ ...source, isActive: false }]; await assert.rejects(run(), /unavailable/);
  reset(); own.assignments = [assignment('idle')]; own.animations = [{ ...source, clipIndex: 999 }]; await assert.rejects(run(), /not found/);
  reset(); own.assignments = [assignment('idle')]; await assert.rejects(runtime.loadAssignedCharacterAnimations(11, 5, 'Wrong rig', '', new THREE.Group()), /does not match/);
  reset(); own.assignments = [assignment('idle')]; own.animations = [{ ...source, format: 'glb' }]; result = await run(); assert.equal(result.clips.find(c => c.name === 'idle').tracks.length, 1);
  console.log('PASS: real FBX rig binding, GLB clip selection, shared-source fetch, inheritance/override/disabled mapping, project Model selection and explicit invalid-clip rejection (mocked requests)');
})().catch(error => { console.error(error); process.exitCode = 1; });
