// Executes the Tasks handlers and Drizzle read policy against offline SQLite.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const orm = require('drizzle-orm');
const pg = require('drizzle-orm/pg-core');
const { drizzle } = require('drizzle-orm/pg-proxy');
const { DatabaseSync } = require('node:sqlite');

function load(file, modules, consoleOverride = console) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, { exports, console: consoleOverride, URL, require(name) {
    assert(Object.hasOwn(modules, name), name);
    return modules[name];
  } });
  return exports;
}

const user = pg.pgTable('user', { id: pg.text('id').primaryKey() });
const project = pg.pgTable('project', {
  id: pg.serial('id').primaryKey(),
  userId: pg.text('user_id'),
  isPublic: pg.boolean('is_public'),
});
const projectAssets = pg.pgTable('project_assets', {
  projectId: pg.integer('project_id'),
  userId: pg.text('user_id'),
  assetId: pg.integer('asset_id'),
  assetType: pg.text('asset_type'),
  moduleType: pg.text('module_type'),
  isActive: pg.boolean('is_active'),
  config: pg.jsonb('config'),
  createdAt: pg.timestamp('created_at'),
});
const schema = load('src/libraries/schema/threed/index.ts', {
  'drizzle-orm': orm, 'drizzle-orm/pg-core': pg, '../auth': { user }, '../project': { project },
});
assert.equal(schema.threedTasks.isPublic.name, 'is_public');
assert.equal(schema.threedTasks.isPublic.notNull, true);
assert.equal(schema.threedTasks.isPublic.default, false);
const migration = fs.readFileSync('docs/developers/sql/threed-tasks-visibility.sql', 'utf8')
  .replace(/^--.*$/gm, '').trim();
assert.match(migration, /^BEGIN;\s*SET LOCAL lock_timeout = '5s';\s*ALTER TABLE "public"\."threed_tasks" ADD COLUMN "is_public" boolean DEFAULT true NOT NULL;\s*ALTER TABLE "public"\."threed_tasks" ALTER COLUMN "is_public" SET DEFAULT false;\s*COMMIT;$/);

const db = new DatabaseSync(':memory:');
db.exec(`
  CREATE TABLE threed_tasks (
    id INTEGER PRIMARY KEY, user_id TEXT, task_id TEXT NOT NULL UNIQUE, title TEXT NOT NULL,
    description TEXT, type TEXT, priority TEXT, status TEXT, is_active INTEGER,
    due_date TEXT, completed_at TEXT, planting_id INTEGER,
    plant_id INTEGER, bed_id INTEGER, watering_schedule_id INTEGER, assigned_to TEXT, notes TEXT,
    created_at TEXT, updated_at TEXT
  );
  CREATE TABLE project (id INTEGER PRIMARY KEY, user_id TEXT, is_public INTEGER);
  CREATE TABLE project_assets (
    project_id INTEGER, user_id TEXT, asset_id INTEGER, asset_type TEXT, module_type TEXT,
    is_active INTEGER, config TEXT, created_at TEXT
  );
  INSERT INTO project VALUES (5, 'owner', 1);
  INSERT INTO project_assets VALUES (5, 'owner', 100, 'threed_models', 'threed', 1, NULL, NULL);
`);
db.function('NOW', () => '2026-11-19T00:00:00.000Z');
const connection = drizzle(async (sql, params) => {
  const query = sql.replace(/\bdefault\b/g, 'NULL').replace(/\bilike\b/gi, 'like');
  let statement;
  try {
    statement = db.prepare(query);
  } catch (error) {
    if (/no such column: (?:"?threed_tasks"?\.)?"?is_public"?|table threed_tasks has no column named is_public/.test(error.message)) {
      throw Object.assign(new Error('column threed_tasks.is_public does not exist'), { code: '42703' });
    }
    throw error;
  }
  statement.setReturnArrays(true);
  const bindings = Object.fromEntries(params.map((value, index) => [`$${index + 1}`, typeof value === 'boolean' ? Number(value) : value]));
  const columnNames = statement.columns().map(column => column.name);
  return {
    rows: statement.all(bindings).map(row => row.map((value, index) =>
      ['is_active', 'is_public'].includes(columnNames[index]) && value !== null ? Boolean(value) : value)),
  };
});
let viewer;
const messages = [];
const testConsole = {
  log: (...values) => messages.push(values),
  error: (...values) => messages.push(values),
  warn: (...values) => messages.push(values),
};
const privacy = load('src/libraries/services/threed/tasks/read-scope.ts', {
  'drizzle-orm': orm, '@/libraries/schema/threed': schema,
}, testConsole);
const modules = {
  'drizzle-orm': orm,
  'next/server': { NextResponse: { json: Response.json.bind(Response) } },
  '@/libraries/schema/threed': schema,
  '@/libraries/schema/project': {
    project, projectAssets, assetTypeEnum: { enumValues: ['threed_tasks', 'threed_models'] },
  },
  '@/libraries/auth': { auth: async () => viewer ? { user: { id: viewer } } : null },
  '@/libraries/db/client': { db: connection },
  '@/libraries/db/sequence': { ensureTableSequence: async () => {} },
  '@/libraries/db/connection-diagnostics': { databaseConnectionDiagnostic: error => ({ code: error.code }) },
  '@/libraries/services/threed/tasks/read-scope': privacy,
};
const tasks = load('src/app/api/threed/tasks/route.ts', modules, testConsole);
const stats = load('src/app/api/threed/tasks/stats/route.ts', modules, testConsole);
const assetType = load('src/app/api/map/asset-type/route.ts', modules, testConsole);
const mapCheck = load('src/app/api/map/check/route.ts', modules, testConsole);
const assignedTasks = new Request('https://example.test/api/map/asset-type?projectId=5&assetType=threed_tasks');
const checkProject = new Request('https://example.test/api/map/check?projectId=5');
const assignTask = db.prepare("INSERT INTO project_assets VALUES (5, 'owner', ?, 'threed_tasks', 'threed', 1, NULL, NULL)");
const url = 'https://example.test/api/threed/tasks';
const request = (suffix = '', body) => new Request(url + suffix, body === undefined ? undefined : {
  method: suffix ? 'PUT' : 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});
