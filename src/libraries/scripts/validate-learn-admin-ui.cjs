// Execute the real Learn list/editor and URL-state hooks with mocked auth/network.
// No browser, HTTP server, database, storage or live account operation.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const element = (type, props, key) => ({ type, props: props ?? {}, key });
function load(file, modules = {}, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText, { exports, Error, URL, URLSearchParams, AbortController, AbortSignal, console,
    require: key => key === '@/components/admin/threed/multimedia/EntityAlbumsSection' ? { EntityAlbumsSection: 'EntityAlbumsSection' } : modules[key] ?? require(key), ...globals }, { filename: file });
  return exports;
}
function harness() {
  const slots = [], effects = []; let index = 0, dirty = false, component;
  const changed = (a, b) => !a || a.length !== b.length || a.some((value, i) => !Object.is(value, b[i]));
  const react = {
    useState(initial) {
      const i = index++; slots[i] ??= { value: typeof initial === 'function' ? initial() : initial };
      return [slots[i].value, update => { const value = typeof update === 'function' ? update(slots[i].value) : update;
        if (!Object.is(value, slots[i].value)) { slots[i].value = value; dirty = true; } }];
    },
    useRef(initial) { const i = index++; slots[i] ??= { current: initial }; return slots[i]; },
    useEffect(fn, deps) { const i = index++; if (!slots[i] || changed(slots[i].deps, deps)) effects.push(() => {
      slots[i]?.cleanup?.(); slots[i] = { deps, cleanup: fn() };
    }); },
    useMemo(fn, deps) { const i = index++; if (!slots[i] || changed(slots[i].deps, deps)) slots[i] = { deps, value: fn() }; return slots[i].value; },
    useSyncExternalStore(subscribe, get) {
      const [, update] = react.useState(0);
      react.useEffect(() => subscribe(() => update(value => value + 1)), [subscribe]);
      return get();
    },
  };
  return { react, render(fn = component) { component = fn;
    for (let attempt = 0; attempt < 30; attempt++) {
      index = 0; dirty = false; const tree = component(); effects.splice(0).forEach(effect => effect());
      if (!dirty) return tree;
    }
    throw new Error('Render loop');
  }, unmount() { slots.forEach(slot => slot.cleanup?.()); } };
}
const flush = () => new Promise(resolve => setImmediate(resolve));
const text = node => Array.isArray(node) ? node.map(text).join('') : node && typeof node === 'object' ? text(node.props?.children) : typeof node === 'string' || typeof node === 'number' ? String(node) : '';
const find = (node, predicate) => {
  if (Array.isArray(node)) { for (const child of node) { const result = find(child, predicate); if (result) return result; } }
  else if (node && typeof node === 'object') return predicate(node) ? node : find(node.props?.children, predicate);
};
const button = (tree, label) => find(tree, node => node.type === 'button' && (text(node).trim() === label || node.props['aria-label'] === label));
const field = (tree, label) => find(tree, node => node.props?.['aria-label'] === label);
const guide = (id = 1, override = {}) => ({ id, title: `Guide ${id}`, slug: `guide-${id}`, summary: 'Summary', content: '# Saved content',
  sortOrder: id, isActive: true, isPublished: false, revision: '8e57d4e7-f2a7-4481-966c-692ae4cc7001',
  createdAt: '2026-10-27T00:00:00Z', updatedAt: '2026-10-27T00:00:00Z', ...override });
