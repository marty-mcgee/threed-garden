const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const compile = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
function load(path, mocks) {
  const exports = {};
  vm.runInNewContext(compile(fs.readFileSync(path, 'utf8')), { exports, URL, URLSearchParams, Buffer, console, require(name) { assert.ok(name in mocks, name); return mocks[name]; } });
  return exports;
}
const parser = load('src/libraries/services/threed/waterings/watering-list-query.ts', {});
const edit = load('src/libraries/services/threed/waterings/watering-schedule-edit.ts', {});
const historyEdit = load('src/libraries/services/threed/waterings/watering-history-edit.ts', { './watering-schedule-edit': edit });
const sortOrder = load('src/libraries/services/threed/list-sort-order.ts', {});
const schema = Object.fromEntries(['threedWateringSchedules', 'threedWateringHistory', 'projectAssets', 'threedTasks', 'threedPlants', 'threedPlantings', 'threedBeds', 'threedFarmbots'].map(name => [name, new Proxy({}, { get: (_, column) => `${name}.${column}` })]));
const orm = Object.fromEntries(['eq', 'and', 'asc', 'desc', 'inArray'].map(name => [name, (...args) => ({ name, args })]));
orm.sql = (strings, ...args) => ({ strings: [...strings], args });
orm.getTableColumns = table => ({ id: table.id, sortOrder: table.sortOrder });
let queries = [], queue = [], signedIn = true;
function query(state = {}) {
  const chain = { fixture: state };
  for (const method of ['from', 'where', 'orderBy', 'limit', 'offset', 'for', 'set', 'values', 'onConflictDoNothing', 'returning']) {
    chain[method] = (...args) => { state[method] = args; return chain; };
  }
  chain.then = (resolve, reject) => {
    queries.push(state);
    assert.ok(queue.length);
    const result = queue.shift();
    return (result instanceof Error ? Promise.reject(result) : Promise.resolve(result)).then(resolve, reject);
  };
  return chain;
}
const db = {
  select: () => query(),
  insert: table => query({ insert: table }),
  update: table => query({ update: table }),
  delete: table => query({ delete: table }),
  $with: () => ({ as: locked => {
    queries.push(locked.fixture);
    return { id: 'locked.id', sortOrder: 'locked.sortOrder', date: 'locked.date', createdAt: 'locked.createdAt' };
  } }),
  with: () => db,
  async execute(statement) {
    queries.push({ execute: statement });
    const result = queue.shift();
    if (result instanceof Error) throw result;
    return result;
  },
  async transaction(callback) {
    const result = await callback(db);
    queries.push({ commit: true });
    return result;
  },
};
const mocks = { '@/libraries/services/threed/waterings/watering-list-query': parser, '@/libraries/services/threed/waterings/watering-schedule-edit': edit, '@/libraries/services/threed/waterings/watering-history-edit': historyEdit, '@/libraries/services/threed/list-sort-order': sortOrder, 'next/server': { NextResponse: { json: (body, init) => ({ body, status: init?.status ?? 200 }) } }, '@/libraries/auth': { auth: async () => signedIn ? { user: { id: 'owner' } } : null }, '@/libraries/db/client': { db }, '@/libraries/schema/threed': schema, '@/libraries/schema/project': schema, 'drizzle-orm': orm };
(async () => {
  for (const view of ['schedules', 'history']) {
    const api = load(`src/app/api/threed/watering-${view}/route.ts`, mocks);
    async function run(query, results = []) { queries = []; queue = results; const response = await api.GET({ url: `http://localhost/api/threed/watering-${view}?${query}` }); assert.equal(queue.length, 0); return response; }
    for (const query of ['limit=0', 'limit=201', 'offset=-1', 'moduleId=bad', 'plantingId=0', 'isActive=yes']) assert.equal((await run(query)).status, 400);
    signedIn = false; assert.equal((await run('')).status, 401); signedIn = true;
    for (const size of [25, 200]) {
      const response = await run(`limit=${size}&offset=200&search=rain`, [[{ count: '452' }], []]);
      assert.equal(response.body.pagination.total, 452); assert.equal(queries[1].limit[0], size); assert.equal(queries[1].offset[0], 200);
      assert.deepEqual(queries[0].where, queries[1].where); assert.equal(queries[0].where[0].args[0].args[1], 'owner');
      const search = queries[0].where[0].args.at(-1); assert.ok(search.strings[0].startsWith('(')); assert.ok(search.strings.at(-1).endsWith(')'));
    }
    if (view === 'schedules') {
      for (const query of ['sortBy=userId', 'sortBy=id', 'sortDir=random']) assert.equal((await run(query)).status, 400);
      const empty = await run('moduleId=5', [[]]); assert.equal(empty.body.pagination.total, 0);
      await run('moduleId=5', [[{ assetId: 7 }], [{ count: 1 }], [{ id: 7 }]]);
      assert.equal(queries[0].where[0].args[3].args[1], 'owner'); assert.deepEqual(queries[1].where, queries[2].where);
      const column = field => schema.threedWateringSchedules[field];
      assert.deepEqual(queries[2].orderBy, ['nextWatering', 'createdAt', 'id'].map(field => orm.desc(column(field))));
      for (const field of parser.wateringScheduleSortFields) {
        for (const direction of ['asc', 'desc']) {
          await run(`sortBy=${field}&sortDir=${direction}&search=rain`, [[{ count: 1 }], [{ id: 7 }]]);
          const selected = orm[direction](column(field));
          const expected = ['lastWatering', 'volumeMl', 'isActive'].includes(field) ? orm.sql`${selected} nulls last` : selected;
          assert.deepEqual(queries[1].orderBy, [expected, ...(field === 'sortOrder' ? [orm.desc(column('nextWatering'))] : []), orm.desc(column('createdAt')), orm.desc(column('id'))]);
          assert.deepEqual(queries[0].where, queries[1].where);
        }
      }
    } else {
      await run('moduleId=5', [[{ count: 0 }], []]); const scope = queries[0].where[0].args[1];
      assert.ok(scope.strings.join('').includes('exists')); assert.ok(scope.args.includes('owner')); assert.ok(scope.args.includes(5));
      const source = fs.readFileSync('src/components/admin/threed/watering-schedules/ThreeDWateringSchedulesCRUD.tsx', 'utf8');
      assert.ok(!source.includes('/api/threed/plantings')); assert.ok(!source.includes("method: 'POST'")); assert.ok(!source.includes("method: 'DELETE'"));
      assert.deepEqual(queries[1].orderBy, [orm.desc(schema.threedWateringHistory.executedAt), orm.desc(schema.threedWateringHistory.id)]);
      for (const field of parser.wateringHistorySortFields) {
        await run(`sortBy=${field}&sortDir=asc`, [[{ count: 1 }], [{ id: 7 }]]);
        const selected = orm.asc(schema.threedWateringHistory[field]);
        assert.deepEqual(queries[1].orderBy, field === 'sortOrder'
          ? [selected, orm.desc(schema.threedWateringHistory.executedAt), orm.desc(schema.threedWateringHistory.createdAt), orm.desc(schema.threedWateringHistory.id)]
          : [orm.sql`${selected} nulls last`, orm.desc(schema.threedWateringHistory.id)]);
      }
      assert.equal((await run('sortBy=userId')).status, 400);
    }
    const unmigrated = Object.assign(Error('column "sort_order" does not exist'), { code: '42703' });
    assert.equal((await run('sortBy=sortOrder&sortDir=asc', [[{ count: 1 }], unmigrated, [{ id: 7, sortOrder: null }]])).body.data[0].sortOrder, null);
  }
  console.log('PASS: Waterings list endpoints, bounds, pagination, sorting and tie-breaks, owner scope and grouped search/count parity');

  const api = load('src/app/api/threed/watering-schedules/route.ts', mocks);
  const updatedAt = new Date('2026-11-20T15:00:00.000Z');
  const expectedUpdatedAt = updatedAt.toISOString();
  const manage = load('src/app/api/threed/waterings/manage/route.ts', mocks);
  const item = { id: 7, expectedUpdatedAt };
  async function manageRecords(view, rows, body) {
    queries = [];
    queue = rows;
    const result = await manage.PATCH({ url: `http://localhost/api/threed/waterings/manage?view=${view}`, text: async () => JSON.stringify(body) });
    assert.equal(queue.length, 0);
    return result;
  }
  const set = (changes, selection = [item, { ...item, id: 9 }]) => ({ action: 'set', changes, selection });
  const scheduleChanges = { isActive: false, sortOrder: -5 };
  const historyChanges = { status: 'skipped', durationMs: null };
  for (const [view, changes, table] of [['schedules', scheduleChanges, schema.threedWateringSchedules], ['history', historyChanges, schema.threedWateringHistory]]) {
    const rows = [{ id: 7, updatedAt }, { id: 9, updatedAt }];
    assert.equal((await manageRecords(view, [rows, []], set(changes))).body.data.updated, 2);
    assert.equal(queries[1].update, table);
    const { updatedAt: setVersion, ...written } = queries[1].set[0];
    assert(setVersion.getTime() > updatedAt.getTime());
    assert.deepEqual(written, changes);
    assert.deepEqual(queries[0].where, queries[1].where);
    assert.equal(queries[0].where[0].args[0].args[1], 'owner');
    assert.deepEqual(queries[0].for, ['update']);
    assert.equal((await manageRecords(view, [[rows[0]]], set(changes))).status, 404);
    assert(!queries.some(q => q.update || q.commit));
    assert.equal((await manageRecords(view, [[rows[0], { ...rows[1], updatedAt: new Date(0) }]], set(changes))).status, 409);
    assert(!queries.some(q => q.update || q.commit));
    assert.equal((await manageRecords(view, [], set(changes, [item, item]))).status, 400);
    const order = [{ id: 7, sortOrder: 0 }, { id: 9, sortOrder: 0 }];
    const move = { action: 'move', sourceId: 9, targetId: 7, after: false };
    assert.equal((await manageRecords(view, [order, []], move)).body.data.updated, 1);
    assert.equal(queries[0].where[0].args[1], 'owner');
    assert.deepEqual(queries[0].for, ['update']);
    assert.deepEqual(JSON.parse(queries[2].execute.args[1]), [{ id: 7, sort_order: 1 }]);
    assert.equal((await manageRecords(view, [order], { ...move, after: true })).body.data.updated, 0);
    assert.equal((await manageRecords(view, [[order[0]]], move)).status, 404);
    assert.equal((await manageRecords(view, [order, Error('mock write failure')], move)).status, 500);
    assert(!queries.some(q => q.commit));
  }
  assert.equal((await manageRecords('history', [], set({ executedBy: 'automated' }))).status, 400);
  assert.equal((await manageRecords('schedules', [], set({ sortOrder: 1.5 }))).status, 400);
  signedIn = false;
  assert.equal((await manageRecords('history', [], set(historyChanges))).status, 401);
  signedIn = true;
  console.log('PASS: Both Waterings lists support owner-only bulk changes and atomic rank moves with stale, foreign, and rollback guards.');
  const historyApi = load('src/app/api/threed/watering-history/route.ts', mocks);
  const log = { historyId: 'Garden Log', executedAt: '2026-11-20T06:30', status: 'success', volumeMl: 0 };
  async function changeHistory(method, reads, input, version = expectedUpdatedAt) {
    queries = [];
    queue = reads;
    const url = new URL('http://localhost/api/threed/watering-history?id=7');
    url.searchParams.set('expectedUpdatedAt', version);
    const response = await historyApi[method]({ url: url.href, text: async () => JSON.stringify(input) });
    assert.equal(queue.length, 0);
    return response;
  }
  signedIn = false;
  for (const method of ['POST', 'PATCH', 'DELETE']) assert.equal((await changeHistory(method, [], {})).status, 401);
  signedIn = true;
  for (const input of [{ ...log, executedBy: 'automated' }, { ...log, userId: 'different' }, { ...log, status: '' }, { ...log, executedAt: '2026-02-30T12:20' }]) {
    assert.equal((await changeHistory('POST', [], input)).status, 400);
    assert.equal(queries.length, 0);
  }
  assert.equal((await changeHistory('POST', [[{ id: 40 }], [{ id: 9 }]], { ...log, scheduleId: 40 })).status, 201);
  assert.deepEqual(queries[0].where[0].args, [orm.eq(schema.threedWateringSchedules.id, 40), orm.eq(schema.threedWateringSchedules.userId, 'owner')]);
  assert.deepEqual(queries[0].for, ['share']);
  assert.deepEqual({ ...queries[1].values[0] }, { ...log, executedAt: '2026-11-20 06:30', scheduleId: 40, executedBy: 'manual', userId: 'owner' });
  assert.equal((await changeHistory('POST', [[]], { ...log, scheduleId: 40 })).status, 400);
  assert(!queries.some(query => query.insert || query.commit));
  assert.equal((await changeHistory('POST', [[]], log)).status, 409);
  assert(!queries.some(query => query.commit));
  assert.equal((await changeHistory('PATCH', [], { expectedUpdatedAt, changes: { executedBy: 'user' } })).status, 400);
  const patch = { expectedUpdatedAt, changes: { durationMs: 1000, errorMessage: null } };
  assert.equal((await changeHistory('PATCH', [[{ updatedAt }], []], patch)).status, 200);
  const { updatedAt: historyVersion, ...values } = queries[1].set[0];
  assert(historyVersion.getTime() > updatedAt.getTime());
  assert.deepEqual(values, patch.changes);
  assert.deepEqual(queries[0].where, queries[1].where);
  assert.equal(queries[0].where[0].args[1].args[1], 'owner');
  assert.equal((await changeHistory('PATCH', [[]], patch)).status, 404);
  assert.equal((await changeHistory('PATCH', [[{ updatedAt }], Error('mock failure')], patch)).status, 500);
  assert(!queries.some(query => query.commit));
  assert.equal((await changeHistory('DELETE', [[{ updatedAt }]], undefined, '2026-11-20T09:00:00.000Z')).status, 409);
  assert(!queries.some(query => query.delete || query.commit));
  assert.equal((await changeHistory('DELETE', [[{ updatedAt }], []])).body.data.id, 7);
  assert.deepEqual(queries[0].where, queries[1].where);
  console.log('PASS: Watering History create, edit and delete, manual provenance, target ownership, stale and rollback guards.');
  const schedule = { id: 7, updatedAt, minTemperature: 10, maxTemperature: 30 };
  const baseUrl = 'http://localhost/api/threed/watering-schedules?id=7';
  async function create(results, input) {
    queries = [];
    queue = results;
    const response = await api.POST({ text: async () => JSON.stringify(input) });
    assert.equal(queue.length, 0);
    return response;
  }
  const newSchedule = { scheduleId: '  Garden A  ', durationMs: 4000, nextWatering: '2026-11-25T08:30' };
  signedIn = false;
  assert.equal((await api.POST({ text: () => assert.fail('Signed-out creation must not read the body') })).status, 401);
  signedIn = true;
  for (const input of [{}, { ...newSchedule, scheduleId: '' }, { ...newSchedule, durationMs: null }, { ...newSchedule, nextWatering: undefined },
    { ...newSchedule, userId: 'different-user' }, { ...newSchedule, bedId: -1 }, { ...newSchedule, minTemperature: 25, maxTemperature: 20 }]) {
    assert.equal((await create([], input)).status, 400);
    assert.equal(queries.length, 0);
  }
  const created = await create([[{ id: 25 }]], newSchedule);
  assert.equal(created.status, 201);
  assert.equal(created.body.data.id, 25);
  assert.equal(queries[0].insert, schema.threedWateringSchedules);
  assert.deepEqual({ ...queries[0].values[0] }, {
    userId: 'owner', scheduleId: 'Garden A', frequency: 'daily', isActive: true, skipIfRain: true,
    durationMs: 4000, nextWatering: '2026-11-25 08:30',
  });
  assert.equal(queries[0].onConflictDoNothing[0].target, schema.threedWateringSchedules.scheduleId);
  assert.equal((await create([[{ id: 14 }], [{ id: 25 }]], { ...newSchedule, plantingId: 14, isActive: false })).status, 201);
  assert.equal(queries[0].from[0], schema.threedPlantings);
  assert.deepEqual(queries[0].where[0].args, [orm.eq(schema.threedPlantings.id, 14), orm.eq(schema.threedPlantings.userId, 'owner')]);
  assert.equal(queries[0].for[0], 'share');
  assert.equal(queries[1].values[0].plantingId, 14);
  assert.equal(queries[1].values[0].isActive, false);
  assert.equal((await create([[]], { ...newSchedule, farmbotId: 14 })).status, 400);
  assert(!queries.some(q => q.insert || q.commit));
  assert.equal((await create([[]], newSchedule)).status, 409);
  assert(!queries.some(q => q.commit));
  assert.equal((await create([Error('write failure')], newSchedule)).status, 500);
  assert(!queries.some(q => q.commit));
  console.log('PASS: owner-scoped Watering Schedule creation, target validation, unique Schedule ID, and rollback.');
  async function mutate(method, results, changes = { notes: 'A schedule note' }) {
    queries = [];
    queue = results;
    const response = await api[method]({
      url: `${baseUrl}&expectedUpdatedAt=${encodeURIComponent(expectedUpdatedAt)}`,
      text: async () => JSON.stringify({ changes, expectedUpdatedAt }),
    });
    assert.equal(queue.length, 0);
    return response;
  }
  signedIn = false;
  assert.equal((await mutate('PATCH', [])).status, 401);
  assert.equal((await mutate('DELETE', [])).status, 401);
  signedIn = true;
  for (const changes of [{ userId: 'other' }, { farmbotId: 12 }, { frequency: 'sometimes' }, { daysOfWeek: [1, 1] },
    { isActive: 'false' }, { durationMs: 0 }, { timeOfDay: '24:00' }, { nextWatering: '2026-02-30T12:01' }, { nextWatering: '2026-11-20T12:01Z' }]) {
    assert.equal((await mutate('PATCH', [], changes)).status, 400);
  }
  const edited = await mutate('PATCH', [[schedule], [{ id: 7 }]], {
    frequency: 'weekly', nextWatering: '2026-11-30T12:01', notes: null, volumeMl: 0, isActive: false,
  });
  assert.equal(edited.body.data.id, 7);
  assert.equal(queries[0].for[0], 'update');
  assert.deepEqual(queries[0].where, queries[1].where);
  assert.equal(queries[0].where[0].args[1].args[1], 'owner');
  const { updatedAt: nextVersion, ...changes } = queries[1].set[0];
  assert(nextVersion.getTime() > updatedAt.getTime());
  assert.deepEqual(JSON.parse(JSON.stringify(changes)), { frequency: 'weekly', nextWatering: '2026-11-30 12:01', notes: null, volumeMl: 0, isActive: false });
  assert.equal((await mutate('PATCH', [[schedule]], { minTemperature: 31 })).status, 400);
  assert(!queries.some(q => q.update || q.commit));
  assert.equal((await mutate('PATCH', [[schedule], Error('write failure')])).status, 500);
  assert(!queries.some(q => q.commit));
  assert.equal((await mutate('PATCH', [[]])).status, 404);
  assert.equal((await mutate('PATCH', [[{ ...schedule, updatedAt: new Date('2026-11-21T15:00:00.000Z') }]])).status, 409);

  assert.equal((await mutate('DELETE', [[]])).status, 404);
  assert.equal((await mutate('DELETE', [[{ ...schedule, updatedAt: new Date('2026-11-21T15:00:00.000Z') }]])).status, 409);
  for (const [reads, reason] of [
    [[[{ id: 1 }]], /Project assignment/],
    [[[], [{ id: 1 }]], /linked to a Task/],
    [[[], [], [{ id: 1 }]], /recorded watering history/],
  ]) {
    const blocked = await mutate('DELETE', [[schedule], ...reads]);
    assert.equal(blocked.status, 409);
    assert.match(blocked.body.error, reason);
    assert(!queries.some(q => q.delete || q.commit));
  }
  assert.equal((await mutate('DELETE', [[schedule], [], [], [], []])).body.data.id, 7);
  assert.deepEqual(queries[0].where, queries[4].where);
  assert(queries.at(-1).commit);
  console.log('PASS: Watering Schedule edits and confirmed deletion, stale/owner guards, reference protection, and rollback.');
})().catch(error => { console.error(error); process.exitCode = 1; });
