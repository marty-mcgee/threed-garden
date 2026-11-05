// Offline execution of the real client workflow; upload and API boundaries are mocked.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const crypto = require('node:crypto').webcrypto;
const cache = new Map();

function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const exports = {};
  cache.set(file, exports);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    },
  }).outputText;
  vm.runInNewContext(code, {
    exports,
    File,
    Blob,
    AbortSignal,
    crypto,
    console,
    require(name) {
      if (name === 'three') return require('three');
      let resolved = name.startsWith('@/') ? path.resolve('src', name.slice(2)) : path.resolve(path.dirname(file), name);
      if (!path.extname(resolved)) resolved += '.ts';
      assert(resolved.startsWith(path.resolve('src')), `Unexpected workflow dependency ${name}`);
      return load(resolved);
    },
  }, { filename: file });
  return exports;
}

const api = load('src/components/threed/assemblies/stl-assembly-import-client.ts');
const clone = value => JSON.parse(JSON.stringify(value));
const reply = (data, status = 200) => new Response(JSON.stringify(data), { status });
const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};
const conversion = () => ({
  units: 'inches',
  upAxis: 'z',
  omittedIslandIds: [],
  parts: [0, 1].map(index => ({
    id: `part-${index + 1}`,
    label: `Part ${index + 1}`,
    bytes: new Uint8Array([index + 1, 2, 3]).buffer,
    position: [index + 1, index * 2, -index * 3],
  })),
});

function fixture() {
  const progress = api.createStlAssemblyImportProgress('owner-1', 'Imported Assembly', 'sample part.stl', conversion());
  const uploads = [];
  const requests = [];
  const models = new Map();
  const assemblies = new Map();
  let owner = 'owner-1';
  let paused = false;
  let failUpload;
  let holdUpload;
  let modelMode;
  let assemblyMode;
  let afterModel;
  const boundary = {
    currentOwner: () => owner,
    shouldPause: () => paused,
    onChange() {},
    async upload(file) {
      uploads.push(file.name);
      if (holdUpload) await holdUpload.promise;
      if (failUpload) {
        const cause = failUpload;
        failUpload = undefined;
        throw cause;
      }
      return {
        url: `https://storage.example/${file.name}`,
        fileName: file.name,
        fileSize: file.size,
        modelType: 'glb',
      };
    },
    async fetch(url, options = {}) {
      requests.push({ url, method: options.method || 'GET', body: options.body ? JSON.parse(options.body) : null });
      const mode = modelMode;
      if (url === '/api/threed/models') {
        if (mode === 'reject') {
          modelMode = undefined;
          return reply({ success: false, error: 'Model rejected' }, 400);
        }
        const body = JSON.parse(options.body);
        const model = {
          ...body,
          id: models.size + 1,
          userId: owner,
          mainModelFileId: models.size + 10,
        };
        models.set(model.id, model);
        afterModel?.(model);
        if (mode === 'lost') {
          modelMode = undefined;
          throw new Error('Response lost after commit');
        }
        return reply({ success: true, data: model });
      }
      if (url.startsWith('/api/threed/models?id=')) {
        const model = models.get(Number(url.split('=')[1]));
        return reply({ success: !!model, data: model }, model ? 200 : 404);
      }
      if (url.startsWith('/api/threed/assembly-groups?id=')) {
        const saved = assemblies.get(decodeURIComponent(url.split('=')[1]));
        return reply({ success: !!saved, data: saved }, saved ? 200 : 404);
      }
      assert.equal(url, '/api/threed/assembly-groups');
      const body = JSON.parse(options.body);
      assert.equal(body.expectedRevision, 0);
      assert(!assemblies.has(body.definition.id), 'Assembly was blindly recreated');
      if (assemblyMode === 'beforeCommit') {
        assemblyMode = undefined;
        throw new Error('Request interrupted');
      }
      assemblies.set(body.definition.id, body.definition);
      if (assemblyMode === 'lost') {
        assemblyMode = undefined;
        throw new Error('Assembly response lost');
      }
      return reply({ success: true, data: body.definition });
    },
  };
  return {
    progress,
    boundary,
    uploads,
    requests,
    models,
    assemblies,
    run: () => api.saveStlAssemblyImport(progress, boundary),
    set owner(value) { owner = value; },
    set paused(value) { paused = value; },
    set failUpload(value) { failUpload = value; },
    set holdUpload(value) { holdUpload = value; },
    set modelMode(value) { modelMode = value; },
    set assemblyMode(value) { assemblyMode = value; },
    set afterModel(value) { afterModel = value; },
  };
}

