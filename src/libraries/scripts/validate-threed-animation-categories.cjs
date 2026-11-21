const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, dependencies = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    exports, require: name => { assert.ok(name in dependencies, name); return dependencies[name]; },
  }); return exports;
}
const contracts = load('src/libraries/services/threed/animations/contracts.ts', { '@/libraries/utils/animation': load('src/libraries/utils/animation.ts') });
const schema = new Proxy({}, { get: (_, table) => new Proxy({}, { get: (_, column) => `${String(table)}.${String(column)}` }) });
const orm = Object.fromEntries(['and', 'asc', 'eq', 'inArray'].map(kind => [kind, (...args) => ({ kind, args })]));
let queue = [], queries = [];
const db = {};
for (const operation of ['select', 'insert', 'update', 'delete']) db[operation] = () => {
  const chain = {}, query = { operation };
  for (const method of ['from', 'where', 'orderBy', 'limit', 'for', 'set', 'values', 'returning']) chain[method] = (...args) => { query[method] = args; return chain; };
  chain.then = (resolve, reject) => {
    assert.ok(queue.length); queries.push(query);
    const next = queue.shift();
    return (next instanceof Error ? Promise.reject(next) : Promise.resolve(next)).then(resolve, reject);
  };
  return chain;
};
orm.sql = (strings, ...args) => ({ strings: [...strings], args });
orm.sql.join = (items, separator) => ({ items, separator });
db.transaction = work => work(db);
const service = load('src/libraries/services/threed/animations/categories.ts', { 'drizzle-orm': orm, '@/libraries/db/client': { db }, '@/libraries/schema/threed': schema, './contracts': contracts });
const bulk = load('src/libraries/services/threed/bulk-edit/animation-categories.ts', {
  'node:crypto': require('node:crypto'),
  'drizzle-orm': orm,
  '@/libraries/schema/threed': schema,
  './contract': load('src/libraries/services/threed/bulk-edit/contract.ts', {
    './fields': {},
    '../list-sort-order': load('src/libraries/services/threed/list-sort-order.ts'),
  }),
});
async function checkBulkNames() {
  const stamp = '2026-11-20T12:00:00.000Z';
  const rows = ['Idle', 'Walk', 'Run'].map((name, index) => ({ id: index + 1, name, updatedAt: stamp }));
  const selected = rows.map(row => ({ id: row.id, expectedUpdatedAt: stamp }));
  const swap = new Map([[1, 'Walk'], [2, 'Idle']]);
  const changed = [{ id: 1 }, { id: 2 }];
  const rename = (names = swap) => bulk.renameBulkAnimationCategories(db, 'owner', selected, names);
  queue = [rows, changed, changed]; queries = [];
  assert.equal(await rename(), 3);
  assert.equal(queries[0].for[0], 'update');
  const [stage, save] = queries.slice(1);
  assert.deepEqual(Object.keys(stage.set[0]), ['name']);
  assert.deepEqual(Object.keys(save.set[0]).sort(), ['name', 'updatedAt']);
  assert.equal(JSON.stringify(stage.where), JSON.stringify(save.where));
  assert.match(JSON.stringify(save.where), /owner/);
  assert.deepEqual(Array.from(save.set[0].name.args[1].items, branch => Array.from(branch.args)), [[1, 'Walk'], [2, 'Idle']]);
  assert.equal(queue.length, 0);

  for (const [locked, status] of [[rows.slice(1), 404], [rows.map(row => ({ ...row, updatedAt: null })), 409]]) {
    queue = [locked]; queries = [];
    await assert.rejects(rename(), error => error.status === status);
    assert.equal(queries.length, 1);
  }
  queue = [rows]; queries = [];
  await assert.rejects(rename(new Map([[1, 'Run']])), error => error.status === 400);
  assert.equal(queries.length, 1, 'A duplicate final name in the selection is detected before staging');
  const uniqueConflict = Object.assign(Error('Postgres conflict'), { code: '23505', constraint: 'idx_animation_categories_owner_name' });
  for (const writes of [[[]], [changed, []], [changed, Error('Drizzle wrapper', { cause: uniqueConflict })]]) {
    queue = [rows, ...writes]; queries = [];
    await assert.rejects(rename(), error => error.status === 409);
    assert.equal(queue.length, 0);
  }
}
for (const body of [{ name: '' }, { name: 'a'.repeat(121) }, { name: 'Farming', userId: 'other' }]) assert.throws(() => service.parseCategory(body));
assert.equal(service.parseCategory({ name: ' Farming ' }).name, 'Farming');
for (const categoryIds of [[1, 1], [-1], ['bad'], Array(101).fill(1)]) assert.throws(() => service.parseCategoryAssignment({ animationId: 1, categoryIds }));
(async () => {
  queue = [[{ id: 2, name: 'Shared', slotUsage: 1, clipUsage: 2 }]]; queries = [];
  await service.listCategories('owner'); assert.match(JSON.stringify(queries[0].where), /owner/); assert.equal(queries[0].limit[0],500);
  queue = [[]]; await assert.rejects(service.assignCategories('owner', { animationId: 1, categoryIds: [2] }), e => e.status === 404);
  queue = [[{ id: 1 }], []]; await assert.rejects(service.assignCategories('owner', { animationId: 1, categoryIds: [2] }), e => e.status === 400);
  assert.ok(!queries.some(q => q.operation === 'delete'));
  queue = [[{ id: 1 }], [{ id: 2 }, { id: 3 }], [], []]; queries = [];
  await service.assignCategories('owner', { animationId: 1, categoryIds: [2, 3] });
  assert.equal(queries.at(-1).values[0].length, 2);
  for (const query of queries) assert.match(JSON.stringify(query), /owner/);
  queue = [[{ id: 1 }], []]; queries = [];
  await service.assignCategories('owner', { animationId: 1, categoryIds: [] });
  assert.equal(queries.at(-1).operation, 'delete');
  assert.equal(queue.length, 0);
  await checkBulkNames();
  console.log('PASS: category bounds and assignments, bulk name swaps, owner and stamp checks, uniqueness conflicts and incomplete writes (offline).');
})().catch(e => { console.error(e); process.exitCode = 1; });
