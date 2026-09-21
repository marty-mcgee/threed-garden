const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const ts = require(process.cwd() + '/node_modules/typescript');
const THREE = require(process.cwd() + '/node_modules/three');
const path = 'src/components/threed/shared/GardenCharacter.tsx';
const source = ts.createSourceFile(path, fs.readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let effect;
function visit(node) {
  if (ts.isCallExpression(node) && node.expression.getText(source) === 'useEffect' && node.arguments[0]?.getText(source).includes('loadCharacterPreviewAnimation(previewSelection, model)')) effect = node.arguments[0];
  ts.forEachChild(node, visit);
}
visit(source); assert.ok(effect);
const model = new THREE.Object3D();
const mixer = new THREE.AnimationMixer(model);
const clip = n => new THREE.AnimationClip(n, 1, [new THREE.NumberKeyframeTrack('.position[x]', [0, 1], [1, 2])]);
const old = mixer.clipAction(clip('old')).play();
const pending = [];
const messages = [];
const context = { THREE, Error, model, isPreview: true, previewClip: {}, previewSelection: {}, mixerRef: { current: mixer }, currentActionRef: { current: old },
 loadCharacterPreviewAnimation: () => new Promise((resolve, reject) => pending.push({resolve,reject})), onPreviewState: message => messages.push(message) };
const run = vm.runInNewContext(ts.transpileModule(`(${effect.getText(source)})`, {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText, context);
const flush = () => new Promise(resolve => setImmediate(resolve));
(async () => {
 const cancel = run(); assert.ok(old.isRunning()); cancel();
 run(); pending[0].resolve({clips:[clip('stale')]}); await flush(); assert.equal(context.currentActionRef.current, old);
 pending[1].resolve({clips:[clip('new')]}); await flush();
 assert.equal(context.mixerRef.current, mixer); assert.equal(mixer.getRoot(), model);
 assert.equal(context.currentActionRef.current.getClip().name, 'new'); assert.ok(context.currentActionRef.current.isRunning());
 mixer.update(0.5); assert.equal(model.position.x, 1.5, 'Playing preview must animate the loaded Model');
 const current = context.currentActionRef.current;
 run(); pending[2].reject(new Error('Incompatible animation')); await flush();
 assert.equal(context.currentActionRef.current, current); assert.ok(current.isRunning()); assert.equal(messages.at(-1), 'Incompatible animation');
 context.previewSelection = null; run(); assert.equal(context.currentActionRef.current, null); assert.equal(current.isRunning(), false); assert.equal(context.mixerRef.current, mixer);
 console.log('PASS: preview retains Model/mixer, ignores cancelled loads, switches animation, and preserves playback on failure');
})().catch(error => {console.error(error);process.exitCode=1;});

// Actual frame receiver: every accepted click is a fresh request, including replay.
const frameFile = 'src/components/admin/threed/animations/CharacterAnimationPreview.tsx';
const frame = ts.createSourceFile(frameFile, fs.readFileSync(frameFile, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let receiver;
function findReceiver(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(frame) === 'receive') receiver = node.initializer;
  ts.forEachChild(node, findReceiver);
}
findReceiver(frame); assert.ok(receiver);
const parent = {}, requests = [];
const receive = vm.runInNewContext(ts.transpileModule(`(${receiver.getText(frame)})`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, {
  window: { location: { origin: 'http://localhost:4444' }, parent },
  positiveId(value) { if (!Number.isSafeInteger(value) || value < 1) throw Error('Invalid'); return value; },
  setRequest(value) { requests.push(value); },
});
const event = { origin: 'http://localhost:4444', source: parent, data: { type: 'threed-preview-animation', animationId: 46 } };
receive(event); receive(event);
assert.equal(requests.length, 2); assert.notEqual(requests[0], requests[1]);
receive({ ...event, origin: 'https://untrusted.example' }); receive({ ...event, source: {} });
receive({ ...event, data: { ...event.data, animationId: -1 } }); assert.equal(requests.length, 2);
receive({ ...event, data: { ...event.data, animationId: null } }); assert.equal(requests[2].animationId, null);
console.log('PASS: each preview click dispatches playback/replay, with origin/source validation and T-Pose reset');
