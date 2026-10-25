const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { DatabaseSync } = require('node:sqlite');
const orm = require('drizzle-orm');
const pg = require('drizzle-orm/pg-core');
const { drizzle } = require('drizzle-orm/pg-proxy');

// Execute the real Drizzle-generated SELECTs against in-memory SQLite fixtures.
// This SELECT subset is shared SQL; this is not a live Postgres/integration check.
function load(file, deps) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText, { exports, URL, Map, require: name => { assert(name in deps, name); return deps[name]; } });
  return exports;
}
const user = pg.pgTable('user', { id: pg.text('id').primaryKey() });
const project = pg.pgTable('project', { id: pg.serial('id').primaryKey() });
const schema = load('src/libraries/schema/multimedia/index.ts', {
  'drizzle-orm': orm, 'drizzle-orm/pg-core': pg, '../auth': { user },
  '../project': { project, projectMultimedia: pg.pgTable('project_multimedia', { id: pg.serial('id') }) },
});
const authority = load('src/libraries/services/multimedia/authority.ts', {
  'drizzle-orm': orm, '@/libraries/db/client': { db: {} }, '@/libraries/schema/multimedia': schema,
  './access': { positiveId: () => { throw Error('Public reads do not use owned-parent mutations'); } },
});
const source = load('src/libraries/services/multimedia/public-lyrics.ts', {
  'drizzle-orm': orm, '@/libraries/schema/multimedia': schema, './authority': authority,
});
const memory = new DatabaseSync(':memory:');
memory.exec(`
  CREATE TABLE multimedia_albums (id INTEGER PRIMARY KEY, user_id TEXT, is_public INTEGER, status TEXT);
  CREATE TABLE multimedia_tracks (id INTEGER PRIMARY KEY, user_id TEXT, album_id INTEGER, title TEXT, status TEXT, track_number INTEGER);
  CREATE TABLE multimedia_lyrics (id INTEGER PRIMARY KEY, user_id TEXT, title TEXT, content TEXT, is_active INTEGER, sort_order INTEGER, metadata TEXT);
  CREATE TABLE multimedia_lyrics_albums (lyrics_id INTEGER, album_id INTEGER, UNIQUE(lyrics_id, album_id));
  CREATE TABLE multimedia_lyrics_tracks (lyrics_id INTEGER, track_id INTEGER, UNIQUE(lyrics_id, track_id));
  CREATE TABLE multimedia_lyrics_projects (lyrics_id INTEGER, project_id INTEGER);
`);
const insertAlbum = memory.prepare('INSERT INTO multimedia_albums VALUES (?, ?, ?, ?)');
for (const row of [[27, 'alice', 1, 'published'], [28, 'alice', 0, 'published'], [29, 'alice', 1, 'draft'],
  [30, 'bob', 1, 'published'], [31, 'alice', 1, 'published'], [32, null, 1, 'published']]) insertAlbum.run(...row);
const insertTrack = memory.prepare('INSERT INTO multimedia_tracks VALUES (?, ?, ?, ?, ?, ?)');
for (const row of [[82, 'alice', 27, 'First Track', 'active', 1], [83, 'alice', 27, 'Second Track', 'active', 2],
  [84, 'alice', 27, 'Inactive Secret', 'inactive', 3], [85, 'bob', 27, 'Foreign Secret', 'active', 4],
  [86, 'alice', 31, 'Other Album Secret', 'active', 5], [87, 'alice', null, 'Unassigned', 'active', 6],
  [88, 'alice', 27, 'Processing Secret', 'processing', 7]]) insertTrack.run(...row);
const insertLyrics = memory.prepare('INSERT INTO multimedia_lyrics VALUES (?, ?, ?, ?, ?, ?, ?)');
for (let id = 1; id <= 26; id++) insertLyrics.run(id, [5, 12, 16].includes(id) ? 'bob' : 'alice', `Lyrics ${id}`,
  id === 20 ? '' : `Verse ${id}\nLine two`, id === 4 ? 0 : 1, id === 1 ? -5 : 0, '{"private":"never serialize"}');
