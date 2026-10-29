// Execute the actual Scene/Design selection callbacks with local state boundaries.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function source(file) {
  return ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}
function declaration(file, name) {
  let found;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(file) === name) found = node.initializer.getText(file);
    ts.forEachChild(node, visit);
  }
  visit(file);
  assert(found, name);
  return found;
}
const page = source('src/app/dashboard/scene/page.tsx');
let draft = {
  selected: null,
  history: { present: { walls: [{ id: 'wall' }], nodes: [] } },
  workspace: { sections: { retained: true }, plan: { x: 12, y: 20, scale: 45 } },
};
let selectedMarker = { id: 'models-instance-a', type: 'models', data: { id: 15 } };
let incident = {}, sensor = {}, group = {}, ground = true;
const originalHistory = draft.history;
const originalPlan = draft.workspace.plan;
const boundary = {
  useCallback: callback => callback,
  selectedProjectId: '17',
  architectureDrafts: { current: new Map([['17', draft]]) },
  entityLevelId: (doc, id) => doc.walls.some(wall => wall.id === id) ? 'ground' : undefined,
  defaultDesignWorkspace: () => ({ sections: {} }),
  setSelectedMarker: next => { selectedMarker = next; },
  setSelectedIncident: next => { incident = next; },
  setSensorInspector: next => { sensor = next; },
  setGroupInspector: next => { group = next; },
  groundMapInspector: { setOpen: next => { ground = next; } },
  renderArchitecture() {},
  resolveRuntimeMarkerPosition: (type, id) => {
    assert.equal(type, 'models');
    assert.equal(id, 15);
    return { x: 9, y: 0, z: 20 };
  },
};
function evaluate(expression, globals) {
  return vm.runInNewContext(ts.transpileModule(`(${expression})`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText, globals);
}
const selectArchitecture = evaluate(declaration(page, 'selectArchitecture'), boundary);
selectArchitecture('wall');
draft = boundary.architectureDrafts.current.get('17');
assert.equal(draft.selected, 'wall');
assert.equal(draft.workspace.selectedEntityId, 'wall');
assert.equal(draft.workspace.sections['threed:details:v1:design:17:selected-properties'], true);
assert.equal(draft.workspace.sections.retained, true);
assert.equal(draft.history, originalHistory);
assert.equal(draft.workspace.plan, originalPlan);
assert.equal(selectedMarker, null, 'Architecture selection clears the old Model inspector/highlight');
assert.equal(incident, null);
assert.equal(sensor, null);
assert.equal(group, null);
assert.equal(ground, false);
selectArchitecture('missing-wall');
assert.equal(boundary.architectureDrafts.current.get('17').selected, 'wall');

const selectAsset = evaluate(declaration(page, 'selectProjectAsset'), { ...boundary, selectArchitecture });
selectAsset({ id: 'models-instance-b', type: 'models', data: { id: 15 } });
assert.equal(boundary.architectureDrafts.current.get('17').selected, null);
assert.equal(selectedMarker.id, 'models-instance-b', 'Keep the exact placed instance, not the catalog ID');
assert.equal(selectedMarker.position.x, 9);
selectArchitecture(null);
assert.equal(selectedMarker, null, 'Blank-plan deselection clears the Model as well');

const editor = source('src/components/threed/design/DesignEditor.tsx');
let selected, fallback;
const owner = { current: { onSelect: value => { selected = value; } } };
const setSelected = evaluate(declaration(editor, 'setSelected'), {
  useCallback: callback => callback,
  owner,
  updateDraft: update => { fallback = update; },
  defaultDesignWorkspace: () => ({ sections: {} }),
});
setSelected('wall');
assert.equal(selected, 'wall', 'Native plan/property selection uses the Project selection owner');
assert.equal(fallback, undefined, 'No competing native-Editor selection write');
setSelected(null);
assert.equal(selected, null);
owner.current = null;
setSelected('wall');
assert.equal(fallback(draft).selected, 'wall', 'Standalone editor keeps its local selection path');

let mounted = false, surfaceCallbacks = 0;
function checkWiring(node) {
  if (ts.isJsxSelfClosingElement(node)) {
    const tag = node.tagName.getText(page);
    if (tag === 'DesignEditor') {
      const scene = node.attributes.properties.find(prop => ts.isJsxAttribute(prop) && prop.name.text === 'scene');
      mounted = !!scene && scene.initializer.getText(page).includes('onSelect: selectArchitecture');
    }
    if (tag === 'UnifiedMapView') {
      const callback = node.attributes.properties.find(prop => ts.isJsxAttribute(prop) && prop.name.text === 'onMarkerSelect');
      if (callback?.initializer.getText(page).includes('selectProjectAsset(marker)')) surfaceCallbacks++;
    }
  }
  ts.forEachChild(node, checkWiring);
}
checkWiring(page);
assert(mounted, 'Dashboard wires native Design to the same Project selection callback');
assert.equal(surfaceCallbacks, 2, 'Both geographic/3D surfaces clear architecture when selecting a Model');

const card = source('src/components/map/details/DetailsCard.tsx');
function checkCard(node, actionRow = false) {
  const row = actionRow || (ts.isJsxElement(node) && node.openingElement.attributes.properties.some(prop =>
    ts.isJsxAttribute(prop) && prop.name.text === 'className' && prop.initializer?.getText(card).includes('order-[-20]')));
  if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(card) === 'SceneMultimediaDetails') {
    assert(!row, 'A full-width section must not live in the icon action row');
  }
  ts.forEachChild(node, child => checkCard(child, row));
}
checkCard(card);
console.log('PASS shared Scene selection: actual native/Project callbacks, exact Model instance, architecture Properties expansion, exclusive inspectors/highlights, blank deselection and retained geometry/workspace. DetailsCard Multimedia stays outside its action row. Offline state boundaries only.');
