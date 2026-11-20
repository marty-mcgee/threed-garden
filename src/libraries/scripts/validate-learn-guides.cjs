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
const { generateDrizzleJson, generateMigration } = require('drizzle-kit/api');

function load(file, modules = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
  } }).outputText, { exports, Buffer, URL, URLSearchParams, Request, Response, TextEncoder,
    require: name => name === '@/libraries/utils/input-validation' ? require('../utils/input-validation.ts') : name in modules ? modules[name] : require(name) });
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
assert(!tableConfig.columns.some(column => column.name === 'project_id'), 'Learn is App content');
assert(tableConfig.columns.find(column => column.name === 'user_id')?.notNull);
assert(tableConfig.columns.find(column => column.name === 'is_published').default === false);
assert(tableConfig.uniqueConstraints.some(constraint => constraint.name === 'learn_guides_slug_unique' && constraint.columns[0].name === 'slug'));
assert.equal(tableConfig.foreignKeys.length, 3);
assert(tableConfig.foreignKeys.every(key => key.onDelete === 'restrict' && key.reference().foreignTable === User));
const sqlPrerequisite = fs.readFileSync('docs/developers/sql/learn-guides.sql', 'utf8');
const visibilitySql = fs.readFileSync('docs/developers/sql/learn-guides-is-public.sql', 'utf8');
const migrationBody = visibilitySql.replace(/^--.*$/gm, '').trim();
const addVisibility = migrationBody.match(/^BEGIN;\s*SET LOCAL lock_timeout = '5s';\s*(ALTER TABLE "public"\."learn_guides" ADD COLUMN ("is_public" [^;]+);)\s*COMMIT;$/);
assert(addVisibility, 'Visibility migration adds exactly one column in a transaction');
const ownerSql = fs.readFileSync('docs/developers/sql/learn-guides-owner.sql', 'utf8');
const ownerStatements = ownerSql.replace(/^--.*$/gm, '').split(';').map(line => line.trim()).filter(Boolean);
const [beginOwner, ownerTimeout, addOwner, backfillOwner, requireOwner, ownerReference, ownerIndex, commitOwner] = ownerStatements;
assert.equal(ownerStatements.length, 8);
assert.equal(beginOwner, 'BEGIN'); assert.equal(ownerTimeout, "SET LOCAL lock_timeout = '5s'"); assert.equal(commitOwner, 'COMMIT');
assert.equal(addOwner, 'ALTER TABLE "public"."learn_guides" ADD COLUMN "user_id" text');
assert.equal(backfillOwner, 'UPDATE "public"."learn_guides" SET "user_id" = "created_by" WHERE "user_id" IS NULL');
assert.equal(requireOwner, 'ALTER TABLE "public"."learn_guides" ALTER COLUMN "user_id" SET NOT NULL');
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
assert.deepEqual([
  ...tableSql[1].split(/\r?\n/).map(line => line.trim().replace(/,$/, '')),
  addVisibility[2],
  '"user_id" text NOT NULL',
  ownerReference.replace('ALTER TABLE "public"."learn_guides" ADD ', ''),
].sort(), declarations.sort(),
  'Manual SQL must match every Drizzle column type, nullability, primary key, default, unique/check constraint and foreign key/action');
const indexes = tableConfig.indexes.map(({ config }) => {
  assert.equal(config.method, 'btree');
  assert(!config.where && !config.concurrently && !config.with, 'Render any new index options explicitly');
  for (const column of config.columns) assert(column.name && column.indexConfig.order === 'asc' && column.indexConfig.nulls === 'last' && !column.indexConfig.opClass,
    'Render any new expression, ordering or operator class explicitly');
  return `CREATE ${config.unique ? 'UNIQUE ' : ''}INDEX ${quoted(config.name)} ON "learn_guides" (${columnsSql(config.columns)});`;
});
assert.deepEqual([
  ...sqlPrerequisite.split(/\r?\n/).filter(line => /^CREATE (?:UNIQUE )?INDEX /.test(line)),
  ownerIndex.replace('ON "public"."learn_guides"', 'ON "learn_guides"') + ';',
].sort(), indexes.sort(),
  'Manual SQL must match Drizzle index names, uniqueness, column order and default btree semantics');
