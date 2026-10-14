// Offline recovery apply regression. All PostgreSQL, Blob and adapter filesystem effects are injected.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const ts = require('typescript');
const root = path.resolve('src/libraries/services/threed/design');
const clone = value => JSON.parse(JSON.stringify(value));
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
function loader(overrides = {}) {
  const cache = new Map();
  function load(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file);
    const exports = {}; cache.set(file, exports);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    vm.runInNewContext(code, { exports, Buffer, URL, Error, TextEncoder, console, require(name) {
      if (name in overrides) return overrides[name];
      if (name === 'node:crypto' || name === 'node:path') return require(name);
      assert(name.startsWith('.'), `Unmocked effect/dependency: ${name}`);
      return load(path.resolve(path.dirname(file), name.endsWith('.ts') ? name : name + '.ts'));
    } }, { filename: file });
    return exports;
  }
  return load;
}
const load = loader();
const { applyLegacyRecovery, legacyRecoveryBlobPath, isLegacyRecoveryBlobUrl } = load(path.join(root, 'legacy-recovery-apply.ts'));
const { selectLegacyRecoveryDatabaseUrl } = load(path.join(root, 'legacy-recovery-connection.ts'));
const { newDesign, validateDesign } = load(path.join(root, 'document.ts'));
const { readProjectArchitecture, hydrateArchitectureDraft, architectureIsDirty } = load(path.join(root, 'project-architecture.ts'));
const { buildThreeDRuntimeMarkerResult } = load(path.join(root, '../markers/runtime-marker-builder.ts'));
const options = { userId: 'owner-1', projectName: 'Recovered legacy plan' };
const bytes = new Map([
  ['chair-1/chair.obj', Buffer.from('mtllib chair.mtl\nv 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n')],
  ['chair-1/chair.mtl', Buffer.from('newmtl wood\nKd 0.5 0.2 0.1\n')],
]);
const doc = newDesign();
doc.nodes = [{ id: 'a', x: 0, z: 0 }, { id: 'b', x: 4, z: 0 }];
doc.walls = [{ id: 'wall', levelId: 'ground', start: 'a', end: 'b', height: 2.4, thickness: .15, elevation: 0 }];
doc.openings = [{ id: 'door', wallId: 'wall', kind: 'door', offset: 1.5, width: .9, height: 2, sill: 0 }];
const pkg = {
  format: 'threed-legacy-recovery', version: 1, fingerprint: 'a'.repeat(64), sourcePlanSha256: 'b'.repeat(64),
  architecture: clone(validateDesign(doc)), warnings: [],
  assets: [{ key: 'chair-1', legacyName: 'chair', modelName: 'Legacy Chair', attribution: { author: 'Fixture', license: 'CC0' }, scale: [2, 1, -1],
    files: [...bytes].map(([file, data], index) => ({ path: file, bytes: data.length, sha256: sha256(data), role: index ? 'other' : 'model' })) }],
  placements: [{ legacyId: '31', variantKey: 'chair-1', name: 'Chair', position: { x: 1.125, y: 3, z: -2.75 }, rotation: { x: .2, y: Math.PI / 2, z: -.15 }, levelId: 'ground' }],
};
const receipt = { version: 1, fingerprint: pkg.fingerprint, userId: options.userId, projectId: 7, threedId: 8, models: [{ key: 'chair-1', modelId: 9 }], markerCount: 1, operation: 'created' };
const blobUrl = file => 'https://offline.public.blob.vercel-storage.com/' + legacyRecoveryBlobPath(options.userId, pkg.fingerprint, file);
function boundaryFixture() {
  const state = { journal: null, committed: null, events: [], uploadFailure: false, commitFailure: false, lostCommitResponse: false, owner: true };
  return { state, boundary: {
    withLock: async work => { state.events.push('lock'); try { return await work(); } finally { state.events.push('unlock'); } },
    ownerExists: async () => state.owner,
    findCommitted: async () => state.committed && clone(state.committed),
    readJournal: async () => state.journal && clone(state.journal),
    writeJournal: async value => { state.journal = clone(value); state.events.push('journal:' + value.database); },
    upload: async (file, pathname) => {
      assert.equal(state.journal.files.find(item => item.path === file.path).status, 'pending', 'Pending upload must be durable before invoking storage.');
      state.events.push('upload:' + file.path);
      if (state.uploadFailure) throw new Error('Lost upload response');
      assert.equal(pathname, legacyRecoveryBlobPath(options.userId, pkg.fingerprint, file));
      return blobUrl(file);
    },
    commit: async files => {
      state.events.push('commit');
      assert.equal(state.journal.database, 'pending');
      assert(files.every(file => state.journal.files.some(item => item.path === file.path && item.status === 'confirmed' && item.url === file.url)));
      if (state.commitFailure) throw new Error('Transaction rolled back');
      state.committed = clone(receipt);
      if (state.lostCommitResponse) throw new Error('Lost commit response');
      return clone(receipt);
    },
  } };
}

