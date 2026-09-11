const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '../../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const compile = (source) => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const exportsObject = {};
vm.runInNewContext(compile(read('src/lib/services/threed/markers/runtime-marker-core.ts')), { exports: exportsObject });
const registry = new exportsObject.ThreeDRuntimeMarkerRegistry();
registry.replaceAssetMarkers([{ moduleType: 'characters', assetId: 11, name: 'Farmer', assetPosition: { x: 0, y: 0, z: 0 } }]);
registry.updateLivePosition('characters', 11, { x: 10, y: 2, z: 20 });
function callback(file, name, context) {
  const source = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let arrow;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === name) arrow = node.initializer.arguments[0];
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.ok(arrow, name);
  return vm.runInNewContext(compile(`const result = ${arrow.getText(source)}; result;`), context);
}
const registryRef = { current: registry };
const snapshot = callback('src/components/map/UnifiedMapView.tsx', 'getProjectMarkerSnapshot', {
  runtimeMarkerRegistryRef: registryRef,
  runtimeMarkers: [{ id: 'characters-11', type: 'characters', name: 'Farmer', data: { id: 11 } }],
});
const requests = [];
const base = {
  console, projectRuntimeMarkerRegistryRef: registryRef,
  showToastRef: { current() {} }, setData() {}, setSelectedMarker() {}, setUpdatingCharacterMarkerId() {},
  updatingCharacterMarkerId: null, controlledCharacterId: null,
  data: { threed: { raw: { projectThreedMarkers: [{ id: 77, sourceAssetId: 11 }] } } },
};
const savePosition = (ok) => callback('src/app/dashboard/map/page.tsx', 'handleUpdateCharacterPosition', {
  ...base, fetch: async (url, options) => {
    requests.push({ url, ...options });
    return { ok, status: ok ? 200 : 500, json: async () => ({ success: ok, data: { sourceAssetId: 11, positionX: '5.000', positionY: '1.000', positionZ: '7.000' } }) };
  },
});
(async () => {
  assert.equal(snapshot()[0].position.x, 10, 'Project snapshot must capture live movement without Save Position');
  await savePosition(false)(77, { positionX: 5, positionY: 1, positionZ: 7 });
  assert.equal(snapshot()[0].position.x, 10, 'Failed edits must preserve live position');
  registry.updateLiveRotation('characters', 11, -45);
  await savePosition(true)(77, { positionX: 5, positionY: 1, positionZ: 7 });
  assert.equal(JSON.parse(requests.at(-1).body).rotation, 315);
  assert.equal(snapshot()[0].data.rotation, 315);
  assert.equal(snapshot()[0].position.x, 5, 'Successful edits must supersede old live coordinates');
  registry.updateLivePosition('characters', 11, { x: 25, y: 3, z: 45 });
  registry.updateLiveRotation('characters', 11, 45);
  assert.equal(registry.updateLiveRotation('characters', 11, NaN), false);
  const projectSave = callback('src/app/dashboard/map/page.tsx', 'handleSaveThreeDProject', {
    ...base, selectedProjectId: '5', savingProjectMarkers: false, setSavingProjectMarkers() {}, setLastUpdated() {},
    projectMarkerSnapshotProviderRef: { current: snapshot }, projectThreeDViewStateProviderRef: {}, projectMapViewStateProviderRef: {},
    lastProjectThreeDViewStateRef: {}, lastProjectMapViewStateRef: {}, initialProjectViewState: null,
    PROJECT_VIEW_STATE_VERSION: 1, viewMode: '3d', panelHeight: 500, cameraMode: 'stationary',
    fetch: async (url, options) => { requests.push({ url, ...options }); return { ok: true, json: async () => ({ success: true, data: { markerCount: 1 } }) }; },
  });
  await projectSave();
  const payload = JSON.parse(requests.at(-1).body);
  assert.deepEqual(payload.markers[0].position, { x: 25, y: 3, z: 45 });
  assert.equal(requests.at(-1).method, 'PUT');
  assert.equal(payload.markers[0].data.rotation, 45);
  registry.replaceAssetMarkers([{ moduleType: 'characters', assetId: 11, name: 'Farmer', assetPosition: { x: 5, y: 1, z: 7 } }]);
  assert.equal(snapshot()[0].data.rotation, 45, 'Unrelated refresh must retain live facing');
  registry.remove('characters', 11);
  registry.replaceAssetMarkers([{ moduleType: 'characters', assetId: 11, name: 'Farmer', assetPosition: { x: 0, y: 0, z: 0 } }]);
  assert.equal(registry.resolve('characters', 11).liveRotation, null, 'Deleted instances must not retain facing');
  console.log('PASS: actual Character PATCH callback preserves failure state and updates live authority; Project PUT captures latest live position and facing automatically');
})().catch((error) => { console.error(error); process.exitCode = 1; });
