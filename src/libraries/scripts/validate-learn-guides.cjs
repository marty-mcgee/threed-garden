// Real Learn schemas, contracts, service and HTTP handlers; offline SQLite/Drizzle adapter.
// SQL locks and transaction sequencing are recorded/mocked, not live PostgreSQL evidence.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { DatabaseSync } = require('node:sqlite');
const orm = require('drizzle-orm');
const pg = require('drizzle-orm/pg-core');
const { drizzle } = require('drizzle-orm/pg-proxy');

function load(file, modules = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
  } }).outputText, { exports, Buffer, URL, URLSearchParams, Request, Response, TextEncoder,
    require: name => name in modules ? modules[name] : require(name) });
  return exports;
}
const plain = value => JSON.parse(JSON.stringify(value));
const contracts = load('src/libraries/services/learn/contracts.ts');
const input = load('src/libraries/services/learn/input.ts', { './contracts': contracts });
const http = load('src/libraries/services/learn/http.ts', { './input': input });
const User = pg.pgTable('user', { id: pg.text('id').primaryKey(), role: pg.text('role'), isActive: pg.boolean('is_active'), isDeleted: pg.boolean('is_deleted') });
const schema = load('src/libraries/schema/learn/index.ts', { '../auth': { User } });
const table = schema.learnGuides;
const tableConfig = pg.getTableConfig(table);
assert.equal(tableConfig.name, 'learn_guides');
assert(!tableConfig.columns.some(column => ['user_id', 'project_id'].includes(column.name)), 'Learn is shared App content');
assert(tableConfig.columns.find(column => column.name === 'is_published').default === false);
assert(tableConfig.uniqueConstraints.some(constraint => constraint.name === 'learn_guides_slug_unique' && constraint.columns[0].name === 'slug'));
assert.equal(tableConfig.foreignKeys.length, 2);
assert(tableConfig.foreignKeys.every(key => key.onDelete === 'restrict' && key.reference().foreignTable === User));
const sqlPrerequisite = fs.readFileSync('docs/developers/sql/learn-guides.sql', 'utf8');
// Compare complete declarations from the real Drizzle metadata, without generating/applying a migration.
// Every manual declaration stays on one line so additional, removed or changed definitions also fail.
const dialect = new pg.PgDialect();
const quoted = name => `"${name}"`;
const columnsSql = columns => columns.map(column => quoted(column.name)).join(', ');
const compileSql = value => {
  const query = dialect.sqlToQuery(value);
  assert.equal(query.params.length, 0, 'DDL expressions must not contain bind parameters');
  return query.sql.replaceAll('"learn_guides".', '');
};
const defaultSql = value => typeof value === 'string' ? `'${value.replaceAll("'", "''")}'`
  : typeof value === 'object' ? compileSql(value) : String(value);
const declarations = tableConfig.columns.map(column => [quoted(column.name), column.getSQLType(),
  column.primary ? 'PRIMARY KEY' : '', column.default === undefined ? '' : `DEFAULT ${defaultSql(column.default)}`,
  column.notNull ? 'NOT NULL' : ''].filter(Boolean).join(' '));
for (const constraint of tableConfig.uniqueConstraints) {
  assert(!constraint.nullsNotDistinct, 'Render any new NULLS NOT DISTINCT semantics explicitly');
  declarations.push(`CONSTRAINT ${quoted(constraint.name)} UNIQUE (${columnsSql(constraint.columns)})`);
}
for (const constraint of tableConfig.checks) declarations.push(`CONSTRAINT ${quoted(constraint.name)} CHECK (${compileSql(constraint.value)})`);
for (const key of tableConfig.foreignKeys) {
  const reference = key.reference(), foreign = pg.getTableConfig(reference.foreignTable);
  declarations.push(`CONSTRAINT ${quoted(key.getName())} FOREIGN KEY (${columnsSql(reference.columns)}) REFERENCES ${quoted(foreign.schema ?? 'public')}.${quoted(foreign.name)}(${columnsSql(reference.foreignColumns)}) ON DELETE ${key.onDelete} ON UPDATE ${key.onUpdate}`);
}
const tableSql = sqlPrerequisite.match(/CREATE TABLE "learn_guides" \(\r?\n([\s\S]+?)\r?\n\);/);
assert(tableSql, 'Manual prerequisite must create the Learn table');
assert.deepEqual(tableSql[1].split(/\r?\n/).map(line => line.trim().replace(/,$/, '')).sort(), declarations.sort(),
  'Manual SQL must match every Drizzle column type, nullability, primary key, default, unique/check constraint and foreign key/action');
