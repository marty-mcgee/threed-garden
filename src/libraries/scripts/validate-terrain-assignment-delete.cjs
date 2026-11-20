const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// Execute actual routes with a deterministic lock scheduler, never a database.
const table = name => new Proxy({ name }, { get: (target, key) => target[key] ?? `${name}.${String(key)}` });
const names = ['project', 'projectAssets', 'projectMultimedia', 'projectThreed', 'projectTraffic', 'multimedia', 'threed', 'traffic', 'threedTerrains', 'threedTerrainRevisions', 'projectTerrainPlacements', 'threedWateringSchedules', 'threedWateringHistory', 'threedTasks'];
const schema = Object.fromEntries(names.map(name => [name, table(name)]));
schema.assetTypeEnum = { enumValues: ['threed_terrains', 'threed_watering_schedules'] };
const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};

function fixture({ asset = null, placement = false, pause = false, assetType = 'threed_terrains' } = {}) {
  const watering = assetType === 'threed_watering_schedules';
  const source = watering ? schema.threedWateringSchedules : schema.threedTerrains;
  const updatedAt = new Date('2026-11-20T16:00:00.000Z');
  const state = { terrain: true, asset, placement, writes: 0 };
  let lockTail = Promise.resolve();
  const acquired = deferred();
  const resume = deferred();
  let firstLock = true;
  const events = [];
  function connection(transaction = false) {
    let release;
    function query(kind, initialTable) {
      let target = initialTable;
      let lock;
      let values;
      const q = {
        from(value) { target = value; return q; },
        where() { return q; },
        innerJoin() { return q; },
        limit() { return q; },
        orderBy() { return q; },
        for(value) { lock = value; return q; },
        values(value) { values = value; return q; },
        set(value) { values = value; return q; },
        returning() { return q; },
        then(resolve, reject) { return execute().then(resolve, reject); },
      };
      async function execute() {
        if (lock) {
          assert.ok(transaction, 'Terrain lock must belong to a transaction');
          assert.equal(target, source);
          events.push(`request:${lock}`);
          const previous = lockTail;
          const held = deferred();
          lockTail = held.promise;
          await previous;
          release = held.resolve;
          events.push(`acquired:${lock}`);
          if (firstLock) {
            firstLock = false;
            acquired.resolve();
            if (pause) await resume.promise;
          }
        }
        if (kind === 'select') {
          if (target === source) return state.terrain ? [{ id: 7, updatedAt }] : [];
          if (target === schema.threedTerrainRevisions) return [{ revision: 1 }];
          if (target === schema.projectTerrainPlacements) return state.placement ? [{ id: 'placement' }] : [];
          if (target === schema.projectAssets) return state.asset ? [state.asset] : [];
          if (target === schema.threedTasks || target === schema.threedWateringHistory) return [];
          return [{ id: 1 }];
        }
        assert.ok(transaction && release, 'Assignment/deletion writes must retain the Terrain lock');
        state.writes++;
        if (kind === 'delete') {
          if (target === source) state.terrain = false;
          return [];
        }
        assert.ok(state.terrain, 'Cannot assign a deleted Terrain');
        state.asset = { id: 9, ...state.asset, ...values };
        return [state.asset];
      }
      return q;
    }
    return {
      select: () => query('select'),
      insert: target => query('insert', target),
      update: target => query('update', target),
      delete: target => query('delete', target),
      finish() { release?.(); },
    };
  }
  const db = connection();
  db.transaction = async callback => {
    const tx = connection(true);
    try { return await callback(tx); } finally { tx.finish(); }
  };
  function load(path) {
    const exports = {};
    const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    vm.runInNewContext(code, {
      exports,
      console: { log() {}, error() {} },
      URL, URLSearchParams,
      require(name) {
        if (name === 'next/server') return { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } };
        if (name === '@/libraries/auth') return { auth: async () => ({ user: { id: 'owner' } }) };
        if (name === '@/libraries/db/client') return { db };
        if (name.startsWith('@/libraries/schema')) return schema;
        if (name === 'drizzle-orm') return { ...Object.fromEntries(['eq', 'and', 'or', 'desc', 'asc', 'sql'].map(key => [key, () => null])), getTableColumns: () => ({}) };
        if (name === '@/libraries/db/sequence') return { ensureTableSequence: async () => {} };
        if (name === '@/libraries/project-assets/asset-registry') return { ASSIGNABLE_ASSET_REGISTRY: {
          [assetType]: { moduleType: 'threed', policy: 'ownerOnly', table: source, idColumn: source.id, userIdColumn: source.userId },
        } };
        if (name.endsWith('/terrain-core')) return { TerrainInputError: class extends Error {} };
        if (name.endsWith('/list-sort-order')) return {};
        if (name.endsWith('/watering-list-query')) return {};
        if (name.endsWith('/watering-schedule-edit')) return { parseWateringScheduleVersion: value => new Date(value), WateringScheduleInputError: class extends Error {} };
        throw new Error(`Unexpected dependency: ${name}`);
      },
    });
    return exports;
  }
  const assignment = load('src/app/api/project/assets/route.ts');
  const records = load(watering ? 'src/app/api/threed/watering-schedules/route.ts' : 'src/app/api/threed/terrains/route.ts');
  return {
    state, events, acquired, resume,
    assign: () => assignment.POST({ json: async () => ({ projectId: 1, moduleId: 1, moduleType: 'threed', assetType, assetId: 7 }) }),
    remove: () => {
      const url = new URL('https://fixture.invalid/?id=7&revision=1');
      url.searchParams.set('expectedUpdatedAt', updatedAt.toISOString());
      return records.DELETE({ url: url.href, nextUrl: url });
    },
  };
}

