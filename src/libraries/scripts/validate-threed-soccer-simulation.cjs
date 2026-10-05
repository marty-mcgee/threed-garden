// Execute the actual runner and Scene controls with offline adapters. Physics contact is covered by the Rapier kick/placement tasks.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), ts = require('typescript');
const jsx = (type, props) => ({ type, props }), proxy = new Proxy({}, { get: (_, key) => String(key) });
const nodes = value => Array.isArray(value) ? value.flatMap(nodes) : value && typeof value === 'object' ? [value, ...nodes(value.props?.children)] : [];
function load(file, deps = {}, globals = {}, cache = new Map()) {
  file = path.resolve(file); if (cache.has(file)) return cache.get(file);
  const exports = {}; cache.set(file, exports);
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText,
    { exports, console, Error, URLSearchParams, AbortController, AbortSignal, TextEncoder, Date, crypto: require('node:crypto'), ...globals, require(name) {
      if (name in deps) return deps[name];
      const target = name.startsWith('@/') ? path.resolve('src', name.slice(2)) : name.startsWith('.') ? path.resolve(path.dirname(file), name) : null;
      assert(target, `Unexpected dependency: ${name}`); return load(target.endsWith('.ts') ? target : target + '.ts', deps, globals, cache);
    } }); return exports;
}
const root = 'src/libraries/services/threed/';
const core = load(root + 'simulations/soccer-simulation-runner.ts'), sceneCore = load(root + 'simulations/soccer-simulation-scene.ts');
const navigation = load(root + 'orchestration/navigation-events.ts'), kickCore = load(root + 'physics/soccer-kick-core.ts');
const modelCore = load(root + 'models/project-model-instance-core.ts');
const definition = { version: 1, steps: [
  { id: 'run', action: 'runToTarget', actorMarkerId: 'kate', targetMarkerId: 'ball', timeoutMs: 60000, onFailure: 'stop' },
  { id: 'kick', action: 'kickBall', actorMarkerId: 'kate', targetMarkerId: 'ball', timeoutMs: 30000, onFailure: 'stop' },
], observations: [{ id: 'goals', kind: 'sensor-group', sensorGroupId: 'goals' }] };
const simulation = { id: 26, revision: 3, name: 'Run to target ball then kick the ball', projectId: 16, threedId: 1, isActive: true, definition };
for (const bad of [{ ...simulation, isActive: false }, { ...simulation, projectId: 99 }, { ...simulation, threedId: 99 },
  { ...simulation, definition: { ...definition, steps: [{ ...definition.steps[0], action: 'point' }] } },
  { ...simulation, definition: { ...definition, steps: [definition.steps[0], { ...definition.steps[1], targetMarkerId: 'other-ball' }] } }]) {
  assert.throws(() => core.captureSoccerSimulation(bad, { projectId: 16, threedId: 1 }));
}
const captured = core.captureSoccerSimulation(simulation, { projectId: 16, threedId: 1 });
definition.steps[0].timeoutMs = 1000; assert.equal(captured.definition.steps[0].timeoutMs, 60000, 'Run captures an independent parsed definition'); definition.steps[0].timeoutMs = 60000;
function runnerFixture(overrides = {}) {
  let listener = null, id = 0; const timers = new Map(), requests = [], cancels = [], updates = [];
  const runner = new core.SoccerSimulationRunner({ requestId: () => `request-${++id}`, now: () => 100,
    schedule: (fn, ms) => { const key = ++id; timers.set(key, { fn, ms }); return key; }, clear: key => timers.delete(key),
    subscribe: fn => { listener = fn; return () => { listener = null; }; }, validate: () => null,
    dispatch: (step, requestId) => { assert(listener, 'Subscribe precedes dispatch'); requests.push({ step, requestId }); }, cancel: (step, requestId) => cancels.push({ step, requestId }),
    update: value => updates.push(value), ...overrides,
  });
  const reply = (changes = {}) => { const pending = requests.at(-1); listener?.({ requestId: pending.requestId, kind: pending.step.action === 'runToTarget' ? 'navigation' : 'kick',
    actorMarkerId: 'kate', targetMarkerId: 'ball', projectId: 16, success: true, ...changes }); };
  return { runner, timers, requests, cancels, updates, reply, phase: () => updates.at(-1)?.phase };
}
let f = runnerFixture(); f.runner.start(simulation); assert.equal(f.requests.length, 1); assert.throws(() => f.runner.start(simulation));
f.reply({ requestId: 'stale' }); f.reply({ actorMarkerId: 'other-kate' }); f.reply({ targetMarkerId: 'other-ball' }); assert.equal(f.requests.length, 1);
f.reply(); assert.equal(f.requests[1].step.action, 'kickBall'); f.reply({ projectId: 99 }); assert.equal(f.phase(), 'running'); f.reply();
assert.equal(f.phase(), 'completed'); assert.equal(f.updates.at(-1).outcomes.length, 2); assert.equal(f.timers.size, 0);
f = runnerFixture(); f.runner.start(simulation); f.runner.stop(); f.reply(); assert.equal(f.requests.length, 1); assert.equal(f.phase(), 'cancelled'); assert.equal(f.cancels.length, 1); assert.equal(f.timers.size, 0);
f = runnerFixture(); f.runner.start(simulation); f.reply(); f.reply({ success: false, reason: 'miss' }); assert.equal(f.phase(), 'failed'); assert.equal(f.requests.length, 2); assert.equal(f.timers.size, 0);
f = runnerFixture(); f.runner.start(simulation); [...f.timers.values()][0].fn(); assert.equal(f.phase(), 'timed-out'); assert.equal(f.requests.length, 1); assert.equal(f.cancels.length, 1);
f = runnerFixture(); f.runner.start({ ...simulation, definition: { ...definition, steps: definition.steps.map(step => ({ ...step, onFailure: 'continue' })) } }); f.reply({ success: false, reason: 'manual input' }); assert.equal(f.phase(), 'failed'); assert.equal(f.requests.length, 1, 'A cancelled approach never advances to a kick');
f = runnerFixture({ validate: () => 'Hidden target' }); f.runner.start(simulation); assert.equal(f.phase(), 'failed'); assert.equal(f.requests.length, 0);
console.log('PASS: captured definitions, sequential responses, exact correlation, duplicate Run, Stop, missed kick, timeout and interrupted approach; no persistence.');