const page = (rows, total = rows.length) => ({ success: true, data: rows.map(({ content, ...row }) => row), pagination: { total, limit: 25, offset: 0 } });
const contracts = load('src/libraries/services/learn/contracts.ts');
const input = load('src/libraries/services/learn/input.ts', { './contracts': contracts });
const client = load('src/components/admin/learn/learn-admin-client.ts');
function fixture(kind = 'list', id) {
  const h = harness(), requests = [], routes = [], listeners = new Map();
  let timers = [], confirmed = true, session = { status: 'authenticated', data: { user: { id: 'admin-a' } } };
  const add = (name, fn) => { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(fn); };
  const remove = (name, fn) => listeners.get(name)?.delete(fn);
  const location = new URL(`https://fixture.invalid/admin/learn${kind === 'edit' ? id ? `/${id}` : '/new' : ''}`);
  location.assign = url => routes.push({ method: 'document-assign', url });
  location.replace = url => routes.push({ method: 'document-replace', url });
  const window = { location, addEventListener: add, removeEventListener: remove,
    dispatchEvent: event => { listeners.get(event.type)?.forEach(fn => fn(event)); }, confirm: () => confirmed,
    history: { state: { __NA: true, fixture: 1 }, pushState(state, _title, url) { this.state = state; location.href = new URL(url, location).href; }, replaceState(state, _title, url) { this.state = state; location.href = new URL(url, location).href; } } };
  const globals = { window, document: { addEventListener: add, removeEventListener: remove }, Event, queueMicrotask,
    setTimeout: fn => { timers.push(fn); return fn; }, clearTimeout: fn => { timers = timers.filter(timer => timer !== fn); },
    fetch: (url, init = {}) => new Promise(resolve => requests.push({ url, init, resolve })) };
  const query = load('src/components/admin/shared/use-admin-list-query-state.ts', { react: h.react }, globals);
  const modules = { react: h.react, 'react/jsx-runtime': { jsx: element, jsxs: element },
    'next-auth/react': { useSession: () => session }, 'next/link': { default: 'link' },
    'next/navigation': { useRouter: () => ({ push: url => routes.push({ method: 'push', url }), replace: url => routes.push({ method: 'replace', url }) }) },
    'lucide-react': new Proxy({}, { get: (_, key) => `icon-${String(key)}` }),
    '@/components/admin/shared/use-admin-list-query-state': query,
    '@/components/admin/layout/AdminWorkspaceHeader': { AdminWorkspaceHeader: 'header', AdminWorkspaceLink: 'link' },
    '@/components/admin/threed/models/ModelFieldHelp': { ModelFieldHelp: 'help' },
    '@/components/ui/button': { Button: 'button' }, '@/components/ui/input': { Input: 'input' },
    '@/components/ui/textarea': { Textarea: 'textarea' }, '@/components/ui/label': { Label: 'label' }, '@/components/ui/switch': { Switch: 'switch' },
    '@/components/ui/table': Object.fromEntries(['Table', 'TableBody', 'TableCell', 'TableHead', 'TableHeader', 'TableRow'].map(name => [name, name])),
    '@/components/learn/LearnMarkdown': { LearnMarkdown: 'markdown' },
    '@/libraries/services/learn/contracts': contracts, '@/libraries/services/learn/input': input,
    './learn-admin-client': client };
  const app = load(`src/components/admin/learn/${kind === 'list' ? 'LearnGuidesList' : 'LearnGuideEditor'}.tsx`, modules, globals);
  const root = () => kind === 'list' ? app.LearnGuidesList() : app.LearnGuideEditor({ id });
  const entry = root();
  const render = () => h.render(() => entry.type(entry.props));
  return { render, root, requests, routes, listeners, location, h,
    tick() { timers.splice(0).forEach(timer => timer()); },
    session(value) { session = value; }, confirm(value) { confirmed = value; },
    async reply(payload, status = 200, request = requests.shift()) { assert(request, 'Expected a request'); request.resolve({ ok: status >= 200 && status < 300, status, json: async () => payload }); await flush(); return render(); },
    async query(value) { location.search = value; window.dispatchEvent(new Event('popstate')); return render(); },
    unload() { const event = { prevented: false, returnValue: undefined, preventDefault() { this.prevented = true; } }; listeners.get('beforeunload')?.forEach(fn => fn(event)); return event; },
    click(href, options = {}) {
      const anchor = { getAttribute: key => key === 'href' ? href : key === 'target' ? options.target : null, hasAttribute: key => key === 'download' && options.download };
      const event = { button: 0, target: { closest: () => anchor }, prevented: false, stopped: false, preventDefault() { this.prevented = true; }, stopImmediatePropagation() { this.stopped = true; }, ...options };
      listeners.get('click')?.forEach(fn => fn(event)); return event;
    },
  };
}

