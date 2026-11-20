const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const compile = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
function load(path, mocks) {
  const exports = {};
  vm.runInNewContext(compile(fs.readFileSync(path, 'utf8')), { exports, URL, URLSearchParams, Buffer, console, require(name) { assert.ok(name in mocks, name); return mocks[name]; } });
  return exports;
}
const parser = load('src/libraries/services/threed/harvests/harvest-list-query.ts', {});
const rank = load('src/libraries/services/threed/list-sort-order.ts', {});
const edit = load('src/libraries/services/threed/harvests/harvest-edit.ts', { '../list-sort-order': rank });
const schema = Object.fromEntries(['threedHarvests', 'threedPlantings', 'threedPlants', 'threedBeds', 'projectAssets', 'project'].map(name => [name, new Proxy({}, { get: (_, column) => `${name}.${column}` })]));
const orm = Object.fromEntries(['eq', 'and', 'asc', 'desc', 'inArray'].map(name => [name, (...args) => ({ name, args })]));
orm.sql = (strings, ...args) => ({ strings: [...strings], args });
orm.getTableColumns = table => ({ id: table.id, sortOrder: table.sortOrder });
let queries = [], queue = [], signedIn = true;
function build(query) {
  const chain = { fixture: query };
  for (const method of ['from', 'where', 'orderBy', 'limit', 'offset', 'for', 'set', 'returning', 'values']) chain[method] = (...args) => { query[method] = args; return chain; };
  chain.then = (resolve, reject) => {
    queries.push(query); assert.ok(queue.length);
    const result = queue.shift();
    return (result instanceof Error ? Promise.reject(result) : Promise.resolve(result)).then(resolve, reject);
  };
  return chain;
}
const db = {
  select: selection => build({ selection }),
  update: table => build({ update: table }),
  insert: table => build({ insert: table }),
  transaction: async run => { const result = await run(db); queries.push({ commit: true }); return result; },
  $with: () => ({ as: source => { queries.push(source.fixture); return schema.threedHarvests; } }),
  with: () => db,
  execute: async statement => { queries.push({ execute: statement }); const result = queue.shift(); if (result instanceof Error) throw result; },
};
const mocks = {
  '@/libraries/services/threed/harvests/harvest-list-query': parser,
  '@/libraries/services/threed/harvests/harvest-edit': edit,
  '@/libraries/services/threed/list-sort-order': rank,
  '@/libraries/schema/project': schema,
  'next/server': { NextResponse: { json: (body, init) => ({ body, status: init?.status ?? 200 }) } },
  '@/libraries/auth': { auth: async () => signedIn ? { user: { id: 'owner' } } : null }, '@/libraries/db/client': { db }, '@/libraries/schema/threed': schema, 'drizzle-orm': orm, '@/libraries/db/sequence': { ensureTableSequence: async () => {} },
};
const api = load('src/app/api/threed/harvests/route.ts', mocks);
const manage = load('src/app/api/threed/harvests/manage/route.ts', mocks);
async function run(query, responses = []) { queries = []; queue = responses; const result = await api.GET({ url: `http://localhost/api/threed/harvests?${query}` }); assert.equal(queue.length, 0); return result; }
(async () => {
  for (const query of ['limit=0','limit=201','limit=2x','offset=-1','sort=sql','direction=sideways','isActive=yes','projectId=0','moduleId=oops','plantingId=-1','plantId=2147483648',`search=${'x'.repeat(201)}`]) assert.equal((await run(query)).status,400);
  signedIn=false; assert.equal((await run('')).status,401); signedIn=true;
  for (const sort of parser.HARVEST_LIST_SORTS) for (const direction of ['asc','desc']) {
    await run(`sort=${sort}&direction=${direction}&search=Rose&limit=25&offset=100`, [[{count:'452'}],[]]);
    assert.deepEqual(queries[0].where,queries[1].where);
    assert.equal(queries[1].limit[0],25); assert.equal(queries[1].offset[0],100);
    assert.equal(queries[1].orderBy[0].name,direction);
    assert.equal(queries[1].orderBy.at(-1).args[0],'threedHarvests.id');
    if (sort === 'sortOrder') assert.equal(queries[1].orderBy[1].args[0], 'threedHarvests.harvestDate');
    const where=queries[0].where[0]; assert.equal(where.args[0].args[1],'owner');
    const search=where.args.at(-1); assert.ok(search.strings[0].startsWith('(')); assert.ok(search.strings.at(-1).endsWith(')'));
    assert.match(JSON.stringify(search),/threedPlants.userId/); assert.match(JSON.stringify(search),/threedPlantings.userId/);
  }
  const scoped=await run('projectId=5', [[{assetId:7}],[{count:'1'}],[{id:7,harvestId:'pick',plantingId:2}], [{id:2,plantId:3}], [{assetId:7,projectId:5,moduleId:1,config:{source:'world-action'}}], [{id:3,commonName:'Rose'}]]);
  assert.equal(scoped.body.pagination.total,1); assert.equal(scoped.body.data[0].plant.commonName,'Rose'); assert.equal(scoped.body.data[0].source,'world-action');
  assert.deepEqual(queries[1].where,queries[2].where);
  assert.equal(queries[0].where[0].args[0].args[1],'owner');
  assert.equal(queries[0].where[0].args[3].args[1],true);
  assert.equal((await run('moduleId=5',[[]])).body.pagination.total,0);
  await run('',[[{count:0}],[]]); assert.equal(queries[1].limit[0],50); assert.equal(queries[1].orderBy[0].args[0],'threedHarvests.harvestDate');
  const missingRank = Object.assign(Error('column "sort_order" does not exist'), { code: '42703' });
  await run('sort=sortOrder', [[{ count: 0 }], missingRank, []]);
  assert.equal(queries[2].orderBy[0].args[0], 'threedHarvests.harvestDate');
  assert.equal((await api.POST({ json: async () => ({ harvestId: 'New', plantId: 2, harvestDate: '2026-11-31' }) })).status, 400);
  queries = []; queue = [[{ id: 2 }], [{ id: 7, harvestId: 'New' }]];
  assert.equal((await api.POST({ json: async () => ({ harvestId: 'New', plantId: 2, harvestDate: '2026-11-20', isActive: false }) })).status, 200);
  assert.equal(queries[1].values[0].harvestDate.toISOString(), '2026-11-20T00:00:00.000Z');
  assert.equal(queries[1].values[0].isActive, false);
  queries = []; queue = [[{ id: 7 }], [{ id: 7, harvestId: 'New' }]];
  assert.equal((await api.PUT({ url: 'http://localhost/api/threed/harvests?id=7', json: async () => ({ harvestDate: '2026-11-21' }) })).status, 200);
  assert.equal(queries[1].set[0].harvestDate.toISOString(), '2026-11-21T00:00:00.000Z');

  async function manageRows(body, results = [], project = '') {
    queries = []; queue = results;
    const response = await manage.PATCH({ url: 'http://localhost/api/threed/harvests/manage' + project, text: async () => JSON.stringify(body) });
    assert.equal(queue.length, 0);
    return response;
  }
  const version = '2026-11-20T10:00:00.000Z';
  const selection = [{ id: 7, expectedUpdatedAt: version }, { id: 8, expectedUpdatedAt: null }];
  const rows = [{ id: 7, updatedAt: new Date(version) }, { id: 8, updatedAt: null }];
  const changes = { quantity: '1.50', weightLbs: null, unit: 'kg', isActive: false };
  const bulk = { action: 'set', selection, changes };
  assert.equal((await manageRows(bulk, [rows, rows], '?projectId=9')).body.data.updated, 2);
  assert.equal(queries[0].for[0], 'update');
  assert.match(JSON.stringify(queries[0].where), /projectAssets\.projectId/);
  assert.deepEqual(queries[0].where, queries[1].where);
  const { updatedAt, ...set } = queries[1].set[0];
  assert.deepEqual(set, changes);
  assert.equal((await manageRows(bulk, [[rows[0]]])).status, 404);
  assert.equal((await manageRows(bulk, [[{ ...rows[0], updatedAt: null }, rows[1]]])).status, 409);
  assert(!queries.some(query => query.update || query.commit));
  assert.equal((await manageRows(bulk, [rows, [rows[0]]])).status, 409);
  assert(!queries.some(query => query.commit));
  assert.equal((await manageRows({ ...bulk, changes: { plantingId: 99 } })).status, 400);
  const move = { action: 'move', sourceId: 8, targetId: 7, after: false };
  const ranks = [{ id: 7, sortOrder: 0 }, { id: 8, sortOrder: 0 }];
  assert.equal((await manageRows(move, [ranks, []])).body.data.updated, 1);
  assert.equal(queries[0].for[0], 'update');
  assert.equal(queries[0].where[0].args[1], 'owner');
  assert.deepEqual(JSON.parse(queries[2].execute.args[1]), [{ id: 7, sort_order: 1 }]);
  assert.equal((await manageRows(move, [ranks, Error('test rollback')])).status, 500);
  assert(!queries.some(query => query.commit));
  signedIn = false;
  assert.equal((await manageRows(bulk)).status, 401);
  signedIn = true;
  console.log('PASS: Harvest dates and Active on Add/Edit, pre-migration list compatibility, atomic owner-scoped bulk edits and drag order.');
  // Exercise the real bulk-delete handler with a partial failure and off-page selection.
  const text = fs.readFileSync('src/components/admin/threed/harvests/ThreeDHarvestsCRUD.tsx', 'utf8');
  const ast = ts.createSourceFile('harvests.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let handler;
  function visit(node) { if (ts.isFunctionDeclaration(node) && node.name?.text === 'deleteSelected') handler = node; ts.forEachChild(node, visit); } visit(ast);
  const requests = []; let notice, refreshed = 0;
  const context = { harvests: [{ id: 1, harvestId: 'Rose' }, { id: 2, harvestId: 'Mint' }], selected: new Set([1, 2, 999]), bulkBusy: false, loading: false, isSubmitting: false,
    confirm: () => true, setBulkBusy() {}, setBulkNotice: value => { notice = value; }, setSelected() {}, fetchHarvests: () => refreshed++, onModuleUpdate() {},
    fetch: async url => { requests.push(url); return { ok: !url.endsWith('=1'), json: async () => ({ success: !url.endsWith('=1'), error: 'Protected' }) }; },
  };
  const remove = vm.runInNewContext(compile(`(${handler.getText(ast)})`), context); await remove();
  assert.deepEqual(requests, ['/api/threed/harvests?id=1', '/api/threed/harvests?id=2']); assert.match(notice, /Deleted 1 of 2/); assert.match(notice, /Rose: Protected/); assert.equal(refreshed, 1);
  requests.length = 0; context.confirm = () => false; await remove(); assert.equal(requests.length, 0);
  console.log('PASS: Harvest bounds, owner/search/scope/count parity, sorting, provenance and partial bulk deletion');
})().catch(error => { console.error(error); process.exitCode = 1; });
