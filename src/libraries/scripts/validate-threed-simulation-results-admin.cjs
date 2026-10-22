const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');

// Exercise real React callbacks and API handlers with in-memory hooks and GET responses.
// No HTTP server, WebGL, auth service or database connection is loaded.
function load(file, deps = {}, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText, { exports, console, URL, URLSearchParams, Buffer, Date, AbortController, Blob,
    setTimeout, clearTimeout, ...globals, require(name) {
      if (name === '@/components/admin/shared/use-admin-list-query-state') return { useAdminListQueryState: (_route, _key, initial) => deps.react.useState(initial) };
      if (name in deps) return deps[name];
      assert(name.startsWith('.'), `Unexpected dependency: ${name}`);
      return load(path.resolve(path.dirname(file), name.endsWith('.ts') ? name : `${name}.ts`), deps, globals);
    } });
  return exports;
}
const root = 'src/libraries/services/threed/simulations/';
const input = load(`${root}simulation-input.ts`);
const resultInput = load(`${root}simulation-result-input.ts`, { './simulation-input': input });
const jsx = (type, props) => ({ type, props });
const proxy = new Proxy({}, { get: (_, name) => String(name) });
const nodes = value => Array.isArray(value) ? value.flatMap(nodes)
  : value && typeof value === 'object' ? [value, ...nodes(value.props?.children)] : [];
const text = value => Array.isArray(value) ? value.map(text).join('')
  : value && typeof value === 'object' ? text(value.props?.children) : value == null || typeof value === 'boolean' ? '' : String(value);
const uuid = number => `00000000-0000-4000-8000-${String(number).padStart(12, '0')}`;
const timestamp = '2026-10-15T18:00:00.000Z';
const row = (id = 1, projectId = 16) => ({ id, runId: uuid(id), name: `Captured run ${id}`, projectId,
  simulationId: 4, simulationRevision: 2, status: 'completed', createdAt: timestamp, clientEndedAt: timestamp });
const record = (id = 1) => ({ ...row(id), userId: 'never-export-owner', threedId: 10, clientStartedAt: timestamp,
  snapshot: { simulationId: 4, name: `Captured run ${id}`, revision: 2, projectName: 'Field', threedName: 'ThreeD',
    definition: { version: 1, steps: [{ id: 'run', action: 'runToTarget', actorMarkerId: 'kate', targetMarkerId: 'ball', timeoutMs: 30000, onFailure: 'stop' }],
      observations: [{ id: 'goals', kind: 'sensor-group', sensorGroupId: 'goals' }] } },
  report: { version: 1, source: 'browser-scene', phase: 'completed', clientStartedAt: 0, clientEndedAt: 1000,
    outcomes: [{ stepId: 'run', action: 'runToTarget', requestId: uuid(20), startedAt: 0, endedAt: 1000, status: 'completed' }],
    observations: [{ groupId: 'goals', name: 'Goals', baseline: 2, final: 3, delta: 1, events: 1, truncated: true, countersReset: true,
      sensors: [{ ownerMarkerId: 101, id: 'left', name: 'Left goal', behavior: 'counter', baseline: 2, final: 3 }] }] },
});

