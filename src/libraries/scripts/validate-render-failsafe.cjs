// Offline fail-safe checks: fake event targets/render stores; no WebGL or servers.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, deps, extras = '', globals = {}) {
 const exports = {};
 const code = ts.transpileModule(fs.readFileSync(file, 'utf8') + extras, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX }
 }).outputText;
 vm.runInNewContext(code, { exports, require: name => { assert(name in deps, name); return deps[name]; }, Error, setTimeout, console, ...globals });
 return exports;
}
const policy = load('src/components/threed/shared/render-failsafe.ts', {});
const pending = [];
const breaker = policy.createRenderFailsafe(fn => pending.push(fn));
const stops = [];
let notices = 0;
breaker.subscribe(() => notices++);
const remove = breaker.register(() => stops.push('removed'));
remove();
breaker.register(() => { stops.push('first'); throw new Error('already disposed'); });
breaker.register(() => stops.push('second'));
breaker.trip('lost');
assert.deepEqual(stops, ['first', 'second']);
assert.equal(notices, 0, 'unmount notifications must wait for the physics stack');
breaker.trip('again');
assert.equal(pending.length, 1, 'failure is latched');
pending.shift()();
assert.equal(notices, 1);
breaker.register(() => stops.push('late'));
assert.equal(stops.at(-1), 'late', 'late renderers cannot resume');
assert.equal(breaker.getSnapshot(), 'lost');
assert.equal(policy.createRenderFailsafe().getSnapshot(), null, 'separate documents are independent');
for (const value of ['too much recursion', new Error('Maximum call stack size exceeded'), 'Maximum update depth exceeded']) assert(policy.isRecursionFailure(value));
for (const value of [null, {}, new Error('network request failed')]) assert(!policy.isRecursionFailure(value));

const tasks = [];
const circuit = policy.createRenderFailsafe(fn => tasks.push(fn));
const cleanups = [];
const canvas = new EventTarget();
const windowMock = new EventTarget();
const modes = [];
const state = { gl: { domElement: canvas }, setFrameloop: mode => modes.push(mode) };
class Component { constructor(props) { this.props = props; } }
const jsx = (type, props) => ({ type, props });
const components = load('src/components/threed/shared/SafeCanvas.tsx', {
 '@react-three/fiber': { Canvas: 'Canvas', useThree: fn => fn(state) },
 react: { Component, useEffect: fn => { const cleanup = fn(); if (cleanup) cleanups.push(cleanup); }, useSyncExternalStore: (_, get) => get() },
 'react/jsx-runtime': { jsx, jsxs: jsx },
 './render-failsafe': { ...policy, renderFailsafe: circuit },
}, '\nexports.Guard = RenderGuard;', { window: windowMock });
const ready = components.SafeCanvas({ dpr: [1, 2], gl: { alpha: true, antialias: true }, children: 'scene' });
assert.deepEqual(ready.props.children.props.dpr, [1, 2]);
assert.equal(ready.props.children.props.gl.antialias, true);
assert.equal(ready.props.children.props.gl.alpha, true);
components.Guard();
const lost = new Event('webglcontextlost', { cancelable: true });
canvas.dispatchEvent(lost);
assert(lost.defaultPrevented);
assert.deepEqual(modes, ['never']);
assert.equal(tasks.length, 1);
tasks.shift()();
const stopped = components.SafeCanvas({ children: 'scene' });
assert.notEqual(stopped.type, ready.type, 'fallback replaces the Canvas boundary');
for (const cleanup of cleanups) cleanup();
canvas.dispatchEvent(new Event('webglcontextlost'));
assert.deepEqual(modes, ['never'], 'cleanup removes context listener');
console.log('Rendering fail-safe: latch, deferred shutdown, independent documents, renderer isolation, error filtering, context-loss wiring and preserved quality settings passed.');
