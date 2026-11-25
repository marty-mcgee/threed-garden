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
    './WallCutoutEditor': { WallCutoutEditor: 'wall-cutout-editor' },
    './DesignAction': { DesignAction: 'action' }, '@/components/ui/button': { Button: 'button' }, '@/components/ui/separator': { Separator: 'separator' },
    '@/libraries/services/threed/design/document': document,
    '@/libraries/services/threed/design/plan-navigation': navigation,
    '@/libraries/services/threed/design/object-properties': properties,
    '@/libraries/services/threed/design/geometry': { wallFootprint },
    '@/libraries/services/threed/terrains/terrain-core': terrain,
  }, {
    Event,
    window: { prompt:()=> 'Room', addEventListener() {}, removeEventListener() {}, dispatchEvent: () => true },
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
    const { entity = null, node = null, wallSplit = null, floorEdge = null, roofEdge = null, stairHandle = null, cutoutCorner = null, insert = false, moveHandle = false, ...values } = options;
    const target = { closest: selector => selector === '[data-stair-handle]' ? (stairHandle ? { getAttribute: () => stairHandle } : null) : selector === '[data-floor-edge]' ? (floorEdge === null ? null : {getAttribute:()=>String(floorEdge)}) : selector === '[data-wall-split]' ? (wallSplit ? { getAttribute: () => wallSplit } : null) : cutoutCorner !== null && selector === '[data-cutout-vertex]' ? { getAttribute: () => String(cutoutCorner), hasAttribute: () => insert } : roofEdge !== null && selector === '[data-roof-edge]' ? { getAttribute: () => String(roofEdge) } : moveHandle && selector === '[data-selection-handle]' ? { getAttribute: () => 'move' } : entity ? { getAttribute: () => entity } : null, getAttribute: name => name === 'data-node' ? node : null };
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

// One X/Z translation covers shared nodes and hidden levels while keeping host bindings intact.
{
  const upper = room.nodes.map(node => ({ ...node, id: node.id + '-upper' }));
  const whole = document.validateDesign({
    ...room,
    levels: [...room.levels, { id: 'upper', name: 'Upper', elevation: 3 }],
    nodes: [...room.nodes, ...upper],
    roofs: [{ id: 'roof', levelId: 'upper', vertices: upper.map(node => node.id), kind: 'gable', pitch: 6, direction: 0, thickness: .15, elevation: 3 }],
    openings: [{ id: 'door', kind: 'door', wallId: 'w0', offset: .5, width: .8, height: 2, sill: 0 }],
  });
  const f = fixture({ document: whole, visibleLevelIds: ['ground'], tool: 'objects', selected: null });
  f.update({selectAllRequest: 1});
  f.pointer('onPointerDown', 140, 100, {entity:'w0'});
  f.pointer('onPointerMove', 185, 145);
  assert(f.preview);
  assert.equal(f.calls.commit.length, 0);
  f.pointer('onPointerUp', 230, 55);
  assert.equal(f.calls.commit.length, 1);
  const moved = plain(f.props.document);
  assert.deepEqual(moved.nodes, plain(whole.nodes).map(n => ({ ...n, x: n.x + 2, z: n.z - 1 })));
  for (const key of ['levels','walls','floors','roofs','openings']) assert.deepEqual(moved[key], plain(whole[key]));
  f.pointer('onPointerDown', 140, 100);
  f.pointer('onPointerMove', 185, 145);
  f.pointer('onPointerCancel');
  f.pointer('onPointerUp', 185, 145);
  assert.equal(f.calls.commit.length, 1);
  assert.deepEqual(plain(f.props.planView), initialView);
}
// Reverse marquee encloses only the bottom wall of the shared-node room.
{
  const f = fixture({ tool: 'objects', selected: null });
  f.pointer('onPointerDown', 230, 95);
  f.pointer('onPointerMove', 60, 60);
  assert(flatten(f.tree).some(n => n.props?.['data-selection-box'] === ''));
  f.pointer('onPointerUp', 60, 60);
  assert.equal(f.calls.commit.length, 0);
  const highlighted = flatten(f.tree).filter(n => n.props?.stroke === '#36b8c8');
  assert.equal(f.props.selected, null, 'Box selection leaves individual objects inactive.');
  assert.equal(highlighted[0]?.props.fill, '#b4c8df', 'Selection preserves the Wall base color');
  assert.deepEqual(highlighted.map(n => n.props['data-entity']), ['w0']);
  f.pointer('onPointerDown', 130, 80, {entity:'w0'});
  assert.equal(f.props.selected, null, 'Dragging the group leaves individual objects inactive.');
  f.pointer('onPointerMove', 175, 125);
  assert(f.preview);
  f.pointer('onPointerUp', 175, 125);
  assert.equal(f.calls.commit.length, 1);
  const moved = plain(f.props.document);
  const wall = moved.walls[0];
  assert.deepEqual(moved.nodes.find(n => n.id === wall.start), { id:wall.start, x:1, z:1 });
  assert.deepEqual(moved.nodes.slice(0,4), plain(room.nodes));
  assert.deepEqual(moved.walls.slice(1), plain(room.walls.slice(1)));
  assert.deepEqual(moved.floors, plain(room.floors));
  assert.deepEqual(plain(f.props.planView), initialView);
}
{
  const f = fixture({ tool: 'objects', selected: null });
  f.click(130,80,{entity:'w0'});
  f.click(215,120,{entity:'w1'});
  assert.equal(flatten(f.tree).filter(n=>n.props?.['data-selection-outline']==='').length,2);
  assert(flatten(f.tree).some(n=>n.props?.['data-selection-handle']==='move'));
  assert.equal(f.calls.select.length,0);
  assert.equal(f.calls.commit.length,0);
}
{
  const f = fixture({ document: document.newDesign(), selected: null, tool: 'stairs' });
  f.click(80, 80);
  f.pointer('onPointerMove', 80, 194);
  assert.equal(f.calls.commit.length, 0);
  assert.equal(f.preview?.stairs?.length, 1, 'The second point previews a single flight.');
  f.click(80, 194);
  assert.equal(f.calls.commit.length, 1);
  const flight = f.props.document.stairs[0];
  assert.deepEqual(f.calls.complete, [flight.id]);
  assert.equal(f.props.document.nodes.length, 1, 'A flight stores just its independent start anchor.');
  assert.equal(flight.direction, 90);
  assert.equal(flight.stepHeight, .1778);
  assert.equal(flight.stepLength, .254);
  assert.equal(flight.width, .9144);
  assert.equal(document.stairLayout(flight).count, 10);
  assert(flatten(f.tree).some(node => node.props['data-stairs'] === flight.id));
  const handle = kind => flatten(f.tree).find(node => node.props['data-stair-handle'] === kind);
  const handlePoint = kind => f.world(handle(kind).props.cx, handle(kind).props.cy);
  const beginResize = kind => {
    const { x, y } = handlePoint(kind);
    f.pointer('onPointerDown', x, y, { entity: flight.id, stairHandle: kind });
  };
  const undoCount = f.calls.commit.length;
  beginResize('end');
  f.pointer('onPointerMove', 170, 80);
  assert.equal(f.preview.stairs[0].direction, 0);
  assert.equal(f.preview.stairs[0].stepLength, .2);
  assert.equal(f.calls.commit.length, undoCount);
  f.pointer('onPointerUp', 215, 80);
  let resized = f.props.document.stairs[0];
  assert.equal(resized.stepLength, .3, 'The final pointer position sets the full run.');
  assert.equal(resized.endY, flight.endY);
  assert.equal(resized.direction, 0);
  assert.equal(document.stairLayout(resized).count, 10);
  assert.equal(f.calls.commit.length, undoCount + 1);
  beginResize('width');
  f.pointer('onPointerMove', 148, 125);
  assert.equal(f.preview.stairs[0].width, 2);
  f.pointer('onPointerCancel', 148, 125);
  assert.equal(f.props.document.stairs[0].width, flight.width);
  assert.equal(f.calls.commit.length, undoCount + 1);
  beginResize('width');
  f.pointer('onPointerUp', 148, 116);
  resized = f.props.document.stairs[0];
  assert.equal(resized.width, 1.6);
  assert.equal(resized.stepLength, .3);
  assert.equal(resized.anchor, flight.anchor);
  assert.equal(f.calls.commit.length, undoCount + 2);
  f.update({ disabled: true });
  assert(!handle('end') && !handle('width'), 'Read-only Stairs do not expose resize handles.');
  f.update({ disabled: false });
  f.update({ tool: 'objects' });
  f.pointer('onPointerDown', 45, 35);
  f.pointer('onPointerMove', 245, 220);
  f.pointer('onPointerUp', 245, 220);
  assert(flatten(f.tree).some(node => node.props['data-selection-handle'] === 'move'));
  f.pointer('onPointerDown', 80, 110, { moveHandle: true });
  f.pointer('onPointerMove', 125, 155);
  f.pointer('onPointerUp', 125, 155);
  const moved = f.props.document.nodes.find(node => node.id === flight.anchor);
  assert.equal(moved.x, 1);
  assert.equal(moved.z, 1);
  f.update({ tool: 'deck', selected: null });
  f.click(260, 90);
  f.click(340, 90);
  f.click(340, 170);
  f.click(260, 90);
  assert.equal(f.props.document.version, 13);
  assert.equal(f.props.document.floors[0].surface, 'deck');
  assert.equal(f.props.document.stairs[0].id, flight.id);
}
// A corner changes local run and width, preserving the opposite corner even on a rotated descending flight.
{
  const stair = {
    id: 'stairs', levelId: 'ground', anchor: 'a', direction: 30, width: 1,
    startY: 2, endY: 0, stepLength: .25, stepHeight: .2,
  };
  const design = document.validateDesign({ ...room, version: 13, stairs: [stair] });
  const cornerNames = ['startLeft', 'startRight', 'endRight', 'endLeft'];
  for (const [index, name] of cornerNames.entries()) {
    const f = fixture({ document: design, selected: stair.id, planView: { x: 200, y: 180, scale: 60 } });
    const corners = document.stairFootprint(design, stair);
    const circle = () => flatten(f.tree).find(node => node.props['data-stair-handle'] === name);
    const p = corners[index];
    const start = f.world(p.x, p.z);
    f.pointer('onPointerDown', start.x, start.y, { entity: stair.id, stairHandle: name });
    assert.equal(circle().props.fill, '#f472b6');
    const along = index < 2 ? -.6 : .6;
    const across = index === 1 || index === 2 ? .4 : -.4;
    const angle = Math.PI / 6;
    const target = f.world(p.x + along * Math.cos(angle) - across * Math.sin(angle),
      p.z + along * Math.sin(angle) + across * Math.cos(angle));
    f.pointer('onPointerMove', target.x, target.y);
    assert.equal(f.calls.commit.length, 0);
    const detached = f.preview.stairs[0].anchor;
    assert.notEqual(detached, stair.anchor);
    f.pointer('onPointerUp', target.x, target.y);
    assert.equal(f.calls.commit.length, 1);
    const result = f.props.document, resized = result.stairs[0];
    assert.equal(resized.anchor, detached, 'The detached anchor ID survives preview and release.');
    assert.equal(resized.id, stair.id);
    assert.equal(resized.width, 1.4);
    assert.equal(resized.stepLength, .31);
    assert.equal(resized.direction, stair.direction);
    assert.equal(resized.startY, stair.startY);
    assert.equal(resized.endY, stair.endY);
    assert.equal(document.stairLayout(resized).count, 10);
    const fixed = (index + 2) % 4;
    assert(document.distance(document.stairFootprint(result, resized)[fixed], corners[fixed]) < .000002);
    assert.deepEqual(plain(result.nodes.slice(0, room.nodes.length)), plain(room.nodes));
    assert.deepEqual(plain(result.walls), plain(room.walls));
    assert.deepEqual(plain(result.floors), plain(room.floors));
  }
  const f = fixture({ document: design, selected: stair.id });
  f.pointer('onPointerDown', 100, 100, { entity: stair.id });
  f.pointer('onPointerUp', 145, 145);
  const moved = f.props.document.stairs[0];
  assert.notEqual(moved.anchor, stair.anchor);
  assert.deepEqual(plain(f.props.document.nodes.find(n => n.id === moved.anchor)), { id: moved.anchor, x: 1, z: 1 });
  assert.deepEqual(plain(f.props.document.nodes.find(n => n.id === 'a')), { id: 'a', x: 0, z: 0 });
}
for (const surface of ['deck', 'patio', 'driveway']) {
  const f = fixture({
    document: document.newDesign(),
    selected: null,
    tool: surface === 'deck' ? 'deck' : 'patio',
  });
  if (surface === 'driveway') {
    const picker = flatten(f.tree).find(node => node.type === 'select' && node.props.value === 'patio');
    picker.props.onChange({ target: { value: 'driveway' } });
    f.flush();
  }
  f.click(80, 80);
  f.click(215, 80);
  f.pointer('onPointerMove', 215, 215);
  assert.equal(f.preview.floors[0].surface, surface);
  assert.equal(f.calls.commit.length, 0);
  f.click(215, 215);
  f.click(80, 215);
  f.click(80, 80);
  assert.equal(f.calls.commit.length, 1);
  const shape = f.props.document.floors[0];
  assert.equal(shape.surface, surface);
  assert.equal(shape.vertices.length, 4);
  assert.equal(shape.elevation, surface === 'deck' ? 0.6096 : 0.0254);
  assert.deepEqual(f.calls.complete, [shape.id]);
  const polygon = flatten(f.tree).find(node => node.props['data-surface'] === surface);
  assert.equal(polygon.props.fill, document.planObjectColor(shape));
  f.click(148, 80, { floorEdge: 0 });
  assert.equal(f.props.document.floors[0].vertices.length, 5);
  assert.equal(f.props.document.floors[0].surface, surface);
}
// Floor edits retain the host outline and neighbouring Walls.
for (const connect of [true,false]) {
  const f = fixture({document:room,selected:'floor'});
  const button = label => flatten(f.tree).find(n=>n.props?.label===label);
  if (!connect) { button('Connect Floor Corners').props.onClick(); f.flush(); }
  f.click(100,100,{node:'a'});
  button('Split Floor').props.onClick(); f.flush();
  f.click(220,220,{node:'c'});
  const [first,second] = f.props.document.floors;
  assert.equal(first.id,'floor');
  assert.equal(second.vertices.length,3);
  assert.equal(second.vertices.filter(id=>first.vertices.includes(id)).length,connect?2:0);
  assert.deepEqual(plain(f.props.document.walls),plain(room.walls));
}
{
  const f = fixture({document:room,selected:'floor'});
  f.click(140,80,{floorEdge:0});
  assert.equal(f.props.document.floors[0].vertices.length,5);
  flatten(f.tree).find(n=>n.props?.label==='Detach Floor').props.onClick();
  f.flush();
  assert(!f.props.document.floors[0].vertices.some(id=>room.floors[0].vertices.includes(id)));
}
// Detach preserves the neighbouring objects; a separate split allocates independent points.
{
  const f = fixture({ document: room, selected: 'w0' });
  const action = label => flatten(f.tree).find(n => n.props?.label === label);
  action('Detach Wall').props.onClick();
  f.flush();
  const detached = f.props.document;
  assert.notEqual(detached.walls[0].start, room.walls[0].start);
  assert.notEqual(detached.walls[0].end, room.walls[0].end);
  assert.deepEqual(plain(detached.walls.slice(1)), plain(room.walls.slice(1)));
  assert.deepEqual(plain(detached.floors), plain(room.floors));
  action('Connect Wall Endpoints').props.onClick();
  f.flush();
  const p = f.world(1.524,0);
  f.click(p.x,p.y,{wallSplit:'w0'});
  const [first, second] = f.props.document.walls;
  assert.notEqual(first.end, second.start);
}
// A split is one commit, keeps both Wall objects, and reparents a hosted opening.
{
  const opening = { id:'window', kind:'window', wallId:'w0', offset:2, width:.4, height:.5, sill:.6 };
  const doc = document.validateDesign({...room,version:6,openings:[opening],walls:room.walls.map(w=>w.id==='w0'?{...w,endHeight:3}:w)});
  const f = fixture({document:doc,selected:'w0'});
  const p = f.world(1.524,0);
  f.click(p.x,p.y,{wallSplit:'w0'});
  assert.equal(f.calls.commit.length,1);
  const [a,b] = f.props.document.walls;
  assert.equal(a.id,'w0');
  assert.equal(a.end,b.start);
  assert.equal(a.endHeight,b.height);
  assert.equal(b.endHeight,3);
  assert.equal(f.props.document.walls.length,5);
  assert.equal(f.props.document.openings[0].wallId,b.id);
  assert.equal(f.props.document.openings[0].offset,.476);
}
// Inserting a corner on the closing edge retains the roof identity and adjoining floor.
{
  const roof = { id:'roof', levelId:'ground', vertices:['a','b','c','d'], kind:'gable', pitch:6, direction:0, thickness:.15, elevation:3 };
  const f = fixture({document: document.validateDesign({...room, roofs:[roof]}), selected:'roof'});
  assert.equal(flatten(f.tree).filter(n=>n.props?.['data-roof-edge'] !== undefined).length,4);
  const start = f.world(0,1), end = f.world(-1,1);
  f.pointer('onPointerDown',start.x,start.y,{roofEdge:3});
  assert.equal(f.calls.commit.length,0);
  f.pointer('onPointerMove',end.x,end.y);
  f.pointer('onPointerUp',end.x,end.y);
  assert.equal(f.calls.commit.length,1);
  const saved = plain(f.props.document), updated = saved.roofs[0];
  assert.deepEqual({...updated,vertices:updated.vertices.slice(0,4)},roof);
  assert.deepEqual(saved.nodes.find(n=>n.id===updated.vertices[4]),{id:updated.vertices[4],x:-1,z:1});
  assert.deepEqual(saved.floors,plain(room.floors));
  f.pointer('onPointerDown',start.x,start.y,{roofEdge:0});
  f.pointer('onPointerCancel');
  assert.equal(f.calls.commit.length,1);
}
// Removing a reference preserves shared nodes and the minimum polygon size.
{
  const roof = { id:'roof', levelId:'ground', vertices:['a','b','c','d'], kind:'flat', pitch:0, direction:0, thickness:.15, elevation:3 };
  const f = fixture({document: document.validateDesign({...room, roofs:[roof]}), selected:'roof'});
  const menuItem = () => flatten(f.tree).find(n => n.type === 'ContextMenuItem' && n.props['aria-label'] === 'Remove Point');
  f.pointer('onContextMenuCapture',130,80,{node:'a'});
  assert.equal(menuItem().props.disabled,false);
  menuItem().props.onSelect();
  f.flush();
  f.pointer('onContextMenuCapture',130,80,{node:'b'});
  assert.equal(menuItem().props.disabled,true);
  f.pointer('onContextMenuCapture',130,80);
  assert.equal(menuItem(),undefined);
  assert.deepEqual(plain(f.props.document.roofs[0].vertices), ['b','c','d']);
  assert.deepEqual(plain(f.props.document.nodes), plain(room.nodes));
  f.click(130,80,{node:'b',shiftKey:true});
  assert.equal(f.calls.commit.length,1);
}
// Draw, finish, insert a corner on the closing edge, and reshape a hosted cutout.
{
  const roof = { id:'roof', levelId:'ground', vertices:['a','b','c','d'], kind:'flat', pitch:0, direction:0, thickness:.15, elevation:3 };
  const f = fixture({document: document.validateDesign({...room, roofs:[roof]}), selected:'roof', tool:'cutout'});
  for (const [x,z] of [[.5,.5],[2,.5],[2,1],[1,1],[1,2],[.5,2],[.5,.5]]) {
    const p=f.world(x,z); f.click(p.x,p.y);
  }
  const cutout=f.props.document.roofOpenings[0];
  assert.equal(f.props.document.version,7);
  assert.equal(cutout.outline.length,6);
  assert.equal(f.calls.commit.length,1);
  const mid=f.world(.5,1.25), end=f.world(.03,1.25);
  f.pointer('onPointerDown',mid.x,mid.y,{cutoutCorner:5,insert:true});
  f.pointer('onPointerMove',end.x,end.y);
  f.pointer('onPointerUp',end.x,end.y);
  const edited=f.props.document.roofOpenings[0];
  assert.equal(edited.id,cutout.id);
  assert.equal(edited.outline.length,7);
  assert.equal(f.calls.commit.length,2);
  assert(Math.abs(document.roofOpeningFootprint(f.props.document,edited)[6].x)<.00001);
}
// Both selection gestures feed Group, and a mixed drag is one transaction.
{
  const model = { id: 'models-42', url: null, corners: [{x:0,z:0},{x:.3,z:0},{x:0,z:.2}] };
  let groups, move;
  const f = fixture({
    tool: 'objects', selected: null, modelImages: [model],
    onGroupChange: value => { groups = plain(value); },
    onMixedMove: (doc, ids, dx, dz) => { move = {doc, ids:plain(ids), dx, dz}; },
  });
  f.pointer('onPointerDown', 230, 95);
  f.pointer('onPointerUp', 60, 60);
  assert.equal(flatten(f.tree).filter(n => n.props?.['data-selection-outline'] === '').length, 2);
  assert(flatten(f.tree).some(n => n.props?.['data-selection-handle'] === 'move'));
  const groupAction = () => flatten(f.tree).find(n=>n.props?.label==='Create ThreeD Group');
  assert.equal(groupAction().props.disabled,false);
  groupAction().props.onClick();
  assert.deepEqual(groups[0].entityIds,['w0']);
  assert.deepEqual(groups[0].markerIds,[model.id]);
  f.update({groups,selectAllRequest:1});
  f.pointer('onPointerDown',130,80,{moveHandle:true});
  f.pointer('onPointerUp',175,125);
  assert.deepEqual(move.ids,[model.id]);
  assert.equal(move.dx,1);
  assert.equal(move.dz,1);
  assert.deepEqual(plain(move.doc.nodes),plain(room.nodes).map(n=>({...n,x:n.x+1,z:n.z+1})));
  assert.equal(f.calls.select.length,0);
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
for (const tool of ['select', 'floor', 'roof', 'door', 'window', 'cutout', 'skylight']) {
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
  f.pointer('onPointerDown', 350, 210, { altKey: true }); f.pointer('onPointerMove', 410, 230); f.pointer('onPointerUp', 410, 230);
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
for (const oneSided of [false, true]) {
  const f = fixture({document: document.newDesign(), selected: null, tool: 'roof'});
  f.click(125,125);
  f.click(215,125);
  f.pointer('onPointerMove',215,215);
  const toggle = flatten(f.tree).find(n=>n.type === 'input' && n.props.type === 'checkbox' && typeof n.props.checked === 'boolean' && n.props.checked === false && n.props.onChange);
  assert(toggle);
  toggle.props.onChange({target:{checked:oneSided}});
  f.flush();
  const kind = oneSided ? 'shed' : 'gable';
  assert.equal(f.preview.roofs[0].kind,kind);
  f.click(215,215);
  f.click(125,125);
  assert.equal(f.props.document.roofs[0].kind,kind);
  assert.equal(f.calls.commit.length,1);
}
// Drawing on a real host remains an ordinary placement, not a temporary pan candidate.
{
  const f = fixture({ tool: 'door' }); const center = f.world(1.524, 0);
  f.click(center.x, center.y, { entity: 'w0' });
  assert.equal(f.props.document.openings.length, 1); assert.equal(f.props.document.openings[0].wallId, 'w0');
  assert.equal(f.props.tool, 'select'); assert.equal(f.calls.complete.length, 1); assert.deepEqual(plain(f.props.planView), initialView);
}
// A primary wall drag on empty space or a preview draws one segment without moving the plan.
{
  const f = fixture({ tool: 'wall', document: document.newDesign(), selected: null });
  f.pointer('onPointerDown', 180, 180); f.pointer('onPointerMove', 220, 190, { entity: 'preview-entity' }); f.pointer('onPointerUp', 220, 190, { entity: 'preview-entity' });
  assert.deepEqual(plain(f.props.planView), initialView);
  assert.equal(f.calls.commit.length, 1);
  assert.equal(f.props.document.walls.length, 1);
  assert.equal(f.props.tool, 'wall');
  assert.equal(f.captures.size, 0);
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
{
  const named = {...room, version:9, floors:room.floors.map(f=>({...f,name:'Courtyard'}))};
  const f = fixture({document:named});
  const label = () => flatten(f.tree).some(n=>n.type==='text' && n.props.children==='Courtyard');
  for (const [action, expected] of [['Hide Object Labels',false],['Show Object Labels',true]]) {
    assert.equal(label(),!expected);
    flatten(f.tree).find(n=>n.type==='action' && n.props.label===action).props.onClick();
    f.flush();
    assert.equal(label(),expected);
  }
  assert.equal(f.calls.commit.length,0);
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
  assert.equal(navigation.formatPlanLength(.357,'metric'), '36 cm');
  assert.equal(navigation.formatPlanLength(.762,'imperial'), "2'6\"");
  assert.equal(navigation.formatPlanLength(.3048-.000001,'imperial'), "1'0\"");
  const f = fixture();
  assert.equal(flatten(f.tree).filter(node=>node.props?.['data-measurement']).length,0);
  flatten(f.tree).find(node=>node.type==='action'&&node.props.label==='Show Dimensions').props.onClick();f.flush();
  assert(flatten(f.tree).some(node => node.props?.['data-dimension-span'] === 'x'));
  const wallLabel=flatten(f.tree).find(node=>node.props?.['data-measurement']==='w0');assert.equal(wallLabel.props.children,"10'0\"");
  assert(flatten(f.tree).some(node=>node.props?.['data-measurement']==='floor'));
  const toggle=flatten(f.tree).find(node=>node.type==='action'&&node.props.label==='Hide Dimensions');assert.equal(toggle.props['aria-pressed'],true);toggle.props.onClick();f.flush();
  assert.equal(flatten(f.tree).filter(node=>node.props?.['data-measurement']).length,0);assert.equal(f.calls.commit.length,0);
  const metric=fixture({showMeasurements:true,measurementUnits:'metric'});assert.equal(flatten(metric.tree).find(node=>node.props?.['data-measurement']==='w0').props.children,'3 m');
}
console.log('PASS: measurement labels default hidden, actual toolbar toggle and active state, compact Imperial inches carry, Metric labels and no geometry/history mutations.');

{
  let chosen = 0;
  const f = fixture({ contextActions: [{label:'Structures',color:'text-emerald-700',actions:[{label:'Wall',icon:'wall-icon',active:true,run:()=>chosen++},{label:'Undo',icon:'undo-icon',disabled:true,run:()=>{throw Error('Disabled action');}}]}] });
  const items = () => flatten(f.tree).filter(node=>node.type==='ContextMenuItem');
  assert.deepEqual(items().map(node=>flatten(node).find(child=>child.type==='span')?.props.children), ['Wall','Undo','Hide Object Labels','Show Dimensions','Fit Plan','Zoom to Selection','Reset View']);
  assert(flatten(items()[0]).some(node=>node.type==='wall-icon'));
  assert(flatten(items()[0]).some(node=>node.props?.children==='Selected'));
  assert.equal(items()[1].props.disabled,true);
  items()[0].props.onSelect(); assert.equal(chosen,1);
  items().find(item=>flatten(item).some(n=>n.props?.children==='Show Dimensions')).props.onSelect();f.flush();assert(flatten(f.tree).some(node=>node.props?.['data-measurement']));
  f.pointer('onPointerDown',350,210,{button:2});assert.equal(f.captures.size,0);assert.equal(f.calls.commit.length,0);
  const content=flatten(f.tree).find(node=>node.type==='ContextMenuContent');let stopped=false;content.props.onKeyDown({stopPropagation(){stopped=true;}});assert(stopped,'Menu keyboard events must not reach drawing shortcuts.');
}
console.log('PASS: Design context menu named/icon actions, active/disabled state, shared callbacks, measurements, right-button guard and keyboard isolation. Radix DOM positioning/focus remains browser verification.');

{
  const doc = document.validateDesign({
    ...room,
    levels: [...room.levels, { id: 'upper', name: 'Upper', elevation: 3 }],
  });
  const editor = ts.createSourceFile('DesignEditor.tsx', fs.readFileSync('src/components/threed/design/DesignEditor.tsx', 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const declarations = editor.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'DesignEditor').body.statements;
  const levelHandlers = declarations.filter(node => ts.isFunctionDeclaration(node) && node.name?.text === 'chooseLevel'
    || ts.isVariableStatement(node) && node.declarationList.declarations.some(decl => decl.name.getText(editor) === 'toggleLevel'));
  const activeExpression = declarations.filter(ts.isVariableStatement).flatMap(node => Array.from(node.declarationList.declarations))
    .find(decl => decl.name.getText(editor) === 'activeLevelId').initializer.getText(editor);
  const { defaultDesignWorkspace, reconcileDesignLevels } = load(service + 'workspace-state.ts');
  let workspace = { ...defaultDesignWorkspace(), visibleLevelIds: ['ground'] };
  const normalize = patch => reconcileDesignLevels({ ...workspace, ...patch }, doc.levels);
  const restored = normalize({ levelId: 'upper', visibleLevelIds: ['ground', 'removed'] });
  assert.equal(restored.levelId, 'ground', 'Old workspaces with a hidden active Level fall back to a shown Level');
  assert.deepEqual(plain(restored.visibleLevelIds), ['ground']);
  const reorderedLevels = [...doc.levels, { id: 'basement', name: 'Basement', elevation: -3 }];
  assert.equal(reconcileDesignLevels({
    ...workspace,
    levelId: 'upper',
    visibleLevelIds: ['ground', 'basement'],
  }, reorderedLevels).levelId, 'basement', 'Fallback follows the displayed elevation order');
  assert.deepEqual(plain(normalize({ visibleLevelIds: [] }).visibleLevelIds), [], 'An explicitly empty view remains empty');
  const owner = {
    doc,
    get activeLevelId() { return f.props.activeLevelId; },
    get visibleLevelIds() { return f.props.visibleLevelIds; },
    changeWorkspace(patch) {
      workspace = normalize(patch);
      const view = {
        levelChoice: workspace.levelId,
        visibleLevelIds: workspace.visibleLevelIds,
        doc,
      };
      f.update({
        activeLevelId: vm.runInNewContext(activeExpression, view),
        visibleLevelIds: workspace.visibleLevelIds,
      });
    },
    cancel() { f.update({ cancelToken: f.props.cancelToken + 1 }); },
    setSelected: selected => f.update({ selected }),
    setTool: tool => f.update({ tool }),
    setMessage() {},
  };
  const handlers = vm.runInNewContext(compile(levelHandlers.map(node => node.getText(editor)).join('\n') + '\n;({ chooseLevel, toggleLevel })'), owner);
  const f = fixture({
    document: doc,
    visibleLevelIds: ['ground'],
    onChooseLevel: handlers.chooseLevel,
    onToggleLevel: handlers.toggleLevel,
  });
  const nav = () => flatten(f.tree).find(node => node.props?.['aria-label'] === 'Design levels');
  const button = label => {
    const item = flatten(nav()).find(node => node.type === 'button' && node.props['aria-label'] === label);
    assert(item, 'Expected a canvas Level button labelled ' + label);
    return item.props;
  };
  const name = level => button(`Set ${level} as active Level`);
  const eye = level => button(`Show ${level} in 2D and 3D`);
  const ground = doc.levels[0].name;
  const wallShown = () => flatten(f.tree).some(node => node.props?.['data-entity'] === 'w0');
  assert.equal(name(ground)['aria-current'], 'true');
  assert.equal(eye(ground)['aria-pressed'], true);
  assert.equal(eye('Upper')['aria-pressed'], false);
  assert(name('Upper').className.split(' ').includes('text-muted-foreground'), 'Hidden Level name uses the muted eye color');
  name('Upper').onClick();
  assert.equal(f.props.activeLevelId, 'upper', 'Choose the drawing Level directly from the canvas');
  assert.equal(name('Upper')['aria-current'], 'true');
  assert(!name(ground)['aria-current']);
  assert.equal(eye('Upper')['aria-pressed'], true, 'Activating a hidden Level reveals it');
  assert(!name('Upper').className.includes('text-muted-foreground'), 'Revealing a Level restores its name color');
  assert(wallShown(), 'Other visible Levels stay on');
  f.update({ tool: 'wall' });
  const beforeReselect = f.props.cancelToken;
  name('Upper').onClick();
  assert.equal(f.props.cancelToken, beforeReselect, 'Reselecting the active visible Level preserves the drawing tool and draft');
  assert.equal(f.props.tool, 'wall');
  f.click(290, 160);
  f.click(335, 160);
  assert.equal(f.calls.commit.length, 1);
  assert.equal(f.props.document.walls.at(-1).levelId, 'upper', 'A wall drawn after activation belongs to that Level');
  eye(ground).onClick();
  assert(!wallShown());
  eye(ground).onClick();
  assert(wallShown());
  assert.equal(f.props.activeLevelId, 'upper', 'Showing another Level preserves the current drawing Level');
  eye('Upper').onClick();
  assert.equal(f.props.activeLevelId, 'ground', 'Hiding the active Level transfers editing to a visible Level');
  assert.equal(name(ground)['aria-current'], 'true');
  assert.equal(eye(ground)['aria-pressed'], true);
  assert.equal(eye('Upper')['aria-pressed'], false);
  eye(ground).onClick();
  assert(!wallShown());
  assert.equal(eye(ground)['aria-pressed'], false);
  assert.equal(f.props.activeLevelId, '', 'Hiding all Levels leaves no drawing Level');
  assert(!name(ground)['aria-current'] && !name('Upper')['aria-current'], 'All hidden means no active label');
  const beforeHiddenDraw = f.calls.commit.length;
  f.update({ tool: 'wall' });
  f.click(290, 160);
  f.click(335, 160);
  assert.equal(f.calls.commit.length, beforeHiddenDraw, 'The all-hidden plan cannot add a Wall');
  eye(ground).onClick();
  assert.equal(f.props.activeLevelId, 'ground', 'Showing the first Level also activates it');
  assert.equal(eye(ground)['aria-pressed'], true);
  name('Upper').onClick();
  assert.equal(name('Upper')['aria-current'], 'true');
  assert.equal(eye('Upper')['aria-pressed'], true);
  eye(ground).onClick();
  assert.equal(eye(ground)['aria-pressed'], false);
  f.update({ tool: 'floor' });
  assert.equal(eye('Upper')['aria-pressed'], true);
  assert.equal(eye(ground)['aria-pressed'], false);
  f.update({ disabled: true });
  assert.equal(name(ground).disabled, true);
  assert(nav().props.className.includes('absolute') && nav().props.className.includes('left-9') && nav().props.className.includes('threed-scene-panel-surface'));
  for (const handler of ['onPointerDown', 'onWheel', 'onKeyDown']) {
    let stopped = false;
    nav().props[handler]({ stopPropagation() { stopped = true; } });
    assert(stopped, 'Level controls isolate canvas input: ' + handler);
  }
}
console.log('PASS: canvas Level activation, wall drawing destination, visible fallback after hiding and no active Level when all are hidden.');

// Exercise the wall face editor separately from the overhead plan.
{
  const slots = [];
  let cursor, tree, saved;
  const hooks = {
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
      return [slots[i], next => { slots[i] = typeof next === 'function' ? next(slots[i]) : next; }];
    },
    useRef(initial) { return slots[cursor++] ??= { current: initial }; },
  };
  const { WallCutoutEditor } = load('src/components/threed/design/WallCutoutEditor.tsx', {
    react: hooks,
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'lucide-react': { CircleMinus: 'icon' },
    '@/components/ui/button': { Button: 'button' },
    '@/components/ui/context-menu': {},
    '@/libraries/services/threed/design/document': document,
    '@/libraries/services/threed/design/plan-navigation': navigation,
  });
  const opening = { id: 'cut', kind: 'wall-cutout', wallId: 'w0', offset: 0, sill: 0, width: 1, height: 1,
    outline: [{x:0,z:0},{x:1,z:0},{x:1,z:1},{x:0,z:1}] };
  const doc = document.validateDesign({...room, version:8, openings:[opening]});
  function render() {
    cursor = 0;
    tree = WallCutoutEditor({ doc, wall:room.walls[0], opening, units:'metric', onFinish: next => { saved = next; } });
  }
  const svg = () => flatten(tree).find(n => n.type === 'svg');
  const displayed = () => flatten(tree).find(n => n.type === 'polygon' && n.props.fill === '#155e75').props.points.split(' ');
  function press(handle, inside = true) {
    svg().props.onPointerDown({ button:0, pointerId:1, currentTarget:{contains:()=>inside, focus(){}, setPointerCapture(){}},
      target:{closest:()=>handle} });
    svg().props.onPointerUp({pointerId:1});
    render();
  }
  render();
  const original = displayed();
  press(null);
  press(null, false);
  assert.deepEqual(displayed(),original,'Face and portaled menu clicks preserve the existing outline.');
  press({getAttribute:()=> '1',hasAttribute:()=>false});
  const remove = flatten(tree).find(n=>n.type==='button' && n.props.children.includes('Remove Point'));
  assert.equal(remove.props.disabled,false);
  remove.props.onClick();
  render();
  assert.deepEqual(displayed(),original.filter((_,i)=>i!==1),'Removal redraws the face through the surviving corners.');
  flatten(tree).find(n=>n.type==='button' && n.props.children==='Finish Cutout').props.onClick();
  assert.equal(saved.openings.length,1);
  assert.equal(saved.openings[0].id,opening.id);
  assert.equal(saved.openings[0].outline.length,3);
}
