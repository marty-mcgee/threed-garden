// Exercise the actual workspace upload handler with mocked React, fetch and storage.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const states = [];
const calls = [];
let active = 0;
let peak = 0;
const element = (type, props) => ({ type, props });
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/admin/threed/animations/ThreeDAnimationsWorkspace.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText, {
  exports: exportsObject, console, File, FormData, setTimeout, clearTimeout, AbortController,
  fetch: async (_url, options) => {
    const file = options.body.get('file'); calls.push(file.name); peak = Math.max(peak, ++active);
    await new Promise(resolve => setTimeout(resolve, 1)); active--;
    if (file.name === 'Interrupted.fbx') throw new Error('Connection interrupted');
    return { ok: true, json: async () => ({ success: true, clipCount: 2 }) };
  },
  require(name) {
    if (name === 'react') return {
      useEffect() {}, useRef: () => ({ current: null }),
      useState(value) { const index = states.length; states.push(value); return [value, next => { states[index] = typeof next === 'function' ? next(states[index]) : next; }]; },
    };
    if (name === 'react/jsx-runtime') return { jsx: element, jsxs: element };
    return new Proxy({}, { get: (_, key) => key });
  },
});
function find(node, predicate) {
  if (!node || typeof node !== 'object') return;
  if (predicate(node)) return node;
  for (const child of [node.props?.children].flat()) { const found = find(child, predicate); if (found) return found; }
}
(async () => {
  const tree = exportsObject.ThreeDAnimationsWorkspace();
  const input = find(tree, node => node.type === 'input' && node.props.type === 'file');
  assert.equal(input.props.multiple, true);
  const files = [new File(['a'], 'Walk.fbx'), new File(['x'], 'Invalid.obj'), new File(['b'], 'Interrupted.fbx'), new File(['c'], 'Run.glb')];
  input.props.onChange({ target: { files, value: 'selection' } });
  // Wait for the final summary, with a bounded deadline.
  const deadline = Date.now() + 3000;
  while (!states.some(value => typeof value === 'string' && value.startsWith('Imported 2 of 4')) && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 5));
  assert.equal(peak, 1, 'Uploads must be sequential');
  assert.deepEqual(calls, ['Walk.fbx', 'Interrupted.fbx', 'Run.glb']);
  const results = states.find(value => Array.isArray(value) && value[0]?.status);
  assert.deepEqual(Array.from(results, row => row.status), ['Imported', 'Needs attention', 'Needs attention', 'Imported']);
  assert.match(results[2].detail, /already have saved/);
  assert.ok(states.includes('Imported 2 of 4 files (4 clips). 2 need attention.'));
  input.props.onChange({ target: { files: Array(101).fill(files[0]), value: '' } });
  assert.equal(calls.length, 3, 'Oversized batch must not upload');
  console.log('PASS: multi-file selection, sequential uploads, invalid-file isolation, continuation after interrupted request, results and batch limit');
})().catch(error => { console.error(error); process.exitCode = 1; });
