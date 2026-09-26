// Real hook + Three.js bounds; no DOM, network, Rapier writes or model assets.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), ts = require('typescript');
const THREE = require('three');
const scene = new THREE.Scene(), target = new THREE.Group();
target.name = 'threed-marker-target';
target.add(new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2)));
target.position.set(10, 1, 0); scene.add(target);
const actor = new THREE.Group(); actor.name = 'threed-marker-actor'; scene.add(actor);
let now = 0, effects = [], messages = [];
const listeners = new Map();
const window = { addEventListener: (name, handler) => listeners.set(name, handler), removeEventListener: name => listeners.delete(name), dispatchEvent: event => { messages.push(event); listeners.get(event.type)?.(event); } };
class CustomEvent { constructor(type, { detail }) { this.type = type; this.detail = detail; } }
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const exports = {}; cache.set(file, exports);
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    exports, window, CustomEvent, performance: { now: () => now },
    require(name) {
      if (name === 'react') return { useRef: value => ({ current: value }), useCallback: fn => fn, useEffect: fn => effects.push(fn) };
      if (name === '@react-three/fiber') return { useThree: () => ({ scene }) };
      if (name === 'three') return THREE;
      if (name.startsWith('@/')) return load(path.resolve('src', name.slice(2)) + '.ts');
      if (name.startsWith('.')) return load(path.resolve(path.dirname(file), name.endsWith('.ts') ? name : `${name}.ts`));
      throw new Error(`Unexpected dependency ${name}`);
    },
  }); return exports;
}
const { useCharacterNavigation } = load('src/components/threed/shared/useCharacterNavigation.ts');
const { NAVIGATION_REQUEST, NAVIGATION_STATUS } = load('src/libraries/services/threed/orchestration/navigation-events.ts');
const taskLocked = { current: false };
const step = useCharacterNavigation({ markerId: 'actor', targetMarkerId: 'target', controlled: true, enabled: true, taskLocked, clearance: 1 });
const cleanup = effects[0]();
const request = (command = 'walk', actorMarkerId = 'actor', targetMarkerId = 'target') => window.dispatchEvent(new CustomEvent(NAVIGATION_REQUEST, { detail: { requestId: 'test', command, actorMarkerId, targetMarkerId } }));
const phase = () => messages.filter(m => m.type === NAVIGATION_STATUS).at(-1)?.detail.phase;
const highlight = new THREE.Mesh(new THREE.RingGeometry(5, 7, 32));
highlight.rotation.x = -Math.PI / 2; highlight.userData.navigationDecoration = true;
target.add(highlight); request();
assert.ok(step({ x: 5, y: 1, z: 0 }, false), 'Highlight must not cause premature arrival outside the target');
highlight.scale.setScalar(2);
assert.ok(step({ x: 5, y: 1, z: 0 }, false), 'Pulsing highlight must not change arrival');
target.remove(highlight); request('stop');
for (const file of ['PulseRing', 'FadingRing']) assert.match(fs.readFileSync(`src/components/threed/shared/${file}.tsx`, 'utf8'), /navigationDecoration:\s*true/, 'Production highlights declare navigation-only exclusion');
const { navigationVisualBounds } = load('src/libraries/services/threed/orchestration/navigation-visual-bounds.ts');
const realRing = new THREE.Mesh(new THREE.RingGeometry(1, 2, 16));
const transformed = new THREE.Group(); transformed.position.set(3, 2, 1); transformed.rotation.y = 0.7; transformed.scale.setScalar(2); transformed.add(realRing);
assert.deepEqual(navigationVisualBounds(transformed, new THREE.Box3(), new THREE.Box3()), new THREE.Box3().setFromObject(transformed), 'Real untagged geometry retains normal world-space bounds');
request('walk', 'other'); assert.equal(step({ x: 0, y: 1, z: 0 }, false), null);
request(); assert.equal(phase(), 'walking');
assert.equal(step({ x: 0, y: 1, z: 0 }, false).x, 1);
assert.equal(step({ x: 8, y: 1, z: 0 }, false), null); assert.equal(phase(), 'arrived', 'Arrives at bounds, not target origin');
request(); step({ x: 0, y: 1, z: 0 }, true); assert.equal(phase(), 'cancelled');
request(); taskLocked.current = true; step({ x: 0, y: 1, z: 0 }, false); assert.equal(phase(), 'cancelled'); taskLocked.current = false;
request(); target.visible = false; step({ x: 0, y: 1, z: 0 }, false); assert.equal(phase(), 'cancelled'); target.visible = true;
request(); step({ x: 0, y: 1, z: 0 }, false); now = 4001; step({ x: 0, y: 1, z: 0 }, false); assert.equal(phase(), 'blocked');
request(); actor.visible = false; step({ x: 0, y: 1, z: 0 }, false); assert.equal(phase(), 'cancelled'); actor.visible = true;
request(); request('stop'); assert.equal(phase(), 'cancelled');
request(); request('teleport'); assert.equal(phase(), 'cancelled'); assert.equal(step({ x: 0, y: 1, z: 0 }, false), null, 'Teleport cancels automatic walking');
request(); scene.remove(target); step({ x: 0, y: 1, z: 0 }, false); assert.equal(phase(), 'cancelled'); scene.add(target);
request(); cleanup(); assert.equal(phase(), 'cancelled'); assert.ok(!listeners.has(NAVIGATION_REQUEST));
assert.ok(!messages.some(m => /action-complete/.test(m.type)));
console.log('PASS: navigation adapter actor isolation, real bounds arrival, input/task/visibility/removal cancellation, blocked path, stop and teardown.');

