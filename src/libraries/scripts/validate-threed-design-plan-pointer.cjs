// Actual DesignPlan handlers, with React scheduling/SVG capture doubles and no browser or persistence.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const ts = require('typescript');
const service = 'src/libraries/services/threed/design/';
const compile = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
function load(file, dependencies = {}, globals = {}) {
  const exports = {};
  vm.runInNewContext(compile(fs.readFileSync(file, 'utf8')), {
    exports, crypto, console, ...globals,
    require(name) { assert(name in dependencies, `Unexpected Design pointer fixture dependency: ${name}`); return dependencies[name]; },
  });
  return exports;
}
const document = load(service + 'document.ts');
const navigation = load(service + 'plan-navigation.ts', { './document': document });
const properties = load(service + 'object-properties.ts', { './document': document });
// Use the real footprint function without initializing unrelated Three/WebGL geometry owners.
const geometryAst = ts.createSourceFile('geometry.ts', fs.readFileSync(service + 'geometry.ts', 'utf8'), ts.ScriptTarget.Latest, true);
const footprintSource = geometryAst.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'wallFootprint').getText(geometryAst);
const footprintScope = { exports: {}, ...document };
vm.runInNewContext(compile(footprintSource), footprintScope);
const wallFootprint = footprintScope.exports.wallFootprint;
const jsx = (type, props) => ({ type, props });
const flatten = tree => tree && typeof tree === 'object' ? [tree, ...[tree.props?.children].flat(Infinity).flatMap(flatten)] : [];
const plain = value => JSON.parse(JSON.stringify(value));
const initialView = { x: 80, y: 80, scale: 45 };
const room = document.validateDesign({
  ...document.newDesign(),
  nodes: [{ id: 'a', x: 0, z: 0 }, { id: 'b', x: 3.048, z: 0 }, { id: 'c', x: 3.048, z: 3.048 }, { id: 'd', x: 0, z: 3.048 }],
  walls: [['a', 'b'], ['b', 'c'], ['c', 'd'], ['d', 'a']].map(([start, end], index) => ({ id: `w${index}`, levelId: 'ground', start, end, height: 2.4384, thickness: .1524, elevation: 0 })),
  floors: [{ id: 'floor', levelId: 'ground', vertices: ['a', 'b', 'c', 'd'], thickness: .1524, elevation: 0 }],
});

