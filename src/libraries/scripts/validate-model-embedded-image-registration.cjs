// Execute the actual registration route with serialized, rollback-capable DB and Blob doubles.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const crypto = require('node:crypto');
const routeFile = 'src/app/api/threed/models/[id]/embedded-images/register/route.ts';
const source = ts.transpileModule(fs.readFileSync(routeFile, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
class ReadError extends Error { constructor(message, status = 422) { super(message); this.status = status; } }
const schema = Object.fromEntries(['threedModels', 'threedModelFiles', 'threedModelTextures'].map(name => [name,
  new Proxy({ tableName: name }, { get: (table, key) => key === 'tableName' ? name : `${name}.${String(key)}` }),
]));
const orm = { eq: (...args) => ({ kind: 'eq', args }), and: (...args) => ({ kind: 'and', args }) };
const stamp = 'b'.repeat(64);
const identity = file => JSON.stringify([file.id, file.modelId, file.userId, file.fileType, file.fileName, file.filePath, file.fileSize, file.updatedAt]);
function fixture(realSource = false) {
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aG1kAAAAASUVORK5CYII=', 'base64');
  const geometry = Buffer.from(JSON.stringify({ asset: { version: '2.0' },
    images: [{ name: 'Paint', uri: `data:image/png;base64,${png.toString('base64')}` }],
    textures: [{ source: 0 }], materials: [{ pbrMetallicRoughness: { baseColorTexture: { index: 0 } } }],
  }));
  const original = { id: 4, userId: 'owner', modelId: 8, fileType: 'model', fileName: 'vehicle.glb',
    filePath: 'https://fixture.blob.vercel-storage.com/threed/users/owner/models/primary.glb', fileSize: 100, updatedAt: 'saved' };
  if (realSource) Object.assign(original, { fileName: 'vehicle.gltf', filePath: 'https://fixture.blob.vercel-storage.com/models/8/vehicle.gltf', fileSize: geometry.length });
  const state = { signedIn: true, sourceFile: structuredClone(original), image: { index: 0, name: 'Body', previewSupported: true, width: 2, height: 2 },
    bytes: new Uint8Array([137, 80, 78, 71]), mimeType: 'image/png', calls: [], puts: [], deletes: [], sequences: [], geometry, png, network: [],
    tables: { threedModels: [{ id: 8, userId: 'owner', mainModelFileId: 4, modelType: 'glb', textureCount: 0,
      metadata: { activeSource: 'model', preserved: true, materialOverrides: [{ name: 'Original' }] } }], threedModelFiles: [structuredClone(original)], threedModelTextures: [] } };
  let serial = Promise.resolve();
  const value = (part, row) => typeof part === 'string' && /^threed\w+\./.test(part) ? row[part.split('.')[1]] : part;
  const matches = (condition, row) => !condition || (condition.kind === 'and' ? condition.args.every(item => matches(item, row))
    : value(condition.args[0], row) === value(condition.args[1], row));
  const db = { select(selection) {
    const query = { selection };
    const chain = {};
    for (const method of ['from', 'where', 'limit', 'for']) chain[method] = (...args) => { query[method] = args; return chain; };
    chain.then = (resolve, reject) => Promise.resolve().then(() => {
      state.calls.push(query);
      let rows = state.tables[query.from[0].tableName].filter(row => matches(query.where?.[0], row));
      if (query.limit) rows = rows.slice(0, query.limit[0]);
      return rows.map(row => selection ? Object.fromEntries(Object.entries(selection).map(([key, column]) => [key, value(column, row)])) : structuredClone(row));
    }).then(resolve, reject);
    return chain;
  }, insert(table) { return { values(values) { return { async returning() {
    if (state.failInsert === table.tableName) throw Error('Fixture write failure');
    const id = table.tableName === 'threedModelFiles' ? 40 + state.tables[table.tableName].length : 80 + state.tables[table.tableName].length;
    const row = { id, ...structuredClone(values) };
    state.tables[table.tableName].push(row);
    state.calls.push({ insert: table.tableName, values });
    return [structuredClone(row)];
  } }; } }; }, update(table) { return { set(values) { return { async where(condition) {
    state.calls.push({ update: table.tableName, values, condition });
    for (const row of state.tables[table.tableName]) if (matches(condition, row)) Object.assign(row, structuredClone(values));
  } }; } }; }, transaction(callback) {
    const running = serial.then(async () => {
      const before = structuredClone(state.tables);
      try { return await callback(db); } catch (error) { state.tables = before; throw error; }
    });
    serial = running.catch(() => undefined);
    return running;
  } };
  const exports = {};
  const mocks = {
    'node:crypto': crypto,
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } },
    'drizzle-orm': orm,
    '@vercel/blob': { put: async (path, bytes, options) => {
      const url = `https://fixture.blob.vercel-storage.com/${path}`;
      state.puts.push({ path, bytes: new Uint8Array(bytes), options, url });
      if (state.beforePutReturns) await state.beforePutReturns();
      if (state.failPut) throw Error('Fixture storage failure');
      return { url };
    }, del: async url => { state.deletes.push(url); } },
    '@/libraries/auth': { auth: async () => state.signedIn ? { user: { id: 'owner' } } : null },
    '@/libraries/db/client': { db },
    '@/libraries/db/sequence': { ensureTableSequence: async name => state.sequences.push(name) },
    '@/libraries/schema/threed': schema,
    '@/libraries/services/threed/models/model-blob-paths': { createThreeDBlobPath: (owner, kind, name, id) => `threed/users/${owner}/${kind}/${id}/${name}` },
    '@/libraries/services/threed/models/model-embedded-images-core': { extractThreeDModelEmbeddedImage: () => {
      if (state.extractError) throw Error('Invalid extraction');
      return { bytes: state.bytes, mimeType: state.mimeType, fileName: 'body.png', image: state.image };
    } },
    '@/libraries/services/threed/models/model-embedded-images-server': { ThreeDEmbeddedImageReadError: ReadError,
      embeddedImageSourceFileIdentity: identity,
      readOwnedThreeDModelEmbeddedImageSource: async args => {
        state.calls.push({ readSource: args });
        if (args.modelId !== state.sourceFile.modelId || args.fileId !== state.sourceFile.id || args.userId !== state.sourceFile.userId) throw new ReadError('Not found', 404);
        if (args.sourceStamp !== stamp) throw new ReadError('Stale source', 409);
        return { fileId: original.id, modelId: original.modelId, fileName: original.fileName, fileIdentity: identity(state.sourceFile), bytes: new Uint8Array([1]), file: state.sourceFile };
      } },
  };
  if (realSource) {
    const sourceExports = {};
    const serverCode = ts.transpileModule(fs.readFileSync('src/libraries/services/threed/models/model-embedded-images-server.ts', 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const sourceMocks = { 'server-only': {}, 'node:crypto': crypto, 'drizzle-orm': orm,
      '@/libraries/db/client': { db }, '@/libraries/schema/threed': schema,
      '@/libraries/services/threed/models/model-file-integrity': require('../services/threed/models/model-file-integrity.ts') };
    vm.runInNewContext(serverCode, { exports: sourceExports, URL, Uint8Array, AbortController, AbortSignal, setTimeout, clearTimeout,
      fetch: async (url, options) => {
        state.network.push({ url, options });
        assert.equal(url, original.filePath, 'The real source helper may fetch only the owned saved geometry');
        return new Response(state.geometry, { headers: { 'content-length': String(state.geometry.length) } });
      }, require: name => { assert(name in sourceMocks, `Unexpected actual helper import: ${name}`); return sourceMocks[name]; },
    });
    mocks['@/libraries/services/threed/models/model-embedded-images-server'] = sourceExports;
    mocks['@/libraries/services/threed/models/model-embedded-images-core'] = require('../services/threed/models/model-embedded-images-core.ts');
    state.sourceStamp = crypto.createHash('sha256').update(`8:${sourceExports.embeddedImageSourceFileIdentity(original)}:`).update(state.geometry).digest('hex');
  }
  vm.runInNewContext(source, { exports, URL, Buffer, Uint8Array, TextDecoder, crypto, console, require: name => {
    assert(name in mocks, `Unexpected registration import: ${name}`);
    return mocks[name];
  } });
  const run = (body = { fileId: 4, imageIndex: 0, sourceStamp: state.sourceStamp ?? stamp }, options = {}) => exports.POST(
    new Request('https://app.invalid/api/embedded-images/register', { method: 'POST',
      headers: { 'content-type': 'application/json', ...options.headers },
      body: options.stream ?? (typeof body === 'string' ? body : JSON.stringify(body)),
      ...(options.stream ? { duplex: 'half' } : {}),
    }), { params: Promise.resolve({ id: options.id ?? '8' }) });
  return { state, run, original };
}
const plain = value => JSON.parse(JSON.stringify(value));
(async () => {
  let f = fixture();
  const before = structuredClone(f.state.tables.threedModels[0]);
  let result = await f.run();
  assert.equal(result.status, 201);
  assert.equal(result.body.data.reused, false);
  assert.equal(f.state.puts.length, 1);
  assert.deepEqual([...f.state.puts[0].bytes], [...f.state.bytes], 'Original image bytes must be uploaded unchanged');
  const texture = f.state.tables.threedModelTextures[0], attachment = f.state.tables.threedModelFiles[1];
  assert.equal(texture.filePath, attachment.filePath, 'The two rows must reference the same Blob');
  assert.equal(texture.userId, 'owner'); assert.equal(attachment.userId, 'owner'); assert.equal(attachment.modelId, 8);
  assert.equal(attachment.fileType, 'texture'); assert.equal(texture.width, 2); assert.equal(texture.height, 2);
  assert(attachment.relativePath.startsWith('embedded/file-4/image-0-'));
  assert.equal(f.state.tables.threedModels[0].mainModelFileId, before.mainModelFileId);
  assert.equal(f.state.tables.threedModels[0].modelType, before.modelType);
  assert.deepEqual(f.state.tables.threedModels[0].metadata, before.metadata);
  assert.deepEqual(f.state.calls.find(call => call.update)?.values && Object.keys(f.state.calls.find(call => call.update).values).sort(), ['hasExternalFiles', 'textureCount', 'updatedAt']);
  assert(f.state.calls.filter(call => call.for?.[0] === 'update' && call.from[0].tableName === 'threedModels').length >= 2, 'Both duplicate checks must lock the Model');
  assert(f.state.calls.some(call => call.for?.[0] === 'update' && call.from[0].tableName === 'threedModelFiles'), 'Source identity must be rechecked under lock');
  result = await f.run();
  assert.equal(result.status, 200); assert.equal(result.body.data.reused, true);
  assert.equal(f.state.puts.length, 1); assert.equal(f.state.tables.threedModelTextures.length, 1); assert.equal(f.state.tables.threedModelFiles.length, 2);
  f.state.tables.threedModelTextures[0].textureName = 'User renamed Texture';
  f.state.tables.threedModelTextures[0].isActive = false;
  result = await f.run(); assert.equal(result.status, 200);
  assert.equal(f.state.tables.threedModelTextures[0].textureName, 'User renamed Texture');
  assert.equal(f.state.tables.threedModelTextures[0].isActive, false, 'Reuse must preserve Library edits and activation');
  // Concurrent requests may stage twice, but serialize row creation and clean only the losing upload.
  f = fixture();
  let open; const bothStaged = new Promise(resolve => open = resolve);
  f.state.beforePutReturns = async () => { if (f.state.puts.length === 2) open(); await bothStaged; };
  const concurrent = await Promise.all([f.run(), f.run()]);
  assert.deepEqual(concurrent.map(item => item.status).sort(), [200, 201]);
  assert.equal(f.state.tables.threedModelTextures.length, 1); assert.equal(f.state.tables.threedModelFiles.length, 2);
  assert.equal(f.state.deletes.length, 1);
  assert.notEqual(f.state.deletes[0], f.state.tables.threedModelTextures[0].filePath, 'The winning Blob is never deleted');
  // A changed source after the upload fails before any record writes and removes its own staged Blob.
  f = fixture(); f.state.beforePutReturns = async () => { f.state.tables.threedModelFiles[0].updatedAt = 'changed'; };
  result = await f.run(); assert.equal(result.status, 409); assert.equal(f.state.deletes.length, 1);
  assert.equal(f.state.tables.threedModelTextures.length, 0); assert.equal(f.state.tables.threedModelFiles.length, 1);
  // DB failure after Texture insertion rolls back both rows; existing geometry and appearance survive.
  f = fixture(); f.state.failInsert = 'threedModelFiles'; result = await f.run();
  assert.equal(result.status, 500); assert.equal(f.state.deletes.length, 1);
  assert.equal(f.state.tables.threedModelTextures.length, 0); assert.equal(f.state.tables.threedModelFiles.length, 1);
  assert.deepEqual(f.state.tables.threedModels[0].metadata, before.metadata);
  f = fixture(); f.state.failPut = true; result = await f.run();
  assert.equal(result.status, 500); assert.equal(f.state.deletes.length, 0);
  assert.equal(f.state.tables.threedModelTextures.length, 0); assert.equal(f.state.tables.threedModelFiles.length, 1);
  for (const changes of [{ mimeType: 'image/ktx2' }, { bytes: new Uint8Array(4 * 1024 * 1024 + 1) }, { image: { previewSupported: false } }]) {
    f = fixture(); Object.assign(f.state, changes); result = await f.run(); assert.equal(result.status, 422); assert.equal(f.state.puts.length, 0);
  }
  f = fixture(); result = await f.run({ fileId: 4, imageIndex: 0, sourceStamp: 'a'.repeat(64) }); assert.equal(result.status, 409); assert.equal(f.state.puts.length, 0);
  f = fixture(); f.state.sourceFile.userId = 'another-owner'; result = await f.run(); assert.equal(result.status, 404); assert.equal(f.state.puts.length, 0);
  f = fixture(); f.state.tables.threedModels[0].userId = 'another-owner'; result = await f.run(); assert.equal(result.status, 404); assert.equal(f.state.puts.length, 0);
  for (const body of [{ fileId: 4, imageIndex: 0, sourceStamp: stamp, url: 'https://untrusted.invalid' }, { fileId: 4, imageIndex: -1, sourceStamp: stamp }, { fileId: 4, imageIndex: 500, sourceStamp: stamp }, { fileId: '4', imageIndex: 0, sourceStamp: stamp }, 'invalid-json']) {
    f = fixture(); result = await f.run(body); assert.equal(result.status, 400); assert.equal(f.state.calls.length, 0); assert.equal(f.state.puts.length, 0);
  }
  f = fixture(); f.state.signedIn = false; result = await f.run(); assert.equal(result.status, 401); assert.equal(f.state.calls.length, 0);
  f = fixture(); result = await f.run(undefined, { headers: { 'content-type': 'text/plain' } }); assert.equal(result.status, 415);
  f = fixture(); result = await f.run(undefined, { headers: { 'content-length': '2049' } }); assert.equal(result.status, 413); assert.equal(f.state.calls.length, 0);
  for (const headers of [{}, { 'content-length': '1' }]) {
    f = fixture(); let cancelled = false;
    const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(1024)); controller.enqueue(new Uint8Array(1025)); }, cancel() { cancelled = true; } });
    result = await f.run(undefined, { headers, stream });
    assert.equal(result.status, 413); assert(cancelled, 'Oversized chunked requests must be cancelled before parsing');
    assert.equal(f.state.calls.length, 0); assert.equal(f.state.puts.length, 0);
  }
  f = fixture(); result = await f.run(undefined, { id: '8x' }); assert.equal(result.status, 400);
  f = fixture(); await f.run(); f.state.tables.threedModelTextures[0].userId = 'another-owner'; result = await f.run();
  assert.equal(result.status, 409); assert.equal(f.state.puts.length, 1); assert.equal(f.state.deletes.length, 0, 'Conflicting prior references must not be deleted');
  // Keep response messages free of source bytes or storage details.
  assert(!JSON.stringify(plain(result)).includes('blob.vercel-storage.com'));
  // Integrate the actual owner/source-stamp helper, extraction parser and registration handler.
  f = fixture(true); result = await f.run(); assert.equal(result.status, 201);
  assert.deepEqual(Buffer.from(f.state.puts[0].bytes), f.state.png);
  assert.equal(f.state.tables.threedModelTextures[0].width, 1); assert.equal(f.state.tables.threedModelTextures[0].height, 1);
  assert.equal(f.state.tables.threedModelTextures[0].filePath, f.state.tables.threedModelFiles[1].filePath);
  result = await f.run(); assert.equal(result.status, 200); assert.equal(result.body.data.reused, true);
  assert.equal(f.state.puts.length, 1); assert.equal(f.state.network.length, 2);
  assert(f.state.network.every(call => call.options.redirect === 'manual' && call.options.cache === 'no-store'));
  result = await f.run({ fileId: 4, imageIndex: 0, sourceStamp: 'a'.repeat(64) });
  assert.equal(result.status, 409); assert.equal(f.state.puts.length, 1);
  console.log('PASS: embedded image registration uses original bounded bytes, exact owner/source stamps, row-locked retry/concurrency reuse, one shared Blob, transactional rollback/own-orphan cleanup and preserved geometry/materials (all persistence/storage mocked).');
})().catch(error => { console.error(error); process.exitCode = 1; });
