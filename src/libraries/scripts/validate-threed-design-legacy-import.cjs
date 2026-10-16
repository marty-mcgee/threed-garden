// Offline legacy portability regression: synthetic Paper records only; no asset, HTTP or database access.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = 'src/libraries/services/threed/design/';
const cache = new Map();
const json = value => JSON.parse(JSON.stringify(value));
function load(file, dependencies) {
  if (!dependencies && cache.has(file)) return cache.get(file);
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { exports, Error, TextEncoder, console, require(name) {
    if (dependencies && name in dependencies) return dependencies[name];
    assert(name.startsWith('.'), `Unexpected dependency: ${name}`);
    return load(path.join(path.dirname(file), name) + '.ts');
  } }, { filename: file });
  if (!dependencies) cache.set(file, exports);
  return exports;
}
const document = load(root + 'document.ts');
const architecture = load(root + 'project-architecture.ts');
const { parseDesignImport } = load(root + 'design-import.ts');
const point = (doc, id) => doc.nodes.find(node => node.id === id);
const near = (actual, expected, message) => assert(Math.abs(actual - expected) < 1e-6, message || `${actual} != ${expected}`);
function paper(type, id, segments, data = {}, options = {}) {
  return { id, [type + 'Path']: ['Path', { applyMatrix: true, data: {
    id, type: type === 'floor' ? 'floor' : type + 'Path', level: '0', ...data,
  }, segments, ...(type === 'floor' ? { closed: true } : {}), ...options }] };
}
function fixture() {
  return {
    levels: { 0: { id: 0, height: 0 }, 1: { id: 1, height: '300' } },
    walls: {
      1: paper('wall', 1, [[100, 200], [400, 200]], { height: [250, 250], thickness: '20' }),
      2: paper('wall', 2, [[400, 200], [400, 500]], { height: ['250', '250'], thickness: 20 }),
      3: paper('wall', 3, [[100, 200], [400, 200]], { height: [250, 250], thickness: 20, level: '1' }),
    },
    floors: {
      1: paper('floor', 1, [[100, 200], [400, 200], [400, 500], [100, 500]], { thickness: 20 }),
    },
    roofs: {
      1: paper('roof', 1, [[100, 200], [400, 200]], {
        width: 200, rise: 100, startHeight: 250, thickness: 10, level: '1',
        join0: { id: null, seg: null }, join1: { id: null, seg: null },
      }),
    },
    threed: {}, dimensions: {}, texts: {}, verticalGuides: {}, horizontalGuides: {},
  };
}
const input = fixture(), original = JSON.stringify(input);
const converted = parseDesignImport(original, 'legacy-room.threed');
assert.equal(converted.source, 'legacy');
const doc = converted.document;
assert.equal(doc.version, 5); assert.equal(doc.units, 'metres');
assert.equal(doc.levels.length, 2); assert.equal(doc.walls.length, 3); assert.equal(doc.floors.length, 1); assert.equal(doc.roofs.length, 1);
assert.deepEqual(json(document.validateDesign(doc)), json(doc));
assert.equal(JSON.stringify(input), original, 'Conversion must not mutate the supplied portability data.');
const ground = doc.levels.find(level => level.elevation === 0), upper = doc.levels.find(level => level.elevation === 3);
assert(ground && upper, 'Level elevation must convert centimetres to metres.');
const groundWalls = doc.walls.filter(wall => wall.levelId === ground.id);
const horizontal = groundWalls.find(wall => point(doc, wall.start).z === point(doc, wall.end).z);
const vertical = groundWalls.find(wall => point(doc, wall.start).x === point(doc, wall.end).x);
assert(horizontal && vertical);
assert.equal(point(doc, horizontal.start).x, 1); assert.equal(point(doc, horizontal.start).z, 2);
assert.equal(point(doc, horizontal.end).x, 4); assert.equal(point(doc, horizontal.end).z, 2);
near(horizontal.height, 2.5); near(horizontal.thickness, .2); near(horizontal.elevation, 0);
assert.equal(horizontal.end, vertical.start, 'Exact same-level shared endpoints remain editable shared nodes.');
assert(doc.floors[0].vertices.includes(horizontal.start)); assert(doc.floors[0].vertices.includes(horizontal.end));
const upperWall = doc.walls.find(wall => wall.levelId === upper.id);
assert.notEqual(upperWall.start, horizontal.start, 'Coincident corners on different levels must remain separate.');
near(document.entityElevation(doc, upperWall), 3);
near(doc.floors[0].thickness, .2); near(doc.floors[0].elevation, .2, 'Legacy floor upper surface sits one thickness above its level.');
const roof = doc.roofs[0], profile = document.roofProfile(roof.vertices.map(id => point(doc, id)), roof);
assert.equal(roof.kind, 'shed'); near(roof.pitch, 6); near(roof.direction, 0); near(roof.thickness, .1); near(roof.elevation, 2.5);
near(profile.rise, 1); near(profile.height({ x: 1, z: 1 }), 0); near(profile.height({ x: 1, z: 3 }), 1);
near(document.entityElevation(doc, roof), 5.5);
const missingFloorThickness = fixture(); delete missingFloorThickness.floors[1].floorPath[1].data.thickness;
near(parseDesignImport(JSON.stringify(missingFloorThickness)).document.floors[0].thickness, .25);