function fixture(overrides = {}) {
  const slots = [], captures = new Set(), events = new Map();
  let cursor = 0, pending = [], dirty = true, tree, svgElement, preview = null;
  const effects = [], calls = { select: [], commit: [], view: [], complete: [], message: [] };
  const element = {
    getBoundingClientRect: () => ({ left: 100, top: 50, width: 600, height: 280 }), focus() {},
    setPointerCapture: id => captures.add(id), hasPointerCapture: id => captures.has(id), releasePointerCapture: id => captures.delete(id),
    addEventListener: (name, handler) => events.set(name, handler), removeEventListener: name => events.delete(name),
  };
  const changed = (previous, next) => !previous || !next || next.some((value, index) => !Object.is(value, previous[index]));
  const hooks = {
    useRef(value) { const index = cursor++; return slots[index] ??= { current: value }; },
    useId() { const index = cursor++; return slots[index] ??= 'plan-test'; },
    useState(value) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof value === 'function' ? value() : value;
      return [slots[index], next => { const value = typeof next === 'function' ? next(slots[index]) : next; if (!Object.is(value, slots[index])) { slots[index] = value; dirty = true; } }];
    },
    useCallback(callback, dependencies) { const index = cursor++; if (!slots[index] || changed(slots[index].deps, dependencies)) slots[index] = { callback, deps: dependencies }; return slots[index].callback; },
    useEffect(callback, dependencies) {
      const index = cursor++;
      if (!effects[index] || changed(effects[index].deps, dependencies)) { pending.push(() => { effects[index]?.cleanup?.(); effects[index] = { deps: dependencies, cleanup: callback() }; }); }
    },
  };
  const props = {
    document: room, activeLevelId: 'ground', selected: 'w0', tool: 'select', gridSnap: false, cancelToken: 0, planView: { ...initialView },
    onSelect(id) { calls.select.push(id); props.selected = id; dirty = true; },
    onCommit(doc) { calls.commit.push(doc); props.document = doc; dirty = true; },
    onPreview(doc) { if (preview !== doc) { preview = doc; dirty = true; } },
    onViewChange(view) { calls.view.push(view); props.planView = view; dirty = true; },
    onMessage(message) { calls.message.push(message); },
    onDrawComplete(id) { calls.complete.push(id); props.selected = id; props.tool = 'select'; dirty = true; },
    ...overrides,
  };
  const plan = load('src/components/threed/design/DesignPlan.tsx', {
    'react': hooks, 'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'fragment' },
    'react-dom': { createPortal: content => content },
    'lucide-react': { Focus: 'focus', Maximize: 'maximize', RotateCcw: 'reset' },
    './DesignAction': { DesignAction: 'action' }, '@/components/ui/button': { Button: 'button' }, '@/components/ui/separator': { Separator: 'separator' },
    '@/libraries/services/threed/design/document': document,
    '@/libraries/services/threed/design/plan-navigation': navigation,
    '@/libraries/services/threed/design/object-properties': properties,
    '@/libraries/services/threed/design/geometry': { wallFootprint },
  }, {
    window: { addEventListener() {}, removeEventListener() {} },
    ResizeObserver: class { observe() {} disconnect() {} },
  });
  function flush() {
    for (let count = 0; dirty; count++) {
      assert(count < 20, 'DesignPlan mock scheduling failed to settle.');
      dirty = false; cursor = 0; pending = [];
      tree = plan.DesignPlan({ ...props, displayDocument: preview ?? props.document });
      svgElement = flatten(tree).find(node => node.type === 'svg');
      assert(svgElement); svgElement.props.ref.current = element;
      for (const effect of pending) effect();
    }
  }
  function pointer(name, x = 350, y = 210, options = {}) {
    const { entity = null, node = null, ...values } = options;
    const target = { closest: () => entity ? { getAttribute: () => entity } : null, getAttribute: name => name === 'data-node' ? node : null };
    const event = { clientX: x + 100, clientY: y + 50, pointerId: 7, button: 0, altKey: false, shiftKey: false, preventDefault() {}, target, currentTarget: element, ...values };
    svgElement.props[name](event); flush();
  }
  const api = { props, calls, captures, events, pointer, flush, get preview() { return preview; }, get tree() { return tree; },
    update(values) { Object.assign(props, values); dirty = true; flush(); },
    click(x, y, options) { pointer('onPointerDown', x, y, options); pointer('onPointerUp', x, y, options); },
    world(x, z) { return { x: props.planView.x + x * props.planView.scale, y: props.planView.y + z * props.planView.scale }; },
  };
  flush(); return api;
}

