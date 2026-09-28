const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const load = (file, mocks) => {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
    { exports, console, URL, require(name) { assert(name in mocks, name); return mocks[name]; } });
  return exports;
};
const table = name => new Proxy({ name }, { get: (target, key) => key === 'name' ? name : { table: name, key } });
const schema = new Proxy({}, { get: (_, name) => table(name) });
const orm = { getTableColumns: () => ({}) };
for (const op of ['and', 'or', 'eq', 'inArray', 'desc']) orm[op] = (...args) => ({ op, args });
orm.sql = (strings, ...values) => ({ op: 'sql', strings, values });
function test(expr, row) {
  const value = x => x && typeof x === 'object' && x.table ? row[x.key] : x;
  if (!expr) return true;
  if (expr.op === 'and') return expr.args.every(x => test(x, row));
  if (expr.op === 'or') return expr.args.some(x => test(x, row));
  if (expr.op === 'eq') return value(expr.args[0]) === value(expr.args[1]);
  if (expr.op === 'inArray') return expr.args[1].includes(value(expr.args[0]));
  if (expr.op === 'sql') return !expr.strings.join('').includes('false');
  throw new Error('Unknown expression');
}
let viewer, records;
const db = { select() {
  let source, condition, max = Infinity;
  const chain = {
    from(t) { source = t.name; return chain; },
    where(c) { condition = c; return chain; },
    innerJoin() { return chain; }, orderBy() { return chain; },
    limit(n) { max = n; return chain; },
    then(resolve, reject) { return Promise.resolve((records[source] ?? []).filter(row => test(condition, row)).slice(0, max)).then(resolve, reject); },
  };
  return chain;
} };
const policy = load('src/libraries/services/project/scene-read-policy.ts', {});
const lighting = load('src/libraries/services/threed/models/model-lighting-core.ts', {});
const snapshot = load('src/libraries/services/threed/models/model-snapshot-assets.ts', { './model-lighting-core.ts': lighting });
const animationMappings = load('src/libraries/services/project/scene-character-animations.ts', {
  'drizzle-orm': orm, '@/libraries/db/client': { db }, '@/libraries/schema/threed': schema,
});
const api = load('src/app/api/map/threed/route.ts', {
  '@/libraries/services/project/scene-texture-resources': { sceneTextureResources: async () => [{ fileName: 'referenced.png', filePath: 'https://fixture.invalid/referenced.png', isActive: true }] },
  '@/libraries/services/project/scene-character-animations': animationMappings,
  '@/libraries/services/project/scene-read-policy': policy,
  '@/libraries/db/read-retry': { retryDisconnectedRead: fn => fn() },
  '@/libraries/db/connection-diagnostics': { databaseConnectionDiagnostic: () => ({}) },
  '@/libraries/services/threed/models/model-snapshot-assets': snapshot,
  '@/libraries/services/threed/models/model-primary-file': { modelSelection: () => ({}) },
  'drizzle-orm': orm,
  'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } },
  '@/libraries/auth': { auth: async () => viewer ? { user: { id: viewer } } : null },
  '@/libraries/db/client': { db },
  '@/libraries/services/threed/farmbot/sanitize': { sanitizeFarmBotRecord: row => row },
  '@/libraries/schema/threed': schema, '@/libraries/schema/traffic': schema, '@/libraries/schema/project': schema,
  '@/libraries/services/threed/markers/project-view-state-core': { readThreeDProjectViewStateFromConfig: () => null },
});
const access = load('src/libraries/services/project/read-access.ts', {
  './scene-read-policy': policy, 'drizzle-orm': orm, '@/libraries/db/client': { db }, '@/libraries/schema/project': schema,
});
const ground = load('src/app/api/threed/ground-maps/route.ts', {
  '@/libraries/services/project/read-access': access,
  'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } },
  'drizzle-orm': orm, '@vercel/blob': {}, '@/libraries/auth': { auth: async () => viewer ? { user: { id: viewer } } : null },
  '@/libraries/db/client': { db }, '@/libraries/db/sequence': {}, '@/libraries/schema/project': schema, '@/libraries/schema/threed': schema,
  '@/libraries/services/threed/models/model-blob-paths': {}, '@/libraries/services/threed/models/model-image-limits-core': {},
});
function fixture() {
  const model = { id: 7, userId: 'owner', isActive: true, status: 'active', isPublic: false, isLibraryItem: false, modelType: 'fbx', filePath: 'https://fixture.invalid/current.fbx' };
  records = {
    project: [{ id: 8, userId: 'owner', isPublic: true, name: 'Public garden', originLatitude: null }],
    projectThreed: [{ projectId: 8, userId: 'owner', isActive: true, threedId: 2, name: 'Garden' }],
    projectAssets: [{ projectId: 8, moduleType: 'threed', moduleId: 2, userId: 'owner', isActive: true, assetType: 'threed_models', assetId: 7 }],
    threedModels: [model, { ...model, id: 99, userId: 'stranger' }],
    threedModelFiles: [
      { id: 1, modelId: 7, userId: 'owner', fileName: 'atlas.png', relativePath: 'atlas.png', fileType: 'texture', filePath: 'https://fixture.invalid/atlas.png' },
      { id: 2, modelId: 7, userId: 'stranger', fileName: 'private.png', filePath: 'https://fixture.invalid/private.png' },
    ],
    threedModelMaterialAssignments: [{ modelId: 7, textureOwner: 'owner', targetKey: 'leaf', channel: 'baseColor', textureFileName: 'atlas.png', textureUrl: 'https://fixture.invalid/atlas.png' }],
    projectThreedMarkers: [{ id: 3, projectId: 8, threedId: 2, userId: 'owner', markerType: 'models', sourceAssetId: 7, data: { filePath: 'stale-url', files: [{ filePath: 'stale-url' }], renderingAssetsResolved: false } }],
  };
}
async function run(extra = '') { return api.GET({ url: `http://localhost/api/map/threed?projectId=8${extra}` }); }
(async () => {
  for (viewer of [undefined, 'visitor', 'owner']) {
    fixture(); const result = await run(); assert.equal(result.status, 200);
    const model = result.body.data.models[0];
    assert.equal(result.body.projectContext.canEdit, viewer === 'owner');
    assert.equal(result.body.data.models.length, 1, 'Unassigned Models must not appear');
    assert.equal(model.renderingAssetsResolved, true);
    assert.equal(model.files.length, 1, 'Cross-owner File must not appear');
    assert.equal(model.files[0].userId, undefined, 'File response uses rendering projection');
    assert.equal(model.materialAssignments.length, 1);
    assert.equal(model.textureFallbacks.length, 2, 'Owner, visitor and guest receive the same assigned and referenced textures');
    assert.equal(model.textureFallbacks[1].fileName, 'referenced.png');
    assert.equal(result.body.markerSnapshot[0].data.filePath, 'https://fixture.invalid/current.fbx');
    assert.equal(result.body.markerSnapshot[0].data.renderingAssetsResolved, true);
    records.project[0].isPublic = false;
    assert.equal((await run()).status, viewer === 'owner' ? 200 : 404);
  }
  viewer = undefined; fixture();
  records.projectAssets.push({ projectId: 8, moduleType: 'threed', moduleId: 2, userId: 'owner', isActive: true, assetType: 'threed_characters', assetId: 12 });
  records.threedCharacters = [{ id: 12, userId: 'owner', isActive: true, modelId: 7 }];
  records.threedCharacterAnimationAssignments = [
    { characterId: 12, userId: 'owner', actionKey: 'walk', mode: 'assigned', animationId: 31 },
    { characterId: 12, userId: 'stranger', actionKey: 'run', mode: 'assigned', animationId: 99 },
    { characterId: 13, userId: 'owner', actionKey: 'run', mode: 'assigned', animationId: 98 },
  ];
  records.threedModelAnimationAssignments = [{ modelId: 7, userId: 'owner', actionKey: 'idle', mode: 'assigned', animationId: 31 }];
  records.threedAnimations = [{ id: 31, userId: 'owner', isActive: true, filePath: 'https://fixture.invalid/walk.fbx', format: 'fbx', clipIndex: 0 }];
  records.projectThreedMarkers.push({ id: 4, projectId: 8, threedId: 2, userId: 'owner', markerType: 'characters', sourceAssetId: 12, data: { sceneAnimationMapping: { animations: ['stale'] } } });
  const animated = await run();
  const mapping = animated.body.data.characters[0].sceneAnimationMapping;
  assert.equal(mapping.assignments.length, 1); assert.equal(mapping.inherited.length, 1);
  assert.equal(mapping.animations.length, 1); assert.equal(mapping.animations[0].userId, undefined);
  assert.equal(animated.body.markerSnapshot[1].data.sceneAnimationMapping.animations[0].id, 31);
  records.threedAnimations[0].userId = 'stranger';
  assert.equal((await run()).body.data.characters[0].sceneAnimationMapping.animations.length, 0, 'Animation source owner must match assignment owner');
  console.log('PASS: public Character animation hydration — assigned-only sources, inheritance, owner filtering and current snapshot mapping');
  viewer = undefined; fixture(); records.threedModels[0].userId = 'stranger';
  assert.equal((await run()).body.data.models.length, 0, 'Private cross-owner Model denied');
  fixture(); records.projectAssets[0].isActive = false;
  assert.equal((await run('&includeInactive=true')).body.data.models.length, 0, 'Guest cannot request inactive assignments');
  fixture(); records.threedModels[0].isActive = false;
  assert.equal((await run('&includeInactive=true')).body.data.models.length, 0, 'Guest cannot request inactive Models');
  fixture();
  records.threedGroundMaps = [
    { id: 10, projectId: 8, userId: 'owner', filePath: 'https://fixture.invalid/ground.png', width: 100, height: 100 },
    { id: 11, projectId: 8, userId: 'stranger', filePath: 'private-ground' },
  ];
  const request = { url: 'http://localhost/api/threed/ground-maps?projectId=8' };
  for (viewer of [undefined, 'visitor', 'owner']) {
    records.project[0].isPublic = true;
    const result = await ground.GET(request);
    assert.equal(result.status, 200);
    assert.equal(result.body.data.id, 10);
    assert.equal(result.body.data.userId, undefined);
    records.project[0].isPublic = false;
    assert.equal((await ground.GET(request)).status, viewer === 'owner' ? 200 : 404);
  }
  viewer = undefined;
  assert.equal((await ground.POST(request)).status, 401);
  assert.equal((await ground.DELETE(request)).status, 401);
  console.log('PASS: actual Ground Map read with mocked DB — public/private access, owner-filtered file, minimal response, anonymous mutations denied');
  console.log('PASS: actual Project bootstrap with mocked DB — public/private reads, owner capability, assigned-only resources, cross-owner denial, inactive denial, current snapshot authority');
})().catch(error => { console.error(error); process.exitCode = 1; });