function omitted(family, id, entity, message) {
  const legacy = fixture(); legacy[family][id] = entity;
  const result = parseDesignImport(JSON.stringify(legacy));
  assert.equal(result.document[family].length, fixture()[family] && Object.keys(fixture()[family]).length, message);
  assert(result.warnings.some(warning => warning.includes(String(id))), `Omission must identify legacy record ${id}.`);
  assert.deepEqual(json(result.document.nodes), json(doc.nodes), 'Rejected records cannot leave orphan corner nodes.');
}
const slopedInput = fixture();
slopedInput.walls[71] = paper('wall', 71, [[800, 0], [1000, 0]], { height: [0, 350], thickness: 20 });
const slopedImport = parseDesignImport(JSON.stringify(slopedInput));
assert.equal(slopedImport.document.version, 6);
const slopedWall = slopedImport.document.walls.find(wall => wall.id === 'legacy-wall-71');
assert.equal(slopedWall.height, 0); assert.equal(slopedWall.endHeight, 3.5);
assert.equal(slopedImport.document.walls.length, 4, 'Sloped walls remain editable, with endpoint identity and centimetre conversion.');
omitted('walls', 72, paper('wall', 72, [[800, 0], [800, 0]], { height: [250, 250], thickness: 20 }), 'Degenerate walls must be omitted.');
omitted('walls', 73, paper('wall', 73, [[[800, 0], [0, 0], [20, 20]], [1000, 0]], { height: [250, 250], thickness: 20 }), 'Curved Paper segments cannot silently become straight walls.');
omitted('walls', 74, paper('wall', 74, [[800, 0], [1000, 0]], { height: [250, 250], thickness: 20 }, { matrix: [1, 0, 0, 1, 20, 0] }), 'Unapplied transforms cannot change coordinates silently.');
omitted('walls', 75, paper('wall', 75, [[800, 0], [1000, 0]], { height: [250, 250], thickness: 20, level: 'missing' }), 'Missing level references must not be moved to Ground.');
omitted('floors', 76, paper('floor', 76, [[800, 0], [1000, 0]], { thickness: 25 }), 'Two-vertex floors must be omitted.');
omitted('floors', 77, paper('floor', 77, [[800, 0], [1000, 0], [1000, 200], [800, 200]], { thickness: 25 }, { closed: false }), 'Open floors cannot silently become closed polygons.');
omitted('roofs', 78, paper('roof', 78, [[800, 0], [1000, 0]], { width: 200, rise: 100, startHeight: 250, thickness: 10, join0: { id: 1, seg: 1 } }), 'Joined legacy roofs require unsupported join geometry.');
const extras = fixture();
extras.threed[41] = { id: 41, name: 'frontDoor', position: { x: 0, y: 0, z: 0 } };
extras.dimensions[42] = { id: 42 }; extras.texts[43] = { id: 43 }; extras.verticalGuides[44] = { id: 44 };
const partial = parseDesignImport(JSON.stringify(extras), 'legacy-room.threed');
assert(partial.warnings.length > 0, 'Unsupported catalog models, annotations and guides must be reported.');
assert.equal(partial.document.openings.length, 0, 'A catalog object named frontDoor must not be guessed into a hosted opening.');
assert.equal(partial.document.roofOpenings.length, 0);
assert.deepEqual(json(partial.document), json(doc));