// Exercise the actual Ecctrl frame callback: automatic steering must use its movement API.
const source = ts.createSourceFile('EcctrlCharacter.tsx', fs.readFileSync('src/components/threed/shared/EcctrlCharacter.tsx', 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let callback;
function visit(node) {
  if (ts.isCallExpression(node) && node.expression.getText(source) === 'useFrame' && node.arguments[0]?.getText(source).includes('const navigationKeys')) callback = node.arguments[0];
  ts.forEachChild(node, visit);
}
visit(source); assert.ok(callback);
const writes = [], forward = [], reports = [];
const context = {
  ecctrlRef: { current: { body: {}, currPos: { x: 0, y: 1, z: 0 }, setMovement: value => writes.push(value), setForwardDir: value => forward.push(value.clone()) } },
  keys: { current: { w: false, a: false, s: false, d: false, space: false, shift: false } },
  stepNavigation: () => ({ x: 1, y: 0, z: 0 }),
  targetForwardDirectionRef: { current: new THREE.Vector3() },
  isControlled: true, movementTargetPosition: undefined, taskLockedRef: { current: false }, cameraFollowRef: null, livePositionsRef: { current: new Map() }, markerId: 'actor', reportControlledPosition: value => reports.push(value),
};
vm.createContext(context);
vm.runInContext(ts.transpileModule(`var frame = ${callback.getText(source)};`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, context);
context.frame(null, 0.016);
assert.deepEqual(JSON.parse(JSON.stringify(writes.at(-1))), { joystick: { x: 0, y: 1 }, run: false, jump: false });
assert.equal(forward.at(-1).x, 1); assert.equal(reports.length, 1);
context.stepNavigation = () => null; context.keys.current.w = true; context.keys.current.shift = true;
context.frame(null, 0.016);
assert.equal(writes.at(-1).run, true); assert.equal(writes.at(-1).joystick.y, 1);
context.keys.current.w = false; context.keys.current.shift = false;
context.frame(null, 0.016); assert.equal(writes.at(-1).joystick.y, 0);
console.log('PASS: real Ecctrl frame feeds walk-only steering, retains manual run and returns zero movement after navigation.');