let positions = new Map([['kate', { x: -10, y: 0.5, z: 0 }], ['ball', { x: 0, y: 0.5, z: 0 }]]), counts = { '1:left': 2, '1:right': 1 };
const markers = [
  { id: 'kate', name: 'Farmer Kate', type: 'characters', isActive: true, isVisible: true, data: { id: 9, isMovable: true, model: { filePath: '/kate.fbx', metadata: {} } }, metadata: {} },
  { id: 'ball', name: 'Ball', type: 'models', isActive: true, isVisible: true, data: { id: 53 }, metadata: { physicsMode: 'ball' } },
  { id: 'field', name: 'Field', type: 'models', isActive: true, isVisible: true, data: { id: 55 }, metadata: {} },
];
const members = ['left', 'right'].map(id => ({ id, name: id, ownerMarkerId: 1, groupId: 'goals', behavior: 'counter' }));
const scenario = { projectId: 16, scenarioId: 7, threedId: 1, name: 'Practice Soccer', kind: 'soccer', sequence: 1, environmentMarkerId: 'field', environmentName: 'Field', groupId: 'goals', groupName: 'Goals' };
const context = { projectId: 16, allowed: true, ready: true, busy: false, controlledCharacterId: 9,
  target: { markerId: 'ball', type: 'models', id: 53 }, markers, layers: new Set(['models', 'characters']), settledCharacters: new Set(['kate']),
  groups: [{ id: 'goals', name: 'Goals' }], sensorMembers: members, position: id => positions.get(id), counts: () => counts };
