// Actual preview callbacks/UI with real Three.js cameras and offline React doubles.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { PerspectiveCamera, Vector3, Group } = require('three');
const file = 'src/components/admin/threed/models/ThreeDModelAssetPreview.tsx';
const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const functions = ['PreviewModel', 'MaterialSlotRow', 'ThreeDModelAssetPreview'].map(name => {
  const declaration = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === name);
  assert(declaration, `Missing actual preview component ${name}`);
  return declaration.getText(source);
}).join('\n');
const compiled = ts.transpileModule(functions, { compilerOptions: {
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
} }).outputText;
const jsx = (type, props, key) => ({ type, props, key });
const nodes = value => Array.isArray(value) ? value.flatMap(nodes) : value && typeof value === 'object'
  ? [value, ...nodes(value.props?.children)] : [];
const text = value => Array.isArray(value) ? value.map(text).join(' ') : value && typeof value === 'object'
  ? text(value.props?.children) : String(value ?? '');

const editor = ts.createSourceFile('editor.tsx', fs.readFileSync('src/components/admin/threed/models/ThreeDModelFileEditor.tsx', 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const view = editor.statements.find(node => ts.isVariableStatement(node)
  && node.declarationList.declarations.some(declaration => declaration.name.getText(editor) === 'FILE_PREVIEW_PERSPECTIVE'));
assert(view, 'File editor supplies a stable center-relative initial perspective');
const defaultView = vm.runInNewContext(ts.transpileModule(`${view.getText(editor)}\nFILE_PREVIEW_PERSPECTIVE;`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText);

function cameraFixture(center, perspective = defaultView, centerAtOrigin = false) {
  const refs = [], effects = [], frames = new Map();
  let refCursor = 0, effectCursor = 0, frameId = 0, distance = 150;
  let refreshed = 0, fitted = 0, ready = 0, invalidated = 0;
  const camera = new PerspectiveCamera(45, 1.2, 0.1, 1000);
  camera.position.set(4, 3, 6); // Deliberately below the tall-model center.
  const controls = { target: new Vector3(), update() {} };
  const group = new Group();
  const bounds = {
    refresh() { refreshed++; return bounds; }, clip() { return bounds; },
    getSize() { return { center: center.clone().add(group.position), distance }; }, fit() { fitted++; return bounds; },
  };
  const context = vm.createContext({
    exports: {}, Vector3, ModelMarker3D: 'marker',
    require(name) { assert.equal(name, 'react/jsx-runtime'); return { jsx, jsxs: jsx }; },
    useBounds: () => bounds,
    useThree: selector => selector({ get: () => ({ camera, controls, invalidate: () => { invalidated++; } }) }),
    useRef(initial) { return refs[refCursor++] ??= { current: initial }; },
    useCallback: callback => callback,
    useEffect(setup, deps) {
      const index = effectCursor++, previous = effects[index];
      if (!previous || !deps.every((value, i) => Object.is(value, previous.deps[i]))) {
        previous?.cleanup?.(); effects[index] = { deps, cleanup: setup() };
      }
    },
    requestAnimationFrame(callback) { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame(id) { frames.delete(id); },
  });
  vm.runInContext(compiled, context);
  const component = vm.runInContext('PreviewModel', context);
  function render(revision = 0, preserve = true, resetRevision = 0) {
    refCursor = effectCursor = 0;
    const tree = component({ model: { id: 7, modelType: 'fbx', filePath: 'offline.fbx' }, preserveCameraOnEdit: preserve,
      fitRevision: revision, resetRevision, centerAtOrigin, perspective, onSettled() {}, onCameraReady() { ready++; } });
    nodes(tree).find(node => node.props?.ref && node.type === 'group').props.ref.current = group;
    return nodes(tree).find(node => node.type === 'marker').props.onCollisionBoundsChange;
  }
  return {
    camera, controls, frames, render, group,
    flush() { for (const [id, callback] of [...frames]) { frames.delete(id); callback(); } },
    stats() { return { refreshed, fitted, ready, invalidated }; },
    unmount() { effects.forEach(effect => effect.cleanup?.()); },
  };
}
const close = (a, b) => assert(a.distanceTo(b) < 1e-8, `Vectors differ: ${a.toArray()} / ${b.toArray()}`);

for (const center of [new Vector3(0, 90, 0), new Vector3(500, 1200, -600), new Vector3(-300, -70, 200)]) {
  const fixture = cameraFixture(center);
  const report = fixture.render();
  report(null); assert.equal(fixture.frames.size, 0);
  report({}); report({}); assert.equal(fixture.frames.size, 1, 'Repeated measurements coalesce into one current fit');
  fixture.flush();
  const offset = fixture.camera.position.clone().sub(center);
  assert(offset.y > 0 && offset.x > 0 && offset.z > 0, 'Three-quarter view stays above/in front regardless of world center');
  assert(Math.abs(offset.length() - 150) < 1e-8);
  close(fixture.controls.target, center);
  close(fixture.camera.getWorldDirection(new Vector3()), center.clone().sub(fixture.camera.position).normalize());
  assert.equal(fixture.stats().fitted, 0, 'Explicit perspective avoids the absolute-position Bounds.fit path');
  assert.equal(fixture.stats().ready, 1);
  fixture.camera.position.set(-10, -20, -30); const orbited = fixture.camera.position.clone();
  fixture.render()({}); fixture.flush(); close(fixture.camera.position, orbited);
  assert.equal(fixture.stats().ready, 1, 'Material/bounds refresh does not reset an already reviewed camera');
  fixture.render(1); fixture.flush(); assert.equal(fixture.stats().fitted, 1, 'Manual Fit remains available');
  fixture.unmount();
  const reset = cameraFixture(center); reset.render()({}); reset.flush();
  assert(reset.camera.position.y > center.y, 'Reset/remount restores the initial above-center view'); reset.unmount();
}
const cancelled = cameraFixture(new Vector3(0, 50, 0));

for (const center of [new Vector3(0, 90, 0), new Vector3(500, 1200, -600)]) {
  const centered = cameraFixture(center, defaultView, true);
  centered.group.scale.setScalar(0.37);
  centered.render()({}); centered.flush();
  close(centered.controls.target, new Vector3());
  close(centered.group.position, center.clone().negate());
  const initialCamera = centered.camera.position.clone();
  centered.camera.position.set(-20, 8, 15);
  const orbited = centered.camera.position.clone();
  center.y += 25; // A changed draft scale/offset moves the loaded center.
  centered.render()({}); centered.flush();
  close(centered.camera.position, orbited);
  close(centered.group.position, center.clone().negate());
  centered.controls.target.set(6, 7, 8);
  centered.render(0, true, 1); centered.flush();
  close(centered.camera.position, initialCamera);
  close(centered.controls.target, new Vector3());
  close(centered.group.scale, new Vector3(0.37, 0.37, 0.37));
  close(centered.group.position, center.clone().negate());
  centered.render(1, true, 1); centered.flush();
  const fitsBeforeReset = centered.stats().fitted;
  centered.camera.position.set(12, -20, 100);
  centered.render(1, true, 2); centered.flush();
  close(centered.camera.position, initialCamera);
  assert.equal(centered.stats().fitted, fitsBeforeReset, 'Reset after Fit must not be overwritten by the animated Fit effect');
  centered.unmount();
}
cancelled.render()({}); assert.equal(cancelled.frames.size, 1);
cancelled.unmount(); cancelled.flush(); assert.equal(cancelled.stats().refreshed, 0, 'Departed preview must not touch the old camera/bounds');
const reviewed = { direction: [-2, -1, 6], distanceScale: 1.6 };
const capture = cameraFixture(new Vector3(10, 300, -40), reviewed);
capture.render(0, false)({}); capture.flush();
assert(capture.camera.position.y < 300, 'Explicit reviewed capture perspectives are not clamped by the File editor default');
assert(Math.abs(capture.camera.position.distanceTo(capture.controls.target) - 240) < 1e-8);
capture.unmount();

// Read-only File inspection and editable parent appearance use the actual UI.
const inventory = { materialSlotCount: 1, omittedSlotCount: 0, slots: [{ id: 'mesh:0', materialName: 'lambert2', slotIndex: 0,
  meshPath: 'Character', materialType: 'MeshLambertMaterial', textures: [{ property: 'map', ready: true, label: 'Base Color', source: 'https://fixture.invalid/texture.png' }] }] };
const states = [];
let stateCursor = 0;
const uiContext = vm.createContext({
  exports: {}, Vector3, modelPreviewEvents() {}, Canvas: 'canvas', Bounds: 'bounds', OrbitControls: 'orbit', Grid: 'grid', Suspense: 'suspense',
  Button: 'button', Box: 'icon', Check: 'icon', ImageOff: 'icon', Loader2: 'icon', Palette: 'icon', RotateCcw: 'icon', Upload: 'icon',
  require(name) { assert.equal(name, 'react/jsx-runtime'); return { jsx, jsxs: jsx }; },
  readThreeDModelMaterialOverrides: () => ({ assignments: [] }),
  useId: () => 'preview-id', useRef: initial => ({ current: initial }), useCallback: callback => callback, useEffect() {},
  useState(initial) {
    const index = stateCursor++;
    if (!(index in states)) states[index] = index === 6 ? inventory : index === 7 ? 'mesh:0' : initial;
    return [states[index], next => { states[index] = typeof next === 'function' ? next(states[index]) : next; }];
  },
});
vm.runInContext(compiled, uiContext);
const renderPreview = vm.runInContext('ThreeDModelAssetPreview', uiContext);
const model = { id: 7, modelType: 'fbx', filePath: 'offline.fbx', files: [], materialAssignments: [{ channel: 'baseColor', targetKey: 'mesh:0' }] };
function ui(readOnly) {
  stateCursor = 0;
  return renderPreview({ model, materialInspectorReadOnly: readOnly, showMaterialInspector: true, attachedDependencyCount: 0, dependencyCount: 0,
    preserveCameraOnEdit: true, perspective: defaultView,
    textureLibrary: [{ id: 4, textureName: 'Texture', fileName: 'texture.png', filePath: 'https://fixture.invalid/texture.png', assignmentCount: 1 }],
    onSaveMaterialAssignment() { throw new Error('Inspection must not save an assignment'); } });
}
let tree = ui(true);
assert(text(tree).includes('Saved appearance'));
assert(nodes(tree).some(node => node.type === 'a' && node.props.href === '/admin/threed/models/7?tab=files'));
assert(!nodes(tree).some(node => node.type === 'select' || node.type === 'input' && node.props.type === 'file'), 'Read-only page has no misleading Texture editing controls');
nodes(tree).find(node => node.type?.name === 'MaterialSlotRow').props.onSelect();
assert.equal(states[8], null, 'Inspecting a slot does not apply a temporary Texture override');
const oldCanvasKey = nodes(tree).find(node => node.type === 'canvas').key;
nodes(tree).find(node => node.type === 'button' && node.props['aria-label'] === 'Reset View').props.onClick();
tree = ui(true);
assert.equal(states[4], 1, 'Reset increments only the preview reset key');
assert.equal(nodes(tree).find(node => node.type === 'canvas').key, oldCanvasKey, 'Reset retains Canvas and loaded geometry/scale');
assert.equal(nodes(tree).find(node => node.type?.name === 'PreviewModel').props.resetRevision, 1);
assert.equal(model.filePath, 'offline.fbx');
tree = ui(false);
assert(nodes(tree).some(node => node.type === 'select' && node.props.id === 'model-appearance-texture'), 'Editable Model appearance keeps its existing selector');
assert(text(tree).includes('Save Texture to all materials'));
assert(text(tree).includes('Test Base Color file'));
console.log('PASS File preview: actual center-relative fit, preserved orbit, manual Fit, Reset, capture perspective and cancelled callbacks.');
console.log('PASS saved appearance inspection: no unsavable Texture workflow; parent editing controls remain available.');
