// Offline: actual unit service, snapshot parser and editor; no database or browser server.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const cache = new Map();
function load(file, overrides = {}) {
  file = path.resolve(file);
  if (!Object.keys(overrides).length && cache.has(file)) return cache.get(file);
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, TextEncoder, require(name) {
    if (name in overrides) return overrides[name];
    if (name.startsWith('.') || name.startsWith('@/')) {
      let target = name.startsWith('@/') ? path.resolve('src', name.slice(2)) : path.resolve(path.dirname(file), name);
      if (!path.extname(target)) target += fs.existsSync(target + '.ts') ? '.ts' : '.tsx';
      return load(target);
    }
    return require(name);
  } }, { filename: file });
  if (!Object.keys(overrides).length) cache.set(file, module.exports);
  return module.exports;
}
const service = load('src/libraries/services/threed/characters/character-physics.ts');
const { resolveCharacterPhysics: runtime, convertCharacterPhysicsToMetres: convert, parseCharacterPhysicsSettings: parse } = service;
const plain = value => JSON.parse(JSON.stringify(value));
const near = (a, b) => assert.ok(Math.abs(a-b) < 1e-10, `${a} != ${b}`);
const defaults = runtime(undefined);
for (const metres of [1, .3048, .01]) {
  for (const values of [defaults, {mass: 2, walkSpeed: 4, runSpeed: 7, jumpSpeed: 6, clearance: .1}, ...['min', 'max'].map(bound => Object.fromEntries(Object.entries(service.CHARACTER_PHYSICS_FIELDS).map(([key, field]) => [key, field[bound]])))]) {
    const physical = convert(values, metres);
    const restored = parse(plain(physical), metres);
    for (const key of Object.keys(values)) near(runtime(restored)[key], values[key]);
    assert.deepEqual(plain(convert(restored, metres)), plain(restored), 'Conversion cannot compound');
    assert.equal(restored.values.mass, values.mass, 'Mass is not a length');
  }
}
const valid = convert(defaults, .3048);
for (const bad of [{...valid, version: 2}, {...valid, units:'feet'}, {...valid, metresPerSceneUnit: 0}, {...valid, values:{...valid.values, jumpSpeed:-1}}, {...valid, values:{...valid.values, clearance:NaN}}]) assert.throws(() => parse(bad));
assert.throws(() => parse(valid, 1), /calibration/);
assert.throws(() => convert(defaults, Infinity));
assert.throws(() => convert(defaults, Number.MAX_VALUE));
assert.throws(() => convert({units:'feet', values: defaults}, 1));
assert.deepEqual(plain(runtime({walkSpeed: 4})), {...plain(defaults), walkSpeed:4}, 'Legacy partial records retain default semantics');

const snapshot = load('src/libraries/services/threed/markers/project-marker-snapshot-core.ts');
const marker = {markerId:'characters-42', moduleType:'characters', assetId:42, name:'Test', position:{x:0,y:0,z:0}, positionSource:'asset', color:'green', icon:'person', label:'Test', isVisible:true, isActive:true, data:{isMovable:true, scaleMultiplier:1.25}, metadata:{unrelated:{retained:true}, characterPhysics:valid}};
const request = snapshot.parseProjectThreeDMarkerSnapshot([plain(marker)])[0];
request.metadata.characterPhysics = parse(request.metadata.characterPhysics, .3048);
const mockStored = plain(request); // mocked persistence boundary
const hydrated = snapshot.parseProjectThreeDMarkerSnapshot([mockStored])[0];
assert.deepEqual(plain(hydrated), plain(request));
near(runtime(hydrated.metadata.characterPhysics).walkSpeed, defaults.walkSpeed);

function editorHarness(initial) {
  const state = []; let cursor = 0; const calls = [];
  const react = {...require('react'), useEffect() {}, useState(initialValue) {
    const slot = cursor++;
    if (!(slot in state)) state[slot] = typeof initialValue === 'function' ? initialValue() : initialValue;
    return [state[slot], next => state[slot] = typeof next === 'function' ? next(state[slot]) : next];
  }};
  const ui = load('src/components/map/details/CharacterInstancePositionEditor.tsx', {
    react,
    './DetailsCardActions': {DetailsCardActions: 'actions'},
    './DetailsCardSection': {DetailsCardSection: 'section'},
  });
  const props = {markerId:42, initialPosition:{x:0,y:0,z:0}, movable:true, metersPerSceneUnit:.3048, initialPhysics:initial, disabled:false, updating:false, deleting:false, onSave: (...args) => calls.push(args), onDelete() {}};
  function render() { cursor = 0; return ui.CharacterInstancePositionEditor(props); }
  function nodes(value, out = []) {
    if (Array.isArray(value)) value.forEach(v=>nodes(v,out));
    else if (value?.props) {out.push(value); nodes(value.props.children,out);}
    return out;
  }
  return {props, calls, nodes: () => nodes(render()), render};
}
const h = editorHarness(undefined);
const convertButton = h.nodes().find(n => n.type === 'button' && n.props.children === 'Convert to physical units');
assert.equal(convertButton.props.disabled, false);
convertButton.props.onClick();
assert.ok(h.nodes().some(n => n.props.children === 'Physical units (metres and seconds)'));
const save = () => h.nodes().find(n => n.type === 'button' && Array.isArray(n.props.children) && n.props.children.includes('Save Character'));
save().props.onClick({stopPropagation(){}});
assert.equal(h.calls[0][1].characterPhysics.version, 1);
// A rejected Save leaves original props unchanged; the draft remains converted and dirty.
assert.ok(h.nodes().some(n => n.props.children === 'Unsaved changes'));
h.props.updating = true; assert.equal(save().props.disabled, true);
h.props.updating = false;
h.props.initialPhysics = plain(h.calls[0][1].characterPhysics);
assert.ok(h.nodes().some(n => n.props.children === 'Ready to save'));
assert.ok(editorHarness(undefined).nodes().some(n => n.props.children === 'Legacy Scene units'), 'Another instance starts with its own settings');
const future = editorHarness({...valid, version: 2});
assert.equal(future.nodes().find(n => n.type === 'button' && n.props.children === 'Convert to physical units').props.disabled, true, 'Unknown versions cannot be overwritten with defaults');
console.log('PASS: legacy compatibility, physical conversion, bounds, calibration rejection, snapshot round-trip, metadata preservation, editor conversion/Save/failure/busy/instance isolation.');