const mapping = { action: 'custom_foot', points: ['left-foot'] };
assert.equal(sceneCore.soccerSimulationReadiness(simulation, context, mapping), null);
assert.equal(sceneCore.soccerSimulationReadiness(simulation, {...context, scenario: null, sensorMembers: []}, mapping), null, 'No Scenario or goal counter requirement');
assert.equal(sceneCore.soccerSimulationReadiness(simulation, {...context, scenario: {...scenario, scenarioId: 99}}, mapping), null, 'Changing a separate plan does not block execution');
for (const changes of [{ allowed: false }, { ready: false }, { busy: true }, { projectId: 99 },
  { controlledCharacterId: null }, { layers: new Set(['models']) }, { settledCharacters: new Set() }, { visibleMarkerIds: new Set(['kate', 'field']) },
  { target: { ...context.target, markerId: 'other-ball' } }, { position: () => undefined }, { groups: [] },
  { markers: markers.map(marker => marker.id === 'kate' ? { ...marker, data: { ...marker.data, model: { filePath: '/kate.fbx', metadata: { activeSource: 'shape' } } } } : marker) }]) {
  assert(sceneCore.soccerSimulationReadiness(simulation, { ...context, ...changes }, mapping), 'Unready runtime cannot execute');
}
assert(sceneCore.soccerSimulationReadiness(simulation, context, null)); assert.equal(sceneCore.soccerSimulationKickReady(simulation, context), false);
const readings = sceneCore.simulationSensorSnapshot(simulation, context); assert.equal(readings[0].baseline, 3); assert.equal(counts['1:left'], 2, 'Observing never resets counters');
console.log('PASS: exact Project/control/target, live positions, settled rig, visibility, explicit observation groups, mapping and run-window counter reads.');

const viewCore = load(root + 'markers/project-view-state-core.ts');
const view = { version: 1, savedAt: '2026-10-05T12:00:00.000Z', viewMode: '3d', panelHeight: 50, cameraMode: 'follow',
  scenario: { panelOpen: false, selected: { id: 7, projectId: 16, threedId: 1, name: 'Practice Soccer', threedName: 'Soccer', setup: { version: 1, kind: 'soccer', environmentMarkerId: 'field', sensorGroupId: 'goals' } }, guide: { kind: 'soccer', environmentId: 'field', groupId: 'goals', farmbotId: '' } } };
assert.equal(viewCore.parseThreeDProjectViewState(view).scenario.selected.threedId, 1);
const legacy = structuredClone(view); delete legacy.scenario.selected.threedId; assert(!('threedId' in viewCore.parseThreeDProjectViewState(legacy).scenario.selected));
assert.throws(() => viewCore.parseThreeDProjectViewState({ ...view, scenario: { ...view.scenario, selected: { ...view.scenario.selected, threedId: 1.5 } } }));
console.log('PASS: saved Scenario bindings retain exact module IDs, accept legacy guidance and reject noninteger bindings.');

function callback(file, name) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX); let found;
  const visit = node => { if (ts.isVariableDeclaration(node) && node.name.getText(source) === name) found = ts.isCallExpression(node.initializer) ? node.initializer.arguments[0] : node.initializer; ts.forEachChild(node, visit); };
  visit(source); assert(found, name); return ts.transpileModule(`var callback = ${found.getText(source)};`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
}
const ref = current => ({ current }), stoppedActions = [], restarts = [], task = { requestId: 'kick-stop-1', projectId: 16, characterMarkerId: 'kate', ballMarkerId: 'ball' };
const actionContext = { taskRequestRef: ref(task), markerId: 'kate', actionCollisionRef: ref({}), finishedListenerRef: ref(() => {}),
  mixerRef: ref({ removeEventListener: () => {} }), taskCleanupTimerRef: ref(null), currentActionRef: ref({ stop: () => stoppedActions.push(true) }),
  activeTaskRef: ref('kick'), taskFacingYawRef: ref(1), taskOrientationTransitionRef: ref({}), taskLockedRef: ref(true), lastClipNameRef: ref('kick'), lastLocomotionStateRef: ref('idle'), playAnimation: (...args) => restarts.push(args), clearTimeout() {} };