// Select remains its own tool: background click deselects; drag pans without losing selection.
{
  const f = fixture();
  f.pointer('onPointerDown'); assert.equal(f.props.selected, 'w0'); assert(f.captures.has(7));
  f.pointer('onPointerMove', 352, 211); assert.equal(f.calls.view.length, 0, 'Sub-threshold movement must remain a click.');
  f.pointer('onPointerUp', 352, 211); assert.equal(f.props.selected, null); assert.equal(f.captures.size, 0); assert.equal(f.calls.commit.length, 0);
  f.update({ selected: 'w0' }); f.pointer('onPointerDown');
  f.pointer('onPointerMove', 380, 230, { pointerId: 8 }); assert.equal(f.calls.view.length, 0, 'Other pointer IDs cannot take over a captured gesture.');
  f.pointer('onPointerMove', 380, 230); assert.deepEqual(plain(f.props.planView), { x: 110, y: 100, scale: 45 });
  f.pointer('onPointerUp', 389, 240); assert.deepEqual(plain(f.props.planView), { x: 119, y: 110, scale: 45 }, 'Final release displacement must be included.');
  assert.equal(f.props.selected, 'w0'); assert.equal(f.props.tool, 'select'); assert.equal(f.calls.commit.length, 0); assert.equal(f.captures.size, 0);
  f.pointer('onPointerMove', 430, 250); assert.equal(f.props.planView.x, 119, 'Released motion does not continue panning.');
}
// Crossing the threshold on release, or moving exactly four CSS pixels, must not clear selection.
for (const moveBeforeRelease of [false, true]) {
  const f = fixture(); f.pointer('onPointerDown');
  if (moveBeforeRelease) f.pointer('onPointerMove', 354, 210);
  f.pointer('onPointerUp', 354, 210);
  assert.equal(f.props.selected, 'w0'); assert.equal(f.props.planView.x, 84); assert.equal(f.captures.size, 0);
}
for (const tool of ['select', 'wall', 'floor', 'roof', 'door', 'window', 'cutout', 'skylight']) {
  const f = fixture({ tool }); f.pointer('onPointerDown'); f.pointer('onPointerMove', 375, 230); f.pointer('onPointerUp', 375, 230);
  assert.equal(f.props.selected, 'w0'); assert.equal(f.props.tool, tool); assert.equal(f.calls.commit.length, 0);
  assert.equal(f.props.planView.x, 105); assert.equal(f.props.planView.y, 100);
}
{
  const f = fixture({ disabled: true }); f.pointer('onPointerDown'); f.pointer('onPointerMove', 380, 230); f.pointer('onPointerUp', 380, 230);
  assert.equal(f.props.planView.x, 110); assert.equal(f.props.selected, 'w0'); assert.equal(f.calls.commit.length, 0);
}
// Explicit Pan and Alt/middle shortcuts still pan over entities, including a read-only plan.
for (const mode of [{ tool: 'pan', input: {} }, { tool: 'select', input: { altKey: true } }, { tool: 'wall', input: { button: 1 } }]) {
  for (const disabled of [false, true]) {
    const f = fixture({ tool: mode.tool, disabled });
    f.pointer('onPointerDown', 130, 80, { entity: 'w0', ...mode.input });
    f.pointer('onPointerMove', 132, 81, mode.input); f.pointer('onPointerUp', 132, 81, mode.input);
    assert.equal(f.props.planView.x, 82); assert.equal(f.props.planView.y, 81); assert.equal(f.props.selected, 'w0');
    assert.equal(f.props.tool, mode.tool); assert.equal(f.calls.commit.length, 0); assert.equal(f.captures.size, 0);
  }
}
// Existing entity and selected-corner drags edit geometry, preserving view and stable IDs.
for (const target of [{ entity: 'w0' }, { node: 'b' }]) {
  const f = fixture(); const before = plain(f.props.document);
  f.pointer('onPointerDown', 217.16, 80, target); f.pointer('onPointerMove', 239.66, 102.5, target);
  assert(f.preview); f.pointer('onPointerUp', 239.66, 102.5, target);
  assert.equal(f.calls.commit.length, 1); assert.equal(f.props.document.nodes.find(n => n.id === 'b').x, 3.548);
  assert.deepEqual(plain(f.props.document.nodes.map(n => n.id)), before.nodes.map(n => n.id));
  assert.deepEqual(plain(f.props.planView), initialView); assert.equal(f.captures.size, 0);
}
// Drawing clicks still add points; panning does not consume a point, commit, change tool or discard a draft.
for (const tool of ['wall', 'floor', 'roof']) {
  const f = fixture({ document: document.newDesign(), selected: null, tool });
  f.click(125, 125); assert.equal(f.calls.commit.length, 0);
  f.pointer('onPointerMove', 180, 180); const before = flatten(f.tree).filter(n => n.type === 'polyline').map(n => n.props.points);
  assert.equal(before.length, 1, 'First drawing point must remain in the actual draft.');
  f.pointer('onPointerDown', 350, 210); f.pointer('onPointerMove', 410, 230); f.pointer('onPointerUp', 410, 230);
  assert.equal(f.props.tool, tool); assert.equal(f.calls.commit.length, 0); assert.equal(f.props.selected, null);
  const start = f.world(1, 1), next = f.world(2, 1);
  f.click(next.x, next.y, { shiftKey: true });
  if (tool === 'wall') {
    assert.equal(f.calls.commit.length, 1); const wall = f.props.document.walls[0];
    assert.deepEqual(plain(f.props.document.nodes.find(n => n.id === wall.start)), { id: wall.start, x: 1, z: 1 });
    assert.equal(f.props.document.nodes.find(n => n.id === wall.end).z, 1);
  } else {
    const draftText = flatten(f.tree).find(n => n.type === 'span' && Array.isArray(n.props.children) && String(n.props.children[1]).includes('corners'));
    assert.equal(draftText?.props.children[0], 2, `${tool}: one first point and one post-pan click, no extra drag point.`);
    assert(start.x > 125, 'Draft is retained in world coordinates as the plan view moves.');
  }
}
{
  const f = fixture({ document: document.newDesign(), selected: null, tool: 'wall' });
  f.click(125, 125);
  f.pointer('onPointerDown', 170, 131, { shiftKey: true }); f.pointer('onPointerUp', 172, 132, { shiftKey: false });
  const wall = f.props.document.walls[0], end = f.props.document.nodes.find(n => n.id === wall.end);
  assert.equal(end.x, 2); assert.equal(end.z, 1, 'A jittered click uses the original down coordinate and Shift constraint.');
}
// Drawing on a real host remains an ordinary placement, not a temporary pan candidate.
{
  const f = fixture({ tool: 'door' }); const center = f.world(1.524, 0);
  f.click(center.x, center.y, { entity: 'w0' });
  assert.equal(f.props.document.openings.length, 1); assert.equal(f.props.document.openings[0].wallId, 'w0');
  assert.equal(f.props.tool, 'select'); assert.equal(f.calls.complete.length, 1); assert.deepEqual(plain(f.props.planView), initialView);
}
// A pointer landing on transient preview geometry must still count as blank for panning.
{
  const f = fixture({ tool: 'wall', document: document.newDesign(), selected: null });
  f.click(125, 125); f.pointer('onPointerMove', 180, 180);
  f.pointer('onPointerDown', 180, 180, { entity: 'preview-entity' }); f.pointer('onPointerMove', 220, 190, { entity: 'preview-entity' }); f.pointer('onPointerUp', 220, 190, { entity: 'preview-entity' });
  assert.equal(f.props.planView.x, 120); assert.equal(f.calls.commit.length, 0); assert.equal(f.props.tool, 'wall');
}
// Cancel, lost capture and parent cancellation discard pending click actions; inactive/ruler input is ignored.
for (const action of ['onPointerCancel', 'onLostPointerCapture', 'parent-cancel']) {
  const f = fixture({ tool: 'wall', document: document.newDesign(), selected: null });
  f.pointer('onPointerDown');
  if (action === 'parent-cancel') f.update({ cancelToken: 1 }); else f.pointer(action);
  f.pointer('onPointerUp'); assert.equal(f.calls.commit.length, 0);
  assert(!flatten(f.tree).some(n => n.type === 'polyline'), 'Cancelled candidate must not create the first drawing point.');
}
for (const update of [{ active: false }, { disabled: true }, { tool: 'floor' }, { cancelToken: 1 }]) {
  const f = fixture(); f.pointer('onPointerDown'); f.update(update); f.pointer('onPointerUp');
  assert.equal(f.props.selected, 'w0'); assert.equal(f.captures.size, 0, 'Mode, tool and busy transitions release the pending gesture.');
}
{
  const f = fixture(); f.pointer('onPointerDown'); f.pointer('onPointerMove', 720, 340); f.pointer('onPointerUp', 735, 345);
  assert.deepEqual(plain(f.props.planView), { x: 465, y: 215, scale: 45 }); assert.equal(f.captures.size, 0);
  f.pointer('onPointerMove', 350, 210); assert.equal(f.props.planView.x, 465, 'Captured release outside the canvas leaves no continuing pan.');
}
for (const options of [{ active: false }, {}]) {
  const f = fixture(options); f.pointer('onPointerDown', options.active === false ? 350 : 10, 210);
  f.pointer('onPointerMove', 390, 230); f.pointer('onPointerUp', 390, 230);
  assert.equal(f.calls.select.length, 0); assert.equal(f.calls.commit.length, 0); assert.equal(f.calls.view.length, 0); assert.equal(f.captures.size, 0);
}
console.log('PASS: actual DesignPlan blank-click/temporary-pan threshold, tool/selection/draft retention, final release movement, explicit/modifier pan, real object/corner edits, preview-only hits, cancellation and pointer/ruler guards. Offline React/SVG doubles; no browser or persistence.');