(async () => {
  // Real URL hook: query scopes immediately hide rows and selection, stale responses cannot win.
  const list = fixture(); let tree = list.render(); list.tick();
  assert(button(tree, 'Add Guide').props.disabled);
  tree = await list.reply(page([guide(1), guide(2)], 51));
  assert(!button(tree, 'Add Guide').props.disabled);
  assert.equal(button(tree, 'Add Guide').props.variant, 'success');
  assert.equal(button(tree, 'Import Starter Guides').props.variant, 'success', 'Starter import creates records and follows green creation styling');
  button(tree, 'Add Guide').props.onClick(); button(tree, 'Edit Guide 1').props.onClick(); button(tree, 'Guide 1').props.onClick();
  assert.deepEqual(list.routes, [{ method: 'document-assign', url: '/admin/learn/new' }, { method: 'document-assign', url: '/admin/learn/1' }, { method: 'document-assign', url: '/admin/learn/1' }], 'All list editor entries create a document history boundary');
  assert.deepEqual(Array.from(field(tree, 'Guides per page').props.children, node => node.props.value), [25, 50, 100, 200]);
  field(tree, 'Select guides on this page').props.onChange({ target: { checked: true } }); tree = list.render();
  assert(text(tree).includes('2 selected'));
  button(tree, 'Next').props.onClick(); await flush(); tree = list.render();
  assert(!text(tree).includes('Guide 1'), 'Previous page is hidden before its effect completes');
  assert(text(tree).includes('0 selected')); list.tick();
  let request = list.requests.shift(); assert.equal(new URL(request.url, 'https://fixture.invalid').searchParams.get('offset'), '25');
  tree = await list.reply(page([guide(26)], 51), 200, request);
  field(tree, 'Search Learn guides').props.onChange({ target: { value: 'first' } }); await flush(); list.render(); list.tick(); const stale = list.requests.shift();
  field(list.render(), 'Search Learn guides').props.onChange({ target: { value: 'second' } }); await flush(); list.render(); list.tick();
  tree = await list.reply(page([guide(5, { title: 'Second result' })]));
  tree = await list.reply(page([guide(4, { title: 'Stale result' })]), 200, stale);
  assert(text(tree).includes('Second result')); assert(!text(tree).includes('Stale result'));
  tree = await list.query('?limit=200&page=999999&sort=invalid&direction=sideways&isActive=true&isPublished=false');
  await flush(); tree = list.render(); list.tick(); request = list.requests.shift();
  const params = new URL(request.url, 'https://fixture.invalid').searchParams;
  assert.equal(params.get('limit'), '200'); assert(Number(params.get('offset')) <= 1000000);
  assert.equal(params.get('sort'), 'sortOrder'); assert.equal(params.get('direction'), 'asc');
  assert.equal(params.get('isActive'), 'true'); assert.equal(params.get('isPublished'), 'false');
  await list.reply(page([], 0), 200, request); await flush(); tree = list.render(); list.tick();
  assert.equal(list.location.searchParams.get('page'), null, 'Out-of-range page recovers through replace');
  tree = await list.reply(page([], 0)); assert(text(tree).includes('No guides match these filters.'));
  button(tree, 'Refresh').props.onClick(); list.render(); list.tick();
  tree = await list.reply({ success: false, error: 'Storage unavailable' }, 503);
  assert(text(tree).includes('Storage unavailable')); assert(!text(tree).includes('No guides match'));
  assert(button(tree, 'Add Guide').props.disabled);
  button(tree, 'Retry').props.onClick(); list.render(); list.tick(); tree = await list.reply(page([guide(1), guide(2)], 2));

  // Sequential bodyless revision-aware deletion: duplicate guard, partial result, refresh.
  field(tree, 'Select guides on this page').props.onChange({ target: { checked: true } }); tree = list.render();
  button(tree, 'Delete selected').props.onClick(); button(tree, 'Delete selected').props.onClick();
  list.render(); assert(list.unload().prevented, 'Pending list writes warn on a document Back/leave'); assert(list.click('/admin').prevented, 'Pending list writes block surrounding navigation');
  assert.equal(list.requests.length, 1); request = list.requests.shift();
  assert.equal(request.init.method, 'DELETE'); assert.equal(request.init.body, undefined);
  assert.equal(new URL(request.url, 'https://fixture.invalid').searchParams.get('revision'), guide().revision);
  await list.reply({ success: true, data: { id: 1 } }, 200, request);
  assert.equal(list.requests.length, 1, 'Second deletion starts only after first settles');
  tree = await list.reply({ success: false, error: 'Guide changed; reload it.' }, 409);
  assert.equal(find(tree, node => node.type === 'fieldset').props.disabled, false, 'Partial deletion releases the write guard');
  assert(text(tree).includes('0 selected'), 'Partial deletion clears the stale selection');
  assert(!button(tree, 'Edit Guide 1'), 'Mutation reload hides stale rows');
  list.tick();
  assert.equal(list.requests.length, 1, 'Partial deletion refreshes the saved records once');
  request = list.requests.shift();
  assert.equal(request.init.method, undefined, 'Mutation refresh reads rather than replaying deletions');
  tree = await list.reply(page([guide(2)]), 200, request);
  assert(!button(tree, 'Edit Guide 1'), 'Confirmed deleted guide is absent after refresh');
  assert(button(tree, 'Edit Guide 2'), 'Conflicted guide remains available for review');
  assert(button(tree, 'Delete selected').props.disabled, 'Retry requires a new explicit selection');
  button(tree, 'Import Starter Guides').props.onClick(); request = list.requests.shift();
  assert.equal(request.url, '/api/learn/guides/import-starters'); assert.equal(request.init.method, 'POST'); assert.equal(request.init.body, '{}');
  tree = await list.reply({ success: true, data: { imported: 3, skipped: 11 } }, 200, request);
  assert.equal(find(tree, node => node.type === 'fieldset').props.disabled, false, 'Import completion releases the write guard');
  list.tick();
  assert.equal(list.requests.length, 1, 'Starter import refreshes records once');
  request = list.requests.shift();
  assert.equal(request.init.method, undefined, 'Import refresh cannot replay the POST');
  tree = await list.reply(page([guide(2), guide(3)]), 200, request);
  assert(button(tree, 'Edit Guide 2'), 'Existing guide remains after import');
  assert(button(tree, 'Edit Guide 3'), 'Imported guide appears after refresh');
  field(tree, 'Select guides on this page').props.onChange({ target: { checked: true } }); tree = list.render(); button(tree, 'Delete selected').props.onClick();
  tree = await list.reply({ success: false, error: 'Super Admin access changed.' }, 403);
  assert.equal(list.requests.length, 0, 'Authority loss stops subsequent writes');
  assert(!text(tree).includes('Guide 2')); assert(button(tree, 'Add Guide').props.disabled);
  assert(text(tree).includes('active Super Admin'));
  const originalKey = list.root().key;
  list.session({ status: 'authenticated', data: { user: { id: 'admin-b' } } });
  assert.notEqual(list.root().key, originalKey, 'Account changes remount and clear editorial records');
  list.session({ status: 'loading', data: { user: { id: 'admin-b' } } }); assert.equal(list.root().type, 'p');
  list.h.unmount();

  // Editor never exposes a writable empty form after a denied/failed detail read.
  const failed = fixture('edit', 1); failed.render();
  tree = await failed.reply({ success: false, error: 'Not found' }, 404);
  assert(!field(tree, 'Guide title')); assert(button(tree, 'Save Changes').props.disabled);
  button(tree, 'Retry').props.onClick(); failed.render(); tree = await failed.reply({ success: true, data: guide() });
  assert.equal(field(tree, 'Guide title').props.value, 'Guide 1'); failed.h.unmount();
  const denied = fixture('edit'); denied.render(); tree = await denied.reply({ success: false, error: 'An active Super Admin account is required.' }, 403);
  assert(!field(tree, 'Guide title')); assert(button(tree, 'Create Guide').props.disabled); denied.h.unmount();

  const edit = fixture('edit', 1); edit.render(); tree = await edit.reply({ success: true, data: guide() });
  field(tree, 'Guide Markdown content').props.onChange({ target: { value: '# Draft kept' } }); tree = edit.render();
  assert.equal(find(tree, node => node.type === 'markdown').props.content, '# Draft kept');
  assert(edit.listeners.get('beforeunload')?.size);
  assert(edit.unload().prevented, 'A dirty editor warns when browser Back crosses its document entry');
  edit.confirm(false); button(tree, 'Cancel').props.onClick(); assert.equal(edit.routes.length, 0);
  assert(edit.click('/admin/learn').prevented); assert.equal(edit.routes.length, 0, 'Declined navigation preserves draft');
  button(tree, 'Save Changes').props.onClick(); button(tree, 'Save Changes').props.onClick(); assert.equal(edit.requests.length, 1);
  assert(edit.unload().prevented, 'Mutation ref guards a Back/leave before the busy rerender');
  assert(edit.click('/admin').prevented); assert.equal(edit.routes.length, 0);
  request = edit.requests.shift(); assert.equal(request.init.method, 'PUT');
  assert.equal(JSON.parse(request.init.body).revision, guide().revision); assert.equal(JSON.parse(request.init.body).content, '# Draft kept');
  tree = await edit.reply({ success: false, error: 'Temporary save failure' }, 503, request);
  assert.equal(field(tree, 'Guide Markdown content').props.value, '# Draft kept'); assert(text(tree).includes('Temporary save failure'));
  button(tree, 'Save Changes').props.onClick(); const incomplete = guide(); delete incomplete.content;
  tree = await edit.reply({ success: true, data: incomplete });
  assert.equal(field(tree, 'Guide Markdown content').props.value, '# Draft kept'); assert(text(tree).includes('save could not be confirmed'));
  button(tree, 'Save Changes').props.onClick(); tree = await edit.reply({ success: false, error: 'A newer version exists' }, 409);
  assert(button(tree, 'Save Changes').props.disabled); assert.equal(field(tree, 'Guide Markdown content').props.value, '# Draft kept');
  button(tree, 'Reload').props.onClick(); assert.equal(edit.requests.length, 0, 'Declining reload preserves draft');
  edit.confirm(true); button(tree, 'Reload').props.onClick(); edit.render();
  tree = await edit.reply({ success: true, data: guide(1, { revision: '8e57d4e7-f2a7-4481-966c-692ae4cc7002', content: '# Newer content' }) });
  assert.equal(field(tree, 'Guide Markdown content').props.value, '# Newer content');
  field(tree, 'Guide title').props.onChange({ target: { value: 'Saved title' } }); tree = edit.render();
  button(tree, 'Save Changes').props.onClick(); tree = await edit.reply({ success: true, data: guide(1, { title: 'Saved title', content: '# Newer content', revision: '8e57d4e7-f2a7-4481-966c-692ae4cc7003' }) });
  assert.equal(edit.routes.length, 0, 'Successful edit stays on editor'); assert(button(tree, 'Save Changes').props.disabled);
  field(tree, 'Guide title').props.onChange({ target: { value: 'Role revoked draft' } }); tree = edit.render(); button(tree, 'Save Changes').props.onClick();
  tree = await edit.reply({ success: false, error: 'An active Super Admin account is required.' }, 403);
  assert(!field(tree, 'Guide title')); assert(button(tree, 'Save Changes').props.disabled); edit.h.unmount();

  // New editor checks server access, defaults unpublished, allows duplicate-slug correction,
  // then replaces the create URL exactly once. Late unmounted saves cannot navigate.
  const create = fixture('edit'); create.render(); request = create.requests.shift(); assert.equal(request.url, '/api/learn/guides?limit=25&offset=0');
  tree = await create.reply(page([]), 200, request); assert.equal(field(tree, 'Guide Published').props.checked, false);
  field(tree, 'Guide title').props.onChange({ target: { value: 'A new Guide' } }); tree = create.render();
  assert.equal(field(tree, 'Guide slug').props.value, 'a-new-guide');
  button(tree, 'Create Guide').props.onClick(); request = create.requests.shift(); assert.equal(request.init.method, 'POST'); assert(!Object.hasOwn(JSON.parse(request.init.body), 'revision'));
  tree = await create.reply({ success: false, error: 'Slug already exists' }, 409, request);
  assert.equal(field(tree, 'Guide title').props.value, 'A new Guide');
  field(tree, 'Guide slug').props.onChange({ target: { value: 'a-new-guide-2' } }); tree = create.render(); assert(!button(tree, 'Create Guide').props.disabled);
  button(tree, 'Create Guide').props.onClick(); tree = await create.reply({ success: true, data: guide(20, { title: 'A new Guide', slug: 'a-new-guide-2', content: '' }) }, 201);
  assert.deepEqual(create.routes, [{ method: 'document-replace', url: '/admin/learn/20' }], 'Successful create replaces with a document entry, retaining Back protection');
  button(tree, 'Create Guide').props.onClick(); assert.equal(create.requests.length, 0); create.h.unmount();
  const late = fixture('edit'); late.render(); tree = await late.reply(page([])); field(tree, 'Guide title').props.onChange({ target: { value: 'Late' } }); tree = late.render(); button(tree, 'Create Guide').props.onClick(); request = late.requests.shift(); late.h.unmount();
  request.resolve({ ok: true, status: 201, json: async () => ({ success: true, data: guide(21) }) }); await flush(); assert.equal(late.routes.length, 0);

  const navigation = fixture('edit', 1); navigation.render(); tree = await navigation.reply({ success: true, data: guide() });
  assert(!navigation.unload().prevented, 'Clean editor does not show a browser warning');
  assert(!navigation.click('/admin/learn', { ctrlKey: true }).prevented, 'New-tab gestures retain the editor');
  field(tree, 'Guide title').props.onChange({ target: { value: 'Draft before leaving' } }); navigation.render();
  navigation.confirm(true); const click = navigation.click('/admin/learn');
  assert(click.prevented && click.stopped, 'Approved navigation stops the surrounding Next handler');
  assert.deepEqual(navigation.routes, [{ method: 'document-assign', url: 'https://fixture.invalid/admin/learn' }]);
  assert(!navigation.unload().prevented, 'Approved discard avoids a second native warning'); navigation.h.unmount();
  const cleanNavigation = fixture('edit', 1); cleanNavigation.render(); await cleanNavigation.reply({ success: true, data: guide() });
  cleanNavigation.click('/admin'); assert.equal(cleanNavigation.routes[0]?.method, 'document-assign', 'Even clean exits use document transitions'); cleanNavigation.h.unmount();

  console.log('PASS Learn Admin: real URL/list/editor hooks; bounded paging, stale/account isolation, partial sequential deletion, starter import, access denial, failed-load/draft/conflict guards, Markdown preview, document entry/exit and Back beforeunload boundary, create/edit save lifecycle (mock auth/network only).');
})().catch(error => { console.error(error); process.exitCode = 1; });
