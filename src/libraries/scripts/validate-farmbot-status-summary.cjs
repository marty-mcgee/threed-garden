// Execute the extracted presentation against a mocked existing live-state hook.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
let state;
const calls = [];
const jsx = (type, props) => ({ type, props });
const modules = {
  'react/jsx-runtime': { jsx, jsxs: jsx },
  'lucide-react': { Loader2: 'Loader2' },
  '@/components/map/hooks/useFarmBotLiveState': { useFarmBotLiveState: props => { calls.push(props); return state; } },
  './DetailsCardSection': { DetailsCardSection: 'Section' },
  './DetailsCardRow': { KvRow: 'Row' },
};
const exported = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/map/details/FarmBotMqttStatusSummary.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText, { exports: exported, require(name) { assert(name in modules, `Unexpected dependency ${name}`); return modules[name]; } });
function render(next) {
  state = next;
  const tree = exported.FarmBotMqttStatusSummary({ farmbotId: 7, projectId: '17' });
  assert.equal(tree.props.title, 'Live FarmBot State');
  assert.equal(calls.length, 1, 'Presentation invokes the existing hook once');
  assert.equal(JSON.stringify(calls.pop()), '{"farmbotId":7,"projectId":"17"}');
  return tree;
}
let tree = render({ loading: true, state: null, error: null });
assert.equal(tree.props.summaryAside.type, 'Loader2');
tree = render({ loading: false, state: null, error: 'offline' });
assert.equal(tree.props.summaryAside.props.children, 'Unavailable');
tree = render({ loading: false, state: null, error: null });
assert.equal(tree.props.summaryAside.props.children, 'No recorded status');
tree = render({ loading: false, error: null, state: { condition: 'live', connectionState: 'connected',
  stateChangedAt: null, observedAt: null, position: { x: 1, y: 2, z: 3 } } });
const rows = tree.props.children.props.children;
assert.equal(rows.map(row => row.props.label).join(','), 'State,Source,Changed,Observed,Device');
assert.equal(rows[4].props.value, 'X:1.0 Y:2.0 Z:3.0');
assert.equal(rows[2].props.value, 'Never');
console.log('PASS: scoped FarmBot status presentation retains loading, empty/error and recorded position states');
