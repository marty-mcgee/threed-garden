// Exercise the actual dependency GET handler with owner-scoped database doubles.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '../../..');
const source = fs.readFileSync(path.join(root, 'src/app/api/threed/models/files/requirements/route.ts'), 'utf8');
const transpiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const field = (table, column) => `${table}.${column}`;
const tables = new Proxy({}, { get: (_, table) => new Proxy({}, { get: (_, column) => field(table, String(column)) }) });
const op = (kind) => (...args) => ({ kind, args });
const orm = Object.fromEntries(['and', 'asc', 'eq'].map((kind) => [kind, op(kind)]));
const validUrl = 'https://fixture.blob.vercel-storage.com/models/7/ok.glb';
let queue = [];
let queries = [];
let fetchCount = 0;
const db = {
  select() {
    const query = {};
    const chain = {};
    for (const method of ['from', 'where', 'orderBy', 'limit']) {
      chain[method] = (...args) => { query[method] = args; return chain; };
    }
    chain.then = (resolve, reject) => {
      queries.push(query);
      assert.ok(queue.length, 'Unexpected database query');
      return Promise.resolve(queue.shift()).then(resolve, reject);
    };
    return chain;
  },
};
const mocks = {
  '@/libraries/services/threed/models/model-primary-file': { modelSelection: () => ({ id: 'id' }) },
  'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } },
  'drizzle-orm': orm,
  '@/libraries/auth': { auth: async () => ({ user: { id: 'owner' } }) },
  '@/libraries/db/client': { db },
  '@/libraries/schema/threed': tables,
  '@/libraries/services/threed/models/model-companion-core': {
    inspectThreeDModelPrimary: () => [],
    inspectThreeDModelEmbeddedResources: () => ({ status: 'inspected', buffers: 1, images: 0 }),
    inspectThreeDModelMaterial: () => [],
  },
  '@/libraries/services/threed/models/model-attachment-runtime-core': { resolveThreeDModelAttachmentUrl: () => null },
  '@/libraries/services/threed/models/model-file-integrity': { isOwnedThreeDBlobUrl: (url) => url === validUrl },
  '@/libraries/services/threed/models/model-material-override-core': {},
};
const routeExports = {};
vm.runInNewContext(transpiled, {
  exports: routeExports, URL, console,
  fetch: async () => {
    fetchCount += 1;
    return { ok: true, arrayBuffer: async () => new Uint8Array([1, 2, 3, 4]).buffer };
  },
  require(name) { assert.ok(name in mocks, `Unexpected import: ${name}`); return mocks[name]; },
});
async function check(model, files) {
  queue = [[model], files];
  queries = [];
  fetchCount = 0;
  const result = await routeExports.GET({ url: 'http://localhost/api/threed/models/files/requirements?modelId=7' });
  assert.equal(queue.length, 0, 'Expected database queries were skipped');
  assert.equal(queries.length, 2);
  assert.ok(JSON.stringify(queries[0].where).includes('owner'));
  assert.ok(JSON.stringify(queries[1].where).includes('owner'));
  return result;
}
(async () => {
  const procedural = { id: 7, modelType: 'procedural', mainModelFileId: null };
  const result = await check(procedural, []);
  assert.equal(result.status, 200);
  assert.equal(result.body.data.status, 'not_required');
  assert.equal(result.body.data.complete, true);
  assert.equal(result.body.data.requirements.length, 0);
  assert.equal(fetchCount, 0);

  const imported = await check({ ...procedural, modelType: 'gltf' }, []);
  assert.equal(imported.body.data.status, 'missing_primary');
  assert.equal(fetchCount, 0);

  const dangling = await check({ ...procedural, mainModelFileId: 3 }, []);
  assert.equal(dangling.body.data.status, 'missing_primary');

  const brokenFile = { id: 3, fileName: 'broken.glb', fileType: 'model', filePath: '', fileSize: 0 };
  const broken = await check({ ...procedural, modelType: 'glb', mainModelFileId: 3 }, [brokenFile]);
  assert.equal(broken.status, 422);
  assert.match(broken.body.error, /not eligible/);
  assert.equal(fetchCount, 0);

  const healthy = await check({ ...procedural, modelType: 'glb', mainModelFileId: 3 }, [
    { ...brokenFile, fileName: 'ok.glb', filePath: validUrl, fileSize: 4 },
  ]);
  assert.equal(healthy.status, 200);
  assert.equal(healthy.body.data.status, 'analyzed');
  assert.equal(healthy.body.data.complete, true);
  assert.equal(fetchCount, 1);
  console.log('PASS: procedural no-primary is ready; imported missing, dangling and invalid primaries remain guarded; valid imported primary is inspected');
})().catch((error) => { console.error(error); process.exitCode = 1; });
