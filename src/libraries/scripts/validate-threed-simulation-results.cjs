const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript'), path = require('node:path');
function load(file, deps = {}, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText,
    { exports, console, URL, URLSearchParams, Buffer, Date, AbortSignal, TextEncoder, crypto: require('node:crypto'), ...globals, require(name) {
      if (name in deps) return deps[name]; assert(name.startsWith('.'), name); return load(path.resolve(path.dirname(file), name.endsWith('.ts') ? name : name + '.ts'), deps, globals);
    } }); return exports;
}
const root = 'src/libraries/services/threed/simulations/', input = load(root + 'simulation-input.ts'), result = load(root + 'simulation-result-input.ts', { './simulation-input': input });
const now = Date.now(), uuid = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const definition = { version: 1, steps: [
  { id: 'run', action: 'runToTarget', actorMarkerId: 'kate', targetMarkerId: 'ball', timeoutMs: 60000, onFailure: 'stop' },
  { id: 'kick', action: 'kickBall', actorMarkerId: 'kate', targetMarkerId: 'ball', timeoutMs: 30000, onFailure: 'stop' },
], observations: [{ id: 'goals', kind: 'sensor-group', sensorGroupId: 'goals', sensors: [{ ownerMarkerId: 101, id: 'left' }] }] };
const snapshot = { simulationId: 26, name: 'Practice', revision: 3, projectName: 'Soccer', threedName: 'Field', scenarioId: 4, scenarioName: 'Practice Soccer', definition };
const saved = { id: 1, userId: 'owner', projectId: 15, threedId: 9, simulationId: 26, scenarioId: 4, simulationRevision: 3, runId: uuid(1), status: 'running', snapshot, report: null, clientStartedAt: new Date(now) };
const report = { version: 1, source: 'browser-scene', phase: 'completed', clientStartedAt: now, clientEndedAt: now + 1000,
  outcomes: definition.steps.map((step, index) => ({ stepId: step.id, action: step.action, requestId: uuid(index + 2), startedAt: now + index * 500, endedAt: now + (index + 1) * 500, status: 'completed' })),
  observations: [{ groupId: 'goals', name: 'Goals', baseline: 2, final: 3, delta: 1, events: 1, truncated: false, countersReset: false,
    sensors: [{ ownerMarkerId: 101, id: 'left', name: 'Left goal', behavior: 'counter', baseline: 2, final: 3 }] }] };
assert.equal(result.resultReport({ runId: uuid(1), report }, saved).report.outcomes.length, 2);
for (const bad of [{ ...report, source: 'physical-device' }, { ...report, version: 2 }, { ...report, phase: 'running' }, { ...report, clientStartedAt: now + 1 },
  { ...report, outcomes: [] }, { ...report, observations: [] }, { ...report, outcomes: report.outcomes.map(item => ({ ...item, action: 'point' })) },
  { ...report, observations: [{ ...report.observations[0], events: 257 }] }, { ...report, observations: [{ ...report.observations[0], sensors: [{ ...report.observations[0].sensors[0], ownerMarkerId: 999 }] }] }]) assert.throws(() => result.resultReport({ runId: uuid(1), report: bad }, saved));
assert.throws(() => input.parseSimulationDefinition({ ...definition, observations: [{ ...definition.observations[0], sensors: [] }] }));
assert.throws(() => input.parseSimulationDefinition({ ...definition, observations: [{ ...definition.observations[0], sensors: [definition.observations[0].sensors[0], definition.observations[0].sensors[0]] }] }));
assert(result.sameSimulationReport({ a: 1, b: { c: 2, d: 3 } }, { b: { d: 3, c: 2 }, a: 1 }), 'JSONB field order does not defeat idempotency');

