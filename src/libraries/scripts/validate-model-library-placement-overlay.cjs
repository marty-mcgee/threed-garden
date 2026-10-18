const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const exportsObject = {};
const jsx = (type, props) => ({ type, props: props || {} });
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/map/panels/ThreeDModelLibraryPanel.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText, { exports: exportsObject, require(name) {
  if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'fragment' };
  if (name === 'react-dom') return { createPortal: (content, host) => jsx('portal', { content, host }) };
  return new Proxy({}, { get: (_, key) => key });
} });
function nodes(node) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(nodes);
  return [node, ...nodes(node.props?.children)];
}
const model = { id: 1, modelName: 'Table', modelType: 'obj', categories: [], libraryReadiness: { status: 'ready', primaryFileAvailable: true, issues: [] } };
let placed, inspected;
const props = { isOpen: true, projectModules: [], collections: [], search: '', visibleModels: [model], inspectedModel: model, inspectedModelId: 1,
  selectedModuleId: 2, placementScaleMultiplier: '1', placementDraft: { x: '0', y: '0', z: '0', rotationY: '0' },
  onPlaceAtCoordinates: value => placed = value, onInspectModel: value => inspected = value };
for (const dockHost of [null, {}]) {
  const root = exportsObject.ThreeDModelLibraryPanel({ ...props, dockHost });
  const [librarySurface, overlay] = root.props.children;
  const library = dockHost ? librarySurface.props.content : librarySurface;
  assert.equal(overlay.type, 'section');
  assert.equal(overlay.props['aria-label'], 'Place Asset in Project from Library');
  assert.ok(!nodes(library).some(n => n.props.children === 'Place at Coordinates'));
  const button = nodes(overlay).find(n => n.props.children === 'Place at Coordinates');
  assert.equal(button.props.disabled, false); button.props.onClick(); assert.equal(placed, model);
  nodes(library).find(n => n.props['aria-label'] === 'Inspect Table').props.onClick(); assert.equal(inspected, 1);
  assert.equal(nodes(overlay).filter(n => n.type === 'ThreeDModelLibraryPreview').length, 1);
}
for (const changes of [{ placing: true }, { selectedModuleId: null }, { placementScaleMultiplier: '0' }, { placementDraft: { ...props.placementDraft, x: '' } }, { inspectedModel: { ...model, libraryReadiness: { ...model.libraryReadiness, status: 'unavailable' } } }]) {
  const root = exportsObject.ThreeDModelLibraryPanel({ ...props, ...changes });
  assert.equal(nodes(root).find(n => n.props.children === 'Place at Coordinates').props.disabled, true);
}
assert.equal(exportsObject.ThreeDModelLibraryPanel({ ...props, isOpen: false }), null);
let cancelled = false;
const active = exportsObject.ThreeDModelLibraryPanel({ ...props, inspectedModel: null, placementModel: model, onCancelPlacement: () => cancelled = true });
nodes(active).find(n => n.props.children === 'Cancel').props.onClick(); assert.equal(cancelled, true);
console.log('PASS: placement overlay outside Library/Design portal, single preview, selection, coordinate guards, Cancel and close lifecycle (mocked UI).');

// Exercise the actual Scene placement callback with mocked persistence/runtime conversion.
(async () => {
  const source = fs.readFileSync('src/app/dashboard/scene/page.tsx', 'utf8');
  const begin = source.indexOf('  const handleModelPlacement =');
  const end = source.indexOf('  const handleCharacterPlacement', begin);
  const callback = source.slice(begin, end).replace('const handleModelPlacement =', 'globalThis.handleModelPlacement =');
  for (const success of [true, false]) {
    const calls = {};
    const created = { id: 77, markerId: 'project-model-77', sourceAssetId: 1 };
    const runtime = { id: created.markerId, type: 'models', data: { id: 1, projectMarkerId: 77 } };
    const context = { console: { error() {} }, useCallback: fn => fn, placementModel: model,
      modelPlacementDraft: { rotationY: '0' }, placementScaleMultiplier: '1', selectedProjectId: '17',
      placementThreedId: 2, placementModelRole: 'object', placingModelRef: { current: false },
      data: { threed: { raw: { models: [] } } },
      groundMapInspector: { setOpen: value => calls.ground = value },
      fetch: async () => ({ ok: success, status: success ? 200 : 500, json: async () => ({ success, data: created }) }),
      createProjectModelLibraryPlacementRequest: value => value,
      applyThreeDProjectClientTransaction: (current, transaction) => { calls.transaction = transaction; return current; },
      buildThreeDRuntimeMarkerResult: raw => { assert.equal(raw.projectThreedMarkers[0].id, 77); return { markers: [runtime] }; },
      showToastRef: { current() {} }, selectArchitecture: value => calls.architecture = value,
      setData: fn => fn({}),
    };
    for (const setter of ['setPlacingModel', 'setPlacementModel', 'setPlacementScaleMultiplier', 'setPlacementModelRole',
      'setSensorInspector', 'setGroupInspector', 'setSelectedIncident', 'setSelectedMarker', 'setInspectedLibraryModelId',
      'setIsModelLibraryOpen', 'setIsProjectAssetsOpen', 'setIsScenariosOpen', 'setIsSetupMenuOpen', 'setIsProjectSetupOpen']) {
      context[setter] = value => calls[setter] = value;
    }
    vm.runInNewContext(ts.transpileModule(callback, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, context);
    await context.handleModelPlacement({ x: 0, y: 0, z: 0 });
    if (success) {
      assert.equal(calls.setSelectedMarker, runtime);
      assert.equal(calls.transaction.markers.upsert[0].id, 77);
      assert.equal(calls.setIsModelLibraryOpen, false);
      assert.equal(calls.setInspectedLibraryModelId, null);
      assert.equal(calls.setIsProjectAssetsOpen, true);
      assert.equal(calls.setIsProjectSetupOpen, false);
      assert.equal(calls.setSensorInspector, null); assert.equal(calls.setGroupInspector, null);
      assert.equal(calls.ground, false); assert.equal(calls.architecture, null);
    } else {
      assert.equal(calls.setSelectedMarker, undefined);
      assert.equal(calls.setPlacementModel, undefined);
      assert.equal(calls.setIsModelLibraryOpen, undefined);
      assert.equal(calls.transaction, undefined);
    }
    assert.equal(context.placingModelRef.current, false);
  }
  console.log('PASS: actual Model placement callback selects the created Project instance and reveals DetailsCard only on successful persistence.');
})().catch(error => { console.error(error); process.exitCode = 1; });
