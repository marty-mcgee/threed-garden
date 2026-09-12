// Offline tests of real route/service functions, using queued DB results (no network/Blob writes).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '../../..');
const plain = value => JSON.parse(JSON.stringify(value));
function load(file, dependencies) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, URL, URLSearchParams, console,
    require(name) { assert.ok(name in dependencies, `Unexpected import ${name}`); return dependencies[name]; } });
  return exports;
}
const animation = load('src/lib/utils/animation.ts', {});
const contracts = load('src/lib/services/threed/animations/contracts.ts', { '@/lib/utils/animation': animation });
const schema = new Proxy({}, { get: (_, name) => new Proxy({ name }, { get: (_, column) => column === 'name' ? name : `${name}.${String(column)}` }) });
const op = kind => (...args) => ({ kind, args });
const orm = Object.fromEntries(['eq', 'and', 'asc', 'desc', 'inArray'].map(kind => [kind, op(kind)]));
orm.sql = (strings, ...args) => ({ strings: [...strings], args });
orm.getTableColumns = table => ({ id: table.id });
let queue = [], queries = [], signedIn = true, transactions = 0;
const db = {};
for (const operation of ['select', 'insert', 'update', 'delete']) {
  db[operation] = input => {
    const query = { operation, input };
    const chain = {};
    for (const method of ['from', 'where', 'innerJoin', 'orderBy', 'limit', 'offset', 'for', 'set', 'values', 'onConflictDoUpdate', 'returning']) {
      chain[method] = (...args) => { query[method] = args; return chain; };
    }
    chain.then = (resolve, reject) => {
      queries.push(plain(query));
      assert.ok(queue.length, 'Unexpected DB query');
      const next = queue.shift();
      return (next instanceof Error ? Promise.reject(next) : Promise.resolve(next)).then(resolve, reject);
    };
    return chain;
  };
}
db.transaction = async work => { transactions++; return work(db); };
const library = load('src/lib/services/threed/animations/library.ts', {
  'drizzle-orm': orm, '@/lib/db/client': { db }, '@/lib/schema/threed': schema, './contracts': contracts,
});
const http = load('src/lib/services/threed/animations/http.ts', {
  'next/server': { NextResponse: { json: (body, init) => ({ body, status: init?.status ?? 200 }) } },
  '@/lib/auth': { auth: async () => signedIn ? { user: { id: 'owner' } } : null }, './contracts': contracts,
});
const routes = {};
for (const name of ['animations', 'animation-files', 'animation-assignments']) {
  routes[name] = load(`src/app/api/threed/${name}/route.ts`, {
    '@/lib/services/threed/animations/http': http,
    '@/lib/services/threed/animations/contracts': contracts,
    '@/lib/services/threed/animations/library': library,
  });
}
async function request(route, method, query = '', body = null, results = []) {
  queue = results; queries = []; transactions = 0;
  const response = plain(await routes[route][method]({ url: `http://localhost/api/threed/${route}?${query}`, json: async () => {
    if (body instanceof Error) throw body;
    return body;
  } }));
  assert.equal(queue.length, 0, 'Expected DB queries skipped');
  return response;
}
function owned(query) { assert.ok(JSON.stringify(query.where).includes('owner'), 'Owner condition required'); }
const assignment = (actionKey, animationId, mode = 'assigned') => ({ actionKey, animationId, mode });
const active = { id: 7, isActive: true, filePath: 'https://storage/shared.fbx' };
const body = { target: 'model', targetId: 5, actionKey: 'idle', mode: 'assigned', animationId: 7 };
(async () => {
  // Auth precedes body parsing and DB access on every exported handler.
  signedIn = false;
  for (const [name, route] of Object.entries(routes)) for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].filter(key => typeof route[key] === 'function')) {
    assert.equal((await request(name, method)).status, 401); assert.equal(queries.length, 0);
  }
  signedIn = true;
  for (const query of ['limit=0', 'limit=201', 'offset=-1', 'offset=1e3', 'sort=sql', 'direction=sideways', `search=${'x'.repeat(201)}`]) {
    assert.equal((await request('animations', 'GET', query)).status, 400);
  }
  for (const id of [null, false, {}, 0, -1, 1.5, '1e3', '0x10', 2147483648]) assert.throws(() => contracts.positiveId(id));
  for (const input of [null, [], { ...body, userId: 'other' }, { ...body, mode: 'inherit' }, { ...body, animationId: null }, { ...body, actionKey: 'arbitrary-command' }, { ...body, mode: 'disabled' }, { ...body, target: 'project' }]) {
    assert.equal((await request('animation-assignments', 'PUT', '', input)).status, 400);
  }
  assert.equal((await request('animation-assignments', 'PUT', '', new Error('invalid JSON'))).status, 400);
  for (const count of [0, 1, 50, 200]) {
    const rows = Array.from({ length: count }, (_, i) => ({ id: i + 1, filePath: active.filePath, modelUsage: 2, characterUsage: 1 }));
    const result = await request('animations', 'GET', 'limit=200&offset=200&search=walk&sort=name', null, [[{ total: 452 }], rows]);
    assert.equal(result.status, 200); assert.equal(result.body.pagination.total, 452);
    assert.equal(result.body.data.length, count); assert.equal(queries.length, 2);
    queries.forEach(owned); assert.deepEqual(queries[1].offset, [200]);
    assert.equal(queries[1].orderBy.length, 2, 'Stable ID tie-breaker');
    assert.ok(JSON.stringify(queries[1].input).includes('characterUsage'));
  }
  assert.equal((await request('animation-files', 'GET', 'sort=duration')).status, 400);
  assert.equal((await request('animation-files', 'GET', 'sort=size', null, [[{ total: 1 }], [{ id: 2, clipCount: 3 }]])).status, 200);
  queries.forEach(owned);
  // Both target branches are owner scoped before assigning anything.
  for (const target of ['model', 'character']) {
    assert.equal((await request('animation-assignments', 'PUT', '', { ...body, target }, [[]])).status, 404);
    assert.equal(queries.length, 1); owned(queries[0]);
  }
  assert.equal((await request('animation-assignments', 'PUT', '', body, [[{ id: 5 }], []])).status, 404);
  owned(queries[1]); assert.ok(JSON.stringify(queries[1].where).includes('isActive'));
  const saved = await request('animation-assignments', 'PUT', '', body, [[{ id: 5 }], [{ id: 7 }], [body]]);
  assert.equal(saved.status, 200); assert.equal(transactions, 1);
  assert.deepEqual(queries[1].for, ['share']);
  assert.equal(queries[2].values[0].animationId, 7);
  assert.equal('filePath' in queries[2].values[0], false, 'Assignments reference an ID, not a file copy');
  assert.ok(JSON.stringify(queries[2].onConflictDoUpdate).includes('owner'));
  assert.equal((await request('animation-assignments', 'PUT', '', { ...body, target: 'character', mode: 'disabled', animationId: null }, [[{ id: 5, modelId: null }], [{ id: 8 }]])).status, 200);
  assert.equal(queries.length, 2, 'Disabled does not fetch an animation');
  assert.equal(queries[1].values[0].animationId, null);
  // Resolver: override, disabled blocks fallback, unavailable explicit assignment stays unavailable.
  const modelRows = [assignment('idle', 7), assignment('walk', 7), assignment('run', 7)];
  const characterRows = [assignment('idle', 8), assignment('walk', null, 'disabled')];
  const effective = contracts.resolveAssignments(modelRows, characterRows, [active]);
  assert.equal(effective.find(row => row.actionKey === 'idle').state, 'unavailable');
  assert.equal(effective.find(row => row.actionKey === 'walk').state, 'disabled');
  assert.equal(effective.find(row => row.actionKey === 'run').source, 'model');
  assert.equal(effective.find(row => row.actionKey === 'dance').state, 'legacy');
  assert.equal(contracts.resolveAssignments(modelRows, [], [{ ...active, isActive: false }])[0].state, 'unavailable');
  const resolved = await request('animation-assignments', 'GET', 'target=character&targetId=11', null,
    [[{ id: 11, modelId: 5 }], [{ id: 5 }], modelRows, characterRows, [active]]);
  assert.equal(resolved.status, 200); assert.equal(queries.length, 5); queries.forEach(owned);
  assert.deepEqual(resolved.body.data.effective, plain(effective));
  assert.ok(JSON.stringify(queries[4].where).includes('[7,8]'), 'Clips fetched once as a batch');
  const modelResult = await request('animation-assignments', 'GET', 'target=model&targetId=5', null, [[{ id: 5 }], modelRows, [active]]);
  assert.equal(modelResult.status, 200); assert.equal(queries.length, 3);
  assert.deepEqual(modelResult.body.data.inherited, []); queries.forEach(owned);
  assert.equal((await request('animation-assignments', 'GET', 'target=character&targetId=11', null, [[]])).status, 404);
  const foreignModel = await request('animation-assignments', 'GET', 'target=character&targetId=11', null,
    [[{ id: 11, modelId: 999 }], [], []]);
  assert.deepEqual(foreignModel.body.data.inherited, [], 'No private assignments from another owner');
  assert.equal(queries.length, 3);
  const removed = await request('animation-assignments', 'DELETE', 'target=model&targetId=5&actionKey=idle', null, [[{ id: 5 }], []]);
  assert.equal(removed.body.data.mode, 'inherit'); owned(queries[1]);
  assert.equal(queries[1].input.name, 'threedModelAnimationAssignments');
  assert.equal((await request('animation-assignments', 'DELETE', 'target=character&targetId=11&actionKey=idle', null, [[{ id: 11, modelId: null }], []])).status, 200);
  assert.equal(queries[1].input.name, 'threedCharacterAnimationAssignments');
  for (const update of [{ id: 7 }, { id: 7, filePath: 'attacker' }, { id: 7, name: '' }, { id: 7, isActive: 'true' }]) {
    assert.equal((await request('animations', 'PATCH', '', update)).status, 400);
  }
  assert.equal((await request('animations', 'PATCH', '', { id: 7, name: ' Walk ', isActive: false }, [[{ id: 7 }]])).status, 200);
  owned(queries[0]); assert.equal(queries[0].set[0].name, 'Walk');
  assert.equal((await request('animations', 'PATCH', '', { id: 7, name: 'Walk' }, [[]])).status, 404);
  // Referenced deletion: both kinds of target protect a clip. Sources protect all registered clips.
  for (const results of [[[ { id: 7 } ], [{ id: 1 }], []], [[{ id: 7 }], [], [{ id: 2 }]]]) {
    assert.equal((await request('animations', 'DELETE', 'id=7', null, results)).status, 409);
    assert.equal(queries.some(query => query.operation === 'delete'), false);
    assert.deepEqual(queries[0].for, ['update']);
  }
  assert.equal((await request('animations', 'DELETE', 'id=7', null, [[{ id: 7 }], [], [], []])).status, 200);
  owned(queries[0]); owned(queries[3]);
  assert.equal((await request('animation-files', 'DELETE', 'id=2', null, [[{ id: 2 }], [{ id: 7 }]])).status, 409);
  assert.equal((await request('animation-files', 'DELETE', 'id=2', null, [[]])).status, 404);
  const deleted = await request('animation-files', 'DELETE', 'id=2', null, [[{ id: 2 }], [], []]);
  assert.equal(deleted.body.data.storageDeleted, false);
  const conflict = new Error('internal query'); conflict.cause = { code: '23503' };
  assert.equal((await request('animations', 'DELETE', 'id=7', null, [conflict])).status, 409);
  const failure = await request('animations', 'GET', '', null, [new Error('secret connection string')]);
  assert.equal(failure.status, 500); assert.ok(!JSON.stringify(failure).includes('secret'));
  for (const code of ['42P01', '42703']) {
    const missingSchema = new Error('secret SQL and connection details');
    missingSchema.cause = { cause: { code } };
    const response = await request('animations', 'GET', '', null, [missingSchema]);
    assert.equal(response.status, 503);
    assert.equal(response.body.code, 'ANIMATION_SCHEMA_NOT_READY');
    assert.match(response.body.error, /database setup is incomplete/);
    assert.ok(!JSON.stringify(response).includes('secret'));
  }
  // Inspect real Drizzle schema constraints without loading the DB client.
  const pg = require('drizzle-orm/pg-core');
  const realSchema = load('src/lib/schema/threed/index.ts', {
    'drizzle-orm/pg-core': pg, 'drizzle-orm': require('drizzle-orm'),
    '../auth': { user: pg.pgTable('user', { id: pg.text('id').primaryKey() }) },
    '../project': { project: pg.pgTable('project', { id: pg.serial('id').primaryKey() }) },
  });
  for (const key of ['threedAnimationFiles', 'threedAnimations', 'threedModelAnimationAssignments', 'threedCharacterAnimationAssignments']) {
    const config = pg.getTableConfig(realSchema[key]);
    assert.ok(config.columns.find(column => column.name === 'user_id').notNull);
    assert.ok(config.checks.length > 0);
    if (key === 'threedAnimationFiles' || key === 'threedAnimations') {
      assert.ok(config.uniqueConstraints.some(item => item.columns.map(c => c.name).join(',') === 'id,user_id'), 'Composite FK target exists as a table constraint before generated foreign keys');
    } assert.ok(config.indexes.some(index => index.config.unique));
    if (key.includes('Assignments')) {
      assert.ok(config.foreignKeys.some(fk => fk.reference().columns.map(c => c.name).join(',') === 'animation_id,user_id'));
      const checkSql = new pg.PgDialect().sqlToQuery(config.checks[0].value).sql;
      assert.ok(checkSql.includes("'assigned'") && checkSql.includes("'disabled'") && checkSql.includes('IS NOT NULL') && checkSql.includes('IS NULL'));
      const clipFk = config.foreignKeys.find(fk => fk.reference().columns.some(c => c.name === 'animation_id'));
      assert.equal(clipFk.onDelete, 'no action', 'Deleting a clip cannot cascade through its assignments');
      assert.ok(config.foreignKeys.some(fk => fk.onDelete === 'cascade' && fk.reference().columns.some(c => c.name === 'model_id' || c.name === 'character_id')));
    }
  }
  console.log('PASS: Animations Library auth, owner filters, bounded/batched reads, input validation, precedence, assignment upserts/removal, protected deletion, safe errors and real schema constraints (offline)');
})().catch(error => { console.error(error); process.exitCode = 1; });