vm.createContext(actionContext); vm.runInContext(callback('src/components/threed/shared/EcctrlCharacter.tsx', 'cancelCharacterAction'), actionContext);
actionContext.callback({ detail: { ...task, requestId: 'other' } }); assert.equal(stoppedActions.length, 0);
actionContext.callback({ detail: task }); assert.equal(stoppedActions.length, 1); assert.equal(actionContext.taskLockedRef.current, false); assert.equal(actionContext.actionCollisionRef.current, null);
actionContext.callback({ detail: task }); assert.equal(stoppedActions.length, 1); assert.equal(restarts[0][0], 'idle');
const counterCore = load(root + 'physics/sensor-counter-core.ts');
let sensorState = { counts: {}, occupied: [] }, observedCount;
const sensorContext = { projectId: 16, sensorMembers: members, sensorCounterStateRef: ref(sensorState), reduceSensorCounterEvent: counterCore.reduceSensorCounterEvent,
  sensorEventBuffer: ref({ append: event => ({ status: 'accepted', event }) }), setSensorCounterState: fn => { sensorState = fn(sensorState); },
  simulationSensorListeners: ref(new Set([() => { observedCount = sensorContext.sensorCounterStateRef.current.counts['1:left']; }])) };
vm.createContext(sensorContext); vm.runInContext(callback('src/components/map/ThreeDScene.tsx', 'handleSensorPhysicsEvent'), sensorContext);
sensorContext.callback({ projectId: 16, kind: 'sensor-enter', sourceMarkerId: 101, sensor: { ownerMarkerId: 1, id: 'left' } });
assert.equal(observedCount, 1, 'A same-step run reader sees the accepted counter before React commits'); assert.equal(sensorState.counts['1:left'], 1);
sensorContext.callback({ projectId: 16, kind: 'sensor-enter', sourceMarkerId: 101, sensor: { ownerMarkerId: 1, id: 'left' } }); assert.equal(sensorState.counts['1:left'], 1, 'Duplicate occupancy stays deduplicated');
console.log('PASS: actual Character cancellation isolates the correlated task and restores locomotion; same-step sensor readers preserve authoritative counter reduction.');