function runtime() {
  const slots = []; let cursor = 0, effects = [], changed = false, body, value;
  const same = (a, b) => a && b && a.length === b.length && a.every((item, i) => Object.is(item, b[i]));
  const react = {
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = { value: typeof initial === 'function' ? initial() : initial };
      return [slots[i].value, next => { const value = typeof next === 'function' ? next(slots[i].value) : next;
        if (!Object.is(value, slots[i].value)) { slots[i].value = value; changed = true; } }]; },
    useEffect(callback, deps) { const i = cursor++; if (!same(slots[i]?.deps, deps)) effects.push(() => {
      slots[i]?.cleanup?.(); slots[i] = { deps, cleanup: callback() };
    }); },
  };
  function render() { let turns = 0; do { assert(++turns < 40, 'Render loop'); changed = false; cursor = 0; effects = [];
    value = body(); effects.forEach(effect => effect()); } while (changed); return value; }
  return { react, render, mount(fn) { body = fn; return render(); }, get value() { return value; },
    async flush() { for (let i = 0; i < 6; i++) { await new Promise(resolve => setImmediate(resolve)); render(); } },
    unmount() { slots.forEach(slot => slot?.cleanup?.()); },
  };
}
function fixture(component, initialProps = {}) {
  const rt = runtime(), requests = [], timers = new Map(), downloads = [], blobs = [], revoked = [];
  let props = initialProps, timerId = 0;
  const fetch = (url, options = {}) => {
    assert.equal(options.method ?? 'GET', 'GET', 'Admin report screens must not mutate run history');
    return new Promise(resolve => requests.push({ url, options, respond(data, status = 200) {
      resolve(Response.json(data, { status }));
    } }));
  };
  const deps = { react: rt.react, 'react/jsx-runtime': { jsx, jsxs: jsx }, 'next/link': { default: 'Link' }, 'lucide-react': proxy,
    '@/components/admin/layout/AdminWorkspaceHeader': proxy, '@/components/ui/button': proxy,
    '@/components/ui/input': proxy, '@/components/ui/table': proxy, '../models/ModelFieldHelp': proxy,
    '@/libraries/services/threed/simulations/simulation-input': input };
  const module = load(`src/components/admin/threed/simulations/${component}.tsx`, deps, { fetch,
    setTimeout(callback) { timers.set(++timerId, callback); return timerId; }, clearTimeout(id) { timers.delete(id); },
    URL: { createObjectURL(blob) { blobs.push(blob); return 'blob:fixture'; }, revokeObjectURL(url) { revoked.push(url); } },
    document: { createElement(tag) { assert.equal(tag, 'a'); return { click() { downloads.push({ href: this.href, download: this.download }); } }; } },
  });
  rt.mount(() => module[component](props));
  return { rt, requests, downloads, blobs, revoked,
    find(predicate) { return nodes(rt.value).find(predicate); },
    field(label) { return nodes(rt.value).find(node => node.props?.['aria-label'] === label); },
    button(label) { return nodes(rt.value).find(node => node.type === 'Button' && text(node).trim() === label); },
    text() { return text(rt.value); },
    timers() { const pending = [...timers.values()]; timers.clear(); pending.forEach(callback => callback()); },
    update(next) { props = next; rt.render(); },
    results() { return requests.filter(request => request.url.startsWith('/api/threed/simulation-results?')); },
    async respond(request, data, status) { assert(request, 'Expected request'); request.respond(data, status); await rt.flush(); },
  };
}
const listed = (rows, total = rows.length) => ({ success: true, data: rows, pagination: { total, limit: 25, offset: 0 } });
const listFields = { project: 'Filter Results by Project', simulation: 'Filter Results by Simulation ID', status: 'Filter Results by status' };
function change(fixture, field, value) { fixture.field(field).props.onChange({ target: { value } }); fixture.rt.render(); }

