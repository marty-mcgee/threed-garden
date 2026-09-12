const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const states = [], effects = [], calls = [];
let cursor = 0;
let assignment = null;
let fail = false;
const clip = { id: 46, name: 'Pick Fruit', fileName: 'Pick Fruit.fbx', clipIndex: 0, isActive: true };
const element = (type, props) => ({ type, props });
const exported = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/admin/threed/animations/CharacterAnimationAssignments.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText, {
  exports: exported, console, AbortController, setTimeout: callback => { effects.push(callback); return 1; }, clearTimeout() {},
  fetch: async (url, init) => {
    calls.push({ url, ...init });
    if (init.method && fail) return { ok: false, json: async () => ({ error: 'Test failure' }) };
    if (init.method === 'PUT') { const body = JSON.parse(init.body); assignment = { actionKey: body.actionKey, mode: body.mode, animationId: body.animationId }; }
    if (init.method === 'DELETE') assignment = null;
    return { ok: true, json: async () => ({ success: true, ...(url.startsWith('/api/threed/animations?') ? { data: [clip], pagination: { total: 1 } } : { data: { assignments: assignment ? [assignment] : [], inherited: [], animations: [clip], effective: [{ actionKey: 'pickFruit', source: assignment ? 'character' : 'legacy', state: assignment?.mode ?? 'legacy', animationId: assignment?.animationId ?? null }] } }) }) };
  },
  require(name) {
    if (name === 'react') return { useEffect(callback) { if (states.length < 13) effects.push(callback); }, useState(initial) { const index = cursor++; if (!(index in states)) states[index] = initial; return [states[index], next => { states[index] = typeof next === 'function' ? next(states[index]) : next; }]; } };
    if (name === 'react/jsx-runtime') return { jsx: element, jsxs: element };
    if (name.endsWith('/contracts')) return { LIBRARY_ACTIONS: ['pickFruit'] };
    return new Proxy({}, { get: (_, key) => key });
  },
});
function render() { cursor = 0; return exported.CharacterAnimationAssignments({ characterId: 11 }); }
function find(node, predicate) {
  if (Array.isArray(node)) { for (const child of node) { const match = find(child, predicate); if (match) return match; } return; }
  if (!node || typeof node !== 'object') return;
  return predicate(node) ? node : find(node.props?.children, predicate);
}
const flush = () => new Promise(resolve => setImmediate(resolve));
(async () => {
  render();
  while (effects.length) effects.shift()();
  await flush();
  for (const value of ['46', 'disabled', 'inherit']) {
    let tree = render();
    find(tree, node => node.type === 'select').props.onChange({ target: { value } });
    tree = render();
    const button = find(tree, node => node.type === 'Button' && node.props.children === 'Save');
    assert.equal(button.props.disabled, false);
    button.props.onClick(); await flush();
    const mutation = calls.filter(call => call.method).at(-1);
    if (value === 'inherit') { assert.equal(mutation.method, 'DELETE'); assert.match(mutation.url, /target=character&targetId=11&actionKey=pickFruit/); }
    else { assert.deepEqual(JSON.parse(mutation.body), { target: 'character', targetId: 11, actionKey: 'pickFruit', mode: value === 'disabled' ? 'disabled' : 'assigned', animationId: value === 'disabled' ? null : 46 }); }
  }
  fail = true;
  find(render(), node => node.type === 'select').props.onChange({ target: { value: '46' } });
  find(render(), node => node.type === 'Button' && node.props.children === 'Save').props.onClick(); await flush();
  assert.equal(assignment, null);
  assert.ok(states.some(value => typeof value === 'string' && value.includes('Test failure')));
  assert.equal(find(render(), node => node.type === 'select').props.value, '46', 'Failed save retains draft');
  console.log('PASS: Character assignment UI loads choices, saves clip IDs, disables/restores inheritance, and retains failed drafts (mocked network)');
})().catch(error => { console.error(error); process.exitCode = 1; });
