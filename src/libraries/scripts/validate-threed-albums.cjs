// Offline transaction adapter: no database connection or live SQL execution.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { PgDialect, pgTable, serial, getTableConfig } = require('drizzle-orm/pg-core');
const orm = require('drizzle-orm');
function load(file, modules = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText, { exports, require: name => name in modules ? modules[name] : require(name), Response, Request, URL, TextEncoder });
  return exports;
}
const registry = load('src/libraries/services/threed/multimedia/album-entity-registry.ts');
const contract = load('src/libraries/services/threed/multimedia/album-association-contract.ts', { './album-entity-registry': registry });
const dialect = new PgDialect();
let editor = true;
let state = [], owner = true, allowed = new Set([1, 2, 3]), fail = false, queue = Promise.resolve(), writes = 0;
const queries = [];
const db = {
  transaction(fn) {
    const run = queue.then(async () => {
      const before = structuredClone(state);
      try {
        return await fn({ execute: async query => {
          const { sql, params } = dialect.sqlToQuery(query);
          queries.push({ sql, params });
          if (sql.includes('FROM "user"')) {
            assert.match(sql, /role = 'super_admin' AND is_active = true AND is_deleted = false FOR SHARE/);
            return { rows: editor ? [{ id: 'owner' }] : [] };
          }
          if (sql.includes('FROM "learn_guides"')) {
            assert(!sql.includes('user_id')); assert.match(sql, /FOR (SHARE|UPDATE)/);
            return { rows: [{ id: 5, name: 'Shared guide' }] };
          }
          if (/SELECT id(?:, [\s\S]+?)? FROM "threed_[a-z_]+"/.test(sql)) {
            assert.equal(params[1], 'owner');
            assert.match(sql, /FOR (UPDATE|SHARE)/);
            return { rows: owner ? [{ id: 5, name: 'Farmer Kate' }] : [] };
          }
          if (/SELECT album_id/.test(sql)) return { rows: structuredClone(state) };
          if (/SELECT id FROM multimedia_albums/.test(sql)) {
            const scoped = sql.includes('user_id');
            if (scoped) assert.equal(params[0], 'owner');
            assert.match(sql, /ORDER BY id FOR SHARE/);
            return { rows: params.slice(scoped ? 1 : 0).filter(id => allowed.has(id)).map(id => ({ id })) };
          }
          if (/DELETE FROM/.test(sql)) {
            writes++;
            state = state.filter(item => !params.slice(2).includes(item.albumId));
            return { rows: [] };
          }
          if (/INSERT INTO/.test(sql)) {
            writes++;
            if (fail) throw Error('simulated write failure');
            const item = { albumId: params[2], sortOrder: params[3] };
            state = state.filter(old => old.albumId !== item.albumId).concat(item);
            return { rows: [] };
          }
          throw Error('Unexpected SQL: ' + sql);
        } });
      } catch (error) { state = before; throw error; }
    });
    queue = run.catch(() => {});
    return run;
  },
};
const service = load('src/libraries/services/threed/multimedia/album-associations.ts', {
  'server-only': {},
  '@/libraries/db/client': { db },
  './album-association-contract': contract,
  './album-entity-registry': registry,
});
const body = assignments => ({ expectedRevision: contract.albumRevision(state), assignments });
(async () => {
  for (const kind of Object.keys(registry.albumEntityTables)) {
    state = [];
    const id = kind === 'assembly' ? '6f060974-9878-4917-858f-e4e2cb726f46' : 5;
    const first = await service.readEntityAlbums('owner', kind, id);
    assert.equal(first.revision, contract.albumRevision([]));
    await service.saveEntityAlbums('owner', kind, id, body([{ albumId: 1 }]));
    assert.equal(state[0].sortOrder, 0);
  }
  assert(!Object.hasOwn(registry.albumEntityTables, 'learn'));
  assert.throws(() => contract.parseAlbumEntityId('assembly', 5));
  assert.throws(() => contract.parseAlbumEntityId('model', '6f060974-9878-4917-858f-e4e2cb726f46'));
  assert.equal(contract.parseAlbumEntityId('assembly', '6F060974-9878-4917-858F-E4E2CB726F46'), '6f060974-9878-4917-858f-e4e2cb726f46');
  owner = false;
  await assert.rejects(service.readEntityAlbums('owner', 'model', 5), e => e.status === 404);
  await assert.rejects(service.saveEntityAlbums('owner', 'model', 5, body([])), e => e.status === 404);
  owner = true;
  const count = writes;
  await assert.rejects(service.saveEntityAlbums('owner', 'model', 5, body([{ albumId: 99 }])), e => e.status === 404);
  assert.equal(writes, count);
  for (const assignments of [[{ albumId: 1 }, { albumId: 1 }], [{ albumId: 1, sortOrder: 10001 }], [{ albumId: 1, url: 'bad' }], Array.from({ length: 101 }, (_, i) => ({ albumId: i + 1 }))]) {
    await assert.rejects(service.saveEntityAlbums('owner', 'model', 5, body(assignments)));
  }
  const expected = contract.albumRevision(state);
  const replies = await Promise.allSettled([
    service.saveEntityAlbums('owner', 'model', 5, { expectedRevision: expected, assignments: [{ albumId: 2 }] }),
    service.saveEntityAlbums('owner', 'model', 5, { expectedRevision: expected, assignments: [{ albumId: 3 }] }),
  ]);
  assert.equal(replies.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(replies.find(r => r.status === 'rejected').reason.status, 409);
  const saved = structuredClone(state);
  fail = true;
  await assert.rejects(service.saveEntityAlbums('owner', 'model', 5, body([{ albumId: 1 }])));
  assert.deepEqual(state, saved, 'Failed replacement rolls deletion back');
  fail = false;
  const beforeNoop = writes;
  await service.saveEntityAlbums('owner', 'model', 5, body(state));
  assert.equal(writes, beforeNoop, 'No-op save retains rows and timestamps');
  let session = null;
  const route = load('src/libraries/services/threed/multimedia/album-association-route.ts', {
    '@/libraries/auth': { auth: async () => session },
    './album-associations': service,
    './album-association-contract': contract,
  }).createAlbumAssociationHandlers('model');
  const context = { params: Promise.resolve({ id: '5' }) };
  const request = (payload, origin = 'https://app.test') => new Request('https://app.test/api/threed/models/5/albums', {
    method: 'PUT',
    headers: { origin },
    body: JSON.stringify(payload),
  });
  assert.equal((await route.GET(request({}), context)).status, 401);
  session = { user: { id: 'owner' } };
  assert.equal((await route.PUT(request(body([]), 'https://elsewhere.test'), context)).status, 403);
  assert.equal((await route.PUT(request({ unexpected: true }), context)).status, 400);
  assert.equal((await route.PUT(request('x'.repeat(17_000)), context)).status, 413);
  const response = await route.GET(request({}), context);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  assert.equal((await route.PUT(request(body([])), context)).status, 200);
  assert.equal(state.length, 0);
  const schema = load('src/libraries/schema/threed/album-associations.ts', {
    '../multimedia': { multimediaAlbums: pgTable('multimedia_albums', { id: serial('id').primaryKey() }) },
  });
  const table = getTableConfig(schema.threedMultimediaAlbums);
  assert.equal(table.foreignKeys.length, 1);
  assert.equal(table.foreignKeys[0].onDelete, 'cascade');
  assert.equal(table.indexes.length, 2);
  assert.equal(table.checks.length, 3);
  const migration = fs.readFileSync('docs/developers/sql/threed-albums.sql', 'utf8');
  assert.equal((migration.match(/CREATE TABLE /g) || []).length, 1);
  for (const [kind, entity] of Object.entries(registry.albumEntityTables)) {
    const applied = migration;
    assert(applied.includes('AFTER DELETE ON public.' + entity));
    assert(applied.includes("cleanup_threed_multimedia_albums('" + kind + "')"));
  }
  for (const query of queries.filter(q => /FROM "threed_multimedia_albums"/.test(q.sql))) {
    const match = query.sql.match(/module_type = \$(\d+) AND entity_id = \$(\d+)/);
    assert(match);
    assert(Object.hasOwn(registry.albumEntityTables, query.params[Number(match[1]) - 1]));
  }
  const pg = require('drizzle-orm/pg-core');
  const columns = () => ({ name: pg.text('name'), id: pg.integer('id'), userId: pg.text('user_id'), projectId: pg.integer('project_id'), moduleId: pg.integer('module_id'), multimediaId: pg.integer('multimedia_id'), assetId: pg.integer('asset_id'), moduleType: pg.text('module_type'), assetType: pg.text('asset_type'), isActive: pg.boolean('is_active'), isPublic: pg.boolean('is_public'), status: pg.text('status'), title: pg.text('title'), artist: pg.text('artist'), sortOrder: pg.integer('sort_order') });
  const projectSchema = { projectAssets: pgTable('project_assets', columns()), projectMultimedia: pgTable('project_multimedia', columns()) };
  const multimediaSchema = { multimedia: pgTable('multimedia', columns()), multimediaAlbums: pgTable('multimedia_albums', columns()) };
  let accessible = true, viewer = undefined, condition, joins = [], selected;
  const chain = { from() { return chain; }, innerJoin(table, predicate) { joins.push(dialect.sqlToQuery(predicate)); return chain; }, where(value) { condition = value ? dialect.sqlToQuery(value) : null; return chain; }, orderBy() { return chain; }, limit(n) { assert.equal(n, 51); return chain; }, async offset(n) { assert.equal(n, 0); return Array.from({length:51}, (_,i)=>({id:i+1,title:'Album',artist:'Artist',sortOrder:0})); } };
  const projectRoute = load('src/app/api/project/multimedia-albums/route.ts', {
    '@/libraries/auth': { auth: async () => viewer ? { user: { id: viewer } } : null },
    '@/libraries/db/client': { db: { selectDistinct(fields) { selected = fields; joins = []; return chain; } } },
    '@/libraries/services/project/read-access': { readableProject: async () => accessible ? { id: 8, userId: 'owner' } : null },
    '@/libraries/schema/project': projectSchema,
    '@/libraries/schema/multimedia': multimediaSchema,
  });
  let result = await projectRoute.GET(new Request('https://app.test/api/project/multimedia-albums?projectId=8'));
  assert.equal(result.status, 200);
  const data = await result.json(); assert.equal(data.albums.length,50); assert.equal(data.hasMore,true);
  assert.deepEqual(Object.keys(selected).sort(), ['artist','id','sortOrder','title']);
  assert(condition.params.includes('published') && condition.params.includes(true));
  assert(condition.params.includes('multimedia_albums') && condition.params.includes('multimedia'));
  assert(joins.every(join => join.params.includes('owner')));
  viewer = 'owner';
  await projectRoute.GET(new Request('https://app.test/api/project/multimedia-albums?projectId=8'));
  assert(!condition.params.includes('published'));
  accessible = false;
  assert.equal((await projectRoute.GET(new Request('https://app.test/api/project/multimedia-albums?projectId=8'))).status,404);
  assert.equal((await projectRoute.GET(new Request('https://app.test/api/project/multimedia-albums?projectId=-1'))).status,400);
  const optionsRoute = load('src/app/api/threed/album-associations/options/route.ts', {
    '@/libraries/auth': { auth: async () => viewer ? { user: { id: viewer } } : null },
    '@/libraries/db/client': { db: {
      select(fields) { selected = fields; joins = []; return chain; },
      async execute(query) { const compiled = dialect.sqlToQuery(query); assert(compiled.sql.includes('FROM "threed_characters" e')); assert(compiled.params.includes('owner')); assert(compiled.sql.includes('e.user_id =')); return { rows: [{id:12,title:'Farmer Kate'}] }; },
    } },
    '@/libraries/services/threed/multimedia/album-association-contract': contract,
    '@/libraries/services/threed/multimedia/album-entity-registry': registry,
    '@/libraries/schema/project': { ...projectSchema, project: pgTable('project', columns()) },
    '@/libraries/schema/multimedia': multimediaSchema,
  });
  viewer = undefined;
  assert.equal((await optionsRoute.GET(new Request('https://app.test/options'))).status,401);
  viewer = 'owner';
  assert.equal((await optionsRoute.GET(new Request('https://app.test/options?scope=albums'))).status,200);
  assert(condition.params.includes('owner'));
  assert.equal((await optionsRoute.GET(new Request('https://app.test/options?scope=albums&moduleType=learn'))).status,400);
  assert(condition.params.includes('owner'));
  assert.deepEqual(Object.keys(selected).sort(), ['id','status','title']);
  assert.equal((await optionsRoute.GET(new Request('https://app.test/options?scope=projects'))).status,200);
  assert(condition.params.includes('owner') && condition.params.includes(true));
  assert(joins.every(join=>join.params.includes('owner') && join.params.includes(true)));
  assert.equal((await optionsRoute.GET(new Request('https://app.test/options?scope=entities&moduleType=character'))).status,200);
  assert.equal((await optionsRoute.GET(new Request('https://app.test/options?scope=entities&moduleType=unknown'))).status,400);
  assert.equal((await optionsRoute.GET(new Request('https://app.test/options?offset=1000001'))).status,400);
  console.log('PASS ThreeD Albums: all entity adapters, owner/Album guards, strict bounds, serialized stale writes, rollback, unchanged-row preservation and additive schema (mock persistence only).');
})().catch(error => { console.error(error); process.exitCode = 1; });