const native = parseDesignImport(JSON.stringify(doc));
assert.equal(native.source, 'native'); assert.equal(native.warnings.length, 0); assert.deepEqual(json(native.document), json(doc));
for (const bad of [{ ...doc, projectId: 15 }, { ...doc, version: 99 }, { ...fixture(), projectId: 15 }, { ...fixture(), ownerId: 'other-user' }]) {
  assert.throws(() => parseDesignImport(JSON.stringify(bad)), 'Unknown native or legacy top-level fields must not grant import authority.');
}
assert.throws(() => parseDesignImport('{}'));
assert.throws(() => parseDesignImport('{'));
assert.throws(() => parseDesignImport(' '.repeat(1_048_577)), /MiB|large|limit|size/i);

// Conversion feeds the established fresh-ID architecture importer and Project hydration boundary.
let sequence = 0;
const current = document.validateDesign({ ...document.newDesign(), name: 'Current Project architecture' });
const before = JSON.stringify(current), incomingIds = new Set([doc.levels, doc.nodes, doc.walls, doc.floors, doc.roofs].flat().map(entity => entity.id));
for (const mode of ['merge', 'replace']) {
  const imported = architecture.importProjectArchitecture(current, doc, mode, () => 'imported-' + ++sequence);
  assert.equal(JSON.stringify(current), before); assert.deepEqual(json(doc), json(native.document));
  assert.equal(imported.walls.length, doc.walls.length); assert.equal(imported.floors.length, doc.floors.length); assert.equal(imported.roofs.length, doc.roofs.length);
  assert.equal(imported.levels.length, doc.levels.length + (mode === 'merge' ? 1 : 0));
  for (const entity of [imported.nodes, imported.walls, imported.floors, imported.roofs].flat()) assert(!incomingIds.has(entity.id), 'Portable IDs must be reallocated before entering a Project.');
  const envelope = architecture.parseProjectArchitecture({ version: 1, document: imported });
  const savedConfig = { keep: { privateSetting: true }, threeDArchitecture: envelope };
  const restored = architecture.projectArchitectureDraft(architecture.readProjectArchitecture(json(savedConfig)));
  assert.deepEqual(json(restored.history.present), json(imported)); assert(!architecture.architectureIsDirty(restored));
  assert.deepEqual(savedConfig.keep, { privateSetting: true });
}
console.log('PASS: Legacy Paper import converts centimetres, level ownership, shared corners, floors and shed roofs; reports unsupported records, rejects malformed/oversized envelopes and preserves native strict parsing/fresh-ID Project architecture hydration. No database access.');