const content = { title: 'Synthetic confidential Task', description: 'Synthetic confidential description', type: 'internal', taskId: 'fixture-private-stable' };

async function run() {
  db.exec("INSERT INTO threed_tasks (id, user_id, task_id, title, status) VALUES (7, 'owner', 'legacy-task', 'Existing Task', 'pending')");
  assignTask.run(7);
  for (viewer of [undefined, 'visitor', 'owner']) {
    const isOwner = viewer === 'owner';
    const list = await (await tasks.GET(request())).json();
    assert.equal(Number(list.pagination.total), isOwner ? 1 : 0);
    assert.equal((await tasks.GET(request('?id=7'))).status, isOwner ? 200 : 404);
    assert.equal((await (await stats.GET()).json()).data.total, isOwner ? 1 : 0);
    const check = await mapCheck.GET(checkProject);
    assert.equal(check.status, 200);
    assert.equal((await check.json()).data.totalAssets, isOwner ? 2 : 1);
    const assets = await assetType.GET(assignedTasks);
    assert.equal(assets.status, viewer === 'visitor' ? 404 : 200);
    if (assets.ok) assert.equal((await assets.json()).data.count, isOwner ? 1 : 0);
    if (isOwner) assert.equal(list.data[0].isPublic, null);
  }
  const blockedWrite = await tasks.POST(request('', { ...content, isPublic: false }));
  assert.equal(blockedWrite.status, 503);
  assert.match((await blockedWrite.json()).error, /Task visibility needs the database migration/);
  assert.equal((await tasks.PUT(request('?id=7', { isPublic: false }))).status, 503);
  assert.equal(db.prepare('SELECT count(*) AS count FROM threed_tasks').get().count, 1);
  db.exec('ALTER TABLE threed_tasks ADD COLUMN is_public boolean DEFAULT true NOT NULL');
  assert.equal((await (await tasks.GET(request('?id=7'))).json()).data.isPublic, true);
  db.exec('DELETE FROM threed_tasks');
  db.exec("DELETE FROM project_assets WHERE asset_type = 'threed_tasks'");

  viewer = undefined;
  assert.equal((await tasks.POST(request('', content))).status, 401);
  viewer = 'owner';
  assert.equal((await tasks.POST(request('', { ...content, isPublic: 'false' }))).status, 400);
  const privateTask = (await (await tasks.POST(request('', content))).json()).data;
  assert.equal(privateTask.userId, 'owner');
  assert.equal(privateTask.status, 'pending');
  assert.equal(privateTask.isPublic, false);
  assert.equal(privateTask.dueDate, null);
  assert.equal(privateTask.assignedTo, null);
  const duplicate = await tasks.POST(request('', content));
  assert.equal(duplicate.status, 500);
  assert(!JSON.stringify(await duplicate.json()).includes(content.taskId));
  const publicTask = (await (await tasks.POST(request('', { title: 'Shared Task', taskId: 'fixture-public', isPublic: true }))).json()).data;
  const completedTask = (await (await tasks.POST(request('', { title: 'Completed Task', taskId: 'fixture-completed', isPublic: true, status: 'completed' }))).json()).data;
  assignTask.run(privateTask.id);
  assignTask.run(publicTask.id);
  for (viewer of [undefined, 'visitor', 'owner']) {
    const isOwner = viewer === 'owner';
    const response = await tasks.GET(request('?status=pending'));
    assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
    const list = await response.json();
    assert.equal(Number(list.pagination.total), isOwner ? 2 : 1);
    assert(list.data.some(task => task.id === publicTask.id));
    assert.equal(list.data.some(task => task.id === privateTask.id), isOwner);
    assert.equal((await tasks.GET(request(`?id=${privateTask.id}`))).status, isOwner ? 200 : 404);
    assert.equal((await tasks.GET(request(`?id=${publicTask.id}`))).status, 200);
    assert.equal((await tasks.GET(request(`?id=${completedTask.id}`))).status, isOwner ? 200 : 404);
    const aggregate = await stats.GET();
    assert.equal(aggregate.headers.get('Cache-Control'), 'private, no-store');
    const counts = (await aggregate.json()).data;
    assert.equal(counts.total, isOwner ? 3 : 2);
    assert.equal(counts.pending, isOwner ? 2 : 1);
    assert.equal(counts.completed, 1);
    assert.equal(counts.byType.some(group => group.type === 'internal'), isOwner);
    const check = await mapCheck.GET(checkProject);
    assert.equal(check.headers.get('Cache-Control'), 'private, no-store');
    const projectCounts = (await check.json()).data;
    assert.equal(projectCounts.totalAssets, isOwner ? 3 : 2);
    assert.equal(projectCounts.threedCount, isOwner ? 3 : 2);
    const assets = await assetType.GET(assignedTasks);
    assert.equal(assets.status, viewer === 'visitor' ? 404 : 200);
    if (assets.ok) {
      assert.equal(assets.headers.get('Cache-Control'), 'private, no-store');
      const assignments = (await assets.json()).data.assets;
      assert.equal(assignments.some(asset => asset.assetId === privateTask.id), isOwner);
      assert(assignments.some(asset => asset.assetId === publicTask.id));
    }
  }
  const endpoint = `?id=${privateTask.id}`;
  viewer = 'visitor';
  assert.equal((await tasks.PUT(request(endpoint, { isPublic: true }))).status, 404);
  viewer = 'owner';
  assert.equal((await tasks.PUT(request(endpoint, { isPublic: null }))).status, 400);
  const update = await tasks.PUT(request(endpoint, { notes: 'Synthetic sensitive notes' }));
  assert.equal((await update.json()).data.isPublic, false);
  const publish = await tasks.PUT(request(endpoint, { isPublic: true }));
  assert.equal((await publish.json()).data.isPublic, true);
  viewer = undefined;
  assert.equal((await tasks.GET(request(endpoint))).status, 200);
  viewer = 'owner';
  const makePrivate = await tasks.PUT(request(endpoint, { isPublic: false }));
  assert.equal((await makePrivate.json()).data.isPublic, false);
  viewer = 'visitor';
  assert.equal((await tasks.GET(request(endpoint))).status, 404);
  assert(!JSON.stringify(messages).includes('Synthetic'));
  assert.equal(db.prepare('SELECT count(*) AS count FROM threed_tasks').get().count, 3);
  console.log('PASS Task privacy: private-by-default pending creation, owner and visitor reads, stats, explicit sharing and revocation, duplicate-key protection and sanitized failures.');
}
run().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => db.close());