async function main() {
  let checks = 0;
  const test = async (name, run) => {
    await run();
    checks++;
    console.log(`PASS ${name}`);
  };
  await test('local plan validates every name, transform and omission before writes', () => {
    const f = fixture();
    assert.equal(f.requests.length, 0);
    assert.equal(f.uploads.length, 0);
    for (const mutate of [value => { value.parts[1].label = ''; }, value => { value.parts[1].position[0] = Infinity; }, value => { value.omittedIslandIds = ['island-3']; }]) {
      const value = conversion();
      mutate(value);
      assert.throws(() => api.createStlAssemblyImportProgress('owner-1', 'Assembly', 'file.stl', value));
    }
  });
  await test('creates private Models with primary Files and one positioned Assembly', async () => {
    const f = fixture();
    const saved = await f.run();
    assert.equal(f.models.size, 2);
    assert.equal(f.assemblies.size, 1);
    assert.equal(saved.ownerId, 'owner-1');
    assert.deepEqual(clone(saved.components[1].transform), {
      position: { x: 2, y: 2, z: -3 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: 1,
    });
    for (const model of f.models.values()) {
      assert.equal(model.scale, '1.0');
      assert.equal(model.isPublic, false);
      assert.equal(model.isLibraryItem, true);
      assert.equal(model.usedByCharacters, false);
      assert.equal(model.filePath, model.primaryFile.filePath);
      assert.equal(model.fileSize, model.primaryFile.fileSize);
    }
    const before = f.requests.length;
    await f.run();
    assert.equal(f.requests.length, before);
  });
  await test('synchronous busy guard stops duplicate clicks', async () => {
    const f = fixture();
    const hold = deferred();
    f.holdUpload = hold;
    const first = f.run();
    assert.equal(await f.run(), null);
    assert.equal(f.uploads.length, 1);
    hold.resolve();
    await first;
    assert.equal(f.models.size, 2);
  });
  await test('retry skips completed Models and retains verified upload on rejected save', async () => {
    const f = fixture();
    f.modelMode = 'reject';
    await assert.rejects(f.run(), /Model rejected/);
    assert.equal(f.progress.parts[0].saveUnknown, false);
    assert(f.progress.parts[0].upload);
    f.afterModel = model => { if (model.id === 1) f.failUpload = new Error('Part two upload failed'); };
    await assert.rejects(f.run(), /Part two upload failed/);
    assert.equal(f.models.size, 1);
    f.afterModel = undefined;
    await f.run();
    assert.equal(f.uploads.filter(name => name.includes('part-1')).length, 1);
    assert.equal(f.models.size, 2);
  });
  await test('lost Model response blocks duplication and requires exact owner/File recovery', async () => {
    const f = fixture();
    f.modelMode = 'lost';
    await assert.rejects(f.run(), /unconfirmed/);
    const part = f.progress.parts[0];
    assert.equal(part.saveUnknown, true);
    const before = f.requests.length;
    await assert.rejects(f.run(), /Match the saved Model/);
    assert.equal(f.requests.length, before);
    const saved = f.models.get(1);
    for (const patch of [{ userId: 'other-owner' }, { filePath: 'https://different.example/file.glb' }, { modelName: 'different' }, { scale: 2 }, { mainModelFileId: null }]) {
      f.models.set(1, { ...saved, ...patch });
      await assert.rejects(api.recoverStlAssemblyImportModel(f.progress, part.id, 1, f.boundary), /does not match/);
      assert.equal(part.saveUnknown, true);
    }
    f.models.set(1, saved);
    await api.recoverStlAssemblyImportModel(f.progress, part.id, 1, f.boundary);
    assert.equal(part.modelId, 1);
    await f.run();
    assert.equal(f.models.size, 2);
    assert.equal(f.requests.filter(request => request.url === '/api/threed/models').length, 2);
  });
  await test('lost Assembly response reconciles known UUID without replaying writes', async () => {
    const f = fixture();
    f.assemblyMode = 'lost';
    await assert.rejects(f.run(), /response lost/);
    assert.equal(f.progress.assemblyUnknown, true);
    const saved = await f.run();
    assert.equal(saved.id, f.progress.id);
    assert.equal(f.requests.filter(request => request.url === '/api/threed/assembly-groups').length, 1);
    assert.equal(f.uploads.length, 2);
  });
  await test('uncommitted Assembly failure retries the same UUID after a 404 check', async () => {
    const f = fixture();
    f.assemblyMode = 'beforeCommit';
    await assert.rejects(f.run(), /interrupted/);
    await f.run();
    const writes = f.requests.filter(request => request.url === '/api/threed/assembly-groups');
    assert.equal(writes.length, 2);
    assert.equal(writes[0].body.definition.id, writes[1].body.definition.id);
    assert.equal(f.models.size, 2);
  });
  await test('owner change stops additional writes and preserves the verified upload', async () => {
    const f = fixture();
    f.owner = 'other';
    await assert.rejects(f.run(), /account changed/);
    assert.equal(f.uploads.length, 0);
    f.owner = 'owner-1';
    const hold = deferred();
    f.holdUpload = hold;
    const run = f.run();
    f.owner = 'other';
    hold.resolve();
    await assert.rejects(run, /account changed/);
    assert(f.progress.parts[0].upload);
    assert.equal(f.requests.length, 0);
    assert.equal(f.progress.running, false);
  });
  await test('pause completes the active part and continues without duplicate Models', async () => {
    const f = fixture();
    f.afterModel = () => { f.paused = true; };
    assert.equal(await f.run(), null);
    assert.equal(f.models.size, 1);
    f.paused = false;
    f.afterModel = undefined;
    await f.run();
    assert.equal(f.models.size, 2);
    assert.equal(f.uploads.length, 2);
  });
  await test('unconfirmed upload cleanup prevents blind retry', async () => {
    const f = fixture();
    f.failUpload = Object.assign(new Error('Cleanup unconfirmed'), { cleanupUnconfirmed: true });
    await assert.rejects(f.run(), /Cleanup unconfirmed/);
    await assert.rejects(f.run(), /cleanup is unconfirmed/);
    assert.equal(f.uploads.length, 1);
    assert.equal(f.requests.length, 0);
  });
  await test('receipt records partial results without file bytes; mismatch does not replace Assembly', async () => {
    const f = fixture();
    f.assemblyMode = 'lost';
    await assert.rejects(f.run());
    const receipt = api.stlAssemblyImportReceipt(f.progress);
    assert.equal(receipt.parts[0].modelId, 1);
    assert.equal(receipt.assemblySaveUnconfirmed, true);
    assert.equal(Object.hasOwn(receipt.parts[0], 'file'), false);
    f.assemblies.get(f.progress.id).name = 'Different Assembly';
    await assert.rejects(f.run(), /does not match/);
    assert.equal(f.assemblies.size, 1);
  });
  console.log(`STL Assembly import client: ${checks} offline checks passed.`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