async function checkComponents() {
  const list = fixture('SimulationResultsList', { projectId: 16, simulationId: 4 }); list.timers();
  await list.respond(list.requests.find(request => request.url === '/api/project'), { success: true, data: [{ id: 16, name: 'Field' }, { id: 17, name: 'Garden' }] });
  const first = list.results()[0], firstQuery = new URL(first.url, 'https://fixture.invalid').searchParams;
  assert.equal(firstQuery.get('projectId'), '16'); assert.equal(firstQuery.get('simulationId'), '4');
  change(list, listFields.project, '17'); list.timers();
  assert(first.options.signal.aborted, 'Project filter switch aborts former run list');
  const second = list.results().at(-1), secondQuery = new URL(second.url, 'https://fixture.invalid').searchParams;
  assert.equal(secondQuery.get('projectId'), '17'); assert.equal(secondQuery.has('simulationId'), false, 'Project switch clears incompatible Simulation filter');
  await list.respond(second, listed([{ ...row(2, 17), simulationId: null }], 26));
  await list.respond(first, listed([row(1)]));
  assert(list.text().includes('Captured run 2')); assert(!list.text().includes('Captured run 1'), 'Late response cannot leak another Project');
  assert(list.text().includes('Definition deleted; snapshot retained'));
  assert.equal(list.field('View Result #2').props.href, `/admin/threed/simulation-results/${uuid(2)}`);
  list.button('Next').props.onClick(); list.rt.render(); list.timers();
  assert.equal(new URL(list.results().at(-1).url, 'https://fixture.invalid').searchParams.get('offset'), '25');
  await list.respond(list.results().at(-1), listed([row(3, 17)], 26));
  change(list, listFields.status, 'failed'); list.timers();
  const filtered = new URL(list.results().at(-1).url, 'https://fixture.invalid').searchParams;
  assert.equal(filtered.get('status'), 'failed'); assert.equal(filtered.get('offset'), '0');
  await list.respond(list.results().at(-1), { success: false, error: 'Request unavailable' }, 503);
  assert(list.text().includes('Request unavailable')); list.button('Retry').props.onClick(); list.rt.render(); list.timers();
  await list.respond(list.results().at(-1), listed([])); assert(list.text().includes('No saved Results match'));
  const requestCount = list.results().length;
  change(list, listFields.simulation, '-1'); list.timers();
  assert.equal(list.results().length, requestCount, 'Invalid filters never reach the API');
  assert(list.text().includes('Enter a positive Simulation ID'));
  change(list, listFields.simulation, '4'); list.timers();
  const pending = list.results().at(-1); list.rt.unmount(); assert(pending.options.signal.aborted);

  const detail = fixture('SimulationResultDetail', { runId: uuid(1) });
  const oldRead = detail.results()[0]; detail.update({ runId: uuid(2) });
  assert(oldRead.options.signal.aborted, 'Changing exact Result aborts the old read');
  const deleted = { ...record(2), simulationId: null };
  await detail.respond(detail.results().at(-1), { success: true, data: deleted });
  await detail.respond(oldRead, { success: true, data: record(1) });
  assert(detail.text().includes('Captured run 2')); assert(!detail.text().includes('Captured run 1'));
  assert(detail.text().includes('The Simulation definition was deleted'));
  assert(!detail.find(node => node.props?.href === '/admin/threed/simulations/4'), 'Deleted live definition is not linked from historical snapshot ID');
  assert(detail.text().includes('Run to target ball') && detail.text().includes('Left goal'));
  assert(detail.text().includes('Counter reset observed') && detail.text().includes('Event report limit reached'));
  assert(detail.text().includes('Read-only history'));
  detail.button('Export report').props.onClick(); detail.timers();
  assert.equal(detail.downloads[0].download, 'simulation-result-2.json'); assert.equal(detail.revoked[0], 'blob:fixture');
  const exported = JSON.parse(await detail.blobs[0].text());
  assert.equal(exported.snapshot.name, 'Captured run 2'); assert.equal(exported.report.outcomes[0].stepId, 'run');
  assert(!Object.hasOwn(exported, 'userId'), 'JSON export excludes ownership fields');
  detail.update({ runId: uuid(3) });
  assert(detail.button('Export report').props.disabled, 'Old report export unavailable while another run loads');
  await detail.respond(detail.results().at(-1), { success: false, error: 'Result not found.' }, 404);
  assert(detail.text().includes('Result not found')); assert(detail.button('Export report').props.disabled);
  detail.button('Refresh').props.onClick(); detail.rt.render();
  await detail.respond(detail.results().at(-1), { success: true, data: { ...record(3), status: 'running', report: null, clientEndedAt: null } });
  assert(detail.text().includes('this is not a live activity indicator')); assert(detail.text().includes('Awaiting report'));
  assert(!nodes(detail.rt.value).some(node => ['input', 'textarea', 'Input', 'Textarea'].includes(node.type)), 'Run reports have no editable fields');
  detail.rt.unmount();
}