assert(!/\b(?:DROP|ALTER TABLE|INSERT INTO)\b/i.test(sqlPrerequisite), 'Prerequisite creates only its new table/index');
assert.match(fs.readFileSync('src/libraries/schema/index.ts', 'utf8'), /export \* from '\.\/learn'/);

const starters = load('src/libraries/data/learn/starter-guides.ts');
assert.equal(starters.starterLearnGuides.length, 14);
assert.equal(new Set(starters.starterLearnGuides.map(guide => guide.slug)).size, 14);
for (const starter of starters.starterLearnGuides) input.parseLearnGuideInput(starter);
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
assert.match(manualControl, /"revision", "user_id", "created_by", "updated_by"/);
assert.match(manualControl, /guide\."isActive", guide\."isPublished", gen_random_uuid\(\),\s+v_super_admin_user_id, v_super_admin_user_id, v_super_admin_user_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP/);
assert.match(manualControl, /ON CONFLICT \("slug"\) DO NOTHING;/);
assert.match(manualControl, /GET DIAGNOSTICS v_imported = ROW_COUNT;\s+RAISE NOTICE '[^']*',\s+v_imported, jsonb_array_length\(v_starters\) - v_imported;/);
assert(!/\b(?:DELETE|UPDATE|DROP|ALTER|TRUNCATE|CREATE)\b/.test(manualControl), 'Import only inserts missing shared guides; it never changes existing records or schema');
const manualInsert = manualControl.match(/INSERT INTO "public"\."learn_guides"[\s\S]*?ON CONFLICT \("slug"\) DO NOTHING;/)?.[0];
assert(manualInsert, 'Manual import contains its explicit slug-preserving INSERT');
const draft = input.parseLearnGuideInput({ title: '  First guide  ', slug: 'first-guide' });
assert.equal(draft.title, 'First guide'); assert.equal(draft.isPublished, false); assert.equal(draft.isActive, true);
assert.equal(draft.isPublic, true);
for (const bad of [null, { ...draft, id: 1 }, { ...draft, createdBy: 'other' }, { ...draft, title: 'x'.repeat(256) },
  { ...draft, slug: 'Uppercase' }, { ...draft, slug: 'a'.repeat(121) }, { ...draft, summary: 'x'.repeat(501) },
  { ...draft, content: 'x'.repeat(100001) }, { ...draft, sortOrder: 1.5 }, { ...draft, sortOrder: 10001 },
  { ...draft, isPublished: 'true' }, { ...draft, isActive: null }, { ...draft, isPublic: 'false' }, { ...draft, userId: 'other' }]) assert.throws(() => input.parseLearnGuideInput(bad));
assert.equal(input.learnListQuery(new URLSearchParams()).sort, 'sortOrder');
assert.equal(input.learnListQuery(new URLSearchParams('limit=200')).limit, 200);
assert.equal(input.learnListQuery(new URLSearchParams('isActive=false')).isActive, false);
for (const query of ['limit=201', 'limit=0', 'offset=-1', 'offset=1000001', 'search=' + 'x'.repeat(201), 'sort=content', 'direction=sideways', 'isActive=all', 'isPublished=1', 'limit=25&limit=50', 'userId=someone']) {
  assert.throws(() => input.learnListQuery(new URLSearchParams(query)), query);
}
for (const query of ['isActive=true', 'isPublished=false', 'sort=isPublished', 'sort=categories']) assert.throws(() => input.learnListQuery(new URLSearchParams(query), true));
for (const id of [null, '0', '-1', '1.2', '2147483648', '1 OR 1=1']) assert.throws(() => input.learnId(id));
assert.throws(() => input.parseLearnGuideUpdate({ ...draft, id: 1, revision: 'stale' }));
assert.throws(() => input.parseLearnImport({ overwrite: true }));

