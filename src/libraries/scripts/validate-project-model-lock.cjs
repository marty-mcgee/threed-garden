// Real Model policies and PATCH handler, with owner/database boundaries mocked.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const compile = source => ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const exports = {};
  cache.set(file, exports);
  vm.runInNewContext(compile(fs.readFileSync(file, 'utf8')), {
    exports,
    require(name) {
      if (!name.startsWith('.')) return require(name);
      const target = path.resolve(path.dirname(file), name);
      return load(target.endsWith('.ts') ? target : target + '.ts');
    },
  });
  return exports;
}
const core = load('src/libraries/services/threed/models/project-model-instance-core.ts');
const plain = value => JSON.parse(JSON.stringify(value));
const initial = {
  id: 42,
  projectId: 15,
  userId: 'owner',
  markerType: 'models',
  markerId: 'radio-instance',
  sourceAssetId: 20,
  name: 'Radio',
  positionX: '1.000',
  positionY: '2.000',
  positionZ: '3.000',
  metadata: {
    transformLocked: true,
    retained: 'keep',
  },
  data: {
    scaleMultiplier: 1,
    rotationYInstance: 0,
  },
};
assert.deepEqual(plain(core.parseUpdateProjectModelInstance({ transformLocked: false })), { transformLocked: false });
for (const value of ['false', 1, null]) assert.throws(() => core.parseUpdateProjectModelInstance({ transformLocked: value }));
assert.throws(() => core.parseUpdateProjectModelInstance({ metadata: { transformLocked: false } }));
assert(core.isProjectModelCanvasLocked({ placementRole: 'environment' }));
assert(!core.isProjectModelTransformLocked({ placementRole: 'environment' }));
for (const update of [{ positionX: 5 }, { rotationY: 1 }, { scaleMultiplier: 2 }, { transformLocked: false, positionZ: 5 }]) {
  assert.throws(() => core.assertProjectModelTransformUpdate(initial, update), core.ProjectModelTransformLockedError);
}
core.assertProjectModelTransformUpdate(initial, { instanceName: 'Renamed', isVisible: false });
core.assertProjectModelTransformUpdate(initial, { positionX: 1, scaleMultiplier: 1 });
assert.throws(() => core.assertProjectModelTransformUpdate({ ...initial, metadata: { placementRole: 'environment' } }, { positionX: 9, canvasEdit: true }));
core.assertProjectModelTransformUpdate({ ...initial, metadata: { placementRole: 'environment' } }, { positionX: 9 });
const snapshot = { ...initial, metadata: { transformLocked: false, unrelated: 'retained' }, positionSource: 'asset' };
assert.equal(core.projectModelSnapshotLock(initial, snapshot).transformLocked, true);
assert.equal(core.projectModelSnapshotLock(initial, snapshot).unrelated, 'retained');
assert.throws(() => core.projectModelSnapshotLock(initial, { ...snapshot, positionX: 8 }));
const ball = { ...initial, metadata: { transformLocked: true, physicsMode: 'ball' } };
assert.equal(core.projectModelSnapshotLock(ball, { ...snapshot, positionX: 8, positionSource: 'runtime' }).transformLocked, true);
assert.throws(() => core.projectModelSnapshotLock(ball, { ...snapshot, data: { scaleMultiplier: 2 }, positionSource: 'runtime' }));

const source = ts.createSourceFile('route.ts', fs.readFileSync('src/app/api/project/threed-markers/route.ts', 'utf8'), ts.ScriptTarget.Latest, true);
const declaration = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'updateProjectMarker');
let stored = structuredClone(initial);
let authenticated = true;
let owned = true;
let fail = false;
let updates = 0;
const order = [];
const table = new Proxy({}, { get: (_, key) => String(key) });
const context = {
  ...core,
  CharacterPhysicsInputError: class extends Error {},
  ProjectBedPlacementInputError: class extends Error {},
  ProjectPlantingPlacementInputError: class extends Error {},
  ProjectCharacterPlacementInputError: class extends Error {},
  ProjectFarmBotPlacementInputError: class extends Error {},
  Date,
  Number,
  console: { error() {} },
  auth: async () => authenticated ? { user: { id: 'owner' } } : null,
  readJsonBody: async request => request.body,
  // Deliberately stale unlocked cache; authorization and the transaction must read current state.
  readOwnedProjectMarker: async () => owned ? { ...stored, metadata: {} } : null,
  requireOwnedProject: async () => owned ? { id: 15 } : null,
  getMarkerGeographicValues: () => ({ latitude: 1, longitude: 2, altitude: 3 }),
  projectThreedMarkers: table,
  eq: (field, value) => [field, value],
  and: (...values) => values,
  sql: (strings, ...values) => ({ strings, values }),
  refreshModelMarkerData: data => ({ ...data }),
  readCurrentMarkerModel: async () => { order.push('source'); return {}; },
  NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) },
  db: {
    async transaction(callback) {
      const working = structuredClone(stored);
      const tx = {
        execute: async statement => { assert.equal(statement.values[0], 'project-threed-markers:15'); order.push('advisory'); },
        select() {
          const query = {
            from: () => query,
            where(predicate) {
              assert.deepEqual(plain(predicate), [['id', 42], ['projectId', 15], ['userId', 'owner'], ['markerType', 'models']]);
              return query;
            },
            limit: () => query,
            for: async mode => { assert.equal(mode, 'update'); order.push('row'); return [working]; },
          };
          return query;
        },
        update: () => ({
          set: values => ({
            where: () => ({
              returning: async () => {
                order.push('write');
                if (fail) throw Error('Mock write failed');
                Object.assign(working, values);
                updates++;
                return [working];
              },
            }),
          }),
        }),
      };
      const result = await callback(tx);
      stored = working;
      return result;
    },
  },
};
const patch = vm.runInNewContext(compile(declaration.getText(source) + '\nupdateProjectMarker;'), context);
const request = body => patch({ body }, 42);
(async () => {
  assert.equal((await request({ positionX: 9, canvasEdit: true })).status, 409);
  assert.equal(updates, 0);
  assert.equal((await request({ transformLocked: false, positionX: 9 })).status, 409);
  order.length = 0;
  assert.equal((await request({ transformLocked: false })).status, 200);
  assert.deepEqual(order, ['advisory', 'row', 'source', 'write']);
  assert.equal(stored.metadata.transformLocked, false);
  assert.equal(stored.metadata.retained, 'keep');
  assert.equal(stored.positionX, '1.000');
  assert.equal((await request({ positionX: 9, scaleMultiplier: 2, canvasEdit: true })).status, 200);
  assert.equal(stored.positionX, '9.000');
  assert.equal(stored.data.scaleMultiplier, 2);
  assert.equal((await request({ transformLocked: true })).status, 200);
  assert.equal((await request({ positionX: 10 })).status, 409);
  const before = structuredClone(stored);
  fail = true;
  assert.equal((await request({ transformLocked: false })).status, 500);
  assert.deepEqual(plain(stored), plain(before), 'Failure retains the lock');
  fail = false;
  owned = false;
  assert.equal((await request({ transformLocked: false })).status, 404);
  authenticated = false;
  assert.equal((await request({ transformLocked: false })).status, 401);
  console.log('PASS: actual Project Model lock parsing/PATCH, current-row lock enforcement, stale unlock/move rejection, metadata preservation, failure/owner guards, Environment canvas protection and runtime-ball snapshot policy. Mock persistence only.');
})().catch(error => { console.error(error); process.exitCode = 1; });
