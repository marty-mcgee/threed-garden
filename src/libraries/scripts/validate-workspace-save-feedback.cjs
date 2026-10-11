const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
let slots = [], cursor = 0, effects = [], timers = new Map(), timerId = 0;
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/map/hooks/useWorkspaceSaveFeedback.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: exportsObject, window: {
  setTimeout: fn => { timers.set(++timerId, fn); return timerId; }, clearTimeout: id => timers.delete(id),
  setInterval: fn => { timers.set(++timerId, fn); return timerId; }, clearInterval: id => timers.delete(id),
}, require(name) { assert.equal(name, 'react'); return {
  useRef: value => slots[cursor++] ??= { current: value },
  useState(value) { const index = cursor++; slots[index] ??= value; return [slots[index], next => { slots[index] = typeof next === 'function' ? next(slots[index]) : next; }]; },
  useEffect(fn, deps) { const index = cursor++, prior = slots[index]; if (!prior || deps.some((v, i) => !Object.is(v, prior.deps[i]))) { effects.push(() => { prior?.cleanup?.(); slots[index] = { deps, cleanup: fn() }; }); } },
  useCallback(fn) { return fn; },
}; } });
let key = '15:loaded', ready = false, snapshot = { version: 1, savedAt: 'first', viewMode: '3d', overlayPositions: {}, threeD: { cameraPosition: { x: 1, y: 2, z: 3 }, sensorState: { count: 0 } } };
function render() { cursor = 0; effects = []; const currentSnapshot = snapshot; const capture = () => currentSnapshot; const result = exportsObject.useWorkspaceSaveFeedback(key, ready, capture); effects.forEach(fn => fn()); return result; }
function sample() { for (const fn of [...timers.values()]) fn(); return render(); }
assert.equal(render().dirty, false); ready = true; render(); assert.equal(sample().dirty, false, 'Hydrated workspace starts clean');
snapshot = { ...snapshot, savedAt: 'later', threeD: { ...snapshot.threeD, sensorState: { count: 11 } } }; render(); assert.equal(sample().dirty, false, 'Time and runtime counts do not dirty workspace');
snapshot = { ...snapshot, overlayPositions: { details: { x: 1, y: 0 } } }; render(); assert.equal(sample().dirty, true);
const captured = structuredClone(snapshot); const pending = render();
snapshot = { ...snapshot, viewMode: 'design' }; render(); pending.acknowledge(captured); assert.equal(render().dirty, true, 'Edits during Save survive acknowledgment using latest callback');
render().acknowledge(snapshot); assert.equal(render().dirty, false);
snapshot = { ...snapshot, threeD: { ...snapshot.threeD, cameraPosition: { x: 12, y: 2, z: 3 } } }; render(); assert.equal(sample().dirty, true, 'Camera provider changes are detected');
// A failed save never acknowledges; sampling must retain edits.
assert.equal(sample().dirty, true);
key = '16:loaded'; ready = false; assert.equal(render().dirty, false, 'Switching Project clears displayed feedback immediately');
snapshot = { ...snapshot, viewMode: '2d', overlayPositions: {} }; ready = true; render(); assert.equal(sample().dirty, false, 'New Project establishes its own baseline');
snapshot = { ...snapshot, panelHeight: 63 }; render(); assert.equal(sample().dirty, true);
console.log('PASS: actual workspace feedback hook hydration, camera/preferences, ignored runtime readings, captured-only acknowledgment, failed-save retention and Project isolation.');

const toolbarExports = {};
const jsx = (type, props) => ({ type, props });
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/map/header/ProjectSceneToolbar.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText, { exports: toolbarExports, require(name) {
  if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
  return new Proxy({}, { get: (_target, key) => String(key) });
} });
function descendants(node) { if (!node || typeof node !== 'object') return []; return [node, ...[node.props?.children].flat(Infinity).flatMap(descendants)]; }
const props = { selectedProjectId: '15', viewMode: '3d', projectAssetsTriggerRef: { current: null }, workspaceDirty: true, workspaceSaveMessage: 'Unsaved workspace; Save Project', savingProject: false };
let nodes = descendants(toolbarExports.ProjectSceneToolbar(props));
assert.match(nodes.find(n => n.props?.['aria-label'] === 'Save ThreeD Project').props.className, /ring-amber/);
assert.equal(nodes.find(n => n.type === 'TooltipContent').props.children, props.workspaceSaveMessage, 'Keyboard focus tooltip explains changed workspace');
assert.equal(nodes.find(n => n.props?.role === 'status').props.children, props.workspaceSaveMessage);
nodes = descendants(toolbarExports.ProjectSceneToolbar({ ...props, savingProject: true }));
assert.equal(nodes.find(n => n.props?.['aria-label'] === 'Save ThreeD Project').props.disabled, true);
assert.match(nodes.find(n => n.type === 'TooltipContent').props.children, /Saving Project/);
console.log('PASS: actual toolbar amber Save, accessible status, focus tooltip and pending-Save disabled feedback.');
