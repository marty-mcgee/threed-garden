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
vm.runInNewContext(transpile('src/libraries/services/threed/models/model-list-query.ts'), { exports: queryModule.exports });
const lightingModule = { exports: {} };
vm.runInNewContext(transpile('src/libraries/services/threed/models/model-lighting-core.ts'), { exports: lightingModule.exports });
const fallbackModule = { exports: {} };
vm.runInNewContext(transpile('src/libraries/services/threed/models/model-fallback-core.ts'), { exports: fallbackModule.exports });
const readinessModule = { exports: {} };
const sourceCore = require('../services/threed/models/model-source-core.ts');
vm.runInNewContext(transpile('src/libraries/services/threed/models/model-library-readiness-core.ts'), { exports: readinessModule.exports, require: name => { assert.equal(name, './model-source-core.ts'); return sourceCore; } });
const schema = new Proxy({}, { get: (_, table) => new Proxy({ table }, { get: (value, column) => column === 'table' ? table : `${table}.${String(column)}` }) });
const op = (kind) => (...args) => ({ kind, args });
const orm = Object.fromEntries(['eq', 'and', 'or', 'desc', 'inArray', 'asc'].map((kind) => [kind, op(kind)]));
orm.sql = (strings, ...args) => ({ strings: [...strings], args, as() { return this; } });
let queue = [], queries = [], signedIn = true, transactionCalls = 0, transactionUpdates = [], fixtureRows = null;
const db = { select(selection) {
  const query = { selection };
  const chain = {};
  for (const method of ['from', 'where', 'orderBy', 'limit', 'offset', 'innerJoin']) {
    chain[method] = (...args) => { query[method] = args; return chain; };
  }
  chain.then = (resolve, reject) => {
    queries.push(query);
    if (fixtureRows && query.from[0].table === 'threedModels') {
      const filtered = fixtureRows.filter(row => matches(query.where[0], row));
      const result = Object.hasOwn(selection, 'count') ? [{ count: filtered.length }]
        : filtered.slice(query.offset[0], query.offset[0] + query.limit[0]);
      return Promise.resolve(result).then(resolve, reject);
    }
    assert.ok(queue.length, 'Unexpected extra database query');
    return Promise.resolve(queue.shift()).then(resolve, reject);
  };
  return chain;
}, async transaction(callback) {
  transactionCalls += 1;
  return callback({ update() {
    return { set(values) {
      transactionUpdates.push(values);
      return { where() { return { returning: async () => [{ id: 5 }] }; } };
    } };
  } });
} };
const moduleExports = {};
const mocks = {
  '@/libraries/db/connection-diagnostics': { databaseConnectionDiagnostic: () => ({}) },
  '@/libraries/db/read-retry': { retryDisconnectedRead: (read) => read() },
  '@/libraries/services/threed/models/model-list-query': queryModule.exports,
  '@/libraries/services/threed/models/model-primary-file': { modelSelection: () => ({ id: 'id', fileSize: { sql: 'resolved_size' } }) },
  'next/server': { NextResponse: { json: (body, init) => ({ body, status: init?.status ?? 200 }) } },
  '@/libraries/auth': { auth: async () => signedIn ? { user: { id: 'owner' } } : null },
  '@/libraries/db/client': { db },
  '@/libraries/schema/threed': schema,
  'drizzle-orm': orm,
  '@/libraries/db/sequence': {},
  '@/libraries/services/threed/models/model-companion-core': {},
  '@vercel/blob': {},
  '@/libraries/services/threed/models/model-file-integrity': { runtimeModelTypeFromFileName: () => 'gltf' },
  '@/libraries/services/threed/models/model-library-readiness-core': readinessModule.exports,
  '@/libraries/services/threed/models/model-source-core': sourceCore,
  '@/libraries/services/threed/models/model-material-override-core': require('../services/threed/models/model-material-override-core.ts'),
  '@/libraries/services/threed/models/model-lighting-core': lightingModule.exports,
  '@/libraries/services/threed/models/model-fallback-core': fallbackModule.exports,
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
async function runPrimaryPatch(primaryFile, expectedStatus, { currentPrimaryFileId = null, updates = {} } = {}) {
  queue = [
    [{ id: 5, userId: 'owner', modelType: 'gltf', filePath: '', mainModelFileId: currentPrimaryFileId }],
    [primaryFile],
    ...(expectedStatus === 200 ? [[{ id: 5, mainModelFileId: primaryFile.id, ...updates }]] : []),
  ];
  queries = [];
  const result = await moduleExports.PATCH({
    url: 'http://localhost/api/threed/models?id=5',
    json: async () => ({ mainModelFileId: primaryFile.id, ...updates }),
  });
  assert.equal(queue.length, 0, 'Expected primary-file queries were skipped');
  return plain(result);
}
// Evaluate only the handler's filtering vocabulary; unsupported raw OR fragments
// fail rather than accidentally treating them as grouped expressions.
function matches(expression, row) {
  if (typeof expression === 'string' && expression.startsWith('threedModels.')) return row[expression.split('.')[1]];
  if (!expression || typeof expression !== 'object') return expression;
  const args = expression.args;
  if (expression.kind === 'eq') return matches(args[0], row) === matches(args[1], row);
  if (expression.kind === 'and') return args.every(item => matches(item, row));
  if (expression.kind === 'or') return args.some(item => matches(item, row));
  const pattern = expression.strings.join('?').replace(/\s+/g, ' ').trim();
  if (pattern === '? IS NOT TRUE') return matches(args[0], row) !== true;
  if (pattern === '? ILIKE ?' || pattern === '?::text ILIKE ?') {
    const regex = String(args[1]).split('').map(character => character === '%' ? '.*' : character === '_' ? '.' : character.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('');
    return new RegExp(`^${regex}$`, 'is').test(matches(args[0], row) ?? '');
  }
  if (pattern.startsWith('exists (')) {
    assert.equal(pattern, 'exists ( select 1 from ? inner join ? on ? = ? where ? = ? and ? = ? and ? = true )');
    assert.equal(args[6], 'threedModelCategories.slug');
    assert.equal(args[8], 'threedModelCategories.isActive');
    return row.categories.some(category => category.slug === args[7] && category.isActive);
  }
  throw new Error(`Unsupported filtering SQL: ${pattern}`);
}
async function searchOwnershipChecks() {
  const actualORM = require('drizzle-orm');
  const { pgTable, text, boolean, integer, PgDialect } = require('drizzle-orm/pg-core');
  const actualSchema = {
    threedModels: pgTable('fixture_models', {
      id: integer('id'), userId: text('user_id'), modelName: text('model_name'), modelType: text('model_type'),
      isActive: boolean('is_active'), status: text('status'), usedByCharacters: boolean('used_by_characters'),
      isPublic: boolean('is_public'), isLibraryItem: boolean('is_library_item'),
    }),
    threedModelCategoryAssignments: pgTable('fixture_assignments', { modelId: integer('model_id'), categoryId: integer('category_id') }),
    threedModelCategories: pgTable('fixture_categories', { id: integer('id'), slug: text('slug'), isActive: boolean('is_active') }),
  };
  let captures = [];
  const compilerDB = { select(selection) {
    const query = { selection }, chain = {};
    for (const method of ['from', 'where', 'orderBy', 'limit', 'offset']) {
      chain[method] = (...args) => { query[method] = args; return chain; };
    }
    chain.then = (resolve, reject) => {
      captures.push(query);
      return Promise.resolve(Object.hasOwn(selection, 'count') ? [{ count: 0 }] : []).then(resolve, reject);
    };
    return chain;
  } };
  const compilerExports = {};
  const compilerMocks = { ...mocks, 'drizzle-orm': actualORM, '@/libraries/schema/threed': actualSchema, '@/libraries/db/client': { db: compilerDB } };
  vm.runInNewContext(transpile('src/app/api/threed/models/route.ts'), {
    exports: compilerExports, URL, console,
    require(name) { assert.ok(name in compilerMocks, `Unexpected compiler import: ${name}`); return compilerMocks[name]; },
  });
  const base = { userId: 'owner', isActive: true, status: 'active', usedByCharacters: false,
    isPublic: false, isLibraryItem: false, categories: [{ slug: 'props', isActive: true }] };
  for (const branch of ['name', 'type']) {
    const fields = branch === 'name' ? { modelName: 'Needle Prop', modelType: 'obj' } : { modelName: 'Unrelated', modelType: 'fbx' };
    const search = branch === 'name' ? 'nEeDlE' : 'FBX';
    let nextId = 0;
    const row = overrides => ({ id: ++nextId, ...base, ...fields, ...overrides });
    const rows = [row({}), row({ userId: 'foreign' }), row({ userId: 'foreign', isPublic: true, isLibraryItem: true }),
      row({ isActive: false }), row({ status: 'draft' }), row({ categories: [] }),
      row({ categories: [{ slug: 'props', isActive: false }] }), row({ usedByCharacters: true }),
      row({ userId: 'foreign', isPublic: true }), row({ userId: 'foreign', isLibraryItem: true }),
      row({ userId: 'foreign', isPublic: true, isLibraryItem: true, isActive: false }),
      row({ userId: 'foreign', isPublic: true, isLibraryItem: true, status: 'draft' }),
      row({ userId: 'foreign', isPublic: true, isLibraryItem: true, usedByCharacters: true }),
      row({ modelName: 'Unrelated', modelType: 'obj' })];
    for (const scope of ['', 'scope=library&']) {
      for (const selector of ['', '&view=selector']) {
        for (const [filters, expectedAdmin] of [
          ['&isActive=true&status=active&category=props', [0, 7]],
          ['&category=props', [0, 3, 4, 7]],
          ['&isActive=true&category=props', [0, 4, 7]],
          ['&status=active&category=props', [0, 3, 7]],
        ]) {
          fixtureRows = rows;
          const result = await run(`${scope}search=${search}${filters}${selector}`, selector ? [] : [[], [], []]);
          fixtureRows = null;
          const predicate = queries[0].where[0];
          assert.equal(predicate, queries[1].where[0], 'Count and page must share the exact predicate');
          const accepted = rows.map((value, index) => matches(predicate, value) ? index : -1).filter(index => index !== -1);
          const expected = scope ? [0, 2] : expectedAdmin;
          assert.deepEqual(accepted, expected, `${branch}: owner/library and every eligibility filter (${filters})`);
          assert.equal(result.body.pagination.total, expected.length);
          assert.deepEqual(result.body.data.map(row => row.id), expected.map(index => rows[index].id));
          captures = [];
          const actual = await compilerExports.GET({ url: `http://fixture.invalid/api/threed/models?${scope}search=${search}${filters}${selector}` });
          assert.equal(actual.status, 200);
          assert.equal(captures.length, 2);
          assert.equal(captures[0].where[0], captures[1].where[0]);
          const compiled = new PgDialect().sqlToQuery(captures[0].where[0]);
          assert.match(compiled.sql, /and \("fixture_models"\."model_name" ILIKE \$\d+ or "fixture_models"\."model_type"::text ILIKE \$\d+\) and exists/);
          assert.equal(compiled.params.filter(value => value === `%${search}%`).length, 2);
        }
      }
    }
  }
  // Preserve wildcard matching and owned inactive records when no eligibility filter is requested.
  await run('search=N_ed%&view=selector', [[{ count: 0 }], []]);
  assert.equal(matches(queries[0].where[0], { ...base, modelName: 'Needle', modelType: 'obj', isActive: false }), true);
  console.log('PASS: both Model search branches retain owner, active/status/category and public Library eligibility; count/list/selector share predicates; installed Drizzle compiles grouped OR; case and wildcard behavior preserved');
}
(async () => {
  await searchOwnershipChecks();
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
  const shared = {
    id: 1159, userId: 'another-owner', modelName: 'ThreeD Pyramid',
    modelType: 'procedural', filePath: '', mainModelFileId: null,
    isPublic: true, isLibraryItem: true, isActive: true, status: 'active', usedByCharacters: false,
    metadata: { fallbackShape: 'pyramid', privateNotes: 'owner only' },
  };
  const library = await run('scope=library', [[{ count: 1 }], [shared], [], [], []]);
  assert.equal(library.status, 200);
  assert.deepEqual(library.body.data[0].metadata, { fallbackShape: 'pyramid' });
  assert.equal(library.body.data[0].libraryReadiness.status, 'ready');
  assert.equal(library.body.data[0].canManage, false);
  const sharedDetail = await run('id=1159', [[shared], [], [], []]);
  assert.deepEqual(sharedDetail.body.data.metadata, { fallbackShape: 'pyramid' });
  const retainedRigShape = { ...shared, modelType: 'fbx', filePath: 'https://fixture.test/rig.fbx', mainModelFileId: 81,
    metadata: { activeSource: 'shape', fallbackShape: 'box', privateNotes: 'owner only', animationMap: { idle: 'Idle' } } };
  const sourceLibrary = await run('scope=library', [[{ count: 1 }], [retainedRigShape],
    [{ id: 81, modelId: 1159, fileType: 'model', filePath: retainedRigShape.filePath }], [], []]);
  assert.deepEqual(sourceLibrary.body.data[0].metadata, { activeSource: 'shape', fallbackShape: 'box' });
  assert.equal(sourceLibrary.body.data[0].libraryReadiness.status, 'ready', 'Inactive retained FBX does not require texture configuration for active Shape');
  const invalidShape = await run('scope=library', [
    [{ count: 1 }], [{ ...shared, metadata: { fallbackShape: 'unknown', privateNotes: 'owner only' } }], [], [], [],
  ]);
  assert.deepEqual(invalidShape.body.data[0].metadata, { fallbackShape: 'sphere' });
  const candidateFile = { id: 9, modelId: 5, userId: 'owner', fileType: 'model', fileName: 'shoe.gltf', filePath: 'https://assets.example.test/shoe.gltf', fileSize: 100 };
  for (const brokenFile of [
    { ...candidateFile, filePath: '' },
    { ...candidateFile, filePath: '   ' },
    { ...candidateFile, fileSize: null },
    { ...candidateFile, fileSize: 0 },
    { ...candidateFile, fileSize: -1 },
    { ...candidateFile, fileSize: 1.5 },
    { ...candidateFile, fileSize: Number.NaN },
  ]) {
    const result = await runPrimaryPatch(brokenFile, 400);
    assert.equal(result.status, 400);
    assert.match(result.body.error, /saved URL and a positive file size/);
  }
  assert.equal(transactionCalls, 0, 'Broken legacy files must not be assigned or mutated');
  const validPrimary = await runPrimaryPatch(candidateFile, 200);
  assert.equal(validPrimary.status, 200);
  assert.equal(validPrimary.body.data.mainModelFileId, candidateFile.id);
  assert.equal(transactionCalls, 1);
  const metadata = { fallbackShape: 'pyramid' };
  const unchangedBrokenPrimary = await runPrimaryPatch(
    { ...candidateFile, filePath: '', fileSize: 0 }, 200,
    { currentPrimaryFileId: candidateFile.id, updates: { metadata } },
  );
  assert.equal(unchangedBrokenPrimary.status, 200, 'Unrelated edits may retain a legacy broken primary file');
  assert.deepEqual(plain(transactionUpdates.at(-1).metadata), metadata);
  assert.equal(transactionCalls, 2);
  for (const activeSource of ['shape', 'character', 'model']) {
    await runPrimaryPatch(candidateFile, 200, { currentPrimaryFileId: candidateFile.id, updates: { metadata: { activeSource, fallbackShape: 'box', animationMap: { idle: 'Idle' } } } });
    const update = transactionUpdates.at(-1);
    assert.equal(update.mainModelFileId, candidateFile.id, 'Source toggle retains the owner-checked saved primary');
    assert.equal(update.modelType, 'gltf');
    assert.equal(update.metadata.activeSource, activeSource);
    assert.equal(update.metadata.animationMap.idle, 'Idle');
  }
  async function convertToProcedural(updates, expectedStatus, existingOverrides = {}) {
    queue = [[{ id: 5, userId: 'owner', modelType: 'gltf', mainModelFileId: 9, filePath: 'https://assets.example.test/model.gltf', ...existingOverrides }],
      ...(expectedStatus === 200 ? [[{ id: 5, modelType: 'procedural', mainModelFileId: null, filePath: '' }]] : [])];
    const result = await moduleExports.PATCH({ url: 'http://localhost/api/threed/models?id=5', json: async () => updates });
    assert.equal(result.status, expectedStatus);
    assert.equal(queue.length, 0);
  }
  const conversion = { modelType: 'procedural', mainModelFileId: null, filePath: '', fileSize: null, metadata: { fallbackShape: 'box', privateNotes: 'retained' } };
  await convertToProcedural(conversion, 200);
  assert.equal(transactionUpdates.at(-1).mainModelFileId, null);
  assert.equal(transactionUpdates.at(-1).modelType, 'procedural');
  assert.deepEqual(plain(transactionUpdates.at(-1).metadata), conversion.metadata);
  assert.equal('filePath' in transactionUpdates.at(-1), false);
  const conversionTransactions = transactionCalls;
  await convertToProcedural({ ...conversion, metadata: { fallbackShape: 'invalid' } }, 400);
  await convertToProcedural({ ...conversion, filePath: 'https://assets.example.test/model.gltf' }, 400);
  await convertToProcedural(conversion, 400, { usedByCharacters: true });
  await convertToProcedural({ ...conversion, mainModelFileId: undefined }, 400);
  assert.equal(transactionCalls, conversionTransactions, 'Rejected source changes must not mutate the Model');
  // Execute attachment POST with fake Blob/database adapters: uploading must not select geometry.
  const uploadExports = {};
  let uploadQueue = [], uploadUpdates = [];
  const uploadQuery = () => {
    const chain = {};
    for (const method of ['from', 'where', 'limit', 'for', 'orderBy']) chain[method] = () => chain;
    chain.then = (resolve, reject) => {
      assert.ok(uploadQueue.length, 'Unexpected upload query');
      return Promise.resolve(uploadQueue.shift()).then(resolve, reject);
    };
    return chain;
  };
  const uploadDb = {
    select: uploadQuery,
    insert: () => ({ values: value => ({ returning: async () => [{ id: 22, ...value }] }) }),
    update: () => ({ set: value => { uploadUpdates.push(value); return { where: async () => {} }; } }),
    transaction: async callback => callback(uploadDb),
  };
  const uploadMocks = { ...mocks,
    '@/libraries/db/client': { db: uploadDb },
    '@/libraries/db/sequence': { ensureTableSequence: async () => {} },
    '@/libraries/services/threed/models/model-blob-paths': { createThreeDAttachmentBlobPath: () => 'fixture/model.glb' },
    '@/libraries/services/threed/models/model-companion-core': { normalizeThreeDModelRelativePath: value => value },
    '@vercel/blob': { put: async () => ({ url: 'https://fixture.test/model.glb' }) },
  };
  vm.runInNewContext(transpile('src/app/api/threed/models/files/route.ts'), {
    exports: uploadExports, console, crypto: { randomUUID: () => 'fixture' },
    require(name) { assert.ok(name in uploadMocks, `Unexpected upload import: ${name}`); return uploadMocks[name]; },
  });
  for (const [modelType, primaryId] of [['procedural', null], ['gltf', null], ['gltf', 22]]) {
    const model = { id: 5, userId: 'owner', modelType, mainModelFileId: primaryId, filePath: '' };
    uploadQueue = [[model], [], [model], [{ id: 22, fileType: 'model', fileName: 'model.glb' }]];
    const uploaded = await uploadExports.POST({
      headers: { get: () => 'multipart/form-data' },
      formData: async () => ({ get: key => key === 'modelId' ? '5' : null,
        getAll: key => key === 'files' ? [{ name: 'model.glb', size: 100 }] : key === 'relativePaths' ? ['geometry/model.glb'] : [] }),
    });
    assert.equal(uploaded.status, 200);
    assert.equal(uploadQueue.length, 0);
    assert.equal(uploadUpdates.at(-1).mainModelFileId, primaryId, 'Upload must retain primary selection');
    if (primaryId === null) assert.equal('modelType' in uploadUpdates.at(-1), false, 'Upload must retain the chosen source');
    assert.equal(uploadUpdates.at(-1).hasExternalFiles, true);
  }
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
  console.log('PASS: explicit procedural conversion, rejected source changes, and attachment uploads preserving primary selection; actual Model GET handler uses five queries for 1/50/200 rows, preserves related data and owner scope, uses two selector queries, and handles empty/invalid/unauthenticated requests; shared Library responses expose only a validated fallback shape, and new primary assignments reject blank URLs and invalid sizes while unchanged legacy assignments permit unrelated edits');
})().catch((error) => { console.error(error); process.exitCode = 1; });
