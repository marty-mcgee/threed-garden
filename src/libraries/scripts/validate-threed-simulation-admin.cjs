const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const load = (file, deps = {}, globals = {}) => {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText,
    { exports, console, URL, URLSearchParams, Buffer, Date, ...globals, require(name) { assert(name in deps, name); return deps[name]; } });
  return exports;
};
const root = 'src/libraries/services/threed/';
const markersCore = load(root + 'markers/runtime-marker-core.ts');
const actions = load(root + 'orchestration/action-target-core.ts', { '../markers/runtime-marker-core.ts': markersCore });
const input = load(root + 'simulations/simulation-input.ts', { '../orchestration/action-target-core': actions });
const sensor = load(root + 'physics/sensor-group-core.ts');
const legacy = load(root + 'physics/sensor-legacy-compat.ts');
const cuboids = load(root + 'physics/sensor-cuboid-core.ts', { './sensor-legacy-compat': legacy });
const modelSource = ts.createSourceFile('model.ts', fs.readFileSync(root + 'models/project-model-instance-core.ts', 'utf8'), ts.ScriptTarget.Latest, true);
const ballFunctions = modelSource.statements.filter(node => ts.isFunctionDeclaration(node) && ['isProjectModelEnvironment', 'isProjectModelMovableBall'].includes(node.name?.text));
const ballCore = { exports: {} }; vm.runInNewContext(ts.transpileModule(ballFunctions.map(node => node.getText(modelSource)).join('\n'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, ballCore);
const step = { id: 'step1', action: 'point', actorMarkerId: 'characters-9', targetMarkerId: 'models-5', timeoutMs: 30000, onFailure: 'stop' };
const definition = { version: 1, steps: [step], observations: [{ id: 'obs1', kind: 'sensor-group', sensorGroupId: 'group1' }] };
const valid = { projectId: 15, threedId: 1, name: 'Practice', slug: 'practice', description: 'Plan', isActive: false, definition };
assert.equal(input.parseSimulationDefinition(definition).steps[0].actorMarkerId, 'characters-9');
for (const bad of [null, {}, { ...definition, version: 2 }, { ...definition, credential: 'no' }, { ...definition, steps: [step, step] }, { ...definition, steps: [{ ...step, action: 'rawCommand' }] }, { ...definition, steps: [{ ...step, timeoutMs: 0 }] }, { ...definition, observations: [...definition.observations, ...definition.observations] }, { ...definition, steps: Array(51).fill(step) }]) assert.throws(() => input.parseSimulationDefinition(bad), input.SimulationInputError);
assert.throws(() => input.simulationFields({ ...valid, isActive: true, definition: input.emptySimulationDefinition() }, false));
assert.throws(() => input.simulationFields({ ...valid, id: 9, revision: 1 }, true), input.SimulationInputError, 'Edit cannot change Project/module');
for (const query of ['limit=101', 'offset=-1', 'sort=sql', 'direction=sideways', 'projectId=0']) assert.throws(() => input.simulationListQuery(new URLSearchParams(query)));
assert.throws(() => input.simulationId(2147483648));

const tables = Object.fromEntries(['project', 'projectThreed', 'projectThreedMarkers', 'threed', 'threedScenarios', 'threedSimulations'].map(name => [name, new Proxy({}, { get: (_, field) => `${name}.${field}` })]));
const orm = Object.fromEntries(['and', 'eq', 'asc', 'desc', 'ilike', 'or'].map(name => [name, (...args) => ({ name, args })]));
orm.sql = (strings, ...args) => ({ strings: [...strings], args });
let queue = [], queries = [], signedIn = true;
const db = { transaction: async fn => fn(db) };
for (const method of ['select', 'insert', 'update', 'delete']) db[method] = (...args) => {
  const query = { method, args }, chain = {};
  for (const name of ['from', 'innerJoin', 'leftJoin', 'where', 'orderBy', 'limit', 'offset', 'values', 'set', 'returning', 'for']) chain[name] = (...values) => { (query[name] ??= []).push(values); return chain; };
  chain.then = (resolve, reject) => { queries.push(query); assert(queue.length, 'Unexpected database read/write'); const next = queue.shift(); return Promise.resolve(next).then(resolve, reject); };
  return chain;
};
const api = load('src/app/api/threed/simulations/route.ts', {
  'next/server': { NextResponse: { json: (data, options) => ({ data, status: options.status, headers: options.headers }) } },
  'drizzle-orm': orm, '@/libraries/auth': { auth: async () => signedIn ? { user: { id: 'owner' } } : null }, '@/libraries/db/client': { db },
  '@/libraries/schema/project': tables, '@/libraries/schema/threed': tables,
  '@/libraries/services/threed/simulations/simulation-input': input, '@/libraries/services/threed/orchestration/action-target-core': actions,
  '@/libraries/services/threed/physics/sensor-group-core': sensor, '@/libraries/services/threed/physics/sensor-legacy-compat': { ...legacy, IMPORTED_SENSOR_GROUP: { id: 'imported', name: 'Imported' } },
  '@/libraries/services/threed/physics/sensor-cuboid-core': cuboids,
  '@/libraries/services/threed/models/project-model-instance-core': ballCore.exports,
  '@/libraries/services/threed/simulations/simulation-preview-contract': load(root + 'simulations/simulation-preview-contract.ts'),
});
const record = { ...valid, id: 9, revision: 1 };
const choices = [[{ metadata: { physicsSensorGroups: [{ id: 'group1', name: 'Goals' }] } }], [{ markerId: 'characters-9', markerType: 'characters', name: 'Kate' }, { markerId: 'models-5', markerType: 'models', name: 'Field' }]];
async function run(method, query, data, responses = [], origin = null) {
  queue = [...responses]; queries = [];
  const result = await api[method]({ url: `https://fixture.invalid/api/threed/simulations${query}`, headers: { get: name => name === 'origin' ? origin : null }, text: async () => typeof data === 'string' ? data : JSON.stringify(data) });
  assert.equal(queue.length, 0); return result;
}
const predicates = query => JSON.stringify(query.where);
(async () => {
  signedIn = false; for (const method of ['GET', 'POST', 'PATCH', 'DELETE']) assert.equal((await run(method, '', valid)).status, 401); signedIn = true;
  assert.equal((await run('GET', '?id=bad')).status, 400);
  assert.equal((await run('GET', '?id=9', null, [[]])).status, 404);
  const row = { simulation: record, projectName: 'One', threedName: 'Garden', actionCount: 1, observationCount: 1 };
  assert.equal((await run('GET', '?id=9', null, [[row]])).data.data.id, 9);
  assert.equal(queries[0].limit[0][0], 1);
  for (const table of ['threedSimulations', 'project', 'threed']) assert(predicates(queries[0]).includes(`${table}.userId`));
  assert.equal(queries[0].leftJoin, undefined, 'Simulation reads never join Scenarios');
  assert.equal((await run('GET','?scenarioId=7')).status,400);
  const list = await run('GET', '?limit=25&offset=25&sort=revision&direction=desc', null, [[row], [{ total: 51 }]]);
  assert.equal(list.data.pagination.total, 51); assert.equal(list.data.data[0].actionCount, 1);
  assert.equal(list.headers['Cache-Control'], 'private, no-store');
  assert(!Object.hasOwn(queries[0].args[0].simulation, 'definition'), 'List projection omits full definitions');
  assert.equal(queries[0].offset[0][0], 25);
  assert.equal((await run('GET', '?options=1&projectId=15&threedId=1', null, [[]])).status, 404);
  const options = await run('GET', '?options=1&projectId=15&threedId=1', null, choices);
  assert.equal(options.data.data.groups.length, 2);
  assert(!Object.hasOwn(options.data.data.markers[0], 'data') && !Object.hasOwn(options.data.data.markers[0], 'metadata'), 'Choices expose capability flags, not private marker payloads');
  assert.equal(options.data.data.markers[0].preview, null, 'Missing saved positions are not fabricated');
  const projected = await run('GET', '?options=1&projectId=15&threedId=1', null, [choices[0], [{ ...choices[1][0], sourceAssetId: 9,
    positionX: '-10.5', positionY: '0.2', positionZ: '2', isVisible: true, data: { rotation: 90, scale: 0.5, privateNote: 'excluded' }, metadata: { secret: 'excluded' } }]]);
  assert.equal(JSON.stringify(projected.data.data.markers[0].preview.position), '[-10.5,0.2,2]');
  assert.equal(projected.data.data.markers[0].preview.rotation[1], Math.PI / 2);
  assert(!JSON.stringify(projected.data).includes('excluded'), 'Private options expose a bounded pose projection only');
  for (const query of queries) assert(predicates(query).includes('owner'));
  assert.equal((await run('POST', '', valid, [], 'https://evil.invalid')).status, 400);
  assert.equal((await run('POST', '', ' '.repeat(65537))).status, 400);
  assert.equal((await run('POST', '', valid, [[]])).status, 404);
  assert.equal((await run('POST', '', { ...valid, scenarioId: 99 })).status, 400);
  assert.equal((await run('POST', '', { ...valid, definition: { ...definition, steps: [{ ...step, actorMarkerId: 'private' }] } }, choices)).status, 400);
  assert.equal((await run('POST', '', { ...valid, definition: { ...definition, steps: [{ ...step, action: 'watering' }] } }, choices)).status, 400);
  assert.equal((await run('POST', '', { ...valid, definition: { ...definition, observations: [{ ...definition.observations[0], sensorGroupId: 'private' }] } }, choices)).status, 400);
  assert.equal((await run('POST', '', valid, [...choices, [record]])).status, 201);
  assert.equal(queries.at(-1).values[0][0].userId, 'owner');
  const soccerDefinition = { version: 1, steps: [{ ...step, action: 'runToTarget' }, { ...step, id: 'kick', action: 'kickBall' }], observations: [] };
  assert.equal((await run('POST', '', { ...valid, definition: soccerDefinition }, choices)).status, 400, 'Ordinary Model and rigless/nonmovable actor cannot receive Soccer Actions');
  const soccerChoices = [choices[0], [{ ...choices[1][0], data: { isMovable: true }, metadata: {} }, { ...choices[1][1], metadata: { physicsMode: 'ball' } }]];
  assert.equal((await run('POST', '', { ...valid, definition: soccerDefinition }, [...soccerChoices, [record]])).status, 201);
  const sensorChoices = [choices[0], [{ ...choices[1][0], id: 101 }, { ...choices[1][1], id: 102, metadata: { physicsVolumeSensor: { id: 'model-volume', name: 'Goal', behavior: 'counter', detection: 'movable-ball', groupId: 'group1' } } }]];
  const selectedSensors = { ...valid, definition: { ...definition, observations: [{ ...definition.observations[0], sensors: [{ ownerMarkerId: 102, id: 'model-volume' }] }] } };
  assert.equal((await run('POST', '', selectedSensors, [...sensorChoices, [record]])).status, 201);
  assert.equal((await run('POST', '', { ...selectedSensors, definition: { ...selectedSensors.definition, observations: [{ ...selectedSensors.definition.observations[0], sensors: [{ ownerMarkerId: 999, id: 'model-volume' }] }] } }, sensorChoices)).status, 400, 'Foreign Sensor selection rejected');
  await run('GET', '?projectId=15&threedId=1&isActive=true', null, [[row], [{ total: 1 }]]);
  for (const field of ['projectId', 'threedId', 'isActive']) assert(predicates(queries[0]).includes(`threedSimulations.${field}`), 'Scene picker filters exact bindings');
  const { projectId, threedId, ...edit } = { ...valid, id: 9, revision: 1 };
  assert.equal((await run('PATCH', '', edit, [[]])).status, 404);
  assert.equal((await run('PATCH', '', edit, [[{ ...record, revision: 2 }]])).status, 409);
  assert.equal((await run('PATCH', '', edit, [[record], ...choices, [{ ...record, revision: 2 }]])).status, 200);
  assert.equal(queries[0].for[0][0], 'update');
  assert.equal(queries.at(-1).set[0][0].revision, 2);
  assert(predicates(queries.at(-1)).includes('threedSimulations.revision'));
  assert(!Object.hasOwn(queries.at(-1).set[0][0], 'projectId'));
  assert.equal((await run('DELETE', '?id=9&revision=1', null, [[]])).status, 409);
  assert.equal((await run('DELETE', '?id=9&revision=1', null, [[{ id: 9 }]])).status, 200);
  assert(predicates(queries[0]).includes('threedSimulations.userId')); assert(predicates(queries[0]).includes('threedSimulations.revision'));
  console.log('PASS: Simulation bounded parser, private reads, scoped choices/references, immutable binding, revision conflict/lock and deletion; no Scene dispatch or database connection.');
})().catch(e => { console.error(e); process.exitCode = 1; });