const direct = memory.prepare('INSERT INTO multimedia_lyrics_albums VALUES (?, ?)');
for (const id of [1, 3, 4, 5, 11, 19, 20, 23, 24, 25, 26]) direct.run(id, 27);
for (const pair of [[15, 28], [16, 30], [17, 29], [18, 32]]) direct.run(...pair);
const linked = memory.prepare('INSERT INTO multimedia_lyrics_tracks VALUES (?, ?)');
for (const pair of [[2, 82], [3, 82], [3, 83], [4, 82], [7, 84], [8, 85], [9, 86], [10, 999],
  [11, 82], [11, 84], [11, 85], [11, 86], [12, 82], [13, 88], [19, 999], [21, 82], [22, 83]]) linked.run(...pair);
memory.prepare('INSERT INTO multimedia_lyrics_projects VALUES (?, ?)').run(6, 17);

let queries = [], beforeQuery;
const db = drizzle(async (sql, params) => {
  queries.push({ sql, params });
  beforeQuery?.(queries.length);
  const statement = memory.prepare(sql);
  statement.setReturnArrays(true);
  const bindings = Object.fromEntries(params.map((value, index) => [`$${index + 1}`, typeof value === 'boolean' ? Number(value) : value]));
  return { rows: statement.all(bindings) };
});
const service = source.publicLyricsService(db);
const plain = value => JSON.parse(JSON.stringify(value));