// A minimal in-memory Drizzle boundary runs the actual adapter and real architecture/marker parsers.
// No query, upload, filesystem mutation or network client escapes these mocks.
function databaseFixture() {
  const names = ['user', 'project', 'projectAssets', 'projectThreed', 'projectThreedMarkers', 'threed', 'threedModelFiles', 'threedModels'];
  const tables = Object.fromEntries(names.map(name => [name, new Proxy({ name }, { get(target, key) { return key === 'name' ? target.name : { table: target.name, key }; } })]));
  let records = Object.fromEntries(names.map(name => [name, []]));
  records.user.push({ id: options.userId });
  records.project.push({ id: 1, userId: 'other-owner', name: 'Existing private Project', config: { retained: true }, isPublic: false });
  records.threedModels.push({ id: 1, userId: options.userId, modelName: 'Existing owned model', mainModelFileId: 77 });
  const state = { connects: 0, puts: [], events: [], txCount: 0, txFailure: null, corruptModels: false, nextId: 10, virtualFiles: new Map(), records: () => clone(records) };
  const fakeRoot = path.resolve('offline-recovery-fixture');
  const journalPath = path.join(fakeRoot, 'journal.json');
  for (const [file, data] of bytes) state.virtualFiles.set(path.resolve(fakeRoot, file), Buffer.from(data));
  const value = (row, column) => row[column.key];
  function matches(row, condition) {
    if (!condition) return true;
    if (condition.kind === 'and') return condition.conditions.every(item => matches(row, item));
    if (condition.kind === 'eq') return value(row, condition.column) === condition.value;
    if (condition.kind === 'in') return condition.values.includes(value(row, condition.column));
    if (condition.kind === 'sql') return value(row, condition.values[0])?.legacyRecoveryFingerprint === condition.values[1];
    throw new Error('Unexpected mock predicate');
  }
  const projectRow = (row, fields) => fields ? Object.fromEntries(Object.entries(fields).map(([key, column]) => [key, value(row, column)])) : clone(row);
  function query(kind, table, fields) {
    let where, limit, values, patch, executed;
    const run = () => {
      if (executed) return executed;
      if (kind === 'select') executed = records[table.name].filter(row => matches(row, where)).slice(0, limit).map(row => projectRow(row, fields));
      else {
        if (state.txFailure === table.name) throw new Error('Injected transaction failure at ' + table.name);
        state.events.push(kind + ':' + table.name);
        let rows;
        if (kind === 'insert') {
          rows = (Array.isArray(values) ? values : [values]).map(item => ({ id: state.nextId++, ...clone(item) }));
          if (state.corruptModels && table.name === 'threedModels') for (const row of rows) row.scale = '2.00';
          records[table.name].push(...rows);
        }
        else { rows = records[table.name].filter(row => matches(row, where)); for (const row of rows) Object.assign(row, clone(patch)); }
        executed = rows.map(row => projectRow(row, fields));
      }
      return executed;
    };
    return {
      where(condition) { where = condition; return this; }, limit(amount) { limit = amount; return this; },
      values(input) { values = input; return this; }, set(input) { patch = input; return this; },
      returning(input) { fields = input; return this; },
      then(resolve, reject) { return Promise.resolve().then(run).then(resolve, reject); },
    };
  }
  const db = {
    select: fields => ({ from: table => query('select', table, fields) }),
    insert: table => query('insert', table), update: table => query('update', table),
    transaction: async work => {
      state.txCount++; const previous = clone(records);
      try { const result = await work(db); state.events.push('committed'); return result; }
      catch (error) { records = previous; state.events.push('rollback'); throw error; }
    },
  };
  const fsMock = {
    readFile: async (file, encoding) => {
      const data = state.virtualFiles.get(file);
      if (data === undefined) throw Object.assign(new Error('Not found'), { code: 'ENOENT' });
      return encoding ? Buffer.from(data).toString(encoding) : Buffer.from(data);
    },
    realpath: async file => file,
    stat: async file => ({ isFile: () => state.virtualFiles.has(file), size: state.virtualFiles.get(file)?.length ?? 0 }),
    open: async (file, mode) => {
      assert.equal(mode, 'wx'); assert(!state.virtualFiles.has(file));
      return { writeFile: async data => { state.virtualFiles.set(file, Buffer.from(data)); }, sync: async () => state.events.push('fsync'), close: async () => {} };
    },
    rename: async (source, target) => { state.virtualFiles.set(target, state.virtualFiles.get(source)); state.virtualFiles.delete(source); },
  };
  const overrides = {
    'node:fs/promises': fsMock,
    '@vercel/blob': { put: async (pathname, data, config) => {
      state.puts.push({ pathname, data: Buffer.from(data), config });
      assert.equal(config.allowOverwrite, false); assert.equal(config.addRandomSuffix, false); assert.equal(config.access, 'public');
      return { url: 'https://offline.public.blob.vercel-storage.com/' + pathname };
    } },
    'drizzle-orm': { eq: (column, value) => ({ kind: 'eq', column, value }), inArray: (column, values) => ({ kind: 'in', column, values }),
      and: (...conditions) => ({ kind: 'and', conditions }), sql: (strings, ...values) => ({ kind: 'sql', strings, values }) },
    'drizzle-orm/node-postgres': { drizzle: () => db },
    pg: { Pool: class {
      async connect() { state.connects++; return { query: async text => state.events.push(text.includes('unlock') ? 'unlock' : 'lock'), release() { state.events.push('release'); } }; }
      async end() { state.events.push('pool-end'); }
    } },
    '../../../schema/auth': { user: tables.user },
    '../../../schema/project': Object.fromEntries(['project', 'projectAssets', 'projectThreed', 'projectThreedMarkers'].map(name => [name, tables[name]])),
    '../../../schema/threed': Object.fromEntries(['threed', 'threedModels', 'threedModelFiles'].map(name => [name, tables[name]])),
  };
  const adapter = loader(overrides)(path.join(root, 'legacy-recovery-database.ts'));
  assert.equal(state.connects, 0, 'Importing the adapter must not connect to a database.'); assert.equal(state.puts.length, 0);
  return { state, run: (databaseUrl = 'postgresql://offline:offline@direct.example.test/recovery') => adapter.applyLegacyRecoveryToDatabase(pkg, { ...options, root: fakeRoot, journalPath, databaseUrl, blobToken: 'mock-only' }),
    journal: () => JSON.parse(state.virtualFiles.get(journalPath).toString()), mutate(table, callback) { callback(records[table]); } };
}

