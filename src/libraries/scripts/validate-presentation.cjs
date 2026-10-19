// Server-render actual presentation components with mocked UI boundaries. No HTTP server or writes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '../../..');
function load(file) {
  const exports = {};
  const block = ({ children, ...props }) => React.createElement('div', props, children);
  const Link = ({ children, ...props }) => React.createElement('a', props, children);
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    exports, require(name) {
      if (name === 'next/link') return { default: Link };
      if (name === '@/components/learn/LearnPreview') return load('src/components/learn/LearnPreview.tsx');
      if (name === '@/components/admin/layout/AdminWorkspaceHeader') return load('src/components/admin/layout/AdminWorkspaceHeader.tsx');
      if (name === '@/libraries/utils') return { cn: (...values) => require('tailwind-merge').twMerge(require('clsx').clsx(...values)) };
      if (name.includes('/ui/card')) return { Card: block, CardContent: block };
      if (name.includes('/ui/button')) return { Button: ({ children, asChild, ...props }) => asChild ? React.cloneElement(children, props) : React.createElement('button', props, children) };
      if (name === 'lucide-react') return new Proxy({}, { get: () => () => React.createElement('svg') });
      if (name === 'react/jsx-runtime') return require(name);
      throw Error(`Unexpected dependency: ${name}`);
    },
  });
  return exports;
}
const { DashboardWelcome, DashboardStartingPaths } = load('src/components/home/DashboardWelcome.tsx');
const render = props => renderToStaticMarkup(React.createElement(DashboardWelcome, props));
for (const props of [{ loading: true, failed: false }, { loading: false, failed: true }, { loading: false, failed: false }]) {
  const html = render({ ...props, onCreate: () => {} });
  assert.match(html, /Create Project/); assert.match(html, /href="\/learn"/);
  assert.doesNotMatch(html, /projectId=|Continue Project|Open Sample Project/);
}
assert.match(render({ loading: false, failed: false, creationPending: true, onCreate: () => {} }), /disabled=""/);
assert.equal((render({ loading: false, failed: false, onCreate: () => {} }).match(/<button/g) || []).length, 1, 'Only one primary action');
const paths = renderToStaticMarkup(React.createElement(DashboardStartingPaths));
for (const anchor of ['draw-room', 'add-model', 'view-modes']) assert.ok(paths.includes('/learn#' + anchor));
const dashboardSource = ts.createSourceFile('page.tsx', fs.readFileSync(path.join(root, 'src/app/dashboard/page.tsx'), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let create;
(function walk(node) { if (ts.isVariableDeclaration(node) && node.name.getText(dashboardSource) === 'createProject') create = node.initializer; ts.forEachChild(node, walk); })(dashboardSource);
assert.ok(create);
for (const status of ['loading','unauthenticated','authenticated']) {
 const calls=[];
 const callback=vm.runInNewContext(create.getText(dashboardSource),{status,router:{push: value=>calls.push(value)},setCreating:value=>calls.push(value)});
 callback(); assert.deepEqual(calls, status==='loading'?[]:status==='authenticated'?[true]:['/auth/sign-in']);
}
const learnLayout=fs.readFileSync(path.join(root, 'src/app/learn/layout.tsx'),'utf8');
assert.match(learnLayout, /import DashboardLayout from/); assert.doesNotMatch(learnLayout, /redirect\(|useSession\(/);
const dashboardLayout=fs.readFileSync(path.join(root,'src/app/dashboard/layout.tsx'),'utf8');
assert.doesNotMatch(dashboardLayout,/redirect\(|useSession\(/);
const learn = renderToStaticMarkup(React.createElement(load('src/app/learn/page.tsx').default));
for (const id of ['first-project', 'how-to', 'draw-room', 'add-model', 'object-properties', 'view-modes', 'save-reopen', 'design-json', 'troubleshooting', 'about']) assert.match(learn, new RegExp(`id="${id}"`));
assert.match(learn, /Public Projects are for exploring/);
assert.match(learn, /Replacement replaces architectural content only/);
// Check every static internal link from these pages and the revised landing page.
const files = ['src/components/home/DashboardWelcome.tsx', 'src/app/learn/page.tsx', 'src/app/page.tsx'];
for (const file of files) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  for (const match of source.matchAll(/href="(\/[^"?]*)"/g)) {
    const [route, anchor] = match[1].split('#');
    const target = path.join(root, 'src/app', route, 'page.tsx');
    assert.ok(fs.existsSync(target), `${file}: ${route} exists`);
    if (anchor) assert.ok(fs.readFileSync(target, 'utf8').includes(`id="${anchor}"`), `${match[1]} anchor exists`);
  }
}
assert.ok(!fs.existsSync(path.join(root, 'src/app/services/page.tsx')), 'Unapproved services remain draft-only');
console.log('PASS: actual welcome/Learn server rendering, loading/error/empty actions, authenticated creation callback and public shared layout, guide anchors and internal destinations; services remain draft-only. No visual browser verification.');
