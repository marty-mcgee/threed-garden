// Actual provider and Settings form with a small hook harness. No browser/database.
const assert = require('node:assert/strict'), fs = require('node:fs'), ts = require('typescript'), vm = require('node:vm');
const element = (type, props) => ({ type, props });
function load(file, modules, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    exports, Error, require: key => modules[key] ?? require(key), ...globals,
  });
  return exports;
}
const contract = load('src/libraries/config/workspace-settings.ts', {});
function harness() {
  const slots = []; let index = 0, dirty = false, component, tree;
  const changed = (a, b) => !a || a.length !== b.length || a.some((value, i) => !Object.is(value, b[i]));
  const effects = [];
  const react = {
    createContext: () => ({ Provider: 'Provider' }), useContext: () => null,
    useState(initial) {
      const i = index++; slots[i] ??= { value: typeof initial === 'function' ? initial() : initial };
      return [slots[i].value, value => { const next = typeof value === 'function' ? value(slots[i].value) : value; if (!Object.is(next, slots[i].value)) { slots[i].value = next; dirty = true; } }];
    },
    useRef(initial) { const i = index++; slots[i] ??= { current: initial }; return slots[i]; },
    useCallback(fn, deps) { const i = index++; if (!slots[i] || changed(slots[i].deps, deps)) slots[i] = { fn, deps }; return slots[i].fn; },
    useEffect(fn, deps) {
      const i = index++;
      if (!slots[i] || changed(slots[i].deps, deps)) { effects.push(() => { slots[i]?.cleanup?.(); slots[i] = { deps, cleanup: fn() }; }); }
    },
  };
  return { react, render(fn = component) {
    component = fn;
    for (let pass = 0; pass < 20; pass++) {
      dirty = false; index = 0; tree = component();
      const jobs = effects.splice(0); jobs.forEach(job => job());
      if (!dirty) return tree;
    }
    throw new Error('Render loop');
  } };
}
const flush = () => new Promise(resolve => setImmediate(resolve));
const find = (node, predicate) => {
  if (Array.isArray(node)) { for (const child of node) { const result = find(child, predicate); if (result) return result; } }
  else if (node && typeof node === 'object') return predicate(node) ? node : find(node.props?.children, predicate);
};
const text = node => Array.isArray(node) ? node.map(text).join('') : node && typeof node === 'object' ? text(node.props?.children) : typeof node === 'string' ? node : '';
(async () => {
  const h = harness();
  let session = { status: 'unauthenticated', data: null }, theme = 'light', requests = [];
  const provider = load('src/components/settings/WorkspaceSettingsProvider.tsx', {
    react: h.react, 'react/jsx-runtime': { jsx: element, jsxs: element },
    'next-auth/react': { useSession: () => session },
    '@/components/themes/provider': { useTheme: () => ({ theme, setTheme: value => { theme = value; } }) },
    '@/libraries/config/workspace-settings': contract,
  }, { fetch: (url, init = {}) => new Promise(resolve => requests.push({ init, resolve })), console });
  const render = () => h.render(() => provider.WorkspaceSettingsProvider({ children: 'persistent scene' })).props.value;
  assert.equal(render().snapshot, null); assert.equal(requests.length, 0);
  session = { status: 'authenticated', data: { user: { id: 'alice' } } }; render();
  const aliceRequest = requests.shift();
  session = { status: 'authenticated', data: { user: { id: 'bob' } } }; render();
  const bobRequest = requests.shift();
  const alicePreferences = contract.defaultWorkspaceSettings(); alicePreferences.modules.traffic = false; alicePreferences.theme = 'dark';
  const bobPreferences = contract.defaultWorkspaceSettings(); bobPreferences.theme = 'system';
  const revision = 'd737dc13-bf05-4338-98f7-c74dc1e7a4a0';
  aliceRequest.resolve({ ok: true, json: async () => ({ preferences: alicePreferences, revision }) }); await flush();
  assert.equal(render().snapshot, null, 'Late prior-account response must be ignored'); assert.equal(theme, 'light');
  bobRequest.resolve({ ok: true, json: async () => ({ preferences: bobPreferences, revision }) }); await flush();
  let state = render(); assert.equal(state.preferences.modules.traffic, true); assert.equal(theme, 'system');
  const next = { ...bobPreferences, theme: 'dark' };
  let pending = state.save(next, revision); render();
  requests.shift().resolve({ ok: false, status: 503 }); await assert.rejects(pending); state = render();
  assert.equal(state.preferences.theme, 'system'); assert.equal(state.saving, false);
  pending = state.save(next, revision); render();
  requests.shift().resolve({ ok: true, json: async () => ({ preferences: next, revision }) }); await pending; state = render();
  assert.equal(theme, 'dark'); assert.equal(state.preferences.theme, 'dark');
  const browser = { ...next, theme: 'browser' };
  pending = state.save(browser, revision); render();
  requests.shift().resolve({ ok: true, json: async () => ({ preferences: browser, revision }) }); await pending; state = render();
  assert.equal(theme, 'light', 'Browser choice restores pre-override appearance');
  session = { status: 'unauthenticated', data: null }; state = render();
  assert.equal(state.snapshot, null); assert.equal(state.preferences.theme, 'browser');

  const formHarness = harness(); let saveCalls = [], failSave = true, confirmResult = false, refreshCount = 0;
  let context = { snapshot: { preferences: contract.defaultWorkspaceSettings(), revision }, loading: false, saving: false, error: null,
    refresh: async () => { refreshCount++; }, save: async (...args) => { saveCalls.push(args); if (failSave) throw new Error('Mock save failure'); },
  };
  const form = load('src/components/admin/settings/SettingsManager.tsx', {
    react: formHarness.react, 'react/jsx-runtime': { jsx: element, jsxs: element },
    'lucide-react': new Proxy({}, { get: (_, key) => key }),
    '@/components/admin/layout/AdminWorkspaceHeader': { AdminWorkspaceHeader: 'Header' },
    '@/components/ui/button': { Button: 'Button' }, '@/components/ui/switch': { Switch: 'Switch' },
    '@/components/settings/WorkspaceSettingsProvider': { useWorkspaceSettings: () => context },
    '@/libraries/config/workspace-settings': contract,
  }, { window: { addEventListener() {}, removeEventListener() {}, confirm: () => confirmResult } });
  const renderForm = () => formHarness.render(() => form.SettingsManager());
  const button = (tree, label) => find(tree, node => node.type === 'Button' && text(node).includes(label));
  let tree = renderForm(); assert(button(tree, 'Save Changes').props.disabled);
  find(tree, node => node.props?.id === 'workspace-traffic').props.onCheckedChange(false);
  tree = renderForm(); assert(!button(tree, 'Save Changes').props.disabled);
  assert(find(tree, node => node.props?.htmlFor === 'workspace-traffic'), 'Switch has visible label');
  button(tree, 'Refresh').props.onClick(); assert.equal(refreshCount, 0, 'Dirty refresh requires explicit discard');
  await button(tree, 'Save Changes').props.onClick(); tree = renderForm();
  assert.equal(saveCalls[0][0].modules.traffic, false); assert.equal(saveCalls[0][1], revision);
  assert.equal(text(find(tree, node => node.props?.role === 'alert')), 'Mock save failure');
  assert.equal(find(tree, node => node.props?.id === 'workspace-traffic').props.checked, false, 'Failure retains draft');
  button(tree, 'Discard').props.onClick(); tree = renderForm(); assert(button(tree, 'Save Changes').props.disabled);
  context = { ...context, loading: true }; tree = renderForm(); assert(button(tree, 'Save Changes').props.disabled); assert(button(tree, 'Refresh').props.disabled);
  console.log('PASS Settings provider/form: signed-out defaults, stale-account responses, saved appearance, failed-save retention, dirty/discard/refresh and accessible labels (mock React/network).');
})().catch(error => { console.error(error); process.exitCode = 1; });
