// Execute the actual status/controls JSX with mocked Project state, without a renderer.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const file = 'src/components/threed/design/DesignEditor.tsx';
const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const declarations = {};
function visit(node) {
  if (ts.isVariableDeclaration(node) && ['importStatus', 'statusPanel', 'controls'].includes(node.name.getText(source))) {
    declarations[node.name.getText(source)] = node.initializer.getText(source);
  }
  ts.forEachChild(node, visit);
}
visit(source);
const jsx = (type, props) => ({ type, props });
const nodes = tree => !tree || typeof tree !== 'object' ? [] : [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)];
const text = tree => tree == null || typeof tree === 'boolean' ? '' : typeof tree !== 'object' ? String(tree)
  : tree.type === 'help' ? '' : [tree.props?.children].flat(Infinity).map(text).join('');
function render(overrides = {}) {
  const context = { doc: { walls: [1, 2], floors: [1], nodes: [1, 2, 3], openings: [], roofs: [], roofOpenings: [] },
    saving: false, dirty: false, canSave: true, scene: {}, error: '', message: 'Ready to draw.',
    loading: false, importing: false, controlsHost: {}, propertiesPanel: jsx('aside', {}),
    exports: {}, Activity: 'icon', DesignFieldHelp: 'help', require: () => ({ jsx, jsxs: jsx }), ...overrides };
  const code = Object.entries(declarations).map(([name, expression]) => `const ${name} = ${expression};`).join('\n') + '\ncontrols;';
  const tree = vm.runInNewContext(ts.transpileModule(code, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX } }).outputText, context);
  const section = nodes(tree).find(node => node.props['data-testid'] === 'design-status-section');
  assert(section, 'Status section is rendered');
  assert(!nodes(nodes(tree).find(node => node.type === 'fieldset')).includes(section), 'Status/help remain outside disabled editing controls');
  assert.equal(nodes(tree).filter(node => node.props['data-testid'] === 'design-save-status').length, 1);
  assert.match(text(section), /2 walls.*1 floors.*3 nodes/);
  assert.match(text(section), /Ready to draw\./);
  assert.doesNotMatch(text(section), /0\.0254|Project coordinates|Save Project retains/);
  const help = nodes(section).find(node => node.type === 'help');
  assert.equal(help.props.label, 'Design status');
  assert.match(help.props.children, /1 in = 0\.0254 m.*Project coordinates.*Save Project/);
  return section;
}
assert.match(text(render()), /No unsaved architecture changes/);
assert.match(text(render({ dirty: true })), /Unsaved Project changes/);
assert.match(text(render({ saving: true })), /Saving Project/);
const failed = render({ scene: { error: 'Save rejected' } });
assert.match(text(failed), /Project save failed - edits retained/);
assert.equal(nodes(failed).find(node => node.props.role === 'alert').props.children, 'Save rejected');
assert.equal(nodes(render({ error: 'Invalid opening' })).find(node => node.props.role === 'alert').props.children, 'Invalid opening');
assert.match(text(render({ canSave: false })), /Sign in as the Project owner to edit/);
console.log('PASS: Design Status retains inventory/save/drawing/errors and read-only help, with fixed guidance only in the tooltip');
