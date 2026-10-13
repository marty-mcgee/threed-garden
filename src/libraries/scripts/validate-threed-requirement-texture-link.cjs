// Actual client callback and server linking function with inert persistence doubles.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const transpile = source => ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const plain = value => JSON.parse(JSON.stringify(value));
const helper = {};
vm.runInNewContext(transpile(fs.readFileSync('src/libraries/services/threed/models/model-texture-link-core.ts', 'utf8')), { exports: helper });
const { canLinkThreeDTextureRequirement } = helper;
const source = fs.readFileSync('src/components/admin/threed/models/ThreeDModelFilesCRUD.tsx', 'utf8');
const start = source.indexOf('  const saveSharedRequirement =');
const end = source.indexOf('\n  // ===', start);
assert(start >= 0 && end > start, 'The actual client linking callback must be found');
const clientCode = transpile(source.slice(start, end) + '\nsaveSharedRequirement(requirement, texture);');
const route = fs.readFileSync('src/app/api/threed/models/files/route.ts', 'utf8');
const serverStart = route.indexOf('async function linkSharedTexture(');
const serverEnd = route.indexOf('\nexport async function POST(', serverStart);
assert(serverStart >= 0 && serverEnd > serverStart, 'The actual server linking function must be found');
const serverCode = transpile(route.slice(serverStart, serverEnd) + '\nlinkSharedTexture(request, userId);');
const companion = fs.readFileSync('src/libraries/services/threed/models/model-companion-core.ts', 'utf8');
const normalizerStart = companion.indexOf('export function normalizeThreeDModelRelativePath(');
const normalizerEnd = companion.indexOf('\nfunction requirementFromReference(', normalizerStart);
const companionExports = {};
vm.runInNewContext(transpile(companion.slice(normalizerStart, normalizerEnd)), { exports: companionExports });

async function runLink({ model = {}, texture = {}, files = [], body = {}, expectedStatus = 200 } = {}) {
  const baseModel = { id: 15, userId: 'owner', modelType: 'fbx', textureCount: 0, unrelated: 'retained', ...model };
  const baseTexture = { id: 21, userId: 'owner', isActive: true, fileName: 'Leaves_Diff.png', mimeType: 'image/png', filePath: 'https://assets.invalid/Leaves_Diff.png', fileSize: 150000, ...texture };
  const rows = { models: [baseModel], textures: [baseTexture], files: files.map(file => ({ userId: 'owner', modelId: 15, ...file })) };
  const table = name => new Proxy({ name }, { get: (object, key) => key === 'name' ? name : ({ table: name, key }) });
  const threedModels = table('models'), threedModelTextures = table('textures'), threedModelFiles = table('files');
  const writes = [], queries = [];
  let transactions = 0, sequenceChecks = 0;
  const tx = {
    select() {
      const query = {};
      const chain = {
        from(value) { query.table = value.name; return chain; },
        where(predicate) { query.predicate = predicate; return chain; },
        limit(value) { query.limit = value; return chain; },
        for(value) { query.lock = value; return chain; },
        then(resolve, reject) {
          queries.push(query);
          assert.equal(typeof query.predicate, 'function', 'Actual owner-scoped WHERE must be supplied');
          return Promise.resolve(rows[query.table].filter(query.predicate).slice(0, query.limit)).then(resolve, reject);
        },
      };
      return chain;
    },
    insert(value) { return { values: async record => { writes.push({ type: 'insert', table: value.name, record: plain(record) }); rows[value.name].push(plain(record)); } }; },
    update(value) { return { set: record => ({ where: async predicate => {
      writes.push({ type: 'update', table: value.name, record: plain(record) });
      for (const row of rows[value.name].filter(predicate)) Object.assign(row, record);
    } }) }; },
  };
  const result = await vm.runInNewContext(serverCode, {
    canLinkThreeDTextureRequirement,
    ...companionExports,
    MAX_ATTACHMENT_DIRECTORY_LENGTH: 100,
    request: { json: async () => ({ modelId: 15, textureId: 21, relativePath: 'textures/Leaves_Diff.tga', ...body }) },
    userId: 'owner',
    threedModels, threedModelTextures, threedModelFiles,
    modelSelection: () => ({}),
    eq: (column, value) => row => row[column.key] === value,
    and: (...predicates) => row => predicates.every(predicate => predicate(row)),
    db: { transaction: async callback => { transactions++; return callback(tx); } },
    ensureTableSequence: async name => { assert.equal(name, 'threed_model_files'); sequenceChecks++; },
    NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) },
  });
  assert.equal(result.status, expectedStatus);
  if (expectedStatus !== 200) assert.deepEqual(writes, [], 'Rejected links must not insert attachments or alter the Model');
  assert.equal(baseModel.unrelated, 'retained');
  return { result, writes, queries, transactions, sequenceChecks };
}

