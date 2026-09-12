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
const parser = load('src/lib/services/threed/harvests/harvest-list-query.ts', {});
const schema = Object.fromEntries(['threedHarvests', 'threedPlantings', 'threedPlants', 'threedBeds', 'projectAssets', 'project'].map(name => [name, new Proxy({}, { get: (_, column) => `${name}.${column}` })]));
const orm = Object.fromEntries(['eq', 'and', 'asc', 'desc', 'inArray'].map(name => [name, (...args) => ({ name, args })]));
orm.sql = (strings, ...args) => ({ strings: [...strings], args });
let queries = [], queue = [], signedIn = true;
const db = { select(selection) { const query = { selection }; const chain = {};
  for (const method of ['from', 'where', 'orderBy', 'limit', 'offset']) chain[method] = (...args) => { query[method] = args; return chain; };
  chain.then = (resolve, reject) => { queries.push(query); assert.ok(queue.length); return Promise.resolve(queue.shift()).then(resolve, reject); }; return chain;
} };
const api = load('src/app/api/threed/harvests/route.ts', {
  '@/lib/services/threed/harvests/harvest-list-query': parser,
  '@/lib/schema/project': schema,
  'next/server': { NextResponse: { json: (body, init) => ({ body, status: init?.status ?? 200 }) } },
  '@/lib/auth': { auth: async () => signedIn ? { user: { id: 'owner' } } : null }, '@/lib/db/client': { db }, '@/lib/schema/threed': schema, 'drizzle-orm': orm, '@/lib/db/sequence': {},
});
async function run(query, responses = []) { queries = []; queue = responses; const result = await api.GET({ url: `http://localhost/api/threed/harvests?${query}` }); assert.equal(queue.length, 0); return result; }
(async () => {
  for (const query of ['limit=0','limit=201','limit=2x','offset=-1','sort=sql','direction=sideways','isActive=yes','projectId=0','moduleId=oops','plantingId=-1','plantId=2147483648',`search=${'x'.repeat(201)}`]) assert.equal((await run(query)).status,400);
  signedIn=false; assert.equal((await run('')).status,401); signedIn=true;
  for (const sort of parser.HARVEST_LIST_SORTS) for (const direction of ['asc','desc']) {
    await run(`sort=${sort}&direction=${direction}&search=Rose&limit=25&offset=100`, [[{count:'452'}],[]]);
    assert.deepEqual(queries[0].where,queries[1].where);
    assert.equal(queries[1].limit[0],25); assert.equal(queries[1].offset[0],100);
    assert.equal(queries[1].orderBy[0].name,direction);
    assert.equal(queries[1].orderBy[2].args[0],'threedHarvests.id');
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
