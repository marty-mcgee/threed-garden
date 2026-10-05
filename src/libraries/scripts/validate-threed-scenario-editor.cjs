const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const nodes = value => Array.isArray(value) ? value.flatMap(nodes) : value && typeof value === 'object' ? [value, ...nodes(value.props?.children)] : [];
const jsx = (type, props) => ({ type, props });
const proxy = new Proxy({}, { get: (_, key) => String(key) });
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
function fixture(props) {
  const rt = runtime(), requests = [], navigation = [], notifications = [], listeners = new Map(), documentListeners = new Map();
  class Anchor { href = 'https://fixture.invalid/admin/threed/scenarios'; target = ''; hasAttribute() { return false; } closest() { return this; } }
  let confirmation = true, fail = false;
  const record = { id: 9, projectId: 15, threedId: 1, name: 'Soccer', slug: 'soccer', description: 'Practice', isActive: true, projectName: 'One', threedName: 'Garden', setup: { version: 1, kind: 'soccer', environmentMarkerId: 'marker-source', sensorGroupId: 'group-source' } };
  const router = { push: url => navigation.push(url), replace: url => navigation.push(url) };
  const request = async (url, options = {}) => {
    requests.push({ url, ...options });
    if (options.method === 'PATCH' || options.method === 'POST') return Response.json(fail ? { success: false, error: 'Rejected' } : { success: true, data: { ...record, ...JSON.parse(options.body), id: 9 } }, { status: fail ? 409 : 200 });
    let data = [];
    if (url === '/api/project') data = [{ id: 15, name: 'One' }, { id: 16, name: 'Two' }];
    else if (url.includes('scenarios?id=')) data = record;
    else if (url.includes('scenarios?limit=')) return Response.json({ success: true, data: [record], pagination: { total: 1 } });
    else if (url.includes('/modules?')) data = { threed: [{ id: 1, name: 'Garden' }] };
    return Response.json({ success: true, data });
  };
  const mocks = {
    react: rt.react, 'react/jsx-runtime': { jsx, jsxs: jsx }, 'next/navigation': { useRouter: () => router }, 'next/link': { default: 'Link' }, 'lucide-react': proxy,
    '@/components/admin/layout/AdminWorkspaceHeader': proxy, '@/components/ui/button': proxy, '@/components/ui/input': proxy, '@/components/ui/label': proxy, '@/components/ui/textarea': proxy,
    '@/components/ui/table': proxy, '@/components/ui/switch': proxy, '../models/ModelFieldHelp': proxy, './ScenarioEditorSurface': proxy, './ScenarioContinuationDialog': proxy,
    '@/components/ui/toast': { useToast: () => ({ showToast: (...args) => notifications.push(args), ToastComponent: null }) },
  };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/admin/threed/scenarios/ThreeDScenariosCRUD.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    exports, URLSearchParams, AbortController, AbortSignal, console, setTimeout, clearTimeout, fetch: request,
    HTMLAnchorElement: Anchor,
    window: { location: { search: '', assign: url => navigation.push(url) }, confirm: () => confirmation, addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name) },
    document: { visibilityState: 'visible', addEventListener: (name, fn) => documentListeners.set(name, fn), removeEventListener: name => documentListeners.delete(name) },
    require(name) { assert(name in mocks, name); return mocks[name]; },
  });
  rt.mount(() => exports.ThreeDScenariosCRUD(props));
  return { rt, requests, navigation, notifications, listeners, record, find: predicate => nodes(rt.value).find(predicate), confirm(value) { confirmation = value; }, fail(value) { fail = value; }, clickLink() {
    let prevented = false;
    documentListeners.get('click')?.({ target: new Anchor(), button: 0, preventDefault() { prevented = true; }, stopImmediatePropagation() {} });
    return prevented;
  } };
}
(async () => {
  const edit = fixture({ view: 'edit', scenarioId: 9 }); await edit.rt.flush();
  assert(edit.requests.some(request => request.url === '/api/threed/scenarios?id=9'));
  assert(!edit.requests.some(request => request.url.includes('scenarios?limit=')), 'Standalone editing does not read paginated list');
  const input = (f, id) => f.find(node => node.props?.id === id);
  const button = (f, label) => f.find(node => node.type === 'Button' && node.props.children === label);
  assert.equal(input(edit, 'scenario-project').props.disabled, true);
  input(edit, 'scenario-name').props.onChange({ target: { value: 'New name' } }); edit.rt.render();
  assert(edit.listeners.has('beforeunload')); edit.confirm(false); button(edit, 'Cancel').props.onClick(); assert.equal(edit.navigation.length, 0);
  assert(edit.clickLink()); assert.equal(edit.navigation.length, 0, 'Rejected navigation blocks surrounding page links');
  edit.fail(true); await button(edit, 'Save Changes').props.onClick(); await edit.rt.flush();
  assert.equal(input(edit, 'scenario-name').props.value, 'New name', 'Failed save retains draft');
  edit.fail(false); const save = button(edit, 'Save Changes'); save.props.onClick(); save.props.onClick(); await edit.rt.flush();
  assert.equal(edit.requests.filter(request => request.method === 'PATCH').length, 2, 'One failed then one successful save; repeated click locked');
  assert(!edit.listeners.has('beforeunload'));
  assert(!Object.hasOwn(JSON.parse(edit.requests.filter(request => request.method === 'PATCH').at(-1).body), 'setup'), 'Unchanged setup not rewritten');
  const create = fixture({ view: 'create' }); await create.rt.flush();
  const prompt = create.find(node => node.type === 'button' && typeof node.props.onClick === 'function');
  prompt.props.onClick(); await create.rt.flush();
  input(create, 'scenario-project').props.onChange({ target: { value: '16' } }); await create.rt.flush();
  input(create, 'scenario-threed').props.onChange({ target: { value: '1' } }); create.rt.render();
  button(create, 'Save Changes').props.onClick(); await create.rt.flush();
  const body = JSON.parse(create.requests.find(request => request.method === 'POST').body);
  assert.equal(body.projectId, 16); assert.equal(body.setup.environmentMarkerId, null);
  assert(create.navigation.includes('/admin/threed/scenarios/9'));
  const detail = fixture({ view: 'detail', scenarioId: 9 }); await detail.rt.flush();
  assert(detail.find(node => node.type === 'ScenarioContinuationDialog' && node.props.standalone), 'Admin View is a page surface');
  assert(!detail.requests.some(request => request.url.includes('threed-markers') || request.method), 'Read-only detail does not load editor choices or mutate');
  assert(!fs.readFileSync('src/components/admin/threed/scenarios/ThreeDScenariosCRUD.tsx', 'utf8').includes('Use in another Project'));
  const list = fixture({ view: 'list' }); await new Promise(resolve => setTimeout(resolve, 5)); await list.rt.flush();
  const viewAction = list.find(node => node.props?.['aria-label'] === 'View Soccer');
  assert.equal(viewAction.props.size, 'icon'); viewAction.props.onClick();
  assert(list.navigation.includes('/admin/threed/scenarios/9/view'), 'View icon routes to its dedicated page');
  const editAction = list.find(node => node.props?.['aria-label'] === 'Edit Soccer');
  assert.equal(editAction.props.size, 'icon'); editAction.props.onClick();
  assert(list.navigation.includes('/admin/threed/scenarios/9'));
  console.log('PASS Scenario standalone exact reads, binding locks, draft/cancel/busy guards, failed-save retention and create/read-only page workflows (offline).');
})().catch(error => { console.error(error); process.exitCode = 1; });