(async () => {
  for (const [required, texture, expected] of [
    ['paint.png', { fileName: 'other.PNG' }, true],
    ['paint.jpg', { fileName: 'other.jpg' }, true],
    ['Leaves_Diff.tga', { fileName: 'Leaves_Diff.png', mimeType: 'image/png' }, true],
    ['LEAVES.TGA', { fileName: 'Leaves.PNG', mimeType: 'IMAGE/PNG' }, true],
    ['leaves.tga', { fileName: 'Leaves.png' }, false],
    ['leaves.tga', { fileName: 'Leaves.png', mimeType: 'image/jpeg' }, false],
    ['leaves.tga', { fileName: 'Leaves.webp', mimeType: 'image/webp' }, false],
    ['leaves.tga', { fileName: 'Leaves.jpg', mimeType: 'image/jpeg' }, false],
    ['leaves.psd', { fileName: 'Leaves.png', mimeType: 'image/png' }, false],
    ['leaves.png', { fileName: 'Leaves.jpg', mimeType: 'image/jpeg' }, false],
    ['leaves', { fileName: 'Leaves' }, false],
    ['leaves.', { fileName: 'Leaves.' }, false],
  ]) assert.equal(canLinkThreeDTextureRequirement(required, texture), expected, `${required} -> ${texture.fileName} (${texture.mimeType ?? 'no MIME'})`);

  for (const [fileName, texture] of [
    ['PolygonNature.png', { id: 21, fileName: 'PolygonNature_01.png' }],
    ['Leaves_Diff.tga', { id: 21, fileName: 'Leaves_Diff.png', mimeType: 'image/png' }],
  ]) {
    let saved, refreshes = 0;
    await vm.runInNewContext(clientCode, {
      modelId: 939, linkingTexture: null,
      requirement: { relativePath: fileName, fileName }, texture,
      attachmentDirectoryProblem: () => null, attachmentRelativePath: (dir, name) => `${dir}/${name}`,
      setLinkingTexture() {}, showToast() {},
      loadFiles: async () => { refreshes++; }, loadDependencies: async () => { refreshes++; }, loadModels: async () => { refreshes++; },
      fetch: async (url, options) => {
        assert.equal(url, '/api/threed/models/files');
        saved = JSON.parse(options.body);
        return { ok: true, json: async () => ({ success: true }) };
      },
    });
    assert.deepEqual(saved, { modelId: 939, textureId: 21, relativePath: `textures/${fileName}` });
    assert.equal(refreshes, 3);
  }

  const linked = await runLink();
  assert.equal(linked.transactions, 1);
  assert.equal(linked.sequenceChecks, 1);
  assert.equal(linked.writes.length, 2);
  assert.deepEqual(linked.writes[0], { type: 'insert', table: 'files', record: {
    userId: 'owner', modelId: 15, fileName: 'Leaves_Diff.tga', relativePath: 'textures/Leaves_Diff.tga',
    fileType: 'texture', textureType: 'baseColor', filePath: 'https://assets.invalid/Leaves_Diff.png',
    fileSize: 150000, isBinaryBuffer: false, loadOrder: 0,
  } });
  assert.equal(linked.writes[1].record.textureCount, 1);
  assert.equal(linked.writes[1].record.hasExternalFiles, true);
  assert.deepEqual(linked.queries.slice(0, 2).map(query => query.lock), ['update', 'update']);

  for (const options of [
    { model: { userId: 'different-owner' }, expectedStatus: 404 },
    { texture: { userId: 'different-owner' }, expectedStatus: 404 },
    { texture: { isActive: false }, expectedStatus: 404 },
    { model: { modelType: 'glb' }, expectedStatus: 422 },
    { model: { modelType: 'obj' }, expectedStatus: 422 },
    { texture: { fileName: 'Leaves_Diff.jpg', mimeType: 'image/jpeg' }, expectedStatus: 422 },
    { texture: { mimeType: 'image/jpeg' }, expectedStatus: 422 },
    { texture: { filePath: 'http://assets.invalid/Leaves_Diff.png' }, expectedStatus: 422 },
    { body: { relativePath: 'textures/Leaves_Diff.psd' }, expectedStatus: 422 },
    { body: { relativePath: '../Leaves_Diff.tga' }, expectedStatus: 400 },
    { body: { relativePath: 'Leaves_Diff.tga' }, expectedStatus: 400 },
    { body: { textureId: -1 }, expectedStatus: 400 },
    { body: { userId: 'different-owner' }, expectedStatus: 400 },
  ]) await runLink(options);

  const existing = { id: 100, fileName: 'Leaves_Diff.tga', relativePath: 'textures/Leaves_Diff.tga', fileType: 'texture', filePath: 'https://assets.invalid/Leaves_Diff.png' };
  const repeated = await runLink({ files: [existing] });
  assert.deepEqual(repeated.writes, [], 'Linking the same saved Texture is idempotent');
  await runLink({ files: [{ ...existing, filePath: 'https://assets.invalid/different.png' }], expectedStatus: 409 });
  await runLink({ files: [{ ...existing, fileType: 'model' }], expectedStatus: 409 });
  const sameExtension = await runLink({ body: { relativePath: 'textures/Original.png' } });
  assert.equal(sameExtension.writes[0].record.fileName, 'Original.png', 'Existing same-extension filename aliases remain supported');
  console.log('PASS explicit Texture link payload/refresh, bounded TGA-to-PNG compatibility, actual owner-scoped transactional link, rejection without content writes, and idempotency');
})().catch(error => { console.error(error); process.exitCode = 1; });