async function main() {
  const source = JSON.stringify(pkg);
  {
    const pooled = 'postgresql://owner:placeholder@ep-fixture-pooler.us-east-2.aws.neon.tech/app?sslmode=require';
    const direct = 'postgresql://owner:placeholder@ep-fixture.us-east-2.aws.neon.tech/app?sslmode=require';
    assert.equal(selectLegacyRecoveryDatabaseUrl(pooled, direct), direct);
    assert.equal(selectLegacyRecoveryDatabaseUrl(direct), direct);
    assert.throws(() => selectLegacyRecoveryDatabaseUrl(pooled), /direct database connection/);
    assert.throws(() => selectLegacyRecoveryDatabaseUrl(pooled, pooled), /direct database connection/);
    for (const mismatch of [direct.replace('ep-fixture.', 'ep-other.'), direct.replace('/app?', '/other?'), direct.replace('//owner:', '//other:')]) {
      assert.throws(() => selectLegacyRecoveryDatabaseUrl(pooled, mismatch), /must match/);
    }
    const fixture = databaseFixture();
    await assert.rejects(() => fixture.run(pooled), /direct database connection/);
    assert.equal(fixture.state.connects, 0); assert.equal(fixture.state.puts.length, 0);
  }
  {
    const { state, boundary } = boundaryFixture();
    assert.equal((await applyLegacyRecovery(pkg, options, boundary)).operation, 'created');
    assert.equal(state.journal.database, 'complete'); assert.equal(state.journal.files.length, 2);
    const effects = state.events.filter(event => event === 'commit' || event.startsWith('upload:'));
    assert.deepEqual(effects, ['upload:chair-1/chair.obj', 'upload:chair-1/chair.mtl', 'commit']);
    assert.equal((await applyLegacyRecovery(pkg, options, boundary)).operation, 'existing');
    assert.deepEqual(state.events.filter(event => event === 'commit' || event.startsWith('upload:')), effects, 'Verified retry must not create duplicate records or uploads.');
  }
  for (const failure of ['uploadFailure', 'commitFailure', 'lostCommitResponse']) {
    const { state, boundary } = boundaryFixture(); state[failure] = true;
    await assert.rejects(() => applyLegacyRecovery(pkg, options, boundary), /requires review/);
    const effects = state.events.filter(event => event === 'commit' || event.startsWith('upload:'));
    state[failure] = false;
    if (failure === 'lostCommitResponse') assert.equal((await applyLegacyRecovery(pkg, options, boundary)).operation, 'existing');
    else await assert.rejects(() => applyLegacyRecovery(pkg, options, boundary), /review/);
    assert.deepEqual(state.events.filter(event => event === 'commit' || event.startsWith('upload:')), effects, 'Uncertain effects must not be replayed.');
  }
  {
    const { state, boundary } = boundaryFixture(); state.owner = false;
    await assert.rejects(() => applyLegacyRecovery(pkg, options, boundary), /owner does not exist/);
    assert.deepEqual(state.events, ['lock', 'unlock']); assert.equal(state.journal, null);
  }
  {
    const { state, boundary } = boundaryFixture();
    state.journal = { version: 1, ...options, fingerprint: pkg.fingerprint, database: 'not-started', files: [{ ...pkg.assets[0].files[0], status: 'confirmed', url: blobUrl(pkg.assets[0].files[0]) }] };
    await applyLegacyRecovery(pkg, options, boundary);
    assert.deepEqual(state.events.filter(event => event.startsWith('upload:')), ['upload:chair-1/chair.mtl'], 'Resume only uploads missing confirmed files.');
  }
  for (const corrupt of [journal => { journal.userId = 'other-owner'; }, journal => { journal.files[0].sha256 = 'f'.repeat(64); }, journal => { journal.files[0].url = blobUrl(pkg.assets[0].files[0]).replace('offline.public.blob.vercel-storage.com', 'untrusted.example'); }]) {
    const { state, boundary } = boundaryFixture();
    state.journal = { version: 1, ...options, fingerprint: pkg.fingerprint, database: 'not-started', files: [{ ...pkg.assets[0].files[0], status: 'confirmed', url: blobUrl(pkg.assets[0].files[0]) }] };
    corrupt(state.journal); await assert.rejects(() => applyLegacyRecovery(pkg, options, boundary));
    assert.deepEqual(state.events, ['lock', 'unlock']);
  }
  assert(!isLegacyRecoveryBlobUrl('https://example.com/' + legacyRecoveryBlobPath(options.userId, pkg.fingerprint, pkg.assets[0].files[0]), options.userId, pkg.fingerprint, pkg.assets[0].files[0]));
  {
    const fixture = databaseFixture(), before = fixture.state.records();
    const result = await fixture.run();
    assert.equal(result.operation, 'created'); assert.equal(fixture.state.txCount, 1); assert.equal(fixture.state.puts.length, 2);
    const after = fixture.state.records(), recovered = after.project.find(row => row.id === result.projectId);
    assert.deepEqual(after.project.find(row => row.id === 1), before.project[0]);
    assert.deepEqual(after.threedModels.find(row => row.id === 1), before.threedModels[0], 'Existing Models/primaries must remain untouched.');
    assert.equal(recovered.isPublic, false); assert.equal(Number(recovered.metersPerSceneUnit), 1);
    const restored = readProjectArchitecture(recovered.config), hydrated = hydrateArchitectureDraft(undefined, restored, recovered.config.threeDViewState.design);
    assert.equal(restored.document.walls.length, 1); assert.equal(restored.document.openings.length, 1);
    assert.notEqual(restored.document.walls[0].id, 'wall'); assert.notEqual(restored.document.levels[0].id, 'ground');
    assert.equal(restored.document.openings[0].wallId, restored.document.walls[0].id);
    assert.equal(architectureIsDirty(hydrated), false, 'Saved architecture reconstructs as an editable clean document.');
    assert.equal(recovered.config.threeDViewState.design.levelId, restored.document.levels[0].id);
    const model = after.threedModels.find(row => row.id === result.models[0].modelId);
    assert.equal(model.scale, '1.00'); assert.equal(model.rotationY, '0.00');
    assert(after.threedModelFiles.some(file => file.id === model.mainModelFileId && file.fileType === 'model' && file.relativePath === 'chair.obj'));
    assert(after.threedModelFiles.some(file => file.fileType === 'other' && file.relativePath === 'chair.mtl'));
    assert.equal(after.projectAssets[0].assetId, model.id); assert.equal(after.projectAssets[0].moduleId, result.threedId);
    assert.equal(after.projectThreedMarkers[0].positionX, '1.125'); assert.equal(after.projectThreedMarkers[0].positionZ, '-2.750');
    assert.equal(after.projectThreedMarkers[0].data.rotationYInstance, Math.PI / 2); assert.equal(after.projectThreedMarkers[0].data.scaleMultiplier, 1);
    const runtime = buildThreeDRuntimeMarkerResult({ projectThreedMarkers: after.projectThreedMarkers });
    assert.equal(runtime.issues.length, 0); assert.equal(runtime.markers.length, 1);
    assert.deepEqual(clone(runtime.markers[0].position), pkg.placements[0].position, 'Metre positions reach the existing Scene marker resolver unchanged.');
    assert.equal(runtime.markers[0].data.modelId, model.id); assert.equal(runtime.markers[0].data.projectMarkerId, after.projectThreedMarkers[0].id);
    assert.equal(runtime.markers[0].data.rotationX, .2); assert.equal(runtime.markers[0].data.rotationYInstance, Math.PI / 2); assert.equal(runtime.markers[0].data.rotationZ, -.15);
    assert.equal(runtime.markers[0].metadata.source, 'project-marker');
    assert.equal(fixture.journal().database, 'complete');
    assert.equal((await fixture.run()).operation, 'existing');
    assert.equal(fixture.state.puts.length, 2); assert.equal(fixture.state.txCount, 1);
    fixture.mutate('project', rows => { rows.find(row => row.id === result.projectId).config.threeDArchitecture.document.walls[0].height += 1; });
    await assert.rejects(() => fixture.run(), /differs.*no existing records/);
    assert.equal(fixture.state.txCount, 1, 'Changed existing recovery must be reviewed rather than overwritten.');
  }
  for (const table of ['threedModels', 'threedModelFiles', 'projectThreedMarkers']) {
    const fixture = databaseFixture(), before = fixture.state.records(); fixture.state.txFailure = table;
    await assert.rejects(() => fixture.run(), /Database outcome requires review/);
    assert.deepEqual(fixture.state.records(), before, 'One DB transaction must roll back all created records on failure at ' + table);
    assert.equal(fixture.journal().database, 'uncertain'); assert.equal(fixture.state.puts.length, 2, 'Uploaded files remain available for uncertainty review.');
    fixture.state.txFailure = null;
    await assert.rejects(() => fixture.run(), /requires review/); assert.equal(fixture.state.txCount, 1);
  }
  {
    const fixture = databaseFixture(), before = fixture.state.records(); fixture.state.corruptModels = true;
    await assert.rejects(() => fixture.run(), /differs.*no existing records/);
    assert.deepEqual(fixture.state.records(), before, 'Post-write verification must run inside the transaction and roll back mismatched persisted records.');
    assert(fixture.state.events.includes('rollback')); assert.equal(fixture.journal().database, 'uncertain');
  }
  assert.equal(JSON.stringify(pkg), source, 'Apply cannot mutate the prepared architecture/placement package.');
  console.log('Legacy recovery apply checks passed: immutable uploads/journal, create-only transactional adapter, clean architecture hydration, idempotency, owner isolation and uncertain outcomes.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
