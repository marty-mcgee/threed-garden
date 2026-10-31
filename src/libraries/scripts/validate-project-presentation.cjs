// Actual presentation components with mocked React scheduling; no server or GPU.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
let saved = null;
let reporter = null;
const jsx = (type, props) => ({ type, props });
const loading = () => null;
const react = {
  createContext: value => ({ Provider: 'provider', value }),
  useContext: () => reporter,
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
function render(projectId = '17', mapOnly = false) {
  const tree = boundary.ProjectPresentationBoundary({ projectId, mapOnly, children: content });
  reporter = tree.props.value;
  return tree.props.children.props;
}
let tree = render();
assert.equal(tree['aria-busy'], true);
assert.equal(tree.children[0].props.inert, true);
assert.equal(tree.children[0].props.style.opacity, 0);
assert.equal(tree.children[0].props.children, content, 'Scene/panels remain mounted while preparing');
assert.equal(tree.children[1].type, loading);
reporter({ progress: 72, label: 'Loading Models', complete: false, failed: false });
tree = render();
assert.equal(tree.children[1].props.progress, 72);
assert.equal(tree.children[1].props.label, 'Loading Models');
assert.equal(render('17', true)['aria-busy'], false, '2D-only has no visible Scene prerequisite');
assert.equal(render()['aria-busy'], true, 'Entering 3D still waits for its readiness');
reporter({ progress: 100, label: 'Presenting', complete: true, failed: false });
tree = render();
assert.equal(tree['aria-busy'], false);
assert.equal(tree.children[0].props.inert, false);
assert.equal(tree.children[0].props.style.opacity, 1);
assert.equal(tree.children[0].props.children, content);
assert.equal(tree.children[1], false);
reporter({ progress: 50, label: 'Added Model', complete: false, failed: false });
assert.equal(render()['aria-busy'], false, 'Later edits cannot restart the Project introduction');
assert.equal(render('18')['aria-busy'], true, 'Different Project requires its own readiness');
reporter({ progress: 35, label: 'Failed', complete: false, failed: true });
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
reporter = null;
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
