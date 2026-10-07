const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const jsx = (type, props) => ({ type, props });
const mocks = {
  react: { useEffect() {}, useRef: () => ({ current: null }) },
  'react/jsx-runtime': { jsx, jsxs: jsx },
  'lucide-react': new Proxy({}, { get: (_, name) => name }),
  '@/components/map/details/PersistentDetails': { DetailsSectionScope: { Provider: 'Scope' }, PersistentDetails: 'Details' },
  '@/components/ui/button': { Button: 'button' },
  '@/components/ui/input': { Input: 'input' },
  '@/components/admin/threed/models/ModelFieldHelp': { ModelFieldHelp: 'Help' },
  '@/libraries/services/threed/physics/sensor-cuboid-core': { readPhysicsSensorCuboids: () => [] },
  '@/components/threed/transform/SceneTransformWorkspace': { useSceneTransform: () => ({ session: null }) },
  '@/components/threed/physics/SensorGroupsWorkspace': { useSensorGroups: () => null },
  '@/libraries/utils/map-helpers': { getThreeDIcon: () => '', getThreeDLabel: value => value },
};
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/map/panels/ProjectAssetsPanel.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText, { exports: exportsObject, require(name) { assert(name in mocks, name); return mocks[name]; } });
const asset = (id, type, data) => ({ id, type, data, name: id, position: { x: 0, y: 0, z: 0 }, metadata: {} });
const markers = [asset('Model instance', 'models', { id: 501, modelId: 7 }), asset('Character instance', 'characters', { id: 12, model: { id: 7 } }), asset('Unrelated Model', 'models', { id: 8 })];
const props = { selectedProjectId: '8', isOpen: true, search: '', setSearch() {}, typeFilter: 'all', setTypeFilter() {}, projectRuntimeMarkers: markers,
  projectAssetTypes: [], projectAssetTypeCounts: new Map(), visibleProjectAssets: markers, selectedMarker: null, resolveRuntimeMarkerPosition: () => null,
  onDismiss() {}, onSelectAsset() {}, onSelectGroup() {}, onSelectSensor() {}, resourceIssues: [{ modelId: 7, modelName: 'Farm Demo', fileName: 'Leaves_Diff.tga', message: 'Could not load' }] };
function nodes(value) {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== 'object') return [];
  return [value, ...nodes(value.props?.children)];
}
const rendered = nodes(exportsObject.ProjectAssetsPanel(props));
assert.equal(rendered.filter(node => node.type === 'button' && node.props.className?.includes('border-amber-400/60')).length, 2, 'Only assets using the affected reusable Model are highlighted');
const links = rendered.filter(node => node.type === 'a');
assert.equal(links.length, 3, 'Summary and both affected assets provide repair links');
for (const link of links) {
  assert.equal(link.props.href, '/admin/threed/models/7?tab=files');
  assert.equal(link.props.target, '_blank');
  assert.equal(link.props.rel, 'noopener noreferrer');
}
assert.equal(nodes(exportsObject.ProjectAssetsPanel({ ...props, visibleProjectAssets: [] })).filter(node => node.type === 'a').length, 1, 'Warnings remain discoverable when asset search hides affected rows');
assert.equal(nodes(exportsObject.ProjectAssetsPanel({ ...props, resourceIssues: [] })).filter(node => node.type === 'a').length, 0, 'Cleared warnings remove repair links');
console.log('PASS Project Assets: reusable Model identity, Character association, unaffected rows, safe new-tab links, filtered-list diagnostics and cleared warnings');
