// Exercise the actual PATCH handler and catalog SQL. SQLite is a local transaction fixture.
const assert = require('node:assert/strict');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { drizzle } = require('drizzle-orm/pg-proxy');
const { getTableColumns, getTableName } = require('drizzle-orm');
const { build } = require('esbuild');

async function main() {
  const memory = new DatabaseSync(':memory:');
  const stamp = '2026-01-01T00:00:00.000Z';
  let viewer = 'owner';
  let failAfterWrite = false;
  const queries = [];
  const driver = drizzle(async (statement, params) => {
    queries.push(statement);
    const query = memory.prepare(statement.replace(/ for update$/i, ''));
    query.setReturnArrays(true);
    const bindings = Object.fromEntries(params.map((value, index) => [
      '$' + (index + 1),
      typeof value === 'boolean' ? Number(value) : value,
    ]));
    const columns = query.columns();
    const rows = query.all(bindings).map(row => row.map((value, index) =>
      columns[index].name === 'updated_at' && value !== null ? new Date(value) : value));
    if (failAfterWrite && /^update /i.test(statement)) throw Error('simulated storage failure');
    return { rows };
  });
  driver.transaction = async operation => {
    memory.exec('begin');
    try {
      const result = await operation(driver);
      memory.exec('commit');
      return result;
    } catch (error) {
      memory.exec('rollback');
      throw error;
    }
  };
  // The server adapters for Definitions, Model Files and Category renames have separate transaction fixtures.
  const mocks = {
    'next/server': 'export const NextResponse = Response;',
    '@/libraries/auth': 'export const auth = () => globalThis.__catalogFixture.session();',
    '@/libraries/db/client': 'export const db = globalThis.__catalogFixture.driver;',
    '@/libraries/services/threed/bulk-edit/definitions': 'export const updateBulkDefinitions = () => { throw Error("Unexpected Definition write"); };',
    '@/libraries/services/threed/bulk-edit/model-files': 'export const updateBulkModelFiles = () => { throw Error("Unexpected File write"); };',
    '@/libraries/services/threed/bulk-edit/animation-categories': 'export const renameBulkAnimationCategories = () => { throw Error("Unexpected Category write"); };',
  };
  globalThis.__catalogFixture = { driver, session: () => viewer ? { user: { id: viewer } } : null };
  try {
    const result = await build({
      stdin: {
        contents: [
          "export { PATCH } from './src/app/api/threed/bulk-edit/[resource]/route';",
          "export { catalogBulkFields } from './src/libraries/services/threed/bulk-edit/fields';",
          "export * as schema from './src/libraries/schema/threed';",
        ].join('\n'),
        resolveDir: process.cwd(),
      },
      bundle: true,
      write: false,
      platform: 'node',
      packages: 'external',
      format: 'cjs',
      plugins: [{ name: 'offline-catalog', setup(builder) {
        builder.onResolve({ filter: /^(next\/server|@\/libraries\/)/ }, args =>
          Object.hasOwn(mocks, args.path) ? { path: args.path, namespace: 'fixture' } : undefined);
        builder.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: mocks[args.path] }));
      } }],
    });
    const compiled = new module.constructor('catalog-bulk-api-fixture', module);
    compiled.paths = module.paths;
    compiled._compile(result.outputFiles[0].text, path.resolve('catalog-bulk-api-fixture.cjs'));
    const { PATCH, catalogBulkFields, schema } = compiled.exports;
    const tables = {
      plants: schema.threedPlants,
      plantings: schema.threedPlantings,
      beds: schema.threedBeds,
      farmbots: schema.threedFarmbots,
      layers: schema.threedLayers,
      models: schema.threedModels,
      characters: schema.threedCharacters,
      'model-categories': schema.threedModelCategories,
      'model-textures': schema.threedModelTextures,
      animations: schema.threedAnimations,
      'animation-slots': schema.threedAnimationActionSlots,
    };
    const selected = id => ({ id, expectedUpdatedAt: stamp });
    const body = (changes, selection = [selected(1), selected(2)]) => ({ action: 'set', changes, selection });
    async function patch(resource, value, search = '', origin = 'http://fixture') {
      const url = new URL('http://fixture/api/threed/bulk-edit/' + resource + search);
      const res = await PATCH({ nextUrl: url, headers: new Headers({ origin }), text: async () => typeof value === 'string' ? value : JSON.stringify(value) },
        { params: Promise.resolve({ resource }) });
      return { status: res.status, result: await res.json() };
    }
    for (const [resource, schemaTable] of Object.entries(tables)) {
      const fields = catalogBulkFields[resource];
      const columns = getTableColumns(schemaTable);
      const table = getTableName(schemaTable);
      const definitions = fields.map(field => {
        assert(columns[field.key], resource + '.' + field.key);
        if (field.kind === 'choice') assert.deepEqual(field.options.map(option => option.value), columns[field.key].enumValues);
        const sqlType = field.kind === 'integer' ? 'integer default 0' : field.kind === 'boolean' ? 'integer' : 'text';
        return columns[field.key].name + ' ' + sqlType;
      });
      memory.exec('create table ' + table + ' (id integer primary key, user_id text, updated_at text, retained text, ' + definitions.join(', ') + ')');
      const insert = memory.prepare('insert into ' + table + ' (id,user_id,updated_at,retained) values (?,?,?,?)');
      for (const [id, owner] of [[1, 'owner'], [2, 'owner'], [3, 'other'], [4, 'owner']]) insert.run(id, owner, stamp, 'keep');
      const change = Object.fromEntries(fields.map(field => [
        field.key,
        field.kind === 'boolean' ? false : field.kind === 'integer' ? -5 : field.options[0].value,
      ]));
      const pick = id => resource === 'plantings' ? { ...selected(id), expectedSortOrder: 0 } : selected(id);
      const update = body(change, [pick(1), pick(2)]);
      assert.equal((await patch(resource, body(change, [pick(1), pick(3)]))).status, 404);
      assert.equal((await patch(resource, body(change, [pick(1), { ...pick(2), expectedUpdatedAt: null }]))).status, 409);
      if (resource === 'plantings') {
        memory.exec('update threed_plantings set sort_order=7 where id=2');
        assert.equal((await patch(resource, update)).status, 409, 'Dragging after selection invalidates a bulk rank edit');
        memory.exec('update threed_plantings set sort_order=0 where id=2');
      }
      failAfterWrite = true;
      assert.equal((await patch(resource, update)).status, 500);
      failAfterWrite = false;
      assert.equal(memory.prepare('select count(*) n from ' + table + ' where updated_at=?').get(stamp).n, 4, 'Rollback for ' + resource);
      queries.length = 0;
      const success = await patch(resource, update);
      assert.deepEqual(success, { status: 200, result: { success: true, data: { updated: 2 } } });
      assert.match(queries[0], /order by .*"id" asc for update$/i);
      const after = memory.prepare('select * from ' + table + ' order by id').all();
      for (const row of after) {
        assert.equal(row.retained, 'keep');
        assert.equal(row.id > 2, row.updated_at === stamp);
        for (const [key, value] of Object.entries(change)) {
          const initial = key === 'sortOrder' ? 0 : null;
          assert.equal(row[columns[key].name], row.id > 2 ? initial : typeof value === 'boolean' ? Number(value) : value);
        }
      }
      assert.equal((await patch(resource, update)).status, 409, 'Old selection cannot be replayed');
      if (resource === 'plants') {
        const refreshed = [{ id: 1, expectedUpdatedAt: new Date(after[0].updated_at).toISOString() }];
        assert.equal((await patch(resource, body({ isActive: true }, refreshed))).status, 200);
        const plant = memory.prepare('select * from threed_plants where id=1').get();
        assert.equal(plant.is_active, 1);
        assert.equal(plant.status, after[0].status);
        assert.equal(plant.type, after[0].type);
      }
    }
    viewer = null;
    assert.equal((await patch('plants', body({ isActive: true }))).status, 401);
    viewer = 'owner';
    assert.equal((await patch('plants', body({ isActive: true }), '', 'https://other.invalid')).status, 403);
    for (const resource of ['simulation-results', 'designs', '__proto__', 'unknown']) {
      assert.equal((await patch(resource, body({ isActive: true }))).status, 404);
    }
    queries.length = 0;
    for (const value of [
      'bad json', body({}), body({ isActive: 'false' }), body({ userId: 'someone' }), body({ status: 'unrecognized' }),
      body({ isActive: true }, [selected(1), selected(1)]), body({ isActive: true }, []),
      body({ isActive: true }, Array.from({ length: 201 }, (_, index) => selected(index + 1))),
    ]) assert.equal((await patch('plants', value)).status, 400);
    assert.equal((await patch('plants', body({ isActive: true }), '?projectId=1')).status, 400);
    assert.equal((await patch('simulations', body({ isActive: true }))).status, 400, 'Revision required');
    assert.equal((await patch('model-files', body({ loadOrder: 0 }))).status, 400, 'Parent identity required');
    assert.equal((await patch('animation-categories', body({ names: { 3: 'Other' } }))).status, 400);
    assert.deepEqual(queries, []);
    console.log('PASS: 11 catalog adapters, schema enum parity, opt-in writes, foreign/stale selection, rollback, signed-out denial and specialized request guards (offline).');
  } finally {
    delete globalThis.__catalogFixture;
    memory.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