async function checkGetBoundary() {
  const tables = Object.fromEntries(['project', 'projectThreed', 'threed', 'threedSimulations', 'threedSimulationResults']
    .map(name => [name, new Proxy({}, { get: (_, key) => `${name}.${key}` })]));
  const orm = Object.fromEntries(['and', 'eq', 'desc'].map(name => [name, (...args) => ({ name, args })]));
  orm.sql = (strings, ...args) => ({ strings: [...strings], args });
  orm.getTableColumns = table => ({ id: table.id, snapshot: table.snapshot, report: table.report });
  let signedIn = true, queue = [], queries = [];
  const db = { select(...args) { const query = { args }, chain = {};
    for (const name of ['from', 'innerJoin', 'where', 'orderBy', 'limit', 'offset']) chain[name] = (...values) => { (query[name] ??= []).push(values); return chain; };
    chain.then = (resolve, reject) => { queries.push(query); assert(queue.length, 'Unexpected persistence operation'); return Promise.resolve(queue.shift()).then(resolve, reject); };
    return chain;
  } };
  const api = load('src/app/api/threed/simulation-results/route.ts', {
    'next/server': { NextResponse: { json: (data, options) => ({ data, ...options }) } }, 'drizzle-orm': orm,
    '@/libraries/auth': { auth: async () => signedIn ? { user: { id: 'owner' } } : null }, '@/libraries/db/client': { db },
    '@/libraries/schema/project': tables, '@/libraries/schema/threed': tables,
    '@/libraries/services/threed/simulations/simulation-input': input,
    '@/libraries/services/threed/simulations/simulation-result-input': resultInput,
  });
  async function get(query = '', responses = []) { queue = [...responses]; queries = [];
    const response = await api.GET({ url: `https://fixture.invalid/api/threed/simulation-results${query}` });
    assert.equal(queue.length, 0); return response;
  }
  signedIn = false; assert.equal((await get()).status, 401); signedIn = true;
  for (const query of ['?runId=invalid', '?projectId=0', '?simulationId=-1', '?status=unknown', '?offset=-1', '?limit=101', '?scenarioId=4']) {
    assert.equal((await get(query)).status, 400, query); assert.equal(queries.length, 0);
  }
  assert.equal((await get(`?runId=${uuid(2)}`, [[{ ...record(2), simulationId: null }]])).status, 200);
  const exactQuery = JSON.stringify(queries[0]);
  for (const column of ['threedSimulationResults.userId', 'project.userId', 'threed.userId', 'threedSimulationResults.runId']) assert(exactQuery.includes(column));
  assert(!exactQuery.includes('threedSimulations.'), 'Deleted definition does not block historical Result reads');
  assert.equal((await get(`?runId=${uuid(99)}`, [[]])).status, 404);
  const list = await get('?projectId=16&simulationId=4&status=failed&limit=25&offset=25', [[row()], [{ total: 30 }]]);
  assert.equal(list.data.pagination.total, 30); assert.equal(list.data.pagination.offset, 25);
  for (const query of queries) for (const column of ['threedSimulationResults.projectId', 'threedSimulationResults.simulationId', 'threedSimulationResults.status', 'threedSimulationResults.userId']) {
    assert(JSON.stringify(query.where).includes(column), 'Count and page must apply the same filters and owner scope');
  }
  assert(!Object.hasOwn(queries[0].args[0], 'snapshot') && !Object.hasOwn(queries[0].args[0], 'report'), 'List does not overfetch report payloads');
  assert.equal(list.headers['Cache-Control'], 'private, no-store');
}

(async () => {
  await checkComponents(); await checkGetBoundary();
  console.log('PASS: read-only Admin Simulation Results filters/paging/retry, stale Project/run responses, retained snapshots, observations and safe export; mocked owner-scoped GET only.');
})().catch(error => { console.error(error); process.exitCode = 1; });
