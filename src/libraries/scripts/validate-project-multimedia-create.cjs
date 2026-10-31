// Execute the real creation/assignment routes and Project callback with mocked persistence.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const orm = require('drizzle-orm');
const pg = require('drizzle-orm/pg-core');

const multimedia = pg.pgTable('multimedia', {
  id: pg.integer('id'),
  userId: pg.text('user_id'),
});
const project = pg.pgTable('project', {
  id: pg.integer('id'),
  userId: pg.text('user_id'),
});
const projectMultimedia = pg.pgTable('project_multimedia', {
  projectId: pg.integer('project_id'),
  multimediaId: pg.integer('multimedia_id'),
});
const dialect = new pg.PgDialect();
let userId = 'owner';
let failCreate = false;
const modules = [];
const assignments = [];
const slugs = new Set(['multimedia-module']); // A previously used name must not block creation.
const db = {
  select() {
    let table;
    let params;
    const query = {
      from(value) { table = value; return query; },
      where(condition) { params = dialect.sqlToQuery(condition).params; return query; },
      limit() { return query; },
      then(resolve, reject) {
        const rows = table === project ? params[0] === 15 && params[1] === 'owner' ? [{ id: 15 }] : []
          : table === multimedia ? modules.filter(row => row.id === params[0] && row.userId === params[1])
          : table === projectMultimedia ? assignments.filter(row => row.projectId === params[0] && row.multimediaId === params[1]) : [];
        return Promise.resolve(rows).then(resolve, reject);
      },
    };
    return query;
  },
  insert(table) {
    return { values(value) { return { async returning() {
      if (table === multimedia) {
        if (failCreate) throw Error('Mock storage failure');
        if (slugs.has(value.slug)) throw Object.assign(Error('Duplicate slug'), { code: '23505' });
        slugs.add(value.slug);
        const row = { id: modules.length + 1, ...value };
        modules.push(row);
        return [row];
      }
      assert.equal(table, projectMultimedia);
      assignments.push(value);
      return [value];
    } }; } };
  },
};
function load(file) {
  const exports = {};
  const dependencies = {
    'next/server': { NextResponse: { json: (body, options = {}) => ({ status: options.status ?? 200, body }) } },
    '@/libraries/auth': { auth: async () => userId ? { user: { id: userId } } : null },
    '@/libraries/db/client': { db },
    '@/libraries/schema/multimedia': { multimedia },
    '@/libraries/schema/project': { project, projectMultimedia },
    '@/libraries/schema/threed': {},
    '@/libraries/schema/traffic': {},
    'drizzle-orm': orm,
    'node:crypto': require('node:crypto'),
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    exports,
    URL,
    console: { error() {} },
    require(name) { assert(name in dependencies, 'Unmocked dependency: ' + name); return dependencies[name]; },
  });
  return exports;
}
const create = load('src/app/api/multimedia/route.ts').POST;
const assign = load('src/app/api/project/modules/route.ts').POST;
const request = (body, projectId = 15) => ({ url: `https://fixture.invalid/api/project/modules?projectId=${projectId}`, json: async () => body });

(async () => {
  const name = 'Multimedia Module';
  for (let i = 0; i < 2; i++) {
    const result = await create(request({ name }));
    assert.equal(result.status, 200, 'Repeated module names must create separate identities');
    assert.equal(result.body.data.name, name);
    assert.notEqual(result.body.data.slug, 'multimedia-module');
    assert.equal(result.body.data.userId, 'owner');
    assert.equal(result.body.data.isPublic, false);
    const added = await assign(request({ type: 'multimedia', moduleId: result.body.data.id }));
    assert.equal(added.status, 200);
    assert.equal(added.body.data.userId, 'owner');
    assert.equal(added.body.data.projectId, 15);
  }
  assert.notEqual(modules[0].slug, modules[1].slug);
  assert.equal((await assign(request({ type: 'multimedia', moduleId: 1 }))).status, 409);
  assert.equal((await assign(request({ type: 'multimedia', moduleId: 1 }, 99))).status, 404);
  userId = 'other-owner';
  const other = await create(request({ name }));
  assert.equal(other.status, 200, 'Another owner can reuse the display name');
  userId = 'owner';
  assert.equal((await assign(request({ type: 'multimedia', moduleId: other.body.data.id }))).status, 404);
  const before = modules.length;
  for (const invalid of [undefined, '', '   ', 123, {}]) assert.equal((await create(request({ name: invalid }))).status, 400);
  userId = null;
  assert.equal((await create(request({ name }))).status, 401);
  assert.equal((await assign(request({ type: 'multimedia', moduleId: 1 }))).status, 401);
  assert.equal(modules.length, before, 'Rejected writes never reach persistence');
  userId = 'owner';

  // The actual Project form must create the Multimedia record, then attach its returned ID.
  const file = 'src/app/admin/projects/[id]/page.tsx';
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let callback;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'createModule') callback = node.initializer.getText(source);
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert(callback);
  const notices = [];
  let closed = false;
  let refreshes = 0;
  let submitting = false;
  let draft = { type: 'multimedia', name, description: 'Project audio' };
  const urls = [];
  const run = vm.runInNewContext(ts.transpileModule('(' + callback + ')', {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText, {
    session: { user: { id: 'owner' } },
    projectId: 15,
    newModuleData: draft,
    moduleConfig: { multimedia: { label: 'Multimedia' } },
    setIsSubmitting: value => { submitting = value; },
    setShowNewModuleDialog: value => { closed = !value; },
    setNewModuleData: value => { draft = value; },
    showToast: message => notices.push(message),
    fetchProject: async () => { refreshes++; },
    console: { error() {} },
    fetch: async (url, init) => {
      urls.push(url);
      const result = await (url === '/api/multimedia' ? create : assign)(request(JSON.parse(init.body)));
      return { ok: result.status < 400, json: async () => result.body };
    },
  });
  await run();
  assert.deepEqual(urls, ['/api/multimedia', '/api/project/modules?projectId=15']);
  assert.equal(assignments.at(-1).multimediaId, modules.at(-1).id);
  assert(closed);
  assert.equal(refreshes, 1);
  assert.equal(submitting, false);
  assert.equal(draft.name, '');
  failCreate = true;
  closed = false;
  urls.length = 0;
  await run();
  assert.deepEqual(urls, ['/api/multimedia'], 'Failed creation must never attempt assignment');
  assert.equal(closed, false);
  assert.equal(submitting, false);
  assert.equal(notices.at(-1), 'Failed to create Multimedia module');
  console.log('PASS Multimedia Module creation: repeated/global names, unique slugs, invalid/auth/ownership/duplicate assignment guards and actual Project create/attach callback (mock DB/HTTP; no live writes).');
})().catch(error => { console.error(error); process.exitCode = 1; });