(async () => {
  const page = await service.forAlbum(27, 0);
  assert.equal(page.hasMore, true);
  assert.deepEqual(plain(page.data.map(row => row.id)), [1, 2, 3, 11, 19, 20, 21, 22, 23, 24]);
  assert.equal(queries.length, 3, 'One Album check, one page, one batch of labels; no per-Lyrics reads');
  assert.equal(page.data.find(row => row.id === 1).assignedToAlbum, true);
  assert.equal(page.data.find(row => row.id === 2).assignedToAlbum, false);
  assert.deepEqual(plain(page.data.find(row => row.id === 3).tracks), [{ id: 82, title: 'First Track' }, { id: 83, title: 'Second Track' }]);
  assert.deepEqual(plain(page.data.find(row => row.id === 11).tracks), [{ id: 82, title: 'First Track' }]);
  assert.equal(page.data.find(row => row.id === 20).content, '');
  assert.equal(page.data.find(row => row.id === 1).content, 'Verse 1\nLine two');
  assert.deepEqual(Object.keys(page.data[0]).sort(), ['assignedToAlbum', 'content', 'id', 'title', 'tracks']);
  assert(!JSON.stringify(page).includes('Secret')); assert(!JSON.stringify(page).includes('private'));
  assert.match(queries[1].sql, /exists \(select 1 from "multimedia_lyrics_albums"/);
  assert.match(queries[1].sql, /exists \(select 1 from "multimedia_lyrics_tracks"/);
  assert.match(queries[1].sql, /order by "multimedia_lyrics"\."sort_order" asc, "multimedia_lyrics"\."id" asc limit/);
  assert(queries[1].params.includes(11), 'Fetch one extra row to determine hasMore');
  for (const query of [queries[1], queries[2]]) {
    assert.match(query.sql, /"multimedia_albums"\."is_public" =/);
    assert.match(query.sql, /"multimedia_albums"\."status" =/);
    assert.match(query.sql, /"multimedia_lyrics"\."user_id" = "multimedia_albums"\."user_id"/);
    assert.match(query.sql, /"multimedia_lyrics"\."is_active" =/);
    assert.match(query.sql, /"multimedia_tracks"\."user_id" = "multimedia_albums"\."user_id"/);
    assert.match(query.sql, /"multimedia_tracks"\."status" =/);
  }
  assert.match(queries[2].sql, /"multimedia_lyrics"\."id" in \(/);
  assert(!queries[2].params.includes(25), 'Only the returned page, not the hasMore probe, receives labels');
  queries = [];
  const next = await service.forAlbum(27, 10);
  assert.equal(next.hasMore, false); assert.deepEqual(plain(next.data.map(row => row.id)), [25, 26]);
  const exactPage = await service.forAlbum(27, 2);
  assert.equal(exactPage.data.length, 10); assert.equal(exactPage.hasMore, false, 'Exactly ten remaining records do not announce another page');
  queries = [];
  assert.deepEqual(plain(await service.forAlbum(27, 100)), { data: [], hasMore: false });
  assert.equal(queries.length, 2, 'An empty page skips the label query');
  for (const id of [28, 29, 32, 999]) {
    queries = [];
    await assert.rejects(() => service.forAlbum(id, 0), source.PublicLyricsAlbumNotFound);
    assert.equal(queries.length, 1, 'Private/draft/missing/unowned Album stops before content');
  }
  assert.deepEqual(plain((await service.forAlbum(30, 0)).data.map(row => row.id)), [16]);
  queries = [];
  beforeQuery = number => { if (number === 2) memory.exec('UPDATE multimedia_albums SET is_public = 0 WHERE id = 27'); };
  assert.deepEqual(plain(await service.forAlbum(27, 0)), { data: [], hasMore: false }, 'Content rechecks visibility after a public precheck');
  beforeQuery = undefined;
  memory.exec('UPDATE multimedia_albums SET is_public = 1 WHERE id = 27');

  let calls = [], error;
  const route = load('src/app/api/multimedia/albums/[id]/lyrics/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => ({ body, ...options }) } },
    '@/libraries/db/client': { db: {} },
    '@/libraries/services/multimedia/public-lyrics': { ...source, publicLyricsService: () => ({ forAlbum: async (...args) => {
      calls.push(args); if (error) throw error; return plain(page);
    } }) },
  });
  const request = (query = '', cookie = '') => ({ nextUrl: new URL(`https://fixture/api/multimedia/albums/27/lyrics?${query}`), headers: { get: () => cookie } });
  const context = id => ({ params: Promise.resolve({ id }) });
  for (const cookie of ['', 'owner-session', 'other-session']) {
    const result = await route.GET(request('', cookie), context('27'));
    assert.equal(result.status, 200); assert.equal(result.headers['Cache-Control'], 'no-store');
    assert.deepEqual(plain(result.body), { success: true, ...plain(page) });
    assert.deepEqual(calls.at(-1), [27, 0]);
  }
  for (const id of ['0', '-1', '1.2', '1e2', '', '27x', '2147483648']) {
    const before = calls.length; assert.equal((await route.GET(request(), context(id))).status, 400); assert.equal(calls.length, before);
  }
  for (const query of ['offset=-1', 'offset=1.2', 'offset=1e2', 'offset=', 'offset=x', 'offset=2147483648', 'offset=0&offset=10', 'scope=owner', 'albumId=27&albumId=28']) {
    const before = calls.length; assert.equal((await route.GET(request(query), context('27'))).status, 400, query); assert.equal(calls.length, before);
  }
  assert.equal((await route.GET(request('offset=2147483647'), context('2147483647'))).status, 200);
  assert.deepEqual(calls.at(-1), [2147483647, 2147483647]);
  error = new source.PublicLyricsAlbumNotFound();
  for (const cookie of ['', 'owner-session']) assert.equal((await route.GET(request('', cookie), context('27'))).status, 404);
  error = Error('secret database detail');
  const failed = await route.GET(request(), context('27'));
  assert.equal(failed.status, 503); assert(!JSON.stringify(failed).includes('secret database detail'));
  console.log('PASS: public Album Lyrics eligibility, direct/Track deduplication, active/same-owner labels, bounded pages, minimal projection, visibility recheck, anonymous/session-independent API, strict params and redacted errors. In-memory SQL fixture; no live database.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => memory.close());
