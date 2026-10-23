// Execute the actual handler/source guard/core parser with mocked persistence and fetch; no live requests.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const base = path.resolve(__dirname, '../../..');
const core = require('../services/threed/models/model-embedded-images-core.ts');
const integrity = require('../services/threed/models/model-file-integrity.ts');
const crypto = require('node:crypto');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aG1kAAAAASUVORK5CYII=', 'base64');
const sourceBytes = Buffer.from(JSON.stringify({ asset: { version: '2.0' },
  images: [{ name: 'Paint', uri: `data:image/png;base64,${png.toString('base64')}` }, { uri: 'textures/external.png' }],
  textures: [{ source: 0 }], materials: [{ name: 'Car paint', pbrMetallicRoughness: { baseColorTexture: { index: 0 } } }],
}));
const sourcePath = 'https://fixture.public.blob.vercel-storage.com/models/5/car.gltf';
const originalFile = { id: 20, userId: 'owner', modelId: 5, fileType: 'model', fileName: 'car.gltf', filePath: sourcePath,
  fileSize: sourceBytes.length, updatedAt: new Date('2026-10-22T01:02:03Z') };
function glbBytes() {
  const json = Buffer.from(JSON.stringify({ asset: { version: '2.0' }, buffers: [{ byteLength: png.length }],
    bufferViews: [{ buffer: 0, byteLength: png.length }], images: [{ bufferView: 0, mimeType: 'image/png' }] }));
  const jsonChunk = Buffer.alloc(Math.ceil(json.length / 4) * 4, 32); json.copy(jsonChunk);
  const binary = Buffer.alloc(Math.ceil(png.length / 4) * 4); png.copy(binary);
  const result = Buffer.alloc(28 + jsonChunk.length + binary.length);
  result.writeUInt32LE(0x46546c67, 0); result.writeUInt32LE(2, 4); result.writeUInt32LE(result.length, 8);
  result.writeUInt32LE(jsonChunk.length, 12); result.writeUInt32LE(0x4e4f534a, 16); jsonChunk.copy(result, 20);
  result.writeUInt32LE(binary.length, 20 + jsonChunk.length); result.writeUInt32LE(0x004e4942, 24 + jsonChunk.length);
  binary.copy(result, 28 + jsonChunk.length); return result;
}
const schema = new Proxy({}, { get: (_, table) => new Proxy({ table }, {
  get: (value, column) => column === 'table' ? table : `${table}.${String(column)}`,
}) });
const eq = (column, value) => ({ eq: [column, value] }), and = (...items) => ({ and: items });
let rows, files, queries, network, signedIn, networkImpl, readHooks;
function matches(expression, row) {
  if (expression.and) return expression.and.every(item => matches(item, row));
  const [column, value] = expression.eq;
  return row[column.split('.')[1]] === value;
}
const db = { select(selection) {
  const query = { selection }, chain = {
    from(table) { query.table = table.table; return chain; },
    where(predicate) { query.predicate = predicate; return chain; },
    limit(limit) { query.limit = limit; return chain; },
    then(resolve, reject) {
      queries.push(query);
      if (readHooks.length) readHooks.shift()(query);
      return Promise.resolve((query.table === 'threedModels' ? rows : files)
        .filter(row => matches(query.predicate, row)).slice(0, query.limit)
        .map(row => Object.fromEntries(Object.entries(selection).map(([key, column]) => [key, row[column.split('.')[1]]])))).then(resolve, reject);
    },
  };
  return chain;
} };
function load(file, mocks) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(base, file), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText, {
    exports, Error, URL, Set, Uint8Array, AbortController, AbortSignal, setTimeout, clearTimeout,
    fetch: async (url, options) => { network.push({ url, options }); return networkImpl(url, options); },
    require(name) { assert.ok(Object.hasOwn(mocks, name), `Unexpected import ${name}`); return mocks[name]; },
  });
  return exports;
}
const source = load('src/libraries/services/threed/models/model-embedded-images-server.ts', {
  'server-only': {}, 'node:crypto': crypto, 'drizzle-orm': { eq, and }, '@/libraries/db/client': { db }, '@/libraries/schema/threed': schema,
  '@/libraries/services/threed/models/model-file-integrity': integrity,
});
class MockResponse extends Response { static json(body, init) { return Response.json(body, init); } }
const handler = load('src/app/api/threed/models/[id]/embedded-images/route.ts', {
  'next/server': { NextResponse: MockResponse }, '@/libraries/auth': { auth: async () => signedIn ? { user: { id: 'owner' } } : null },
  '@/libraries/services/threed/models/model-embedded-images-server': source,
  '@/libraries/services/threed/models/model-embedded-images-core': core,
});
function reset() {
  signedIn = true; queries = []; network = []; readHooks = [];
  rows = [{ id: 5, userId: 'owner', mainModelFileId: 20 }, { id: 6, userId: 'other', mainModelFileId: 22 }];
  files = [structuredClone(originalFile), { ...originalFile, id: 21 }, { ...originalFile, id: 22, userId: 'other' },
    { ...originalFile, id: 23, modelId: 6 }, { ...originalFile, id: 24, fileType: 'texture' }];
  networkImpl = async () => new Response(sourceBytes, { headers: { 'Content-Length': String(sourceBytes.length) } });
}
async function request(query = 'fileId=20', id = '5') {
  const response = await handler.GET(new Request(`https://app.invalid/api/threed/models/${id}/embedded-images?${query}`), { params: Promise.resolve({ id }) });
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('cross-origin-resource-policy'), 'same-origin');
  return response;
}
async function expectStatus(status, query, id) { const r = await request(query, id); assert.equal(r.status, status); return r; }
(async () => {
  reset(); signedIn = false; await expectStatus(401); assert.equal(queries.length, 0); assert.equal(network.length, 0);
  for (const [query, id] of [['fileId=20', '0'], ['fileId=20', '1e2'], ['', '5'], ['fileId=20.1', '5'],
    ['fileId=20&fileId=21', '5'], ['fileId=20&url=https://other.invalid', '5'], ['fileId=20&imageIndex=0', '5'],
    ['fileId=20&imageIndex=500&sourceStamp=' + 'a'.repeat(64), '5'], ['fileId=20&source=true', '5'],
    ['fileId=20&source=true&imageIndex=0&sourceStamp=' + 'a'.repeat(64), '5'], ['fileId=20&download=true', '5']]) {
    reset(); await expectStatus(400, query, id); assert.equal(queries.length, 0); assert.equal(network.length, 0);
  }
  reset(); await expectStatus(404, 'fileId=20', '6'); assert.equal(network.length, 0);
  for (const fileId of [22, 23, 24, 999]) { reset(); await expectStatus(404, `fileId=${fileId}`); assert.equal(network.length, 0); }
  for (const url of ['http://127.0.0.1/secret', 'https://other.blob.vercel-storage.com/models/6/car.gltf',
    'https://owner@fixture.blob.vercel-storage.com/models/5/car.gltf', sourcePath + '?token=private', sourcePath + '#fragment',
    'https://fixture.blob.vercel-storage.com:8443/models/5/car.gltf']) {
    reset(); files[0].filePath = url; await expectStatus(422); assert.equal(network.length, 0);
  }
  for (const fileSize of [0, null, 33 * 1024 * 1024]) { reset(); files[0].fileSize = fileSize; await expectStatus(422); assert.equal(network.length, 0); }
  reset(); files[0].fileName = 'car.fbx'; await expectStatus(422); assert.equal(network.length, 0);
  reset(); const catalogResponse = await expectStatus(200), catalog = (await catalogResponse.json()).data;
  assert.equal(catalog.modelId, 5); assert.equal(catalog.fileId, 20); assert.equal(catalog.isPrimary, true);
  assert.equal(catalog.catalog.embeddedImages, 1); assert.equal(catalog.catalog.externalImages, 1);
  assert.equal(catalog.catalog.images[0].usages[0].channel, 'Base color'); assert.match(catalog.sourceStamp, /^[a-f0-9]{64}$/);
  assert.equal(network.length, 1); assert.equal(network[0].url, sourcePath); assert.equal(network[0].options.redirect, 'manual');
  assert.equal(network[0].options.cache, 'no-store'); assert(network[0].options.signal instanceof AbortSignal);
  assert.equal(queries.length, 3); assert(!JSON.stringify(catalog).includes(sourcePath)); assert(!JSON.stringify(catalog).includes(png.toString('base64')));
  reset(); const alternate = (await (await expectStatus(200, 'fileId=21')).json()).data; assert.equal(alternate.isPrimary, false); assert.equal(alternate.fileId, 21);
  reset(); const image = await expectStatus(200, `fileId=20&imageIndex=0&sourceStamp=${catalog.sourceStamp}`);
  assert.equal(image.headers.get('content-type'), 'image/png'); assert.match(image.headers.get('content-disposition'), /^inline; filename="image-0.png"$/);
  assert.deepEqual(Buffer.from(await image.arrayBuffer()), png);
  reset(); const download = await expectStatus(200, `fileId=20&imageIndex=0&sourceStamp=${catalog.sourceStamp}&download=true`);
  assert.match(download.headers.get('content-disposition'), /^attachment;/);
  reset(); const raw = await expectStatus(200, `fileId=20&source=true&sourceStamp=${catalog.sourceStamp}`);
  assert.equal(raw.headers.get('content-type'), 'application/octet-stream'); assert.equal(raw.headers.get('x-source-stamp'), catalog.sourceStamp);
  assert.deepEqual(Buffer.from(await raw.arrayBuffer()), sourceBytes);
  reset(); const glb = glbBytes(); files[0].fileName = 'car.glb'; files[0].fileSize = glb.length;
  networkImpl = async () => new Response(glb);
  const glbCatalog = (await (await expectStatus(200)).json()).data;
  assert.equal(glbCatalog.catalog.format, 'glb'); assert.equal(glbCatalog.catalog.embeddedImages, 1);
  const glbImage = await expectStatus(200, `fileId=20&imageIndex=0&sourceStamp=${glbCatalog.sourceStamp}`);
  assert.deepEqual(Buffer.from(await glbImage.arrayBuffer()), png);
  reset(); await expectStatus(422, `fileId=20&imageIndex=1&sourceStamp=${catalog.sourceStamp}`); assert.equal(network.length, 1); // external image never fetched
  reset(); await expectStatus(422, `fileId=20&imageIndex=2&sourceStamp=${catalog.sourceStamp}`);
  reset(); await expectStatus(409, `fileId=20&source=true&sourceStamp=${'0'.repeat(64)}`);
  reset(); networkImpl = async () => { files[0].updatedAt = new Date(); return new Response(sourceBytes); }; await expectStatus(409);
  reset(); networkImpl = async () => { files = files.filter(file => file.id !== 20); return new Response(sourceBytes); }; await expectStatus(409);
  reset(); networkImpl = async () => new Response(sourceBytes.subarray(1)); await expectStatus(409);
  reset(); networkImpl = async () => new Response(Buffer.concat([sourceBytes, Buffer.from(' ')])); await expectStatus(409);
  reset(); networkImpl = async () => new Response(sourceBytes, { status: 302, headers: { Location: 'https://other.invalid/private' } }); await expectStatus(422); assert.equal(network.length, 1);
  reset(); networkImpl = async () => new Response(sourceBytes, { headers: { 'Content-Length': String(33 * 1024 * 1024) } }); await expectStatus(422);
  reset(); const invalidBytes = Buffer.from('{invalid gltf json}'); files[0].fileSize = invalidBytes.length;
  networkImpl = async () => new Response(invalidBytes); await expectStatus(422);
  reset(); networkImpl = async () => { throw new DOMException('Aborted', 'AbortError'); }; await expectStatus(422);
  reset(); networkImpl = async () => { throw Error('secret signed storage url'); };
  const failed = await expectStatus(500); assert(!JSON.stringify(await failed.json()).includes('secret'));
  console.log('PASS: actual embedded image GET/helper/parser: owner Model/File/type boundaries, alternate-file identity, bounded no-redirect geometry-only reads, catalog/source/image/download, material usage, private responses, strict queries, immutable stamps, stale/deleted/truncated Files and sanitized failures (mocked persistence/fetch).');
})().catch(error => { console.error(error); process.exitCode = 1; });
