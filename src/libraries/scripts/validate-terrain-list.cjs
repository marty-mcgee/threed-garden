const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(path, dependencies) {
  const exports = {};
  const { outputText } = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  vm.runInNewContext(outputText, {
    exports,
    require(name) {
      assert(name in dependencies, `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  });
  return exports;
}

const sortOrder = load('src/libraries/services/threed/list-sort-order.ts', {});
const threedTerrains = { id: 'id', name: 'name', userId: 'userId', sortOrder: 'sortOrder', isActive: 'isActive', updatedAt: 'updatedAt' };
let owner = 'terrain-owner';
const database = {};
const route = load('src/app/api/threed/terrains/route.ts', {
  'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } },
  'drizzle-orm': {
    eq: (field, value) => ({ eq: [field, value] }),
    and: (...terms) => ({ and: terms }),
    ilike: (field, pattern) => ({ ilike: [field, pattern] }),
    inArray: (field, values) => ({ inArray: [field, values] }),
    asc: field => ({ asc: field }),
    desc: field => ({ desc: field }),
    sql: (strings, ...values) => ({ text: strings.join('?'), values }),
  },
  '@/libraries/auth': { auth: async () => owner ? { user: { id: owner } } : null },
  '@/libraries/db/client': { db: database },
  '@/libraries/schema/project': {},
  '@/libraries/schema/threed': { threedTerrains },
  '@/libraries/services/threed/terrains/terrain-core': { TerrainInputError: class extends Error {} },
  '@/libraries/services/threed/list-sort-order': sortOrder,
});

function fixture(reads, writeFailure) {
  const ops = [];
  const record = (name, value) => ops.push([name, value]);
  const query = result => {
    const chain = {
      from: () => chain,
      where: filter => { record('where', filter); return chain; },
      orderBy: (...order) => { record('order', order); return chain; },
      limit: limit => { record('limit', limit); return chain; },
      offset: () => chain,
      for: lock => { record('lock', lock); return chain; },
      then: (resolve, reject) => (result instanceof Error ? Promise.reject(result) : Promise.resolve(result)).then(resolve, reject),
    };
    return chain;
  };
  const tx = {
    select: fields => {
      record('select', Object.keys(fields));
      assert(reads.length, 'Unexpected select');
      return query(reads.shift());
    },
    update: () => ({ set: changes => { record('update', changes); return query(writeFailure ?? []); } }),
    execute: async statement => {
      record('execute', statement);
      if (writeFailure) throw writeFailure;
    },
    $with: () => ({ as: () => threedTerrains }),
    with: () => tx,
  };
  Object.assign(database, tx, {
    transaction: async fn => {
      const result = await fn(tx);
      record('commit');
      return result;
    },
  });
  return {
    values: name => JSON.parse(JSON.stringify(ops.filter(op => op[0] === name).map(op => op[1]))),
    done: () => assert.equal(reads.length, 0),
  };
}

const list = query => route.GET({ nextUrl: new URL(`https://fixture.invalid/?${query}`) });
const patch = input => route.PATCH({ text: async () => JSON.stringify(input) });
const record = { id: 2, name: 'Hills', revision: 1, sortOrder: 0, isActive: true };
const missingColumns = Object.assign(Error('column threed_terrains.sort_order does not exist'), { code: '42703' });

(async () => {
  owner = null;
  assert.equal((await route.PATCH({ text: () => assert.fail('Unauthenticated request body was read') })).status, 401);
  owner = 'terrain-owner';

  const picker = fixture([[record]]);
  assert.equal((await list('')).body.data.length, 1);
  assert.deepEqual(picker.values('select'), [['id', 'name', 'updatedAt', 'revision']]);
  picker.done();
  assert.equal((await list('paged=1&sortBy=userId')).status, 400);
  const paged = fixture([[record], [{ count: 1 }]]);
  assert.equal((await list('paged=1&sortBy=isActive&sortDir=desc')).body.data.items[0].isActive, true);
  assert.deepEqual(paged.values('order')[0], [{ desc: 'isActive' }, { asc: 'name' }, { asc: 'id' }]);
  assert.deepEqual(paged.values('where')[0], { eq: ['userId', owner] });
  const legacy = fixture([missingColumns, [{ ...record, sortOrder: null, isActive: null }], [{ count: 1 }]]);
  assert.equal((await list('paged=1&sortBy=sortOrder&sortDir=asc')).body.data.items[0].sortOrder, null);
  assert.deepEqual(legacy.values('order')[1], [{ asc: 'name' }, { asc: 'id' }]);

  const edit = { action: 'set', ids: [1, 2], isActive: false };
  const allowed = fixture([[{ id: 1 }, { id: 2 }]]);
  assert.equal((await patch(edit)).body.data.updated, 2);
  assert.deepEqual(allowed.values('update'), [{ isActive: false }]);
  assert.deepEqual(allowed.values('where'), Array(2).fill({ and: [{ eq: ['userId', owner] }, { inArray: ['id', [1, 2]] }] }));
  assert.deepEqual(allowed.values('lock'), ['update']);
  const foreign = fixture([[{ id: 1 }]]);
  assert.equal((await patch(edit)).status, 404);
  assert.deepEqual(foreign.values('update'), []);
  assert.deepEqual(foreign.values('commit'), []);
  assert.equal((await patch({ ...edit, ids: [1, '2'] })).status, 400);
  assert.equal((await patch({ ...edit, ids: [1, 1] })).status, 400);
  assert.equal((await patch({ ...edit, isActive: 'false' })).status, 400);
  assert.equal((await patch({ ...edit, sortOrder: 1.5 })).status, 400);
  const missing = fixture([[{ id: 1 }, { id: 2 }]], missingColumns);
  assert.equal((await patch(edit)).status, 503);
  assert.deepEqual(missing.values('commit'), []);

  const move = { action: 'move', sourceId: 2, targetId: 1, after: false };
  const rows = [{ id: 1, sortOrder: 0 }, { id: 2, sortOrder: 0 }];
  const reorder = fixture([[], rows]);
  assert.equal((await patch(move)).body.data.updated, 1);
  assert.deepEqual(reorder.values('lock'), ['update']);
  assert.deepEqual(reorder.values('where')[0], { eq: ['userId', owner] });
  const [rewrite] = reorder.values('execute');
  assert.match(rewrite.text, /AS ranks\(id integer, sort_order integer\)/);
  assert.deepEqual(JSON.parse(rewrite.values[1]), [{ id: 1, sort_order: 1 }]);
  assert.deepEqual(rewrite.values.at(-1), { eq: ['userId', owner] });
  const retry = fixture([[], rows]);
  assert.equal((await patch({ ...move, after: true })).body.data.updated, 0);
  assert.deepEqual(retry.values('execute'), []);
  const rejected = fixture([[], [rows[0]]]);
  assert.equal((await patch(move)).status, 404);
  assert.deepEqual(rejected.values('execute'), []);
  const failed = fixture([[], rows], Error('mock update failure'));
  assert.equal((await patch(move)).status, 500);
  assert.deepEqual(failed.values('commit'), []);
  console.log('PASS: Terrain list compatibility, owner-only Bulk Edit, atomic ordering, input guards, and rollback.');
})().catch(error => { console.error(error); process.exitCode = 1; });
