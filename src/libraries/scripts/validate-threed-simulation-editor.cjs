const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript'), path = require('node:path');
const jsx = (type, props) => ({ type, props }), proxy = new Proxy({}, { get: (_, name) => String(name) });
const nodes = value => Array.isArray(value) ? value.flatMap(nodes) : value && typeof value === 'object' ? [value, ...nodes(value.props?.children)] : [];
function load(file, deps = {}, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText,
    { exports, console, URLSearchParams, AbortController, AbortSignal, setTimeout, clearTimeout, crypto: require('node:crypto'), ...globals, require(name) {
      if (name === '@/components/admin/shared/use-admin-list-query-state') return { useAdminListQueryState: (_route, _key, initial) => deps.react.useState(initial) };
      if (name in deps) return deps[name];
      assert(name.startsWith('.'), name); return load(path.resolve(path.dirname(file), name.endsWith('.ts') ? name : name + '.ts'));
    } }); return exports;
}
const input = load('src/libraries/services/threed/simulations/simulation-input.ts');
const definitionModule = load('src/components/admin/threed/simulations/SimulationDefinitionEditor.tsx', { 'react/jsx-runtime': { jsx, jsxs: jsx }, 'lucide-react': proxy, '@/components/ui/button': proxy, '@/components/ui/badge': proxy, '@/components/ui/input': proxy, '@/components/ui/label': proxy, '../models/ModelFieldHelp': proxy, '@/libraries/services/threed/simulations/simulation-input': input });
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
  const record = { id: 9, revision: 1, projectId: 15, threedId: 1, projectName: 'One', threedName: 'Garden', name: 'Plan', slug: 'plan', description: 'Practice', isActive: false, definition: input.emptySimulationDefinition(), actionCount: 0, observationCount: 0 };
  assert(!fs.readFileSync('src/components/admin/threed/simulations/SimulationEditor.tsx','utf8').includes('simulation-scenario'));
  const choices = { markers: [{ markerId: 'characters-9', markerType: 'characters', name: 'Kate', movableCharacter: true }, { markerId: 'models-5', markerType: 'models', name: 'Ball', movableBall: true }], groups: [] };
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
    '@/components/admin/shared/AdminRelationshipBadge': proxy,
    '@/components/admin/layout/AdminWorkspaceHeader': proxy, '@/components/ui/button': proxy, '@/components/ui/badge': proxy, '@/components/ui/input': proxy, '@/components/ui/label': proxy, '@/components/ui/textarea': proxy, '@/components/ui/switch': proxy, '@/components/ui/table': proxy,
    '../models/ModelFieldHelp': proxy, '@/libraries/services/threed/simulations/simulation-input': input, './SimulationPreview': { SimulationPreview: 'SimulationPreview' }, './SimulationDefinitionEditor': { ...definitionModule, SimulationDefinitionEditor: 'SimulationDefinitionEditor', emptySimulationChoices: definitionModule.emptySimulationChoices },
    '@/components/ui/toast': { useToast: () => ({ showToast: (...args) => notifications.push(args), ToastComponent: null }) },
  };
  const module = load(`src/components/admin/threed/simulations/${list ? 'SimulationsList' : 'SimulationEditor'}.tsx`, deps, { fetch, HTMLAnchorElement: Anchor,
    window: { location: { search: props?.search ?? '', assign: url => navigation.push(url) }, confirm: () => confirmation, addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name) },
    document: { addEventListener: (name, fn) => docListeners.set(name, fn), removeEventListener: name => docListeners.delete(name) },
  });
  rt.mount(() => list ? module.SimulationsList(props) : module.SimulationEditor(props));
  return { rt, requests, navigation, notifications, listeners, find: predicate => nodes(rt.value).find(predicate), confirm(value) { confirmation = value; }, fail(value) { failSave = value; }, failRead(value) { failRead = value; }, link() { let blocked = false; docListeners.get('click')?.({ target: new Anchor(), button: 0, preventDefault() { blocked = true; }, stopImmediatePropagation() {} }); return blocked; } };
}
const field = (f, id) => f.find(node => node.props?.id === id);
const button = (f, name) => f.find(node => node.type === 'Button' && node.props.children === name);
(async () => {
  const routeDeps = {
    'next/navigation': { notFound() { throw new Error('not-found'); }, redirect(destination) { throw Object.assign(new Error('redirect'), { destination }); } },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    '@/components/admin/threed/simulations/SimulationEditor': { SimulationEditor: 'SimulationEditor' },
  };
  const legacyView = load('src/app/dashboard/simulations/[id]/page.tsx', routeDeps).default;
  const legacyNew = load('src/app/dashboard/simulations/new/page.tsx', routeDeps).default;
  const adminView = load('src/app/admin/threed/simulations/[id]/view/page.tsx', routeDeps).default;
  const adminNew = load('src/app/admin/threed/simulations/new/page.tsx', routeDeps).default;
  const redirected = async (route, props) => {
    try { await route(props); assert.fail('Compatibility routes must redirect without rendering an editor'); }
    catch (error) { assert.equal(error.message, 'redirect'); return new URL(error.destination, 'https://fixture.invalid'); }
  };
  let target = await redirected(legacyView, { params: Promise.resolve({ id: '4' }), searchParams: Promise.resolve({ created: '1', projectId: '999', next: 'https://other.invalid' }) });
  assert.equal(target.pathname + target.search, '/admin/threed/simulations/4?created=1', 'Legacy exact links land on Admin Edit and retain only creation feedback');
  target = await redirected(legacyView, { params: Promise.resolve({ id: '4' }), searchParams: Promise.resolve({ created: ['1', '1'] }) });
  assert.equal(target.pathname + target.search, '/admin/threed/simulations/4', 'Repeated creation flags cannot inject redirect state');
  for (const id of ['0', '-1', '4junk', '1.2', '2147483648', '9007199254740992']) {
    await assert.rejects(legacyView({ params: Promise.resolve({ id }), searchParams: Promise.resolve({}) }), /not-found/);
    await assert.rejects(adminView({ params: Promise.resolve({ id }) }), /not-found/);
  }
  target = await redirected(legacyNew, { searchParams: Promise.resolve({}) });
  assert.equal(target.pathname + target.search, '/admin/threed/simulations/new');
  const draftQuery = { projectId: '16', recipe: 'soccer', threedId: '1', actorMarkerId: 'characters-9', ballMarkerId: 'models-5', sensorGroupId: 'goals' };
  target = await redirected(legacyNew, { searchParams: Promise.resolve({ ...draftQuery, scenarioId: '7', created: '1', next: '//other.invalid' }) });
  assert.equal(target.pathname, '/admin/threed/simulations/new');
  assert.deepEqual(Object.fromEntries(target.searchParams), draftQuery, 'Compatibility navigation preserves only supported draft context');
  const nativeDraft = await adminNew({ searchParams: Promise.resolve(Object.fromEntries(target.searchParams)) });
  assert.equal(nativeDraft.props.projectId, 16);
  assert.deepEqual(JSON.parse(JSON.stringify(nativeDraft.props.initialSoccerDraft)), { threedId: 1, actorMarkerId: 'characters-9', ballMarkerId: 'models-5', sensorGroupId: 'goals' });
  for (const key of Object.keys(draftQuery)) {
    const repeated = { ...draftQuery, [key]: [draftQuery[key], draftQuery[key]] };
    await assert.rejects(legacyNew({ searchParams: Promise.resolve(repeated) }), /not-found/);
    await assert.rejects(adminNew({ searchParams: Promise.resolve(repeated) }), /not-found/);
  }
  for (const badQuery of [{ projectId: '16oops' }, { projectId: '2147483648' }, { ...draftQuery, threedId: '0' }, { ...draftQuery, actorMarkerId: '<invalid>' }]) {
    let forwarded;
    try { forwarded = await legacyNew({ searchParams: Promise.resolve(badQuery) }); }
    catch (error) {
      if (error.message === 'not-found') continue;
      assert.equal(error.message, 'redirect');
      forwarded = Object.fromEntries(new URL(error.destination, 'https://fixture.invalid').searchParams);
    }
    await assert.rejects(adminNew({ searchParams: Promise.resolve(forwarded) }), /not-found/, 'Admin validates forwarded draft values before rendering');
  }
  const canonicalView = await redirected(adminView, { params: Promise.resolve({ id: '4' }), searchParams: Promise.resolve({ created: '1', next: '//other.invalid' }) });
  assert.equal(canonicalView.pathname + canonicalView.search, '/admin/threed/simulations/4?created=1');
  const repeated = await redirected(adminView, { params: Promise.resolve({ id: '4' }), searchParams: Promise.resolve({ created: ['1', '1'] }) });
  assert.equal(repeated.search, '');
  const edit = fixture({ id: 9 }); await edit.rt.flush();
  assert(edit.requests.some(r => r.url === '/api/threed/simulations?id=9'));
  assert(!edit.requests.some(r => r.url.includes('simulations?limit=')));
  assert(field(edit, 'simulation-project').props.disabled && field(edit, 'simulation-module').props.disabled);
  assert(edit.find(node => node.type === 'AdminWorkspaceLink' && node.props.children === 'Simulations').props.href === '/admin/threed/simulations?projectId=15');
  assert(edit.find(node => node.type === 'AdminWorkspaceLink' && node.props.children === 'Results').props.href === '/admin/threed/simulation-results?projectId=15&simulationId=9');
  assert(edit.find(node => node.type === 'AdminWorkspaceLink' && node.props.children === 'Project Scene').props.href === '/dashboard/scene?projectId=15');
  field(edit, 'simulation-name').props.onChange({ target: { value: 'Changed' } }); edit.rt.render();
  edit.confirm(false); button(edit, 'Cancel').props.onClick(); assert.equal(edit.navigation.length, 0); assert(edit.link()); assert.equal(edit.navigation.length, 0); assert(edit.listeners.has('beforeunload'));
  edit.fail(true); await button(edit, 'Save Changes').props.onClick(); await edit.rt.flush();
  assert.equal(field(edit, 'simulation-name').props.value, 'Changed'); assert(edit.notifications.some(n => n[1] === 'error'));
  edit.fail(false); const save = button(edit, 'Save Changes'); save.props.onClick(); save.props.onClick(); await edit.rt.flush();
  assert.equal(edit.requests.filter(r => r.method === 'PATCH').length, 2, 'Failed request plus one guarded successful request');
  const payload = JSON.parse(edit.requests.filter(r => r.method === 'PATCH').at(-1).body); assert.equal(payload.revision, 1); assert(!Object.hasOwn(payload, 'projectId')); assert(!edit.listeners.has('beforeunload'));
  assert.equal(edit.navigation.length, 0, 'Saving an existing definition stays in its editor');
  const view = fixture({ id: 9, readOnly: true, search: '?created=1' }); await view.rt.flush(); assert(!button(view, 'Save Changes')); assert(field(view, 'simulation-name').props.disabled);
  assert.equal(view.find(node => node.type === 'AdminWorkspaceLink' && node.props.children === 'Edit').props.href, '/admin/threed/simulations/9', 'Admin View retains an explicit Edit action');
  assert(view.find(node => node.type === 'SimulationPreview'), 'Admin View retains the isolated preview');
  assert(view.notifications.some(note => note[0] === 'Simulation created.' && note[1] === 'success'), 'The destination displays successful creation feedback');
  assert(!view.requests.some(request => request.method), 'Opening Admin View performs reads only');
  const missing = fixture({ id: 9, failRead: true }); await missing.rt.flush(); assert(!button(missing, 'Save Changes'), 'Failed exact read does not show blank editor');
  const create = fixture({}); await create.rt.flush(); field(create, 'simulation-project').props.onChange({ target: { value: '15' } }); await create.rt.flush(); field(create, 'simulation-module').props.onChange({ target: { value: '1' } }); await create.rt.flush(); field(create, 'simulation-name').props.onChange({ target: { value: 'Draft' } }); create.rt.render();
  assert(!button(create, 'Save Changes').props.disabled, 'An inactive empty draft can be saved');
  const activeDraftHint = 'Add an Action to save an active Simulation, or turn Active off to save a draft.';
  field(create, 'simulation-active').props.onCheckedChange(true); create.rt.render();
  assert(button(create, 'Save Changes').props.disabled, 'Active empty definitions cannot be saved');
  assert(create.find(node => node.props?.role === 'status' && node.props.children === activeDraftHint), 'The blocked save explains how to continue');
  button(create, 'Save Changes').props.onClick(); await create.rt.flush();
  assert(!create.requests.some(request => request.method === 'POST'), 'Direct save callback also rejects active empty definitions');
  field(create, 'simulation-active').props.onCheckedChange(false); create.rt.render();
  assert(!button(create, 'Save Changes').props.disabled, 'Turning Active off restores draft saving');
  assert(!create.find(node => node.props?.children === activeDraftHint));
  const soccer = fixture({ projectId: 15, initialSoccerDraft: { threedId: 1, actorMarkerId: 'kate', ballMarkerId: 'ball', sensorGroupId: 'goals' } }); await soccer.rt.flush();
  const recipe = soccer.find(node => node.type === 'SimulationDefinitionEditor').props.value;
  const preview = soccer.find(node => node.type === 'SimulationPreview');
  assert.equal(preview.props.definition, recipe, 'Preview uses the current draft, not a second saved record');
  assert.equal(preview.props.context, '15:1:0');
  assert.equal(recipe.steps[0].action, 'runToTarget'); assert.equal(recipe.steps[1].action, 'kickBall'); assert.equal(recipe.steps[1].actorMarkerId, 'kate');
  assert.equal(field(soccer, 'simulation-name').props.value, 'Run to target ball then kick the ball');
  assert(!soccer.requests.some(request => request.method === 'POST'), 'Preparing the Soccer recipe never writes or executes');
  const definitionEditor = () => create.find(node => node.type === 'SimulationDefinitionEditor');
  definitionEditor().props.onChange({ version: 1, steps: [{ id: 'chosen', action: 'point', actorMarkerId: 'characters-9', targetMarkerId: 'models-5', timeoutMs: 30000, onFailure: 'stop' }], observations: [] }); create.rt.render();
  field(create, 'simulation-active').props.onCheckedChange(true); create.rt.render();
  assert(!button(create, 'Save Changes').props.disabled, 'A complete Action permits active definition saving');
  assert(create.find(node => node.type === 'Badge' && node.props.children === 'Definition / preview only'), 'Unsupported Scene actions remain valid savable definitions with explicit guidance');
  assert(!create.find(node => node.props?.children === activeDraftHint));
  field(create, 'simulation-active').props.onCheckedChange(false); create.rt.render();
  create.confirm(false); field(create, 'simulation-project').props.onChange({ target: { value: '16' } }); create.rt.render(); assert.equal(field(create, 'simulation-project').props.value, '15', 'Rejected Project switch preserves its definition');
  definitionEditor().props.onChange(input.emptySimulationDefinition()); create.rt.render(); create.confirm(true);
  await button(create, 'Save Changes').props.onClick(); await create.rt.flush(); assert(create.navigation.includes('/admin/threed/simulations/9?created=1')); assert.equal(JSON.parse(create.requests.find(r => r.method === 'POST').body).isActive, false);
  const list = fixture({}, true); await new Promise(resolve => setTimeout(resolve, 5)); await list.rt.flush();
  assert(!list.find(node => node.props?.['aria-label'] === 'View Plan'));
  list.find(node => node.props?.['aria-label'] === 'Edit Plan').props.onClick(); assert(list.navigation.includes('/admin/threed/simulations/9'));
  list.find(node => node.props?.['aria-label'] === 'Select current page of Simulations').props.onChange({ target: { checked: true } }); list.rt.render();
  const bulk = list.find(node => node.type === 'Button' && nodes(node.props.children).some(child => child.type === 'Trash2') && typeof node.props.children?.[1] === 'string');
  assert(bulk); await bulk.props.onClick(); await list.rt.flush();
  const deletes = list.requests.filter(r => r.method === 'DELETE'); assert.equal(deletes.length, 2); assert(deletes[1].url.includes('revision=3')); assert(list.notifications.some(n => n[0].includes('1 of 2') && n[1] === 'error'));
  let value = input.emptySimulationDefinition(); const render = (readOnly = false) => definitionModule.SimulationDefinitionEditor({ value, choices: { markers: [], groups: [] }, readOnly, onChange: next => { value = next; } });
  const action = tree => nodes(tree).find(node => node.type === 'Button' && node.props.children?.[1] === ' Add Action');
  action(render()).props.onClick(); action(render()).props.onClick(); const first = value.steps[0].id;
  nodes(render()).find(node => node.props?.['aria-label'] === 'Move Action 1 down').props.onClick(); assert.equal(value.steps[1].id, first);
  nodes(render()).find(node => node.props?.['aria-label'] === 'Remove Action 1').props.onClick(); assert.equal(value.steps.length, 1); assert(!action(render(true)));
  value.steps[0].targetMarkerId = 'models-5'; nodes(render()).find(node => node.props?.id === `action-${value.steps[0].id}`).props.onChange({ target: { value: 'watering' } }); assert.equal(value.steps[0].targetMarkerId, '', 'Planting Actions clear incompatible targets');
  const common = { actorMarkerId: '', targetMarkerId: '', timeoutMs: 30000, onFailure: 'stop' };
  value = { version: 1, steps: [{ ...common, id: 'run', action: 'runToTarget' }, { ...common, id: 'kick', action: 'kickBall' }, { ...common, id: 'other', action: 'point', actorMarkerId: 'other-actor' }], observations: [{ id: 'goals', kind: 'sensor-group', sensorGroupId: 'goals' }] };
  const participants = () => definitionModule.SimulationDefinitionEditor({ value, onChange: next => { value = next; }, choices: { markers: [{ markerId: 'kate', markerType: 'characters', name: 'Kate', movableCharacter: true }, { markerId: 'ball', markerType: 'models', name: 'Ball', movableBall: true }], groups: [{ id: 'goals', name: 'Goals' }], sensors: [{ ownerMarkerId: 101, id: 'left', name: 'Left', ownerName: 'Field', groupId: 'goals', behavior: 'counter' }] } });
  assert(nodes(participants()).some(node => node.type === 'optgroup' && node.props.label === 'Scene runner: Run and Kick'));
  assert(nodes(participants()).some(node => node.type === 'optgroup' && node.props.label === 'Definition / animation preview only'));
  assert(nodes(participants()).find(node => node.props?.id === 'actor-run').props['aria-invalid'], 'Missing and incompatible participants are visibly invalid');
  nodes(participants()).find(node => node.props?.id === 'actor-run').props.onChange({ target: { value: 'kate' } });
  nodes(participants()).find(node => node.props?.id === 'target-run').props.onChange({ target: { value: 'ball' } });
  assert.equal(value.steps[0].actorMarkerId, 'kate'); assert.equal(value.steps[0].targetMarkerId, 'ball'); assert.equal(value.steps[1].actorMarkerId, '', 'Other Actions retain independent bindings'); assert.equal(value.steps[2].actorMarkerId, 'other-actor');
  nodes(participants()).find(node => node.type === 'input' && node.props.type === 'checkbox' && node.props.checked).props.onChange({ target: { checked: false } });
  assert.equal(value.observations[0].sensors.length, 0);
  const checks = nodes(participants()).filter(node => node.type === 'input' && node.props.type === 'checkbox');
  checks[1].props.onChange({ target: { checked: true } }); assert.equal(value.observations[0].sensors[0].ownerMarkerId, 101);
  nodes(participants()).find(node => node.props?.id === 'action-run').props.onChange({ target: { value: 'kickBall' } }); assert.equal(value.steps[0].actorMarkerId, 'kate'); assert.equal(value.steps[0].targetMarkerId, 'ball'); assert(nodes(participants()).some(node => node.props?.id === 'actor-run'), 'All Actions retain inline selectors');
  const unfinished = fixture({ projectId: 15, initialSoccerDraft: { threedId: 1, actorMarkerId: '', ballMarkerId: '', sensorGroupId: 'goals' } }); await unfinished.rt.flush();
  assert(button(unfinished, 'Save Changes').props.disabled, 'Incomplete participant references block Save with visible guidance');
  assert(field(unfinished, 'simulation-save-status').props.children.includes('Action 1: choose an available movable Character'), 'Save feedback identifies the incomplete Action');
  const beforeInvalidSave = unfinished.requests.length;
  button(unfinished, 'Save Changes').props.onClick(); await unfinished.rt.flush();
  assert.equal(unfinished.requests.length, beforeInvalidSave, 'Invalid definitions never issue a write');
  assert(unfinished.notifications.length > 0, 'Invalid save reports validation through Toast');
  const scoped = fixture({ initialProjectId: 15 }, true); await new Promise(resolve => setTimeout(resolve, 5)); await scoped.rt.flush();
  assert(scoped.requests.some(request => request.url.includes('simulations?limit=') && request.url.includes('projectId=15')), 'Project context survives list navigation');
  scoped.find(node => node.props?.['aria-label'] === 'Results for Plan').props.onClick(); assert(scoped.navigation.includes('/admin/threed/simulation-results?projectId=15&simulationId=9'));
  scoped.find(node => node.props?.['aria-label'] === 'Open Project Scene for Plan').props.onClick(); assert(scoped.navigation.includes('/dashboard/scene?projectId=15'));
  scoped.find(node => node.props?.['aria-label'] === 'Filter Simulations by availability').props.onChange({ target: { value: 'false' } }); scoped.rt.render(); await new Promise(resolve => setTimeout(resolve, 5)); await scoped.rt.flush();
  assert(scoped.requests.some(request => request.url.includes('isActive=false') && request.url.includes('projectId=15')), 'Availability and Project filters combine');
  button(scoped, 'Reset filters').props.onClick(); scoped.rt.render(); await new Promise(resolve => setTimeout(resolve, 5)); await scoped.rt.flush();
  assert(!scoped.requests.filter(request => request.url.includes('simulations?limit=')).at(-1).url.includes('projectId='), 'Reset filters removes Project filter');
  const validationChoices = { markers: [{ markerId: 'kate', markerType: 'characters', name: 'Kate', movableCharacter: true }, { markerId: 'ball', markerType: 'models', name: 'Ball', movableBall: true }], groups: [{ id: 'goals', name: 'Goals' }], sensors: [] };
  const supported = { version: 1, steps: [{ id: 'run', action: 'runToTarget', actorMarkerId: 'kate', targetMarkerId: 'ball', timeoutMs: 30000, onFailure: 'stop' }], observations: [] };
  assert.equal(definitionModule.simulationReferenceIssue(supported, validationChoices), '');
  assert(definitionModule.simulationReferenceIssue(supported, { ...validationChoices, markers: validationChoices.markers.filter(marker => marker.markerId !== 'ball') }).includes('Action 1: choose an available movable ball'));
  assert(definitionModule.simulationReferenceIssue({ ...supported, observations: [{ id: 'goals', kind: 'sensor-group', sensorGroupId: 'missing' }] }, validationChoices).includes('Observation 1: choose an available Sensor Group'));
  assert(definitionModule.simulationReferenceIssue({ ...supported, observations: [{ id: 'goals', kind: 'sensor-group', sensorGroupId: 'goals', sensors: [{ id: 'removed', ownerMarkerId: 101 }] }] }, validationChoices).includes('a selected Sensor is no longer in this group'));
  field(edit, 'simulation-name').props.onChange({ target: { value: 'Draft stays during choices refresh' } }); edit.rt.render();
  const beforeRefreshDraft = field(edit, 'simulation-name').props.value;
  edit.find(node => node.type === 'Button' && Array.isArray(node.props.children) && node.props.children.includes('Reload choices')).props.onClick(); await edit.rt.flush();
  assert.equal(field(edit, 'simulation-name').props.value, beforeRefreshDraft, 'Choices refresh retains definition and form');
  assert(edit.listeners.has('beforeunload'), 'Choices refresh preserves the unsaved-change guard');
  assert.equal(edit.requests.filter(request => request.url === '/api/threed/simulations?id=9').length, 1, 'Choices refresh does not reload the Simulation record');
  field(edit, 'simulation-slug').props.onChange({ target: { value: 'Invalid Slug' } }); edit.rt.render();
  assert(button(edit, 'Save Changes').props.disabled && field(edit, 'simulation-slug').props['aria-invalid'], 'Invalid slugs disable Save and expose field invalidity');
  assert(field(edit, 'simulation-save-status').props.children.includes('lowercase letters'));
  console.log('PASS: legacy Simulation routes redirect to Admin with bounded IDs and allowlisted draft context; creation opens canonical Admin Edit with feedback; legacy View links redirect.');
  console.log('PASS: Simulation editor validation, participant guidance, supported/preview-only action groups, scoped navigation, read-only views, draft-retaining refresh and failed saves; list combined filters, result links, revision guards and offline callbacks.');
})().catch(e => { console.error(e); process.exitCode = 1; });