const indexes = tableConfig.indexes.map(({ config }) => {
  assert.equal(config.method, 'btree');
  assert(!config.where && !config.concurrently && !config.with, 'Render any new index options explicitly');
  for (const column of config.columns) assert(column.name && column.indexConfig.order === 'asc' && column.indexConfig.nulls === 'last' && !column.indexConfig.opClass,
    'Render any new expression, ordering or operator class explicitly');
  return `CREATE ${config.unique ? 'UNIQUE ' : ''}INDEX ${quoted(config.name)} ON "learn_guides" (${columnsSql(config.columns)});`;
});
assert.deepEqual(sqlPrerequisite.split(/\r?\n/).filter(line => /^CREATE (?:UNIQUE )?INDEX /.test(line)).sort(), indexes.sort(),
  'Manual SQL must match Drizzle index names, uniqueness, column order and default btree semantics');
assert(!/\b(?:DROP|ALTER TABLE|INSERT INTO)\b/i.test(sqlPrerequisite), 'Prerequisite creates only its new table/index');
assert.match(fs.readFileSync('src/libraries/schema/index.ts', 'utf8'), /export \* from '\.\/learn'/);

const starters = load('src/libraries/data/learn/starter-guides.ts');
assert.equal(starters.starterLearnGuides.length, 14);
assert.equal(new Set(starters.starterLearnGuides.map(guide => guide.slug)).size, 14);
for (const starter of starters.starterLearnGuides) input.learnGuideInputSchema.parse(starter);
const manualImport = fs.readFileSync('docs/developers/sql/learn-guides-import.sql', 'utf8').replace(/\r\n/g, '\n');
const manualPayload = manualImport.match(/\$learn_starters\$\s*([\s\S]*?)\s*\$learn_starters\$::jsonb;/);
assert(manualPayload, 'Manual import contains a dollar-quoted JSON dataset');
const manualStarters = JSON.parse(manualPayload[1]);
assert.deepEqual(manualStarters, plain(starters.starterLearnGuides), 'SQL import must preserve all fourteen starter texts, slugs, order and publication flags exactly');
const manualControl = manualImport.replace(manualPayload[0], '$learn_starters$DATA$learn_starters$::jsonb;').replace(/^--.*$/gm, '');
assert.match(manualControl, /^\s*BEGIN;\s*SET LOCAL lock_timeout = '5s';\s*SET LOCAL search_path = public;/);
assert.match(manualControl, /END;\s*\$learn_import\$;\s*COMMIT;\s*$/);
assert.match(manualControl, /v_super_admin_user_id text := '[^'\r\n]+';/, 'Manual import declares a placeholder or Developer-configured actor ID; runtime authority checks below remain required');
assert.match(manualControl, /IF v_super_admin_user_id IS NULL\s+OR btrim\(v_super_admin_user_id\) = ''\s+OR v_super_admin_user_id LIKE 'REPLACE_WITH_%' THEN\s+RAISE EXCEPTION/);
assert.match(manualControl, /IF to_regclass\('public.learn_guides'\) IS NULL THEN\s+RAISE EXCEPTION/);
assert.match(manualControl, /PERFORM 1 FROM "public"\."user"\s+WHERE "id" = v_super_admin_user_id\s+AND "role" = 'super_admin'\s+AND "is_active" IS TRUE\s+AND "is_deleted" IS FALSE\s+FOR SHARE;\s+IF NOT FOUND THEN\s+RAISE EXCEPTION/);
assert(manualControl.indexOf('FOR SHARE;') < manualControl.indexOf('INSERT INTO'), 'Current actor must be checked and locked before insertion');
assert.match(manualControl, /guide\."isActive", guide\."isPublished", gen_random_uuid\(\),\s+v_super_admin_user_id, v_super_admin_user_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP/);
assert.match(manualControl, /ON CONFLICT \("slug"\) DO NOTHING;/);
assert.match(manualControl, /GET DIAGNOSTICS v_imported = ROW_COUNT;\s+RAISE NOTICE '[^']*',\s+v_imported, jsonb_array_length\(v_starters\) - v_imported;/);
assert(!/\b(?:DELETE|UPDATE|DROP|ALTER|TRUNCATE|CREATE)\b/.test(manualControl), 'Import only inserts missing shared guides; it never changes existing records or schema');
const manualInsert = manualControl.match(/INSERT INTO "public"\."learn_guides"[\s\S]*?ON CONFLICT \("slug"\) DO NOTHING;/)?.[0];
assert(manualInsert, 'Manual import contains its explicit slug-preserving INSERT');
const draft = input.parseLearnGuideInput({ title: '  First guide  ', slug: 'first-guide' });
assert.equal(draft.title, 'First guide'); assert.equal(draft.isPublished, false); assert.equal(draft.isActive, true);
for (const bad of [null, { ...draft, id: 1 }, { ...draft, createdBy: 'other' }, { ...draft, title: 'x'.repeat(256) },
  { ...draft, slug: 'Uppercase' }, { ...draft, slug: 'a'.repeat(121) }, { ...draft, summary: 'x'.repeat(501) },
  { ...draft, content: 'x'.repeat(100001) }, { ...draft, sortOrder: 1.5 }, { ...draft, sortOrder: 10001 },
  { ...draft, isPublished: 'true' }, { ...draft, isActive: null }]) assert.throws(() => input.parseLearnGuideInput(bad));