const memory = new DatabaseSync(':memory:');
memory.exec(`PRAGMA foreign_keys=ON;
CREATE TABLE user (id TEXT PRIMARY KEY, role TEXT, is_active INTEGER, is_deleted INTEGER);
INSERT INTO user VALUES ('editor-a','super_admin',1,0),('editor-b','super_admin',1,0),('ordinary','admin',1,0);
CREATE TABLE learn_guides (
 id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, summary TEXT NOT NULL,
 content TEXT NOT NULL, sort_order INTEGER NOT NULL, is_active INTEGER NOT NULL, is_published INTEGER NOT NULL,
 revision TEXT NOT NULL, created_by TEXT NOT NULL REFERENCES user(id) ON DELETE RESTRICT,
 updated_by TEXT NOT NULL REFERENCES user(id) ON DELETE RESTRICT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE learn_categories (
 id INTEGER PRIMARY KEY AUTOINCREMENT, parent_id INTEGER REFERENCES learn_categories(id) ON DELETE RESTRICT CHECK (id <> parent_id),
 name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, description TEXT, sort_order INTEGER NOT NULL, is_active INTEGER NOT NULL,
 revision TEXT NOT NULL, created_by TEXT NOT NULL REFERENCES user(id) ON DELETE RESTRICT,
 updated_by TEXT NOT NULL REFERENCES user(id) ON DELETE RESTRICT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE learn_guide_category_assignments (
 id INTEGER PRIMARY KEY AUTOINCREMENT, guide_id INTEGER NOT NULL REFERENCES learn_guides(id) ON DELETE CASCADE,
 category_id INTEGER NOT NULL REFERENCES learn_categories(id) ON DELETE CASCADE,
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(guide_id, category_id)
);`);
// Execute the actual import INSERT offline, adapting PostgreSQL JSON record expansion to SQLite.
// The transaction/authority/locking block above is inspected, not executed as PostgreSQL.
const manualRecordset = 'FROM jsonb_to_recordset(v_starters) AS guide (\n    title text, slug text, summary text, content text, "sortOrder" integer,\n    "isActive" boolean, "isPublished" boolean\n  )';
assert(manualInsert.includes(manualRecordset));
const manualInsertSql = manualInsert.replace('"public"."learn_guides"', 'learn_guides')
  .replaceAll('v_super_admin_user_id', '$actor')
  .replace(manualRecordset, `FROM (SELECT ${Object.keys(manualStarters[0]).map(key => `json_extract(value, '$.${key}') AS "${key}"`).join(', ')} FROM json_each($starters)) AS guide WHERE true`);
memory.function('gen_random_uuid', () => require('node:crypto').randomUUID());
const runManualImport = (data, statement = manualInsertSql) => memory.prepare(statement).run({ $actor: 'editor-a', $starters: JSON.stringify(data) }).changes;
memory.exec('BEGIN');
const preservedManual = { ...manualStarters[0], title: 'Previously edited title', content: 'Retained Markdown', isPublished: false };
const legacyInsert = manualInsertSql.replace('"user_id", ', '').replace('$actor, $actor, $actor', '$actor, $actor');
assert.equal(runManualImport([preservedManual], legacyInsert), 1);
memory.prepare("UPDATE learn_guides SET updated_by='editor-b'").run();
const addVisibilityOffline = addVisibility[1].replace('"public"."learn_guides"', '"learn_guides"');
function applyOwnerOffline() {
  memory.exec(addOwner.replace('"public"."learn_guides"', '"learn_guides"') + ' REFERENCES user(id) ON DELETE RESTRICT');
  memory.exec(backfillOwner.replace('"public"."learn_guides"', '"learn_guides"'));
}
memory.exec(addVisibilityOffline);
applyOwnerOffline();
const retainedManualRow = plain(memory.prepare('SELECT * FROM learn_guides WHERE slug=?').get(preservedManual.slug));
assert.equal(retainedManualRow.is_public, 1);
assert.equal(retainedManualRow.is_published, 0);
assert.equal(retainedManualRow.user_id, 'editor-a', 'Ownership comes from the creator');
assert.equal(retainedManualRow.updated_by, 'editor-b', 'The last editor stays separate');
assert.equal(runManualImport(manualStarters), 13);
assert.equal(runManualImport(manualStarters), 0, 'Repeating the manual import skips all existing slugs');
assert.deepEqual(plain(memory.prepare('SELECT * FROM learn_guides WHERE slug=?').get(preservedManual.slug)), retainedManualRow,
  'Manual import preserves prior edits, publication flags, attribution, revision and timestamps');
