// Actual presentation components with mocked React scheduling; no server or GPU.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
let saved = null;
const contextValues = new Map();
const jsx = (type, props) => ({ type, props });
const loading = () => null;
const react = {
  createContext: value => ({ Provider: Symbol('provider'), value }),
  useContext: context => contextValues.has(context.Provider) ? contextValues.get(context.Provider) : context.value,
  useCallback: fn => fn,
  useState: () => [saved, update => { saved = update(saved); }],
  useLayoutEffect: effect => effect(),
};
function load(file, imports = {}) {
  const result = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText, {
    exports: result,
    require(name) {
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name === './ThreeDProjectLoadingPresentation') return { ThreeDProjectLoadingPresentation: loading };
      assert(name in imports, name);
      return imports[name];
    },
  });
  return result;
}
const boundary = load('src/components/map/presentation/ProjectPresentationBoundary.tsx');
const content = { canvas: 'persistent', panels: 'Design/Assets/Multimedia' };
assert.equal(boundary.useProjectPresentationReleased(), true, 'Standalone viewers can open immediately');
function render(projectId = '17', mapOnly = false) {
  let tree = boundary.ProjectPresentationBoundary({ projectId, mapOnly, children: content });
  while (typeof tree.type === 'symbol') {
    contextValues.set(tree.type, tree.props.value);
    tree = tree.props.children;
  }
  assert.equal(boundary.useProjectPresentationReleased(), !tree.props['aria-busy'], 'Portals follow the current Project presentation');
  return tree.props;
}
function report(status) {
  const reporter = boundary.useProjectPresentationReporter();
  reporter(status);
}
let tree = render();
assert.equal(tree['aria-busy'], true);
assert.equal(tree.children[0].props.inert, true);
assert.equal(tree.children[0].props.style.opacity, 0);
assert.equal(tree.children[0].props.children, content, 'Scene/panels remain mounted while preparing');
assert.equal(tree.children[1].type, loading);
report({ progress: 72, label: 'Loading Models', complete: false, failed: false });
tree = render();
assert.equal(tree.children[1].props.progress, 72);
assert.equal(tree.children[1].props.label, 'Loading Models');
assert.equal(render('17', true)['aria-busy'], false, '2D-only has no visible Scene prerequisite');
assert.equal(render()['aria-busy'], true, 'Entering 3D still waits for its readiness');
report({ progress: 100, label: 'Presenting', complete: true, failed: false });
tree = render();
assert.equal(tree['aria-busy'], false);
assert.equal(tree.children[0].props.inert, false);
assert.equal(tree.children[0].props.style.opacity, 1);
assert.equal(tree.children[0].props.children, content);
assert.equal(tree.children[1], false);
report({ progress: 50, label: 'Added Model', complete: false, failed: false });
assert.equal(render()['aria-busy'], false, 'Later edits cannot restart the Project introduction');
assert.equal(render('18')['aria-busy'], true, 'Different Project requires its own readiness');
report({ progress: 35, label: 'Failed', complete: false, failed: true });
assert.equal(render('18')['aria-busy'], false, 'Existing failure UI remains visible and interactive');
const feedback = load('src/components/map/presentation/SceneResourceFeedback.tsx', {
  'lucide-react': { X: () => null },
  './ProjectPresentationBoundary': boundary,
});
render('19');
const pending = {
  physicsFailed: false,
  warningsDismissed: false,
  resourceFailed: false,
  visibleResourceIssues: [],
  onDismissWarnings() {},
  scenePostProduction: false,
  sceneLoadingProgress: 64,
  sceneLoadingLabel: 'Preparing Characters',
  sceneProductionStarted: false,
  resourcesPending: true,
};
const feedbackTree = feedback.SceneResourceFeedback(pending);
assert.equal(feedbackTree.props.children[1], false, 'Workspace owns the single initial loader');
assert.equal(render('19').children[1].props.progress, 64);
feedback.SceneResourceFeedback({ ...pending, scenePostProduction: true });
assert.equal(render('19')['aria-busy'], false, 'Actual Scene feedback releases the workspace');
contextValues.clear();
assert.equal(feedback.SceneResourceFeedback(pending).props.children[1].type, loading, 'Standalone Scene retains local presentation');
console.log('PASS: actual Project presentation progress, retained children, inert preparation, completion latch, Project reset, 2D bypass, failure access and standalone Scene fallback');

const scene = ts.createSourceFile('ThreeDScene.tsx', fs.readFileSync('src/components/map/ThreeDScene.tsx', 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let readiness;
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(scene) === 'scenePresentationReady') readiness = node.initializer.getText(scene);
  ts.forEachChild(node, visit);
}
visit(scene);
assert(readiness);
const ready = {
  sceneFrameReady: true,
  controlsReady: true,
  allRequiredModelsSettled: true,
  allRequiredCharactersSettled: true,
  resourcesPending: false,
};
assert.equal(vm.runInNewContext(readiness, ready), true);
for (const key of Object.keys(ready)) {
  assert.equal(vm.runInNewContext(readiness, { ...ready, [key]: !ready[key] }), false, `Initial introduction waits for ${key}`);
}
console.log('PASS: actual initial Scene readiness waits for frame, controls, Models, Characters and pending resources');

const workspace = ts.createSourceFile('SceneWorkspace.tsx', fs.readFileSync('src/app/dashboard/scene/SceneWorkspace.tsx', 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let mediaProviderFound = false;
function checkMediaProvider(node) {
  if (ts.isJsxElement(node) && node.openingElement.tagName.getText(workspace) === 'SceneMultimediaProvider') {
    mediaProviderFound = true;
    let ancestor = node.parent;
    while (ancestor && !(ts.isJsxElement(ancestor) && ancestor.openingElement.tagName.getText(workspace) === 'ProjectPresentationBoundary')) {
      ancestor = ancestor.parent;
    }
    assert(ancestor, 'The actual Scene Multimedia provider must receive the Project presentation context');
  }
  ts.forEachChild(node, checkMediaProvider);
}
checkMediaProvider(workspace);
assert(mediaProviderFound);