assert.equal(input.learnListQuery(new URLSearchParams()).sort, 'sortOrder');
assert.equal(input.learnListQuery(new URLSearchParams('limit=200')).limit, 200);
assert.equal(input.learnListQuery(new URLSearchParams('isActive=false')).isActive, false);
for (const query of ['limit=201', 'limit=0', 'offset=-1', 'offset=1000001', 'search=' + 'x'.repeat(201), 'sort=content', 'direction=sideways', 'isActive=all', 'isPublished=1', 'limit=25&limit=50', 'userId=someone']) {
  assert.throws(() => input.learnListQuery(new URLSearchParams(query)), query);
}
for (const query of ['isActive=true', 'isPublished=false', 'sort=isPublished']) assert.throws(() => input.learnListQuery(new URLSearchParams(query), true));
for (const id of [null, '0', '-1', '1.2', '2147483648', '1 OR 1=1']) assert.throws(() => input.learnId(id));
assert.throws(() => input.learnGuideUpdateSchema.parse({ ...draft, id: 1, revision: 'stale' }));
assert.throws(() => input.learnImportSchema.parse({ overwrite: true }));

const memory = new DatabaseSync(':memory:');
memory.exec(`PRAGMA foreign_keys=ON;
CREATE TABLE user (id TEXT PRIMARY KEY, role TEXT, is_active INTEGER, is_deleted INTEGER);
INSERT INTO user VALUES ('editor-a','super_admin',1,0),('editor-b','super_admin',1,0),('ordinary','admin',1,0);
CREATE TABLE learn_guides (
 id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, summary TEXT NOT NULL,
 content TEXT NOT NULL, sort_order INTEGER NOT NULL, is_active INTEGER NOT NULL, is_published INTEGER NOT NULL,
 revision TEXT NOT NULL, created_by TEXT NOT NULL REFERENCES user(id) ON DELETE RESTRICT,
 updated_by TEXT NOT NULL REFERENCES user(id) ON DELETE RESTRICT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);`);
// Execute the actual import INSERT offline, adapting PostgreSQL JSON record expansion to SQLite.
// The transaction/authority/locking block above is inspected, not executed as PostgreSQL.
const manualRecordset = 'FROM jsonb_to_recordset(v_starters) AS guide (\n    title text, slug text, summary text, content text, "sortOrder" integer,\n    "isActive" boolean, "isPublished" boolean\n  )';
assert(manualInsert.includes(manualRecordset));
const manualInsertSql = manualInsert.replace('"public"."learn_guides"', 'learn_guides')
  .replaceAll('v_super_admin_user_id', '$actor')
  .replace(manualRecordset, `FROM (SELECT ${Object.keys(manualStarters[0]).map(key => `json_extract(value, '$.${key}') AS "${key}"`).join(', ')} FROM json_each($starters)) AS guide WHERE true`);
memory.function('gen_random_uuid', () => require('node:crypto').randomUUID());
const runManualImport = data => memory.prepare(manualInsertSql).run({ $actor: 'editor-a', $starters: JSON.stringify(data) }).changes;
memory.exec('BEGIN');
const preservedManual = { ...manualStarters[0], title: 'Previously edited title', content: 'Retained Markdown', isPublished: false };
assert.equal(runManualImport([preservedManual]), 1);
const retainedManualRow = plain(memory.prepare('SELECT * FROM learn_guides WHERE slug=?').get(preservedManual.slug));
assert.equal(runManualImport(manualStarters), 13);
assert.equal(runManualImport(manualStarters), 0, 'Repeating the manual import skips all existing slugs');
assert.deepEqual(plain(memory.prepare('SELECT * FROM learn_guides WHERE slug=?').get(preservedManual.slug)), retainedManualRow,
  'Manual import preserves prior edits, publication flags, attribution, revision and timestamps');