const timeout = setTimeout(() => {
  console.error('FAIL: Terrain lock scheduler did not complete.');
  process.exit(1);
}, 5000);
(async () => {
  for (const existing of [null, { id: 9, isActive: false }]) {
    const f = fixture({ asset: existing, pause: true });
    const assignment = f.assign();
    await f.acquired.promise;
    const deletion = f.remove();
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(f.events, ['request:share', 'acquired:share', 'request:update']);
    f.resume.resolve();
    assert.equal((await assignment).status, 200);
    assert.equal((await deletion).status, 409);
    assert.equal(f.state.terrain, true);
    assert.equal(f.state.asset.isActive, true);
  }
  const f = fixture({ pause: true });
  const deletion = f.remove();
  await f.acquired.promise;
  const assignment = f.assign();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(f.events, ['request:update', 'acquired:update', 'request:share']);
  f.resume.resolve();
  assert.equal((await deletion).status, 200);
  assert.equal((await assignment).status, 404);
  assert.equal(f.state.asset, null);
  for (const isActive of [true, false]) {
    const f = fixture({ asset: { id: 9, isActive } });
    const result = await f.remove();
    assert.equal(result.status, 409);
    assert.match(result.body.error, /inactive assignment records also protect/);
    assert.equal(f.state.writes, 0);
  }
  const placed = fixture({ placement: true });
  assert.match((await placed.remove()).body.error, /saved Project placement/);
  assert.equal(placed.state.writes, 0);
  console.log('PASS: Terrain assignment/delete mocked interleavings, reactivation and retained-reference protection.');
  for (const assignmentFirst of [true, false]) {
    const schedule = fixture({ pause: true, assetType: 'threed_watering_schedules' });
    const first = assignmentFirst ? schedule.assign() : schedule.remove();
    await schedule.acquired.promise;
    const second = assignmentFirst ? schedule.remove() : schedule.assign();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(schedule.events.at(-1), assignmentFirst ? 'request:update' : 'request:share');
    schedule.resume.resolve();
    assert.equal((await first).status, 200);
    assert.equal((await second).status, assignmentFirst ? 409 : 404);
    assert.equal(schedule.state.terrain, assignmentFirst);
    assert.equal(Boolean(schedule.state.asset), assignmentFirst);
  }
  console.log('PASS: Watering Schedule assignment and deletion are serialized against the owned schedule.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => clearTimeout(timeout));
