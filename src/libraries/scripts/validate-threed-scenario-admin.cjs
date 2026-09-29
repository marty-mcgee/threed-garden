const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const compile = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
function load(path, mocks) {
  const exports = {};
  vm.runInNewContext(compile(fs.readFileSync(path, 'utf8')), { exports, URL, URLSearchParams, console, require(name) { assert.ok(name in mocks, name); return mocks[name]; } });
  return exports;
}
const input = load('src/libraries/services/threed/scenarios/scenario-input.ts', {});
const valid = { name: 'ThreeD Soccer', slug: 'threed-soccer', description: '', isActive: true };
assert.equal(input.scenarioFields(valid).description, null);
for (const bad of [{ ...valid, name: '' }, { ...valid, slug: '../soccer' }, { ...valid, isActive: 'yes' }]) assert.throws(() => input.scenarioFields(bad), input.ScenarioInputError);
const setup = { version: 1, kind: 'soccer', environmentMarkerId: 'models-51', sensorGroupId: 'group_1' };
assert.deepEqual(input.parseScenarioSetup(setup), setup);
assert.equal(input.parseScenarioSetup(null), null);
for (const bad of [{ ...setup, version: 2 }, { ...setup, environmentMarkerId: '../wrong' }, { ...setup, kind: 'farming' }, { ...setup, sensorGroupId: 'bad/group' }]) assert.throws(() => input.parseScenarioSetup(bad), input.ScenarioInputError);
for (const query of ['limit=0', 'limit=101', 'offset=-1', 'sort=sql', 'direction=sideways', 'projectId=no', 'isActive=yes']) assert.throws(() => input.scenarioListQuery(new URLSearchParams(query)), input.ScenarioInputError);
const schema = Object.fromEntries(['threedScenarios', 'project', 'projectThreed', 'projectAssets', 'projectThreedMarkers', 'threed'].map(name => [name, new Proxy({}, { get: (_, column) => `${name}.${column}` })]));
const orm = Object.fromEntries(['and', 'asc', 'desc', 'eq', 'ilike', 'or'].map(name => [name, (...args) => ({ name, args })]));
orm.sql = (strings, ...args) => ({ strings: [...strings], args });
let queue = [], queries = [], signedIn = true;
const db = {};
for (const method of ['select', 'insert', 'update', 'delete']) db[method] = (...args) => {
  const query = { method, args }; const chain = {};
  for (const step of ['from', 'innerJoin', 'where', 'orderBy', 'limit', 'offset', 'values', 'set', 'returning']) chain[step] = (...values) => { (query[step] ??= []).push(values); return chain; };
  chain.then = (resolve, reject) => { queries.push(query); assert.ok(queue.length, 'Expected mocked query response'); return Promise.resolve(queue.shift()).then(resolve, reject); };
  return chain;
};
const api = load('src/app/api/threed/scenarios/route.ts', {
  'next/server': { NextResponse: { json: (body, init) => ({ body, status: init?.status ?? 200 }) } },
  '@/libraries/auth': { auth: async () => signedIn ? { user: { id: 'owner' } } : null },
  '@/libraries/db/client': { db }, '@/libraries/schema/project': schema, '@/libraries/schema/threed': schema,
  '@/libraries/services/threed/scenarios/scenario-input': input, 'drizzle-orm': orm,
  '@/libraries/services/threed/physics/sensor-group-core': { readSensorGroups: groups => groups },
  '@/libraries/services/threed/physics/sensor-legacy-compat': { IMPORTED_SENSOR_GROUP: { id: 'imported', name: 'Imported' } },
});
const request = (query = '') => ({ url: `http://localhost/api/threed/scenarios${query}`, json: async () => ({ ...valid, projectId: 15, threedId: 1, id: 9 }) });
async function run(method, query, responses) { queue = [...responses]; queries = []; const response = await api[method](request(query)); assert.equal(queue.length, 0); return response; }
(async () => {
  signedIn = false; for (const method of ['GET', 'POST', 'PATCH', 'DELETE']) assert.equal((await run(method, '', [])).status, 401); signedIn = true;
  assert.equal((await run('GET', '?sort=invalid', [])).status, 400);
  const listed = await run('GET', '?projectId=15&search=Soccer&limit=25&offset=25&sort=project&direction=desc', [[{ total: '201' }], [{ scenario: { id: 9 }, projectName: 'Soccer', threedName: 'Garden' }]]);
  assert.equal(listed.body.pagination.total, 201); assert.equal(listed.body.data[0].id, 9); assert.equal(queries.length, 2);
  assert.deepEqual(queries[0].where, queries[1].where); assert.equal(queries[1].orderBy[0][0].name, 'desc'); assert.equal(queries[1].orderBy[0][1].args[0], 'threedScenarios.id');
  const where = queries[0].where[0][0]; assert.equal(where.args[0].args[0], 'threedScenarios.userId'); assert.equal(where.args[0].args[1], 'owner');
  await run('GET', '?projectId=15&isActive=true', [[{ total: '1' }], [{ scenario: { id: 9 }, projectName: 'Soccer', threedName: 'Garden' }]]);
  assert.equal(queries[0].where[0][0].args[2].args[0], 'threedScenarios.isActive');
  assert.equal(queries[0].where[0][0].args[2].args[1], true);
  assert.equal((await run('POST', '', [[]])).status, 404);
  const created = await run('POST', '', [[{ id: 1 }], [{ id: 9 }]]);
  assert.equal(created.status, 201); assert.equal(queries[1].values[0][0].userId, 'owner'); assert.equal(queries[1].values[0][0].setup, null);
  const configured = { ...valid, projectId: 15, threedId: 1, setup };
  const configuredRequest = { url: 'http://localhost/api/threed/scenarios', json: async () => configured };
  queue = [[{ id: 1 }], [], []]; queries = [];
  const rejectedModel = await api.POST(configuredRequest);
  assert.equal(rejectedModel.status, 400, 'Cross-Project or missing Model is rejected');
  queue = [[{ id: 1 }], [], [{ id: 1 }], [{ metadata: { physicsSensorGroups: [{ id: 'group_1', name: 'Goals' }] } }], [{ id: 9, setup }]]; queries = [];
  const savedSetup = await api.POST(configuredRequest);
  assert.equal(savedSetup.status, 201);
  assert.deepEqual(queries.at(-1).values[0][0].setup, setup);
  queue = [[{ id: 1 }], [], [{ id: 1 }], [{ metadata: { physicsSensorGroups: [] } }]]; queries = [];
  assert.equal((await api.POST(configuredRequest)).status, 400, 'Missing Project Sensor Group is rejected');
  assert.equal((await run('PATCH', '', [[]])).status, 404);
  const updated = await run('PATCH', '', [[{ id: 9 }]]); assert.equal(updated.status, 200);
  assert.equal(Object.hasOwn(queries[0].set[0][0], 'setup'), false, 'Outline-only PATCH preserves setup');
  assert.equal(queries[0].where[0][0].args[1].args[0], 'threedScenarios.userId');
  assert.equal((await run('DELETE', '?id=0', [])).status, 400);
  assert.equal((await run('DELETE', '?id=9', [[]])).status, 404);
  assert.equal((await run('DELETE', '?id=9', [[{ id: 9 }]])).status, 200);
  assert.equal(queries[0].where[0][0].args[1].args[1], 'owner');
  console.log('PASS: Scenario input bounds, setup parser, authorized list/count/sort, assignment-gated create, owner-scoped update/delete');
})().catch(error => { console.error(error); process.exitCode = 1; });
