const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript'), path = require('node:path');
const jsx = (type, props) => ({ type, props }), proxy = new Proxy({}, { get: (_, name) => String(name) });
const nodes = value => Array.isArray(value) ? value.flatMap(nodes) : value && typeof value === 'object' ? [value, ...nodes(value.props?.children)] : [];
function load(file, deps = {}, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText,
    { exports, console, URLSearchParams, AbortController, AbortSignal, setTimeout, clearTimeout, crypto: require('node:crypto'), ...globals, require(name) {
      if (name in deps) return deps[name];
      assert(name.startsWith('.'), name); return load(path.resolve(path.dirname(file), name.endsWith('.ts') ? name : name + '.ts'));
    } }); return exports;
}
const input = load('src/libraries/services/threed/simulations/simulation-input.ts');
function runtime() {
  const slots = []; let cursor = 0, effects = [], changed = false, body, value;
  const same = (a, b) => a && b && a.length === b.length && a.every((x, i) => Object.is(x, b[i]));
  const react = {
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = { value: typeof initial === 'function' ? initial() : initial }; return [slots[i].value, next => { slots[i].value = typeof next === 'function' ? next(slots[i].value) : next; changed = true; }]; },
    useRef(initial) { return slots[cursor++] ??= { current: initial }; },
    useEffect(callback, deps) { const i = cursor++; if (!same(slots[i]?.deps, deps)) effects.push(() => { slots[i]?.cleanup?.(); slots[i] = { deps, cleanup: callback() }; }); },
  };
  const render = () => { let n = 0; do { assert(++n < 40); changed = false; cursor = 0; effects = []; value = body(); effects.forEach(effect => effect()); } while (changed); return value; };
  return { react, render, mount(fn) { body = fn; return render(); }, get value() { return value; }, async flush() { for (let i = 0; i < 4; i++) { await new Promise(resolve => setImmediate(resolve)); render(); } } };
}
function fixture(props, list = false) {
  const rt = runtime(), requests = [], navigation = [], notifications = [], listeners = new Map(), docListeners = new Map();
  let confirmation = true, failSave = false, failRead = props?.failRead ?? false;
  class Anchor { href = 'https://fixture.invalid/admin/threed/simulations'; target = ''; hasAttribute() { return false; } closest() { return this; } }
  const record = { id: 9, revision: 1, projectId: 15, threedId: 1, scenarioId: null, projectName: 'One', threedName: 'Garden', name: 'Plan', slug: 'plan', description: 'Practice', isActive: false, definition: input.emptySimulationDefinition(), actionCount: 0, observationCount: 0 };
  const choices = { scenarios: [], markers: [], groups: [] };
  const fetch = async (url, options = {}) => {
    requests.push({ url, ...options });
    if (options.method === 'PATCH' || options.method === 'POST') return Response.json(failSave ? { success: false, error: 'Changed remotely' } : { success: true, data: { ...record, ...JSON.parse(options.body), id: 9, revision: 2 } }, { status: failSave ? 409 : 200 });
    if (options.method === 'DELETE') return Response.json({ success: url.includes('id=9'), data: { id: 9 } }, { status: url.includes('id=9') ? 200 : 409 });
    if (url.includes('simulations?id=')) return Response.json({ success: !failRead, data: record, error: 'Unavailable' }, { status: failRead ? 404 : 200 });
    if (url.includes('simulations?limit=')) return Response.json({ success: true, data: [record, { ...record, id: 10, revision: 3, name: 'Other' }], pagination: { total: 2 } });
    const data = url === '/api/project' ? [{ id: 15, name: 'One' }, { id: 16, name: 'Two' }] : url.includes('/modules?') ? { threed: [{ id: 1, name: 'Garden' }] } : choices;
    return Response.json({ success: true, data });
  };
  const deps = { react: rt.react, 'react/jsx-runtime': { jsx, jsxs: jsx }, 'lucide-react': proxy, 'next/navigation': { useRouter: () => ({ push: url => navigation.push(url), replace: url => navigation.push(url) }) },
    '@/components/admin/layout/AdminWorkspaceHeader': proxy, '@/components/ui/button': proxy, '@/components/ui/input': proxy, '@/components/ui/label': proxy, '@/components/ui/textarea': proxy, '@/components/ui/switch': proxy, '@/components/ui/table': proxy,
    '../models/ModelFieldHelp': proxy, '@/libraries/services/threed/simulations/simulation-input': input, './SimulationDefinitionEditor': { SimulationDefinitionEditor: 'SimulationDefinitionEditor', emptySimulationChoices: choices },
    '@/components/ui/toast': { useToast: () => ({ showToast: (...args) => notifications.push(args), ToastComponent: null }) },
  };
  const module = load(`src/components/admin/threed/simulations/${list ? 'SimulationsList' : 'SimulationEditor'}.tsx`, deps, { fetch, HTMLAnchorElement: Anchor,
    window: { location: { search: '', assign: url => navigation.push(url) }, confirm: () => confirmation, addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name) },
    document: { addEventListener: (name, fn) => docListeners.set(name, fn), removeEventListener: name => docListeners.delete(name) },
  });
  rt.mount(() => list ? module.SimulationsList() : module.SimulationEditor(props));
  return { rt, requests, navigation, notifications, listeners, find: predicate => nodes(rt.value).find(predicate), confirm(value) { confirmation = value; }, fail(value) { failSave = value; }, failRead(value) { failRead = value; }, link() { let blocked = false; docListeners.get('click')?.({ target: new Anchor(), button: 0, preventDefault() { blocked = true; }, stopImmediatePropagation() {} }); return blocked; } };
}
const field = (f, id) => f.find(node => node.props?.id === id);
const button = (f, name) => f.find(node => node.type === 'Button' && node.props.children === name);
(async () => {
  const edit = fixture({ id: 9 }); await edit.rt.flush();
  assert(edit.requests.some(r => r.url === '/api/threed/simulations?id=9'));
  assert(!edit.requests.some(r => r.url.includes('simulations?limit=')));
  assert(field(edit, 'simulation-project').props.disabled && field(edit, 'simulation-module').props.disabled);
  field(edit, 'simulation-name').props.onChange({ target: { value: 'Changed' } }); edit.rt.render();
  edit.confirm(false); button(edit, 'Cancel').props.onClick(); assert.equal(edit.navigation.length, 0); assert(edit.link()); assert.equal(edit.navigation.length, 0); assert(edit.listeners.has('beforeunload'));
  edit.fail(true); await button(edit, 'Save Changes').props.onClick(); await edit.rt.flush();
  assert.equal(field(edit, 'simulation-name').props.value, 'Changed'); assert(edit.notifications.some(n => n[1] === 'error'));
  edit.fail(false); const save = button(edit, 'Save Changes'); save.props.onClick(); save.props.onClick(); await edit.rt.flush();
  assert.equal(edit.requests.filter(r => r.method === 'PATCH').length, 2, 'Failed request plus one guarded successful request');
  const payload = JSON.parse(edit.requests.filter(r => r.method === 'PATCH').at(-1).body); assert.equal(payload.revision, 1); assert(!Object.hasOwn(payload, 'projectId')); assert(!edit.listeners.has('beforeunload'));
  const view = fixture({ id: 9, readOnly: true }); await view.rt.flush(); assert(!button(view, 'Save Changes')); assert(field(view, 'simulation-name').props.disabled);
  const missing = fixture({ id: 9, failRead: true }); await missing.rt.flush(); assert(!button(missing, 'Save Changes'), 'Failed exact read does not show blank editor');
  const create = fixture({}); await create.rt.flush(); field(create, 'simulation-project').props.onChange({ target: { value: '15' } }); await create.rt.flush(); field(create, 'simulation-module').props.onChange({ target: { value: '1' } }); await create.rt.flush(); field(create, 'simulation-name').props.onChange({ target: { value: 'Draft' } }); create.rt.render();
  const definitionEditor = () => create.find(node => node.type === 'SimulationDefinitionEditor');
  definitionEditor().props.onChange({ version: 1, steps: [{ id: 'chosen', action: 'point', actorMarkerId: 'characters-9', targetMarkerId: 'models-5', timeoutMs: 30000, onFailure: 'stop' }], observations: [] }); create.rt.render();
  create.confirm(false); field(create, 'simulation-project').props.onChange({ target: { value: '16' } }); create.rt.render(); assert.equal(field(create, 'simulation-project').props.value, '15', 'Rejected Project switch preserves its definition');
  definitionEditor().props.onChange(input.emptySimulationDefinition()); create.rt.render(); create.confirm(true);
  await button(create, 'Save Changes').props.onClick(); await create.rt.flush(); assert(create.navigation.includes('/admin/threed/simulations/9?created=1')); assert.equal(JSON.parse(create.requests.find(r => r.method === 'POST').body).isActive, false);
  const list = fixture({}, true); await new Promise(resolve => setTimeout(resolve, 5)); await list.rt.flush();
  list.find(node => node.props?.['aria-label'] === 'View Plan').props.onClick(); assert(list.navigation.includes('/admin/threed/simulations/9/view'));
  list.find(node => node.props?.['aria-label'] === 'Edit Plan').props.onClick(); assert(list.navigation.includes('/admin/threed/simulations/9'));
  list.find(node => node.props?.['aria-label'] === 'Select current page of Simulations').props.onChange({ target: { checked: true } }); list.rt.render();
  const bulk = list.find(node => node.type === 'Button' && nodes(node.props.children).some(child => child.type === 'Trash2') && typeof node.props.children?.[1] === 'string');
  assert(bulk); await bulk.props.onClick(); await list.rt.flush();
  const deletes = list.requests.filter(r => r.method === 'DELETE'); assert.equal(deletes.length, 2); assert(deletes[1].url.includes('revision=3')); assert(list.notifications.some(n => n[0].includes('1 of 2') && n[1] === 'error'));
  const definitionModule = load('src/components/admin/threed/simulations/SimulationDefinitionEditor.tsx', { 'react/jsx-runtime': { jsx, jsxs: jsx }, 'lucide-react': proxy, '@/components/ui/button': proxy, '@/components/ui/input': proxy, '@/components/ui/label': proxy, '../models/ModelFieldHelp': proxy, '@/libraries/services/threed/simulations/simulation-input': input });
  let value = input.emptySimulationDefinition(); const render = (readOnly = false) => definitionModule.SimulationDefinitionEditor({ value, choices: { markers: [], groups: [], scenarios: [] }, readOnly, onChange: next => { value = next; } });
  const action = tree => nodes(tree).find(node => node.type === 'Button' && node.props.children?.[1] === ' Add Action');
  action(render()).props.onClick(); action(render()).props.onClick(); const first = value.steps[0].id;
  nodes(render()).find(node => node.props?.['aria-label'] === 'Move Action 1 down').props.onClick(); assert.equal(value.steps[1].id, first);
  nodes(render()).find(node => node.props?.['aria-label'] === 'Remove Action 1').props.onClick(); assert.equal(value.steps.length, 1); assert(!action(render(true)));
  value.steps[0].targetMarkerId = 'models-5'; nodes(render()).find(node => node.props?.id === `action-${value.steps[0].id}`).props.onChange({ target: { value: 'watering' } }); assert.equal(value.steps[0].targetMarkerId, '', 'Planting Actions clear incompatible targets');
  console.log('PASS: Simulation exact editor reads, immutable binding, failed-save retention, dirty navigation, double-save locks, create/View routes, revision-aware partial bulk deletes and Action reorder callbacks (offline).');
})().catch(e => { console.error(e); process.exitCode = 1; });
