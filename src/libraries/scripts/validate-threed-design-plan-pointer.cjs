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
const sceneUnits = load('src/libraries/services/threed/scene-units.ts');
const document = load(service + 'document.ts', { '../scene-units': sceneUnits });
const navigation = load(service + 'plan-navigation.ts', { './document': document });
const terrain = load('src/libraries/services/threed/terrains/terrain-core.ts');
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
    useMemo(factory, dependencies) { const index = cursor++; if (!slots[index] || changed(slots[index].deps, dependencies)) slots[index] = { value: factory(), deps: dependencies }; return slots[index].value; },
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
    '@/components/ui/context-menu': Object.fromEntries(['ContextMenu','ContextMenuTrigger','ContextMenuContent','ContextMenuItem','ContextMenuLabel','ContextMenuSeparator'].map(name => [name, name])),
    './DesignAction': { DesignAction: 'action' }, '@/components/ui/button': { Button: 'button' }, '@/components/ui/separator': { Separator: 'separator' },
    '@/libraries/services/threed/design/document': document,
    '@/libraries/services/threed/design/plan-navigation': navigation,
    '@/libraries/services/threed/design/object-properties': properties,
    '@/libraries/services/threed/design/geometry': { wallFootprint },
    '@/libraries/services/threed/terrains/terrain-core': terrain,
  }, {
    Event,
    window: { addEventListener() {}, removeEventListener() {}, dispatchEvent: () => true },
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

// Terrain footprint remains visible above an opaque Model plan image.
{
  const definition = terrain.generateTerrainDefinition(1);
  const placement = terrain.parseTerrainPlacement({
    id: null,
    threedId: 1,
    terrainId: 2,
    terrainRevision: 1,
    centerXM: 0,
    centerZM: 0,
    rotationYDeg: 0,
    scale: 0.08,
  });
  const f = fixture({
    terrain: { name: 'New Terrain', definition, placement },
    modelImages: [{ id: 'field', url: 'fixture', corners: [{ x: -20, z: -20 }, { x: 20, z: -20 }, { x: -20, z: 20 }] }],
  });
  const nodes = flatten(f.tree);
  const imageIndex = nodes.findIndex(node => node.type === 'image');
  const outlineIndex = nodes.findIndex(node => node.props?.['data-plan-terrain-outline'] === 2);
  assert.ok(outlineIndex > imageIndex, 'Terrain footprint remains visible above an opaque Ground Map Model image');
  assert.equal(nodes[outlineIndex].props.pointerEvents, 'none', 'Terrain outline cannot block Model selection');
}

// Visible saved objects stay selectable when the active drawing level is different/hidden.
{
  const multilevel = document.validateDesign({ ...room, levels: [...room.levels, { id: 'upper', name: 'Upper', elevation: 3 }] });
  const f = fixture({ document: multilevel, activeLevelId: 'upper', visibleLevelIds: ['ground'], selected: null });
  f.click(130, 80, { entity: 'w0' });
  assert.equal(f.props.selected, 'w0', 'A visible wall must activate even with a hidden active drawing level');
  assert.equal(f.calls.commit.length, 0, 'Picking another level does not edit its geometry');
  const allVisible = fixture({ document: multilevel, activeLevelId: 'upper', visibleLevelIds: ['ground', 'upper'], selected: null });
  allVisible.click(130, 80, { entity: 'w0' });
  assert.equal(allVisible.props.selected, 'w0', 'A visible object on another level is selectable even when the drawing level is visible too');
  const hiddenObject = fixture({ document: multilevel, activeLevelId: 'upper', visibleLevelIds: ['upper'], selected: null });
  hiddenObject.click(130, 80, { entity: 'w0' });
  assert.equal(hiddenObject.props.selected, null, 'Hidden geometry cannot be activated through a stale hit');
  let picked = null;
  const models = fixture({ document: multilevel, activeLevelId: 'upper', visibleLevelIds: ['ground'], modelImages: [{ id: 'tree', url: 'fixture', corners: [{ x: 10, z: 20 }, { x: 12, z: 20 }, { x: 10, z: 24 }] }], onModelSelect: id => { picked = id; } });
  flatten(models.tree).find(node => node.type === 'image').props.onPointerDown({ button: 0, altKey: false, preventDefault() {}, stopPropagation() {} });
  assert.equal(picked, 'tree', 'Project Model selection is independent of the architecture drawing level');
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

// Existing Model instances render from measured Scene-unit corners without entering architecture history.
{
  let selectedModel = null, stopped = false;
  const image = {id:'models-15',url:'https://fixture.invalid/top.png',corners:[{x:10,z:20},{x:12,z:20},{x:10,z:24}]};
  const f = fixture({modelImages:[image],metersPerSceneUnit:.3048,onModelSelect:id=>{selectedModel=id;}});
  const node = flatten(f.tree).find(node=>node.type==='image'); assert(node);
  const matrix = node.props.transform.slice(7,-1).split(' ').map(Number);
  for(const [i,value] of [.6096,0,0,1.2192,3.048,6.096].entries()) assert(Math.abs(matrix[i]-value)<1e-8);
  node.props.onPointerDown({button:0,altKey:false,preventDefault(){},stopPropagation(){stopped=true;}});
  assert.equal(selectedModel,'models-15');assert(stopped);assert.equal(f.calls.commit.length,0);assert.equal(f.calls.view.length,0);
  f.update({selectedModelId:'models-15'});
  let highlight=flatten(f.tree).find(node=>node.props?.['data-selected-model']==='models-15');
  assert(highlight,'The selected placed Model has a visible 2D footprint');
  assert.equal(highlight.props.pointerEvents,'none','Highlight cannot intercept picking');
  f.update({selectedModelId:null});
  assert(!flatten(f.tree).some(node=>node.props?.['data-selected-model']),'Deselecting removes the footprint');
  selectedModel=null;node.props.onKeyDown({key:'Enter',stopPropagation(){},preventDefault(){}});assert.equal(selectedModel,'models-15');
  f.update({disabled:true});selectedModel=null;flatten(f.tree).find(node=>node.type==='image').props.onPointerDown({button:0,altKey:false,stopPropagation(){}});assert.equal(selectedModel,null);
  f.update({disabled:false,document:document.newDesign()});const fit=flatten(f.tree).find(node=>node.type==='action'&&node.props.label==='Fit Plan');assert.equal(fit.props.disabled,false);fit.props.onClick();assert(f.calls.view.length>0);
}
console.log('PASS: actual Model top-view SVG affine calibration, pointer/keyboard selection, busy guards, Fit Plan and no architecture history mutations.');

{
  const image = { id: 'field', name: 'Soccer Field', url: null, corners: [{ x: 0, z: 0 }, { x: 40, z: 0 }, { x: 0, z: 60 }] };
  const small = { id: 'ball', name: 'Ball', url: null, corners: [{ x: 2, z: 2 }, { x: 3, z: 2 }, { x: 2, z: 3 }] };
  let picked = null;
  const f = fixture({ selected: null, modelImages: [small, image], onModelSelect: id => { picked = id; } });
  const footprints = () => flatten(f.tree).filter(node => node.props?.['data-model-footprint']);
  assert.deepEqual(footprints().map(node => node.props['data-model-footprint']), ['field', 'ball'], 'Large environments render behind smaller selectable Models');
  assert(!flatten(f.tree).some(node => node.type === 'text' && node.props.children === 'Soccer Field'), 'Unselected labels must not overlap the plan');
  footprints()[0].props.onPointerEnter();
  f.flush();
  assert(flatten(f.tree).some(node => node.type === 'text' && node.props.children === 'Soccer Field'), 'Hover reveals the name');
  footprints()[0].props.onPointerLeave();
  f.flush();
  footprints()[0].props.onPointerDown({ button: 0, altKey: false, preventDefault() {}, stopPropagation() {} });
  assert.equal(picked, 'field');
  footprints()[1].props.onKeyDown({ key: 'Enter', preventDefault() {}, stopPropagation() {} });
  assert.equal(picked, 'ball');
  assert.equal(f.calls.commit.length, 0, 'Model selection never edits architecture history');
  f.update({ modelImages: [{ ...small, url: 'https://fixture.invalid/missing.png' }] });
  flatten(f.tree).find(node => node.type === 'image').props.onError();
  f.flush();
  assert.equal(footprints()[0].props['data-model-footprint'], 'ball', 'Image failure retains the same selectable Model');
  f.update({ modelImages: [{ ...small, url: 'https://fixture.invalid/replaced.png' }] });
  assert(flatten(f.tree).some(node => node.type === 'image'), 'A replacement image can load after failure');
  f.update({ modelImages: [] });
  assert.equal(footprints().length, 0, 'Removing an instance removes its plan counterpart');
}
console.log('PASS: missing/failed Top View footprints, stable identity, pointer/keyboard selection, replacement images, cleanup and environment stacking.');

{
  const model = { id: 'protected', name: 'Protected Model', positionX: 10, positionY: 2, positionZ: 10, scaleMultiplier: 1, locked: true };
  let writes = 0;
  const f = fixture({ selected: null, selectedModelId: model.id, selectedModel: model,
    modelImages: [{ id: model.id, url: 'fixture', corners: [{ x: 9, z: 9 }, { x: 11, z: 9 }, { x: 9, z: 11 }] }],
    onSaveModel: async () => { writes++; return true; } });
  const image = () => flatten(f.tree).find(node => node.type === 'image');
  image().props.onPointerDown({ button: 0, altKey: false, preventDefault() {}, stopPropagation() {} });
  f.flush();
  assert.equal(f.captures.size, 0);
  assert(!flatten(f.tree).some(node => node.props?.['data-model-resize']));
  assert(flatten(f.tree).some(node => node.props?.['data-selected-model'] === model.id));
  f.update({ selectedModel: { ...model, locked: false } });
  image().props.onPointerDown({ pointerId: 7, button: 0, altKey: false, clientX: 350, clientY: 210, preventDefault() {}, stopPropagation() {} });
  f.flush();
  assert(f.captures.has(7));
  f.update({ selectedModel: { ...model, locked: true } });
  assert.equal(f.captures.size, 0, 'Locking during a gesture cancels it');
  f.pointer('onPointerUp', 450, 240);
  assert.equal(writes, 0);
}
console.log('PASS: locked plan Models retain selection, suppress movement/resize handles and cancel pending gestures without writes.');

{
  assert.equal(navigation.formatPlanLength(.762,'imperial'), "2'6\"");
  assert.equal(navigation.formatPlanLength(.3048-.000001,'imperial'), "1'0\"");
  const f = fixture();
  assert.equal(flatten(f.tree).filter(node=>node.props?.['data-measurement']).length,0);
  flatten(f.tree).find(node=>node.type==='action'&&node.props.label==='Show Measurements').props.onClick();f.flush();
  const wallLabel=flatten(f.tree).find(node=>node.props?.['data-measurement']==='w0');assert.equal(wallLabel.props.children,"10'0\"");
  assert(flatten(f.tree).some(node=>node.props?.['data-measurement']==='floor'));
  const toggle=flatten(f.tree).find(node=>node.type==='action'&&node.props.label==='Hide Measurements');assert.equal(toggle.props['aria-pressed'],true);toggle.props.onClick();f.flush();
  assert.equal(flatten(f.tree).filter(node=>node.props?.['data-measurement']).length,0);assert.equal(f.calls.commit.length,0);
  const metric=fixture({showMeasurements:true,measurementUnits:'metric'});assert.equal(flatten(metric.tree).find(node=>node.props?.['data-measurement']==='w0').props.children,'3.048 m');
}
console.log('PASS: measurement labels default hidden, actual toolbar toggle and active state, compact Imperial inches carry, Metric labels and no geometry/history mutations.');

{
  let chosen = 0;
  const f = fixture({ contextActions: [{label:'Structures',color:'text-emerald-700',actions:[{label:'Wall',icon:'wall-icon',active:true,run:()=>chosen++},{label:'Undo',icon:'undo-icon',disabled:true,run:()=>{throw Error('Disabled action');}}]}] });
  const items = () => flatten(f.tree).filter(node=>node.type==='ContextMenuItem');
  assert.deepEqual(items().map(node=>flatten(node).find(child=>child.type==='span')?.props.children), ['Wall','Undo','Show Measurements','Fit Plan','Zoom to Selection','Reset View']);
  assert(flatten(items()[0]).some(node=>node.type==='wall-icon'));
  assert(flatten(items()[0]).some(node=>node.props?.children==='Selected'));
  assert.equal(items()[1].props.disabled,true);
  items()[0].props.onSelect(); assert.equal(chosen,1);
  items()[2].props.onSelect();f.flush();assert(flatten(f.tree).some(node=>node.props?.['data-measurement']));
  f.pointer('onPointerDown',350,210,{button:2});assert.equal(f.captures.size,0);assert.equal(f.calls.commit.length,0);
  const content=flatten(f.tree).find(node=>node.type==='ContextMenuContent');let stopped=false;content.props.onKeyDown({stopPropagation(){stopped=true;}});assert(stopped,'Menu keyboard events must not reach drawing shortcuts.');
}
console.log('PASS: Design context menu named/icon actions, active/disabled state, shared callbacks, measurements, right-button guard and keyboard isolation. Radix DOM positioning/focus remains browser verification.');

{
 let toggled=null;
 const f=fixture({visibleLevelIds:[],onToggleLevel:id=>toggled=id});
 const nav=()=>flatten(f.tree).find(node=>node.props?.['aria-label']==='Design levels');
 const buttons=()=>flatten(nav()).filter(node=>node.type==='button');
 assert.equal(buttons().length,f.props.document.levels.length);
 assert(buttons().every(button=>!button.props['aria-pressed']));
 assert(!flatten(f.tree).some(node=>node.props?.['data-entity']==='w0'));
 buttons()[0].props.onClick();assert.equal(toggled,f.props.document.levels[0].id);
 f.update({visibleLevelIds:f.props.document.levels.map(level=>level.id)});
 assert(buttons().every(button=>button.props['aria-pressed']));
 f.update({tool:'floor',cancelToken:1});f.update({tool:'select',cancelToken:2});assert(buttons().every(button=>button.props['aria-pressed']));
 assert(flatten(f.tree).some(node=>node.props?.['data-entity']==='w0'));
 assert(nav().props.className.includes('absolute'));assert(nav().props.className.includes('left-9'));assert(nav().props.className.includes('threed-scene-panel-surface'));
 assert.equal(document.visibleLevelsDocument(f.props.document,[]).walls.length,0);
}
console.log('PASS: independent named level toggles, all-off/all-on geometry, stable visibility across tools and Blueprint bottom-left overlay.');