function reactRuntime() {
  const slots = []; let cursor = 0, effects = [], changed = false, body, tree;
  const same = (a, b) => a && b && a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
  const react = { useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = { value: typeof initial === 'function' ? initial() : initial };
    return [slots[i].value, next => { const value = typeof next === 'function' ? next(slots[i].value) : next; if (!Object.is(value, slots[i].value)) { slots[i].value = value; changed = true; } }]; },
    useRef(initial) { return slots[cursor++] ??= { current: initial }; }, useSyncExternalStore(subscribe, get) { return get(); },
    useEffect(fn, deps) { const i = cursor++; if (!same(slots[i]?.deps, deps)) effects.push(() => { slots[i]?.cleanup?.(); slots[i] = { deps, cleanup: fn() }; }); },
  };
  const render = () => { let n = 0; do { assert(++n < 40, 'Stable render'); changed = false; cursor = 0; effects = []; tree = body(); effects.forEach(fn => fn()); } while (changed); return tree; };
  return { react, render, mount(fn) { body = fn; render(); }, get tree() { return tree; }, async flush() { for (let i = 0; i < 5; i++) { await new Promise(resolve => setImmediate(resolve)); render(); } }, cleanup() { slots.forEach(slot => slot?.cleanup?.()); } };
}
function controlsFixture(launchMode = false) {
  const rt = reactRuntime(), events = [], listeners = new Map(), requests = [], notices = [], statuses = [], timers = new Map(); let timerId = 0, sensorListener, currentContext = context;
  let saved = { ...simulation }, hold = false, holdCapture = false, captureFailed = false, pendingReads = [];
  class Event { constructor(type, options) { this.type = type; this.detail = options?.detail; } }
  const window = { addEventListener: (name, fn) => { const set = listeners.get(name) ?? new Set(); set.add(fn); listeners.set(name, set); },
    removeEventListener: (name, fn) => listeners.get(name)?.delete(fn), dispatchEvent: event => { events.push(event); [...(listeners.get(event.type) ?? [])].forEach(fn => fn(event)); } };
  const launch = { simulation, kickMappings: [mapping], saveResults: launchMode === 'owner', request: 0, stopRequest: 0, onStatus: (...args) => statuses.push(args) };
  const response = url => url.includes('/api/project/simulations?') ? { success: true, data: { ...launch, simulation: saved } }
    : url.includes('simulations?id=') ? { success: true, data: saved }
    : url.includes('options=1') ? { success: true, data: { markers: [{ markerId: 'kate', movableCharacter: true }, { markerId: 'ball', movableBall: true }] } }
    : { success: true, data: [saved], pagination: { total: 1 } };
  const fetch = async (url, options = {}) => {
    requests.push({ url, options }); if (hold || (holdCapture && url === '/api/threed/simulation-results' && options.method === 'POST')) await new Promise(resolve => pendingReads.push(resolve));
    if (url === '/api/threed/simulation-results') {
      if (captureFailed && options.method === 'POST') return Response.json({ success: false, error: 'Migration required' }, { status: 503 });
      const body = JSON.parse(options.body);
      return Response.json({ success: true, data: options.method === 'POST'
        ? { id: 1, runId: body.runId, status: 'running', simulationRevision: body.revision, snapshot: { simulationId: body.simulationId } }
        : { id: 1, runId: body.runId, status: body.report.phase } });
    }
    return Response.json(response(url));
  };
  const deps = { react: rt.react, 'react/jsx-runtime': { jsx, jsxs: jsx }, 'next/link': { default: 'Link' }, 'lucide-react': proxy,
    '@/components/ui/button': proxy, '@/components/admin/threed/models/ModelFieldHelp': proxy,
    '@/components/ui/toast': { useToast: () => ({ showToast: (...args) => notices.push(args), ToastComponent: null }) },
    '@/components/admin/threed/animations/AnimationActionSlots': { useAnimationActionSlots: () => ({ slots: [{ actionKey: 'custom_foot', name: 'Left Foot Soccer', isActive: true }] }) },
    '@/libraries/services/threed/animations/runtime-availability': { subscribeCharacterAnimationAvailability: () => () => {}, getCharacterAnimationAvailability: () => new Set(['custom_foot']) },
  };
  const ui = load('src/components/map/panels/ProjectSimulationControls.tsx', deps, { fetch, window, CustomEvent: Event,
    setTimeout: (fn, ms) => { timers.set(++timerId, { fn, ms }); return timerId; }, clearTimeout: id => timers.delete(id),
    setInterval: (fn, ms) => { timers.set(++timerId, { fn, ms }); return timerId; }, clearInterval: id => timers.delete(id),
  });
  rt.mount(() => ui.ProjectSimulationControls({ context: currentContext, launch: launchMode ? launch : undefined, subscribeSensors: fn => { sensorListener = fn; return () => { sensorListener = null; }; } }));
  const find = predicate => nodes(rt.tree).find(predicate), button = icon => find(node => node.type === 'Button' && nodes(node.props.children).some(child => child.type === icon));
  return { rt, events, requests, notices, statuses, timers, button, find, emit: (type, detail) => window.dispatchEvent(new Event(type, { detail })), sensor: event => sensorListener?.(event),
    request() { launch.request++; rt.render(); }, stop() { launch.stopRequest++; rt.render(); },
    context(value) { currentContext = value; rt.render(); }, revision(value) { saved = { ...saved, revision: value }; }, hold(value) { hold = value; }, holdCapture(value) { holdCapture = value; }, captureFailed(value) { captureFailed = value; }, release() { pendingReads.splice(0).forEach(resolve => resolve()); } };
}
(async () => {
  let ui = controlsFixture(); await ui.rt.flush();
  assert.equal(ui.events.length, 0, 'Rendering and loading never execute Actions');
  assert(ui.requests[0].url.includes('projectId=16') && ui.requests[0].url.includes('isActive=true'));
  assert(ui.requests.every(request => !request.url.includes('scenarioId=')));
  ui.find(node => node.props?.['aria-label'] === 'Saved Simulation').props.onChange({ target: { value: '26' } }); await ui.rt.flush();
  assert(!ui.button('Play').props.disabled); const run = ui.button('Play').props.onClick; run(); run(); await ui.rt.flush();
  assert.equal(ui.requests.filter(request => request.url.includes('options=1')).length, 1, 'Duplicate Run is locked through asynchronous preflight');
  const navRequest = ui.events.find(event => event.type === navigation.NAVIGATION_REQUEST).detail;
  assert.equal(navRequest.command, 'run'); assert(!ui.events.some(event => event.type === kickCore.THREED_SOCCER_KICK_REQUEST_EVENT));
  assert(ui.requests.some(request => request.url === '/api/threed/simulation-results' && request.options.method === 'POST'), 'Run captures a database record before navigation');
  positions.set('kate', { x: -1, y: 0.5, z: 0 });
  ui.emit(navigation.NAVIGATION_STATUS, { ...navRequest, phase: 'arrived', targetMarkerId: 'other-ball' }); assert(!ui.events.some(event => event.type === kickCore.THREED_SOCCER_KICK_REQUEST_EVENT));
  ui.emit(navigation.NAVIGATION_STATUS, { ...navRequest, phase: 'arrived' });
  const kick = ui.events.find(event => event.type === kickCore.THREED_SOCCER_KICK_REQUEST_EVENT).detail;
  assert.equal(kick.timing, 'contact'); assert.equal(kick.action, 'custom_foot'); assert.equal(kick.pointIds[0], 'left-foot');
  ui.sensor({ projectId: 99, sensor: { ownerMarkerId: 1, id: 'left' } });
  ui.sensor({ projectId: 16, sensor: { ownerMarkerId: 1, id: 'left' } }); counts['1:left'] = 3;
  ui.emit(kickCore.THREED_SOCCER_KICK_RESULT_EVENT, { ...kick, applied: true, projectId: 99 }); assert.equal(ui.notices.length, 0);
  ui.emit(kickCore.THREED_SOCCER_KICK_RESULT_EVENT, { ...kick, applied: true }); await ui.rt.flush();
  assert(ui.notices.some(([message, type]) => type === 'success' && message.includes('completed'))); assert.equal(ui.timers.size, 0);
  const report = JSON.parse(ui.requests.find(request => request.url === '/api/threed/simulation-results' && request.options.method === 'PATCH').options.body).report;
  assert.equal(report.phase, 'completed'); assert.equal(report.outcomes.length, 2); assert.equal(report.observations[0].events, 1); assert.equal(report.observations[0].sensors.length, 2);
  assert(nodes(ui.rt.tree).some(node => node.type === 'li' && JSON.stringify(node.props.children).includes('events'))); ui.rt.cleanup();
  ui = controlsFixture(); await ui.rt.flush(); ui.find(node => node.props?.['aria-label'] === 'Saved Simulation').props.onChange({ target: { value: '26' } }); await ui.rt.flush();
  await ui.button('Play').props.onClick(); await ui.rt.flush(); const pendingNav = ui.events.find(event => event.type === navigation.NAVIGATION_REQUEST).detail;
  ui.button('Square').props.onClick(); await ui.rt.flush();
  assert(ui.events.some(event => event.type === navigation.NAVIGATION_REQUEST && event.detail.cancelRequestId === pendingNav.requestId));
  assert(ui.requests.some(request => request.options?.method === 'PATCH' && JSON.parse(request.options.body).report.phase === 'cancelled'), 'Stop preserves a cancelled result');
  ui.emit(navigation.NAVIGATION_STATUS, { ...pendingNav, phase: 'arrived' }); assert(!ui.events.some(event => event.type === kickCore.THREED_SOCCER_KICK_REQUEST_EVENT));
  ui.rt.cleanup(); assert.equal(ui.timers.size, 0);
  ui = controlsFixture(); await ui.rt.flush(); ui.find(node => node.props?.['aria-label'] === 'Saved Simulation').props.onChange({ target: { value: '26' } }); await ui.rt.flush();
  ui.hold(true); ui.button('Play').props.onClick(); ui.context({ ...context, projectId: 99, scenario: null }); ui.release(); await ui.rt.flush();
  assert.equal(ui.events.length, 0, 'A delayed preflight cannot start after a Project change'); ui.rt.cleanup();
  ui = controlsFixture(); await ui.rt.flush(); ui.find(node => node.props?.['aria-label'] === 'Saved Simulation').props.onChange({ target: { value: '26' } }); await ui.rt.flush();
  ui.revision(4); await ui.button('Play').props.onClick(); await ui.rt.flush(); assert.equal(ui.events.length, 0); assert(ui.notices.some(([message]) => message.includes('changed'))); ui.rt.cleanup();
  ui = controlsFixture(); await ui.rt.flush(); ui.find(node => node.props?.['aria-label'] === 'Saved Simulation').props.onChange({ target: { value: '26' } }); await ui.rt.flush();
  ui.holdCapture(true); ui.button('Play').props.onClick(); await ui.rt.flush();
  ui.context({ ...context, projectId: 99, scenario: null }); ui.release(); await ui.rt.flush();
  assert.equal(ui.events.length, 0, 'Late database capture cannot start in another Project');
  assert(ui.requests.some(request => request.options.method === 'PATCH' && JSON.parse(request.options.body).report.phase === 'cancelled'), 'Late capture receives an honest cancelled report'); ui.rt.cleanup();
  ui = controlsFixture(); await ui.rt.flush(); ui.find(node => node.props?.['aria-label'] === 'Saved Simulation').props.onChange({ target: { value: '26' } }); await ui.rt.flush();
  ui.captureFailed(true); await ui.button('Play').props.onClick(); await ui.rt.flush(); assert.equal(ui.events.length, 0); assert(ui.notices.some(([message]) => message.includes('Migration'))); ui.rt.cleanup();
  ui = controlsFixture('public'); await ui.rt.flush(); assert.equal(ui.requests.length, 0, 'Public mount makes no private reads or automatic run');
  ui.request(); await ui.rt.flush(); assert(ui.events.some(event => event.type === navigation.NAVIGATION_REQUEST));
  assert(ui.requests.every(request => request.url.startsWith('/api/project/simulations?')), 'Public runs never call owner CRUD/results');
  ui.stop(); await ui.rt.flush(); assert(ui.notices.some(([message]) => message.includes('cancelled'))); ui.rt.cleanup();
  ui = controlsFixture('public'); ui.request(); await ui.rt.flush();
  const publicNavigation = ui.events.find(event => event.type === navigation.NAVIGATION_REQUEST).detail;
  ui.emit(navigation.NAVIGATION_STATUS, { ...publicNavigation, phase: 'arrived' });
  const publicKick = ui.events.find(event => event.type === kickCore.THREED_SOCCER_KICK_REQUEST_EVENT).detail;
  ui.emit(kickCore.THREED_SOCCER_KICK_RESULT_EVENT, { ...publicKick, applied: true }); await ui.rt.flush();
  assert(ui.notices.some(([message]) => message.includes('completed')));
  assert(ui.requests.every(request => request.url.startsWith('/api/project/simulations?')), 'Completed public runs never persist results'); ui.rt.cleanup();
  ui = controlsFixture('public'); ui.hold(true); ui.request(); ui.stop(); ui.release(); await ui.rt.flush(); assert.equal(ui.events.length, 0, 'Stopped public preflight cannot dispatch later'); ui.rt.cleanup();
  ui = controlsFixture('public'); ui.revision(4); ui.request(); await ui.rt.flush(); assert.equal(ui.events.length, 0, 'Changed public revision requires review'); ui.rt.cleanup();
  ui = controlsFixture('owner'); ui.request(); await ui.rt.flush();
  assert(ui.requests.some(request => request.url === '/api/threed/simulation-results' && request.options.method === 'POST'), 'One-click owner run still captures results'); ui.stop(); await ui.rt.flush(); ui.rt.cleanup();
  ui = controlsFixture('owner'); ui.captureFailed(true); ui.request(); await ui.rt.flush();
  assert.equal(ui.events.length, 0); assert(ui.statuses.some(([busy, state, error]) => !busy && error?.includes('Migration')), 'Owner capture errors reach the visible launch status'); ui.rt.cleanup();
  console.log('PASS: actual Scene controls load exact definitions, recheck owner bindings/revision, lock duplicate Run, dispatch Run then contact Kick, scope observations, Stop and reject stale preflight/Project replies (offline).');
})().catch(error => { console.error(error); process.exitCode = 1; });
