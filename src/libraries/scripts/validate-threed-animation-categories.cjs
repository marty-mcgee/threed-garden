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
  chain.then = (resolve, reject) => { assert.ok(queue.length); queries.push(query); return Promise.resolve(queue.shift()).then(resolve, reject); };
  return chain;
};
orm.sql = (strings, ...args) => ({ strings: [...strings], args });
db.transaction = work => work(db);
const service = load('src/libraries/services/threed/animations/categories.ts', { 'drizzle-orm': orm, '@/libraries/db/client': { db }, '@/libraries/schema/threed': schema, './contracts': contracts });
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
  console.log('PASS: category bounds, ownership rejection, multi-category assignment and clearing (offline).');
})().catch(e => { console.error(e); process.exitCode = 1; });
