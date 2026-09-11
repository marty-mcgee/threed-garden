// Exercise the actual locomotion callback with real Three.js mixers and actions.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const THREE = require('three');
const file = path.resolve(__dirname, '../../components/threed/shared/EcctrlCharacter.tsx');
const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let arrow;
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'playAnimation') arrow = node.initializer.arguments[0];
  ts.forEachChild(node, visit);
}
visit(source);
assert.ok(arrow);
const make = () => {
  const mixer = new THREE.AnimationMixer(new THREE.Object3D());
  const action = mixer.clipAction(new THREE.AnimationClip('idle', 1, [new THREE.NumberKeyframeTrack('.position[x]', [0, 1], [2, 4])]));
  return { mixer, action };
};
const old = make(); old.action.play();
const replacement = make();
let crossfades = 0;
old.action.crossFadeTo = () => { crossfades++; return old.action; };
const context = {
  THREE, taskLockedRef: { current: false }, mixerRef: { current: replacement.mixer },
  actionsRef: { current: new Map([['idle', replacement.action]]) },
  animMapRef: { current: { resolve: () => 'idle' } },
  currentActionRef: { current: old.action }, lastClipNameRef: { current: 'idle' },
  character: { animationSpeed: 1 }, CROSSFADE_DURATION: 0.2,
};
const play = vm.runInNewContext(ts.transpileModule(`const result = ${arrow.getText(source)}; result;`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText, context);
play('IDLE');
assert.equal(replacement.action.isRunning(), true, 'Same-named idle must start on replacement mixer');
assert.equal(crossfades, 0, 'Never crossfade from the previous mixer');
replacement.mixer.update(0.25);
play('IDLE');
assert.equal(replacement.action.time, 0.25, 'Do not restart an already-running action');
replacement.action.stop();
play('IDLE');
assert.equal(replacement.action.isRunning(), true, 'Restart stopped idle after reset');
replacement.mixer.update(0.25);
play('IDLE', true);
assert.equal(replacement.action.time, 0, 'Forced locomotion restart remains available');
context.taskLockedRef.current = true;
replacement.action.stop();
play('IDLE');
assert.equal(replacement.action.isRunning(), false, 'Preserve semantic task ownership');
console.log('PASS: replacement mixer starts idle, stopped idle restarts, running idle is stable, forced restart and task lock remain intact');

// Execute the actual pre-visibility initialization effect and verify pose application
// precedes publishing readiness, even without a rendered animation frame.
let initialize;
function findInitialize(node) {
  if (ts.isCallExpression(node) && node.expression.getText(source) === 'useLayoutEffect'
      && node.arguments[0]?.getText(source).includes('setPosedModel(model)')) initialize = node.arguments[0];
  ts.forEachChild(node, findInitialize);
}
findInitialize(source);
assert.ok(initialize);
const fresh = make();
context.taskLockedRef.current = false;
context.mixerRef.current = fresh.mixer;
context.actionsRef.current = new Map([['idle', fresh.action]]);
const ready = [];
const initializationContext = {
  ...context, model: fresh.mixer.getRoot(), loading: true, playAnimation: play,
  setPosedModel(model) { assert.equal(model.position.x, 2, 'Initial keyframe must be applied before ready'); ready.push(model); },
};
const initializePose = vm.runInNewContext(ts.transpileModule(`const result = ${initialize.getText(source)}; result;`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText, initializationContext);
initializePose();
assert.equal(ready.length, 0, 'Do not publish while loading');
initializationContext.loading = false;
initializePose();
assert.equal(ready[0], fresh.mixer.getRoot());
assert.equal(fresh.action.isRunning(), true);
console.log('PASS: loading blocks visual readiness; idle first pose is evaluated before the current model becomes ready');
