const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// Stateful offline persistence boundary. Actual route/authority code executes;
// transactions publish a private copy only on success. Locks are recorded, not
// a substitute for PostgreSQL concurrency testing.
const makeTable = (name, keys) => Object.assign({ name }, Object.fromEntries(keys.map(key => [key, { table: name, key }])));
const common = ['id', 'userId', 'albumId', 'trackId', 'title', 'status', 'createdAt', 'updatedAt'];
const albums = makeTable('albums', [...common, 'isPublic', 'sortOrder']);
const tracks = makeTable('tracks', [...common, 'trackNumber', 'fileUrl', 'fileType']);
const links = makeTable('links', [...common, 'displayOrder']);
const media = makeTable('media', [...common, 'fileName', 'fileUrl', 'fileType', 'fileSize', 'isPrimary']);
const tables = { multimediaAlbums: albums, multimediaTracks: tracks, multimediaLinks: links, multimediaMedia: media, multimediaSpeechVersions: makeTable('versions', common) };
const op = kind => (...args) => ({ kind, args });
const orm = { eq: op('eq'), ne: op('ne'), and: op('and'), or: op('or'), isNull: op('isNull'), isNotNull: op('isNotNull'), inArray: op('inArray'), asc: op('asc'), desc: op('desc'), sql: op('sql') };
const value = (item, row) => item && typeof item === 'object' && item.key ? row[item.key] : item;
function matches(expr, row) {
  if (!expr) return true;
  const [a, b] = expr.args;
  const left = value(a, row), right = value(b, row);
  switch (expr.kind) {
    case 'eq': return left == null || right == null ? null : left === right;
    case 'ne': return left == null || right == null ? null : left !== right;
    case 'isNull': return left == null;
    case 'isNotNull': return left != null;
    case 'inArray': return b.includes(left);
    case 'and': { const values = expr.args.filter(Boolean).map(e => matches(e, row)); return values.includes(false) ? false : values.includes(null) ? null : true; }
    case 'or': { const values = expr.args.filter(Boolean).map(e => matches(e, row)); return values.includes(true) ? true : values.includes(null) ? null : false; }
    default: throw Error(`Unexpected expression ${expr.kind}`);
  }
}
let state, events, userId = 'alice', failWriteAt, writeCount, beforeTransaction;
function connection(data, transactional) {
  function select(projection) {
    let table, scope, cap = Infinity, order = [], lock;
    const query = {
      from(v) { table = v; return query; }, where(v) { scope = v; return query; },
      limit(v) { cap = v; return query; }, orderBy(...v) { order = v; return query; },
      for(v) { assert.ok(transactional, 'Locks must be held in the mutation transaction'); lock = v; return query; },
      then(resolve, reject) { return Promise.resolve().then(() => {
        let rows = data[table.name].filter(row => matches(scope, row) === true);
        for (const spec of [...order].reverse()) rows.sort((a, b) => (value(spec.args[0], a) - value(spec.args[0], b)) * (spec.kind === 'desc' ? -1 : 1));
        rows = rows.slice(0, cap);
        events.push({ type: 'read', table: table.name, lock, ids: rows.map(row => row.id), transactional });
        return rows.map(row => projection ? Object.fromEntries(Object.entries(projection).map(([key, field]) => [key, value(field, row)])) : { ...row });
      }).then(resolve, reject); },
    };
    return query;
  }
  function write(table, patch, scope, insert) {
    assert.ok(transactional, 'Content writes must use the same transaction as checks');
    if (++writeCount === failWriteAt) throw Error('Injected final-write failure');
    events.push({ type: 'write', table: table.name, patch, transactional });
    if (insert) {
      const row = { id: Math.max(0, ...data[table.name].map(row => row.id)) + 1, ...patch };
      data[table.name].push(row); return [{ ...row }];
    }
    return data[table.name].filter(row => matches(scope, row) === true).map(row => { Object.assign(row, patch); return { ...row }; });
  }
  return {
    select,
    update(table) { return { set(patch) { return { where(scope) {
      return { returning: async () => write(table, patch, scope, false), then: (resolve, reject) => Promise.resolve().then(() => write(table, patch, scope, false)).then(resolve, reject) };
    } }; } }; },
    insert(table) { return { values(patch) { return { returning: async () => write(table, patch, null, true) }; } }; },
  };
}
const db = {
  select: (...args) => connection(state, false).select(...args),
  async transaction(fn) {
    if (beforeTransaction) { const hook = beforeTransaction; beforeTransaction = null; hook(); }
    const copy = structuredClone(state);
    events.push({ type: 'begin' });
    try { const result = await fn(connection(copy, true)); state = copy; events.push({ type: 'commit' }); return result; }
    catch (error) { events.push({ type: 'rollback' }); throw error; }
  },
};
const mocks = {
  'next/server': { NextResponse: { json: (body, options = {}) => ({ body, status: options.status ?? 200 }) } },
  '@/libraries/auth': { auth: async () => userId ? { user: { id: userId } } : null },
  '@/libraries/db/client': { db }, '@/libraries/schema/multimedia': tables,
  '@/libraries/db/sequence': { ensureTableSequence: async () => {} },
  'drizzle-orm': orm,
  '@aws-sdk/client-s3': { S3Client: class {}, DeleteObjectCommand: class {} },
};
function load(file) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, URL, Date, process: { env: {} }, console: { log() {}, error() {} }, require: name => { assert.ok(name in mocks, name); return mocks[name]; } });
  return exports;
}
const policy = load('src/libraries/services/multimedia/upload-policy.ts');
mocks['./upload-policy'] = policy; mocks['@/libraries/services/multimedia/upload-policy'] = policy;
const access = load('src/libraries/services/multimedia/access.ts'); mocks['./access'] = access; mocks['@/libraries/services/multimedia/access'] = access;
mocks['@/libraries/services/multimedia/authority'] = load('src/libraries/services/multimedia/authority.ts');
const trackRoute = load('src/app/api/multimedia/tracks/route.ts');
const linkRoute = load('src/app/api/multimedia/links/route.ts');
const mediaRoute = load('src/app/api/multimedia/media/route.ts');
const request = (id, body) => ({ url: `https://app.invalid/api/multimedia/media?id=${id}`, json: async () => body });
function reset() {
  state = {
    albums: [{ id: 1, userId: 'alice' }, { id: 2, userId: 'alice' }, { id: 3, userId: 'bob' }],
    tracks: [{ id: 10, userId: 'alice', albumId: 1, title: 'Track', trackNumber: 0 }],
    links: [],
    media: [
      { id: 10, userId: 'alice', albumId: 1, fileName: 'Source', isPrimary: true, metadata: { retained: true } },
      { id: 20, userId: 'alice', albumId: 2, fileName: 'Destination', isPrimary: true },
      { id: 30, userId: 'bob', albumId: 3, fileName: 'Other owner', isPrimary: true },
    ], versions: [],
  };
  events = []; userId = 'alice'; failWriteAt = Infinity; writeCount = 0; beforeTransaction = null;
}
function assertNoWrites() { assert.equal(writeCount, 0); }
function assertTrackLock(mode) { assert.ok(events.some(e => e.table === 'tracks' && e.lock === mode && e.ids.includes(10))); }

