// Actual Project read and launch callbacks with offline auth/database/React adapters.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), ts = require('typescript');
const jsx = (type, props) => ({ type, props }), proxy = new Proxy({}, { get: (_, key) => String(key) });
const nodes = value => Array.isArray(value) ? value.flatMap(nodes) : value && typeof value === 'object' ? [value, ...nodes(value.props?.children)] : [];
function load(file, mocks = {}, globals = {}, cache = new Map()) {
  file = path.resolve(file); if (cache.has(file)) return cache.get(file);
  const exports = {}; cache.set(file, exports);
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText,
    { exports, console, URL, URLSearchParams, AbortController, AbortSignal, Error, Date, TextEncoder, ...globals, require(name) {
      if (name in mocks) return mocks[name];
      const target = name.startsWith('@/') ? path.resolve('src', name.slice(2)) : name.startsWith('.') ? path.resolve(path.dirname(file), name) : null;
      assert(target, name); return load(target.endsWith('.ts') ? target : target + '.ts', mocks, globals, cache);
    } }); return exports;
}
const definition = { version: 1, steps: [{ id: 'run', action: 'runToTarget', actorMarkerId: 'kate', targetMarkerId: 'ball', timeoutMs: 60000, onFailure: 'stop' },
  { id: 'kick', action: 'kickBall', actorMarkerId: 'kate', targetMarkerId: 'ball', timeoutMs: 30000, onFailure: 'stop' }], observations: [] };
const simulation = { id: 26, name: 'Soccer practice', revision: 3, projectId: 16, threedId: 1, isActive: true, definition };
const scenario = { scenarioId: 7, threedId: 1, projectId: 16, kind: 'soccer', name: 'Practice Soccer', groupId: 'goals', groupName: 'Goals', environmentMarkerId: 'field', environmentName: 'Field' };
const launch = { simulation, kickMappings: [{ action: 'custom_foot', points: ['left-foot'] }] };
const markers = [{ id: 'kate', type: 'characters', isActive: true, isVisible: true, name: 'Kate', data: { id: 9, isMovable: true, model: { filePath: '/kate.fbx' } } },
  { id: 'ball', type: 'models', isActive: true, isVisible: true, name: 'Ball', data: { id: 53 }, metadata: { physicsMode: 'ball' } },
  { id: 'field', type: 'models', isActive: true, isVisible: true, data: { id: 55 } }];
const context = { projectId: 16, scenario: null, allowed: true, ready: true, busy: false, controlledCharacterId: null, target: null, markers,
  layers: new Set(['characters', 'models']), settledCharacters: new Set(['kate']), groups: [{ id: 'goals', name: 'Goals' }],
  sensorMembers: ['left', 'right'].map(id => ({ ownerMarkerId: 1, id, groupId: 'goals', behavior: 'counter' })),
  position: () => ({ x: 0, y: 0.5, z: 0 }), counts: () => ({}) };
const participants = load('src/libraries/services/threed/simulations/simulation-launch.ts');
assert.equal(participants.simulationLaunchParticipants(launch, context).characterId, 9);
for (const changes of [{ allowed: false }, { ready: false }, { busy: true }, { projectId: 99 }, { layers: new Set(['models']) }, { visibleMarkerIds: new Set(['field', 'ball']) },
  { markers: [...markers, markers[0]] }, { position: () => ({ x: NaN, y: 0, z: 0 }) }]) assert.throws(() => participants.simulationLaunchParticipants(launch, { ...context, ...changes }));

