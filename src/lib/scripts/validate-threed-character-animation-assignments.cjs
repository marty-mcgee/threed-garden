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
    if (name === 'react') return { useRef() { return { current: null }; }, useEffect(callback) { if (states.length < 14) effects.push(callback); }, useState(initial) { const index = cursor++; if (!(index in states)) states[index] = initial; return [states[index], next => { states[index] = typeof next === 'function' ? next(states[index]) : next; }]; } };
    if (name === 'react/jsx-runtime') return { jsx: element, jsxs: element };
    if (name.endsWith('/contracts')) return { LIBRARY_ACTIONS: ['pickFruit'] };
    return new Proxy({}, { get: (_, key) => key });
  },
});
let targetProps = { characterId: 11 };
function render() { cursor = 0; return exported.CharacterAnimationAssignments(targetProps); }
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
  find(render(), node => node.type === 'select').props.onChange({ target: { value: '46' } });
  find(render(), node => node.type === 'Button' && node.props.children === 'Preview animation').props.onClick();
  assert.equal(find(render(), node => node.type === 'iframe').props.src, '/threed/character-animation-preview?characterId=11');
  find(render(), node => node.type === 'Button' && node.props.children === 'T-Pose').props.onClick();
  assert.equal(find(render(), node => node.type === 'iframe').props.src, '/threed/character-animation-preview?characterId=11', 'T-Pose retains the loaded frame');
  find(render(), node => node.type === 'Button' && node.props.children === 'Preview animation').props.onClick();
  find(render(), node => node.type === 'select').props.onChange({ target: { value: 'inherit' } });
  const retainedFrame = find(render(), node => node.type === 'iframe');
  assert.equal(retainedFrame.props.src, '/threed/character-animation-preview?characterId=11', 'Changing a draft retains the loaded preview');
  find(render(), node => node.type === 'select').props.onChange({ target: { value: '47' } });
  find(render(), node => node.type === 'Button' && node.props.children === 'Preview animation').props.onClick();
  assert.equal(find(render(), node => node.type === 'iframe').props.src, retainedFrame.props.src, 'Switching preview must not navigate the frame');
  fail = true;
  find(render(), node => node.type === 'select').props.onChange({ target: { value: '46' } });
  find(render(), node => node.type === 'Button' && node.props.children === 'Save').props.onClick(); await flush();
  assert.equal(assignment, null);
  assert.ok(states.some(value => typeof value === 'string' && value.includes('Test failure')));
  assert.equal(find(render(), node => node.type === 'select').props.value, '46', 'Failed save retains draft');
  const visibleText = node => Array.isArray(node) ? node.map(visibleText).join(' ') : node && typeof node === 'object' ? visibleText(node.props?.children) : String(node ?? '');
  assert.match(visibleText(render()), /Unsaved change/);
  states[0] = { modelId: 22, assignments: [], inherited: [{ actionKey: 'pickFruit', mode: 'assigned', animationId: 46 }], animations: [clip], effective: [{ actionKey: 'pickFruit', source: 'model', state: 'assigned', animationId: 46 }] };
  states[1] = {};
  let tree = render();
  const writesBeforePreview = calls.filter(call => call.method).length;
  const inheritedButton = find(tree, node => node.type === 'Button' && node.props.children === 'Preview animation');
  assert.equal(inheritedButton.props.disabled, false);
  inheritedButton.props.onClick();
  assert.equal(states[12].animationId, 46);
  assert.equal(calls.filter(call => call.method).length, writesBeforePreview, 'Inherited preview must not save an override');
  assert.match(visibleText(tree), /Preview Model default: Pick Fruit/);
  states[0].inherited[0].mode = 'disabled';
  assert.equal(find(render(), node => node.type === 'Button' && node.props.children === 'Preview animation').props.disabled, true);
  states[0].inherited[0].mode = 'assigned';
  assert.match(visibleText(tree), /Inherited Model default/);
  assert.match(visibleText(tree), /Assigned — playback not verified/);
  assert.equal(find(tree, node => node.props?.href === '/admin/threed/model-files?modelId=22').props.href, '/admin/threed/model-files?modelId=22');
  states[0].effective[0].state = 'unavailable';
  assert.match(visibleText(render()), /Unavailable — replace or restore defaults/);
  states[0].effective[0] = { actionKey: 'pickFruit', source: 'character', state: 'disabled', animationId: null };
  assert.match(visibleText(render()), /Disabled — this action will not play/);
  states.length = 0; effects.length = 0; assignment = null; fail = false;
  targetProps = { modelId: 935 };
  render(); while (effects.length) effects.shift()(); await flush();
  assert.match(visibleText(render()), /Static Models require no assignments/);
  assert.match(visibleText(render()), /generic Scene Model playback is not implemented yet/);
  for (const value of ['46', 'disabled', 'inherit']) {
    find(render(), node => node.type === 'select').props.onChange({ target: { value } });
    find(render(), node => node.type === 'Button' && node.props.children === 'Save').props.onClick(); await flush();
    const mutation = calls.filter(call => call.method).at(-1);
    if (value === 'inherit') {
      assert.equal(mutation.method, 'DELETE');
      assert.match(mutation.url, /target=model&targetId=935&actionKey=pickFruit/);
    } else assert.deepEqual(JSON.parse(mutation.body), { target: 'model', targetId: 935, actionKey: 'pickFruit', mode: value === 'disabled' ? 'disabled' : 'assigned', animationId: value === 'disabled' ? null : 46 });
  }
  fail = true;
  find(render(), node => node.type === 'select').props.onChange({ target: { value: '46' } });
  find(render(), node => node.type === 'Button' && node.props.children === 'Save').props.onClick(); await flush();
  assert.equal(find(render(), node => node.type === 'select').props.value, '46');
  const modelsUI = fs.readFileSync('src/components/admin/threed/models/ThreeDModelsCRUD.tsx', 'utf8');
  assert.match(modelsUI, /onClick=\{\(\) => setAnimationModel\(model\)\}/);
  assert.match(modelsUI, /<ModelAnimationAssignments key=\{animationModel.id\} modelId=\{animationModel.id\}/);
  console.log('PASS: Character assignment UI loads choices, saves clip IDs, disables/restores inheritance, and retains failed drafts (mocked network)');
})().catch(error => { console.error(error); process.exitCode = 1; });