const tables = Object.fromEntries(['project','projectThreed','threed','threedScenarios','threedSimulations','threedSimulationResults'].map(name => [name, new Proxy({}, { get: (_, key) => `${name}.${key}` })]));
const orm = Object.fromEntries(['and','eq','desc'].map(name => [name, (...args) => ({ name, args })]));
orm.sql = (strings, ...args) => ({ strings: [...strings], args }); orm.getTableColumns = table => ({ id: table.id, snapshot: table.snapshot, report: table.report });
let queue = [], queries = [], signedIn = true;
const db = { transaction: async fn => fn(db) };
for (const method of ['select','insert','update']) db[method] = (...args) => {
  const query = { method, args }, chain = {};
  for (const name of ['from','innerJoin','leftJoin','where','orderBy','limit','offset','values','set','returning','for','onConflictDoNothing']) chain[name] = (...args) => { (query[name] ??= []).push(args); return chain; };
  chain.then = (resolve, reject) => { queries.push(query); assert(queue.length, 'Unexpected database operation'); const next = queue.shift(); return (next instanceof Error ? Promise.reject(next) : Promise.resolve(next)).then(resolve, reject); };
  return chain;
};
const api = load('src/app/api/threed/simulation-results/route.ts', {
  'next/server': { NextResponse: { json: (data, opts) => ({ data, status: opts.status, headers: opts.headers }) } }, 'drizzle-orm': orm,
  '@/libraries/auth': { auth: async () => signedIn ? { user: { id: 'owner' } } : null }, '@/libraries/db/client': { db },
  '@/libraries/schema/project': tables, '@/libraries/schema/threed': tables,
  '@/libraries/services/threed/simulations/simulation-input': input, '@/libraries/services/threed/simulations/simulation-result-input': result,
});
const start = { runId: uuid(1), simulationId: 26, revision: 3, clientStartedAt: now };
const simulationRow = { simulation: { id: 26, revision: 3, userId: 'owner', projectId: 15, threedId: 9, scenarioId: 4, name: 'Practice', definition, isActive: true }, projectName: 'Soccer', threedName: 'Field', scenarioName: 'Practice Soccer' };
async function call(method, data, responses = [], query = '', origin = null) {
  queue = [...responses]; queries = [];
  const response = await api[method]({ url: `https://fixture.invalid/api/threed/simulation-results${query}`, headers: { get: name => name === 'origin' ? origin : null }, text: async () => typeof data === 'string' ? data : JSON.stringify(data) });
  assert.equal(queue.length, 0); return response;
}
const where = query => JSON.stringify(query.where);
(async () => {
  signedIn = false; for (const method of ['GET','POST','PATCH']) assert.equal((await call(method, start)).status, 401); signedIn = true;
  assert.equal((await call('POST', start, [], '', 'https://foreign.invalid')).status, 400);
  assert.equal((await call('POST', ' '.repeat(result.MAX_SIMULATION_RESULT_BYTES + 1))).status, 400);
  assert.equal((await call('POST', { ...start, snapshot: {} })).status, 400, 'Browser cannot submit a snapshot');
  assert.equal((await call('POST', start, [[saved]])).status, 200);
  assert.equal((await call('POST', { ...start, revision: 4 }, [[saved]])).status, 409);
  assert.equal((await call('POST', start, [[], [simulationRow], [saved]])).status, 201);
  assert.equal(queries[1].for[0][0], 'share');
  assert.equal(queries[2].values[0][0].snapshot.name, simulationRow.simulation.name);
  assert.equal(queries[2].values[0][0].userId, 'owner');
  for (const token of ['project.userId','threed.userId','threedSimulations.userId']) assert(where(queries[1]).includes(token));
  assert(JSON.stringify(queries[1].innerJoin).includes('projectThreed.userId'));
  assert.equal((await call('POST', start, [[], []])).status, 404);
  assert.equal((await call('POST', start, [[], [{ ...simulationRow, simulation: { ...simulationRow.simulation, revision: 4 } }]])).status, 409);
  assert.equal((await call('POST', start, [[], [simulationRow], [], [saved]])).status, 200, 'Concurrent capture resolves the same run');
  const missing = new Error('redacted'); missing.code = '42P01'; assert.equal((await call('POST', start, [missing])).status, 503);
  assert.equal((await call('PATCH', { runId: uuid(1), report }, [[]])).status, 404);
  assert.equal((await call('PATCH', { runId: uuid(1), report: { ...report, outcomes: [] } }, [[saved]])).status, 400);
  assert.equal((await call('PATCH', { runId: uuid(1), report }, [[saved], [{ id: 1, runId: uuid(1), status: 'completed' }]])).status, 200);
  assert.equal(queries[0].for[0][0], 'update'); assert(where(queries[1]).includes('threedSimulationResults.status'));
  assert.equal(queries[1].set[0][0].report.source, 'browser-scene');
  assert.equal((await call('PATCH', { runId: uuid(1), report }, [[{ ...saved, status: 'completed', report }]])).status, 200);
  assert.equal((await call('PATCH', { runId: uuid(1), report: { ...report, reason: 'changed' } }, [[{ ...saved, status: 'completed', report }]])).status, 409);
  assert.equal((await call('GET', null, [[saved]], `?runId=${uuid(1)}`)).status, 200);
  for (const token of ['threedSimulationResults.userId','project.userId','threed.userId']) assert(where(queries[0]).includes(token));
  assert.equal((await call('GET', null, [[{ id: 1 }], [{ total: 1 }]], '?projectId=15&simulationId=26&limit=25')).data.pagination.total, 1);
  assert(!Object.hasOwn(queries[0].args[0], 'snapshot') && !Object.hasOwn(queries[0].args[0], 'report'), 'List avoids report overfetch');
  assert.equal((await call('GET', null, [], '?limit=101')).status, 400);

  const journalModule = load(root + 'simulation-result-journal.ts'); const requests = []; let failed = false;
  const journal = new journalModule.SimulationResultJournal(async (url, options) => {
    const body = JSON.parse(options.body); requests.push({ ...options, body });
    return Response.json(options.method === 'POST' ? { success: true, data: saved } : failed ? { success: false, error: 'Offline' }
      : { success: true, data: { id: 1, runId: uuid(1), status: body.report.phase } }, { status: failed && options.method === 'PATCH' ? 503 : 200 });
  });
  await journal.begin(start, 15); failed = true; await journal.finish(uuid(1), report);
  assert.equal(journal.list()[0].status, 'error'); assert.equal(journal.list()[0].report.phase, 'completed');
  failed = false; await journal.retry(15); assert.equal(journal.list()[0].status, 'saved');
  assert.equal(requests.filter(r => r.method === 'POST').length, 1, 'Retry never creates a new attempt or replays movement');
  assert.equal(JSON.stringify(requests.filter(r => r.method === 'PATCH')[0].body), JSON.stringify(requests.filter(r => r.method === 'PATCH')[1].body));
  assert(requests.every(r => r.keepalive));
  const unavailable = new journalModule.SimulationResultJournal(async () => Response.json({ success: false, error: 'Migration required' }, { status: 503 }));
  await assert.rejects(() => unavailable.begin(start, 15)); assert.equal(unavailable.list().length, 0, 'A known failed capture does not pretend a run began');
  const longDefinition = { version: 1, steps: Array.from({ length: 50 }, (_, i) => ({ ...definition.steps[1], id: `step-${i}` })),
    observations: Array.from({ length: 32 }, (_, i) => ({ id: `group-${i}`, kind: 'sensor-group', sensorGroupId: `group-${i}` })) };
  const longReport = { ...report, outcomes: longDefinition.steps.map((step, i) => ({ ...report.outcomes[0], stepId: step.id, action: step.action,
      requestId: uuid(i + 20), startedAt: now + i, endedAt: now + i + 1, reason: '\u0000'.repeat(200) })),
    observations: longDefinition.observations.map(source => ({ ...report.observations[0], groupId: source.sensorGroupId, name: '\u0000'.repeat(80),
      events: 0, sensors: Array.from({ length: 4 }, (_, i) => ({ ...report.observations[0].sensors[0], id: `sensor-${i}`, name: '\u0000'.repeat(80) })) })) };
  const longSaved = { ...saved, snapshot: { ...snapshot, definition: longDefinition } };
  const longBody = { runId: uuid(1), report: longReport };
  assert(Buffer.byteLength(JSON.stringify(longBody)) > 65536 && Buffer.byteLength(JSON.stringify(longBody)) < result.MAX_SIMULATION_RESULT_BYTES);
  assert.equal(result.resultReport(longBody, longSaved).report.outcomes.length, 50);
  assert.equal((await call('PATCH', longBody, [[longSaved], [{ id: 1, runId: uuid(1), status: 'completed' }]])).status, 200);
  const longRequests = [], longJournal = new journalModule.SimulationResultJournal(async (url, options) => {
    longRequests.push(options); return Response.json({ success: true, data: options.method === 'POST' ? longSaved : { id: 1, runId: uuid(1), status: 'completed' } });
  });
  await longJournal.begin(start, 15); await longJournal.finish(uuid(1), longReport);
  assert.equal(longJournal.list()[0].status, 'saved'); assert.equal(longRequests[1].keepalive, false);
  let lost = true; const ambiguousRequests = [];
  const ambiguous = new journalModule.SimulationResultJournal(async (url, options) => {
    ambiguousRequests.push(JSON.parse(options.body)); if (lost) { lost = false; throw new Error('Response lost'); }
    return Response.json({ success: true, data: options.method === 'POST' ? saved : { id: 1, runId: uuid(1), status: 'cancelled' } });
  });
  await assert.rejects(() => ambiguous.begin(start, 15));
  await ambiguous.finish(uuid(1), { ...report, phase: 'cancelled', outcomes: [] });
  assert.equal(ambiguous.list()[0].status, 'saved'); assert.equal(JSON.stringify(ambiguousRequests[0]), JSON.stringify(ambiguousRequests[1]));
  console.log('PASS: bounded correlated result/Sensor validation, owner scopes, capture locks/snapshots, idempotency and finalized immutability; visible retry retains one run and never executes Actions.');
})().catch(e => { console.error(e); process.exitCode = 1; });
