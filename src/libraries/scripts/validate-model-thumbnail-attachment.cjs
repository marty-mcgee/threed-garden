const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(path, mocks) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, URL, require(name) {
    assert.ok(name in mocks, `Unexpected import: ${name}`);
    return mocks[name];
  } });
  return exports;
}
const models = { id: 'id', userId: 'userId', thumbnailUrl: 'thumbnailUrl' };
const filesTable = { modelId: 'modelId', userId: 'userId', filePath: 'filePath' };
const orm = { eq: (key, value) => row => row[key] === value, and: (...checks) => row => checks.every(check => check(row)) };
const schema = { threedModels: models, threedModelFiles: filesTable };
const { attachModelThumbnail } = load('src/libraries/services/threed/models/model-thumbnail-attachment.ts', {
  'node:crypto': require('node:crypto'), 'drizzle-orm': orm, '@/libraries/schema/threed': schema,
});
let model, files, locks, failInsert, session;
function reset() {
  model = { id: 1165, userId: 'owner', thumbnailUrl: 'https://example.com/car.png' };
  files = []; locks = 0; failInsert = false; session = { user: { id: 'owner' } };
}
const tx = {
  select() { return { from(table) { return { where(predicate) { return { limit() {
    const rows = (table === models ? (model ? [model] : []) : files).filter(predicate);
    return { then(resolve, reject) { return Promise.resolve(rows).then(resolve, reject); }, for(mode) { assert.equal(mode, 'update'); locks++; return Promise.resolve(rows); } };
  } }; } }; } }; },
  insert(table) { assert.equal(table, filesTable); return { values(value) { return { async returning() {
    if (failInsert) throw Error('Persistence failed');
    assert.ok(locks > 0, 'Lock Model before looking up/inserting attachments');
    const file = { id: files.length + 1, ...value }; files.push(file); return [file];
  } }; } }; },
  update(table) { assert.equal(table, models); return { set(values) { return { async where(predicate) { if (predicate(model)) Object.assign(model, values); } }; } }; },
};
// Serialize this mock transaction boundary; actual PostgreSQL concurrency relies on the Model row lock.
let tail = Promise.resolve();
const db = { transaction(callback) {
  const run = tail.then(async () => {
    const before = structuredClone({ model, files });
    try { return await callback(tx); } catch (error) { model = before.model; files = before.files; throw error; }
  });
  tail = run.catch(() => {}); return run;
} };
const { POST } = load('src/app/api/threed/models/[id]/thumbnail-attachment/route.ts', {
  'next/server': { NextResponse: { json: (body, options) => ({ body, status: options.status }) } },
  'drizzle-orm': orm, '@/libraries/auth': { auth: async () => session },
  '@/libraries/db/client': { db }, '@/libraries/schema/threed': schema,
  '@/libraries/db/sequence': { ensureTableSequence: async () => {} },
  '@/libraries/services/threed/models/model-thumbnail-attachment': { attachModelThumbnail },
});
const post = (id = '1165') => POST({}, { params: Promise.resolve({ id }) });
(async () => {
  reset();
  const first = await post(); assert.equal(first.status, 200);
  assert.equal(files.length, 1); assert.equal(files[0].filePath, model.thumbnailUrl);
  assert.equal(files[0].fileType, 'other'); assert.equal(model.hasExternalFiles, true);
  const original = structuredClone(files[0]);
  await Promise.all([post(), post()]); assert.equal(files.length, 1); assert.deepEqual(files[0], original);
  // Reuse a pre-existing link without changing its role or alias.
  reset(); files.push({ id: 3, modelId: 1165, userId: 'owner', filePath: model.thumbnailUrl, fileType: 'top-view', relativePath: 'top-view/existing.png' });
  assert.equal((await post()).body.data.id, 3); assert.equal(files[0].fileType, 'top-view');
  reset(); session = null; assert.equal((await post()).status, 401); assert.equal(files.length, 0);
  reset(); session.user.id = 'stranger'; assert.equal((await post()).status, 404); assert.equal(files.length, 0);
  reset(); assert.equal((await post('1.5')).status, 400);
  reset(); model.thumbnailUrl = null; assert.equal((await post()).status, 409);
  reset(); model.thumbnailUrl = 'https://example.com/' + 'a'.repeat(500) + '.png'; assert.equal((await post()).status, 422); assert.equal(files.length, 0);
  reset(); model.thumbnailUrl = 'http://example.com/car.png'; assert.equal((await post()).status, 422);
  reset(); failInsert = true; assert.equal((await post()).status, 500); assert.equal(files.length, 0); assert.equal(model.hasExternalFiles, undefined);
  reset(); await assert.rejects(db.transaction(async tx => { await attachModelThumbnail(tx, 'owner', 1165, model.thumbnailUrl); throw Error('Later Model save failed'); }));
  assert.equal(files.length, 0); assert.equal(model.hasExternalFiles, undefined);
  reset(); await assert.rejects(attachModelThumbnail(tx, 'stranger', 1165, model.thumbnailUrl)); assert.equal(files.length, 0);
  console.log('PASS thumbnail attachment: owner checks, saved reference, reuse, retries, invalid/absent URLs and transaction rollback (mocked persistence; no uploads).');
})().catch(error => { console.error(error); process.exitCode = 1; });