const manualRows = memory.prepare('SELECT * FROM learn_guides').all();
assert.equal(manualRows.length, 14);
assert(manualRows.every(row => row.is_public === 1 && row.user_id === 'editor-a' && row.created_by === 'editor-a' && row.created_at && row.updated_at && /^[0-9a-f-]{36}$/.test(row.revision)));
memory.exec('ROLLBACK');
memory.exec(addVisibilityOffline);
assert.equal(memory.prepare('SELECT count(*) AS total FROM learn_guides').get().total, 0, 'Manual insert data rolls back atomically');
let queries = [], failAfterWrite = false, failAssignmentWrite = false, transactionQueue = Promise.resolve();
const connection = drizzle(async (sql, params) => {
  queries.push({ sql, params });
  if (sql.includes('pg_advisory_xact_lock')) return { rows: [] };
  // SQLite executes this shared SQL subset; PostgreSQL-only lock/default/ILIKE syntax is adapted.
  const executable = sql.replace(/ for (?:share|update)\b/g, '').replace(/\bdefault\b/g, 'NULL').replace(/ ilike (\$\d+)/gi, " like $1 escape '\\'");
  const bindings = Object.fromEntries(params.map((value, index) => [`$${index + 1}`, typeof value === 'boolean' ? Number(value) : value]));
  try {
    const statement = memory.prepare(executable); statement.setReturnArrays(true);
    const names = statement.columns().map(column => column.name);
    const rows = statement.all(bindings).map(row => row.map((value, index) => ['is_active', 'is_published', 'is_public', 'is_deleted'].includes(names[index]) && value !== null ? Boolean(value) : value));
    if (failAfterWrite && /^(?:insert|update|delete)\b/i.test(sql)) throw new Error('private backend diagnostic');
    if (failAssignmentWrite && /^insert into "learn_guide_category_assignments"/i.test(sql)) throw new Error('assignment write failed');
    return { rows };
  } catch (error) {
    if (/UNIQUE constraint failed/.test(error.message)) throw Object.assign(new Error('private duplicate details'), { code: '23505' });
    if (error.message === 'no such column: learn_guides.user_id') {
      throw Object.assign(new Error('column learn_guides.user_id does not exist'), { code: '42703' });
    }
    throw error;
  }
});
const database = {
  select: connection.select.bind(connection), insert: connection.insert.bind(connection), update: connection.update.bind(connection),
  delete: connection.delete.bind(connection), execute: connection.execute.bind(connection),
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
const categoryModule = load('src/libraries/services/learn/categories.ts', {
  'server-only': {}, '@/libraries/schema/learn': schema, './input': input, './service': serviceModule,
});
const categoryService = categoryModule.learnCategoryService(database);
let session = null;
const routeModules = {
  '@/libraries/auth': { auth: async () => session }, '@/libraries/db/client': { db: database },
  '@/libraries/services/learn/input': input, '@/libraries/services/learn/http': http,
  '@/libraries/services/learn/service': serviceModule,
  '@/libraries/services/learn/categories': categoryModule,
};
const editorial = load('src/app/api/learn/guides/route.ts', routeModules);
const categories = load('src/app/api/learn/categories/route.ts', routeModules);
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
  const currentSchema = generateDrizzleJson(schema);
  const previousSchema = plain(currentSchema);
  delete previousSchema.tables['public.learn_guides'].columns.is_public;
  assert.deepEqual(await generateMigration(previousSchema, currentSchema), [addVisibilityOffline],
    'Drizzle must generate only the Guide visibility column');
  // Read compatibility on a database with visibility applied and ownership still pending.
  memory.exec('BEGIN');
  const legacyDraft = { ...manualStarters[0], isPublished: false, slug: 'legacy-owner-draft' };
  assert.equal(runManualImport([legacyDraft], legacyInsert), 1);
  const legacyRead = async (id, allowed) => {
    session = id ? { user: { id } } : null;
    const listResponse = await publicList.GET(request());
    assert.equal(listResponse.status, 200, 'Learn list remains available before the owner column is added');
    const page = await listResponse.json();
    assert.equal(page.pagination.total, allowed ? 1 : 0);
    assert.deepEqual(page.data.map(guide => guide.slug), allowed ? [legacyDraft.slug] : []);
    assert.equal((await publicGet(legacyDraft.slug)).status, allowed ? 200 : 404);
  };
  await legacyRead('editor-b', true);
  memory.prepare("UPDATE user SET role='user' WHERE id='editor-a'").run();
  await legacyRead('editor-a', true);
  memory.prepare("UPDATE user SET is_active=0 WHERE id='editor-a'").run();
  await legacyRead('editor-a', false);
  await legacyRead('ordinary', false);
  await legacyRead(null, false);
  memory.exec('ROLLBACK');
  applyOwnerOffline();
  queries = [];

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
  assert.equal(first.isPublic, true);
  assert.equal(Object.keys(first).sort().join(), 'categoryIds,content,createdAt,id,isActive,isPublic,isPublished,revision,slug,sortOrder,summary,title,updatedAt');
  assert(queries.some(entry => entry.sql.includes('from "user"') && entry.sql.includes('for share')));
  assert.equal(allRows()[0].created_by, 'editor-a');
  assert.equal(allRows()[0].user_id, 'editor-a');
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
  assert.equal(allRows()[0].user_id, 'editor-a', 'A different Super Admin editing the Guide does not change ownership');
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
  let privateGuide = await service.create('editor-a', { ...draft, title: 'Private published Guide', slug: 'private-published', isPublished: true, isPublic: false });
  assert.equal((await publicGet(privateGuide.slug)).status, 404);
  assert.equal((await service.publicList(publicQuery('search=Private%20published'))).pagination.total, 0);
  const privateUnpublished = await service.create('editor-b', { ...draft, title: 'Other private inactive draft', slug: 'other-private-draft', isActive: false, isPublic: false });
  const checkReader = async (userId, visibleSlugs) => {
    session = userId ? { user: { id: userId, role: 'super_admin' } } : null;
    const listResponse = await publicList.GET(request('GET', 'search=private'));
    assert.equal(listResponse.status, 200);
    assert.match(listResponse.headers.get('cache-control'), /private.*no-store/);
    const list = await listResponse.json();
    assert.equal(list.pagination.total, visibleSlugs.length);
    assert.deepEqual(list.data.map(guide => guide.slug), visibleSlugs);
    for (const slug of [privateGuide.slug, privateUnpublished.slug]) {
      const detailResponse = await publicGet(slug);
      assert.equal(detailResponse.status, visibleSlugs.includes(slug) ? 200 : 404);
      if (visibleSlugs.includes(slug)) {
        assert.match(detailResponse.headers.get('cache-control'), /private.*no-store/);
        assert.equal(Object.keys((await detailResponse.json()).data).sort().join(), 'content,slug,summary,title,updatedAt');
      }
    }
  };
  await checkReader('editor-b', [privateGuide.slug, privateUnpublished.slug]);
  await checkReader('ordinary', []);
  await checkReader('missing-account', []);
  const changeOwnerState = memory.prepare('UPDATE user SET role=?,is_active=?,is_deleted=? WHERE id=\'editor-a\'');
  changeOwnerState.run('user', 1, 0);
  await checkReader('editor-a', [privateGuide.slug]);
  const setStoredOwner = memory.prepare('UPDATE learn_guides SET user_id=? WHERE id=?');
  setStoredOwner.run('editor-b', privateGuide.id);
  await checkReader('editor-a', []);
  setStoredOwner.run('editor-a', privateGuide.id);
  changeOwnerState.run('user', 0, 0);
  await checkReader('editor-a', []);
  changeOwnerState.run('user', 1, 1);
  await checkReader('editor-a', []);
  changeOwnerState.run('super_admin', 1, 0);
  await checkReader(null, []);
  await service.remove('editor-b', privateUnpublished.id, privateUnpublished.revision);
  privateGuide = await service.update('editor-a', { ...fields(privateGuide), id: privateGuide.id, revision: privateGuide.revision, isPublic: undefined, summary: 'Older editorial client' });
  assert.equal(privateGuide.isPublic, false, 'Omitting Public on an older edit preserves the saved flag');
  const shown = await service.update('editor-a', { ...fields(privateGuide), id: privateGuide.id, revision: privateGuide.revision, isPublic: true });
  assert.equal((await publicGet(shown.slug)).status, 200);
  assert.equal((await service.publicList(publicQuery('search=Private%20published'))).pagination.total, 1);
  await service.remove('editor-a', shown.id, shown.revision);
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

  session = null;
  assert.equal((await categories.GET(request())).status, 401);
  session = { user: { id: 'ordinary', role: 'super_admin' } };
  assert.equal((await categories.GET(request())).status, 403);
  assert.equal((await categories.POST(request('POST', '', { name: 'Denied', slug: 'denied' }))).status, 403);
  session = { user: { id: 'editor-a' } };
  assert.equal((await categories.POST(request('POST', '', {}, 'https://foreign.test'))).status, 403);
  response = await categories.POST(request('POST', '', { name: 'Setup', slug: 'setup' }));
  assert.equal(response.status, 201);
  const parent = (await response.json()).data;
  let child = await categoryService.create('editor-b', { name: 'Projects', slug: 'projects', parentId: parent.id });
  let grandchild = await categoryService.create('editor-a', { name: 'Design', slug: 'design', parentId: child.id });
  assert.equal((await (await categories.GET(request())).json()).data.length, 3);
  assert(queries.some(entry => entry.sql.includes('pg_advisory_xact_lock')));
  assert.equal((await categories.POST(request('POST', '', { name: 'Duplicate', slug: parent.slug }))).status, 409);
  await assert.rejects(() => categoryService.create('editor-a', { name: 'Missing', slug: 'missing', parentId: 500 }), statusError(400));
  await assert.rejects(() => categoryService.update('editor-b', { ...parent, parentId: parent.id }), statusError(400));
  await assert.rejects(() => categoryService.update('editor-b', { ...parent, parentId: grandchild.id }), statusError(400));
  await assert.rejects(() => categoryService.remove('editor-a', parent.id, parent.revision), statusError(409));
  grandchild = await categoryService.update('editor-b', { ...grandchild, parentId: parent.id });
  assert.equal(grandchild.parentId, parent.id);
  const oldChildRevision = child.revision;
  response = await categories.PUT(request('PUT', '', { ...child, name: 'Project Setup', sortOrder: -1 }));
  assert.equal(response.status, 200); child = (await response.json()).data;
  assert.equal(child.name, 'Project Setup');
  await assert.rejects(() => categoryService.update('editor-a', { ...child, revision: oldChildRevision }), statusError(409));

  response = await editorial.POST(request('POST', '', { ...draft, slug: 'categorized', categoryIds: [child.id, parent.id] }));
  assert.equal(response.status, 201);
  let categorized = (await response.json()).data;
  assert.equal(categorized.isPublished, false);
  assert.deepEqual(categorized.categoryIds, [parent.id, child.id]);
  const readCategorized = async () => (await (await editorial.GET(request('GET', `id=${categorized.id}`))).json()).data;
  const editCategorized = (changes = {}) => editorial.PUT(request('PUT', '', { ...fields(categorized), id: categorized.id, revision: categorized.revision, ...changes }));
  assert.deepEqual((await readCategorized()).categoryIds, [parent.id, child.id]);
  assert.equal((await editCategorized({ categoryIds: [child.id, child.id] })).status, 400);
  assert.equal((await editCategorized({ categoryIds: [99999] })).status, 400);
  child = await categoryService.update('editor-a', { ...child, isActive: false });
  assert.equal((await editorial.POST(request('POST', '', { ...draft, slug: 'inactive-assignment', categoryIds: [child.id] }))).status, 400);
  assert(!allRows().some(row => row.slug === 'inactive-assignment'));
  response = await editCategorized({ categoryIds: [parent.id, child.id, grandchild.id] });
  assert.equal(response.status, 200); categorized = (await response.json()).data;
  assert.deepEqual(categorized.categoryIds, [parent.id, child.id, grandchild.id]);
  response = await editCategorized({ categoryIds: undefined, summary: 'Older client edit' });
  assert.equal(response.status, 200); categorized = (await response.json()).data;
  assert.deepEqual(categorized.categoryIds, [parent.id, child.id, grandchild.id]);

  const extra = await categoryService.create('editor-a', { name: 'Examples', slug: 'examples' });
  failAssignmentWrite = true;
  assert.equal((await editCategorized({ categoryIds: [extra.id], title: 'Uncommitted' })).status, 503);
  failAssignmentWrite = false;
  assert.deepEqual(await readCategorized(), categorized, 'the Guide and existing links roll back together after an assignment write fails');
  response = await categories.DELETE(request('DELETE', `id=${child.id}&revision=${child.revision}`));
  assert.equal(response.status, 200);
  categorized = await readCategorized();
  assert.deepEqual(categorized.categoryIds, [parent.id, grandchild.id]);
  response = await editCategorized({ categoryIds: [] });
  assert.equal(response.status, 200); categorized = (await response.json()).data;
  assert.deepEqual(categorized.categoryIds, []);
  response = await editCategorized({ categoryIds: [extra.id] });
  assert.equal(response.status, 200); categorized = (await response.json()).data;
  await service.remove('editor-a', categorized.id, categorized.revision);
  assert.equal(memory.prepare('SELECT count(*) AS total FROM learn_guide_category_assignments').get().total, 0);
  assert((await categoryService.list('editor-a')).some(category => category.id === extra.id));
  const lateCategory = await categoryService.create('editor-a', { name: 'zoning', slug: 'zoning' });
  const firstByCategory = await service.create('editor-a', { ...draft, slug: 'first-category-sort', categoryIds: [lateCategory.id, extra.id] });
  const lastByCategory = await service.create('editor-a', { ...draft, slug: 'last-category-sort', categoryIds: [parent.id] });
  await categoryService.update('editor-a', { ...extra, isActive: false });
  const categoryPage = (direction, offset = 0) => service.list('editor-a', query(`sort=categories&direction=${direction}&limit=1&offset=${offset}`));
  const firstPage = await categoryPage('asc');
  assert.equal(firstPage.data[0].id, firstByCategory.id, 'First Category name orders Guides before pagination');
  assert.deepEqual(plain(firstPage.data[0].categories), [{ id: extra.id, name: 'Examples', isActive: false }, { id: lateCategory.id, name: 'zoning', isActive: true }]);
  assert.equal((await categoryPage('asc', 1)).data[0].id, lastByCategory.id);
  assert.equal((await categoryPage('desc')).data[0].id, lastByCategory.id);
  assert.equal((await categoryPage('desc', 1)).data[0].id, firstByCategory.id);
  assert.equal((await categoryPage('asc', 2)).data[0].categories.length, 0);
  assert.equal((await categoryPage('desc', 2)).data[0].categories.length, 0, 'Guides with no assigned Categories sort last in either direction');
  console.log('PASS Learn backend: Guide visibility migration and public access, Category sorting across pages, revisions, assignments, cascades and atomic rollback (offline persistence).');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => memory.close());
