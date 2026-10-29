// Actual Character list/form callbacks with in-memory responses; no browser/server/DB.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const proxy = new Proxy({}, { get: (_, key) => String(key) });
const jsx = (type, props) => ({ type, props });
const nodes = value => Array.isArray(value) ? value.flatMap(nodes) : value && typeof value === 'object' ? [value, ...nodes(value.props?.children)] : [];
const text = value => Array.isArray(value) ? value.map(text).join('') : value && typeof value === 'object' ? text(value.props?.children) : String(value ?? '');
function load(file, deps = {}, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText,
    { exports, console, Error, URLSearchParams, AbortController, ...globals, require(name) { if (name === '@/components/admin/shared/use-admin-list-query-state') return {useAdminListQueryState: (_route, _key, initial) => deps.react.useState(initial)}; assert(name in deps, name); return deps[name]; } });
  return exports;
}
const formCore = load('src/components/admin/threed/characters/character-admin-form-core.ts');
function fixture(view = 'list') {
  const slots = [], timers = new Map(), requests = [], deferred = []; let cursor = 0, effects, changed, tree, timerId = 0, deferLists = false, failList = false, failChoices = false;
  const same = (a, b) => a && b && a.length === b.length && a.every((x, i) => Object.is(x, b[i]));
  const react = {
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = { value: typeof initial === 'function' ? initial() : initial }; return [slots[i].value, next => { slots[i].value = typeof next === 'function' ? next(slots[i].value) : next; changed = true; }]; },
    useRef(value) { return slots[cursor++] ??= { current: value }; },
    useMemo(fn, deps) { const i = cursor++; if (!same(slots[i]?.deps, deps)) slots[i] = { deps, value: fn() }; return slots[i].value; },
    useEffect(fn, deps) { const i = cursor++; if (!same(slots[i]?.deps, deps)) effects.push(() => { slots[i]?.cleanup?.(); slots[i] = { deps, cleanup: fn() }; }); },
  };
  const record = { id: 11, characterId: 'CHAR-11', name: 'Kate', type: 'human', status: 'active', isActive: true, modelId: 88, scale: '2.5', positionX: '0', positionY: '0', positionZ: '0', model: { id: 88, modelName: 'Rig', modelType: 'fbx' } };
  const fetch = async (url, options = {}) => {
    assert(!options.method || options.method === 'GET', 'Only mocked reads expected');
    requests.push({ url, ...options });
    if (url.includes('/characters?limit=')) {
      const response = () => Response.json(failList ? { success: false, error: 'List unavailable' } : { success: true, data: [record], pagination: { total: 26 } }, { status: failList ? 503 : 200 });
      return deferLists ? new Promise(resolve => deferred.push({ resolve, response })) : response();
    }
    if (url === '/api/threed/characters?id=11') return Response.json({ success: true, data: record });
    if (url.includes('/models?view=selector')) return Response.json(failChoices ? { success: false, error: 'Choices unavailable' } : { success: true, data: [record.model], pagination: { total: 1 } }, { status: failChoices ? 503 : 200 });
    if (url === '/api/threed/models?id=88') return Response.json({ success: true, data: record.model });
    throw new Error('Unexpected request ' + url);
  };
  const deps = { react, 'react/jsx-runtime': { jsx, jsxs: jsx }, 'lucide-react': proxy,
    '@/components/admin/threed/models/ThreeDModelAssetPreview': proxy,
    '@/components/admin/threed/models/model-preview-requirements': { modelForPreview: value => value },
    '@/components/admin/threed/models/ModelFieldHelp': proxy,
    '@/libraries/services/threed/models/model-source-core': { readModelSource: () => 'character' },
    '../multimedia/EntityAlbumsSection': proxy,
    './use-character-page-guard': { useCharacterPageGuard: () => () => {} },
    './character-admin-form-core': formCore,
    '@/components/admin/layout/AdminWorkspaceHeader': proxy,
    '@/components/settings/ModuleAppearanceProvider': proxy,
    '@/components/admin/threed/models/ModelFileList': proxy,
    '@/components/admin/threed/animations/CharacterAnimationAssignments': proxy,
    '@/components/ui/toast': { useToast: () => ({ showToast() {}, ToastComponent: null }) },
  };
  for (const item of ['button', 'badge', 'table', 'dropdown-menu', 'input', 'label', 'textarea', 'select', 'switch']) deps['@/components/ui/' + item] = proxy;
  const module = load('src/components/admin/threed/characters/ThreeDCharactersCRUD.tsx', deps, { fetch,
    setTimeout(fn) { const id = ++timerId; timers.set(id, fn); return id; }, clearTimeout: id => timers.delete(id) });
  const render = () => { let n = 0; do { assert(++n < 30); changed = false; cursor = 0; effects = []; tree = module.ThreeDCharactersCRUD({ view, characterId: view === 'edit' ? 11 : undefined, scrollRecords: true }); effects.forEach(fn => fn()); } while (changed); return tree; };
  const flush = async () => { for (let i = 0; i < 4; i++) { for (const [id, fn] of timers) { timers.delete(id); await fn(); } await new Promise(resolve => setImmediate(resolve)); render(); } };
  render();
  return { render, flush, requests, find: predicate => nodes(tree).find(predicate), get tree() { return tree; }, failList(value) { failList = value; }, failChoices(value) { failChoices = value; }, deferLists(value) { deferLists = value; }, deferred, async dispatchTimers() { for (const [id, fn] of timers) { timers.delete(id); void fn(); } await new Promise(resolve => setImmediate(resolve)); } };
}
const byLabel = (f, label) => f.find(node => node.props?.['aria-label'] === label);
const button = (f, label) => f.find(node => node.type === 'Button' && text(node) === label);
(async () => {
  const list = fixture(); await list.flush();
  assert(list.find(node => node.type === 'AdminWorkspaceLink' && node.props.href === '/admin/threed/simulations'));
  assert.match(text(list.tree), /Active/);
  button(list, 'Next').props.onClick(); list.render(); await list.flush();
  assert(new URLSearchParams(list.requests.at(-1).url.split('?')[1]).get('offset') === '25');
  byLabel(list, 'Select Kate').props.onChange({ target: { checked: true } }); list.render();
  byLabel(list, 'Filter Characters by type').props.onChange({ target: { value: 'human' } }); list.render(); await list.flush();
  byLabel(list, 'Filter Characters by status').props.onChange({ target: { value: 'sleeping' } }); list.render(); await list.flush();
  byLabel(list, 'Filter Characters by active availability').props.onChange({ target: { value: 'false' } }); list.render(); await list.flush();
  const params = new URLSearchParams(list.requests.at(-1).url.split('?')[1]);
  assert.equal(params.get('type'), 'human'); assert.equal(params.get('status'), 'sleeping'); assert.equal(params.get('isActive'), 'false'); assert.equal(params.get('offset'), '0');
  assert.equal(byLabel(list, 'Select Kate').props.checked, false);
  button(list, 'Reset filters').props.onClick(); list.render(); await list.flush();
  const reset = new URLSearchParams(list.requests.at(-1).url.split('?')[1]);
  for (const key of ['type', 'status', 'isActive']) assert(!reset.has(key));
  list.failList(true); button(list, 'Refresh').props.onClick(); list.render(); await list.flush();
  assert.match(text(list.tree), /List unavailable/); assert(!byLabel(list, 'Select Kate'));
  list.failList(false); button(list, 'Retry').props.onClick(); list.render(); await list.flush(); assert(byLabel(list, 'Select Kate'));
  list.deferLists(true); button(list, 'Refresh').props.onClick(); list.render(); await list.dispatchTimers();
  const staleRequest = list.requests.at(-1);
  byLabel(list, 'Filter Characters by type').props.onChange({ target: { value: 'bird' } }); list.render(); await list.dispatchTimers();
  assert(staleRequest.signal.aborted); list.deferred[1].resolve(list.deferred[1].response()); await list.flush();
  list.deferred[0].resolve(Response.json({ success: true, data: [{ name: 'Stale' }], pagination: { total: 1 } })); await list.flush(); assert(!text(list.tree).includes('Stale'));

  const edit = fixture('edit'); await edit.flush();
  assert(!edit.requests.some(r => r.url.includes('/characters?limit=')), 'Editor does not load unused list');
  const field = id => edit.find(node => node.props?.id === id);
  field('edit-name').props.onChange({ target: { value: 'Unsaved Kate' } }); edit.render();
  assert(!button(edit, 'Save Changes').props.disabled);
  field('edit-metadata').props.onChange({ target: { value: '{' } }); edit.render();
  assert(button(edit, 'Save Changes').props.disabled); assert.match(text(edit.tree), /Metadata must be valid JSON/);
  field('edit-metadata').props.onChange({ target: { value: '{}' } }); edit.render();
  edit.failChoices(true); button(edit, 'Refresh Model choices').props.onClick(); edit.render(); assert(button(edit, 'Loading Model choices...').props.disabled); await edit.flush();
  assert.equal(field('edit-name').props.value, 'Unsaved Kate'); assert.equal(edit.find(node => node.type === 'Select' && node.props.value === '88').props.value, '88');
  assert.equal(edit.find(node => node.type === 'ThreeDModelAssetPreview').props.model.id, 88); assert.match(text(edit.tree), /Choices unavailable/);
  button(edit, 'Discard').props.onClick(); edit.render(); assert.equal(field('edit-name').props.value, 'Kate');
  const create = fixture('create'); await create.flush(); assert(button(create, 'Create Character').props.disabled); assert.match(text(create.tree), /Character ID and name are required/);
  console.log('PASS Character Admin conventions: real filters/paging/reset/refresh/stale reads, accessible status/navigation, inline validation and draft-preserving Model refresh (mocked reads only).');
})().catch(error => { console.error(error); process.exitCode = 1; });
