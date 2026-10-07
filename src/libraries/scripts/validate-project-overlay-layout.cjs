const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
let slots = [], cursor = 0, effects = [], layout = { positions: {}, move(id, point) { this.positions[id] = point; } };
class Element {
  constructor(width, height, left = 0, top = 0) { Object.assign(this, { clientWidth: width, clientHeight: height, offsetWidth: width, offsetHeight: height, left, top }); }
  getBoundingClientRect() { return { left: this.left, top: this.top }; }
}
const parent = new Element(1000, 700);
const panel = new Element(350, 220, 325, 56); panel.offsetParent = parent;
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/map/panels/ProjectOverlayLayout.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: exportsObject, HTMLElement: Element,
  document: { querySelector: () => ({ getBoundingClientRect: () => ({ bottom: 32 }) }) },
  window: { innerWidth: 1000, innerHeight: 700, addEventListener() {}, removeEventListener() {} },
  ResizeObserver: class { observe() {} disconnect() {} },
  require(name) { assert.equal(name, 'react'); return {
    createContext: value => value, useContext: () => layout,
    useRef: value => slots[cursor++] ??= { current: value },
    useState(value) { const index = cursor++; slots[index] ??= value; return [slots[index], next => { slots[index] = typeof next === 'function' ? next(slots[index]) : next; }]; },
    useLayoutEffect: effect => effects.push(effect),
  }; },
});
function render() { cursor = 0; effects = []; const result = exportsObject.useProjectOverlayPosition('simulations'); result.ref.current = panel; effects.forEach(effect => effect()); return result; }
let result = render(); result = render(); assert.equal(result.style, undefined);
let captured = false;
const handle = { setPointerCapture() { captured = true; }, hasPointerCapture() { return captured; }, releasePointerCapture() { captured = false; } };
function event(x, y, target = { closest: () => null }) { return { button: 0, pointerId: 1, clientX: x, clientY: y, target, currentTarget: handle, preventDefault() {}, stopPropagation() {} }; }
result.handle.onPointerDown(event(0, 0));
result.handle.onPointerMove(event(9999, 9999));
assert.deepEqual(JSON.parse(JSON.stringify(layout.positions.simulations)), { x: 1, y: 1 });
result = render(); assert.equal(result.style.left, 650); assert.equal(result.style.top, 472);
assert.equal(result.style.left + panel.offsetWidth, parent.clientWidth, 'Right edge reaches viewport');
assert.equal(result.style.translate, 'none');
assert.equal(result.style.transform, 'none');
// Tailwind 4's independent translate must be overridden at both edges.
layout.positions.simulations = { x: 0, y: 0 };
result = render();
const translatedLeft = result.style.left + (result.style.translate === 'none' ? 0 : -panel.offsetWidth / 2);
assert.equal(translatedLeft, 0);
assert.equal(result.style.top, 32, 'Top edge touches the actual toolbar bottom');
layout.positions.simulations = { x: 1, y: 1 };
result = render();
result.handle.onPointerCancel(); result.handle.onPointerMove(event(-9999, -9999)); assert.equal(layout.positions.simulations.x, 1);
result.handle.onPointerDown(event(0, 0, { closest: () => ({}) })); result.handle.onPointerMove(event(-9999, -9999)); assert.equal(layout.positions.simulations.x, 1);
parent.clientWidth = 600; result = render(); result = render(); assert.equal(result.style.left, 250);
layout.positions = {}; result = render(); assert.equal(result.style, undefined);
panel.left = 250;
result.handle.onKeyDown({ key: 'ArrowLeft', currentTarget: handle, target: handle, preventDefault() {}, stopPropagation() {} });
assert.equal(layout.positions.simulations.x, 234 / 250);
console.log('PASS: actual overlay drag, viewport bounds, resizing, cancellation, control exclusion, keyboard movement and reset.');
