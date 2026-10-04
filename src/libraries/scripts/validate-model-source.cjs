const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const core = require('../services/threed/models/model-source-core.ts');
const saved = { id: 11, modelType: 'fbx', filePath: 'https://fixture.invalid/rig.fbx', mainModelFileId: 81, usedByCharacters: true, scale: '0.37', metadata: { fallbackShape: 'box', animationMap: { idle: 'Idle' }, notes: 'keep' }, files: [{ id: 81 }], materialAssignments: [{ textureId: 8 }] };
const before = JSON.stringify(saved);
for (const source of ['shape', 'model', 'character']) {
  const changed = { ...saved, metadata: JSON.parse(core.setModelSource(JSON.stringify(saved.metadata), source)) };
  const view = core.resolveActiveModelGeometry(changed);
  assert.equal(view.filePath, source === 'shape' ? '' : saved.filePath);
  assert.equal(view.modelType, source === 'shape' ? 'procedural' : 'fbx');
  assert.equal(changed.filePath, saved.filePath); assert.equal(changed.mainModelFileId, 81);
  assert.equal(view.metadata.animationMap.idle, 'Idle'); assert.equal(view.scale, '0.37');
  assert.equal(view.files, saved.files); assert.equal(view.materialAssignments, saved.materialAssignments);
  assert.equal(view.metadata.notes, 'keep');
}
assert.equal(JSON.stringify(saved), before);
assert.equal(core.readModelSource(saved), 'character');
assert.equal(core.readModelSource({ modelType: 'procedural', filePath: '' }), 'shape');
assert.equal(core.readModelSource({ modelType: 'gltf', filePath: 'saved' }), 'model');
for (const metadata of [{activeSource:'other'}, {activeSource:3}, {activeSource:'shape',fallbackShape:'invalid'}]) assert.equal(core.validModelSource(metadata), false);
assert.throws(() => core.setModelSource('[]', 'shape'));

// Execute the actual no-rig loader effect from each runtime: stale geometry is cleared,
// no resource loader or mixer is invoked, and source data stays intact.
for (const name of ['GardenCharacter', 'EcctrlCharacter']) {
  const file = 'src/components/threed/shared/' + name + '.tsx';
  const ast = ts.createSourceFile(file, fs.readFileSync(file,'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let callback;
  function visit(node) {
    if (ts.isCallExpression(node) && node.expression.getText(ast) === 'useEffect' && node.arguments[0]?.getText(ast).includes('loadCharacterTextureManager')) callback = node.arguments[0];
    ts.forEachChild(node, visit);
  }
  visit(ast); assert(callback, 'Find actual loader effect for ' + name);
  let model = 'stale rig', error = 'stale error', loading = true, animations = ['old clip'];
  const character = { id: 1, model: core.resolveActiveModelGeometry({ ...saved, metadata: { ...saved.metadata, activeSource: 'shape' } }) };
  const code = ts.transpileModule('const effect = ' + callback.getText(ast) + '; effect();', { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { character, isActive: true,
    setModel: value => { model = value; }, setModelError: value => { error = value; }, setError: value => { error = value; },
    setLoadingModel: value => { loading = value; }, setLoading: value => { loading = value; }, setAnimations: value => { animations = value; } });
  assert.equal(model, null); assert.equal(error, null); assert.equal(loading, false);
  if (name === 'EcctrlCharacter') assert.equal(animations.length, 0);
  // Both retain the real owner path for an explicit Shape; fallback Cylinders remain separate.
  const text = fs.readFileSync(file, 'utf8');
  assert(text.includes('if (!usesShape && (')); assert(text.includes('ModelShapeVisual shape={readModelFallbackShape'));
  if (name === 'EcctrlCharacter') {
    assert(text.includes('visible={layerEnabled} position={[0, -GROUND_OFFSET, 0]}'));
    assert(text.includes('const characterVisualReady = usesShape ||'));
    assert(text.includes('{!usesShape && layerEnabled && (!character.model?.filePath'));
    assert(text.includes('enabled={!usesShape && character.status'));
    let samplerFrame, taskAction;
    function findSourceGuards(node) {
      if (ts.isCallExpression(node) && node.expression.getText(ast) === 'useFrame' && node.arguments[0]?.getText(ast).includes('actionCollisionRef.current?.sample')) samplerFrame = node.arguments[0];
      if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'playTaskAction') taskAction = node.initializer.arguments[0];
      ts.forEachChild(node, findSourceGuards);
    }
    findSourceGuards(ast); assert(samplerFrame); assert(taskAction);
    // Even before a stale rig's passive cleanup, a Shape cannot sample or start a task.
    for (const [node, invocation] of [[samplerFrame, 'callback(null, 0.016)'], [taskAction, 'result = callback("kick")']]) {
      const context = { usesShape: true, result: undefined };
      vm.runInNewContext(ts.transpileModule('const callback = ' + node.getText(ast) + '; ' + invocation + ';', { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, context);
      if (node === taskAction) assert.equal(context.result, false);
    }
  }
  assert(text.includes('{!usesShape && model && ('));
  if (name === 'GardenCharacter') {
    let taskAction;
    function findTask(node) {
      if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'playTaskAction') taskAction = node.initializer;
      ts.forEachChild(node, findTask);
    }
    findTask(ast); assert(taskAction);
    vm.runInNewContext(ts.transpileModule('const callback = ' + taskAction.getText(ast) + '; callback("watering");', { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, { usesShape: true });
    assert(text.includes('[character.id, isPreview, usesShape]'));
  }
  assert(text.includes('releaseAvailability?.()')); assert(text.includes('cancelled ='));
}
console.log('PASS source round trips retain files/rig/settings; actual Character loader effects clear stale rig/availability inputs without loading or world writes.');
