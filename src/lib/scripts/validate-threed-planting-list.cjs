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
const parser = load('src/lib/services/threed/plantings/planting-list-query.ts', {});
const schema = Object.fromEntries(['threedPlantings', 'threedPlants', 'threedBeds'].map(name => [name, new Proxy({}, { get: (_, column) => `${name}.${column}` })]));
schema.plantingStatusEnum = { enumValues: ['planned', 'planted', 'growing', 'harvesting', 'harvested', 'failed'] };
const orm = Object.fromEntries(['eq', 'and', 'asc', 'desc', 'inArray'].map(name => [name, (...args) => ({ name, args })]));
orm.sql = (strings, ...args) => ({ strings: [...strings], args });
orm.getTableColumns = () => ({ id: 'threedPlantings.id' });
let queries = [], queue = [], signedIn = true;
const db = { select(selection) { const query = { selection }; const chain = {};
  for (const method of ['from', 'where', 'orderBy', 'limit', 'offset']) chain[method] = (...args) => { query[method] = args; return chain; };
  chain.leftJoin = (...args) => { (query.joins ??= []).push(args); return chain; };
  chain.then = (resolve, reject) => { queries.push(query); assert.ok(queue.length); return Promise.resolve(queue.shift()).then(resolve, reject); }; return chain;
} };
const api = load('src/app/api/threed/plantings/route.ts', {
  '@/lib/services/threed/plantings/planting-list-query': parser,
  '@/lib/services/threed/models/model-primary-file': {},
  'next/server': { NextResponse: { json: (body, init) => ({ body, status: init?.status ?? 200 }) } },
  '@/lib/auth': { auth: async () => signedIn ? { user: { id: 'owner' } } : null }, '@/lib/db/client': { db }, '@/lib/schema/threed': schema, 'drizzle-orm': orm, '@/lib/db/sequence': {},
});
async function run(query, responses = []) { queries = []; queue = responses; const result = await api.GET({ url: `http://localhost/api/threed/plantings?${query}` }); assert.equal(queue.length, 0); return result; }
(async () => {
  for (const query of ['limit=0', 'limit=201', 'offset=-1', 'sort=sql', 'direction=sideways', 'isActive=yes', 'status=wrong', 'plantId=0', 'bedId=oops', 'plantId=2147483648', 'limit=2.5', 'offset=Infinity', `search=${'a'.repeat(201)}`]) assert.equal((await run(query)).status, 400);
  signedIn = false; assert.equal((await run('')).status, 401); signedIn = true;
  for (const size of [1, 50, 200]) {
    const rows = Array.from({ length: size }, (_, id) => ({ id }));
    const result = await run(`limit=${size}&offset=200&search=Rose&status=planted&isActive=true&plantId=7&bedId=8&sort=plant&direction=asc`, [[{ count: '452' }], rows]);
    assert.equal(result.body.pagination.total, 452); assert.equal(queries.length, 2);
    assert.equal(queries[1].limit[0], size); assert.equal(queries[1].offset[0], 200);
    assert.deepEqual(queries[0].where, queries[1].where);
    assert.deepEqual(queries[0].joins, queries[1].joins);
    assert.equal(queries[0].joins.length, 2);
    for (const [table, join] of queries[0].joins) { assert.equal(join.name, 'and'); assert.equal(join.args[1].args[0], table.userId); assert.equal(join.args[1].args[1], 'owner'); }
    assert.equal(queries[1].selection.plant, schema.threedPlants); assert.equal(queries[1].selection.bed, schema.threedBeds);
    const where = queries[0].where[0]; assert.equal(where.name, 'and');
    assert.equal(where.args[0].args[0], 'threedPlantings.userId'); assert.equal(where.args[0].args[1], 'owner');
    const search = where.args.at(-1); assert.ok(search.strings[0].startsWith('(')); assert.ok(search.strings.at(-1).endsWith(')'));
    assert.equal(queries[1].orderBy[1].args[0], 'threedPlantings.id');
  }
  await run('', [[{ count: 0 }], []]); assert.equal(queries[1].limit[0], 50); assert.equal(queries[1].offset[0], 0); assert.equal(queries[1].orderBy[0].name, 'desc'); assert.equal(queries[1].orderBy[0].args[0], 'threedPlantings.createdAt');
  for (const sort of parser.PLANTING_LIST_SORTS) for (const direction of ['asc', 'desc']) {
    await run(`sort=${sort}&direction=${direction}`, [[{ count: 0 }], []]);
    assert.equal(queries[1].orderBy[0].name, direction);
  }
  // Exercise the real bulk-delete handler with a partial failure and off-page selection.
  const text = fs.readFileSync('src/components/admin/threed/plantings/ThreeDPlantingsCRUD.tsx', 'utf8');
  const ast = ts.createSourceFile('plantings.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let handler;
  function visit(node) { if (ts.isFunctionDeclaration(node) && node.name?.text === 'deleteSelected') handler = node; ts.forEachChild(node, visit); } visit(ast);
  const requests = []; let notice, refreshed = 0;
  const context = { plantings: [{ id: 1, plantingId: 'Rose' }, { id: 2, plantingId: 'Mint' }], selected: new Set([1, 2, 999]), bulkBusy: false, loading: false, isSubmitting: false,
    confirm: () => true, setBulkBusy() {}, setBulkNotice: value => { notice = value; }, setSelected() {}, fetchPlantings: () => refreshed++, onModuleUpdate() {},
    fetch: async url => { requests.push(url); return { ok: !url.endsWith('=1'), json: async () => ({ success: !url.endsWith('=1'), error: 'Protected' }) }; },
  };
  const remove = vm.runInNewContext(compile(`(${handler.getText(ast)})`), context); await remove();
  assert.deepEqual(requests, ['/api/threed/plantings?id=1', '/api/threed/plantings?id=2']); assert.match(notice, /Deleted 1 of 2/); assert.match(notice, /Rose: Protected/); assert.equal(refreshed, 1);
  requests.length = 0; context.confirm = () => false; await remove(); assert.equal(requests.length, 0);
  console.log('PASS: bounded/authorized Planting list, grouped search, filter/count parity, every sort direction, partial bulk deletion and page-local targets');
})().catch(error => { console.error(error); process.exitCode = 1; });