const tables = new Proxy({}, { get: (_, table) => new Proxy({ name: table }, { get: (target, key) => key === 'name' ? table : { table, key } }) });
const orm = {}; for (const op of ['and', 'or', 'eq', 'asc', 'inArray']) orm[op] = (...args) => ({ op, args });
orm.sql = (strings, ...values) => ({ op: 'sql', strings, values });
let records, viewer;
function value(expr, row) {
  if (expr?.table) return row[expr.table]?.[expr.key];
  if (!expr?.op) return expr;
  if (expr.op === 'eq') return value(expr.args[0], row) === value(expr.args[1], row);
  if (expr.op === 'and') return expr.args.filter(Boolean).every(expr => value(expr, row));
  if (expr.op === 'or') return expr.args.some(expr => value(expr, row));
  if (expr.op === 'inArray') return expr.args[1].includes(value(expr.args[0], row));
  if (expr.op === 'sql') {
    const text = expr.strings.join(''); if (text.includes('false')) return false;
    if (text.includes('jsonb_array_length')) { const steps = row.threedSimulations.definition.steps;
      return steps.length > 0 && steps.every(step => ['runToTarget', 'kickBall'].includes(step.action)
        && step.actorMarkerId === steps[0].actorMarkerId && step.targetMarkerId === steps[0].targetMarkerId); }
    return row.threedScenarios?.setup?.kind === 'soccer';
  }
  throw new Error('Unknown expression');
}
const db = { select(fields) {
  let source, where, joins = [], limit = Infinity, offset = 0;
  const chain = { from(table) { source = table.name; return chain; }, innerJoin(table, condition) { joins.push([table.name, condition]); return chain; },
    where(condition) { where = condition; return chain; }, orderBy() { return chain; }, limit(n) { limit = n; return chain; }, offset(n) { offset = n; return chain; },
    then(resolve, reject) { let rows = (records[source] ?? []).map(row => ({ [source]: row }));
      for (const [table, condition] of joins) rows = rows.flatMap(row => (records[table] ?? []).map(next => ({ ...row, [table]: next })).filter(row => value(condition, row)));
      rows = rows.filter(row => !where || value(where, row));
      const projected = fields?.total ? [{ total: rows.length }] : rows.slice(offset, offset + limit).map(row => Object.fromEntries(Object.entries(fields).map(([key, expr]) => [key, value(expr, row)])));
      return Promise.resolve(projected).then(resolve, reject); },
  }; return chain;
} };
const api = load('src/app/api/project/simulations/route.ts', {
  'drizzle-orm': orm, '@/libraries/db/client': { db }, '@/libraries/schema/project': tables, '@/libraries/schema/threed': tables,
  '@/libraries/auth': { auth: async () => viewer ? { user: { id: viewer } } : null },
  'next/server': { NextResponse: { json: (body, options) => ({ body, ...options }) } },
});
function fixture() { viewer = undefined; records = {
  project: [{ id: 16, userId: 'owner', isPublic: true, metadata: { physicsSensorGroups: [{ id: 'goals', name: 'Goals' }] } }],
  projectThreed: [{ projectId: 16, threedId: 1, userId: 'owner', isActive: true }], threed: [{ id: 1, userId: 'owner', isActive: true }],
  threedScenarios: [{ id: 7, projectId: 16, threedId: 1, userId: 'owner', name: 'Practice Soccer', isActive: true,
    setup: { version: 1, kind: 'soccer', environmentMarkerId: 'field', sensorGroupId: 'goals' } }],
  threedSimulations: [{ ...simulation, userId: 'owner', secret: 'never-public' }, { ...simulation, id: 99, userId: 'stranger' }],
  projectThreedMarkers: markers.map(marker => ({ markerId: marker.id, markerType: marker.type, sourceAssetId: marker.data.id, name: marker.name, data: marker.data, metadata: marker.metadata,
    projectId: 16, threedId: 1, userId: 'owner', isActive: true })),
  projectAssets: markers.map(marker => ({ assetId: marker.data.id, assetType: `threed_${marker.type}`, projectId: 16, moduleId: 1, moduleType: 'threed', userId: 'owner', isActive: true })),
  threedCharacterAnimationAssignments: [{ characterId: 9, actionKey: 'custom_foot', userId: 'owner' }], threedCharacters: [],
  threedAnimationActionSlots: [{ actionKey: 'custom_foot', name: 'Left Foot Soccer', userId: 'owner', isActive: true },
    { actionKey: 'unassigned_foot', name: 'Left Foot Soccer', userId: 'owner', isActive: true }, { actionKey: 'private_other', name: 'Right Foot Soccer', userId: 'stranger', isActive: true }],
}; }
async function read(suffix = '') { return api.GET({ url: `http://localhost/api/project/simulations?projectId=16${suffix}` }); }

