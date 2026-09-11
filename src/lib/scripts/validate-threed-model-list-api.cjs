// Exercise the actual GET handler with a queued database double; never connects to a database.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '../../..');
const transpile = (file) => ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const queryModule = { exports: {} };
vm.runInNewContext(transpile('src/lib/services/threed/models/model-list-query.ts'), { exports: queryModule.exports });
const schema = new Proxy({}, { get: (_, table) => new Proxy({ table }, { get: (value, column) => column === 'table' ? table : `${table}.${String(column)}` }) });
const op = (kind) => (...args) => ({ kind, args });
const orm = Object.fromEntries(['eq', 'and', 'or', 'desc', 'inArray', 'asc'].map((kind) => [kind, op(kind)]));
orm.sql = (strings, ...args) => ({ strings: [...strings], args, as() { return this; } });
let queue = [], queries = [], signedIn = true;
const db = { select(selection) {
  const query = { selection };
  const chain = {};
  for (const method of ['from', 'where', 'orderBy', 'limit', 'offset', 'innerJoin']) {
    chain[method] = (...args) => { query[method] = args; return chain; };
  }
  chain.then = (resolve, reject) => {
    queries.push(query);
    assert.ok(queue.length, 'Unexpected extra database query');
    return Promise.resolve(queue.shift()).then(resolve, reject);
  };
  return chain;
} };
const moduleExports = {};
const mocks = {
  '@/lib/db/connection-diagnostics': { databaseConnectionDiagnostic: () => ({}) },
  '@/lib/services/threed/models/model-list-query': queryModule.exports,
  '@/lib/services/threed/models/model-primary-file': { modelSelection: () => ({ id: 'id', fileSize: { sql: 'resolved_size' } }) },
  'next/server': { NextResponse: { json: (body, init) => ({ body, status: init?.status ?? 200 }) } },
  '@/lib/auth': { auth: async () => signedIn ? { user: { id: 'owner' } } : null },
  '@/lib/db/client': { db },
  '@/lib/schema/threed': schema,
  'drizzle-orm': orm,
  '@/lib/db/sequence': {},
  '@/lib/services/threed/models/model-companion-core': {},
  '@vercel/blob': {},
  '@/lib/services/threed/models/model-file-integrity': {},
  '@/lib/services/threed/models/model-library-readiness-core': {},
};
vm.runInNewContext(transpile('src/app/api/threed/models/route.ts'), {
  exports: moduleExports, URL, console,
  require(name) { assert.ok(name in mocks, `Unexpected import: ${name}`); return mocks[name]; },
});
const plain = (value) => JSON.parse(JSON.stringify(value));
async function run(query, responses) {
  queue = responses; queries = [];
  const result = await moduleExports.GET({ url: `http://localhost/api/threed/models?${query}` });
  assert.equal(queue.length, 0, 'Expected database queries were skipped');
  return plain(result);
}
(async () => {
  for (const size of [1, 50, 200]) {
    const models = Array.from({ length: size }, (_, index) => ({ id: index + 1, modelName: `Model ${index + 1}` }));
    const file = { id: 99, modelId: size, fileName: 'shared.png', filePath: 'shared-url', loadOrder: 0 };
    const category = { modelId: size, id: 7, name: 'Props', slug: 'props', parentId: null };
    const assignment = { modelId: size, targetKey: 'mesh', channel: 'baseColor', textureId: 2, textureName: 'Shared', textureFileName: 'shared.png', textureUrl: 'shared-url' };
    const result = await run(`limit=${size}&offset=200&sort=name&direction=asc`, [
      [{ count: 452 }], models, [category], [file], [assignment],
    ]);
    assert.equal(result.status, 200);
    assert.equal(queries.length, 5, 'List query count must not grow with page size');
    assert.equal(result.body.pagination.total, 452);
    assert.deepEqual(result.body.data.at(-1).files, [file]);
    assert.deepEqual(result.body.data.at(-1).categories, [{ id: 7, name: 'Props', slug: 'props', parentId: null }]);
    const { modelId, ...expectedAssignment } = assignment;
    assert.deepEqual(result.body.data.at(-1).materialAssignments, [expectedAssignment]);
    if (size > 1) assert.deepEqual(result.body.data[0].files, []);
    assert.deepEqual(plain(queries[3].where[0]), { kind: 'inArray', args: ['threedModelFiles.modelId', models.map((model) => model.id)] });
    assert.deepEqual(plain(queries[4].where[0]), { kind: 'inArray', args: ['threedModelMaterialAssignments.modelId', models.map((model) => model.id)] });
    assert.ok(JSON.stringify(queries[1].where).includes('owner'));
  }
  const detail = await run('id=5', [
    [{ id: 5, userId: 'owner', modelType: 'obj' }],
    [{ id: 9, modelId: 5, fileName: 'model.obj' }], [],
    [{ modelId: 5, targetKey: 'mesh', channel: 'baseColor', textureId: 2, textureName: 'Shared', textureFileName: 'shared.png', textureUrl: 'shared-url' }],
  ]);
  assert.equal(detail.status, 200);
  assert.equal(detail.body.data.files[0].id, 9);
  assert.equal(detail.body.data.materialAssignments[0].textureUrl, 'shared-url');
  assert.equal('modelId' in detail.body.data.materialAssignments[0], false);
  const choices = [{ id: 201, modelName: 'Beyond first page', modelType: 'fbx' }];
  const selector = await run('view=selector&limit=200&offset=200', [[{ count: 452 }], choices]);
  assert.equal(queries.length, 2);
  assert.deepEqual(Object.keys(queries[1].selection), ['id', 'modelName', 'modelType']);
  assert.deepEqual(selector.body.data, choices);
  assert.deepEqual(queries[1].offset, [200]);
  assert.ok(JSON.stringify(queries[1].where).includes('owner'));
  const empty = await run('offset=1000', [[{ count: 0 }], []]);
  assert.equal(queries.length, 2);
  assert.deepEqual(empty.body.data, []);
  assert.equal((await run('limit=201', [])).status, 400);
  signedIn = false;
  assert.equal((await run('view=selector', [])).status, 401);
  assert.equal(queries.length, 0);
  console.log('PASS: actual Model GET handler uses five queries for 1/50/200 rows, preserves related data and owner scope, uses two selector queries, and handles empty/invalid/unauthenticated requests');
})().catch((error) => { console.error(error); process.exitCode = 1; });
