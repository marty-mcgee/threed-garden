// Execute the actual Scene handlers and snapshot provider without React scheduling,
// network, database, Canvas or device access.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const compile = text => ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;

for (const name of ['ThreeDScene', 'ThreeDDesign']) {
  const file = `src/components/map/${name}.tsx`;
  const ast = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const expressions = {};
  let hydrate, provider, inventory, designVisibility;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isArrayBindingPattern(node.name) && node.name.elements[0]?.getText(ast) === 'viewPresets') expressions.viewPresets = node.initializer.getText(ast);
    if (ts.isVariableDeclaration(node) && ['saveCurrentView', 'deleteViewPreset', 'viewPresets', 'availableLayers'].includes(node.name.getText(ast))) {
      expressions[node.name.getText(ast)] = node.initializer.getText(ast);
      if (node.name.getText(ast) === 'availableLayers') inventory = node.initializer.arguments[0].getText(ast);
    }
    if (ts.isCallExpression(node) && node.expression.getText(ast) === 'useLayoutEffect' && node.arguments[0]?.getText(ast).includes('setViewPresets(')) hydrate = node.arguments[0].getText(ast);
    if (ts.isCallExpression(node) && node.expression.getText(ast) === 'onViewStateProviderChange' && node.arguments[0]?.getText(ast).includes('cameraPosition:')) provider = node.arguments[0].getText(ast);
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(ast) === 'DesignSceneObjects') {
      designVisibility = node.attributes.properties.find(prop => prop.name?.getText(ast) === 'visible')?.initializer.expression.getText(ast);
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert(hydrate && provider && inventory && designVisibility, name);
  const pose = { x: 3, y: 4, z: 5 };
  const context = {
    initialViewState: { viewPresets: [] }, viewPresets: [], viewPresetsRef: { current: [] },
    controlsRef: { current: { object: { position: pose, zoom: 1, fov: 45 }, target: { x: 0, y: 0, z: 0 } } },
    newPresetName: 'Field', activeLayers: new Set(['models', 'designs']), availableLayers: ['models', 'designs'],
    projectId: 15, sensorCounterStateRef: { current: { counts: {}, occupied: [] } },
    envPreset: 'sunset', sunlight: {}, extraGround: {}, groundMap: {}, autoRotate: false,
    showGrid: false, showSimulations: true, showGizmoCube: true, showControls: false,
    physicsDebug: false, activeScenario: null, scenarioInstructionVisible: false, showSensors: false,
    setViewPresets(value) { context.pendingRender = value; },
    setNewPresetName() {}, setShowPresetDialog() {}, confirm: () => true,
    alert(message) { throw Error(message); },
    useState(initial) { return [initial, () => {}]; },
    markers: [{ type: 'models' }], architecture: {}, normalizeSceneLayerType: type => type,
  };
  const evaluate = source => vm.runInNewContext(compile(`(${source})`), context);
  const capture = evaluate(provider);
  const save = evaluate(expressions.saveCurrentView);
  const remove = evaluate(expressions.deleteViewPreset);
  save();
  // A Project Save can use the previously registered provider before passive
  // effect re-registration. It must see the just-added view immediately.
  assert.equal(context.viewPresets.length, 0, 'Simulated render has not committed yet');
  const saved = JSON.parse(JSON.stringify(capture()));
  assert.equal(saved.viewPresets.length, 1, name);
  assert.equal(saved.viewPresets[0].name, 'Field');
  assert.deepEqual(saved.viewPresets[0].layers, ['models', 'designs']);
  context.initialViewState = saved;
  assert.equal(evaluate(expressions.viewPresets)[0].length, 1, 'Reopen starts from saved views, not an empty snapshot');
  evaluate(hydrate)();
  assert.equal(capture().viewPresets.length, 1);
  remove(saved.viewPresets[0].id);
  assert.equal(capture().viewPresets.length, 0, 'Immediate capture also preserves deletion');
  context.initialViewState = undefined;
  context.projectId = 16;
  evaluate(hydrate)();
  assert.equal(capture().viewPresets.length, 0, 'Next Project cannot inherit prior presets');
  assert.deepEqual(Array.from(evaluate(inventory)()), ['designs', 'models']);
  assert.equal(evaluate(designVisibility), true);
  context.activeLayers.delete('designs');
  assert.equal(evaluate(designVisibility), false);
}
console.log('PASS: immediate named-view add/delete capture, saved-view hydration, Project isolation and Designs layer forwarding in both owners.');