const manualRows = memory.prepare('SELECT * FROM learn_guides').all();
assert.equal(manualRows.length, 14);
assert(manualRows.every(row => row.created_by === 'editor-a' && row.updated_by === 'editor-a' && row.created_at && row.updated_at && /^[0-9a-f-]{36}$/.test(row.revision)));
memory.exec('ROLLBACK');
assert.equal(memory.prepare('SELECT count(*) AS total FROM learn_guides').get().total, 0, 'Manual insert data rolls back atomically');
let queries = [], failAfterWrite = false, transactionQueue = Promise.resolve();
const connection = drizzle(async (sql, params) => {
  queries.push({ sql, params });
  // SQLite executes this shared SQL subset; PostgreSQL-only lock/default/ILIKE syntax is adapted.
  const executable = sql.replace(/ for (?:share|update)\b/g, '').replace(/\bdefault\b/g, 'NULL').replace(/ ilike (\$\d+)/gi, " like $1 escape '\\'");
  const statement = memory.prepare(executable); statement.setReturnArrays(true);
  const bindings = Object.fromEntries(params.map((value, index) => [`$${index + 1}`, typeof value === 'boolean' ? Number(value) : value]));
  try {
    const names = statement.columns().map(column => column.name);
    const rows = statement.all(bindings).map(row => row.map((value, index) => ['is_active', 'is_published', 'is_deleted'].includes(names[index]) && value !== null ? Boolean(value) : value));
    if (failAfterWrite && /^(?:insert|update|delete)\b/i.test(sql)) throw new Error('private backend diagnostic');
    return { rows };
  } catch (error) {
    if (/UNIQUE constraint failed/.test(error.message)) throw Object.assign(new Error('private duplicate details'), { code: '23505' });
    throw error;
  }
});
const database = {
  select: connection.select.bind(connection), insert: connection.insert.bind(connection), update: connection.update.bind(connection), delete: connection.delete.bind(connection),
  transaction(callback) {
    const run = transactionQueue.then(async () => {
      memory.exec('BEGIN');
      try { const result = await callback(database); memory.exec('COMMIT'); return result; }
      catch (error) { memory.exec('ROLLBACK'); throw error; }
    });
    transactionQueue = run.catch(() => {}); return run;
  },
};
const serviceModule = load('src/libraries/services/learn/service.ts', {
  'server-only': {}, '@/libraries/schema/auth': { User }, '@/libraries/schema/learn': schema,
  '@/libraries/data/learn/starter-guides': starters, './input': input,
});
const service = serviceModule.learnGuideService(database);
let session = null;
const routeModules = {
  '@/libraries/auth': { auth: async () => session }, '@/libraries/db/client': { db: database },
  '@/libraries/services/learn/input': input, '@/libraries/services/learn/http': http,
  '@/libraries/services/learn/service': serviceModule,
};
const editorial = load('src/app/api/learn/guides/route.ts', routeModules);
const importer = load('src/app/api/learn/guides/import-starters/route.ts', routeModules);
const publicList = load('src/app/api/learn/public/guides/route.ts', routeModules);
const publicDetail = load('src/app/api/learn/public/guides/[slug]/route.ts', routeModules);
function request(method = 'GET', query = '', body, origin = 'https://example.test') {
  return new Request('https://example.test/api/learn/guides' + (query ? '?' + query : ''), {
    method, headers: { origin, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
  });
}
const allRows = () => memory.prepare('SELECT * FROM learn_guides ORDER BY id').all();
const query = value => input.learnListQuery(new URLSearchParams(value));
const publicQuery = value => input.learnListQuery(new URLSearchParams(value), true);
const publicGet = slug => publicDetail.GET(request(), { params: Promise.resolve({ slug }) });
const statusError = status => error => error instanceof input.LearnError && error.status === status;

(async () => {
  for (const [method, body] of [['GET'], ['POST', draft], ['PUT', { ...draft, id: 1, revision: '00000000-0000-4000-8000-000000000000' }], ['DELETE']]) {
    assert.equal((await editorial[method](request(method, '', body))).status, 401);
  }
  assert.equal((await importer.POST(request('POST', '', {}))).status, 401); assert.equal(queries.length, 0);
  session = { user: { id: 'editor-a', role: 'super_admin' } };
  for (const values of [['admin', 1, 0], ['user', 1, 0], ['super_admin', 0, 0], ['super_admin', null, 0], ['super_admin', 1, 1]]) {
    memory.prepare('UPDATE user SET role=?,is_active=?,is_deleted=? WHERE id=?').run(...values, 'editor-a');
    assert.equal((await editorial.GET(request())).status, 403);
    assert.equal((await editorial.GET(request('GET', 'id=1'))).status, 403);
    assert.equal((await editorial.POST(request('POST', '', draft))).status, 403);
    assert.equal((await importer.POST(request('POST', '', {}))).status, 403);
    assert.equal(allRows().length, 0);
  }
  memory.prepare('UPDATE user SET role=?,is_active=?,is_deleted=? WHERE id=?').run('super_admin', 1, 0, 'editor-a');
  for (const method of ['POST', 'PUT', 'DELETE']) assert.equal((await editorial[method](request(method, '', method === 'DELETE' ? undefined : draft, 'https://foreign.test'))).status, 403);
  assert.equal((await editorial.POST(request('POST', '', 'not-json'))).status, 400);
  assert.equal((await editorial.POST(request('POST', '', 'x'.repeat(1_048_577)))).status, 413);
  assert.equal((await importer.POST(request('POST', '', { overwrite: true }))).status, 400);
  assert.equal((await editorial.GET(request('GET', 'id=1&search=hidden'))).status, 400);

  queries = [];
  let response = await editorial.POST(request('POST', '', { title: 'Draft 100%', slug: 'draft-one' }));
  assert.equal(response.status, 201); let first = (await response.json()).data;
  assert.equal(first.isPublished, false); assert.equal(first.isActive, true);
  assert.equal(Object.keys(first).sort().join(), 'content,createdAt,id,isActive,isPublished,revision,slug,sortOrder,summary,title,updatedAt');
  assert(queries.some(entry => entry.sql.includes('from "user"') && entry.sql.includes('for share')));
  assert.equal(allRows()[0].created_by, 'editor-a');
  const second = await service.create('editor-b', { ...draft, title: 'Public second', slug: 'public-second', isPublished: true, sortOrder: 2, content: 'Visible body' });
  const inactive = await service.create('editor-a', { ...draft, title: 'Hidden inactive', slug: 'hidden-inactive', isPublished: true, isActive: false });
  let page = await service.list('editor-b', query('limit=1&sort=title&direction=desc'));
  assert.equal(page.pagination.total, 3); assert.equal(page.data.length, 1); assert(!('content' in page.data[0]));
  assert.equal((await service.list('editor-a', query('search=100%25'))).pagination.total, 1, 'wildcards are literal search text');
  assert.equal((await service.list('editor-a', query('isPublished=false'))).pagination.total, 1);
  assert.equal((await service.get('editor-b', first.id)).id, first.id, 'shared guides are editable across Super Admin creators');
  const fields = ({ id, revision, createdAt, updatedAt, ...value }) => value;
  first = await service.update('editor-b', { ...fields(first), id: first.id, revision: first.revision, isPublished: true, sortOrder: 1 });
  assert.equal(allRows()[0].created_by, 'editor-a'); assert.equal(allRows()[0].updated_by, 'editor-b');
  const snapshot = plain(allRows());
  // An already signed-in editor can lose authority between loading and submitting a saved row.
  for (const values of [['admin', 1, 0], ['super_admin', 0, 0], ['super_admin', 1, 1]]) {
    memory.prepare('UPDATE user SET role=?,is_active=?,is_deleted=? WHERE id=?').run(...values, 'editor-a');
    assert.equal((await editorial.PUT(request('PUT', '', { ...fields(first), id: first.id, revision: first.revision, title: 'Unauthorized change' }))).status, 403);
    assert.equal((await editorial.DELETE(request('DELETE', `id=${first.id}&revision=${first.revision}`))).status, 403);
    assert.deepEqual(plain(allRows()), snapshot, 'revoked editorial authority must not change or delete existing guides');
  }
  memory.prepare('UPDATE user SET role=?,is_active=?,is_deleted=? WHERE id=?').run('super_admin', 1, 0, 'editor-a');
  await assert.rejects(() => service.get('missing-account', first.id), statusError(403));
  await assert.rejects(() => service.update('editor-a', { ...fields(first), id: first.id, revision: second.revision }), statusError(409));
  await assert.rejects(() => service.remove('editor-a', first.id, second.revision), statusError(409));
  assert.deepEqual(plain(allRows()), snapshot);
  response = await editorial.POST(request('POST', '', { ...draft, slug: first.slug })); assert.equal(response.status, 409);
  assert(!JSON.stringify(await response.json()).includes('private duplicate'));

  session = null; queries = [];
  response = await publicList.GET(request('GET', 'limit=1&sort=sortOrder'));
  assert.equal(response.status, 200); assert.match(response.headers.get('cache-control'), /no-store/);
  page = await response.json(); assert.equal(page.pagination.total, 2); assert.equal(page.data[0].slug, first.slug);
  assert.equal(Object.keys(page.data[0]).sort().join(), 'slug,summary,title,updatedAt');
  assert(queries.every(entry => !entry.sql.includes('from "user"')), 'public reads do not need an editorial session');
  assert(queries.every(entry => !entry.sql.split(' from ')[0].includes('"content"')), 'public lists and counts do not fetch guide bodies');
  const detail = await (await publicGet(second.slug)).json(); assert.equal(detail.data.content, 'Visible body');
  assert.equal(Object.keys(detail.data).sort().join(), 'content,slug,summary,title,updatedAt');
  assert.equal((await publicGet(inactive.slug)).status, 404);
  assert.equal((await publicGet('missing')).status, 404);
  assert.equal((await publicList.GET(request('GET', 'isPublished=false'))).status, 400);
  first = await service.update('editor-a', { ...fields(first), id: first.id, revision: first.revision, isPublished: false });
  assert.equal((await publicGet(first.slug)).status, 404);
  assert.equal((await service.publicList(publicQuery('search=Draft'))).pagination.total, 0);
  assert.equal((await service.publicList(publicQuery('offset=1&limit=1'))).data.length, 0);
  const race = await Promise.allSettled([1, 2].map(number => service.update('editor-a', { ...fields(first), id: first.id, revision: first.revision, content: 'Change ' + number })));
  assert.equal(race.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(race.find(result => result.status === 'rejected').reason.status, 409);

  const retained = await service.create('editor-b', { ...starters.starterLearnGuides[0], title: 'Manual existing guide', content: 'Keep this content', isPublished: false });
  const beforeImport = plain(allRows().find(row => row.id === retained.id));
  session = { user: { id: 'editor-a' } };
  response = await importer.POST(request('POST', '', {})); assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).data, { imported: 13, skipped: 1 });
  assert.deepEqual(plain(allRows().find(row => row.id === retained.id)), beforeImport, 'starter import never overwrites matching slugs');
  response = await importer.POST(request('POST', '', {})); assert.deepEqual((await response.json()).data, { imported: 0, skipped: 14 });
  for (const starter of starters.starterLearnGuides) {
    const row = allRows().find(row => row.slug === starter.slug); assert(row && row.id && row.revision);
    assert.equal((await service.get('editor-b', row.id)).slug, starter.slug, 'every imported guide is a real editable record');
  }
  const beforeFailure = plain(allRows()); failAfterWrite = true;
  response = await editorial.POST(request('POST', '', { ...draft, slug: 'rollback-create' }));
  assert.equal(response.status, 503); assert(!JSON.stringify(await response.json()).includes('private backend'));
  assert.deepEqual(plain(allRows()), beforeFailure); failAfterWrite = false;
  const updatedRetained = await service.get('editor-a', retained.id);
  response = await editorial.DELETE(request('DELETE', `id=${retained.id}&revision=${updatedRetained.revision}`)); assert.equal(response.status, 200);
  assert.equal((await publicGet(retained.slug)).status, 404);
  await assert.rejects(() => service.get('editor-a', retained.id), statusError(404));
  // Removing one imported slug allows a fresh insert; a failed import transaction leaves none of its writes.
  const beforeFailedImport = plain(allRows()); failAfterWrite = true;
  response = await importer.POST(request('POST', '', {})); assert.equal(response.status, 503);
  assert.deepEqual(plain(allRows()), beforeFailedImport); failAfterWrite = false;
  response = await importer.POST(request('POST', '', {})); assert.deepEqual((await response.json()).data, { imported: 1, skipped: 13 });
  console.log('PASS Learn backend: real schemas/strict bounds, current Super Admin authority and locks, shared attribution, pagination/search, public publication gates/minimal DTOs, revision conflicts, duplicate slugs, atomic rollback and exact 14-record App/manual SQL idempotent imports (offline persistence).');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => memory.close());