(async () => {
  for (const link of [
    { userId: 'alice', albumId: 1 }, { userId: 'bob', albumId: null }, { userId: null, albumId: null },
  ]) {
    reset(); state.links.push({ id: 7, trackId: 10, ...link }); const before = structuredClone(state);
    const response = await trackRoute.PUT(request(10, { albumId: 2, title: 'Should not save' }));
    assert.equal(response.status, 409); assert.deepEqual(state, before); assertNoWrites(); assertTrackLock('update');
  }
  for (const albumId of [null, 2]) {
    reset(); state.links.push({ id: 7, trackId: 10, userId: 'alice', albumId });
    assert.equal((await trackRoute.PUT(request(10, { albumId: 2 }))).status, 200);
    assert.equal(state.tracks[0].albumId, 2); assert.equal(state.tracks[0].trackNumber, 0); assert.equal(state.links[0].albumId, albumId);
  }
  reset(); assert.equal((await trackRoute.PUT(request(10, { albumId: 3 }))).status, 404); assertNoWrites();
  reset(); userId = 'bob'; assert.equal((await trackRoute.PUT(request(10, { albumId: 3 }))).status, 404); assertNoWrites();
  reset(); state.links.push({ id: 7, trackId: 10, userId: 'alice', albumId: 1 });
  assert.equal((await trackRoute.PUT(request(10, { title: 'Renamed', albumId: 1 }))).status, 200);
  assert.equal(state.tracks[0].title, 'Renamed');
  assert.equal((await linkRoute.PUT(request(7, { albumId: null }))).status, 200); assertTrackLock('share');
  assert.equal((await trackRoute.PUT(request(10, { albumId: 2 }))).status, 200);
  assert.equal((await linkRoute.POST(request('', { title: 'Stale parent', url: 'https://example.invalid', albumId: 1, trackId: 10 }))).status, 400);
  assert.equal((await linkRoute.POST(request('', { title: 'Current parent', url: 'https://example.invalid', albumId: 2, trackId: 10 }))).status, 200);
  assertTrackLock('share');

  reset(); assert.equal((await mediaRoute.PUT(request(10, { albumId: 2 }))).status, 200);
  assert.equal(state.media[0].albumId, 2); assert.equal(state.media[0].isPrimary, true);
  assert.equal(state.media[1].isPrimary, false); assert.equal(state.media[2].isPrimary, true);
  assert.deepEqual(state.media[0].metadata, { retained: true });
  const locks = events.filter(e => e.lock);
  assert.deepEqual(locks.map(e => [e.table, e.lock, e.ids]), [['albums', 'update', [1, 2]], ['media', 'update', [10]]]);
  reset(); assert.equal((await mediaRoute.PUT(request(20, { albumId: 1 }))).status, 200);
  assert.deepEqual(events.find(e => e.lock && e.table === 'albums').ids, [1, 2]);
  for (const patch of [{ albumId: 2, isPrimary: false }, { title: 'Ignored', isPrimary: false }]) {
    reset(); assert.equal((await mediaRoute.PUT(request(10, patch))).status, 200);
    assert.equal(state.media[0].isPrimary, false); assert.equal(state.media[1].isPrimary, true);
  }
  reset(); state.media[0].isPrimary = false;
  assert.equal((await mediaRoute.PUT(request(10, { albumId: 2 }))).status, 200); assert.equal(state.media[1].isPrimary, true);
  reset(); assert.equal((await mediaRoute.PUT(request(10, { fileName: 'Renamed' }))).status, 200);
  assert.equal(writeCount, 1); assert.equal(state.media[0].isPrimary, true);
  reset(); const before = structuredClone(state); failWriteAt = 2;
  assert.equal((await mediaRoute.PUT(request(10, { albumId: 2 }))).status, 500);
  assert.deepEqual(state, before); assert.equal(events.at(-1).type, 'rollback');
  reset(); assert.equal((await mediaRoute.PUT(request(10, { albumId: 3 }))).status, 404); assertNoWrites();
  reset(); userId = 'bob'; assert.equal((await mediaRoute.PUT(request(10, { isPrimary: true }))).status, 404); assertNoWrites();
  reset(); beforeTransaction = () => { state.media[0].albumId = 2; };
  assert.equal((await mediaRoute.PUT(request(10, { isPrimary: true }))).status, 409); assertNoWrites();
  assert.equal(state.media[0].albumId, 2);
  reset(); assert.equal((await mediaRoute.PUT(request(10, { isPrimary: 'false' }))).status, 400); assertNoWrites();
  reset(); state.media[0].isPublic=true; state.media[0].isActive=true;
  assert.equal((await mediaRoute.PUT(request(10, {isPublic:false,isActive:false}))).status,200);
  assert.equal(state.media[0].isPublic,false); assert.equal(state.media[0].isActive,false);
  assert.equal((await mediaRoute.PUT(request(10, {fileName:'Hidden media renamed'}))).status,200);
  assert.equal(state.media[0].isPublic,false); assert.equal(state.media[0].isActive,false);
  for(const key of ['isPublic','isActive']) { reset(); assert.equal((await mediaRoute.PUT(request(10, {[key]:'false'}))).status,400);assertNoWrites(); }
  const newMedia = { fileName: 'New primary', fileUrl: 'https://example.invalid/image.png', fileType: 'image/png', albumId: 2, isPrimary: true };
  reset(); assert.equal((await mediaRoute.POST(request('', newMedia))).status, 200);
  assert.equal(state.media.filter(row => row.albumId === 2 && row.isPrimary).length, 1);
  assert.equal(state.media.at(-1).fileName, newMedia.fileName);
  assert.equal(state.media.at(-1).isPublic,false);assert.equal(state.media.at(-1).isActive,true);
  for(const key of ['isPublic','isActive']) { reset(); assert.equal((await mediaRoute.POST(request('', {...newMedia,[key]:null}))).status,400);assertNoWrites(); }
  reset(); const beforeInsert = structuredClone(state); failWriteAt = 2;
  assert.equal((await mediaRoute.POST(request('', newMedia))).status, 500); assert.deepEqual(state, beforeInsert);
  reset(); assert.equal((await mediaRoute.POST(request('', { ...newMedia, albumId: 3 }))).status, 404); assertNoWrites();
  reset(); userId = undefined;
  for (const route of [trackRoute, linkRoute, mediaRoute]) assert.equal((await route.PUT(request(10, {}))).status, 401);
  assertNoWrites();
  console.log('PASS: actual Track/Link/Media handlers preserve parent integrity, ownership, ranks and primary selection; transaction rollback, stale-parent rejection and lock ordering verified with stateful mocked persistence (no live SQL).');
})().catch(error => { console.error(error); process.exitCode = 1; });
