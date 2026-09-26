const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(path, mocks) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
    { exports, Date, console, require(name) { assert(name in mocks, name); return mocks[name]; } });
  return exports;
}
const groups = load('src/libraries/services/threed/physics/sensor-group-core.ts', {});
const compat = load('src/libraries/services/threed/physics/sensor-legacy-compat.ts', {});
const sensors = load('src/libraries/services/threed/physics/sensor-cuboid-core.ts', { './sensor-legacy-compat': compat });
const schema = Object.fromEntries(['project', 'projectThreedMarkers'].map(name => [name, new Proxy({}, { get: (_, key) => name + '.' + String(key) })]));
const orm = Object.fromEntries(['eq', 'and'].map(name => [name, (...args) => ({ name, args })]));
let signedIn = true, queue = [], reads = [], writes = [], failure = false;
const db = {
  transaction: async callback => callback(db),
  select(selection) {
    const query = { selection }; const chain = {};
    for (const method of ['from', 'where', 'for']) chain[method] = (...args) => { query[method] = args; return chain; };
    chain.then = (resolve, reject) => { reads.push(query); if (failure) return Promise.reject(new Error('private database detail')).then(resolve, reject); assert(queue.length); return Promise.resolve(queue.shift()).then(resolve, reject); };
    return chain;
  },
  update(table) { const write = { table }; return { set(values) { write.values = values; return { where(condition) { write.condition = condition; writes.push(write); return Promise.resolve(); } }; } }; },
};
const api = load('src/app/api/project/sensor-groups/route.ts', {
  'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } },
  '@/libraries/auth': { auth: async () => signedIn ? { user: { id: 'owner' } } : null },
  '@/libraries/db/client': { db }, '@/libraries/schema/project': schema, 'drizzle-orm': orm,
  '@/libraries/services/threed/physics/sensor-group-core': groups,
  '@/libraries/services/threed/physics/sensor-legacy-compat': compat,
  '@/libraries/services/threed/physics/sensor-cuboid-core': sensors,
});
async function run(method, body, responses = [], id = '15') {
  reads = []; writes = []; queue = responses;
  const result = await api[method]({ nextUrl: new URL('http://localhost/api/project/sensor-groups?projectId=' + id), json: async () => body });
  assert.equal(queue.length, 0);
  return result;
}
(async () => {
  signedIn = false; assert.equal((await run('GET')).status, 401); assert.equal(reads.length, 0); signedIn = true;
  assert.equal((await run('GET', null, [], 'bad')).status, 400);
  assert.equal((await run('GET', null, [[]])).status, 404);
  let result = await run('GET', null, [[{ metadata: { unrelated: 'retained' } }]]);
  assert.equal(result.body.data[0].id, 'imported-sensors');
  assert.equal(writes.length, 0);
  assert.equal(reads[0].where[0].args[1].args[0], 'project.userId');
  assert.equal(reads[0].where[0].args[1].args[1], 'owner');
  const group = { id: 'g1', name: 'Named Group' };
  result = await run('PATCH', { operation: 'upsert', group }, [[{ metadata: { unrelated: 'retained' } }]]);
  assert.equal(result.status, 200);
  assert.equal(writes[0].values.metadata.unrelated, 'retained');
  assert.equal(writes[0].values.metadata.physicsSensorGroups.at(-1).name, 'Named Group');
  assert.equal(reads[0].for[0], 'update');
  result = await run('PATCH', { operation: 'upsert', group: { ...group, name: 'Renamed' } }, [[{ metadata: { physicsSensorGroups: [group] } }]]);
  assert.equal(result.body.data.filter(item => item.id === 'g1').length, 1);
  assert.equal(result.body.data.find(item => item.id === 'g1').name, 'Renamed');
  result = await run('PATCH', { operation: 'upsert', group: { id: 'g1', name: '' } }, [[{ metadata: {} }]]);
  assert.equal(result.status, 400); assert.equal(writes.length, 0);
  const sensor = { id: 'one', name: 'Entry', behavior: 'counter', detection: 'model', groupId: 'g1', position: { x: 0, y: 1, z: 0 }, width: 2, height: 2, depth: .2, rotationY: 0 };
  result = await run('PATCH', { operation: 'delete', group }, [[{ metadata: { physicsSensorGroups: [group] } }], [{ metadata: { physicsSensorCuboids: [sensor] } }]]);
  assert.equal(result.status, 400); assert.equal(writes.length, 0);
  result = await run('PATCH', { operation: 'delete', group }, [[{ metadata: { physicsSensorGroups: [group] } }], []]);
  assert.equal(result.status, 200); assert(!result.body.data.some(item => item.id === 'g1'));
  failure = true; result = await run('GET'); failure = false;
  assert.equal(result.status, 500); assert(!result.body.error.includes('private'));
  console.log('PASS: actual Sensor Groups handlers with mocked DB — auth, owner scope, lock, metadata preservation, rename, occupied deletion, validation and sanitized failures');
})().catch(error => { console.error(error); process.exitCode = 1; });
