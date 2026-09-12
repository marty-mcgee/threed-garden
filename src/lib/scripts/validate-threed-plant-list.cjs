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
const parser = load('src/lib/services/threed/plants/plant-list-query.ts', {});
const schema = Object.fromEntries(['threedPlants', 'threedModels'].map(name => [name, new Proxy({}, { get: (_, column) => `${name}.${column}` })]));
schema.plantTypeEnum = { enumValues: ['Vegetable', 'Fruit', 'Herb', 'Flower', 'Tree', 'Shrub', 'CoverCrop'] };
schema.plantStatusEnum = { enumValues: ['active', 'inactive', 'archived'] };
const orm = Object.fromEntries(['eq', 'and', 'asc', 'desc', 'inArray'].map(name => [name, (...args) => ({ name, args })]));
orm.sql = (strings, ...args) => ({ strings: [...strings], args });
let queries = [], queue = [], signedIn = true;
const db = { select(selection) { const query = { selection }; const chain = {};
  for (const method of ['from', 'where', 'orderBy', 'limit', 'offset']) chain[method] = (...args) => { query[method] = args; return chain; };
  chain.then = (resolve, reject) => { queries.push(query); assert.ok(queue.length); return Promise.resolve(queue.shift()).then(resolve, reject); }; return chain;
} };
const api = load('src/app/api/threed/plants/route.ts', {
  '@/lib/services/threed/plants/plant-list-query': parser,
  '@/lib/services/threed/models/model-primary-file': { modelSelection: () => ({ id: 'model.id' }) },
  'next/server': { NextResponse: { json: (body, init) => ({ body, status: init?.status ?? 200 }) } },
  '@/lib/auth': { auth: async () => signedIn ? { user: { id: 'owner' } } : null }, '@/lib/db/client': { db }, '@/lib/schema/threed': schema, 'drizzle-orm': orm, '@/lib/db/sequence': {},
});
async function run(query, responses = []) { queries = []; queue = responses; const result = await api.GET({ url: `http://localhost/api/threed/plants?${query}` }); assert.equal(queue.length, 0); return result; }
(async () => {
  for (const query of ['limit=0', 'limit=201', 'offset=-1', 'sort=sql', 'direction=sideways', 'isActive=yes', 'type=wrong', 'status=wrong', `search=${'a'.repeat(201)}`]) assert.equal((await run(query)).status, 400);
  signedIn = false; assert.equal((await run('')).status, 401); signedIn = true;
  for (const size of [1, 50, 200]) {
    const rows = Array.from({ length: size }, (_, id) => ({ id, modelId: 7 }));
    const result = await run(`limit=${size}&offset=200&search=Rose&type=Flower&status=active&isActive=true&sort=name&direction=asc`, [[{ count: '452' }], rows, [{ id: 7 }]]);
    assert.equal(result.body.pagination.total, 452); assert.equal(queries.length, 3);
    assert.deepEqual(queries[0].where, queries[1].where);
    const where = queries[0].where[0]; assert.equal(where.name, 'and');
    assert.equal(where.args[0].args[0], 'threedPlants.userId'); assert.equal(where.args[0].args[1], 'owner');
    const search = where.args.at(-1); assert.ok(search.strings[0].startsWith('(')); assert.ok(search.strings.at(-1).endsWith(')'));
    assert.equal(queries[1].orderBy[1].args[0], 'threedPlants.id');
    assert.equal(result.body.data[0].model.id, 7);
  }
  for (const sort of parser.PLANT_LIST_SORTS) for (const direction of ['asc', 'desc']) {
    await run(`sort=${sort}&direction=${direction}`, [[{ count: 0 }], []]);
    assert.equal(queries[1].orderBy[0].name, direction);
  }
  // Exercise the real bulk-delete handler with a partial failure and off-page selection.
  const text = fs.readFileSync('src/components/admin/threed/plants/ThreeDPlantsCRUD.tsx', 'utf8');
  const ast = ts.createSourceFile('plants.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let handler;
  function visit(node) { if (ts.isFunctionDeclaration(node) && node.name?.text === 'deleteSelected') handler = node; ts.forEachChild(node, visit); } visit(ast);
  const requests = []; let notice, refreshed = 0;
  const context = { plants: [{ id: 1, commonName: 'Rose' }, { id: 2, commonName: 'Mint' }], selected: new Set([1, 2, 999]), bulkBusy: false, loading: false, isSubmitting: false,
    confirm: () => true, setBulkBusy() {}, setBulkNotice: value => { notice = value; }, setSelected() {}, fetchPlants: () => refreshed++, onModuleUpdate() {},
    fetch: async url => { requests.push(url); return { ok: !url.endsWith('=1'), json: async () => ({ success: !url.endsWith('=1'), error: 'Protected' }) }; },
  };
  const remove = vm.runInNewContext(compile(`(${handler.getText(ast)})`), context); await remove();
  assert.deepEqual(requests, ['/api/threed/plants?id=1', '/api/threed/plants?id=2']); assert.match(notice, /Deleted 1 of 2/); assert.match(notice, /Rose: Protected/); assert.equal(refreshed, 1);
  console.log('PASS: bounded/authorized Plant list, grouped search, filter/count parity, every sort direction, constant Model lookup count, partial bulk deletion and page-local targets');
})().catch(error => { console.error(error); process.exitCode = 1; });
