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
const parser = load('src/lib/services/threed/waterings/watering-list-query.ts', {});
const schema = Object.fromEntries(['threedWateringSchedules', 'threedWateringHistory', 'projectAssets'].map(name => [name, new Proxy({}, { get: (_, column) => `${name}.${column}` })]));
const orm = Object.fromEntries(['eq', 'and', 'desc', 'inArray'].map(name => [name, (...args) => ({ name, args })]));
orm.sql = (strings, ...args) => ({ strings: [...strings], args });
let queries = [], queue = [], signedIn = true;
const db = { select() { const q = {}, chain = {}; for (const method of ['from', 'where', 'orderBy', 'limit', 'offset']) chain[method] = (...args) => { q[method] = args; return chain; }; chain.then = (resolve, reject) => { queries.push(q); assert.ok(queue.length); return Promise.resolve(queue.shift()).then(resolve, reject); }; return chain; } };
const mocks = { '@/lib/services/threed/waterings/watering-list-query': parser, 'next/server': { NextResponse: { json: (body, init) => ({ body, status: init?.status ?? 200 }) } }, '@/lib/auth': { auth: async () => signedIn ? { user: { id: 'owner' } } : null }, '@/lib/db/client': { db }, '@/lib/schema/threed': schema, '@/lib/schema/project': schema, 'drizzle-orm': orm };
(async () => {
  for (const view of ['schedules', 'history']) {
    const api = load(`src/app/api/threed/watering-${view}/route.ts`, mocks);
    async function run(query, results = []) { queries = []; queue = results; const response = await api.GET({ url: `http://localhost/api/threed/watering-${view}?${query}` }); assert.equal(queue.length, 0); return response; }
    for (const query of ['limit=0', 'limit=201', 'offset=-1', 'moduleId=bad', 'plantingId=0', 'isActive=yes']) assert.equal((await run(query)).status, 400);
    signedIn = false; assert.equal((await run('')).status, 401); signedIn = true;
    for (const size of [25, 200]) {
      const response = await run(`limit=${size}&offset=200&search=rain`, [[{ count: '452' }], []]);
      assert.equal(response.body.pagination.total, 452); assert.equal(queries[1].limit[0], size); assert.equal(queries[1].offset[0], 200);
      assert.deepEqual(queries[0].where, queries[1].where); assert.equal(queries[0].where[0].args[0].args[1], 'owner');
      const search = queries[0].where[0].args.at(-1); assert.ok(search.strings[0].startsWith('(')); assert.ok(search.strings.at(-1).endsWith(')'));
    }
    if (view === 'schedules') {
      const empty = await run('moduleId=5', [[]]); assert.equal(empty.body.pagination.total, 0);
      await run('moduleId=5', [[{ assetId: 7 }], [{ count: 1 }], [{ id: 7 }]]);
      assert.equal(queries[0].where[0].args[3].args[1], 'owner'); assert.deepEqual(queries[1].where, queries[2].where);
    } else {
      await run('moduleId=5', [[{ count: 0 }], []]); const scope = queries[0].where[0].args[1];
      assert.ok(scope.strings.join('').includes('exists')); assert.ok(scope.args.includes('owner')); assert.ok(scope.args.includes(5));
      const source = fs.readFileSync('src/components/admin/threed/watering-schedules/ThreeDWateringSchedulesCRUD.tsx', 'utf8');
      assert.ok(!source.includes('/api/threed/plantings')); assert.ok(!source.includes("method: 'POST'")); assert.ok(!source.includes("method: 'DELETE'"));
    }
  }
  console.log('PASS: Waterings views use correct read-only endpoints; bounds, ownership, grouped search/count parity, module scope and pagination');
})().catch(error => { console.error(error); process.exitCode = 1; });