// Run the actual editor import callback: a merge must reveal an incoming level, not the old empty Ground.
const editorPath = 'src/components/threed/design/DesignEditor.tsx';
const editorAst = ts.createSourceFile(editorPath, fs.readFileSync(editorPath, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let editorImportSource;
function findEditorImport(node) {
  if (ts.isFunctionDeclaration(node) && node.name?.text === 'importFile') editorImportSource = node.getText(editorAst);
  ts.forEachChild(node, findEditorImport);
}
findEditorImport(editorAst); assert(editorImportSource, 'The actual editor import callback must be exercised.');
const history = load(root + 'history.ts');
for (const existing of [document.newDesign(), { ...doc, name: 'Previously drawn room' }]) {
  for (const mode of ['merge', 'replace']) {
    for (const incoming of [converted.document, native.document]) {
      const originalExisting = JSON.stringify(existing), originalIncoming = JSON.stringify(incoming);
      const state = { history: history.designHistory(existing), level: null, cancelled: false, selected: 'old-wall', tool: 'wall', error: 'old error', message: '' };
      const context = {
        doc: existing, importProjectArchitecture: architecture.importProjectArchitecture,
        crypto: { randomUUID: () => 'callback-import-' + ++sequence },
        cancel() { state.cancelled = true; },
        commit(next) { state.history = history.commitDesign(state.history, next); },
        setLevelChoice(value) { state.level = value; }, setSelected(value) { state.selected = value; },
        setTool(value) { state.tool = value; }, setError(value) { state.error = value; }, setMessage(value) { state.message = value; },
      };
      const callback = vm.runInNewContext(ts.transpileModule(editorImportSource + '\nimportFile;', {
        compilerOptions: { target: ts.ScriptTarget.ES2022 },
      }).outputText, context);
      callback(incoming, mode);
      const result = state.history.present;
      const firstIncoming = result.levels[mode === 'merge' ? existing.levels.length : 0];
      assert.equal(state.level, firstIncoming.id, 'Import must activate the first imported level in both merge and replacement modes.');
      assert(result.walls.some(wall => wall.levelId === state.level), 'The imported room must be visible on the active level.');
      assert(!existing.levels.some(level => level.id === state.level), 'Imported active levels use fresh IDs.');
      assert(state.cancelled); assert.equal(state.selected, null); assert.equal(state.tool, 'select'); assert.equal(state.error, '');
      assert.match(state.message, /Save Project/);
      assert.equal(state.history.past.length, 1, 'A completed import is one Undo transaction.');
      assert.equal(JSON.stringify(history.undoDesign(state.history).present), JSON.stringify(document.validateDesign(existing)));
      assert.equal(JSON.stringify(existing), originalExisting); assert.equal(JSON.stringify(incoming), originalIncoming);
      const draft = architecture.projectArchitectureDraft({ version: 1, document: existing });
      assert(architecture.architectureIsDirty({ ...draft, history: state.history }), 'Imported architecture must remain unsaved until Project Save.');
      assert.equal(result.walls.length, incoming.walls.length + (mode === 'merge' ? existing.walls.length : 0));
    }
  }
}
console.log('PASS: Actual editor import callback selects the incoming level for native/legacy merge and replace into blank or populated architecture, retains source data, and commits one dirty/undoable edit.');

// Execute the real staged import dialog with stateful React hooks and mocked Project writes.
const jsx = (type, props) => ({ type, props });
const flatten = tree => !tree || typeof tree !== 'object' ? [] : [tree, ...[tree.props?.children].flat(Infinity).flatMap(flatten)];
function dialogHarness() {
  const slots = [], effects = [], calls = [];
  let cursor = 0, open = true, rejectImport = false;
  const react = {
    useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }]; },
    useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial }; },
    useEffect(callback, dependencies) {
      const index = cursor++, prior = slots[index];
      if (!prior || dependencies.some((value, i) => value !== prior.dependencies[i])) {
        slots[index] = { dependencies, cleanup: prior?.cleanup };
        effects.push(() => { slots[index].cleanup?.(); slots[index].cleanup = callback(); });
      }
    },
  };
  const module = load('src/components/threed/design/DesignImportDialog.tsx', {
    react, 'react/jsx-runtime': { jsx, jsxs: jsx },
    '@/components/ui/dialog': { Dialog: 'dialog', DialogContent: 'dialog-content', DialogHeader: 'dialog-header', DialogTitle: 'dialog-title', DialogDescription: 'description', DialogFooter: 'dialog-footer' },
    '@/components/ui/button': { Button: 'button' }, '@/components/ui/input': { Input: 'input' },
    '@/libraries/services/threed/design/design-import': { parseDesignImport },
  });
  function render() {
    cursor = 0;
    const tree = module.DesignImportDialog({ open, onOpenChange(value) { open = value; }, onImport(incoming, mode) {
      if (rejectImport) throw new Error('Mock Project import failure');
      calls.push({ document: incoming, mode });
    } });
    if (effects.length) { effects.splice(0).forEach(effect => effect()); return render(); }
    return flatten(tree);
  }
  return {
    calls, render, isOpen: () => open,
    setOpen(value) { open = value; render(); },
    reject(value) { rejectImport = value; },
    choose(file) { render().find(item => item.props['aria-label'] === 'Import design JSON').props.onChange({ target: { files: file ? [file] : [] } }); },
    button(label) { return render().find(item => item.type === 'button' && item.props.children === label); },
  };
}
const file = (text, name = 'plan.json') => ({ name, size: Buffer.byteLength(text), text: async () => text });
async function settle() { for (let i = 0; i < 8; i++) await Promise.resolve(); }
async function checkDialog() {
  const harness = dialogHarness();
  assert(harness.button('Import').props.disabled);
  harness.choose(file(JSON.stringify(extras), 'legacy.threed')); await settle();
  assert.equal(harness.calls.length, 0, 'Reading and conversion cannot modify the Project.');
  assert(harness.button('Import').props.disabled, 'Omissions require explicit acknowledgement.');
  harness.button('Import').props.onClick(); assert.equal(harness.calls.length, 0);
  const checkbox = harness.render().find(item => item.props['aria-label'] === 'Import supported architecture only');
  assert(checkbox && !checkbox.props.checked);
  checkbox.props.onChange({ target: { checked: true } });
  assert(!harness.button('Import').props.disabled);
  harness.render().find(item => item.props['aria-label'] === 'JSON import behavior').props.onChange({ target: { value: 'replace' } });
  harness.button('Cancel').props.onClick(); harness.render();
  assert.equal(harness.calls.length, 0, 'Cancel after review leaves current architecture unchanged.');
  harness.setOpen(true);
  assert(harness.button('Import').props.disabled, 'Reopening cannot retain the cancelled file.');

  harness.choose(file(JSON.stringify(extras))); await settle();
  assert(!harness.render().find(item => item.props['aria-label'] === 'Import supported architecture only').props.checked);
  harness.choose(file(JSON.stringify(doc))); await settle();
  assert(!harness.render().some(item => item.props['aria-label'] === 'Import supported architecture only'), 'Native documents do not need an omission acknowledgement.');
  assert(!harness.button('Import').props.disabled);
  harness.reject(true); harness.button('Import').props.onClick();
  assert(harness.render().some(item => item.props.role === 'alert' && item.props.children === 'Mock Project import failure'));
  assert(harness.isOpen()); assert.equal(harness.calls.length, 0);
  harness.reject(false); harness.button('Import').props.onClick(); harness.render();
  assert.equal(harness.calls.length, 1); assert.equal(harness.calls[0].mode, 'replace');
  assert.deepEqual(json(harness.calls[0].document), json(doc)); assert(!harness.isOpen());

  harness.setOpen(true); harness.choose(file('{bad')); await settle();
  assert(harness.render().some(item => item.props.role === 'alert'));
  assert(harness.button('Import').props.disabled); assert.equal(harness.calls.length, 1);
  harness.choose({ name: 'too-large.json', size: 1_048_577, text() { throw new Error('Oversized files must not be read.'); } }); await settle();
  assert(harness.render().some(item => item.props.role === 'alert' && /1 MiB/.test(item.props.children)));

  let resolveOld;
  harness.choose({ name: 'old.threed', size: 100, text: () => new Promise(resolve => { resolveOld = resolve; }) });
  assert(harness.button('Import').props.disabled);
  harness.choose(file(JSON.stringify(doc))); await settle();
  resolveOld(JSON.stringify(extras)); await settle();
  assert(!harness.render().some(item => item.props['aria-label'] === 'Import supported architecture only'), 'A stale file read cannot replace the newest native preview.');
  assert(!harness.button('Import').props.disabled);

  let resolveCancelled;
  harness.choose({ name: 'cancelled.threed', size: 100, text: () => new Promise(resolve => { resolveCancelled = resolve; }) });
  harness.button('Cancel').props.onClick(); harness.render();
  resolveCancelled(JSON.stringify(extras)); await settle(); harness.setOpen(true);
  assert(harness.button('Import').props.disabled, 'Late reads from a closed dialog cannot restore a cancelled preview.');
  assert.equal(harness.calls.length, 1);
  console.log('PASS: Actual Design import dialog stages native/legacy files, requires omission acknowledgement, preserves Cancel/invalid/failure boundaries and ignores stale reads. Project callback is mocked.');
}
checkDialog().catch(error => { console.error(error); process.exitCode = 1; });
