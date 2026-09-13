// Pure preset contract/review fixtures; no database or network access.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, dependencies = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../../..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, require(name) {
    assert.ok(name in dependencies, `Unexpected import: ${name}`);
    return dependencies[name];
  } });
  return exports;
}
const animation = load('src/lib/utils/animation.ts');
const contracts = load('src/lib/services/threed/animations/contracts.ts', { '@/lib/utils/animation': animation });
const { parsePreset, parsePresetStrategy, reviewPreset } = load('src/lib/services/threed/animations/preset-contracts.ts', { './contracts': contracts });
const entry = { actionKey: 'idle', mode: 'assigned', animationId: 7 };
const body = { name: ' Farmer Actions ', entries: [entry] };
assert.equal(parsePreset(body).name, 'Farmer Actions');
for (const invalid of [
  { ...body, name: '' }, { ...body, name: 'a'.repeat(121) },
  { ...body, entries: [] }, { ...body, entries: [entry, entry] },
  { ...body, entries: [{ ...entry, actionKey: 'arbitrary' }] },
  { ...body, entries: [{ ...entry, mode: 'disabled' }] },
  { ...body, entries: [{ ...entry, animationId: -1 }] },
  { ...body, userId: 'other-owner' }, { ...body, description: 12 },
]) assert.throws(() => parsePreset(invalid), error => error.status === 400);
assert.throws(() => parsePresetStrategy('unknown'));
const clip = { id: 7, isActive: true, filePath: '/shared/idle.fbx' };
const disabled = { actionKey: 'idle', mode: 'disabled', animationId: null };
const result = (own, inherited, clips, strategy = 'fill') => reviewPreset([entry], own, inherited, clips, strategy)[0];
assert.equal(result([], [], [clip]).outcome, 'apply');
assert.equal(result([disabled], [], [clip]).outcome, 'skip');
assert.equal(result([], [disabled], [clip]).outcome, 'skip');
assert.equal(result([entry], [], []).outcome, 'skip'); // unavailable explicit mapping is preserved
assert.equal(result([], [entry], []).outcome, 'skip');
assert.equal(result([], [], []).outcome, 'conflict');
assert.equal(result([], [], [{ ...clip, isActive: false }]).outcome, 'conflict');
assert.equal(result([], [], [{ ...clip, filePath: ' ' }]).outcome, 'conflict');
assert.equal(result([disabled], [], [clip], 'replace').outcome, 'apply');
assert.equal(result([disabled], [entry], [clip]).source, 'explicit');
assert.equal(reviewPreset([disabled], [], [], [], 'fill')[0].outcome, 'apply');
assert.equal(reviewPreset([entry], [{ actionKey: 'walk', mode: 'disabled', animationId: null }], [], [clip], 'replace').length, 1);
console.log('Animation preset contract/review fixtures passed.');

// Exercise the actual preset service with an offline transactional query queue.
const schema = new Proxy({}, { get: (_, table) => new Proxy({}, { get: (_, column) => `${String(table)}.${String(column)}` }) });
const orm = Object.fromEntries(['and', 'asc', 'eq', 'inArray'].map(kind => [kind, (...args) => ({ kind, args })]));
let queue = [], writes = [], rolledBack = false;
const tx = {};
for (const operation of ['select', 'insert', 'update', 'delete']) tx[operation] = () => {
  const chain = {}, query = { operation };
  for (const method of ['from', 'where', 'innerJoin', 'orderBy', 'limit', 'for', 'set', 'values', 'onConflictDoUpdate', 'returning']) chain[method] = (...args) => { query[method] = args; return chain; };
  chain.then = (resolve, reject) => {
    assert.ok(queue.length, 'Unexpected query');
    const next = queue.shift();
    if (operation !== 'select') writes.push(query);
    return (next instanceof Error ? Promise.reject(next) : Promise.resolve(next)).then(resolve, reject);
  };
  return chain;
};
const service = load('src/lib/services/threed/animations/presets.ts', {
  'node:crypto': require('node:crypto'), 'drizzle-orm': orm, '@/lib/schema/threed': schema,
  '@/lib/db/client': { db: { ...tx, transaction: async work => { try { return await work(tx); } catch (e) { rolledBack = true; writes = []; throw e; } } } },
  './contracts': contracts, './preset-contracts': { parsePreset, parsePresetStrategy, reviewPreset },
  './library': { ownedTarget: async () => null },
});
async function exercise(results, operation) { queue = results; writes = []; rolledBack = false; return operation(); }
(async () => {
  await assert.rejects(exercise([[]], () => service.getPreset('owner', 1)), e => e.status === 404);
  const preset = { id: 1, userId: 'owner', name: 'Farmer Actions', description: null, revision: 1 };
  await assert.rejects(exercise([[preset], [entry]], () => service.deletePreset('owner', 1, 2)), e => e.status === 409);
  await assert.rejects(exercise([[]], () => service.savePreset('owner', body, false)), e => e.status === 400);
  const input = { presetId: 1, target: 'character', targetId: 2, strategy: 'fill' };
  const setup = () => [[preset], [entry], [], [clip]];
  const review = await exercise(setup(), () => service.applyPreset('owner', input));
  assert.equal(review.data.applied, false); assert.equal(writes.length, 0);
  const applied = await exercise([...setup(), [{ id: 1 }]], () => service.applyPreset('owner', { ...input, reviewToken: review.data.reviewToken }));
  assert.equal(applied.data.applied, true); assert.equal(writes.length, 1);
  assert.match(JSON.stringify(writes[0]), /owner/);
  await assert.rejects(exercise([[{ ...preset, revision: 2 }], [entry], [], [clip]], () => service.applyPreset('owner', { ...input, reviewToken: review.data.reviewToken })), e => e.status === 409);
  assert.equal(writes.length, 0);
  await assert.rejects(exercise([...setup(), new Error('write failed')], () => service.applyPreset('owner', { ...input, reviewToken: review.data.reviewToken })), /write failed/);
  assert.equal(rolledBack, true); assert.equal(writes.length, 0);
  const pair = [entry, { ...entry, actionKey: 'walk' }];
  const pairSetup = () => [[preset], pair, [], [clip]];
  const pairReview = await exercise(pairSetup(), () => service.applyPreset('owner', input));
  await assert.rejects(exercise([...pairSetup(), [{ id: 1 }], new Error('second write failed')], () => service.applyPreset('owner', { ...input, reviewToken: pairReview.data.reviewToken })), /second write failed/);
  assert.equal(rolledBack, true); assert.equal(writes.length, 0, 'Transaction failure must not return partial success');
  await assert.rejects(exercise([[preset], [entry], [disabled], [clip]], () => service.applyPreset('owner', { ...input, reviewToken: review.data.reviewToken })), e => e.status === 409);
  console.log('Preset service review, stale revision, unavailable clips and transaction failure fixtures passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