function runtime() {
  const slots = []; let cursor = 0, changed = false, effects = [], tree, body;
  const same = (a, b) => a && b && a.length === b.length && a.every((x, i) => Object.is(x, b[i]));
  const react = { useState(initial) { const i = cursor++; slots[i] ??= { value: typeof initial === 'function' ? initial() : initial };
    return [slots[i].value, next => { const value = typeof next === 'function' ? next(slots[i].value) : next; if (!Object.is(value, slots[i].value)) { slots[i].value = value; changed = true; } }]; },
    useRef(initial) { return slots[cursor++] ??= { current: initial }; }, useSyncExternalStore(subscribe, get) { return get(); },
    useEffect(fn, deps) { const i = cursor++; if (!same(slots[i]?.deps, deps)) effects.push(() => { slots[i]?.cleanup?.(); slots[i] = { deps, cleanup: fn() }; }); },
    useCallback(fn, deps) { const i = cursor++; if (!same(slots[i]?.deps, deps)) slots[i] = { deps, value: fn }; return slots[i].value; },
  };
  const render = () => { let tries = 0; do { assert(++tries < 40); changed = false; cursor = 0; effects = []; tree = body(); effects.forEach(fn => fn()); } while (changed); return tree; };
  return { react, render, mount(fn) { body = fn; render(); }, get tree() { return tree; }, async flush() { for (let i = 0; i < 6; i++) { await new Promise(resolve => setImmediate(resolve)); render(); } }, cleanup() { slots.forEach(slot => slot?.cleanup?.()); } };
}
function launcherFixture(total = 1, initial = context, options = {}) {
  const rt = runtime(), requests = [], prepares = [], timers = new Map(), listeners = new Map(); let scene = initial, hold = false, queued = [], timerId = 0, fail = false;
  const ui = load('src/components/map/panels/ProjectSimulationLauncher.tsx', {
    react: rt.react, 'react/jsx-runtime': { jsx, jsxs: jsx }, 'lucide-react': proxy, '@/components/ui/button': proxy,
    'next/link': { default: 'Link' }, '@/components/admin/threed/models/ModelFieldHelp': proxy,
    './ProjectSimulationControls': { ProjectSimulationControls: 'ProjectSimulationControls' },
    '@/components/ui/toast': { useToast: () => ({ showToast: () => {}, ToastComponent: null }) },
    '@/libraries/services/threed/animations/runtime-availability': { subscribeCharacterAnimationAvailability: () => () => {}, getCharacterAnimationAvailability: () => new Set(['custom_foot']) },
  }, { fetch: async (url, fetchOptions) => { requests.push(url); if (hold) await new Promise(resolve => queued.push(resolve)); return { ok: !fail, json: async () => fail ? {success: false, error: 'Read unavailable'} : url.includes('&id=')
    ? { success: true, data: launch } : { success: true, data: total ? [{ id: 26, name: simulation.name }] : [], pagination: { total } } }; },
    setTimeout: fn => { timers.set(++timerId, fn); return timerId; }, clearTimeout: id => timers.delete(id),
    window: { addEventListener: (type, fn) => listeners.set(type, fn), removeEventListener: type => listeners.delete(type) },
  });
  rt.mount(() => ui.ProjectSimulationLauncher({ context: scene, saveResults: false, obscured: false, subscribeSensors: () => () => {}, ...options, onPrepare: next => {
    prepares.push(next); const chosen = participants.simulationLaunchParticipants(next, scene);
    scene = { ...scene, controlledCharacterId: chosen.characterId, target: chosen.target };
  } }));
  const find = predicate => nodes(rt.tree).find(predicate);
  return { rt, requests, prepares, timers, find, hold(value) { hold = value; }, release() { queued.splice(0).forEach(fn => fn()); },
    available(value) { total = value; }, fail(value) { fail = value; },
    button: () => find(node => node.type === 'Button' && String(node.props.className).includes('h-11')), scene(next) { scene = next; rt.render(); } };
}
function scenarioGuideFixture() {
  const rt = runtime(), starts = [], selected = [], guides = [], closed = [];
  let selection = null, guide = {kind: 'soccer', environmentId: '', groupId: '', farmbotId: ''};
  const props = () => ({projectId: '16', markers, loadedScenario: selection, guide, onGuideChange: next => {guide = next;},
    onChooseTemplate: () => {}, onClearLoaded: () => {}, onStartScenario: next => starts.push(next)});
  const ui = load('src/components/map/panels/ScenarioGuidance.tsx', {
    react: rt.react, 'react/jsx-runtime': {jsx, jsxs: jsx}, 'lucide-react': proxy, 'next/link': {default: 'Link'}, '@/components/ui/button': proxy,
    '@/components/threed/physics/SensorGroupsWorkspace': {useSensorGroups: () => ({groups: [{id: 'goals', name: 'Goals'}]})},
    '@/components/map/useFarmBotLiveState': {useFarmBotLiveState: () => ({})},
    '@/libraries/services/threed/physics/sensor-cuboid-core': {readPhysicsSensorCuboids: metadata => metadata?.testSensors ?? []},
  });
  const panelRt = runtime();
  const panel = load('src/components/map/panels/ProjectScenariosPanel.tsx', {
    react: panelRt.react, 'react/jsx-runtime': {jsx, jsxs: jsx}, 'lucide-react': proxy, '@/components/ui/button': proxy,
    './ScenarioGuidance': {ScenarioGuidance: 'ScenarioGuidance'}, './ProjectScenarioLoadDialog': {ProjectScenarioLoadDialog: 'ProjectScenarioLoadDialog'},
  });
  panelRt.mount(() => panel.ProjectScenariosPanel({isOpen: true, projectId: '16', markers, selected: selection, guide, startedScenarioName: null,
    onSelectedChange: next => { selection = next; selected.push(next); }, onGuideChange: next => {guide = next; guides.push(next);},
    onClose: () => closed.push(true), onStartScenario: next => starts.push(next)}));
  rt.mount(() => ui.ScenarioGuidance(props()));
  const find = predicate => nodes(rt.tree).find(predicate);
  return {rt, panelRt, starts, selected, guides, closed, find, props,
    select(next) {nodes(panelRt.tree).find(node => node.type === 'ProjectScenarioLoadDialog').props.onLoad(next); rt.render(); panelRt.render();},
    sensors(value) {markers[2].metadata = {testSensors: value}; rt.render();} };
}
(async () => {
  fixture(); let result = await read(); assert.equal(result.body.data.length, 1); assert.equal(result.body.data[0].id, 26);
  assert.deepEqual(Object.keys(result.body.data[0]).sort(), ['id', 'name']);
  result = await read('&id=26'); assert.equal(result.status, 200); assert.equal(result.body.data.simulation.id, 26);
  assert(!JSON.stringify(result.body).includes('never-public')); assert(!JSON.stringify(result.body).includes('owner'));
  assert(!JSON.stringify(result.body).includes('private_other')); assert(!JSON.stringify(result.body).includes('unassigned_foot'));
  assert.equal((await read('&id=99')).status, 404);
  records.project[0].isPublic = false; assert.equal((await read()).status, 404); viewer = 'stranger'; assert.equal((await read()).status, 404);
  viewer = 'owner'; assert.equal((await read('&id=26')).status, 200);
  for (const table of ['threedSimulations', 'projectThreed', 'threed']) { fixture(); records[table][0].isActive = false; assert.equal((await read('&id=26')).status, 404); }
  fixture(); records.projectThreedMarkers[0].threedId = 99; assert.equal((await read('&id=26')).status, 409);
  fixture(); records.projectAssets[0].isActive = false; assert.equal((await read('&id=26')).status, 409);
  fixture(); records.threedSimulations[0].definition = { ...definition, steps: [{ ...definition.steps[0], action: 'point' }] }; assert.equal((await read('&id=26')).status, 404);
  fixture(); assert.equal((await read('&offset=-1')).status, 400);
  fixture(); records.threedScenarios = []; assert.equal((await read('&id=26')).status, 200, 'No Scenario exists or is required');
  assert.equal((await read('&scenarioId=7')).status, 400); assert.equal((await read('&scenarioId=8')).status, 400);
  assert.equal((await read('&scenarioId=8&id=26')).status, 400); assert.equal((await read('&scenarioId=invalid')).status, 400);
  console.log('PASS: actual Project launch API enforces public/owner access, active owned module bindings, no Scenario dependency, participant membership, supported Actions and minimal projection.');
  let ui = launcherFixture(); await ui.rt.flush(); assert.equal(ui.prepares.length, 0, 'Mount never starts'); assert.equal(ui.button().props.disabled, false);
  assert(ui.button().props.className.includes('bg-emerald-600'), 'Enabled Run uses the green action style');
  ui.button().props.onClick(); ui.button().props.onClick(); await ui.rt.flush(); assert.equal(ui.prepares.length, 1, 'One-click preparation locks duplicate clicks');
  let controls = ui.find(node => node.type === 'ProjectSimulationControls'); assert.equal(controls.props.launch.request, 1); assert.equal(controls.props.launch.saveResults, false);
  assert.equal(ui.timers.size, 0); controls.props.launch.onStatus(false, null); ui.rt.render(); ui.rt.cleanup();
  ui = launcherFixture(2); await ui.rt.flush(); assert.equal(ui.button().props.disabled, true, 'Multiple choices require explicit selection');
  ui.find(node => node.props?.['aria-label'] === 'Simulation').props.onChange({ target: { value: '26' } }); ui.rt.render(); ui.button().props.onClick(); await ui.rt.flush();
  controls = ui.find(node => node.type === 'ProjectSimulationControls'); controls.props.launch.onStatus(false, { phase: 'completed' }); ui.rt.render();
  ui.find(node => node.props?.['aria-label'] === 'Simulation').props.onChange({ target: { value: '' } }); ui.rt.render();
  assert(!ui.find(node => node.type === 'ProjectSimulationControls'), 'Changing selection removes the old controller without replay'); ui.rt.cleanup();
  ui = launcherFixture(); await ui.rt.flush(); ui.hold(true); ui.button().props.onClick(); ui.rt.render(); ui.button().props.onClick(); ui.release(); await ui.rt.flush();
  assert.equal(ui.prepares.length, 0, 'Stop rejects a delayed preparation reply'); ui.rt.cleanup();
  ui = launcherFixture(1, { ...context, settledCharacters: new Set() }); await ui.rt.flush(); ui.button().props.onClick(); await ui.rt.flush();
  controls = ui.find(node => node.type === 'ProjectSimulationControls'); assert.equal(controls.props.launch.request, 0, 'Lazy physics readiness blocks dispatch');
  ui.scene({ ...controls.props.context, settledCharacters: new Set(['kate']) }); await ui.rt.flush();
  assert.equal(ui.find(node => node.type === 'ProjectSimulationControls').props.launch.request, 1, 'The same click continues after physics is ready'); ui.rt.cleanup();
  ui = launcherFixture(1, { ...context, settledCharacters: new Set() }); await ui.rt.flush(); ui.button().props.onClick(); await ui.rt.flush();
  [...ui.timers.values()][0](); ui.rt.render(); assert.equal(ui.find(node => node.type === 'ProjectSimulationControls').props.launch.request, 0, 'Readiness timeout never runs Actions'); ui.rt.cleanup();
  ui = launcherFixture(); await ui.rt.flush(); ui.hold(true); ui.button().props.onClick(); ui.rt.cleanup(); ui.release(); await ui.rt.flush(); assert.equal(ui.prepares.length, 0, 'Unmount rejects late replies');
  ui = launcherFixture(); await ui.rt.flush(); ui.hold(true); ui.button().props.onClick(); ui.scene({ ...context, busy: true }); ui.release(); await ui.rt.flush();
  assert.equal(ui.prepares.length, 0, 'Placement started during the read prevents participant/control changes'); ui.rt.cleanup();
  const textOf = value => Array.isArray(value) ? value.map(textOf).join(' ') : value && typeof value === 'object' ? textOf(value.props?.children) : value == null ? '' : String(value);
  const chosen = { id: 7, projectId: 16, threedId: 1, name: scenario.name, setup: { version: 1, kind: 'soccer', sensorGroupId: 'goals', environmentMarkerId: 'field' } };
  ui = launcherFixture(0, context, { saveResults: true }); await ui.rt.flush();
  assert.equal(ui.button().props.disabled, true); assert(textOf(ui.rt.tree).includes('No runnable Simulation is available in this Project.'));
  assert(!ui.requests[0].includes('scenarioId='), 'Opening a Scenario does not filter the Simulation list');
  assert(!ui.find(node => node.props?.['aria-label'] === 'Choose Scenario'), 'Scenario controls remain separate from Run Simulation');
  const prepare = ui.find(node => node.type === 'Link' && node.props.href.includes('/simulations/new?'));
  const params = new URL(prepare.props.href, 'http://fixture').searchParams;
  assert.equal(params.get('projectId'), '16'); assert.equal(params.get('scenarioId'), null); assert.equal(params.get('recipe'), null);
  ui.available(1); ui.find(node => node.props?.['aria-label'] === 'Refresh Simulations').props.onClick(); await ui.rt.flush();
  assert.equal(ui.button().props.disabled, false, 'Refresh enables the sole eligible Simulation without reloading or running'); assert.equal(ui.prepares.length, 0);
  ui.available(0); ui.find(node => node.props?.['aria-label'] === 'Refresh Simulations').props.onClick(); await ui.rt.flush();
  assert.equal(ui.button().props.disabled, true, 'Refresh clears a removed or inactive selected definition'); ui.rt.cleanup();
  ui = launcherFixture(0); await ui.rt.flush(); assert(textOf(ui.rt.tree).includes('Project owner needs'));
  assert(!ui.find(node => node.type === 'Link')); assert(!ui.find(node => node.props?.['aria-label'] === 'Choose Scenario')); assert(ui.requests.every(url => url.startsWith('/api/project/simulations'))); ui.rt.cleanup();
  for (const [changes, message] of [[{busy: true}, 'Finish placing or editing'], [{ready: false}, 'Waiting for the Scene and physics']]) {
    ui = launcherFixture(1, {...context, ...changes}); await ui.rt.flush(); assert.equal(ui.button().props.disabled, true); assert(textOf(ui.rt.tree).includes(message)); ui.rt.cleanup();
  }
  ui = launcherFixture(); ui.fail(true); await ui.rt.flush(); assert.equal(ui.button().props.disabled, true); assert(textOf(ui.rt.tree).includes('Read unavailable'));
  ui.fail(false); ui.find(node => node.props?.['aria-label'] === 'Refresh Simulations').props.onClick(); await ui.rt.flush(); assert.equal(ui.button().props.disabled, false); ui.rt.cleanup();
  ui = launcherFixture(); await ui.rt.flush(); ui.button().props.onClick(); await ui.rt.flush();
  ui.find(node => node.type === 'ProjectSimulationControls').props.launch.onStatus(false, null, 'Result table is missing. Run db:push.'); ui.rt.render();
  assert(textOf(ui.rt.tree).includes('Result table is missing'), 'Preflight and result errors remain visible outside collapsed details'); ui.rt.cleanup();
  const guided = scenarioGuideFixture();
  const loadButton = () => guided.find(node => node.type === 'Button' && textOf(node).includes('Open Scenario'));
  assert.equal(loadButton().props.disabled, true); assert(textOf(guided.rt.tree).includes('Choose a saved Scenario to enable loading'));
  guided.select({...chosen, threedName: 'Soccer'}); assert.equal(guided.starts.length, 0, 'Selecting fills guidance without starting or executing');
  assert.equal(guided.props().guide.environmentId, 'field'); assert.equal(guided.props().guide.groupId, 'goals');
  assert.equal(loadButton().props.disabled, true); assert(textOf(guided.rt.tree).includes('remaining setup check'));
  guided.sensors([{id: 'left', behavior: 'counter', detection: 'movable-ball', groupId: 'goals'}, {id: 'right', behavior: 'counter', detection: 'movable-ball', groupId: 'goals'}]);
  assert.equal(loadButton().props.disabled, false); loadButton().props.onClick(); assert.equal(guided.starts.length, 1);
  assert.equal(guided.starts[0].scenarioId, 7); assert.equal(guided.starts[0].environmentMarkerId, 'field'); assert.equal(guided.starts[0].groupId, 'goals');
  guided.rt.cleanup(); guided.panelRt.cleanup(); delete markers[2].metadata;
  console.log('PASS: actual Scenario selection fills exact setup without running; guidance explains blocked loading and enables only complete checks.');
  console.log('PASS: separate Open Scenario/Run Simulation terminology, unfiltered Simulation choices, empty/error/placement feedback and refresh without auto-execution. Scenario schema/runtime dependencies are removed.');
  console.log('PASS: actual launch UI selects a sole Simulation, requires multiple-choice selection, prepares exact participants once, waits for readiness, stops late replies and never auto-runs on mount.');
})().catch(error => { console.error(error); process.exitCode = 1; });
