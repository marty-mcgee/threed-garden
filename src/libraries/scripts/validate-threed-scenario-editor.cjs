const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const nodes = value => Array.isArray(value) ? value.flatMap(nodes) : value && typeof value === 'object' ? [value, ...nodes(value.props?.children)] : [];
const jsx = (type, props) => ({ type, props });
const proxy = new Proxy({}, { get: (_, key) => String(key) });
function load(file, mocks, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    exports, AbortController, console, ...globals, require(name) { assert(name in mocks, name); return mocks[name]; },
  });
  return exports;
}
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
function fixture(props, initialProjectFailure = false) {
  const rt = runtime(), requests = [], navigation = [], notifications = [], listeners = new Map(), documentListeners = new Map();
  class Anchor { href = 'https://fixture.invalid/admin/threed/scenarios'; target = ''; hasAttribute() { return false; } closest() { return this; } }
  let confirmation = true, fail = false, failList = false, failProjects = initialProjectFailure, failModules = false;
  const record = { id: 9, projectId: 15, threedId: 1, name: 'Soccer', slug: 'soccer', description: 'Practice', isActive: true, projectName: 'One', threedName: 'Garden', setup: { version: 1, kind: 'soccer', environmentMarkerId: 'marker-source', sensorGroupId: 'group-source' } };
  const router = { push: url => navigation.push(url), replace: url => navigation.push(url) };
  const request = async (url, options = {}) => {
    requests.push({ url, ...options });
    if (options.method === 'PATCH' || options.method === 'POST') return Response.json(fail ? { success: false, error: 'Rejected' } : { success: true, data: { ...record, ...JSON.parse(options.body), id: 9 } }, { status: fail ? 409 : 200 });
    let data = [];
    if (url === '/api/project') {
      if (failProjects) return Response.json({ success: false, error: 'Projects unavailable' }, { status: 500 });
      data = [{ id: 15, name: 'One' }, { id: 16, name: 'Two' }];
    }
    else if (url.includes('scenarios?id=')) data = record;
    else if (url.includes('scenarios?limit=')) return Response.json(failList ? { success: false, error: 'List unavailable' } : { success: true, data: [record], pagination: { total: 1 } }, { status: failList ? 500 : 200 });
    else if (url.includes('/modules?')) {
      if (failModules) return Response.json({ success: false, error: 'Modules unavailable' }, { status: 500 });
      data = { threed: [{ id: 1, name: 'Garden' }] };
    }
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
  return { rt, requests, navigation, notifications, listeners, record, find: predicate => nodes(rt.value).find(predicate), confirm(value) { confirmation = value; }, fail(value) { fail = value; }, failList(value) { failList = value; }, failProjects(value) { failProjects = value; }, failModules(value) { failModules = value; }, clickLink() {
    let prevented = false;
    documentListeners.get('click')?.({ target: new Anchor(), button: 0, preventDefault() { prevented = true; }, stopImmediatePropagation() {} });
    return prevented;
  } };
}
function inventoryFixture() {
  const rt = runtime(), requests = [], pending = [];
  const inventory = load('src/libraries/services/threed/scenarios/scenario-inventory.ts', {});
  const detail = load('src/components/admin/threed/scenarios/ScenarioContinuationDialog.tsx', {
    react: rt.react, 'react/jsx-runtime': { jsx, jsxs: jsx }, 'next/link': { default: 'Link' }, 'lucide-react': proxy,
    '@/components/admin/layout/AdminWorkspaceHeader': proxy, '@/components/ui/button': proxy, '@/components/ui/dialog': proxy,
    '../models/ModelFieldHelp': proxy, '@/libraries/services/threed/scenarios/scenario-inventory': inventory,
  }, { fetch(url, options) { requests.push({ url, ...options }); return new Promise(resolve => pending.push(resolve)); } });
  const scenario = { id: 9, projectId: 15, projectName: 'One', threedName: 'Garden', name: 'Explore', description: 'Explore the farm.' };
  rt.mount(() => detail.ScenarioContinuationDialog({ scenario, standalone: true, onClose() {} }));
  return { rt, requests, find: predicate => nodes(rt.value.type(rt.value.props)).find(predicate), async reply(data, error) {
    pending.shift()(Response.json({ success: !error, data, error }, { status: error ? 403 : 200 })); await rt.flush();
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
  const links = nodes(edit.find(node => node.type === 'ScenarioEditorSurface').props.actions);
  assert(links.some(node => node.props?.href === '/admin/threed/scenarios?projectId=15'));
  assert(links.some(node => node.props?.href === '/admin/threed/simulations?projectId=15'));
  assert(links.some(node => node.props?.href === '/dashboard/scene?projectId=15'));
  const choiceReads = edit.requests.filter(request => request.url.includes('threed-markers')).length;
  edit.find(node => node.type === 'Button' && nodes(node).some(child => child.type === 'RefreshCw')).props.onClick(); await edit.rt.flush();
  assert.equal(edit.requests.filter(request => request.url.includes('threed-markers')).length, choiceReads + 1);
  assert.equal(input(edit, 'scenario-name').props.value, 'New name', 'Reload choices preserves the draft');
  input(edit, 'scenario-slug').props.onChange({ target: { value: 'invalid--slug' } }); edit.rt.render();
  assert(button(edit, 'Save Changes').props.disabled, 'Invalid slug explains why Save is disabled');
  await button(edit, 'Save Changes').props.onClick(); await edit.rt.flush();
  assert.equal(edit.requests.filter(request => request.method).length, 0, 'Invalid input does not write');
  input(edit, 'scenario-slug').props.onChange({ target: { value: 'soccer' } }); edit.rt.render();
  edit.fail(true); await button(edit, 'Save Changes').props.onClick(); await edit.rt.flush();
  assert.equal(input(edit, 'scenario-name').props.value, 'New name', 'Failed save retains draft');
  edit.fail(false); const save = button(edit, 'Save Changes'); save.props.onClick(); save.props.onClick(); await edit.rt.flush();
  assert.equal(edit.requests.filter(request => request.method === 'PATCH').length, 2, 'One failed then one successful save; repeated click locked');
  assert(!edit.listeners.has('beforeunload'));
  assert(!Object.hasOwn(JSON.parse(edit.requests.filter(request => request.method === 'PATCH').at(-1).body), 'setup'), 'Unchanged setup not rewritten');
  button(edit, 'Cancel').props.onClick();
  assert(edit.navigation.includes('/admin/threed/scenarios?projectId=15'), 'Return to list keeps Project scope');
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
  const inventoryLoading = inventoryFixture();
  const actionLink = f => f.find(node => node.type === 'Link' && node.props.href === '/admin/projects/15');
  assert.equal(inventoryLoading.requests.length, 1);
  assert.equal(inventoryLoading.requests[0].url, '/api/project/assets?projectId=15&moduleType=threed');
  assert.equal(inventoryLoading.requests[0].cache, 'no-store');
  assert.equal(actionLink(inventoryLoading).props.children[0], 'Open Project assets', 'Loading keeps a useful Project action');
  assert(inventoryLoading.find(node => node.type === 'AdminWorkspaceLink' && node.props.href === '/admin/threed/scenarios/9'), 'Edit targets the exact Scenario');
  assert(!inventoryLoading.find(node => node.props?.href === '/admin/threed/scenarios'), 'No redundant Scenarios link');
  assert(inventoryLoading.find(node => node.type === 'ModelFieldHelp' && node.props.label === 'Current Project inventory'), 'Inventory scope guidance is available beside its title');
  assert(!inventoryLoading.find(node => node.props?.children === 'Next step'));
  assert(inventoryLoading.find(node => node.type === 'Button' && node.props.variant === 'success'), 'Project action uses the green Blueprint button');
  await inventoryLoading.reply([]);
  assert.equal(actionLink(inventoryLoading).props.children[0], 'Add the first Project asset');
  const partialInventory = inventoryFixture(); await partialInventory.reply([{ assetType: 'threed_characters' }]);
  assert.equal(actionLink(partialInventory).props.children[0], 'Add a Model to this Project');
  const populatedInventory = inventoryFixture(); await populatedInventory.reply([{ assetType: 'threed_models' }, { assetType: 'threed_characters' }]);
  assert.equal(actionLink(populatedInventory).props.children[0], 'Review Project assets');
  const failedInventory = inventoryFixture(); await failedInventory.reply(null, 'Project inventory unavailable.');
  assert(failedInventory.find(node => node.props?.role === 'alert'));
  assert.equal(actionLink(failedInventory).props.children[0], 'Open Project assets', 'Failed inventory is not presented as an empty Project');
  assert([inventoryLoading, partialInventory, populatedInventory, failedInventory].every(f => f.requests.length === 1 && !f.requests[0].method), 'Scenario inventory only reads Project assets; no Simulation request or mutation');
  assert(!fs.readFileSync('src/components/admin/threed/scenarios/ThreeDScenariosCRUD.tsx', 'utf8').includes('Use in another Project'));
  const list = fixture({ view: 'list' }); await new Promise(resolve => setTimeout(resolve, 5)); await list.rt.flush();
  const viewAction = list.find(node => node.props?.['aria-label'] === 'View Soccer');
  assert.equal(viewAction.props.size, 'icon'); viewAction.props.onClick();
  assert(list.navigation.includes('/admin/threed/scenarios/9/view'), 'View icon routes to its dedicated page');
  const editAction = list.find(node => node.props?.['aria-label'] === 'Edit Soccer');
  assert.equal(editAction.props.size, 'icon'); editAction.props.onClick();
  assert(list.navigation.includes('/admin/threed/scenarios/9'));
  const scoped = fixture({ view: 'list', projectId: '15' }); await new Promise(resolve => setTimeout(resolve, 5)); await scoped.rt.flush();
  assert(scoped.requests.filter(request => request.url.includes('scenarios?limit=')).every(request => new URL(request.url, 'https://fixture.invalid').searchParams.get('projectId') === '15'), 'Initial list is Project-scoped before choices load');
  assert(scoped.find(node => node.type === 'AdminWorkspaceLink' && node.props.href === '/admin/threed/simulations?projectId=15'));
  scoped.find(node => node.props?.['aria-label'] === 'Select Soccer').props.onChange({ target: { checked: true } }); scoped.rt.render();
  scoped.find(node => node.props?.['aria-label'] === 'Filter by availability').props.onChange({ target: { value: 'false' } }); scoped.rt.render();
  await new Promise(resolve => setTimeout(resolve, 5)); await scoped.rt.flush();
  assert(scoped.requests.at(-1).url.includes('isActive=false'));
  assert.equal(scoped.find(node => node.props?.['aria-label'] === 'Select Soccer').props.checked, false, 'Filter change clears page selection');
  scoped.failList(true);
  scoped.find(node => node.type === 'Button' && nodes(node).some(child => child.type === 'RefreshCw')).props.onClick(); scoped.rt.render();
  await new Promise(resolve => setTimeout(resolve, 5)); await scoped.rt.flush();
  assert(scoped.find(node => node.props?.role === 'alert'), 'List failure is visible');
  assert(scoped.find(node => node.type === 'span' && node.props.children?.[0] === 0), 'Failed list clears stale totals');
  scoped.failList(false); button(scoped, 'Retry').props.onClick(); scoped.rt.render();
  await new Promise(resolve => setTimeout(resolve, 5)); await scoped.rt.flush();
  assert(!scoped.find(node => node.props?.role === 'alert'));
  button(scoped, 'Reset filters').props.onClick(); scoped.rt.render();
  await new Promise(resolve => setTimeout(resolve, 5)); await scoped.rt.flush();
  const resetUrl = new URL(scoped.requests.at(-1).url, 'https://fixture.invalid');
  assert(!resetUrl.searchParams.has('projectId') && !resetUrl.searchParams.has('isActive'));
  assert(!scoped.requests.some(request => request.method), 'List navigation/filter/refresh never writes');
  const unavailableProject = fixture({ view: 'list', projectId: '99' }); await new Promise(resolve => setTimeout(resolve, 5)); await unavailableProject.rt.flush();
  assert(unavailableProject.find(node => node.props?.children === 'This Project is unavailable.'));
  button(unavailableProject, 'Reset filters').props.onClick(); await unavailableProject.rt.flush();
  assert(!unavailableProject.find(node => node.props?.children === 'This Project is unavailable.'), 'Reset filters clears only the unavailable scope warning');
  const projectFailure = fixture({ view: 'list', projectId: '15' }, true); await new Promise(resolve => setTimeout(resolve, 5)); await projectFailure.rt.flush();
  assert(projectFailure.find(node => node.props?.children === 'Projects unavailable'));
  projectFailure.failProjects(false);
  projectFailure.find(node => node.type === 'Button' && nodes(node).some(child => child.type === 'RefreshCw')).props.onClick(); await projectFailure.rt.flush();
  assert.equal(projectFailure.requests.filter(request => request.url === '/api/project').length, 2, 'Refresh also retries Project choices');
  assert(!projectFailure.find(node => node.props?.children === 'Projects unavailable'));
  const editorProjectFailure = fixture({ view: 'edit', scenarioId: 9 }, true); await editorProjectFailure.rt.flush();
  editorProjectFailure.failProjects(false);
  editorProjectFailure.find(node => node.type === 'Button' && nodes(node).some(child => child.type === 'RefreshCw')).props.onClick(); await editorProjectFailure.rt.flush();
  assert.equal(editorProjectFailure.requests.filter(request => request.url === '/api/project').length, 2, 'Reload choices also retries Projects');
  assert(!editorProjectFailure.find(node => node.props?.children === 'Projects unavailable'));
  const moduleRecovery = fixture({ view: 'create', projectId: '15' }); await moduleRecovery.rt.flush();
  moduleRecovery.find(node => node.type === 'button' && typeof node.props.onClick === 'function').props.onClick(); await moduleRecovery.rt.flush();
  input(moduleRecovery, 'scenario-threed').props.onChange({ target: { value: '1' } });
  input(moduleRecovery, 'scenario-name').props.onChange({ target: { value: 'Keep this draft' } }); moduleRecovery.rt.render();
  moduleRecovery.fail(true); await button(moduleRecovery, 'Save Changes').props.onClick(); await moduleRecovery.rt.flush();
  assert(moduleRecovery.find(node => node.props?.role === 'alert' && node.props.children === 'Rejected'));
  moduleRecovery.failModules(true);
  moduleRecovery.find(node => node.type === 'Button' && nodes(node).some(child => child.type === 'RefreshCw')).props.onClick(); moduleRecovery.rt.render();
  assert(input(moduleRecovery, 'scenario-threed').props.disabled, 'Module selection waits for reloaded options');
  await moduleRecovery.rt.flush();
  assert(moduleRecovery.find(node => node.props?.role === 'alert' && node.props.children === 'Modules unavailable'));
  assert(button(moduleRecovery, 'Save Changes').props.disabled, 'Unavailable module options block saving');
  moduleRecovery.failModules(false);
  moduleRecovery.find(node => node.type === 'Button' && nodes(node).some(child => child.type === 'RefreshCw')).props.onClick(); await moduleRecovery.rt.flush();
  assert.equal(moduleRecovery.requests.filter(request => request.url.includes('/modules?')).length, 3, 'Reload choices retries creation module choices');
  assert(!moduleRecovery.find(node => node.props?.children === 'Modules unavailable'), 'Successful retry clears module error');
  assert.equal(input(moduleRecovery, 'scenario-threed').props.value, '1');
  assert.equal(input(moduleRecovery, 'scenario-name').props.value, 'Keep this draft');
  assert(moduleRecovery.find(node => node.props?.role === 'alert' && node.props.children === 'Rejected'), 'Choice refresh preserves unrelated Save error');
  assert(!button(moduleRecovery, 'Save Changes').props.disabled, 'Recovered choices allow retrying the failed Save');
  assert.equal(moduleRecovery.requests.filter(request => request.method).length, 1, 'Choice recovery does not write');
  const routeMocks = {
    'react/jsx-runtime': { jsx, jsxs: jsx }, '@/components/admin/threed/scenarios/ThreeDScenariosCRUD': proxy,
    'next/navigation': { notFound() { throw new Error('NOT_FOUND'); }, redirect(url) { throw new Error(`REDIRECT:${url}`); } },
  };
  const route = load('src/app/admin/threed/scenarios/page.tsx', routeMocks).default;
  assert.equal((await route({ searchParams: Promise.resolve({ projectId: '15' }) })).props.projectId, '15');
  assert.equal((await route({ searchParams: Promise.resolve({}) })).props.projectId, undefined);
  for (const projectId of ['0', '-1', '1.5', '2147483648', ['15', '16']]) await assert.rejects(route({ searchParams: Promise.resolve({ projectId }) }), /NOT_FOUND/);
  await assert.rejects(route({ searchParams: Promise.resolve({ projectId: '15', create: '1' }) }), /REDIRECT:\/admin\/threed\/scenarios\/new\?projectId=15/);
  const createRoute = load('src/app/admin/threed/scenarios/new/page.tsx', routeMocks).default;
  await assert.rejects(createRoute({ searchParams: Promise.resolve({ projectId: ['15'] }) }), /NOT_FOUND/);
  console.log('PASS Scenario scoped lists/filter/refresh/retry, route bounds, exact reads, binding locks, draft-safe choice reload, slug validation, dirty/cancel/busy guards, failed-save retention and inventory navigation (offline).');
})().catch(error => { console.error(error); process.exitCode = 1; });
