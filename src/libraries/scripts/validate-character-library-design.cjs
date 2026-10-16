// Offline Character placement/layout regression; no renderer or persistence calls.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const file = 'src/app/dashboard/scene/page.tsx';
const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let panel;
function visit(node) {
 if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(source) === 'ThreeDCharacterLibraryPanel') panel = node;
 ts.forEachChild(node, visit);
}
visit(source);
assert(panel);
const attribute = name => panel.attributes.properties.find(p => p.name?.text === name).initializer.expression.getText(source);
for (const viewMode of ['design', 'combined', '3d', '2d']) {
 const modes = [], selections = [], host = {};
 const context = { viewMode, designAssetsHost: host, setViewMode: value => modes.push(typeof value === 'function' ? value(viewMode) : value), setPlacementCharacter: value => selections.push(value) };
 const select = vm.runInNewContext('(' + attribute('onSelectCharacter') + ')', context);
 const character = { id: 12 };
 select(character);
 assert.equal(selections[0], character);
 assert.deepEqual(modes, [viewMode === '2d' ? '3d' : viewMode]);
 assert.equal(vm.runInNewContext(attribute('dockHost'), context), viewMode === 'design' ? host : null);
}
const exportsMock = {};
const jsx = (type, props) => ({ type, props });
const dependencies = {
 'react/jsx-runtime': { jsx, jsxs: jsx },
 'react-dom': { createPortal: (child, host) => ({ child, host }) },
 'lucide-react': { UserRound: 'UserRound', Loader2: 'Loader2', X: 'X' },
 '@/components/admin/threed/models/ModelFieldHelp': { ModelFieldHelp: 'Help' },
 '@/components/ui/button': { Button: 'Button' },
};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/map/panels/ThreeDCharacterLibraryPanel.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, { exports: exportsMock, require: name => { assert(name in dependencies, name); return dependencies[name]; } });
const props = { isOpen: true, projectModules: [], characters: [], placedCharacterIds: new Set() };
const floating = exportsMock.ThreeDCharacterLibraryPanel(props);
assert.equal(floating.props.style, undefined);
assert(floating.props.className.includes('threed-scene-sidebar-size'));
const host = {};
const docked = exportsMock.ThreeDCharacterLibraryPanel({ ...props, dockHost: host });
assert.equal(docked.host, host);
assert.equal(docked.child.props.style.height, '100%');
assert.equal(docked.child.props.style.top, 0);
assert.equal(docked.child.props.style.position, 'relative');
assert.equal(exportsMock.ThreeDCharacterLibraryPanel({ ...props, isOpen: false }), null);
console.log('PASS: Character placement preserves Design/Combined/3D; 2D fallback and shared dock sizing.');

// Exercise every action-level viewport updater in the actual page, including
// DetailsCard module/planting movement, transforms, sensors and scenario start.
let guardedActions = 0;
function verifyModeUpdates(node) {
 if (ts.isCallExpression(node) && node.expression.getText(source) === 'setViewMode') {
  const arg = node.arguments[0];
  assert(!(ts.isStringLiteral(arg) && arg.text === '3d'), 'No action should force an already visible 3D viewport to fullscreen');
  if (ts.isArrowFunction(arg)) {
   const update = vm.runInNewContext('(' + arg.getText(source) + ')');
   for (const mode of ['design', 'combined', '3d', '2d']) assert.equal(update(mode), mode === '2d' ? '3d' : mode);
   guardedActions++;
  }
 }
 ts.forEachChild(node, verifyModeUpdates);
}
verifyModeUpdates(source);
assert.equal(guardedActions, 8, 'All eight viewport-requiring action paths are covered');
console.log('PASS: all eight action paths preserve visible 3D modes, including DetailsCard Move Placement.');
